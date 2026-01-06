// Business-related constants for iTransfr onboarding
// Updated to match iTransfr-Admin-MVP comprehensive options

export const INDUSTRIES = [
  { value: 'import_export', label: 'Import/Export Trading' },
  { value: 'ecommerce', label: 'E-commerce / Online Retail' },
  { value: 'digital_services', label: 'Digital Services / Software' },
  { value: 'marketing', label: 'Marketing / Advertising Agency' },
  { value: 'consulting', label: 'Consulting / Professional Services' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'logistics', label: 'Logistics / Freight' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'healthcare', label: 'Healthcare / Medical' },
  { value: 'fintech', label: 'FinTech / Financial Services' },
  { value: 'crypto', label: 'Cryptocurrency / Blockchain' },
  { value: 'payments', label: 'Payment Processing / MSB' },
  { value: 'remittance', label: 'Remittance Services' },
  { value: 'travel', label: 'Travel / Hospitality' },
  { value: 'education', label: 'Education / EdTech' },
  { value: 'entertainment', label: 'Entertainment / Media' },
  { value: 'food', label: 'Food & Beverage' },
  { value: 'retail', label: 'Retail / Wholesale' },
  { value: 'construction', label: 'Construction' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'other', label: 'Other' },
];

export const PRIMARY_USE_CASES = [
  { value: 'supplier_payments', label: 'Supplier Payments' },
  { value: 'payroll', label: 'Payroll / Contractor Payments' },
  { value: 'collections', label: 'Collections / Receivables' },
  { value: 'treasury', label: 'Treasury Management' },
  { value: 'fx', label: 'Foreign Exchange' },
  { value: 'remittance', label: 'Remittance / Money Transfer' },
  { value: 'trade_finance', label: 'Trade Finance' },
  { value: 'other', label: 'Other' },
];

export const EXPECTED_MONTHLY_VOLUMES = [
  { value: '0-10000', label: '$0 - $10,000' },
  { value: '10000-50000', label: '$10,000 - $50,000' },
  { value: '50000-100000', label: '$50,000 - $100,000' },
  { value: '100000-500000', label: '$100,000 - $500,000' },
  { value: '500000-1000000', label: '$500,000 - $1,000,000' },
  { value: '1000000+', label: '$1,000,000+' },
];

// Volume options for Step 4 (matching Replit MVP format)
export const VOLUME_OPTIONS = [
  { value: 'less_than_10000', label: 'Less than $10,000' },
  { value: '10000-50000', label: '$10,000 - $50,000' },
  { value: '50000-100000', label: '$50,000 - $100,000' },
  { value: '100000-500000', label: '$100,000 - $500,000' },
  { value: '500000-1000000', label: '$500,000 - $1,000,000' },
  { value: '1000000-5000000', label: '$1,000,000 - $5,000,000' },
  { value: 'more_than_5000000', label: 'More than $5,000,000' },
];

// Transaction count options per month
export const TRANSACTION_COUNT_OPTIONS = [
  { value: '1-10', label: '1 - 10 payments' },
  { value: '11-50', label: '11 - 50 payments' },
  { value: '51-100', label: '51 - 100 payments' },
  { value: '101-500', label: '101 - 500 payments' },
  { value: '500+', label: 'More then 500 payments' },
];

// Operating currencies
export const OPERATING_CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollars' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'BRL', label: 'BRL - Brazilian Real' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'COP', label: 'COP - Colombian Peso' },
  { value: 'MXN', label: 'MXN - Mexican Peso' },
  { value: 'ARS', label: 'ARS - Argentine Peso' },
  { value: 'CLP', label: 'CLP - Chilean Peso' },
  { value: 'PEN', label: 'PEN - Peruvian Sol' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
  { value: 'HKD', label: 'HKD - Hong Kong Dollar' },
];

// Operating regions
export const OPERATING_REGIONS = [
  { value: 'north_america', label: 'North America' },
  { value: 'latam', label: 'Latin America & Caribbean' },
  { value: 'europe', label: 'Europe' },
  { value: 'mea', label: 'Middle East & Africa' },
  { value: 'apac', label: 'Asia Pacific' },
];

