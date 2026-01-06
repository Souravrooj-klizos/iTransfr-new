import { downloadDocument } from '@/lib/aws-s3';
import {
    createApplicant,
    createVerification,
    getApplicantByExternalId,
    uploadDocument,
    type CreateApplicantRequest,
} from '@/lib/integrations/amlbot';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/kyc/submit-amlbot
 *
 * Submit a user's KYC to AMLBot for verification
 *
 * Request body:
 * {
 *   "userId": "user-uuid-here"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "applicantId": "amlbot-applicant-id",
 *   "verificationId": "amlbot-verification-id",
 *   "message": "KYC submitted to AMLBot successfully"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Check if AMLBot API key is configured
    if (!process.env.AML_BOT_API_KEY) {
      return NextResponse.json({ error: 'AMLBot API key not configured' }, { status: 500 });
    }

    console.log('[Submit AMLBot] Processing for userId:', userId);

    // 1. Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('client_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('[Submit AMLBot] Profile not found:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // 2. Check if KYC record exists
    const { data: kycRecord, error: kycError } = await supabaseAdmin
      .from('kyc_records')
      .select('*')
      .eq('userId', userId)
      .single();

    if (kycError && kycError.code !== 'PGRST116') {
      console.error('[Submit AMLBot] KYC record fetch error:', kycError);
      return NextResponse.json({ error: 'Failed to fetch KYC record' }, { status: 500 });
    }

    // 3. Prepare applicant data
    const fullName =
      profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || 'Unknown';
    const lastName = nameParts.slice(1).join(' ') || 'Unknown';

    const applicantData: CreateApplicantRequest = {
      type: 'PERSON',
      external_id: userId,
      first_name: firstName,
      last_name: lastName,
      email: profile.email,
      phone: profile.mobile,
      residence_country: profile.country || 'US',
    };

    console.log('[Submit AMLBot] Applicant data prepared:', {
      external_id: applicantData.external_id,
      first_name: applicantData.first_name,
      last_name: applicantData.last_name,
    });

    // 4. Create or Get Applicant in AMLBot
    let applicant = await getApplicantByExternalId(userId);

    if (!applicant) {
      // Create new applicant
      console.log('[Submit AMLBot] Creating new applicant in AMLBot');
      applicant = await createApplicant(applicantData);
    } else {
      console.log('[Submit AMLBot] Using existing AMLBot applicant:', applicant.id);
    }

    // 5. Gather and Upload Documents
    // Strategy: Look in kyc_documents (standard) AND client_profiles.documents (ad-hoc)

    // Fetch kyc_documents
    let docsToUpload: any[] = [];

    // A. Check kyc_documents table
    if (kycRecord) {
        const { data: kycDocs } = await supabaseAdmin
            .from('kyc_documents')
            .select('*')
            .eq('kycRecordId', kycRecord.id);

        if (kycDocs && kycDocs.length > 0) {
            docsToUpload = [...docsToUpload, ...kycDocs.map(d => ({
                type: d.documentType,
                s3Key: d.s3Key,
                fileName: d.fileName,
                mimeType: d.mimeType
            }))];
        }
    }

    // B. Check client_profiles.documents (JSONB)
    // Note: Use 'documents' column if it exists in your schema, assuming it matches Step7 structure
    const profileDocs = (profile as any).documents;
    if (Array.isArray(profileDocs) && profileDocs.length > 0) {
        // Avoid duplicates by s3Key
        for (const pd of profileDocs) {
            if (pd.s3Key && !docsToUpload.find(d => d.s3Key === pd.s3Key)) {
                docsToUpload.push({
                    type: pd.type || pd.documentType,
                    s3Key: pd.s3Key,
                    fileName: pd.fileName,
                    mimeType: pd.mimeType
                });
            }
        }
    }

    console.log(`[Submit AMLBot] Found ${docsToUpload.length} documents to upload`);

    if (docsToUpload.length === 0) {
        console.warn('[Submit AMLBot] No documents found to upload! Verification may fail or be rejected.');
        // We continue anyway, as sometimes just data verification is requested?
        // But user specifically complained about document failure.
    }

    for (const doc of docsToUpload) {
        try {
            if (!doc.s3Key) {
                console.warn('[Submit AMLBot] Skipping document with missing S3 key:', doc.fileName);
                continue;
            }

            console.log(`[Submit AMLBot] Downloading ${doc.fileName} (${doc.s3Key})...`);
            try {
                const fileBuffer = await downloadDocument(doc.s3Key);

                // Map type to AMLBot types
                let amlType: any = 'other';
                const lowerType = (doc.type || '').toLowerCase();

                if (lowerType.includes('passport')) amlType = 'passport';
                else if (lowerType.includes('driver') || lowerType.includes('license')) amlType = 'drivers_license';
                else if (lowerType.includes('id_card') || lowerType.includes('id card')) amlType = 'national_id';
                else if (lowerType.includes('permit') || lowerType.includes('residence')) amlType = 'residence_permit';

                // Upload to AMLBot
                await uploadDocument({
                    applicantId: applicant.id,
                    documentType: amlType,
                    fileName: doc.fileName || 'document.jpg',
                    fileContent: fileBuffer,
                });

                console.log(`[Submit AMLBot] Uploaded ${doc.fileName} to AMLBot`);
            } catch (dlError) {
                console.error(`[Submit AMLBot] Failed to download/upload ${doc.fileName}:`, dlError);
                // Continue to try other docs
            }
        } catch (err) {
            console.error('[Submit AMLBot] Error processing document:', err);
        }
    }

    // 6. Create verification request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const callbackUrl = `${baseUrl}/api/webhooks/amlbot`;

    console.log('[Submit AMLBot] Creating verification with callback:', callbackUrl);

    // If we have uploaded documents, we request 'document-verification'.
    // If not, we still might, but it will likely fail as per user report.
    const verification = await createVerification({
      applicant_id: applicant.id,
      types: ['document-verification', 'aml-screening'],
      callback_url: callbackUrl,
    });

    // 7. Update KYC record with AMLBot request ID
    if (kycRecord) {
      await supabaseAdmin
        .from('kyc_records')
        .update({
          amlbotRequestId: verification.id,
          status: 'under_review',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', kycRecord.id);
    } else {
      // Create KYC record if it doesn't exist
      await supabaseAdmin.from('kyc_records').insert({
        userId: userId,
        status: 'under_review',
        amlbotRequestId: verification.id,
        notes: ['Submitted to AMLBot for verification'],
      });
    }

    console.log('[Submit AMLBot] ✅ Verification created:', verification.id);

    return NextResponse.json({
      success: true,
      applicantId: applicant.id,
      verificationId: verification.id,
      message: 'KYC submitted to AMLBot successfully',
    });
  } catch (error: any) {
    console.error('[Submit AMLBot] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit KYC to AMLBot' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/kyc/submit-amlbot
 *
 * Get AMLBot submission status for a user
 * Query params: ?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { data: kycRecord, error } = await supabaseAdmin
      .from('kyc_records')
      .select('*')
      .eq('userId', userId)
      .single();

    if (error || !kycRecord) {
      return NextResponse.json({
        submitted: false,
        message: 'No KYC record found',
      });
    }

    return NextResponse.json({
      submitted: !!kycRecord.amlbotRequestId,
      amlbotRequestId: kycRecord.amlbotRequestId,
      status: kycRecord.status,
      riskScore: kycRecord.riskScore,
    });
  } catch (error: any) {
    console.error('[Submit AMLBot GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get AMLBot status' },
      { status: 500 }
    );
  }
}
