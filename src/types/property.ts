
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
}

export interface PropertyScores {
  location: number;
  internalSpace: number;
  furniture: number;
  accessibility: number;
  finishing: number;
  price: number;
}

export interface CriteriaWeights {
  location: number;
  internalSpace: number;
  furniture: number;
  accessibility: number;
  finishing: number;
  price: number;
}

export const DEFAULT_WEIGHTS: CriteriaWeights = {
  location: 3,
  internalSpace: 3,
  furniture: 3,
  accessibility: 2,
  finishing: 2,
  price: 3,
};

export const CRITERIA_LABELS = {
  location: 'Localização',
  internalSpace: 'Espaço Interno',
  furniture: 'Mobília',
  accessibility: 'Acessibilidade',
  finishing: 'Acabamento',
  price: 'Preço',
};
