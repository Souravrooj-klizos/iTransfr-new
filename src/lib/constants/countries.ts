// Country-specific configurations for iTransfr onboarding
// Based on iTransfr_Onboarding_Flow_Guide_v3.md

export interface CountryData {
  name: string;
  code: string; // ISO 3166-1 alpha-2
  phoneCode: string;
  entityTypes: { label: string; value: string }[];
  hasStateDropdown: boolean;
  states?: { label: string; value: string }[];
}

// Supported countries with their specific configurations
export const SUPPORTED_COUNTRIES: CountryData[] = [
  // United States
  {
    name: 'United States',
    code: 'US',
    phoneCode: '+1',
    hasStateDropdown: true,
    entityTypes: [
      { label: 'Limited Liability Company (LLC)', value: 'llc' },
      { label: 'Corporation', value: 'corp' },
      { label: 'General Partnership (GP)', value: 'partnership' },
      { label: 'Limited Partnership (LP)', value: 'lp' },
      { label: 'Limited Liability Partnership (LLP)', value: 'llp' },
    ],
    states: [
      { label: 'Alabama', value: 'AL' },
      { label: 'Alaska', value: 'AK' },
      { label: 'Arizona', value: 'AZ' },
      { label: 'Arkansas', value: 'AR' },
      { label: 'California', value: 'CA' },
      { label: 'Colorado', value: 'CO' },
      { label: 'Connecticut', value: 'CT' },
      { label: 'Delaware', value: 'DE' },
      { label: 'Florida', value: 'FL' },
      { label: 'Georgia', value: 'GA' },
      { label: 'Hawaii', value: 'HI' },
      { label: 'Idaho', value: 'ID' },
      { label: 'Illinois', value: 'IL' },
      { label: 'Indiana', value: 'IN' },
      { label: 'Iowa', value: 'IA' },
      { label: 'Kansas', value: 'KS' },
      { label: 'Kentucky', value: 'KY' },
      { label: 'Louisiana', value: 'LA' },
      { label: 'Maine', value: 'ME' },
      { label: 'Maryland', value: 'MD' },
      { label: 'Massachusetts', value: 'MA' },
      { label: 'Michigan', value: 'MI' },
      { label: 'Minnesota', value: 'MN' },
      { label: 'Mississippi', value: 'MS' },
      { label: 'Missouri', value: 'MO' },
      { label: 'Montana', value: 'MT' },
      { label: 'Nebraska', value: 'NE' },
      { label: 'Nevada', value: 'NV' },
      { label: 'New Hampshire', value: 'NH' },
      { label: 'New Jersey', value: 'NJ' },
      { label: 'New Mexico', value: 'NM' },
      { label: 'New York', value: 'NY' },
      { label: 'North Carolina', value: 'NC' },
      { label: 'North Dakota', value: 'ND' },
      { label: 'Ohio', value: 'OH' },
      { label: 'Oklahoma', value: 'OK' },
      { label: 'Oregon', value: 'OR' },
      { label: 'Pennsylvania', value: 'PA' },
      { label: 'Rhode Island', value: 'RI' },
      { label: 'South Carolina', value: 'SC' },
      { label: 'South Dakota', value: 'SD' },
      { label: 'Tennessee', value: 'TN' },
      { label: 'Texas', value: 'TX' },
      { label: 'Utah', value: 'UT' },
      { label: 'Vermont', value: 'VT' },
      { label: 'Virginia', value: 'VA' },
      { label: 'Washington', value: 'WA' },
      { label: 'West Virginia', value: 'WV' },
      { label: 'Wisconsin', value: 'WI' },
      { label: 'Wyoming', value: 'WY' },
      { label: 'District of Columbia', value: 'DC' },
    ],
  },

  // United Arab Emirates
  {
    name: 'United Arab Emirates',
    code: 'AE',
    phoneCode: '+971',
    hasStateDropdown: true,
    entityTypes: [
      { label: 'Corporation', value: 'corporation' },
      { label: 'Limited Liability Company', value: 'llc' },
      { label: 'Partnership', value: 'partnership' },
      { label: 'Limited Private Company', value: 'limited_private' },
    ],
    states: [
      { label: 'Abu Dhabi', value: 'AZ' },
      { label: 'Dubai', value: 'DU' },
      { label: 'Sharjah', value: 'SH' },
      { label: 'Ajman', value: 'AJ' },
      { label: 'Umm Al Quwain', value: 'UQ' },
      { label: 'Ras Al Khaimah', value: 'RK' },
      { label: 'Fujairah', value: 'FU' },
    ],
  },

  // Hong Kong
  {
    name: 'Hong Kong',
    code: 'HK',
    phoneCode: '+852',
    hasStateDropdown: true,
    entityTypes: [
      { label: 'Corporation', value: 'corporation' },
      { label: 'Limited Liability Company', value: 'llc' },
      { label: 'Partnership', value: 'partnership' },
      { label: 'Limited Private Company', value: 'limited_private' },
    ],
    states: [
      { label: 'Hong Kong Island', value: 'HKI' },
      { label: 'Kowloon', value: 'KLN' },
      { label: 'New Territories', value: 'NT' },
    ],
  },

  // Brazil
  {
    name: 'Brazil',
    code: 'BR',
    phoneCode: '+55',
    hasStateDropdown: true,
    entityTypes: [
      { label: 'Sociedade Limitada (Ltda.)', value: 'ltda' },
      { label: 'Sociedade Anônima (S.A.)', value: 'sa' },
      { label: 'Empresa Individual de Responsabilidade Limitada (EIRELI)', value: 'eireli' },
      { label: 'Microempreendedor Individual (MEI)', value: 'mei' },
      { label: 'Empresário Individual (EI)', value: 'ei' },
      { label: 'Sociedade em Conta de Participação (SCP)', value: 'scp' },
      { label: 'Sociedade Simples', value: 'ss' },
      { label: 'Cooperativa', value: 'cooperativa' },
      { label: 'Filial de Empresa Estrangeira', value: 'filial' },
    ],
    states: [
      { label: 'Acre', value: 'AC' },
      { label: 'Alagoas', value: 'AL' },
      { label: 'Amapá', value: 'AP' },
      { label: 'Amazonas', value: 'AM' },
      { label: 'Bahia', value: 'BA' },
      { label: 'Ceará', value: 'CE' },
      { label: 'Distrito Federal', value: 'DF' },
      { label: 'Espírito Santo', value: 'ES' },
      { label: 'Goiás', value: 'GO' },
      { label: 'Maranhão', value: 'MA' },
      { label: 'Mato Grosso', value: 'MT' },
      { label: 'Mato Grosso do Sul', value: 'MS' },
      { label: 'Minas Gerais', value: 'MG' },
      { label: 'Pará', value: 'PA' },
      { label: 'Paraíba', value: 'PB' },
      { label: 'Paraná', value: 'PR' },
      { label: 'Pernambuco', value: 'PE' },
      { label: 'Piauí', value: 'PI' },
      { label: 'Rio de Janeiro', value: 'RJ' },
      { label: 'Rio Grande do Norte', value: 'RN' },
      { label: 'Rio Grande do Sul', value: 'RS' },
      { label: 'Rondônia', value: 'RO' },
      { label: 'Roraima', value: 'RR' },
      { label: 'Santa Catarina', value: 'SC' },
      { label: 'São Paulo', value: 'SP' },
      { label: 'Sergipe', value: 'SE' },
      { label: 'Tocantins', value: 'TO' },
    ],
  },

  // Canada
  {
    name: 'Canada',
    code: 'CA',
    phoneCode: '+1',
    hasStateDropdown: true,
    entityTypes: [
      { label: 'Corporation', value: 'corporation' },
      { label: 'Limited Liability Company', value: 'llc' },
      { label: 'Partnership', value: 'partnership' },
      { label: 'Limited Private Company', value: 'limited_private' },
    ],
    states: [
      { label: 'Alberta', value: 'AB' },
      { label: 'British Columbia', value: 'BC' },
      { label: 'Manitoba', value: 'MB' },
      { label: 'New Brunswick', value: 'NB' },
      { label: 'Newfoundland and Labrador', value: 'NL' },
      { label: 'Northwest Territories', value: 'NT' },
      { label: 'Nova Scotia', value: 'NS' },
      { label: 'Nunavut', value: 'NU' },
      { label: 'Ontario', value: 'ON' },
      { label: 'Prince Edward Island', value: 'PE' },
      { label: 'Quebec', value: 'QC' },
      { label: 'Saskatchewan', value: 'SK' },
      { label: 'Yukon', value: 'YT' },
    ],
  },

  // Saudi Arabia
  {
    name: 'Saudi Arabia',
    code: 'SA',
    phoneCode: '+966',
    hasStateDropdown: true,
    entityTypes: [
      { label: 'Corporation', value: 'corporation' },
      { label: 'Limited Liability Company', value: 'llc' },
      { label: 'Partnership', value: 'partnership' },
      { label: 'Limited Private Company', value: 'limited_private' },
    ],
    states: [
      { label: 'Riyadh', value: 'RD' },
      { label: 'Makkah', value: 'MK' },
      { label: 'Madinah', value: 'MD' },
      { label: 'Eastern Province', value: 'EP' },
      { label: 'Qassim', value: 'QS' },
      { label: 'Hail', value: 'HL' },
      { label: 'Tabuk', value: 'TB' },
      { label: 'Northern Borders', value: 'NB' },
      { label: 'Jazan', value: 'JZ' },
      { label: 'Najran', value: 'NJ' },
      { label: 'Al-Baha', value: 'BA' },
      { label: 'Al-Jouf', value: 'JF' },
      { label: 'Asir', value: 'AS' },
    ],
  },
];

