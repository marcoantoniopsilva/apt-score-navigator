export interface OnboardingAnswers {
  intencao: 'alugar' | 'comprar';
  objetivo_principal: string | string[]; // Múltipla seleção (até 2)
  situacao_moradia: string | string[]; // Múltipla seleção (até 2)
  valor_principal: string | string[]; // Múltipla seleção
  faixa_preco: string;
  regiao_referencia: string;
}

export type UserProfileType = 
  | 'investidor'
  | 'compra_segura'
  | 'profissional_solteiro'
  | 'familia_com_filhos'
  | 'aposentado_tranquilo';

export interface UserProfile {
  id?: string;
  user_id: string;
  profile_type: UserProfileType;
  intencao: string;
  objetivo_principal: string;
  situacao_moradia: string;
  valor_principal: string;
  objetivo_principal_multi?: string[];
  situacao_moradia_multi?: string[];
  valor_principal_multi?: string[];
  faixa_preco?: string;
  regiao_referencia?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CriterioOnboarding {
  id: string;
  label: string;
  description?: string;
}

export interface UserCriteriaPreference {
  id?: string;
  user_id: string;
  criterio_nome: string;
  peso: number;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

export const CRITERIOS_DISPONÍVEIS: CriterioOnboarding[] = [
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

// Mapeamento de perfis e pesos sugeridos
export const PERFIL_PESOS_SUGERIDOS: Record<UserProfileType, Record<string, number>> = {
  investidor: {
    preco_por_m2: 30,
    potencial_valorizacao: 25,
    localizacao: 20,
    acabamento: 15,
    proximidade_metro: 10
  },
  compra_segura: {
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