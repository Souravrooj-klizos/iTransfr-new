import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { uploadKYCDocument, fileToBuffer, validateKYCFile } from '@/lib/aws-s3';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId') as string;
    const documentType = formData.get('documentType') as 'passport' | 'address_proof' | 'photo_id';
    const file = formData.get('file') as File;

    if (!userId || !documentType || !file) {
      return NextResponse.json(
        { error: 'User ID, document type, and file are required' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateKYCFile(file);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 1. Verify user exists in client_profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('client_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile lookup error:', profileError);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // 2. Get or Create KYC Record
    let kycRecordId: string;

    const { data: existingRecord } = await supabaseAdmin
      .from('kyc_records')
      .select('id')
      .eq('userId', userId)
      .single();

    if (existingRecord) {
      kycRecordId = existingRecord.id;
    } else {
      // Create new record
      const { data: newRecord, error: createError } = await supabaseAdmin
        .from('kyc_records')
        .insert({
          userId: userId,
          status: 'pending',
        })
        .select('id')
        .single();

      if (createError || !newRecord) {
        console.error('KYC record creation error:', createError);
        return NextResponse.json({ error: 'Failed to create KYC record' }, { status: 500 });
      }
      kycRecordId = newRecord.id;
    }

    // 3. Upload to AWS S3
    const buffer = await fileToBuffer(file);
    const uploadResult = await uploadKYCDocument(
      buffer,
      userId,
      documentType,
      file.name,
      file.type
    );

    // 4. Save Document Metadata to Database
    // First delete existing document of this type if any
    await supabaseAdmin
      .from('kyc_documents')
      .delete()
      .match({ kycRecordId: kycRecordId, documentType: documentType });

    const { error: docError } = await supabaseAdmin.from('kyc_documents').insert({
      kycRecordId: kycRecordId,
      documentType: documentType,
      fileName: file.name,
      fileUrl: uploadResult.fileUrl,
      s3Bucket: uploadResult.bucket,
      s3Key: uploadResult.s3Key,
      fileSize: file.size,
      mimeType: file.type,
    });

    if (docError) {
      console.error('Document metadata save error:', docError);
      return NextResponse.json({ error: 'Failed to save document metadata' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `${documentType} uploaded successfully`,
      url: uploadResult.fileUrl,
    });
  } catch (error: any) {
    console.error('Error in upload-kyc:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload document' },
      { status: 500 }
    );
  }
}
