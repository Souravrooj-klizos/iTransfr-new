import { createClient } from '@/lib/supabase/server';

export interface StepResult {
  success: boolean;
  sessionId: string;
  step: number;
  data: any;
  message?: string;
  // For Step 8
  clientId?: string;
  onboardingComplete?: boolean;
  clientDetails?: any;
  nextSteps?: string[];
}

/**
 * Shared logic for handling Step 1 (Account Type Selection).
 */
export async function processStep1(
  accountType: 'personal' | 'business' | 'fintech',
  sessionId: string | undefined,
  creatorId: string,
  createdBy: 'admin' | 'user'
): Promise<StepResult & { isNewSession: boolean }> {
  // ... (Existing code matches, just adding return type explicitly)
  const supabase = await createClient();
  let currentSessionId = sessionId;
  let isNewSession = false;

  if (!currentSessionId) {
    const { data, error } = await supabase
      .from('onboarding_sessions')
      .insert({
        session_data: { accountType, createdBy, creatorId },
        current_step: 1,
        completed_steps: [1],
        is_active: true,
        started_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw new Error(`Failed to create session: ${error.message}`);
    currentSessionId = data.id;
    isNewSession = true;
  } else {
    const { data: updatedSession, error: updateError } = await supabase
      .from('onboarding_sessions')
      .update({
        session_data: { accountType, createdBy, creatorId },
        current_step: 1,
        completed_steps: [1],
        last_updated: new Date().toISOString(),
      })
      .eq('id', currentSessionId)
      .select('id')
      .maybeSingle();

    if (updateError) throw new Error(`Failed to update session: ${updateError.message}`);

    if (!updatedSession) {
      const { data, error } = await supabase
        .from('onboarding_sessions')
        .insert({
          session_data: { accountType, createdBy, creatorId },
          current_step: 1,
          completed_steps: [1],
          is_active: true,
          started_at: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (error) throw new Error(`Failed to verify/create session: ${error.message}`);
      currentSessionId = data.id;
      isNewSession = true;
    }
  }

  return {
    success: true,
    sessionId: currentSessionId!,
    step: 1,
    data: { accountType },
    isNewSession,
    message: 'Account type saved successfully',
  };
}

/**
 * Shared logic for generic steps (2-7) that just update the JSON blob.
 */
export async function processGenericStep(
  sessionId: string,
  stepNumber: number,
  dataToMerge: any
): Promise<StepResult> {
  const supabase = await createClient();

  // 1. Get current session data
  const { data: session, error: fetchError } = await supabase
    .from('onboarding_sessions')
    .select('session_data, completed_steps')
    .eq('id', sessionId)
    .single();

  if (fetchError || !session) {
    throw new Error('Session not found');
  }

  // 2. Merge new data
  const updatedSessionData = {
    ...session.session_data,
    ...dataToMerge,
  };

  // 3. Update completed steps
  const completedSteps = new Set(session.completed_steps || []);
  completedSteps.add(stepNumber);

  // 4. Save
  const { error: updateError } = await supabase
    .from('onboarding_sessions')
    .update({
      session_data: updatedSessionData,
      current_step: stepNumber,
      completed_steps: Array.from(completedSteps),
      last_updated: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (updateError) {
    throw new Error(`Failed to save step ${stepNumber}: ${updateError.message}`);
  }

  return {
    success: true,
    sessionId,
    step: stepNumber,
    data: dataToMerge,
    message: 'Step saved successfully',
  };
}

/**
 * Shared logic for Final Submission (Step 8).
 * Creation of Client, Auth User, AMLBot check, Audit Logs.
 */
export async function submitOnboarding(
  sessionId: string,
  finalConfirmationData: any,
  submitterId: string, // Admin ID or User ID
  submitterRole: 'admin' | 'user',
  requestMetadata: { ip?: string; userAgent?: string } = {}
): Promise<StepResult> {
  const supabase = await createClient();

  // 1. Get Session
  const { data: session, error: fetchError } = await supabase
    .from('onboarding_sessions')
    .select('session_data, completed_steps')
    .eq('id', sessionId)
    .single();

  if (fetchError || !session) throw new Error('Session not found');

  const sessionData = session.session_data;
  if (!sessionData) throw new Error('Session data incomplete');

  // 2. Validate Steps
  const requiredSteps = [1, 2, 3, 4, 5, 6, 7];
  const completedSteps = session.completed_steps || [];
  const missingSteps = requiredSteps.filter(step => !completedSteps.includes(step));
  if (missingSteps.length > 0) {
    throw new Error(`Missing required steps: ${missingSteps.join(', ')}`);
  }

  // 3. Sanitize owner data - convert empty strings to null for date fields
  const sanitizeOwnerData = (owner: any) => {
    const dateFields = ['dateOfBirth', 'idIssueDate', 'idExpirationDate'];
    const sanitized = { ...owner };

    dateFields.forEach(field => {
      if (sanitized[field] === '' || sanitized[field] === undefined) {
        sanitized[field] = null;
      }
    });

    return sanitized;
  };

  const sanitizedOwners = (sessionData.owners || []).map(sanitizeOwnerData);

  // 4. Call DB Function to Create Client
  const { data: clientData, error: clientError } = await supabase.rpc(
    'create_client_with_onboarding',
    {
      p_created_by: submitterRole,
      p_creator_id: sessionData.creatorId, // Use session creator, or submitterId if appropriate (usually session creator)
      p_account_type: sessionData.accountType,
      p_country: sessionData.businessInfo?.country || null,
        p_entity_type: sessionData.businessInfo?.entityType || null,
        p_business_name: sessionData.businessInfo?.businessName || null,
        p_tax_id: sessionData.businessInfo?.taxId || null,
        p_state: sessionData.businessInfo?.state || null,
        p_business_address: sessionData.businessInfo?.address || null,
        p_website: sessionData.businessInfo?.website || null,
        p_phone: sessionData.businessInfo?.phone || null,
        p_phone_country_code: sessionData.businessInfo?.phoneCountryCode || null,
        p_industry: sessionData.businessDetails?.industry || null,
        p_business_description: sessionData.businessDetails?.businessDescription || null,
        p_expected_monthly_volume: sessionData.businessDetails?.expectedMonthlyVolume || null,
        p_primary_use_case: sessionData.businessDetails?.primaryUseCase || null,
        p_business_operations: sessionData.businessOperations || null,
        p_owners: sanitizedOwners,
        p_pep_screening: sessionData.pepScreening || null,
        p_documents: (sessionData.documents || []).map((doc: any) => ({
          ...doc,
          type: doc.type === 'taxIdVerification' ? 'taxId' : doc.type,
        })),
      p_metadata: {
        ...sessionData.metadata,
        submittedAt: new Date().toISOString(),
        submittedBy: submitterId,
        finalConfirmation: finalConfirmationData,
      },
    }
  );

  if (clientError) throw new Error(`Failed to create client: ${clientError.message}`);

  const clientId = clientData.client_id;

  // 4. AMLBot Integration - Use the new comprehensive KYC service
  try {
    // Import dynamically to avoid circular dependencies
    const { submitKYC, getKYCFormUrl, DOCUMENT_TYPE_MAP } = await import('../lib/integrations/amlbot-kyc-service');

    // Get primary owner info
    const primaryOwner = sessionData.owners?.find((owner: any) => owner.type === 'person');

    if (primaryOwner) {
      console.log('[Onboarding] Starting AMLBot KYC submission for client:', clientId);

      // Prepare documents for AMLBot
      // Convert our document format to AMLBot format
      const kycDocuments = (sessionData.documents || [])
        .filter((doc: any) => doc.fileUrl && DOCUMENT_TYPE_MAP[doc.type])
        .map((doc: any) => ({
          type: doc.type,
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          mimeType: doc.mimeType,
          // Add document metadata if available
          documentNumber: doc.documentNumber,
          issueDate: doc.issueDate,
          expiryDate: doc.expiryDate,
        }));

      if (kycDocuments.length > 0) {
        // Use the complete KYC submission flow (uploads documents then creates verification)
        // Note: form_id is REQUIRED by AMLBot - uses AMLBOT_FORM_ID env var
        const kycResult = await submitKYC({
          firstName: primaryOwner.firstName,
          lastName: primaryOwner.lastName,
          email: primaryOwner.email,
          phone: primaryOwner.phone,
          dateOfBirth: primaryOwner.dateOfBirth,
          residenceCountry: primaryOwner.residentialCountry || sessionData.businessInfo?.country,
          nationality: primaryOwner.citizenship,
          documents: kycDocuments,
          // formId will use AMLBOT_FORM_ID env var as fallback in amlbot-kyc-service
          callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/amlbot`,
        });

        if (kycResult.success) {
          console.log('[Onboarding] AMLBot KYC submitted successfully:', kycResult.verificationId);

          // Update KYC record with AMLBot IDs
          await supabase
            .from('kyc_records')
            .update({
              amlbotRequestId: kycResult.verificationId,
              updatedAt: new Date().toISOString(),
            })
            .eq('userId', clientId);

          // Audit Log
          await supabase.from('audit_log').insert({
            adminId: submitterId,
            action: 'amlbot_submitted',
            entityType: 'client',
            entityId: clientId,
            newValues: {
              amlbotApplicantId: kycResult.applicantId,
              amlbotVerificationId: kycResult.verificationId,
              documentIds: kycResult.documentIds,
              documentsUploaded: kycResult.documentIds.length,
            },
            ipAddress: requestMetadata.ip,
            userAgent: requestMetadata.userAgent,
            createdAt: new Date().toISOString(),
          });
        } else {
          console.error('[Onboarding] AMLBot KYC submission failed:', kycResult.error);

          // Log the failure but don't block client creation
          await supabase.from('audit_log').insert({
            adminId: submitterId,
            action: 'amlbot_submission_failed',
            entityType: 'client',
            entityId: clientId,
            newValues: {
              error: kycResult.error,
              documentsAttempted: kycDocuments.length,
            },
            ipAddress: requestMetadata.ip,
            userAgent: requestMetadata.userAgent,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        // No documents to upload - use form-based KYC instead
        console.log('[Onboarding] No documents available, creating form-based KYC');

        const formId = process.env.AMLBOT_FORM_ID || '7b6ea16b17e0a14f791aa1f9fe5d2812dcf1';
        const formResult = await getKYCFormUrl(
          formId,
          primaryOwner.firstName,
          primaryOwner.lastName,
          primaryOwner.email,
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/kyc/complete`
        );

        if (formResult.success) {
          console.log('[Onboarding] AMLBot form URL generated:', formResult.formUrl);

          // Store the form URL for later use
          await supabase
            .from('kyc_records')
            .update({
              amlbotRequestId: formResult.verificationId,
              notes: [`KYC form URL: ${formResult.formUrl}`],
              updatedAt: new Date().toISOString(),
            })
            .eq('userId', clientId);
        }
      }
    }
  } catch (amlbotError) {
    console.error('[Onboarding] AMLBot submission error:', amlbotError);
    // Non-blocking error - client is still created successfully
  }


  // 5. Final Audit Log
  await supabase.from('audit_log').insert({
    adminId: submitterId,
    action: 'client_created_final',
    entityType: 'client',
    entityId: clientId,
    newValues: {
      accountType: sessionData.accountType,
      businessName: sessionData.businessInfo?.businessName,
      country: sessionData.businessInfo?.country,
      finalConfirmation: finalConfirmationData,
    },
    ipAddress: requestMetadata.ip,
    userAgent: requestMetadata.userAgent,
    createdAt: new Date().toISOString(),
  });

  // 6. Close Session
  await supabase
    .from('onboarding_sessions')
    .update({
      current_step: 8,
      completed_steps: requiredSteps, // Mark all done
      is_active: false,
      last_updated: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  return {
    success: true,
    sessionId,
    step: 8,
    data: finalConfirmationData,
    clientId,
    onboardingComplete: true,
    message: 'Client created successfully',
    clientDetails: {
      id: clientId,
      accountType: sessionData.accountType,
      businessName: sessionData.businessInfo?.businessName,
      status: 'pending_kyc',
      createdAt: new Date().toISOString(),
    },
    nextSteps: [
      'AMLBot verification in progress',
      'KYC review will be conducted',
      'Account activation pending compliance approval',
    ],
  };
}
