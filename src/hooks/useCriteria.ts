import { useCriteriaContext } from '@/contexts/CriteriaContext';

// Re-export the context hook as useCriteria for backward compatibility
export const useCriteria = () => {
  return useCriteriaContext();
};

// Re-export types for backward compatibility
export type { ActiveCriterion } from '@/contexts/CriteriaContext';