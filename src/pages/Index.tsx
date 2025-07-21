
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CriteriaWeights, DEFAULT_WEIGHTS } from '@/types/property';
import { AddPropertyForm } from '@/components/AddPropertyForm';
import PropertyControls from '@/components/PropertyControls';
import PropertyList from '@/components/PropertyList';
import AppHeader from '@/components/AppHeader';
import { AppExplanation } from '@/components/AppExplanation';
import { MobileWeightsEditor } from '@/components/MobileWeightsEditor';
import { PropertyComparison } from '@/components/PropertyComparison';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { calculateFinalScore } from '@/utils/scoreCalculator';
import { usePropertyLoader } from '@/hooks/usePropertyLoader';
import { usePropertyActions } from '@/hooks/usePropertyActions';
import { usePropertySorting } from '@/hooks/usePropertySorting';
import { usePropertyComparison } from '@/hooks/usePropertyComparison';
import { useSubscription } from '@/hooks/useSubscription';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useCriteria } from '@/hooks/useCriteria';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { UpgradeModal } from '@/components/UpgradeModal';
import { UserProfileType } from '@/types/onboarding';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Index = () => {
  const [comparisonMode, setComparisonMode] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const { properties, setProperties, isLoading, loadProperties } = usePropertyLoader();
  const { sortBy, sortOrder, setSortBy, setSortOrder } = usePropertySorting();
  const { isPro, loading: subscriptionLoading } = useSubscription();
  
  // Hook de critérios dinâmicos (substitui o sistema de pesos estático)
  const { criteriaWeights, updateCriteriaWeight } = useCriteria();
  
  // Hook do onboarding
  const {
    hasCompletedOnboarding,
    showOnboarding,
    setShowOnboarding,
    saveOnboardingData,
    isLoading: onboardingLoading
  } = useOnboarding();

  // Mostrar onboarding para usuários autenticados que não completaram
  useEffect(() => {
    const checkShouldShowOnboarding = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && !hasCompletedOnboarding && !onboardingLoading) {
        // Aguarda um pouco para não mostrar imediatamente ao fazer login
        setTimeout(() => {
          setShowOnboarding(true);
        }, 1000);
      }
    };

    checkShouldShowOnboarding();
  }, [hasCompletedOnboarding, onboardingLoading, setShowOnboarding]);

  // Função para completar onboarding
  const handleOnboardingComplete = async (
    profile: UserProfileType,
    criteria: string[],
    weights: Record<string, number>
  ) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const result = await saveOnboardingData(
        session.user.id,
        profile,
        'objetivo_principal', // Você pode ajustar isso baseado no profile
        'situacao_moradia',   // Você pode ajustar isso baseado no profile  
        'valor_principal',    // Você pode ajustar isso baseado no profile
        weights
      );
      
      if (result.success) {
        setShowOnboarding(false);
        // Os critérios serão atualizados automaticamente pelo useCriteria hook
      }
    }
  };
  
  // Verificar limites do plano gratuito
  const handleAddPropertyWithLimits = () => {
    if (!isPro && properties.length >= 5) {
      toast.error('Limite de 5 propriedades atingido. Faça upgrade para o plano Pro para adicionar mais propriedades.');
      setShowUpgradeModal(true);
      return;
    }
    setShowAddForm(true);
  };

  const handleComparisonWithLimits = () => {
    if (!isPro) {
      toast.error('Funcionalidade de comparação disponível apenas no plano Pro.');
      setShowUpgradeModal(true);
      return;
    }
    setComparisonMode(true);
  };

  const {
    showAddForm,
    setShowAddForm,
    handleAddProperty,
    handleUpdateProperty,
    handleDeleteProperty
  } = usePropertyActions(properties, setProperties, criteriaWeights, loadProperties);

  const {
    selectedProperties,
    isComparisonOpen,
    togglePropertySelection,
    removeProperty,
    clearSelection,
    openComparison,
    closeComparison,
    isPropertySelected,
    selectedCount,
    canCompare
  } = usePropertyComparison();

  // Usar useMemo para recalcular pontuações apenas quando pesos mudarem
  const propertiesWithUpdatedScores = useMemo(() => {
    if (properties.length === 0) return [];
    
    console.log('Index: Recalculando pontuações com novos pesos...');
    return properties.map(property => {
      const newFinalScore = calculateFinalScore(property.scores, criteriaWeights);
      console.log(`Index: Propriedade ${property.id} - nova pontuação: ${newFinalScore}`);
      return {
        ...property,
        finalScore: newFinalScore
      };
    });
  }, [properties, criteriaWeights]);

  // Atualizar o estado apenas quando necessário
  useEffect(() => {
    if (propertiesWithUpdatedScores.length > 0) {
      // Verificar se realmente houve mudança nas pontuações finais
      const scoresChanged = propertiesWithUpdatedScores.some((prop, index) => 
        properties[index] && prop.finalScore !== properties[index].finalScore
      );
      
      if (scoresChanged) {
        console.log('Index: Atualizando propriedades com novas pontuações...');
        setProperties(propertiesWithUpdatedScores);
      }
    }
  }, [propertiesWithUpdatedScores, setProperties]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AppHeader 
        title="Comparador de Imóveis"
        subtitle="Encontre o melhor apartamento para alugar"
        onAddProperty={handleAddPropertyWithLimits}
        onRefresh={loadProperties}
        isLoading={isLoading}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <AppExplanation />
        
        <div className="mb-6">
          <SubscriptionStatus />
        </div>
        
        <PropertyControls
          weights={criteriaWeights}
          onWeightsChange={(newWeights) => {
            // Atualiza cada critério individualmente
            Object.entries(newWeights).forEach(([key, weight]) => {
              updateCriteriaWeight(key, weight);
            });
          }}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
          propertiesCount={properties.length}
        />

        <PropertyList
          properties={properties}
          weights={criteriaWeights}
          isLoading={isLoading}
          onUpdate={handleUpdateProperty}
          onDelete={handleDeleteProperty}
          onAddProperty={handleAddPropertyWithLimits}
          sortBy={sortBy}
          sortOrder={sortOrder}
          selectedProperties={comparisonMode ? selectedProperties : undefined}
          onToggleSelection={comparisonMode ? togglePropertySelection : undefined}
          isPropertySelected={comparisonMode ? isPropertySelected : undefined}
          selectedCount={comparisonMode ? selectedCount : 0}
          canCompare={comparisonMode ? canCompare : false}
          onCompare={comparisonMode ? openComparison : undefined}
          onClearSelection={comparisonMode ? clearSelection : undefined}
          onActivateComparison={handleComparisonWithLimits}
          onDeactivateComparison={() => {
            console.log('Desativando modo comparação');
            setComparisonMode(false);
          }}
          comparisonMode={comparisonMode}
        />

        <MobileWeightsEditor
          weights={criteriaWeights}
          onWeightsChange={(newWeights) => {
            // Atualiza cada critério individualmente
            Object.entries(newWeights).forEach(([key, weight]) => {
              updateCriteriaWeight(key, weight);
            });
          }}
        />
      </div>

      {showAddForm && (
        <AddPropertyForm 
          onSubmit={handleAddProperty}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {isComparisonOpen && (
        <PropertyComparison
          properties={selectedProperties}
          onRemoveProperty={removeProperty}
          onClose={closeComparison}
        />
      )}

      <UpgradeModal 
        open={showUpgradeModal} 
        onOpenChange={setShowUpgradeModal} 
      />

      {showOnboarding && (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onClose={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
};

export default Index;
