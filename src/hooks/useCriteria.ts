import { useState, useEffect } from 'react';
import { CriteriaWeights, DEFAULT_CRITERIA_KEYS, DEFAULT_WEIGHTS } from '@/types/property';
import { CRITERIOS_DISPONÍVEIS, PERFIL_PESOS_SUGERIDOS } from '@/types/onboarding';
import { useOnboarding } from './useOnboarding';

export interface ActiveCriterion {
  key: string;
  label: string;
  weight: number;
}

export const useCriteria = () => {
  const { userPreferences, hasCompletedOnboarding, userProfile } = useOnboarding();
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
    console.log('useCriteria: Atualizando critérios...', {
      hasCompletedOnboarding,
      userPreferences: userPreferences.length,
      userProfile: userProfile?.profile_type,
      preferences: userPreferences
    });

    if (hasCompletedOnboarding && userProfile) {
      if (userPreferences.length > 0) {
        console.log('useCriteria: Usando critérios personalizados do usuário');
        
        // Usuário tem critérios personalizados - usar os critérios com pesos do perfil
        const userCriteria = userPreferences.map(pref => ({
          key: pref.criterio_nome,
          label: getCriteriaLabel(pref.criterio_nome),
          weight: pref.peso
        }));

        console.log('useCriteria: Critérios personalizados:', userCriteria);
        setActiveCriteria(userCriteria);

        // Criar objeto de pesos baseado no perfil do usuário
        const profileWeights = PERFIL_PESOS_SUGERIDOS[userProfile.profile_type];
        const weights: CriteriaWeights = {};
        
        userPreferences.forEach(pref => {
          // Usar peso do perfil se disponível, senão usar peso salvo
          const profileWeight = profileWeights?.[pref.criterio_nome] || pref.peso;
          weights[pref.criterio_nome] = Math.max(1, Math.round(profileWeight / 20)); // Converte escala 0-100 para 1-5
        });
        
        console.log('useCriteria: Pesos baseados no perfil:', weights);
        setCriteriaWeights(weights);
      } else {
        console.log('useCriteria: Usando critérios sugeridos do perfil');
        
        // Usuário tem perfil mas não tem critérios personalizados - usar critérios do perfil
        const profileWeights = PERFIL_PESOS_SUGERIDOS[userProfile.profile_type];
        if (profileWeights) {
          const profileCriteria = Object.entries(profileWeights).map(([key, weight]) => ({
            key,
            label: getCriteriaLabel(key),
            weight
          }));

          console.log('useCriteria: Critérios do perfil:', profileCriteria);
          setActiveCriteria(profileCriteria);

          // Criar objeto de pesos
          const weights: CriteriaWeights = {};
          Object.entries(profileWeights).forEach(([key, weight]) => {
            weights[key] = Math.max(1, Math.round(weight / 20)); // Converte escala 0-100 para 1-5
          });
          
          console.log('useCriteria: Pesos do perfil calculados:', weights);
          setCriteriaWeights(weights);
        } else {
          // Fallback para critérios padrão
          console.log('useCriteria: Perfil não encontrado, usando critérios padrão');
          const defaultCriteria = DEFAULT_CRITERIA_KEYS.map(key => ({
            key,
            label: getCriteriaLabel(key),
            weight: DEFAULT_WEIGHTS[key] || 3
          }));
          setActiveCriteria(defaultCriteria);
          setCriteriaWeights(DEFAULT_WEIGHTS);
        }
      }
    } else {
      console.log('useCriteria: Usando critérios padrão');
      
      // Usuário não completou onboarding - usar critérios padrão
      const defaultCriteria = DEFAULT_CRITERIA_KEYS.map(key => ({
        key,
        label: getCriteriaLabel(key),
        weight: DEFAULT_WEIGHTS[key] || 3
      }));

      console.log('useCriteria: Critérios padrão:', defaultCriteria);
      setActiveCriteria(defaultCriteria);
      setCriteriaWeights(DEFAULT_WEIGHTS);
    }
  }, [hasCompletedOnboarding, userPreferences, userProfile]);

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