// Sub-regions for North America
export const NORTH_AMERICA_SUBREGIONS = ['United States', 'Canada', 'Mexico'];

// Employment status options (matching Replit MVP)
export const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'retired', label: 'Retired' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'student', label: 'Student' },
];

// Annual income options (matching Replit MVP)
export const ANNUAL_INCOME_OPTIONS = [
  { value: 'under_50k', label: 'Under $50,000' },
  { value: '50k_100k', label: '$50,000 - $100,000' },
  { value: '100k_250k', label: '$100,000 - $250,000' },
  { value: '250k_500k', label: '$250,000 - $500,000' },
  { value: '500k_1m', label: '$500,000 - $1,000,000' },
  { value: 'over_1m', label: 'Over $1,000,000' },
];

// Source of funds options (matching Replit MVP)
export const SOURCE_OF_FUNDS_OPTIONS = [
  { value: "salary", label: "Salary / Wages" },
  { value: "business_income", label: "Business Income" },
  { value: "investments", label: "Investments / Dividends" },
  { value: "rental_income", label: "Rental Income" },
  { value: "pension", label: "Pension / Retirement" },
  { value: "inheritance", label: "Inheritance" },
  { value: "other", label: "Other" },
];


// export const INCOME_SOURCES = [
//   { value: "salary", label: "Salary / Wages" },
//   { value: "business_income", label: "Business Income" },
//   { value: "investments", label: "Investments / Dividends" },
//   { value: "rental_income", label: "Rental Income" },
//   { value: "pension", label: "Pension / Retirement" },
//   { value: "inheritance", label: "Inheritance" },
//   { value: "other", label: "Other" },
// ];

// Source of wealth options (matching Replit MVP)
export const SOURCE_OF_WEALTH_OPTIONS = [
  { value: "savings", label: "Savings from Employment" },
  { value: "business_sale", label: "Sale of Business" },
  { value: "investments", label: "Investment Returns" },
  { value: "inheritance", label: "Inheritance / Gift" },
  { value: "real_estate", label: "Real Estate" },
  { value: "other", label: "Other" },
];

// ID type options
export const ID_TYPE_OPTIONS = [
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'national_id', label: 'National ID' },
  { value: 'residence_permit', label: 'Residence Permit' },
];

// Employment industry options
export const EMPLOYMENT_INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'education', label: 'Education' },
  { value: 'government', label: 'Government' },
  { value: 'legal', label: 'Legal' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'other', label: 'Other' },
];

// Entity type options for entity owners (generic)
export const ENTITY_TYPE_OPTIONS = [
  { value: 'llc', label: 'LLC' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'trust', label: 'Trust' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'other', label: 'Other' },
];

// Document types for business
export const BUSINESS_DOCUMENT_TYPES = [
  { value: 'formation_document', label: 'Formation Document / Articles of Incorporation' },
  { value: 'registration_document', label: 'Business Registration / Certificate' },
  { value: 'ownership_structure', label: 'Ownership Structure Document' },
  { value: 'bank_statement', label: 'Bank Statement (Last 3 months)' },
  { value: 'tax_id_document', label: 'Tax ID Document' },
  { value: 'good_standing', label: 'Certificate of Good Standing' },
  { value: 'bylaws', label: 'Bylaws / Operating Agreement' },
  { value: 'resolution', label: 'Board Resolution' },
];

// Document types for representatives
export const REPRESENTATIVE_DOCUMENT_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'id_front', label: 'ID Card (Front)' },
  { value: 'id_back', label: 'ID Card (Back)' },
  { value: 'drivers_license_front', label: "Driver's License (Front)" },
  { value: 'drivers_license_back', label: "Driver's License (Back)" },
  { value: 'proof_of_address', label: 'Proof of Address' },
  { value: 'selfie', label: 'Selfie with ID' },
];
