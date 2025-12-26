**iTransfr**

Global Client Onboarding & KYC/KYB Flow

Virtual Account Opening via InfinitusPay Integration

Version 2.0 | Multi-Jurisdiction Support

# 1\. Executive Summary

# This document outlines the complete client onboarding flow for iTransfr's virtual bank account services, integrated with InfinitusPay's banking infrastructure. The flow is designed to support global clients across 90+ countries with comprehensive KYC/KYB procedures, PEP screening, multi-owner/multi-entity support, and Enhanced Due Diligence (EDD) for FinTech companies

# Client Types Supported

- Personal Accounts - Individual clients requiring USD virtual accounts
- Business Accounts (Regular) - Importers/exporters, marketing agencies, digital services, general commerce
- Business Accounts (FinTech/EDD) - Money services businesses, payment processors, crypto-related entities

**Key Features:**

- Global country support (90+ countries) with jurisdiction-specific entity types
- Multi-owner/multi-entity beneficial ownership with 100% validation
- Country-specific state/department/region selection for US, Colombia, Brazil, Mexico
- International phone number support with country code selection

# 2\. Jurisdiction Restrictions

## 2.1 Excluded Countries

## The following countries are excluded from all account types due to sanctions, regulatory restrictions, or risk considerations

| **Country** | **ISO Code** | **Reason** |
| --- | --- | --- |
| Russia | RU  | OFAC Sanctions |
| Ukraine | UA  | Conflict Zone |
| Belarus | BY  | OFAC Sanctions |
| Cuba | CU  | OFAC Sanctions |
| Israel | IL  | Risk Assessment |
| Venezuela | VE  | OFAC Sanctions |
| Iran | IR  | OFAC Sanctions |
| Yemen | YE  | OFAC Sanctions |
| Somalia | SO  | OFAC Sanctions |
| North Korea | KP  | OFAC Sanctions |

## _These countries must be excluded from all country dropdown menus in the onboarding flow, including: country of incorporation, citizenship, country of birth, and residential address._

# 3\. Onboarding Flow Architecture

## 3.1 High-Level Process Flow

| **Step** | **Personal Account** | **Business (Regular)** | **Business (FinTech/EDD)** |
| --- | --- | --- | --- |
| 1   | Account Type Selection | Account Type Selection | Account Type Selection |
| 2   | Personal Information | Business Information | Business Information |
| 3   | Residential Address | Business Details | Business Details + EDD |
| 4   | Identity Verification | Owners & Representatives | Owners & Representatives |
| 5   | PEP/Sanctions Screening | PEP/Sanctions Screening | PEP/Sanctions Screening |
| 6   | Document Upload | Document Upload | Document Upload (Extended) |
| 7   | Review & Submit | Review & Submit | Review & Submit |

# 4\. International Phone Number Support

# All phone number fields must include a country code selector dropdown followed by the phone number input field

## 4.1 Phone Input Component Structure

| **Component** | **Description** |
| --- | --- |
| Country Code Dropdown | Searchable dropdown with country flag, code (+1, +57, etc.), and country abbreviation |
| Phone Number Input | Numeric input field for local phone number (without country code) |
| Storage Format | E.164 format: +\[country code\]\[number\] (e.g., +573001234567) |

## 4.2 Common Country Codes

| **Country** | **Code** | **Country** | **Code** |
| --- | --- | --- | --- |
| United States | +1  | Colombia | +57 |
| Brazil | +55 | Mexico | +52 |
| United Kingdom | +44 | Germany | +49 |
| Spain | +34 | Hong Kong | +852 |
| Singapore | +65 | UAE | +971 |

# 5\. Country-Specific Entity Types

# When a user selects a country of incorporation, the entity type dropdown must dynamically update to show only the entity types valid for that jurisdiction

## 5.1 United States Entity Types

| **Entity Type** | **API Value** |
| --- | --- |
| Limited Liability Company (LLC) | llc |
| Corporation | corp |
| General Partnership (GP) | partnership |
| Limited Partnership (LP) | lp  |
| Limited Liability Partnership (LLP) | llp |

## 5.2 Colombia Entity Types

