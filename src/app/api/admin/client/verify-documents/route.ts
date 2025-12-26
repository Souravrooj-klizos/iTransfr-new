import { validateAdminRequest } from '@/lib/auth-utils';
import {
  createApplicant,
  createDocumentVerification,
  getDocumentVerificationStatus,
  uploadDocument,
} from '@/lib/integrations/amlbot';
import { downloadDocument } from '@/lib/aws-s3';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to map our document types to AMLBot types
function mapToAMLBotDocType(docType: string): 'passport' | 'national_id' | 'drivers_license' | 'other' {
  const mapping: Record<string, 'passport' | 'national_id' | 'drivers_license' | 'other'> = {
    'passport': 'passport',
    'idDocument': 'national_id',
    'national_id': 'national_id',
    'drivers_license': 'drivers_license',
    'driversLicense': 'drivers_license',
  };

  return mapping[docType] || 'other';
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate Admin
    const auth = await validateAdminRequest(request);
    if (!auth.isValid) {
      return auth.errorResponse!;
    }

    // 2. Parse Request
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 3. Get Session Data
    const { data: session, error: sessionError } = await supabase
      .from('onboarding_sessions')
      .select('session_data')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const sessionData = session.session_data;

    // 4. Check if documents exist
    const documents = sessionData?.documents || [];
    if (documents.length === 0) {
      return NextResponse.json(
        { error: 'No documents found to verify' },
        { status: 400 }
      );
    }

    // 5. Filter identity documents for verification
    const identityDocTypes = ['passport', 'national_id', 'drivers_license', 'idDocument'];
    const identityDocs = documents.filter((doc: any) =>
      identityDocTypes.includes(doc.type)
    );

    if (identityDocs.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'No identity documents to verify',
          verificationRequired: false
        },
        { status: 200 }
      );
    }

    // 6. Get or Create AMLBot Applicant
    let applicantId = sessionData.amlbotApplicantId;

    if (!applicantId) {
      const primaryOwner = sessionData.owners?.find((o: any) => o.type === 'person');

      if (!primaryOwner) {
        return NextResponse.json(
          { error: 'No person owner found for verification' },
          { status: 400 }
        );
      }

      const applicantData = {
        type: 'PERSON' as const,
        external_id: sessionId,
        first_name: primaryOwner.firstName,
        last_name: primaryOwner.lastName,
        email: primaryOwner.email,
        phone: primaryOwner.phone,
        residence_country: primaryOwner.residentialCountry || sessionData.businessInfo?.country,
        dob: primaryOwner.dateOfBirth,
      };

      const applicant = await createApplicant(applicantData);
      applicantId = applicant.id;

      // Store applicant ID in session
      await supabase
        .from('onboarding_sessions')
        .update({
          session_data: {
            ...sessionData,
            amlbotApplicantId: applicantId,
          },
        })
        .eq('id', sessionId);
    }

    // 7. Upload Documents to AMLBot
    console.log('[Verify Documents] Uploading documents to AMLBot...');
    const uploadedDocs = [];

    for (const doc of identityDocs) {
      try {
        // Extract S3 key from the document URL or metadata
        let s3Key = doc.s3Key;

        // If s3Key not available, try to extract from fileUrl
        if (!s3Key && doc.fileUrl) {
          const urlParts = doc.fileUrl.split('.amazonaws.com/');
          if (urlParts.length > 1) {
            s3Key = decodeURIComponent(urlParts[1]);
          }
        }

        if (!s3Key) {
          console.warn(`[Verify Documents] No S3 key for document: ${doc.type}`);
          continue;
        }

        // Download from S3
        console.log(`[Verify Documents] Downloading ${doc.type} from S3: ${s3Key}`);
        const fileBuffer = await downloadDocument(s3Key);

        // Map document type to AMLBot format
        const amlbotDocType = mapToAMLBotDocType(doc.type);

        // Upload to AMLBot
        console.log(`[Verify Documents] Uploading ${doc.type} to AMLBot as ${amlbotDocType}`);
        const uploadResult = await uploadDocument({
          applicantId,
          documentType: amlbotDocType,
          fileContent: fileBuffer,
          fileName: doc.fileName || `${doc.type}.pdf`,
          country: sessionData.businessInfo?.country,
        });

        uploadedDocs.push({
          originalType: doc.type,
          amlbotDocId: uploadResult.documentId,
          status: uploadResult.status,
        });

        console.log(`[Verify Documents] Successfully uploaded document: ${uploadResult.documentId}`);
      } catch (docError) {
        console.error(`[Verify Documents] Failed to upload document ${doc.type}:`, docError);
        // Continue with other documents even if one fails
      }
    }

    if (uploadedDocs.length === 0) {
      console.warn('[Verify Documents] No documents were successfully uploaded to AMLBot');
      return NextResponse.json({
        success: false,
        error: 'Failed to upload any documents to AMLBot',
        details: 'Check server logs for more information',
      }, { status: 500 });
    }

    console.log(`[Verify Documents] Successfully uploaded ${uploadedDocs.length} documents to AMLBot`);

    // 8. Create Document Verification
    const verification = await createDocumentVerification({
      applicantId,
      types: ['DOCUMENT_VERIFICATION'],
    });

    // 9. Update Session with Verification Info
    await supabase
      .from('onboarding_sessions')
      .update({
        session_data: {
          ...sessionData,
          amlbotApplicantId: applicantId,
          documentVerification: {
            verificationId: verification.id,
            status: verification.status,
            uploadedDocuments: uploadedDocs,
            initiatedAt: new Date().toISOString(),
          },
        },
      })
      .eq('id', sessionId);

    // 10. Return Success
    return NextResponse.json({
      success: true,
      verificationId: verification.id,
      applicantId,
      status: verification.status,
      documentsUploaded: uploadedDocs.length,
      message: `Document verification initiated with ${uploadedDocs.length} documents`,
    });

  } catch (error: any) {
    console.error('Document verification error:', error);

    // Non-blocking failure - return success with warning
    return NextResponse.json({
      success: true,
      warning: 'Document verification could not be initiated',
      error: error.message,
      verificationRequired: false,
    }, { status: 200 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // 1. Validate Admin
    const auth = await validateAdminRequest(request);
    if (!auth.isValid) {
      return auth.errorResponse!;
    }

    // 2. Get Query Params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 3. Get Session Data
    const { data: session, error: sessionError } = await supabase
      .from('onboarding_sessions')
      .select('session_data')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const sessionData = session.session_data;
    const verificationInfo = sessionData?.documentVerification;

    if (!verificationInfo?.verificationId) {
      return NextResponse.json({
        success: true,
        status: 'not_initiated',
        message: 'Document verification not yet initiated',
      });
    }

    // 4. Get Verification Status from AMLBot
    try {
      const verificationStatus = await getDocumentVerificationStatus(
        verificationInfo.verificationId
      );

      return NextResponse.json({
        success: true,
        verificationId: verificationStatus.verificationId,
        status: verificationStatus.status,
        result: verificationStatus.result,
        documents: verificationStatus.documents,
        completedAt: verificationStatus.completedAt,
      });
    } catch (amlbotError: any) {
      console.error('AMLBot status check error:', amlbotError);

      // Return cached status if AMLBot unavailable
      return NextResponse.json({
        success: true,
        verificationId: verificationInfo.verificationId,
        status: verificationInfo.status || 'pending',
        message: 'Using cached status (AMLBot API unavailable)',
      });
    }

  } catch (error: any) {
    console.error('Get verification status error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
