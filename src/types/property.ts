export interface Property {
  id: string;
  title: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  area: number;
  floor: string;
  rent: number;
  condo: number;
  iptu: number;
  fireInsurance: number;
  otherFees: number;
  totalMonthlyCost: number;
  images: string[];
  sourceUrl?: string;
  scores: PropertyScores;
  finalScore: number;
  locationSummary?: string;
}

export interface PropertyScores {
  [key: string]: number; // Critérios dinâmicos baseados na seleção do usuário
}

export interface CriteriaWeights {
  [key: string]: number; // Pesos dinâmicos baseados na seleção do usuário
}

// Critérios padrão para usuários sem onboarding
export const DEFAULT_CRITERIA_KEYS = [
  'location',
  'internalSpace', 
  'furniture',
  'accessibility',
  'finishing',
  'price',
  'condo'
] as const;

export const DEFAULT_WEIGHTS: CriteriaWeights = {
  location: 3,
  internalSpace: 3,
  furniture: 3,
  accessibility: 2,
  finishing: 2,
  price: 3,
  condo: 2,
};

export const CRITERIA_LABELS = {
  location: 'Localização',
  internalSpace: 'Espaço Interno',
  furniture: 'Mobília',
  accessibility: 'Acessibilidade',
  finishing: 'Acabamento',
  price: 'Preço',
  condo: 'Condomínio',
};