| **Entity Type** | **API Value** |
| --- | --- |
| Sociedad por Acciones Simplificada (S.A.S.) | sas |
| Sociedad Anónima (S.A.) | sa  |
| Sociedad de Responsabilidad Limitada (Ltda.) | ltda |
| Sociedad en Comandita por Acciones (S.C.A.) | sca |
| Sociedad en Comandita Simple (S. en C.) | sc  |
| Persona Natural Comerciante | persona_natural |

## 5.3 Brazil Entity Types

| **Entity Type** | **API Value** |
| --- | --- |
| Sociedade Limitada (Ltda.) | ltda |
| Sociedade Anônima (S.A.) | sa  |
| Empresa Individual de Responsabilidade Limitada (EIRELI) | eireli |
| Microempreendedor Individual (MEI) | mei |
| Empresário Individual (EI) | ei  |
| Sociedade em Conta de Participação (SCP) | scp |
| Sociedade Simples | ss  |
| Cooperativa | cooperativa |
| Filial de Empresa Estrangeira | filial |

## 5.4 Mexico Entity Types

| **Entity Type** | **API Value** |
| --- | --- |
| Sociedad Anónima de Capital Variable (S.A. de C.V.) | sa_cv |
| Sociedad Anónima Promotora de Inversión (S.A.P.I.) | sapi |
| Sociedad de Responsabilidad Limitada (S. de R.L.) | srl |
| Sociedad Civil (S.C.) | sc  |
| Sociedad en Comandita Simple (S. en C.S.) | scs |
| Sociedad en Comandita por Acciones (S. en C. por A.) | sca |
| Sociedad en Nombre Colectivo (S. en N.C.) | snc |
| Asociación Civil (A.C.) | ac  |
| Sucursal de Empresa Extranjera | sucursal |
| Persona Física con Actividad Empresarial | persona_fisica |

## 5.5 Default Entity Types (Other Countries)

## For countries not listed above, use the following generic entity types

- Corporation
- Limited Liability Company
- Partnership
- Limited Private Company

# 6\. State/Department/Region Selection

# For countries with predefined administrative divisions (US, Colombia, Brazil, Mexico), display a dropdown menu. For all other countries, display a free-text input field

## 6.1 United States - All 50 States + DC

## When United States is selected as the country, display all 50 states plus District of Columbia

## Alabama (AL), Alaska (AK), Arizona (AZ), Arkansas (AR), California (CA), Colorado (CO), Connecticut (CT), Delaware (DE), Florida (FL), Georgia (GA), Hawaii (HI), Idaho (ID), Illinois (IL), Indiana (IN), Iowa (IA), Kansas (KS), Kentucky (KY), Louisiana (LA), Maine (ME), Maryland (MD), Massachusetts (MA), Michigan (MI), Minnesota (MN), Mississippi (MS), Missouri (MO), Montana (MT), Nebraska (NE), Nevada (NV), New Hampshire (NH), New Jersey (NJ), New Mexico (NM), New York (NY), North Carolina (NC), North Dakota (ND), Ohio (OH), Oklahoma (OK), Oregon (OR), Pennsylvania (PA), Rhode Island (RI), South Carolina (SC), South Dakota (SD), Tennessee (TN), Texas (TX), Utah (UT), Vermont (VT), Virginia (VA), Washington (WA), West Virginia (WV), Wisconsin (WI), Wyoming (WY), District of Columbia (DC)

## 6.2 Colombia - All 33 Departments

## When Colombia is selected, display all departments

## Amazonas, Antioquia, Arauca, Atlántico, Bogotá D.C., Bolívar, Boyacá, Caldas, Caquetá, Casanare, Cauca, Cesar, Chocó, Córdoba, Cundinamarca, Guainía, Guaviare, Huila, La Guajira, Magdalena, Meta, Nariño, Norte de Santander, Putumayo, Quindío, Risaralda, San Andrés y Providencia, Santander, Sucre, Tolima, Valle del Cauca, Vaupés, Vichada

## 6.3 Brazil - All 27 States

## When Brazil is selected, display all states

