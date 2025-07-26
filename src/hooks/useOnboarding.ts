import { useState, useEffect } from 'react';
import { 
  UserProfile, 
  UserCriteriaPreference, 
  UserProfileType,
  OnboardingAnswers
} from '@/types/onboarding';
import { UserProfileService } from '@/services/userProfileService';
import { CriteriaWeights } from '@/types/property';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useOnboarding = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserCriteriaPreference[]>([]);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Carrega dados do onboarding
  const loadOnboardingData = async (userId: string) => {
    setIsLoading(true);
    try {
      const [profile, preferences] = await Promise.all([
        UserProfileService.getUserProfile(userId),
        UserProfileService.getUserCriteriaPreferences(userId)
      ]);

      setUserProfile(profile);
      setUserPreferences(preferences);
      setHasCompletedOnboarding(!!(profile && preferences.length > 0));
    } catch (error) {
      console.error('Error loading onboarding data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Salva dados do onboarding
  const saveOnboardingData = async (
    userId: string,
    profileType: UserProfileType,
    intencao: string,
    objetivoPrincipal: string,
    situacaoMoradia: string,
    valorPrincipal: string,
    criteriaWeights: Record<string, number>,
    faixaPreco?: string,
    regiaoReferencia?: string
  ) => {
    try {
      // Salva o perfil
      const profileResult = await UserProfileService.saveUserProfile(
        userId,
        profileType,
        intencao,
        objetivoPrincipal,
        situacaoMoradia,
        valorPrincipal,
        faixaPreco,
        regiaoReferencia
      );

      if (!profileResult.success) {
        throw new Error(profileResult.error || 'Erro ao salvar perfil');
      }

      // Salva as preferências de critério
      const preferencesResult = await UserProfileService.saveUserCriteriaPreferences(
        userId,
        criteriaWeights
      );

      if (!preferencesResult.success) {
        throw new Error(preferencesResult.error || 'Erro ao salvar preferências');
      }

      // Recarrega os dados
      await loadOnboardingData(userId);
      
      // Notifica outros componentes sobre a mudança
      window.dispatchEvent(new CustomEvent('criteria-updated'));
      
      toast.success('Perfil configurado com sucesso!');
      return { success: true };
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      toast.error('Erro ao salvar configurações do perfil');
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };
  
  // Salva dados do onboarding aprimorado
  const saveEnhancedOnboardingData = async (
    userId: string,
    profileType: UserProfileType,
    answers: OnboardingAnswers,
    selectedCriteria: string[],
    criteriaWeights: Record<string, number>
  ) => {
    try {
      // Salva o perfil
      const profileResult = await UserProfileService.saveUserProfile(
        userId,
        profileType,
        answers.intencao,
        answers.objetivo_principal,
        answers.situacao_moradia,
        answers.valor_principal,
        answers.faixa_preco,
        answers.regiao_referencia
      );

      if (!profileResult.success) {
        throw new Error(profileResult.error || 'Erro ao salvar perfil');
      }

      // Salva as preferências de critério
      const preferencesResult = await UserProfileService.saveUserCriteriaPreferences(
        userId,
        criteriaWeights
      );

      if (!preferencesResult.success) {
        throw new Error(preferencesResult.error || 'Erro ao salvar preferências');
      }

      // Recarrega os dados
      await loadOnboardingData(userId);
      
      // Notifica outros componentes sobre a mudança
      window.dispatchEvent(new CustomEvent('criteria-updated'));
      
      toast.success('Perfil configurado com sucesso!');
      return { success: true };
    } catch (error) {
      console.error('Error saving enhanced onboarding data:', error);
      toast.error('Erro ao salvar configurações do perfil');
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  };

  // Converte preferências do usuário para CriteriaWeights
  const getUserCriteriaWeights = (): CriteriaWeights | null => {
    if (userPreferences.length === 0) return null;

    // Mapeia os critérios do onboarding para os critérios do sistema
    const criteriaMapping: Record<string, keyof CriteriaWeights> = {
      'preco_total': 'price',
      'preco_por_m2': 'price',
      'tamanho': 'internalSpace',
      'acabamento': 'finishing',
      'localizacao': 'location',
      'proximidade_metro': 'location',
      'seguranca': 'location',
      'proximidade_servicos': 'location',
      'facilidade_entorno': 'location',
      'potencial_valorizacao': 'location',
      'silencio': 'location',
      'estilo_design': 'finishing'
    };

    // Inicializa com valores padrão
    const weights: CriteriaWeights = {
      location: 0,
      internalSpace: 0,
      furniture: 0,
      accessibility: 0,
      finishing: 0,
      price: 0,
      condo: 0
    };

    // Calcula o total dos pesos
    const totalWeight = userPreferences.reduce((sum, pref) => sum + pref.peso, 0);
    if (totalWeight === 0) return null;

    // Mapeia e agrupa os pesos
    const groupedWeights: Record<keyof CriteriaWeights, number> = {
      location: 0,
      internalSpace: 0,
      furniture: 0,
      accessibility: 0,
      finishing: 0,
      price: 0,
      condo: 0
    };

    userPreferences.forEach(pref => {
      const mappedCriterion = criteriaMapping[pref.criterio_nome];
      if (mappedCriterion) {
        groupedWeights[mappedCriterion] += pref.peso;
      }
    });

    // Normaliza os pesos para o formato do CriteriaWeights (1-5)
    const maxWeight = Math.max(...Object.values(groupedWeights));
    if (maxWeight === 0) return null;

    Object.entries(groupedWeights).forEach(([key, weight]) => {
      // Converte para escala 1-5 baseado no peso relativo
      weights[key as keyof CriteriaWeights] = Math.max(1, Math.round((weight / maxWeight) * 5));
    });

    return weights;
  };

  // Inicializa o onboarding baseado no estado de autenticação
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await loadOnboardingData(session.user.id);
      } else {
        setIsLoading(false);
      }
    };

    checkAuthAndLoadData();

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadOnboardingData(session.user.id);
        } else {
          setUserProfile(null);
          setUserPreferences([]);
          setHasCompletedOnboarding(false);
          setIsLoading(false);
        }
      }
    );

    // Escuta eventos de sessão restaurada
    const handleSessionRefresh = async () => {
      console.log('useOnboarding: Sessão restaurada, revalidando dados...');
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadOnboardingData(session.user.id);
      }
    };

    window.addEventListener('session-refreshed', handleSessionRefresh);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('session-refreshed', handleSessionRefresh);
    };
  }, []);

  return {
    userProfile,
    userPreferences,
    hasCompletedOnboarding,
    isLoading,
    showOnboarding,
    setShowOnboarding,
    loadOnboardingData,
    saveOnboardingData,
    saveEnhancedOnboardingData,
    getUserCriteriaWeights
  };
};