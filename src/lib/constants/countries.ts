// Country-specific configurations for iTransfr onboarding
// Updated to match iTransfr-Admin-MVP comprehensive country list

export interface CountryData {
  name: string;
  code: string; // ISO 3166-1 alpha-2
  phoneCode: string;
  entityTypes: { label: string; value: string }[];
  hasStateDropdown: boolean;
  states?: { label: string; value: string }[];
}

// Excluded countries (sanctions/high-risk)
export const EXCLUDED_COUNTRIES = ["RU", "UA", "BY", "CU", "IL", "VE", "IR", "YE", "SO", "KP"];

// Full list of supported countries with their specific configurations
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
      { label: 'District of Columbia', value: 'DC' },
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
    ],
  },

  // Colombia
  {
    name: 'Colombia',
    code: 'CO',
    phoneCode: '+57',
    hasStateDropdown: true,
    entityTypes: [
      { label: 'Sociedad por Acciones Simplificada (S.A.S.)', value: 'sas' },
      { label: 'Sociedad Anónima (S.A.)', value: 'sa' },
      { label: 'Sociedad de Responsabilidad Limitada (Ltda.)', value: 'ltda' },
      { label: 'Sociedad en Comandita por Acciones (S.C.A.)', value: 'sca' },
      { label: 'Sociedad en Comandita Simple (S. en C.)', value: 'sc' },
      { label: 'Persona Natural Comerciante', value: 'persona_natural' },
    ],
    states: [
      { label: 'Amazonas', value: 'AMA' },
      { label: 'Antioquia', value: 'ANT' },
      { label: 'Arauca', value: 'ARA' },
      { label: 'Atlántico', value: 'ATL' },
      { label: 'Bogotá D.C.', value: 'BOG' },
      { label: 'Bolívar', value: 'BOL' },
      { label: 'Boyacá', value: 'BOY' },
      { label: 'Caldas', value: 'CAL' },
      { label: 'Caquetá', value: 'CAQ' },
      { label: 'Casanare', value: 'CAS' },
      { label: 'Cauca', value: 'CAU' },
      { label: 'Cesar', value: 'CES' },
      { label: 'Chocó', value: 'CHO' },
      { label: 'Córdoba', value: 'COR' },
      { label: 'Cundinamarca', value: 'CUN' },
      { label: 'Guainía', value: 'GUA' },
      { label: 'Guaviare', value: 'GUV' },
      { label: 'Huila', value: 'HUI' },
      { label: 'La Guajira', value: 'LAG' },
      { label: 'Magdalena', value: 'MAG' },
      { label: 'Meta', value: 'MET' },
      { label: 'Nariño', value: 'NAR' },
      { label: 'Norte de Santander', value: 'NSA' },
      { label: 'Putumayo', value: 'PUT' },
      { label: 'Quindío', value: 'QUI' },
      { label: 'Risaralda', value: 'RIS' },
      { label: 'San Andrés y Providencia', value: 'SAP' },
      { label: 'Santander', value: 'SAN' },
      { label: 'Sucre', value: 'SUC' },
      { label: 'Tolima', value: 'TOL' },
      { label: 'Valle del Cauca', value: 'VAC' },
      { label: 'Vaupés', value: 'VAU' },
      { label: 'Vichada', value: 'VID' },
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

  // Mexico
  {
    name: 'Mexico',
    code: 'MX',
    phoneCode: '+52',
    hasStateDropdown: true,
    entityTypes: [
      { label: 'Sociedad Anónima de Capital Variable (S.A. de C.V.)', value: 'sa_cv' },
      { label: 'Sociedad Anónima Promotora de Inversión (S.A.P.I.)', value: 'sapi' },
      { label: 'Sociedad de Responsabilidad Limitada (S. de R.L.)', value: 'srl' },
      { label: 'Sociedad Civil (S.C.)', value: 'sc' },
      { label: 'Sociedad en Comandita Simple (S. en C.S.)', value: 'scs' },
      { label: 'Sociedad en Comandita por Acciones (S. en C. por A.)', value: 'sca' },
      { label: 'Sociedad en Nombre Colectivo (S. en N.C.)', value: 'snc' },
      { label: 'Asociación Civil (A.C.)', value: 'ac' },
      { label: 'Sucursal de Empresa Extranjera', value: 'sucursal' },
      { label: 'Persona Física con Actividad Empresarial', value: 'persona_fisica' },
    ],
    states: [
      { label: 'Aguascalientes', value: 'AGU' },
      { label: 'Baja California', value: 'BCN' },
      { label: 'Baja California Sur', value: 'BCS' },
      { label: 'Campeche', value: 'CAM' },
      { label: 'Chiapas', value: 'CHP' },
      { label: 'Chihuahua', value: 'CHH' },
      { label: 'Ciudad de México', value: 'CMX' },
      { label: 'Coahuila', value: 'COA' },
      { label: 'Colima', value: 'COL' },
      { label: 'Durango', value: 'DUR' },
      { label: 'Estado de México', value: 'MEX' },
      { label: 'Guanajuato', value: 'GUA' },
      { label: 'Guerrero', value: 'GRO' },
      { label: 'Hidalgo', value: 'HID' },
      { label: 'Jalisco', value: 'JAL' },
      { label: 'Michoacán', value: 'MIC' },
      { label: 'Morelos', value: 'MOR' },
      { label: 'Nayarit', value: 'NAY' },
      { label: 'Nuevo León', value: 'NLE' },
      { label: 'Oaxaca', value: 'OAX' },
      { label: 'Puebla', value: 'PUE' },
      { label: 'Querétaro', value: 'QUE' },
      { label: 'Quintana Roo', value: 'ROO' },
      { label: 'San Luis Potosí', value: 'SLP' },
      { label: 'Sinaloa', value: 'SIN' },
      { label: 'Sonora', value: 'SON' },
      { label: 'Tabasco', value: 'TAB' },
      { label: 'Tamaulipas', value: 'TAM' },
      { label: 'Tlaxcala', value: 'TLA' },
      { label: 'Veracruz', value: 'VER' },
      { label: 'Yucatán', value: 'YUC' },
      { label: 'Zacatecas', value: 'ZAC' },
    ],
  },

  // United Kingdom
  {
    name: 'United Kingdom',
    code: 'GB',
    phoneCode: '+44',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Private Limited Company (Ltd)', value: 'ltd' },
      { label: 'Public Limited Company (PLC)', value: 'plc' },
      { label: 'Limited Liability Partnership (LLP)', value: 'llp' },
      { label: 'General Partnership', value: 'partnership' },
      { label: 'Sole Trader', value: 'sole_trader' },
    ],
  },

  // Germany
  {
    name: 'Germany',
    code: 'DE',
    phoneCode: '+49',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Gesellschaft mit beschränkter Haftung (GmbH)', value: 'gmbh' },
      { label: 'Aktiengesellschaft (AG)', value: 'ag' },
      { label: 'Kommanditgesellschaft (KG)', value: 'kg' },
      { label: 'Offene Handelsgesellschaft (OHG)', value: 'ohg' },
      { label: 'Einzelunternehmen', value: 'einzelunternehmen' },
    ],
  },

  // Spain
  {
    name: 'Spain',
    code: 'ES',
    phoneCode: '+34',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Sociedad Limitada (S.L.)', value: 'sl' },
      { label: 'Sociedad Anónima (S.A.)', value: 'sa' },
      { label: 'Sociedad Limitada Nueva Empresa (S.L.N.E.)', value: 'slne' },
      { label: 'Sociedad Colectiva', value: 'sc' },
      { label: 'Autónomo', value: 'autonomo' },
    ],
  },

  // France
  {
    name: 'France',
    code: 'FR',
    phoneCode: '+33',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Société à Responsabilité Limitée (SARL)', value: 'sarl' },
      { label: 'Société par Actions Simplifiée (SAS)', value: 'sas' },
      { label: 'Société Anonyme (SA)', value: 'sa' },
      { label: 'Entreprise Individuelle (EI)', value: 'ei' },
      { label: 'Auto-entrepreneur', value: 'auto_entrepreneur' },
    ],
  },

  // Italy
  {
    name: 'Italy',
    code: 'IT',
    phoneCode: '+39',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Società a Responsabilità Limitata (S.r.l.)', value: 'srl' },
      { label: 'Società per Azioni (S.p.A.)', value: 'spa' },
      { label: 'Società in Nome Collettivo (S.n.c.)', value: 'snc' },
      { label: 'Società in Accomandita Semplice (S.a.s.)', value: 'sas' },
      { label: 'Ditta Individuale', value: 'ditta_individuale' },
    ],
  },

  // Netherlands
  {
    name: 'Netherlands',
    code: 'NL',
    phoneCode: '+31',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Besloten Vennootschap (B.V.)', value: 'bv' },
      { label: 'Naamloze Vennootschap (N.V.)', value: 'nv' },
      { label: 'Vennootschap onder Firma (V.O.F.)', value: 'vof' },
      { label: 'Eenmanszaak', value: 'eenmanszaak' },
    ],
  },

  // Switzerland
  {
    name: 'Switzerland',
    code: 'CH',
    phoneCode: '+41',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Gesellschaft mit beschränkter Haftung (GmbH)', value: 'gmbh' },
      { label: 'Aktiengesellschaft (AG)', value: 'ag' },
      { label: 'Kommanditgesellschaft', value: 'kg' },
      { label: 'Kollektivgesellschaft', value: 'kollektiv' },
      { label: 'Einzelunternehmen', value: 'einzelunternehmen' },
    ],
  },

  // Canada
  {
    name: 'Canada',
    code: 'CA',
    phoneCode: '+1',
    hasStateDropdown: true,
    entityTypes: [
      { label: 'Corporation', value: 'corp' },
      { label: 'Limited Company', value: 'ltd' },
      { label: 'Unlimited Liability Company', value: 'ulc' },
      { label: 'Partnership', value: 'partnership' },
      { label: 'Sole Proprietorship', value: 'sole_proprietor' },
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

  // Australia
  {
    name: 'Australia',
    code: 'AU',
    phoneCode: '+61',
    hasStateDropdown: true,
    entityTypes: [
      { label: 'Proprietary Limited Company (Pty Ltd)', value: 'pty_ltd' },
      { label: 'Public Company Limited (Ltd)', value: 'ltd' },
      { label: 'Partnership', value: 'partnership' },
      { label: 'Sole Trader', value: 'sole_trader' },
      { label: 'Trust', value: 'trust' },
    ],
    states: [
      { label: 'Australian Capital Territory', value: 'ACT' },
      { label: 'New South Wales', value: 'NSW' },
      { label: 'Northern Territory', value: 'NT' },
      { label: 'Queensland', value: 'QLD' },
      { label: 'South Australia', value: 'SA' },
      { label: 'Tasmania', value: 'TAS' },
      { label: 'Victoria', value: 'VIC' },
      { label: 'Western Australia', value: 'WA' },
    ],
  },

  // Japan
  {
    name: 'Japan',
    code: 'JP',
    phoneCode: '+81',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Kabushiki Kaisha (K.K.)', value: 'kk' },
      { label: 'Godo Kaisha (G.K.)', value: 'gk' },
      { label: 'Gomei Kaisha', value: 'gomei' },
      { label: 'Goshi Kaisha', value: 'goshi' },
    ],
  },

  // South Korea
  {
    name: 'South Korea',
    code: 'KR',
    phoneCode: '+82',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Chusik Hoesa (주식회사)', value: 'chusik_hoesa' },
      { label: 'Yuhan Hoesa (유한회사)', value: 'yuhan_hoesa' },
      { label: 'Yuhan Chaekim Hoesa (유한책임회사)', value: 'yuhan_chaekim' },
      { label: 'Hapmyung Hoesa (합명회사)', value: 'hapmyung' },
    ],
  },

  // Singapore
  {
    name: 'Singapore',
    code: 'SG',
    phoneCode: '+65',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Private Limited Company (Pte Ltd)', value: 'pte_ltd' },
      { label: 'Public Company Limited (Ltd)', value: 'ltd' },
      { label: 'Limited Liability Partnership (LLP)', value: 'llp' },
      { label: 'Sole Proprietorship', value: 'sole_proprietor' },
    ],
  },

  // Hong Kong
  {
    name: 'Hong Kong',
    code: 'HK',
    phoneCode: '+852',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Private Limited Company', value: 'private_ltd' },
      { label: 'Public Limited Company', value: 'public_ltd' },
      { label: 'Limited Liability Partnership', value: 'llp' },
      { label: 'Sole Proprietorship', value: 'sole_proprietor' },
    ],
  },

  // United Arab Emirates
  {
    name: 'United Arab Emirates',
    code: 'AE',
    phoneCode: '+971',
    hasStateDropdown: true,
    entityTypes: [
      { label: 'Limited Liability Company (LLC)', value: 'llc' },
      { label: 'Public Joint Stock Company (PJSC)', value: 'pjsc' },
      { label: 'Private Joint Stock Company', value: 'private_jsc' },
      { label: 'Free Zone Company', value: 'freezone' },
      { label: 'Branch Office', value: 'branch' },
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

  // Saudi Arabia
  {
    name: 'Saudi Arabia',
    code: 'SA',
    phoneCode: '+966',
    hasStateDropdown: true,
    entityTypes: [
      { label: 'Limited Liability Company (LLC)', value: 'llc' },
      { label: 'Joint Stock Company', value: 'jsc' },
      { label: 'Partnership', value: 'partnership' },
      { label: 'Branch Office', value: 'branch' },
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

  // India
  {
    name: 'India',
    code: 'IN',
    phoneCode: '+91',
    hasStateDropdown: true,
    entityTypes: [
      { label: 'Private Limited Company', value: 'pvt_ltd' },
      { label: 'Public Limited Company', value: 'public_ltd' },
      { label: 'Limited Liability Partnership (LLP)', value: 'llp' },
      { label: 'Partnership Firm', value: 'partnership' },
      { label: 'Sole Proprietorship', value: 'sole_proprietor' },
      { label: 'One Person Company (OPC)', value: 'opc' },
    ],
    states: [
      { label: 'Andhra Pradesh', value: 'AP' },
      { label: 'Arunachal Pradesh', value: 'AR' },
      { label: 'Assam', value: 'AS' },
      { label: 'Bihar', value: 'BR' },
      { label: 'Chhattisgarh', value: 'CT' },
      { label: 'Goa', value: 'GA' },
      { label: 'Gujarat', value: 'GJ' },
      { label: 'Haryana', value: 'HR' },
      { label: 'Himachal Pradesh', value: 'HP' },
      { label: 'Jharkhand', value: 'JH' },
      { label: 'Karnataka', value: 'KA' },
      { label: 'Kerala', value: 'KL' },
      { label: 'Madhya Pradesh', value: 'MP' },
      { label: 'Maharashtra', value: 'MH' },
      { label: 'Manipur', value: 'MN' },
      { label: 'Meghalaya', value: 'ML' },
      { label: 'Mizoram', value: 'MZ' },
      { label: 'Nagaland', value: 'NL' },
      { label: 'Odisha', value: 'OR' },
      { label: 'Punjab', value: 'PB' },
      { label: 'Rajasthan', value: 'RJ' },
      { label: 'Sikkim', value: 'SK' },
      { label: 'Tamil Nadu', value: 'TN' },
      { label: 'Telangana', value: 'TG' },
      { label: 'Tripura', value: 'TR' },
      { label: 'Uttar Pradesh', value: 'UP' },
      { label: 'Uttarakhand', value: 'UT' },
      { label: 'West Bengal', value: 'WB' },
      { label: 'Delhi', value: 'DL' },
    ],
  },

  // China
  {
    name: 'China',
    code: 'CN',
    phoneCode: '+86',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Wholly Foreign-Owned Enterprise (WFOE)', value: 'wfoe' },
      { label: 'Joint Venture (JV)', value: 'jv' },
      { label: 'Representative Office', value: 'rep_office' },
      { label: 'Limited Liability Company', value: 'llc' },
    ],
  },

  // Argentina
  {
    name: 'Argentina',
    code: 'AR',
    phoneCode: '+54',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Sociedad Anónima (S.A.)', value: 'sa' },
      { label: 'Sociedad de Responsabilidad Limitada (S.R.L.)', value: 'srl' },
      { label: 'Sociedad Colectiva', value: 'sc' },
      { label: 'Unipersonal', value: 'unipersonal' },
    ],
  },

  // Chile
  {
    name: 'Chile',
    code: 'CL',
    phoneCode: '+56',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Sociedad Anónima (S.A.)', value: 'sa' },
      { label: 'Sociedad por Acciones (SpA)', value: 'spa' },
      { label: 'Sociedad de Responsabilidad Limitada (Ltda.)', value: 'ltda' },
      { label: 'Empresa Individual de Responsabilidad Limitada (E.I.R.L.)', value: 'eirl' },
    ],
  },

  // Peru
  {
    name: 'Peru',
    code: 'PE',
    phoneCode: '+51',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Sociedad Anónima Cerrada (S.A.C.)', value: 'sac' },
      { label: 'Sociedad Anónima (S.A.)', value: 'sa' },
      { label: 'Sociedad Comercial de Responsabilidad Limitada (S.R.L.)', value: 'srl' },
      { label: 'Empresa Individual de Responsabilidad Limitada (E.I.R.L.)', value: 'eirl' },
    ],
  },

  // Ecuador
  {
    name: 'Ecuador',
    code: 'EC',
    phoneCode: '+593',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Sociedad Anónima (S.A.)', value: 'sa' },
      { label: 'Compañía Limitada (Cía. Ltda.)', value: 'cia_ltda' },
      { label: 'Sociedad por Acciones Simplificada (S.A.S.)', value: 'sas' },
    ],
  },

  // Panama
  {
    name: 'Panama',
    code: 'PA',
    phoneCode: '+507',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Sociedad Anónima (S.A.)', value: 'sa' },
      { label: 'Sociedad de Responsabilidad Limitada (S.R.L.)', value: 'srl' },
      { label: 'Fundación de Interés Privado', value: 'fundacion' },
    ],
  },

  // Costa Rica
  {
    name: 'Costa Rica',
    code: 'CR',
    phoneCode: '+506',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Sociedad Anónima (S.A.)', value: 'sa' },
      { label: 'Sociedad de Responsabilidad Limitada (S.R.L.)', value: 'srl' },
    ],
  },

  // Dominican Republic
  {
    name: 'Dominican Republic',
    code: 'DO',
    phoneCode: '+1',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Sociedad Anónima (S.A.)', value: 'sa' },
      { label: 'Sociedad de Responsabilidad Limitada (S.R.L.)', value: 'srl' },
      { label: 'Empresa Individual de Responsabilidad Limitada (E.I.R.L.)', value: 'eirl' },
    ],
  },

  // Guatemala
  {
    name: 'Guatemala',
    code: 'GT',
    phoneCode: '+502',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Sociedad Anónima (S.A.)', value: 'sa' },
      { label: 'Sociedad de Responsabilidad Limitada', value: 'srl' },
    ],
  },

  // Paraguay
  {
    name: 'Paraguay',
    code: 'PY',
    phoneCode: '+595',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Sociedad Anónima (S.A.)', value: 'sa' },
      { label: 'Sociedad de Responsabilidad Limitada (S.R.L.)', value: 'srl' },
    ],
  },

  // Uruguay
  {
    name: 'Uruguay',
    code: 'UY',
    phoneCode: '+598',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Sociedad Anónima (S.A.)', value: 'sa' },
      { label: 'Sociedad de Responsabilidad Limitada (S.R.L.)', value: 'srl' },
      { label: 'Sociedad por Acciones Simplificada (S.A.S.)', value: 'sas' },
    ],
  },

  // Bolivia
  {
    name: 'Bolivia',
    code: 'BO',
    phoneCode: '+591',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Sociedad Anónima (S.A.)', value: 'sa' },
      { label: 'Sociedad de Responsabilidad Limitada (S.R.L.)', value: 'srl' },
    ],
  },

  // Honduras
  {
    name: 'Honduras',
    code: 'HN',
    phoneCode: '+504',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Sociedad Anónima (S.A.)', value: 'sa' },
      { label: 'Sociedad de Responsabilidad Limitada (S.R.L.)', value: 'srl' },
    ],
  },

  // El Salvador
  {
    name: 'El Salvador',
    code: 'SV',
    phoneCode: '+503',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Sociedad Anónima de Capital Variable (S.A. de C.V.)', value: 'sa_cv' },
      { label: 'Sociedad de Responsabilidad Limitada (S.R.L.)', value: 'srl' },
    ],
  },

  // Nicaragua
  {
    name: 'Nicaragua',
    code: 'NI',
    phoneCode: '+505',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Sociedad Anónima (S.A.)', value: 'sa' },
      { label: 'Compañía Limitada', value: 'cia_ltda' },
    ],
  },

  // Portugal
  {
    name: 'Portugal',
    code: 'PT',
    phoneCode: '+351',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Sociedade por Quotas (Lda.)', value: 'lda' },
      { label: 'Sociedade Anónima (S.A.)', value: 'sa' },
      { label: 'Empresário em Nome Individual', value: 'eni' },
    ],
  },

  // Poland
  {
    name: 'Poland',
    code: 'PL',
    phoneCode: '+48',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Spółka z ograniczoną odpowiedzialnością (Sp. z o.o.)', value: 'sp_zoo' },
      { label: 'Spółka akcyjna (S.A.)', value: 'sa' },
      { label: 'Spółka jawna (Sp.j.)', value: 'sp_j' },
    ],
  },

  // Sweden
  {
    name: 'Sweden',
    code: 'SE',
    phoneCode: '+46',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Aktiebolag (AB)', value: 'ab' },
      { label: 'Handelsbolag (HB)', value: 'hb' },
      { label: 'Enskild firma', value: 'enskild' },
    ],
  },

  // Norway
  {
    name: 'Norway',
    code: 'NO',
    phoneCode: '+47',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Aksjeselskap (AS)', value: 'as' },
      { label: 'Allmennaksjeselskap (ASA)', value: 'asa' },
      { label: 'Enkeltpersonforetak', value: 'enkeltperson' },
    ],
  },

  // Denmark
  {
    name: 'Denmark',
    code: 'DK',
    phoneCode: '+45',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Anpartsselskab (ApS)', value: 'aps' },
      { label: 'Aktieselskab (A/S)', value: 'as' },
      { label: 'Interessentskab (I/S)', value: 'is' },
    ],
  },

  // Finland
  {
    name: 'Finland',
    code: 'FI',
    phoneCode: '+358',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Osakeyhtiö (Oy)', value: 'oy' },
      { label: 'Julkinen osakeyhtiö (Oyj)', value: 'oyj' },
      { label: 'Toiminimi', value: 'toiminimi' },
    ],
  },

  // Ireland
  {
    name: 'Ireland',
    code: 'IE',
    phoneCode: '+353',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Private Company Limited by Shares (Ltd)', value: 'ltd' },
      { label: 'Designated Activity Company (DAC)', value: 'dac' },
      { label: 'Public Limited Company (PLC)', value: 'plc' },
    ],
  },

  // Austria
  {
    name: 'Austria',
    code: 'AT',
    phoneCode: '+43',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Gesellschaft mit beschränkter Haftung (GmbH)', value: 'gmbh' },
      { label: 'Aktiengesellschaft (AG)', value: 'ag' },
      { label: 'Kommanditgesellschaft (KG)', value: 'kg' },
    ],
  },

  // Belgium
  {
    name: 'Belgium',
    code: 'BE',
    phoneCode: '+32',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Besloten vennootschap (BV)', value: 'bv' },
      { label: 'Naamloze vennootschap (NV)', value: 'nv' },
      { label: 'Coöperatieve vennootschap (CV)', value: 'cv' },
    ],
  },

  // South Africa
  {
    name: 'South Africa',
    code: 'ZA',
    phoneCode: '+27',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Private Company (Pty Ltd)', value: 'pty_ltd' },
      { label: 'Public Company (Ltd)', value: 'ltd' },
      { label: 'Close Corporation (CC)', value: 'cc' },
    ],
  },

  // Nigeria
  {
    name: 'Nigeria',
    code: 'NG',
    phoneCode: '+234',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Private Limited Company (Ltd)', value: 'ltd' },
      { label: 'Public Limited Company (PLC)', value: 'plc' },
      { label: 'Limited Liability Partnership (LLP)', value: 'llp' },
    ],
  },

  // Egypt
  {
    name: 'Egypt',
    code: 'EG',
    phoneCode: '+20',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Limited Liability Company (LLC)', value: 'llc' },
      { label: 'Joint Stock Company', value: 'jsc' },
      { label: 'Branch Office', value: 'branch' },
    ],
  },

  // Kenya
  {
    name: 'Kenya',
    code: 'KE',
    phoneCode: '+254',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Private Limited Company (Ltd)', value: 'ltd' },
      { label: 'Public Limited Company (PLC)', value: 'plc' },
      { label: 'Limited Liability Partnership (LLP)', value: 'llp' },
    ],
  },

  // Ghana
  {
    name: 'Ghana',
    code: 'GH',
    phoneCode: '+233',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Private Limited Company (Ltd)', value: 'ltd' },
      { label: 'Public Limited Company', value: 'plc' },
      { label: 'External Company', value: 'external' },
    ],
  },

  // Morocco
  {
    name: 'Morocco',
    code: 'MA',
    phoneCode: '+212',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Société à Responsabilité Limitée (SARL)', value: 'sarl' },
      { label: 'Société Anonyme (SA)', value: 'sa' },
      { label: 'Société en Nom Collectif (SNC)', value: 'snc' },
    ],
  },

  // Thailand
  {
    name: 'Thailand',
    code: 'TH',
    phoneCode: '+66',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Company Limited (Co., Ltd.)', value: 'co_ltd' },
      { label: 'Public Company Limited (PCL)', value: 'pcl' },
      { label: 'Limited Partnership', value: 'lp' },
    ],
  },

  // Vietnam
  {
    name: 'Vietnam',
    code: 'VN',
    phoneCode: '+84',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Limited Liability Company (LLC)', value: 'llc' },
      { label: 'Joint Stock Company (JSC)', value: 'jsc' },
      { label: 'Partnership Company', value: 'partnership' },
    ],
  },

  // Philippines
  {
    name: 'Philippines',
    code: 'PH',
    phoneCode: '+63',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Stock Corporation', value: 'stock_corp' },
      { label: 'Non-Stock Corporation', value: 'non_stock_corp' },
      { label: 'Partnership', value: 'partnership' },
      { label: 'One Person Corporation (OPC)', value: 'opc' },
    ],
  },

  // Malaysia
  {
    name: 'Malaysia',
    code: 'MY',
    phoneCode: '+60',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Private Limited Company (Sdn Bhd)', value: 'sdn_bhd' },
      { label: 'Public Listed Company (Bhd)', value: 'bhd' },
      { label: 'Limited Liability Partnership (LLP)', value: 'llp' },
    ],
  },

  // Indonesia
  {
    name: 'Indonesia',
    code: 'ID',
    phoneCode: '+62',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Perseroan Terbatas (PT)', value: 'pt' },
      { label: 'Representative Office', value: 'rep_office' },
      { label: 'Foreign Investment Company (PMA)', value: 'pma' },
    ],
  },

  // Taiwan
  {
    name: 'Taiwan',
    code: 'TW',
    phoneCode: '+886',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Limited Company (有限公司)', value: 'limited' },
      { label: 'Company Limited by Shares (股份有限公司)', value: 'shares' },
      { label: 'Branch Office', value: 'branch' },
    ],
  },

  // New Zealand
  {
    name: 'New Zealand',
    code: 'NZ',
    phoneCode: '+64',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Limited Company (Ltd)', value: 'ltd' },
      { label: 'Limited Partnership (LP)', value: 'lp' },
      { label: 'Sole Trader', value: 'sole_trader' },
    ],
  },

  // Turkey
  {
    name: 'Turkey',
    code: 'TR',
    phoneCode: '+90',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Limited Liability Company (Ltd. Şti.)', value: 'ltd_sti' },
      { label: 'Joint Stock Company (A.Ş.)', value: 'as' },
      { label: 'Collective Company (Koll. Şti.)', value: 'koll_sti' },
    ],
  },

  // Greece
  {
    name: 'Greece',
    code: 'GR',
    phoneCode: '+30',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Private Company (I.K.E.)', value: 'ike' },
      { label: 'Société Anonyme (A.E.)', value: 'ae' },
      { label: 'Limited Liability Company (E.P.E.)', value: 'epe' },
    ],
  },

  // Czech Republic
  {
    name: 'Czech Republic',
    code: 'CZ',
    phoneCode: '+420',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Společnost s ručením omezeným (s.r.o.)', value: 'sro' },
      { label: 'Akciová společnost (a.s.)', value: 'as' },
      { label: 'Veřejná obchodní společnost (v.o.s.)', value: 'vos' },
    ],
  },

  // Romania
  {
    name: 'Romania',
    code: 'RO',
    phoneCode: '+40',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Societate cu Răspundere Limitată (S.R.L.)', value: 'srl' },
      { label: 'Societate pe Acțiuni (S.A.)', value: 'sa' },
      { label: 'Persoană Fizică Autorizată (PFA)', value: 'pfa' },
    ],
  },

  // Hungary
  {
    name: 'Hungary',
    code: 'HU',
    phoneCode: '+36',
    hasStateDropdown: false,
    entityTypes: [
      { label: 'Korlátolt Felelősségű Társaság (Kft.)', value: 'kft' },
      { label: 'Zártkörűen Működő Részvénytársaság (Zrt.)', value: 'zrt' },
      { label: 'Betéti Társaság (Bt.)', value: 'bt' },
    ],
  },
].filter(c => !EXCLUDED_COUNTRIES.includes(c.code));

// Default entity types for countries not explicitly defined
const DEFAULT_ENTITY_TYPES = [
  { label: 'Corporation', value: 'corp' },
  { label: 'Limited Liability Company', value: 'llc' },
  { label: 'Partnership', value: 'partnership' },
  { label: 'Limited Private Company', value: 'ltd' },
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
  return country?.entityTypes || DEFAULT_ENTITY_TYPES;
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

// Owner Roles (matching Replit MVP)
export const OWNER_ROLES = [
  { value: 'ceo', label: 'CEO / Chief Executive Officer' },
  { value: 'cfo', label: 'CFO / Chief Financial Officer' },
  { value: 'coo', label: 'COO / Chief Operating Officer' },
  { value: 'president', label: 'President' },
  { value: 'vp', label: 'Vice President' },
  { value: 'director', label: 'Director' },
  { value: 'manager', label: 'Manager' },
  { value: 'owner', label: 'Owner / Shareholder' },
  { value: 'partner', label: 'Partner' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'member', label: 'Member' },
  { value: 'other', label: 'Other' },
];
