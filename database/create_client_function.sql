-- =====================================================
-- CLIENT CREATION WITH ONBOARDING FUNCTION
-- Creates a complete client with all onboarding data
-- =====================================================

CREATE OR REPLACE FUNCTION create_client_with_onboarding(
  p_created_by TEXT,           -- 'user' or 'admin'
  p_creator_id TEXT,           -- UUID of creator
  p_account_type TEXT,         -- 'personal', 'business', 'fintech'
  p_country TEXT,              -- ISO country code
  p_entity_type TEXT,          -- Entity type based on country
  p_business_name TEXT,        -- Business/company name
  p_tax_id TEXT,               -- Tax ID
  p_state TEXT,                -- State/region (optional)
  p_business_address JSONB,    -- Business address object
  p_website TEXT,              -- Website URL (optional)
  p_phone TEXT,                -- Phone number (E.164 format)
  p_phone_country_code TEXT,   -- Phone country code
  p_industry TEXT,             -- Industry sector
  p_business_description TEXT, -- Business description
  p_expected_monthly_volume TEXT, -- Expected volume
  p_primary_use_case TEXT,     -- Primary use case
  p_business_operations JSONB, -- Business operations data
  p_owners JSONB,              -- Array of owner objects
  p_pep_screening JSONB,       -- PEP screening responses
  p_documents JSONB,           -- Array of document objects
  p_metadata JSONB DEFAULT '{}' -- Additional metadata
) RETURNS JSON AS $$
DECLARE
  v_client_id UUID;
  v_kyc_record_id TEXT;
  v_onboarding_session_id TEXT;
  v_owner_record RECORD;
  v_document_record RECORD;
  v_address_id TEXT;
  v_total_ownership NUMERIC := 0;
