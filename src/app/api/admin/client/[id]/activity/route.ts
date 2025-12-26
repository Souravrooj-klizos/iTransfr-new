import { validateAdminRequest } from '@/lib/auth-utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/client/[id]/activity
 * Get activity log for a client
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
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get activity logs for this client
    const { data: activities, error, count } = await supabase
      .from('audit_log')
      .select(`
        id,
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        createdAt,
        adminId
      `, { count: 'exact' })
      .eq('entityId', clientId)
      .eq('entityType', 'client')
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching activity logs:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch activity logs' },
        { status: 500 }
      );
    }

    // Format activities for frontend
    const formattedActivities = (activities || []).map((activity: any) => ({
      id: activity.id,
      user: activity.admin_users?.name || activity.admin_users?.email || 'Admin',
      action: formatAction(activity.action, activity.newValues, activity.oldValues),
      target: getActivityTarget(activity.action, activity.newValues, activity.oldValues),
      timestamp: new Date(activity.createdAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' UTC',
      createdAt: activity.createdAt,
      actionType: activity.action,
      metadata: {
        oldValues: activity.oldValues,
        newValues: activity.newValues,
      },
    }));

    return NextResponse.json({
      success: true,
      activities: formattedActivities,
      count: formattedActivities.length,
      total: count || 0,
      pagination: {
        limit,
        offset,
        hasMore: count ? offset + limit < count : false,
      },
    });
  } catch (error: any) {
    console.error('[Client Activity API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Format the action into a human-readable string
 */
function formatAction(action: string, newValues: any, oldValues: any): string {
  const actionMap: Record<string, string> = {
    'client_created': 'Created client profile',
    'client_updated': 'Updated client profile',
    'client_status_changed': 'Changed client status',
    'document_uploaded': 'Uploaded document',
    'document_deleted': 'Deleted document',
    'document_verified': 'Verified document',
    'note_added': 'Added General Note',
    'note_deleted': 'Deleted note',
    'owner_added': 'Added representative',
    'owner_updated': 'Updated representative',
    'owner_deleted': 'Removed representative',
    'kyc_submitted': 'Submitted KYC verification',
    'kyc_approved': 'Approved KYC',
    'kyc_rejected': 'Rejected KYC',
    'wallet_created': 'Created wallet',
    'transaction_created': 'Created transaction',
  };

  // Base action text
  let text = actionMap[action] || action.replace(/_/g, ' ');

  // Add context from values
  if (action === 'document_uploaded' && newValues?.documentType) {
    text = `Uploaded ${formatDocumentType(newValues.documentType)}:`;
  }
  if (action === 'note_added' && newValues?.type) {
    text = `Added ${newValues.type} Note`;
  }
  if (action === 'client_status_changed' && newValues?.status) {
    text = `Changed status to "${newValues.status}"`;
  }

  return text;
}

/**
 * Get the target object for the activity (e.g., document file name)
 */
function getActivityTarget(action: string, newValues: any, oldValues: any): { name: string; link?: string } | undefined {
  if (action === 'document_uploaded' && newValues?.fileName) {
    return {
      name: newValues.fileName,
      link: newValues.fileUrl,
    };
  }
  if (action === 'document_deleted' && oldValues?.fileName) {
    return {
      name: oldValues.fileName,
    };
  }
  return undefined;
}

/**
 * Format document type for display
 */
function formatDocumentType(type: string): string {
  const typeMap: Record<string, string> = {
    'passport': 'Passport',
    'governmentId': 'Government ID',
    'driversLicense': 'Drivers License',
    'selfie': 'Selfie',
    'bankStatement': 'Bank Statement',
    'formationDocument': 'Formation Document',
    'proofOfOwnership': 'Proof of Ownership',
    'proofOfRegistration': 'Proof of Registration',
    'taxIdVerification': 'Tax ID Verification',
  };
  return typeMap[type] || type.replace(/([A-Z])/g, ' $1').trim();
}
