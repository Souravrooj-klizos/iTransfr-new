import { validateAdminRequest } from '@/lib/auth-utils';
import { getVerification } from '@/lib/integrations/amlbot-kyc-service';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    console.log('[KYC Status API] Called with request');

    // Validate admin authentication
    const auth = await validateAdminRequest(request);
    if (!auth.isValid) {
      return auth.errorResponse!;
    }

    const { id: clientId } = await params;
    console.log('[KYC Status API] Processing client ID:', clientId);

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch KYC record for the client
    const { data: kycRecord, error: kycError } = await supabase
      .from('kyc_records')
      .select('*')
      .eq('userId', clientId)
      .single();

    if (kycError && kycError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error fetching KYC record:', kycError);
      return NextResponse.json({ error: 'Failed to fetch KYC status' }, { status: 500 });
    }

    let realTimeStatus = kycRecord?.status;
    let realTimeRiskScore = kycRecord?.riskScore ? parseFloat(kycRecord.riskScore) : undefined;
    let realTimeUpdatedAt = kycRecord?.updatedAt;
    let verificationId = kycRecord?.amlbotRequestId;
    let amlbotVerification = null;

    // If no verification ID in kyc_records, try to get it from activity logs
    if (!verificationId) {
      console.log('[KYC Status] No verification ID in kyc_records, checking activity logs...');

      const { data: activities, error: activityError } = await supabase
        .from('audit_log')
        .select('newValues')
        .eq('entityId', clientId)
        .eq('entityType', 'client')
        .eq('action', 'amlbot_submitted')
        .order('createdAt', { ascending: false })
        .limit(1);

      if (!activityError && activities && activities.length > 0) {
        const amlbotActivity = activities[0];
        const verificationIdFromActivity = amlbotActivity.newValues?.amlbotVerificationId;

        if (verificationIdFromActivity) {
          console.log(
            '[KYC Status] Found verification ID in activity logs:',
            verificationIdFromActivity
          );
          verificationId = verificationIdFromActivity;

          // Optionally update the kyc_records table with the found verification ID
          try {
            await supabase
              .from('kyc_records')
              .update({ amlbotRequestId: verificationId })
              .eq('userId', clientId);
            console.log('[KYC Status] Updated kyc_records with verification ID from activity logs');
          } catch (updateError) {
            console.warn('[KYC Status] Could not update kyc_records:', updateError);
          }
        }
      }
    }

    // If we have an AMLBot verification ID, fetch real-time status
    if (verificationId) {
      try {
        console.log(
          '[KYC Status] Fetching real-time status from AMLBot for verification:',
          verificationId
        );
        amlbotVerification = await getVerification(verificationId);
        console.log('[KYC Status] Real-time AMLBot verification:', amlbotVerification);
        // Map AMLBot status to our internal status format
        const amlbotStatusMap: Record<string, string> = {
          pending: 'pending',
          in_progress: 'under_review',
          completed: 'approved', // Default to approved if completed
          failed: 'rejected',
          expired: 'rejected',
        };

        // Use AMLBot status if available, otherwise use result
        if (amlbotVerification.status) {
          realTimeStatus = amlbotStatusMap[amlbotVerification.status] || amlbotVerification.status;
        }

        // If verification is completed, check the verified field for final status
        if (amlbotVerification.status === 'completed') {
          if (amlbotVerification.verified === true) {
            realTimeStatus = 'approved';
          } else if (amlbotVerification.verified === false) {
            realTimeStatus = 'rejected';
          } else if (amlbotVerification.result) {
            // Fallback to result field if available
            const resultMap: Record<string, string> = {
              approved: 'approved',
              declined: 'rejected',
              review_needed: 'under_review',
            };
            realTimeStatus = resultMap[amlbotVerification.result] || amlbotVerification.result;
          }
        }

        // Update timestamp from AMLBot if available
        if (amlbotVerification.created_at) {
          realTimeUpdatedAt = amlbotVerification.created_at;
        }

        console.log('[KYC Status] Real-time AMLBot status:', {
          verificationId: verificationId,
          amlbotStatus: amlbotVerification.status,
          verified: amlbotVerification.verified,
          amlbotResult: amlbotVerification.result,
          mappedStatus: realTimeStatus,
        });
      } catch (amlbotError) {
        console.warn('[KYC Status] Failed to fetch AMLBot real-time status:', amlbotError);
        // Continue with local database data if AMLBot call fails
      }
    }

    // Include AMLBot rejection details if available
    let rejectionDetails = null;
    if (amlbotVerification && amlbotVerification.verifications) {
      rejectionDetails = {
        profile: amlbotVerification.verifications.profile,
        document: amlbotVerification.verifications.document,
      };
    }

    // Return the KYC status data with real-time updates
    const response = {
      hasKycRecord: !!kycRecord,
      status: realTimeStatus,
      amlbotRequestId: verificationId,
      amlbotApplicantId: amlbotVerification?.applicant_id,
      riskScore: realTimeRiskScore,
      rejectionDetails: rejectionDetails,
      createdAt: kycRecord?.createdAt,
      updatedAt: realTimeUpdatedAt,
    };

    // Log status for debugging
    if (!verificationId) {
      console.log(
        '[KYC Status API] ⚠️  No AMLBot verification ID found in kyc_records or activity logs'
      );
    }

    console.log('[KYC Status API] Returning response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('KYC status API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH endpoint to update verification ID
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await validateAdminRequest(request);
    if (!auth.isValid) {
      return auth.errorResponse!;
    }

    const { id: clientId } = await params;
    const body = await request.json();
    const { verificationId } = body;

    if (!verificationId) {
      return NextResponse.json({ error: 'verificationId is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Update the KYC record with the verification ID
    const { error: updateError } = await supabase
      .from('kyc_records')
      .update({ amlbotRequestId: verificationId })
      .eq('userId', clientId);

    if (updateError) {
      console.error('Error updating verification ID:', updateError);
      return NextResponse.json({ error: 'Failed to update verification ID' }, { status: 500 });
    }

    console.log(
      `[KYC Status API] ✅ Updated verification ID for client ${clientId}: ${verificationId}`
    );
    return NextResponse.json({ success: true, message: 'Verification ID updated' });
  } catch (error) {
    console.error('PATCH KYC status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