BEGIN
  -- Validate input parameters
  IF p_created_by NOT IN ('user', 'admin') THEN
    RAISE EXCEPTION 'Invalid created_by value. Must be user or admin.';
  END IF;

  IF p_account_type NOT IN ('personal', 'business', 'fintech') THEN
    RAISE EXCEPTION 'Invalid account_type. Must be personal, business, or fintech.';
  END IF;

  -- For admin-created clients, create a new auth user
  IF p_created_by = 'admin' THEN
    -- Generate a temporary email for admin-created clients
    -- In production, you might want to collect actual email or use different auth approach
    INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, created_at, updated_at)
    VALUES (
      'admin-created-' || gen_random_uuid() || '@itransfr.internal',
      crypt(gen_random_uuid()::text, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW()
    )
    RETURNING id INTO v_client_id;
  ELSE
    -- For user-created clients, use the provided creator_id
    v_client_id := p_creator_id::UUID;
  END IF;

  -- Create client profile
  INSERT INTO client_profiles (
    id,
    account_type,
    first_name,
    last_name,
    company_name,
    business_type,
    tax_id,
    country,
    state,
    city,
    country_code,
    mobile,
    business_address,
    website,
    industry,
    business_description,
    expected_monthly_volume,
    primary_use_case,
    onboarding_step,
    status,
    "createdAt",
    "updatedAt"
  ) VALUES (
    v_client_id,
    p_account_type,
    CASE WHEN p_account_type = 'personal' THEN (p_owners->0->>'firstName') ELSE NULL END,
    CASE WHEN p_account_type = 'personal' THEN (p_owners->0->>'lastName') ELSE NULL END,
    CASE WHEN p_account_type IN ('business', 'fintech') THEN p_business_name ELSE NULL END,
    CASE WHEN p_account_type IN ('business', 'fintech') THEN p_entity_type ELSE NULL END,
    p_tax_id,
    p_country,
    p_state,
    p_business_address->>'city',
    p_phone_country_code,
    p_phone,
    p_business_address,
    p_website,
    p_industry,
    p_business_description,
    p_expected_monthly_volume,
    p_primary_use_case,
    1, -- Start at step 1
    'pending_kyc',
    NOW(),
    NOW()
  );

  -- Create business operations (for business/fintech accounts)
  IF p_account_type IN ('business', 'fintech') THEN
    INSERT INTO business_operations (
      "clientId",
      volume_swift_monthly,
      volume_local_monthly,
      volume_crypto_monthly,
      volume_international_tx_count,
      volume_local_tx_count,
      operating_currencies,
      primary_operating_regions,
      created_at,
      updated_at
    ) VALUES (
      v_client_id,
      (p_business_operations->>'volumeSwiftMonthly')::DECIMAL,
      (p_business_operations->>'volumeLocalMonthly')::DECIMAL,
      (p_business_operations->>'volumeCryptoMonthly')::DECIMAL,
      (p_business_operations->>'volumeInternationalTxCount')::INTEGER,
      (p_business_operations->>'volumeLocalTxCount')::INTEGER,
      (p_business_operations->>'operatingCurrencies')::TEXT[],
      (p_business_operations->>'primaryOperatingRegions')::TEXT[],
      NOW(),
      NOW()
    );
  END IF;

  -- Create beneficial owners
  FOR v_owner_record IN SELECT * FROM jsonb_array_elements(p_owners)
  LOOP
    -- Validate ownership percentage
    v_total_ownership := v_total_ownership + (v_owner_record.value->>'ownershipPercentage')::NUMERIC;

    IF (v_owner_record.value->>'type') = 'person' THEN
      -- Create person owner
      INSERT INTO beneficial_owners (
        "clientId",
        first_name,
        last_name,
        email,
        phone,
        phone_country_code,
        date_of_birth,
        citizenship,
        secondary_citizenship,
        tax_id,
        role,
        ownership_percentage,
        is_authorized_signer,
        residential_country,
        residential_address,
        residential_apt,
        residential_city,
        residential_state,
        residential_postal_code,
        id_type,
        id_number,
        id_issuing_country,
        id_issue_date,
        id_expiration_date,
        employment_status,
        employment_industry,
        occupation,
        employer_name,
        source_of_income,
        source_of_wealth,
        annual_income,
        pep_senior_official,
        pep_political_party,
        pep_family_member,
        pep_close_associate,
        pep_screening_completed,
        verification_status,
        created_at,
        updated_at
      ) VALUES (
        v_client_id,
        v_owner_record.value->>'firstName',
        v_owner_record.value->>'lastName',
        v_owner_record.value->>'email',
        v_owner_record.value->>'phone',
        v_owner_record.value->>'phoneCountryCode',
        (v_owner_record.value->>'dateOfBirth')::DATE,
        v_owner_record.value->>'citizenship',
        v_owner_record.value->>'secondaryCitizenship',
        v_owner_record.value->>'taxId',
        v_owner_record.value->>'role',
        (v_owner_record.value->>'ownershipPercentage')::DECIMAL,
        (v_owner_record.value->>'isAuthorizedSigner')::BOOLEAN,
        v_owner_record.value->>'residentialCountry',
        v_owner_record.value->>'residentialAddress',
        v_owner_record.value->>'residentialApt',
        v_owner_record.value->>'residentialCity',
        v_owner_record.value->>'residentialState',
        v_owner_record.value->>'residentialPostalCode',
        v_owner_record.value->>'idType',
        v_owner_record.value->>'idNumber',
        v_owner_record.value->>'idIssuingCountry',
        (v_owner_record.value->>'idIssueDate')::DATE,
        (v_owner_record.value->>'idExpirationDate')::DATE,
        v_owner_record.value->>'employmentStatus',
        v_owner_record.value->>'employmentIndustry',
        v_owner_record.value->>'occupation',
        v_owner_record.value->>'employerName',
        v_owner_record.value->>'sourceOfIncome',
        v_owner_record.value->>'sourceOfWealth',
        v_owner_record.value->>'annualIncome',
        (p_pep_screening->>'isPEPSeniorOfficial')::BOOLEAN,
        (p_pep_screening->>'isPEPPoliticalParty')::BOOLEAN,
        (p_pep_screening->>'isPEPFamilyMember')::BOOLEAN,
        (p_pep_screening->>'isPEPCloseAssociate')::BOOLEAN,
        true, -- PEP screening completed
        'pending',
        NOW(),
        NOW()
      );

      -- Create owner address record
      INSERT INTO owner_addresses (
        "ownerId",
        address_type,
        country,
        street_address,
        address_line_2,
        city,
        state_province_region,
        postal_code,
        created_at,
        updated_at
      ) VALUES (
        (SELECT id FROM beneficial_owners WHERE "clientId" = v_client_id AND email = v_owner_record.value->>'email' LIMIT 1),
        'residential',
        v_owner_record.value->>'residentialCountry',
        v_owner_record.value->>'residentialAddress',
        v_owner_record.value->>'residentialApt',
        v_owner_record.value->>'residentialCity',
        v_owner_record.value->>'residentialState',
        v_owner_record.value->>'residentialPostalCode',
        NOW(),
        NOW()
      );

    ELSE
      -- Create entity owner (corporate shareholder)
      -- Note: Entity ownership requires schema expansion for full implementation
      -- For now, we'll skip entity owners and focus on person owners
      -- This ensures the ownership percentage validation still works
      RAISE EXCEPTION 'Entity owners not yet implemented. Only person owners are supported.';
    END IF;
  END LOOP;

  -- Validate total ownership percentage
  IF ABS(v_total_ownership - 100.0) > 0.01 THEN
    RAISE EXCEPTION 'Total ownership percentage must equal 100%%. Current total: %%%', v_total_ownership;
  END IF;

  -- Create PEP screening responses
  FOR v_owner_record IN SELECT * FROM jsonb_array_elements(p_owners)
  LOOP
    IF (v_owner_record.value->>'type') = 'person' THEN
      INSERT INTO pep_screening_responses (
        "ownerId",
        question_id,
        response,
        details,
        screened_at,
        created_at
      ) VALUES
      (
        (SELECT id FROM beneficial_owners WHERE "clientId" = v_client_id AND email = v_owner_record.value->>'email' LIMIT 1),
        'pep_senior_official',
        (p_pep_screening->>'isPEPSeniorOfficial')::BOOLEAN,
        CASE WHEN (p_pep_screening->>'isPEPSeniorOfficial')::BOOLEAN THEN 'PEP senior official identified' ELSE NULL END,
        NOW(),
        NOW()
      ),
      (
        (SELECT id FROM beneficial_owners WHERE "clientId" = v_client_id AND email = v_owner_record.value->>'email' LIMIT 1),
        'pep_political_party',
        (p_pep_screening->>'isPEPPoliticalParty')::BOOLEAN,
        CASE WHEN (p_pep_screening->>'isPEPPoliticalParty')::BOOLEAN THEN 'PEP political party official identified' ELSE NULL END,
        NOW(),
        NOW()
      ),
      (
        (SELECT id FROM beneficial_owners WHERE "clientId" = v_client_id AND email = v_owner_record.value->>'email' LIMIT 1),
        'pep_family_member',
        (p_pep_screening->>'isPEPFamilyMember')::BOOLEAN,
        CASE WHEN (p_pep_screening->>'isPEPFamilyMember')::BOOLEAN THEN 'PEP family member identified' ELSE NULL END,
        NOW(),
        NOW()
      ),
      (
        (SELECT id FROM beneficial_owners WHERE "clientId" = v_client_id AND email = v_owner_record.value->>'email' LIMIT 1),
        'pep_close_associate',
        (p_pep_screening->>'isPEPCloseAssociate')::BOOLEAN,
        CASE WHEN (p_pep_screening->>'isPEPCloseAssociate')::BOOLEAN THEN 'PEP close associate identified' ELSE NULL END,
        NOW(),
        NOW()
      );
    END IF;
  END LOOP;

  -- Create onboarding session
  INSERT INTO onboarding_sessions (
    "clientId",
    session_data,
    current_step,
    completed_steps,
    is_active,
    started_at,
    last_updated,
    created_at,
    updated_at
  ) VALUES (
    v_client_id,
    jsonb_build_object(
      'createdBy', p_created_by,
      'creatorId', p_creator_id,
      'accountType', p_account_type,
      'metadata', p_metadata
    ),
    1,
    '{}',
    true,
    NOW(),
    NOW(),
    NOW(),
    NOW()
  ) RETURNING id INTO v_onboarding_session_id;

  -- Create KYC record
  INSERT INTO kyc_records (
    "userId",
    status,
    notes,
    "createdAt",
    "updatedAt"
  ) VALUES (
    v_client_id,
    'pending',
    ARRAY['Client created via API', 'AMLBot verification pending'],
    NOW(),
    NOW()
  ) RETURNING id INTO v_kyc_record_id;

  -- Create KYC documents
  FOR v_document_record IN SELECT * FROM jsonb_array_elements(p_documents)
  LOOP
    INSERT INTO kyc_documents (
      "kycRecordId",
      "documentType",
      "fileName",
      "fileUrl",
      "s3Bucket",
      "s3Key",
      "fileSize",
      "mimeType",
      "uploadedAt"
    ) VALUES (
      v_kyc_record_id,
      v_document_record.value->>'type',
      v_document_record.value->>'fileName',
      v_document_record.value->>'fileUrl',
      'itransfr-kyc-documents',
      split_part(v_document_record.value->>'fileUrl', '/', -1),
      (v_document_record.value->>'fileSize')::BIGINT,
      v_document_record.value->>'mimeType',
      NOW()
    );
  END LOOP;

  -- Return success response
  RETURN json_build_object(
    'client_id', v_client_id,
    'kyc_record_id', v_kyc_record_id,
    'onboarding_session_id', v_onboarding_session_id,
    'status', 'created',
    'account_type', p_account_type,
    'current_step', 1,
    'total_owners', jsonb_array_length(p_owners),
    'total_documents', jsonb_array_length(p_documents)
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE EXCEPTION 'Failed to create client: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
