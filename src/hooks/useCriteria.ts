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

    // Se tem perfil (independente de onboarding "completo"), usar dados do usuário
    if (userProfile) {
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

        // Criar objeto de pesos para os critérios do sistema
        const systemWeights: CriteriaWeights = { ...DEFAULT_WEIGHTS };
        
        // Mapear critérios do onboarding para critérios do sistema
        const criteriaMapping: Record<string, keyof CriteriaWeights> = {
          'preco_total': 'price',
          'tamanho': 'internalSpace',
          'acabamento': 'finishing',
          'localizacao': 'location',
          'proximidade_servicos': 'location',
          'seguranca': 'location',
          'facilidade_entorno': 'location',
          'silencio': 'location'
        };

        userPreferences.forEach(pref => {
          const mappedKey = criteriaMapping[pref.criterio_nome];
          if (mappedKey) {
            // Normalizar peso para escala 1-5
            systemWeights[mappedKey] = Math.max(1, Math.min(5, Math.round(pref.peso / 4)));
          }
        });
        
        console.log('useCriteria: Pesos do sistema calculados:', systemWeights);
        setCriteriaWeights(systemWeights);
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

          // Usar critérios padrão mas ajustados pelo perfil
          const adjustedWeights: CriteriaWeights = { ...DEFAULT_WEIGHTS };
          const maxWeight = Math.max(...Object.values(profileWeights));
          
          // Mapear alguns critérios principais do perfil
          if (profileWeights.seguranca && maxWeight > 0) {
            adjustedWeights.location = Math.max(1, Math.round((profileWeights.seguranca / maxWeight) * 5));
          }
          if (profileWeights.tamanho && maxWeight > 0) {
            adjustedWeights.internalSpace = Math.max(1, Math.round((profileWeights.tamanho / maxWeight) * 5));
          }
          if (profileWeights.preco_total && maxWeight > 0) {
            adjustedWeights.price = Math.max(1, Math.round((profileWeights.preco_total / maxWeight) * 5));
          }
          
          console.log('useCriteria: Pesos do perfil calculados:', adjustedWeights);
          setCriteriaWeights(adjustedWeights);
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
      console.log('useCriteria: Sem perfil de usuário, usando critérios padrão');
      
      // Usuário não tem perfil - usar critérios padrão
      const defaultCriteria = DEFAULT_CRITERIA_KEYS.map(key => ({
        key,
        label: getCriteriaLabel(key),
        weight: DEFAULT_WEIGHTS[key] || 3
      }));

      console.log('useCriteria: Critérios padrão:', defaultCriteria);
      setActiveCriteria(defaultCriteria);
      setCriteriaWeights(DEFAULT_WEIGHTS);
    }
  }, [userPreferences, userProfile]); // Remover hasCompletedOnboarding das dependências

  // Escuta eventos de atualização de critérios
  useEffect(() => {
    const handleCriteriaUpdate = () => {
      console.log('useCriteria: Critérios atualizados, forçando recálculo...');
      // Força uma atualização dos critérios
      const timestamp = Date.now();
      console.log('useCriteria: Timestamp de atualização:', timestamp);
    };

    window.addEventListener('criteria-updated', handleCriteriaUpdate);
    
    return () => {
      window.removeEventListener('criteria-updated', handleCriteriaUpdate);
    };
  }, []);

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