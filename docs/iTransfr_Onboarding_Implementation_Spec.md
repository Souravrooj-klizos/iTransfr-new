# iTransfr Onboarding Flow v3 - Detailed Implementation Specification

## 1. Executive Summary
This document serves as the technical blueprint for upgrading the iTransfr onboarding flow to match **Onboarding Flow Guide v3**. The goal is to move from a generic linear flow to a **compliance-first, branching workflow** that supports complex entity structures, global restrictions, and enhanced due diligence (EDD).

## 2. Technical Architecture & File Structure

### 2.1 New/Modified File Map
```text
src/
├── app/(public)/signup/page.tsx            <- REFACTOR: Main state orchestrator
├── lib/
│   ├── constants/
│   │   ├── countries.ts                    <- NEW: Country list + Restricted/Sanctioned logic
│   │   ├── entityTypes.ts                  <- NEW: Map country -> Allowed Entity Types
│   ├── validations/
│   │   ├── auth.ts                         <- UPDATE: Add schemas for Owners, PEP, Business
├── components/auth/
│   ├── AccountTypeSelector.tsx             <- NEW: Step 0 (Personal vs Business vs FinTech)
│   ├── MultiOwnerForm.tsx                  <- NEW: Management of Beneficial Owners
│   ├── OwnerModal.tsx                      <- NEW: Form to add/edit a single owner
│   ├── PEPScreening.tsx                    <- NEW: 4-question screening
│   ├── DynamicLocationFields.tsx           <- NEW: Wrapper for Country/State logic
│   ├── signup-steps/
│   │   ├── Step1PersonalDetails.tsx        <- UPDATE: Remove Company fields, add dynamic country
│   │   ├── Step4CompanyDetails.tsx         <- REFACTOR: Heavy updates for Entity types
│   │   ├── Step5KYC.tsx                    <- UPDATE: Dynamic doc requirements
```

## 3. Data Models & Constants (Source of Truth)

### 3.1 Restricted Countries (`src/lib/constants/countries.ts`)
We must strictly block the following ISO codes:
`RU, UA, BY, CU, IL, VE, IR, YE, SO, KP`

**Implementation logic:**
The `countries` constant should be an array of objects: `{ code: 'US', name: 'United States', phone: '+1', isRestricted: false }`.
The UI must filter out `isRestricted: true` from all selection dropdowns.

### 3.2 Dynamic Entity Types (`src/lib/constants/entityTypes.ts`)
Map ISO codes to specific entity lists.

```typescript
export const ENTITY_TYPES: Record<string, { label: string; value: string }[]> = {
  US: [
    { label: 'Limited Liability Company (LLC)', value: 'llc' },
    { label: 'Corporation', value: 'corp' },
    // ... others from v3 guide
  ],
  CO: [
    { label: 'Sociedad por Acciones Simplificada (S.A.S.)', value: 'sas' },
    // ...
  ],
  // ... BR, MX mappings
  DEFAULT: [
    { label: 'Corporation', value: 'corporation' },
    { label: 'Limited Liability Company', value: 'llc' },
    // ...
  ]
};
```

## 4. Detailed Component Specifications

### 4.1 Orchestrator (`signup/page.tsx`)
**State Management:**
Instead of simple `step` number, use a `flowType` state:
- `flowType`: 'PERSONAL' | 'BUSINESS' | 'FINTECH'

**Step Mapping:**
- **COMMON:** Step 1 (Account Type Selection)
- **PERSONAL:**
  - Step 2: Personal Details (Name, Email, Mobile)
  - Step 3: Address & Location
  - Step 4: Identity Verification (Docs)
  - Step 5: PEP & Review
- **BUSINESS / FINTECH:**
  - Step 2: Business Info (Name, Country, Entity Type, Tax ID)
  - Step 3: Business Address & Site
  - Step 4: Beneficial Owners (Multi-Owner Form)
  - Step 5: PEP Screening (For all owners)
  - Step 6: Documents (Entity Docs + Owner Docs)

### 4.2 Multi-Owner Form (`MultiOwnerForm.tsx`)
**Requirement:** **Strict 100% Ownership Validation.**

**UI Layout:**
- **Top:** Progress Bar (0% to 100%).
  - Colors: Amber (<100%), Green (100%), Red (>100%).
- **Middle:** List of added owners (Cards).
  - Each card shows: Name, Type (Person/Entity), %.
  - Actions: Edit / Delete.
- **Bottom:** "Add Owner" Button.
- **Navigation:** "Continue" button is **DISABLED** unless Total % == 100.

**Data Structure (Array of Objects):**
```typescript
interface Owner {
  id: string; // temp uuid
  type: 'PERSON' | 'ENTITY';
  percentage: number;
  // If Person:
  firstName?: string;
  lastName?: string;
  dob?: string;
  nationality?: string;
  address?: Address;
  // If Entity:
  entityName?: string;
  registrationNumber?: string;
}
```

### 4.3 PEP Screening (`PEPScreening.tsx`)
**Input:** 4 Yes/No Radio Groups.
**Logic:**
- Questions defined in v3 guide (Senior official? Family member? etc.)
- If ANY is "Yes", set flag `isHighRisk: true` in the default state.
- Does NOT block onboarding, but flags for Admin Review.

## 5. Validation Schemas (`src/lib/validations/auth.ts`)

### 5.1 Business Schema Update
Must be dynamic based on the *form* state, but generally:
```typescript
export const businessSchema = z.object({
  entityName: z.string().min(1),
  countryOfIncorporation: z.string().refine(val => !RESTRICTED_COUNTRIES.includes(val)),
  entityType: z.string(), // Validated against ENTITY_TYPES[country]
  registrationNumber: z.string().min(1),
  taxId: z.string().optional(), // Optional depending on country? Guide implies required.
});
```

### 5.2 Owner Schema
```typescript
export const ownerSchema = z.object({
  percentage: z.number().min(1).max(100),
  firstName: z.string().min(1), // Conditional validation handled in UI form logic
  // ...
});
```

## 6. Implementation Checklist

### Phase 1: Foundation (Data & constants)
- [ ] Create `src/lib/constants/countries.ts` with full ISO list & restrictions.
- [ ] Create `src/lib/constants/entityTypes.ts` with US, CO, MX, BR specifics.
- [ ] Update `src/lib/validations/auth.ts` with new Zod schemas.

### Phase 2: Core Components
- [ ] Build `AccountTypeSelector`.
- [ ] Build `DynamicLocationFields` (Country dropdown + State logic).
- [ ] Build `MultiOwnerForm` (Layout & Progress bar basics).

### Phase 3: Flow Orchestration
- [ ] Refactor `signup/page.tsx` to handle the `flowType` branching.
- [ ] Wire up "Personal" flow first (easier).
- [ ] Wire up "Business" flow to use the new `MultiOwnerForm`.

### Phase 4: Compliance & Polish
- [ ] Implement `PEPScreening` step.
- [ ] Update Document Upload to request `formationDocument` etc. based on type.
- [ ] Final UI Polish (Progress bars, transitions).

## 7. API Notes
The backend endpoints (`/api/auth/signup`) currently expect flat fields.
**Crucial Change:** The frontend will now gather ALL data and likely submit it step-by-step or as a large payload at the end.
*Recommendation for Hackathon:* Keep using the step-by-step endpoints but `MultiOwner` data might need a new dedicated endpoint or be sent as a JSON blob in the profile update.
**For now:** We will structure the Frontend to hold the state, and submit key parts to existing endpoints, potentially mocking the "Owner" submission if the backend isn't ready, OR packing it into metadata fields.
