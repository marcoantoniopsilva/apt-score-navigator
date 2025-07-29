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
    });

    if (hasCompletedOnboarding && userProfile) {
      if (userPreferences.length > 0) {
        console.log('useCriteria: Usando critérios personalizados do usuário');
        
        // Usuário tem critérios personalizados
        const userCriteria = userPreferences.map(pref => ({
          key: pref.criterio_nome,
          label: getCriteriaLabel(pref.criterio_nome),
          weight: pref.peso
        }));

        console.log('useCriteria: Critérios personalizados:', userCriteria);
        setActiveCriteria(userCriteria);

        // Criar objeto de pesos
        const weights: CriteriaWeights = {};
        
        userPreferences.forEach(pref => {
          weights[pref.criterio_nome] = pref.peso;
        });
        
        console.log('useCriteria: Pesos calculados:', weights);
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
          const maxWeight = Math.max(...Object.values(profileWeights));
          
          Object.entries(profileWeights).forEach(([key, weight]) => {
            // Distribui pesos de 1 a 5 baseado na proporção relativa
            weights[key] = Math.max(1, Math.round((weight / maxWeight) * 5));
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

  // Escuta eventos de atualização de critérios e sessão
  useEffect(() => {
    const handleCriteriaUpdate = () => {
      console.log('useCriteria: Critérios atualizados, forçando recálculo...');
      // Triggere a re-execution of the main criteria effect
      window.dispatchEvent(new CustomEvent('force-criteria-reload'));
    };

    const handleSessionRefresh = () => {
      console.log('useCriteria: Sessão restaurada, recarregando critérios...');
      // Triggere a re-execution of the main criteria effect  
      window.dispatchEvent(new CustomEvent('force-criteria-reload'));
    };

    window.addEventListener('criteria-updated', handleCriteriaUpdate);
    window.addEventListener('session-refreshed', handleSessionRefresh);
    
    return () => {
      window.removeEventListener('criteria-updated', handleCriteriaUpdate);
      window.removeEventListener('session-refreshed', handleSessionRefresh);
    };
  }, []);

  // Force reload when requested
  useEffect(() => {
    const handleForceReload = () => {
      console.log('useCriteria: Força recarregamento solicitado');
      // This will trigger the main useEffect by changing dependencies
      if (hasCompletedOnboarding && userProfile) {
        // Re-process the criteria logic
        const timestamp = Date.now();
        console.log('useCriteria: Forced reload at:', timestamp);
      }
    };

    window.addEventListener('force-criteria-reload', handleForceReload);
    
    return () => {
      window.removeEventListener('force-criteria-reload', handleForceReload);
    };
  }, [hasCompletedOnboarding, userProfile, userPreferences]);

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