## Acre (AC), Alagoas (AL), Amapá (AP), Amazonas (AM), Bahia (BA), Ceará (CE), Distrito Federal (DF), Espírito Santo (ES), Goiás (GO), Maranhão (MA), Mato Grosso (MT), Mato Grosso do Sul (MS), Minas Gerais (MG), Pará (PA), Paraíba (PB), Paraná (PR), Pernambuco (PE), Piauí (PI), Rio de Janeiro (RJ), Rio Grande do Norte (RN), Rio Grande do Sul (RS), Rondônia (RO), Roraima (RR), Santa Catarina (SC), São Paulo (SP), Sergipe (SE), Tocantins (TO)

## 6.4 Mexico - All 32 States

## When Mexico is selected, display all states

## Aguascalientes, Baja California, Baja California Sur, Campeche, Chiapas, Chihuahua, Ciudad de México, Coahuila, Colima, Durango, Estado de México, Guanajuato, Guerrero, Hidalgo, Jalisco, Michoacán, Morelos, Nayarit, Nuevo León, Oaxaca, Puebla, Querétaro, Quintana Roo, San Luis Potosí, Sinaloa, Sonora, Tabasco, Tamaulipas, Tlaxcala, Veracruz, Yucatán, Zacatecas

# 7\. Multi-Owner & Multi-Entity Support

# Business accounts must support multiple beneficial owners and/or entity owners. The total ownership percentage must equal exactly 100% before the user can proceed to the next step

## 7.1 Ownership Validation Rules

| **Rule** | **Description** |
| --- | --- |
| Minimum Owners | At least 1 owner required |
| Total Ownership | Must equal exactly 100% |
| Owner Types | Person (individual) or Entity (company) |
| Blocking Validation | "Continue" button disabled until 100% reached |
| Visual Indicator | Progress bar showing ownership allocation |

## 7.2 Person Owner Fields

| **Field** | **Format** | **Required** |
| --- | --- | --- |
| First Name | String | Yes |
| Last Name | String | Yes |
| Email | Email | Yes |
| Phone (with country code) | E.164 | Yes |
| Date of Birth | YYYY-MM-DD | Yes |
| Country of Birth | ISO 3166-1 alpha-2 | Yes |
| Citizenship | ISO 3166-1 alpha-2 | Yes |
| SSN/Tax Number | Country-specific | If US citizen |
| Role | Dropdown | Yes |
| Title | Dropdown | Optional |
| Ownership Percentage | 0-100 | Yes |
| Is Authorized Signer | Boolean | Yes |

## 7.3 Person Owner - Residential Address

| **Field** | **Format** | **Notes** |
| --- | --- | --- |
| Country | Dropdown | Required - determines state dropdown |
| Street Address (Line 1) | String | Required |
| Address Line 2 | String | Optional (Apt, Suite) |
| City | String | Required |
| State/Department/Region | Dropdown or Text | Dropdown for US/CO/BR/MX |
| Postal Code | String | Required |

## 7.4 Entity Owner Fields

## When the owner type is 'Entity' (another company owns shares), collect the following

| **Field** | **Format** | **Required** |
| --- | --- | --- |
| Entity Name | String | Yes |
| Country of Incorporation | Dropdown | Yes |
| Entity Type | Country-specific dropdown | Yes |
| Registration Number | String | Yes |
| Ownership Percentage | 0-100 | Yes |

## 7.5 UI Components for Multi-Owner

- "Add Person" button - Adds a new individual owner card
- "Add Entity" button - Adds a new corporate owner card
- Delete icon on each owner card (hidden if only 1 owner)
- Type toggle dropdown on each card (Person/Entity)
- Ownership progress bar at top showing total allocation
- Color-coded progress: Green (100%), Amber (&lt;100%), Red (&gt;100%)

# 8\. PEP & Sanctions Screening

# All clients-personal and business-must complete Politically Exposed Person (PEP) and sanctions screening. For business accounts, PEP screening applies to all beneficial owners

## 8.1 PEP Screening Questions

- Are you, or any beneficial owner, a senior official in the executive, legislative, administrative, military, or judicial branch of any government (elected or not)?

○ Yes ○ No

- Are you, or any beneficial owner, a senior official of a major political party or senior executive of a government-owned enterprise?

○ Yes ○ No