// Helper functions
export function getCountryByCode(code: string): CountryData | undefined {
  return SUPPORTED_COUNTRIES.find(country => country.code === code);
}

export function getCountryByName(name: string): CountryData | undefined {
  return SUPPORTED_COUNTRIES.find(country => country.name === name);
}

export function getEntityTypesForCountry(countryCode: string): { label: string; value: string }[] {
  const country = getCountryByCode(countryCode);
  return (
    country?.entityTypes || [
      { label: 'Corporation', value: 'corporation' },
      { label: 'Limited Liability Company', value: 'llc' },
      { label: 'Partnership', value: 'partnership' },
      { label: 'Limited Private Company', value: 'limited_private' },
    ]
  );
}

export function getStatesForCountry(
  countryCode: string
): { label: string; value: string }[] | null {
  const country = getCountryByCode(countryCode);
  return country?.hasStateDropdown ? country.states || [] : null;
}

export function hasStateDropdown(countryCode: string): boolean {
  const country = getCountryByCode(countryCode);
  return country?.hasStateDropdown || false;
}

// Country options for dropdowns
export const COUNTRY_OPTIONS = SUPPORTED_COUNTRIES.map(country => ({
  label: country.name,
  value: country.code,
}));

// Phone code mapping
export const PHONE_CODE_MAP: Record<string, string> = {};
SUPPORTED_COUNTRIES.forEach(country => {
  PHONE_CODE_MAP[country.code] = country.phoneCode;
});

// Phone code options for dropdowns - use country code for unique values
export const PHONE_CODE_OPTIONS = SUPPORTED_COUNTRIES.map(country => ({
  label: `${country.code} (${country.phoneCode})`,
  value: `${country.code}:${country.phoneCode}`, // Unique: "US:+1", "CA:+1"
}));
