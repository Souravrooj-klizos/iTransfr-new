# Supabase Database Schema

## Tables

### users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  supabaseUserId TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  fullName TEXT NOT NULL,
  companyName TEXT,
  mobile TEXT,
  countryCode TEXT,
  city TEXT,
  country TEXT,
  pincode TEXT,
  businessType TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin', 'super_admin')),
  status TEXT NOT NULL DEFAULT 'pending_kyc' CHECK (status IN ('pending_kyc', 'active', 'suspended')),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_supabaseUserId ON users(supabaseUserId);
CREATE INDEX idx_users_email ON users(email);
```

### email_verifications
```sql
CREATE TABLE email_verifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
  userId TEXT REFERENCES users(id),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_verifications_email ON email_verifications(email);
CREATE INDEX idx_email_verifications_expiresAt ON email_verifications(expiresAt);
```

### kyc_records
```sql
CREATE TABLE kyc_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  userId TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  amlbotRequestId TEXT,
  riskScore DECIMAL,
  notes TEXT[] DEFAULT '{}',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_kyc_records_userId ON kyc_records(userId);
```

### kyc_documents
```sql
CREATE TABLE kyc_documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  kycRecordId TEXT NOT NULL REFERENCES kyc_records(id) ON DELETE CASCADE,
  documentType TEXT NOT NULL CHECK (documentType IN ('passport', 'address_proof', 'photo_id')),
  fileName TEXT NOT NULL,
  fileUrl TEXT NOT NULL,
  uploadedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE kyc_documents ADD CONSTRAINT unique_kyc_document_type
UNIQUE (kycRecordId, documentType);

CREATE INDEX idx_kyc_documents_kycRecordId ON kyc_documents(kycRecordId);
```

## Storage Buckets

### kyc-documents
```sql
-- Create bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kyc-documents', 'kyc-documents', true);

-- Policy: Users can upload their own documents
CREATE POLICY "Users can upload own KYC documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'kyc-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can read their own documents
CREATE POLICY "Users can read own KYC documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'kyc-documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL commands above in order
4. Verify tables and policies are created correctly