- Are you, or any beneficial owner, an immediate family member (spouse, parent, sibling, child, or in-law) of any person described above?

○ Yes ○ No

- Are you, or any beneficial owner, a close associate (business partner, advisor, consultant) of any politically exposed person?

○ Yes ○ No

## 8.2 Conditional Follow-up (If Any 'Yes')

## If any PEP question is answered 'Yes', the application is flagged for enhanced review and additional documentation may be requested

## 8.3 Sanctions Lists Screened

- OFAC SDN (Specially Designated Nationals) List
- OFAC Consolidated Sanctions List
- FinCEN 311 Special Measures List
- UN Security Council Consolidated List
- EU Consolidated Sanctions List

# 9\. Document Requirements

## 9.1 Personal Account Documents

| **Document** | **API Type Code** | **Notes** |
| --- | --- | --- |
| Passport OR | passport | Photo page, unexpired |
| Driver's License (Front + Back) OR | driversLicenseFront, driversLicenseBack | Both sides required |
| National ID Card (Front + Back) | idCard, idCardBack | Both sides required |
| Proof of Address | proofOfAddress | Within 90 days |
| Selfie with ID | selfPortrait | Image file only |

## 9.2 Business Account Documents

| **Document** | **API Type Code** | **Notes** |
| --- | --- | --- |
| Formation Document | formationDocument | Articles of Inc./Org. |
| Proof of Registration | proofOfRegistration | Certificate of Good Standing |
| Proof of Ownership | proofOfOwnership | Operating Agreement, Bylaws |
| Bank Statement | bankStatement | Within 90 days |
| Tax ID Verification | taxId | IRS Letter 147C, W-9, etc. |
| Wolfsberg Questionnaire | wolfsbergQuestionnaire | AML questionnaire |
| Signed Agreement | agreement | iTransfr service agreement |
| Business Registration | registration | State/country registration |

## 9.3 Representative/Owner Documents

## Each person owner must provide the same documents as personal accounts: ID document, proof of address, and selfie

## 9.4 FinTech/EDD Additional Documents

- MSB Registration Certificate (msbCert)
- State Money Transmitter License(s) (mtlLicense)
- AML/BSA Policy Document (amlPolicy)
- Independent AML Audit Report (amlAudit)
- SOC 2 Report (if available)
- Transaction Flow Diagram

# 10\. API Integration Summary

## 10.1 Endpoint Reference

| **Method** | **Endpoint** | **Purpose** |
| --- | --- | --- |
| POST | /platform/client | Create new client |
| PUT | /platform/client/personal/{id} | Update personal client |
| PUT | /platform/client/business/{id} | Update business client |
| POST | /platform/client/personal/{id}/document | Upload personal docs |
| POST | /platform/client/business/{id}/document | Upload business docs |
| POST | /platform/client/business/{id}/representative | Add owner/representative |
| PUT | /platform/client/business/{id}/representative/{repId} | Update representative |
| POST | /platform/client/business/{id}/representative/{repId}/document | Upload rep docs |
| POST | /platform/client/{id}/submit | Submit for review |
| GET | /platform/account-request | Check status |

## 10.2 Submission Provider

## When submitting clients for account opening, use provider code 'SSB' in the submission request body

# 11\. UI/UX Flow Recommendations

## 11.1 Screen Progression - Business Account

- Welcome Screen → Select Account Type (Personal / Business / FinTech)
- Business Information (country, name, tax ID, entity type, state)
- Business Details (industry, description, EDD questions if applicable)
- Owners & Representatives (multi-owner with 100% validation)
- PEP Screening (for all owners)
- Document Upload (business + owner documents)
- Review & Submit

## 11.2 Dynamic Field Behavior

- Country selection triggers entity type dropdown update
- Country selection triggers state/region field type (dropdown vs text)
- US citizenship triggers SSN field display
- Ownership percentage updates progress bar in real-time
- Continue button disabled until ownership = 100%

## 11.3 Validation Messages

- < 100%: "X% remaining to allocate" (amber)
- \> 100%: "Ownership exceeds 100%" (red)
- \= 100%: Progress bar turns green, continue enabled

_- End of Document -_

iTransfr | FinCEN Registered MSB | Miami • Medellín • São Paulo
