import { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CriteriaWeights, DEFAULT_CRITERIA_KEYS, DEFAULT_WEIGHTS } from '@/types/property';
import { CRITERIOS_DISPONÍVEIS, PERFIL_PESOS_SUGERIDOS } from '@/types/onboarding';
import { useOnboarding } from './useOnboarding';
import { useTabVisibility } from '@/hooks/useTabVisibility';

export interface ActiveCriterion {
  key: string;
  label: string;
  weight: number;
}

/**
 * Optimized criteria hook using React Query for caching
 * Eliminates unnecessary re-renders and session callbacks
 */
export const useOptimizedCriteria = () => {
  const { userPreferences, hasCompletedOnboarding, userProfile } = useOnboarding();
  const { onTabReactivated } = useTabVisibility();

  // Memoized label mapper
  const getCriteriaLabel = useMemo(() => {
    const defaultLabels: Record<string, string> = {
      location: 'Localização',
      internalSpace: 'Espaço Interno',
      furniture: 'Mobília',
      accessibility: 'Acessibilidade',
      finishing: 'Acabamento',
      price: 'Preço',
      condo: 'Condomínio'
    };

    return (criteriaKey: string): string => {
      const onboardingCriterion = CRITERIOS_DISPONÍVEIS.find(c => c.id === criteriaKey);
      return onboardingCriterion?.label || defaultLabels[criteriaKey] || criteriaKey;
    };
  }, []);

  // Query for computed criteria with intelligent caching
  const { data: criteriaData, isLoading, refetch } = useQuery({
    queryKey: ['criteria', hasCompletedOnboarding, userPreferences, userProfile?.profile_type],
    queryFn: () => {
      console.log('useOptimizedCriteria: Computing criteria...');

      if (hasCompletedOnboarding && userProfile) {
        if (userPreferences.length > 0) {
          // User has custom criteria
          const userCriteria = userPreferences.map(pref => ({
            key: pref.criterio_nome,
            label: getCriteriaLabel(pref.criterio_nome),
            weight: pref.peso
          }));

          const weights: CriteriaWeights = {};
          userPreferences.forEach(pref => {
            weights[pref.criterio_nome] = pref.peso;
          });
          
          return { criteria: userCriteria, weights, hasCustomCriteria: true };
        } else {
          // Use profile criteria
          const profileWeights = PERFIL_PESOS_SUGERIDOS[userProfile.profile_type];
          if (profileWeights) {
            const profileCriteria = Object.entries(profileWeights).map(([key, weight]) => ({
              key,
              label: getCriteriaLabel(key),
              weight
            }));

            const weights: CriteriaWeights = {};
            const maxWeight = Math.max(...Object.values(profileWeights));
            
            Object.entries(profileWeights).forEach(([key, weight]) => {
              weights[key] = Math.max(1, Math.round((weight / maxWeight) * 5));
            });
            
            return { criteria: profileCriteria, weights, hasCustomCriteria: false };
          }
        }
      }
      
      // Default fallback
      const defaultCriteria = DEFAULT_CRITERIA_KEYS.map(key => ({
        key,
        label: getCriteriaLabel(key),
        weight: DEFAULT_WEIGHTS[key] || 3
      }));

      return { criteria: defaultCriteria, weights: DEFAULT_WEIGHTS, hasCustomCriteria: false };
    },
    staleTime: 1 * 60 * 1000, // 1 minuto - evita cache infinito após tab switch
    gcTime: 3 * 60 * 1000, // 3 minutos
    enabled: true,
    retry: 2
  });

  const activeCriteria = criteriaData?.criteria || [];
  const criteriaWeights = criteriaData?.weights || DEFAULT_WEIGHTS;
  const hasCustomCriteria = criteriaData?.hasCustomCriteria || false;

  // Reagir à reativação da aba
  useEffect(() => {
    const cleanup = onTabReactivated(() => {
      console.log('useOptimizedCriteria: Aba reativada - refazendo query de critérios');
      refetch();
    });

    return cleanup;
  }, [onTabReactivated, refetch]);

  // Utility functions
  const updateCriteriaWeight = (criteriaKey: string, newWeight: number) => {
    // This would trigger a mutation in a real app
    console.log('updateCriteriaWeight called:', criteriaKey, newWeight);
  };

  const getWeightsObject = (): CriteriaWeights => criteriaWeights;
  
  const isCriterionActive = (criteriaKey: string): boolean => 
    activeCriteria.some(c => c.key === criteriaKey);

  return {
    activeCriteria,
    criteriaWeights,
    updateCriteriaWeight,
    getWeightsObject,
    getCriteriaLabel,
    isCriterionActive,
    hasCustomCriteria,
    isLoading
  };
};