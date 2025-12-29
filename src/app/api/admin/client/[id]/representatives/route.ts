import { validateAdminRequest } from '@/lib/auth-utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { OwnershipValidationService, Owner } from '@/lib/validations/ownership-validation';
import { phoneSchema } from '@/lib/validations/client';
import { NextRequest, NextResponse } from 'next/server';

// Zod schema for representative validation
import { z } from 'zod';

const addRepresentativeSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  dob: z.string().optional(),
  phoneCountry: z.string().optional(),
  phoneNumber: z.string().optional(),
  title: z.string().optional(),
  ownershipPercentage: z.number().min(0).max(100, 'Ownership percentage must be between 0 and 100'),
  employmentStatus: z.enum(['employed', 'self_employed', 'unemployed', 'retired']).optional(),
  occupation: z.string().min(1, 'Occupation is required').max(100),
  employer: z.string().optional(),
  annualIncome: z.enum(['under_50k', '50k_100k', '100k_200k', 'over_200k']).optional(),
  taxId: z.string().optional(),
  sourceOfFunds: z.enum(['salary', 'savings', 'inheritance', 'investment', 'other']).optional(),
  sourceOfWealth: z.enum(['salary', 'savings', 'inheritance', 'investment', 'other']).optional(),
});

/**
 * POST /api/admin/client/[id]/representatives
 * Add a new representative to a client
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

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input data
    const validationResult = addRepresentativeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Validate phone number if provided
    if (validatedData.phoneNumber && validatedData.phoneCountry) {
      try {
        // Format phone number to E.164 format
        const fullPhoneNumber = `+${validatedData.phoneCountry}${validatedData.phoneNumber.replace(/\D/g, '')}`;
        phoneSchema.parse(fullPhoneNumber);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Invalid phone number format' },
          { status: 400 }
        );
      }
    }

    const supabase = createAdminClient();

    // Check if client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, company_name, first_name, last_name')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check if representative with this email already exists for this client
    const { data: existingRep } = await supabase
      .from('beneficial_owners')
      .select('id, email')
      .eq('clientId', clientId)
      .eq('email', validatedData.email)
      .single();

    if (existingRep) {
      return NextResponse.json(
        { success: false, error: 'A representative with this email already exists for this client' },
        { status: 400 }
      );
    }

    // Get all existing representatives to validate ownership
    const { data: existingOwners, error: ownersError } = await supabase
      .from('beneficial_owners')
      .select('*')
      .eq('clientId', clientId);

    if (ownersError) {
      console.error('Error fetching existing owners:', ownersError);
      return NextResponse.json(
        { success: false, error: 'Failed to validate ownership structure' },
        { status: 500 }
      );
    }

    // Prepare new owner data for validation
    const newOwner: Owner = {
      type: 'person',
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phoneNumber && validatedData.phoneCountry
        ? `+${validatedData.phoneCountry}${validatedData.phoneNumber.replace(/\D/g, '')}`
        : undefined,
      ownershipPercentage: validatedData.ownershipPercentage,
      role: 'Representative',
      title: validatedData.title,
    };

    // Convert existing owners to Owner format for validation
    const allOwners: Owner[] = [
      ...(existingOwners || []).map(owner => ({
        id: owner.id,
        type: 'person' as const,
        firstName: owner.first_name,
        lastName: owner.last_name,
        email: owner.email,
        phone: owner.phone,
        ownershipPercentage: owner.ownership_percentage,
        role: owner.role,
        title: owner.title,
      })),
      newOwner,
    ];

    // Validate ownership structure
    const ownershipValidation = OwnershipValidationService.validateOwnership(allOwners);
    if (!ownershipValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ownership validation failed',
          details: ownershipValidation.error,
        },
        { status: 400 }
      );
    }

    // Prepare data for insertion
    const representativeData = {
      clientId,
      first_name: validatedData.firstName,
      last_name: validatedData.lastName,
      email: validatedData.email,
      phone: newOwner.phone,
      date_of_birth: validatedData.dob || null,
      title: validatedData.title || null,
      ownership_percentage: validatedData.ownershipPercentage,
      role: 'Representative',
      employment_status: validatedData.employmentStatus || null,
      occupation: validatedData.occupation,
      employer: validatedData.employer || null,
      annual_income: validatedData.annualIncome || null,
      tax_id: validatedData.taxId || null,
      source_of_funds: validatedData.sourceOfFunds || null,
      source_of_wealth: validatedData.sourceOfWealth || null,
      verification_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insert the representative
    const { data: newRepresentative, error: insertError } = await supabase
      .from('beneficial_owners')
      .insert(representativeData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting representative:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to add representative' },
        { status: 500 }
      );
    }

    // Log the action
    await supabase.from('client_activity').insert({
      clientId,
      action: 'representative_added',
      description: `Added representative: ${validatedData.firstName} ${validatedData.lastName}`,
      performed_by: auth.admin.id,
      metadata: {
        representativeId: newRepresentative.id,
        ownershipPercentage: validatedData.ownershipPercentage,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Representative added successfully',
      representative: newRepresentative,
    });
  } catch (error: any) {
    console.error('[Add Representative API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
