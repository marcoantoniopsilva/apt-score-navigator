
import { PropertyScores, CriteriaWeights } from '@/types/property';

export const calculateFinalScore = (scores: PropertyScores, weights: CriteriaWeights): number => {
  const totalWeightedScore = 
    scores.location * weights.location +
    scores.internalSpace * weights.internalSpace +
    scores.furniture * weights.furniture +
    scores.accessibility * weights.accessibility +
    scores.finishing * weights.finishing +
    scores.price * weights.price;

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  
  return totalWeightedScore / totalWeight;
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
