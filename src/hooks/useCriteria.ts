import { useState, useEffect, useCallback, useMemo } from 'react';
import { CriteriaWeights, DEFAULT_CRITERIA_KEYS, DEFAULT_WEIGHTS } from '@/types/property';
import { CRITERIOS_DISPONÍVEIS, PERFIL_PESOS_SUGERIDOS } from '@/types/onboarding';
import { useOnboarding } from './useOnboarding';
// Session restore removed for optimization

export interface ActiveCriterion {
  key: string;
  label: string;
  weight: number;
}

export const useCriteria = () => {
  const { userPreferences, hasCompletedOnboarding, userProfile } = useOnboarding();
  // Session restore removed for optimization
  const [activeCriteria, setActiveCriteria] = useState<ActiveCriterion[]>([]);
  const [criteriaWeights, setCriteriaWeights] = useState<CriteriaWeights>(DEFAULT_WEIGHTS);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Mapeia critérios do onboarding para labels - memoized for performance
  const getCriteriaLabel = useCallback((criteriaKey: string): string => {
    const onboardingCriterion = CRITERIOS_DISPONÍVEIS.find(c => c.id === criteriaKey);
    if (onboardingCriterion) {
      return onboardingCriterion.label;
    }

    // Labels padrão para critérios antigos
    const defaultLabels: Record<string, string> = {
      location: 'Localização',
      internalSpace: 'Espaço Interno',
      furniture: 'Mobília',
      accessibility: 'Acessibilidade',
      finishing: 'Acabamento',
      price: 'Preço',
      condo: 'Condomínio'
    };

    return defaultLabels[criteriaKey] || criteriaKey;
  }, []);

  // Memoized computation of criteria based on onboarding data
  const computedCriteria = useMemo(() => {
    console.log('useCriteria: Computing criteria...', {
      hasCompletedOnboarding,
      userPreferences: userPreferences.length,
      userProfile: userProfile?.profile_type,
      refreshTrigger
    });

    if (hasCompletedOnboarding && userProfile) {
      if (userPreferences.length > 0) {
        console.log('useCriteria: Using custom user criteria');
        
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
        
        return { criteria: userCriteria, weights };
      } else {
        console.log('useCriteria: Using profile suggested criteria');
        
        // User has profile but no custom criteria - use profile criteria
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
          
          return { criteria: profileCriteria, weights };
        }
      }
    }
    
    // Default fallback
    console.log('useCriteria: Using default criteria');
    const defaultCriteria = DEFAULT_CRITERIA_KEYS.map(key => ({
      key,
      label: getCriteriaLabel(key),
      weight: DEFAULT_WEIGHTS[key] || 3
    }));

    return { criteria: defaultCriteria, weights: DEFAULT_WEIGHTS };
  }, [hasCompletedOnboarding, userPreferences, userProfile, getCriteriaLabel, refreshTrigger]);

  // Update state when computed criteria changes
  useEffect(() => {
    setActiveCriteria(computedCriteria.criteria);
    setCriteriaWeights(computedCriteria.weights);
  }, [computedCriteria]);

  // Session refresh removed for optimization

  // Função para atualizar peso de um critério
  const updateCriteriaWeight = useCallback((criteriaKey: string, newWeight: number) => {
    setCriteriaWeights(prev => ({
      ...prev,
      [criteriaKey]: newWeight
    }));

    setActiveCriteria(prev => 
      prev.map(criterion => 
        criterion.key === criteriaKey 
          ? { ...criterion, weight: newWeight }
          : criterion
      )
    );
  }, []);

  // Função para obter todos os critérios como objeto de pesos
  const getWeightsObject = useCallback((): CriteriaWeights => {
    return criteriaWeights;
  }, [criteriaWeights]);

  // Função para verificar se um critério está ativo
  const isCriterionActive = useCallback((criteriaKey: string): boolean => {
    return activeCriteria.some(c => c.key === criteriaKey);
  }, [activeCriteria]);

  return {
    activeCriteria,
    criteriaWeights,
    updateCriteriaWeight,
    getWeightsObject,
    getCriteriaLabel,
    isCriterionActive,
    hasCustomCriteria: hasCompletedOnboarding && userPreferences.length > 0
  };
};