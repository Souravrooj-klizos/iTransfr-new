# iTransfr Onboarding Flow Refactoring Plan

## 1. Executive Summary

The current onboarding flow is a linear 5-step process that treats all users similarly, with a heavy bias towards a generic structure. The newly provided **Onboarding Flow Guide v3** introduces significant complexity and compliance requirements, specifically differentiating between **Personal**, **Business (Regular)**, and **Business (FinTech/EDD)** account types.

This document outlines the necessary changes to bridge the gap between the current implementation and the v3 requirements.

## 2. Core Architecture Changes

### 2.1 Flow Bifurcation
**Current:** Linear (Personal -> OTP -> Password -> Company -> KYC)
**New:** Branching based on Account Type.

*   **Step 1:** Account Type Selection (Personal / Business / FinTech)
*   **Step 2+ (Personal):** Personal Info -> Address -> Identity -> PEP -> Docs -> Review
*   **Step 2+ (Business):** Business Info -> Details -> Multi-Owner/Rep -> PEP -> Docs -> Review

**Action Items:**
- [ ] Create a new **Step 0 or Step 1** component for `AccountTypeSelection`.
- [ ] Refactor `signup/page.tsx` state management to handle different step sequences based on the selected type.

### 2.2 Global Validations & Restrictions
**Current:** Basic input validation.
**New:** Strict jurisdiction control.

**Action Items:**
- [ ] Implement a **Restricted Countries List** (Russia, Ukraine, Belarus, etc.) to block selection in all country dropdowns.
- [ ] Ensure all phone inputs use stricter E.164 formatting and potentially validate country codes against the restricted list if applicable.

## 3. Component Updates & New Components

### 3.1 Dynamic Location & Entity Logic (New)
The current simple text fields for "Country" and "City" are insufficient.

**Action Items:**
- [ ] **`CountrySelect` Component**: A dropdown excluding sanctioned countries.
- [ ] **`EntitySelect` Component**: Dependent on `CountrySelect`.
    -   *Logic:* If US -> Show LLC, Corp, etc. If Colombia -> SAS, SA, etc. Default -> generic list.
- [ ] **`RegionSelect` Component**: Dependent on `CountrySelect`.
    -   *Logic:* If US/MX/BR/CO -> Show dropdown of states/departments. Else -> Text input.

### 3.2 Business Ownership (Major New Feature)
The current flow has single-user monolithic data. The v3 guide requires detailed beneficial ownership structures.

**Action Items:**
- [ ] Create **`MultiOwnerForm`** component.
    -   Support "Person" and "Entity" owner types.
    -   **Progress Bar:** Visual indicator of ownership % (must equal exactly 100%).
    -   Validation: Disable "Continue" until 100% is reached.
    -   Collection of deep details for each owner (DOB, Address, SSN if US, etc.).

### 3.3 PEP & Sanctions Screening (New)
Currently nonexistent.

**Action Items:**
- [ ] Create **`PEPScreening`** component.
    -   Implement the 4 mandatory Yes/No questions.
    -   Logic: If any answer is "Yes", flag client for EDD (likely a backend flag, but UI needs to capture it).

### 3.4 Document Upload (Dynamic)
**Current:** Hardcoded Passport/Address/PhotoID.
**New:** Context-sensitive requirements.

**Action Items:**
- [ ] Refactor `Step5KYC` to accept a `requiredDocuments` prop.
    -   **Personal:** Start with current set.
    -   **Business:** Add Formation Docs, Proof of Ownership, EIN/Tax verification.
    -   **FinTech:** Add AML Policy, license uploads.

## 4. UI/UX Refinements

-   **Visuals:** Ensure the "Premium" aesthetic described in project guidelines is maintained across these new complex forms.
-   **Micro-interactions:** especially for the Ownership % progress bar (turning green at 100%).

## 5. Backend/API Implications (High Level)

While this plan focuses on Frontend, the Backend `signup` and `complete-profile` endpoints will need to:
-   Accept complex nested JSON for `owners` (currently flat user profile).
-   Handle new document types mapped to the API codes in the guide (e.g., `formationDocument`, `wolfsbergQuestionnaire`).
-   Validate country restrictions on the server side as well.

## 6. Implementation Roadmap

1.  **Phase 1: Foundation** - Update `signup` page state machine to support branching. Implement Country/Restriction utilities.
2.  **Phase 2: Components** - Build the Dynamic Entity/Region selectors.
3.  **Phase 3: Business Logic** - Build the `MultiOwnerForm` (most complex piece).
4.  **Phase 4: Compliance** - Add PEP screen and Dynamic Doc uploads.
5.  **Phase 5: Integration** - Wire up to backend (may require schema updates).
