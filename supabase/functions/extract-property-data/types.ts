export interface ExtractedPropertyData {
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
  images?: string[];
}

export interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    content?: string;
    extract?: string;
  };
  error?: string;
}

export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Exportar tipos do onboarding que são necessários na edge function
export const CRITERIOS_DISPONÍVEIS = [
  { id: 'preco_total', label: 'Preço total (aluguel + taxas)' },
  { id: 'preco_por_m2', label: 'Preço por m²' },
  { id: 'tamanho', label: 'Tamanho' },
  { id: 'acabamento', label: 'Acabamento / conservação' },
  { id: 'localizacao', label: 'Localização' },
  { id: 'proximidade_metro', label: 'Proximidade do metrô / transporte' },
  { id: 'seguranca', label: 'Segurança da região' },
  { id: 'proximidade_servicos', label: 'Proximidade de escolas / hospitais' },
  { id: 'facilidade_entorno', label: 'Facilidade no entorno (mercado, farmácia etc.)' },
  { id: 'potencial_valorizacao', label: 'Potencial de valorização' },
  { id: 'silencio', label: 'Silêncio / tranquilidade' },
  { id: 'estilo_design', label: 'Estilo / design' }
];

export const PERFIL_PESOS_SUGERIDOS = {
  investidor: {
    preco_por_m2: 30,
    potencial_valorizacao: 25,
    localizacao: 20,
    acabamento: 15,
    proximidade_metro: 10
  },
  primeira_compra: {
    preco_total: 35,
    localizacao: 25,
    tamanho: 20,
    acabamento: 10,
    proximidade_metro: 10
  },
  profissional_solteiro: {
    localizacao: 30,
    proximidade_metro: 25,
    preco_total: 20,
    acabamento: 15,
    facilidade_entorno: 10
  },
  familia_com_filhos: {
    tamanho: 25,
    proximidade_servicos: 20,
    seguranca: 20,
    preco_total: 15,
    facilidade_entorno: 10,
    silencio: 10
  },
  aposentado_tranquilo: {
    silencio: 25,
    seguranca: 25,
    proximidade_servicos: 20,
    facilidade_entorno: 15,
    preco_total: 15
  }
};