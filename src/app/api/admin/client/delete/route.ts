import { validateAdminRequest } from '@/lib/auth-utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    // 1. Validate Admin
    const auth = await validateAdminRequest(request);
    if (!auth.isValid) {
      return auth.errorResponse!;
    }

    // 2. Get client ID from query params
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 3. Check if this is an onboarding session or completed client
    const { data: session } = await supabase
      .from('onboarding_sessions')
      .select('id')
      .eq('id', clientId)
      .single();

    if (session) {
      // Delete onboarding session (cascading will handle related data)
      const { error: deleteError } = await supabase
        .from('onboarding_sessions')
        .delete()
        .eq('id', clientId);

      if (deleteError) {
        console.error('Error deleting onboarding session:', deleteError);
        return NextResponse.json({ error: 'Failed to delete onboarding session' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Onboarding session deleted successfully',
      });
    }

    // 4. Delete completed client profile and all related data
    // The order matters due to foreign key constraints

    // Delete in this order:
    // 1. Audit logs
    // 2. Transactions (if any)
    // 3. KYC records and documents
    // 4. Beneficial owners
    // 5. Client profile

    const { error: auditError } = await supabase
      .from('audit_log')
      .delete()
      .eq('entity_id', clientId);

    if (auditError) {
      console.error('Error deleting audit logs:', auditError);
    }

    const { error: transactionsError } = await supabase
      .from('transactions')
      .delete()
      .eq('client_id', clientId);

    if (transactionsError) {
      console.error('Error deleting transactions:', transactionsError);
    }

    const { error: kycDocumentsError } = await supabase
      .from('kyc_documents')
      .delete()
      .eq('client_id', clientId);

    if (kycDocumentsError) {
      console.error('Error deleting KYC documents:', kycDocumentsError);
    }

    const { error: kycError } = await supabase
      .from('kyc_records')
      .delete()
      .eq('client_id', clientId);

    if (kycError) {
      console.error('Error deleting KYC records:', kycError);
    }

    const { error: ownersError } = await supabase
      .from('beneficial_owners')
      .delete()
      .eq('client_id', clientId);

    if (ownersError) {
      console.error('Error deleting beneficial owners:', ownersError);
    }

    const { error: profileError } = await supabase
      .from('client_profiles')
      .delete()
      .eq('id', clientId);

    if (profileError) {
      console.error('Error deleting client profile:', profileError);
      return NextResponse.json({ error: 'Failed to delete client profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Client and all related data deleted successfully',
    });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
