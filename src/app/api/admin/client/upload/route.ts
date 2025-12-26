import { createClient } from '@/lib/supabase/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { NextRequest, NextResponse } from 'next/server';

const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const formData = await request.formData();

    // Validate admin session
    const sessionToken = request.cookies.get('admin_session_token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const { data: sessionData, error: sessionError } = await supabase.rpc(
      'validate_admin_session',
      { p_session_token: sessionToken }
    );

    if (sessionError || !sessionData?.valid) {
      return NextResponse.json({ error: 'Invalid admin session' }, { status: 401 });
    }

    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const sessionId = formData.get('sessionId') as string;
    const ownerId = formData.get('ownerId') as string | null;

    if (!file || !documentType || !sessionId) {
      return NextResponse.json(
        { error: 'File, document type, and session ID are required' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Only PDF and images are accepted.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;

    // Upload to S3
    const bucketName = process.env.AWS_S3_KYC_BUCKET || 'itransfr-kyc-documents';
    const s3Key = `client-documents/${sessionId}/${uniqueFilename}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        uploadedBy: sessionData.admin.id,
        documentType,
        sessionId,
        ownerId: ownerId || '',
      },
    });

    await s3Client.send(uploadCommand);

    // Generate S3 URL
    const s3Url = `https://${bucketName}.s3.${process.env.AWS_DEFAULT_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;

    // Store document metadata in session (temporary storage)
    const { data: existingSession, error: fetchError } = await supabase
      .from('onboarding_sessions')
      .select('session_data')
      .eq('id', sessionId)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const documents = existingSession.session_data?.documents || [];
    const newDocument = {
      type: documentType,
      fileName: file.name,
      fileUrl: s3Url,
      fileSize: file.size,
      mimeType: file.type,
      s3Key,
      s3Bucket: bucketName,
      ownerId,
      uploadedAt: new Date().toISOString(),
      uploadedBy: sessionData.admin.id,
    };

    documents.push(newDocument);

    const { error: updateError } = await supabase
      .from('onboarding_sessions')
      .update({
        session_data: {
          ...existingSession.session_data,
          documents,
        },
        last_updated: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to save document metadata', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document: newDocument,
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    console.error('File upload API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Delete document endpoint
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const documentIndex = searchParams.get('documentIndex');

    if (!sessionId || documentIndex === null) {
      return NextResponse.json(
        { error: 'Session ID and document index required' },
        { status: 400 }
      );
    }

    // Validate admin session
    const sessionToken = request.cookies.get('admin_session_token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 });
    }

    const { data: sessionData, error: sessionError } = await supabase.rpc(
      'validate_admin_session',
      { p_session_token: sessionToken }
    );

    if (sessionError || !sessionData?.valid) {
      return NextResponse.json({ error: 'Invalid admin session' }, { status: 401 });
    }

    // Get existing session
    const { data: existingSession, error: fetchError } = await supabase
      .from('onboarding_sessions')
      .select('session_data')
      .eq('id', sessionId)
      .single();

    if (fetchError || !existingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const documents = existingSession.session_data?.documents || [];
    const index = parseInt(documentIndex);

    if (index < 0 || index >= documents.length) {
      return NextResponse.json({ error: 'Invalid document index' }, { status: 400 });
    }

    const documentToDelete = documents[index];

    // TODO: Delete from S3 (optional - can be done asynchronously)
    // For now, we'll just remove from session

    documents.splice(index, 1);

    const { error: updateError } = await supabase
      .from('onboarding_sessions')
      .update({
        session_data: {
          ...existingSession.session_data,
          documents,
        },
        last_updated: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to delete document', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Document delete API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
