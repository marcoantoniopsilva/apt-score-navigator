import { useState, useEffect } from 'react';
import { CriteriaWeights, DEFAULT_CRITERIA_KEYS, DEFAULT_WEIGHTS } from '@/types/property';
import { CRITERIOS_DISPONÍVEIS } from '@/types/onboarding';
import { useOnboarding } from './useOnboarding';

export interface ActiveCriterion {
  key: string;
  label: string;
  weight: number;
}

export const useCriteria = () => {
  const { userPreferences, hasCompletedOnboarding } = useOnboarding();
  const [activeCriteria, setActiveCriteria] = useState<ActiveCriterion[]>([]);
  const [criteriaWeights, setCriteriaWeights] = useState<CriteriaWeights>(DEFAULT_WEIGHTS);

  // Mapeia critérios do onboarding para labels
  const getCriteriaLabel = (criteriaKey: string): string => {
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
  };

  // Atualiza critérios ativos baseado no onboarding do usuário
  useEffect(() => {
    if (hasCompletedOnboarding && userPreferences.length > 0) {
      // Usuário completou onboarding - usar seus critérios
      const userCriteria = userPreferences.map(pref => ({
        key: pref.criterio_nome,
        label: getCriteriaLabel(pref.criterio_nome),
        weight: pref.peso
      }));

      setActiveCriteria(userCriteria);

      // Criar objeto de pesos
      const weights: CriteriaWeights = {};
      userPreferences.forEach(pref => {
        weights[pref.criterio_nome] = Math.max(1, Math.round(pref.peso / 20)); // Converte escala 0-100 para 1-5
      });
      setCriteriaWeights(weights);
    } else {
      // Usuário não completou onboarding - usar critérios padrão
      const defaultCriteria = DEFAULT_CRITERIA_KEYS.map(key => ({
        key,
        label: getCriteriaLabel(key),
        weight: DEFAULT_WEIGHTS[key] || 3
      }));

      setActiveCriteria(defaultCriteria);
      setCriteriaWeights(DEFAULT_WEIGHTS);
    }
  }, [hasCompletedOnboarding, userPreferences]);

  // Função para atualizar peso de um critério
  const updateCriteriaWeight = (criteriaKey: string, newWeight: number) => {
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
  };

  // Função para obter todos os critérios como objeto de pesos
  const getWeightsObject = (): CriteriaWeights => {
    return criteriaWeights;
  };

  // Função para verificar se um critério está ativo
  const isCriterionActive = (criteriaKey: string): boolean => {
    return activeCriteria.some(c => c.key === criteriaKey);
  };

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