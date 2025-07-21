import { PropertyScores, CriteriaWeights } from '@/types/property';

// Mapeamento dos critérios antigos para os novos baseados no perfil
export const CRITERIA_MAPPING: Record<string, string> = {
  // Critérios antigos -> Critérios novos do perfil
  'location': 'localizacao',
  'internalSpace': 'tamanho',
  'furniture': 'acabamento',
  'accessibility': 'facilidade_entorno',
  'finishing': 'acabamento',
  'price': 'preco_total',
  'condo': 'preco_total'
};

// Detecta se uma propriedade tem critérios antigos
export const hasLegacyCriteria = (scores: PropertyScores): boolean => {
  const legacyKeys = Object.keys(CRITERIA_MAPPING);
  const scoreKeys = Object.keys(scores);
  
  // Se tem algum critério antigo, considera como legacy
  return scoreKeys.some(key => legacyKeys.includes(key));
};

// Migra scores antigos para os novos critérios baseados no perfil
export const migrateLegacyScores = (
  legacyScores: PropertyScores, 
  targetWeights: CriteriaWeights
): PropertyScores => {
  console.log('migrando scores legados:', legacyScores);
  console.log('para critérios do perfil:', Object.keys(targetWeights));
  
  const migratedScores: PropertyScores = {};
  
  // Inicializar todos os critérios do perfil com score padrão
  Object.keys(targetWeights).forEach(newKey => {
    migratedScores[newKey] = 5; // Valor neutro padrão
  });
  
  // Mapear critérios antigos para os novos quando possível
  Object.entries(legacyScores).forEach(([oldKey, score]) => {
    const newKey = CRITERIA_MAPPING[oldKey];
    if (newKey && targetWeights[newKey] !== undefined) {
      // Se já existe um valor mapeado, fazer uma média
      if (migratedScores[newKey] === 5) {
        migratedScores[newKey] = score;
      } else {
        migratedScores[newKey] = (migratedScores[newKey] + score) / 2;
      }
      console.log(`Mapeado ${oldKey} (${score}) -> ${newKey} (${migratedScores[newKey]})`);
    }
  });
  
  console.log('Scores migrados:', migratedScores);
  return migratedScores;
};

// Verifica se há compatibilidade entre scores e weights
export const areScoresCompatible = (scores: PropertyScores, weights: CriteriaWeights): boolean => {
  const scoreKeys = Object.keys(scores);
  const weightKeys = Object.keys(weights);
  
  // Verifica se há pelo menos uma chave em comum
  const commonKeys = scoreKeys.filter(key => weightKeys.includes(key));
  return commonKeys.length > 0;
};

// Retorna critérios compatíveis entre scores e weights
export const getCompatibleCriteria = (scores: PropertyScores, weights: CriteriaWeights): string[] => {
  const scoreKeys = Object.keys(scores);
  const weightKeys = Object.keys(weights);
  
  return scoreKeys.filter(key => weightKeys.includes(key));
};