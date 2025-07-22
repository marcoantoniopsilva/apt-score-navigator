import React, { createContext, useState, useContext, useEffect } from 'react';
import { CriteriaWeights } from '@/types/property';
import { useOnboarding } from '@/hooks/useOnboarding';
import { CRITERIOS_DISPONÍVEIS } from '@/types/onboarding';

export interface ActiveCriterion {
  key: string;
  label: string;
  weight: number;
}

interface CriteriaContextType {
  activeCriteria: ActiveCriterion[];
  criteriaWeights: CriteriaWeights;
  updateCriteriaWeight: (criteriaKey: string, newWeight: number) => void;
  refreshCriteriaFromProfile: () => void;
  isCriterionActive: (criteriaKey: string) => boolean;
  getCriteriaLabel: (criteriaKey: string) => string;
  getWeightsObject: () => CriteriaWeights;
  hasCustomCriteria: boolean;
}

const CriteriaContext = createContext<CriteriaContextType | undefined>(undefined);

export function CriteriaProvider({ children }: { children: React.ReactNode }) {
  const { userPreferences, userProfile, hasCompletedOnboarding } = useOnboarding();
  const [activeCriteria, setActiveCriteria] = useState<ActiveCriterion[]>([]);
  const [criteriaWeights, setCriteriaWeights] = useState<CriteriaWeights>({});
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState<number>(Date.now());

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

  // Função para atualizar os critérios a partir do perfil do usuário
  const refreshCriteriaFromProfile = () => {
    console.log('CriteriaContext: Atualizando critérios do perfil...');
    setLastRefreshTimestamp(Date.now());
  };

  // Escuta eventos de atualização de critérios
  useEffect(() => {
    const handleCriteriaUpdate = () => {
      console.log('CriteriaContext: Evento de atualização de critérios recebido');
      refreshCriteriaFromProfile();
    };

    window.addEventListener('criteria-updated', handleCriteriaUpdate);
    
    return () => {
      window.removeEventListener('criteria-updated', handleCriteriaUpdate);
    };
  }, []);

  // Atualiza critérios ativos baseado no onboarding do usuário
  useEffect(() => {
    console.log('CriteriaContext: Recalculando critérios...', {
      timestamp: lastRefreshTimestamp,
      hasCompletedOnboarding,
      userPreferencesCount: userPreferences.length,
      userProfileType: userProfile?.profile_type,
    });

    if (hasCompletedOnboarding && userProfile) {
      if (userPreferences.length > 0) {
        console.log('CriteriaContext: Usando critérios personalizados do usuário');
        
        // Usuário tem critérios personalizados
        const userCriteria = userPreferences.map(pref => ({
          key: pref.criterio_nome,
          label: getCriteriaLabel(pref.criterio_nome),
          weight: pref.peso
        }));

        console.log('CriteriaContext: Critérios personalizados:', userCriteria);
        setActiveCriteria(userCriteria);

        // Criar objeto de pesos
        const weights: CriteriaWeights = {};
        
        userPreferences.forEach(pref => {
          weights[pref.criterio_nome] = pref.peso;
        });
        
        console.log('CriteriaContext: Pesos calculados:', weights);
        setCriteriaWeights(weights);
      } else {
        console.log('CriteriaContext: Não há critérios personalizados, usando padrões');
        // Não há critérios personalizados, carregaria os padrões aqui
        setActiveCriteria([]);
        setCriteriaWeights({});
      }
    } else {
      console.log('CriteriaContext: Onboarding não concluído, usando critérios padrão');
      setActiveCriteria([]);
      setCriteriaWeights({});
    }
  }, [userPreferences, userProfile, hasCompletedOnboarding, lastRefreshTimestamp]);

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

  return (
    <CriteriaContext.Provider
      value={{
        activeCriteria,
        criteriaWeights,
        updateCriteriaWeight,
        refreshCriteriaFromProfile,
        isCriterionActive,
        getCriteriaLabel,
        getWeightsObject,
        hasCustomCriteria: hasCompletedOnboarding && userPreferences.length > 0
      }}
    >
      {children}
    </CriteriaContext.Provider>
  );
}

export const useCriteriaContext = () => {
  const context = useContext(CriteriaContext);
  if (context === undefined) {
    throw new Error('useCriteriaContext must be used within a CriteriaProvider');
  }
  return context;
};