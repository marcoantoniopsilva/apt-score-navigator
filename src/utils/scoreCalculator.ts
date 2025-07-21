
import { PropertyScores, CriteriaWeights } from '@/types/property';

export const calculateFinalScore = (scores: PropertyScores, weights: CriteriaWeights): number => {
  console.log('calculateFinalScore: scores recebidos:', scores);
  console.log('calculateFinalScore: weights recebidos:', weights);
  
  // Calcular pontuação ponderada dinamicamente baseado nos critérios disponíveis
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  // Iterar pelos critérios que têm tanto score quanto peso
  Object.keys(weights).forEach(criteriaKey => {
    const score = scores[criteriaKey];
    const weight = weights[criteriaKey];
    
    if (typeof score === 'number' && !isNaN(score) && typeof weight === 'number' && !isNaN(weight)) {
      totalWeightedScore += score * weight;
      totalWeight += weight;
      console.log(`calculateFinalScore: ${criteriaKey} - score: ${score}, weight: ${weight}, contribuição: ${score * weight}`);
    }
  });
  
  console.log('calculateFinalScore: totalWeightedScore:', totalWeightedScore);
  console.log('calculateFinalScore: totalWeight:', totalWeight);
  
  if (totalWeight === 0) {
    console.warn('calculateFinalScore: Peso total é zero, retornando 5 como padrão');
    return 5;
  }
  
  const finalScore = totalWeightedScore / totalWeight;
  console.log('calculateFinalScore: resultado final:', finalScore);
  
  return finalScore;
};

export const getScoreColor = (score: number): string => {
  if (score >= 8) return 'bg-green-100 text-green-800';
  if (score >= 6) return 'bg-yellow-100 text-yellow-800';
  if (score >= 4) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};

export const getRankBadgeColor = (rank: number): string => {
  if (rank === 1) return 'bg-yellow-500 text-white';
  if (rank === 2) return 'bg-gray-400 text-white';
  if (rank === 3) return 'bg-amber-600 text-white';
  return 'bg-blue-500 text-white';
};
