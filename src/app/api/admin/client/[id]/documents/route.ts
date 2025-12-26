import { validateAdminRequest } from '@/lib/auth-utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/client/[id]/documents
 * Get all documents for a client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateAdminRequest(request);
    if (!auth.isValid) {
      return auth.errorResponse!;
    }

    const { id: clientId } = await params;

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // First get the KYC record for this client
    const { data: kycRecord, error: kycError } = await supabase
      .from('kyc_records')
      .select('id')
      .eq('userId', clientId)
      .single();

    if (kycError || !kycRecord) {
      return NextResponse.json({
        success: true,
        documents: [],
        count: 0,
        message: 'No KYC record found for this client',
      });
    }

    // Get all documents for this KYC record
    const { data: documents, error: docsError } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('kycRecordId', kycRecord.id)
      .order('uploadedAt', { ascending: false });

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    // Format documents for frontend
    const formattedDocuments = (documents || []).map(doc => ({
      id: doc.id,
      type: doc.documentType,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt,
      status: doc.status || 'pending',
      verifiedAt: doc.verifiedAt,
      verifiedBy: doc.verifiedBy,
    }));

    return NextResponse.json({
      success: true,
      documents: formattedDocuments,
      count: formattedDocuments.length,
      kycRecordId: kycRecord.id,
    });
  } catch (error: any) {
    console.error('[Client Documents API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/client/[id]/documents
 * Add a new document to a client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateAdminRequest(request);
    if (!auth.isValid) {
      return auth.errorResponse!;
    }

    const { id: clientId } = await params;
    const body = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const { type, fileName, fileUrl, fileSize, mimeType } = body;

    if (!type || !fileName || !fileUrl) {
      return NextResponse.json(
        { success: false, error: 'Document type, fileName, and fileUrl are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get or create KYC record
    let { data: kycRecord, error: kycError } = await supabase
      .from('kyc_records')
      .select('id')
      .eq('userId', clientId)
      .single();

    if (!kycRecord) {
      // Create KYC record if it doesn't exist
      const { data: newKyc, error: createError } = await supabase
        .from('kyc_records')
        .insert({
          userId: clientId,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (createError) {
        throw new Error('Failed to create KYC record');
      }
      kycRecord = newKyc;
    }

    // Insert the document
    const { data: document, error: docError } = await supabase
      .from('kyc_documents')
      .insert({
        kycRecordId: kycRecord.id,
        documentType: type,
        fileName,
        fileUrl,
        fileSize: fileSize || 0,
        mimeType: mimeType || 'application/octet-stream',
        uploadedAt: new Date().toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (docError) {
      console.error('Error creating document:', docError);
      return NextResponse.json(
        { success: false, error: 'Failed to create document' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from('audit_log').insert({
      adminId: auth.admin.id,
      action: 'document_uploaded',
      entityType: 'client',
      entityId: clientId,
      newValues: {
        documentId: document.id,
        documentType: type,
        fileName,
      },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        type: document.documentType,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        uploadedAt: document.uploadedAt,
        status: document.status,
      },
    });
  } catch (error: any) {
    console.error('[Client Documents API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/client/[id]/documents
 * Delete a document (requires documentId in body)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateAdminRequest(request);
    if (!auth.isValid) {
      return auth.errorResponse!;
    }

    const { id: clientId } = await params;
    const { documentId } = await request.json();

    if (!clientId || !documentId) {
      return NextResponse.json(
        { success: false, error: 'Client ID and document ID are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify the document belongs to this client's KYC record
    const { data: document, error: fetchError } = await supabase
      .from('kyc_documents')
      .select('*, kyc_records!inner(userId)')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete the document
    const { error: deleteError } = await supabase
      .from('kyc_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Error deleting document:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from('audit_log').insert({
      adminId: auth.admin.id,
      action: 'document_deleted',
      entityType: 'client',
      entityId: clientId,
      oldValues: {
        documentId,
        documentType: document.documentType,
        fileName: document.fileName,
      },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error: any) {
    console.error('[Client Documents API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
