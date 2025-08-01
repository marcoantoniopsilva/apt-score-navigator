
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CriteriaWeights, DEFAULT_WEIGHTS } from '@/types/property';
import { AddPropertyForm } from '@/components/AddPropertyForm';
import PropertyControls from '@/components/PropertyControls';
import PropertyList from '@/components/PropertyList';
import AppHeader from '@/components/AppHeader';
import { AppExplanation } from '@/components/AppExplanation';
import { UserPreferencesDisplay } from '@/components/UserPreferencesDisplay';
import { MobileWeightsEditor } from '@/components/MobileWeightsEditor';
import { PropertyComparison } from '@/components/PropertyComparison';
import { ManualPropertySearch } from '@/components/ManualPropertySearch';
import { SessionManager } from '@/components/SessionManager';

import { calculateFinalScore } from '@/utils/scoreCalculator';
import { usePropertyLoader } from '@/hooks/usePropertyLoader';
import { usePropertyActions } from '@/hooks/usePropertyActions';
import { usePropertySorting } from '@/hooks/usePropertySorting';
import { usePropertyComparison } from '@/hooks/usePropertyComparison';
import { useSubscription } from '@/hooks/useSubscription';
import { useOnboarding } from '@/hooks/useOnboarding';
import { EnhancedOnboardingModal } from '@/components/EnhancedOnboardingModal';
import { useCriteria } from '@/hooks/useCriteria';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { UpgradeModal } from '@/components/UpgradeModal';
import { SessionExpiredMessage } from '@/components/SessionExpiredMessage';
import { UserProfileType } from '@/types/onboarding';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePageRefresh } from '@/hooks/usePageRefresh';
import { useUserAddresses } from '@/hooks/useUserAddresses';
import { useProximityCalculation } from '@/hooks/useProximityCalculation';

const Index = () => {
  const [comparisonMode, setComparisonMode] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [extractedPropertyData, setExtractedPropertyData] = useState<any>(null);
  
  const { properties, setProperties, isLoading, loadProperties } = usePropertyLoader();
  const { sortBy, sortOrder, setSortBy, setSortOrder } = usePropertySorting();
  const { isPro, loading: subscriptionLoading, checkSubscription, sessionError } = useSubscription();
  
  // Hook de critérios dinâmicos - DEVE vir antes de qualquer useEffect/useState condicional
  const { criteriaWeights, updateCriteriaWeight, activeCriteria, getWeightsObject } = useCriteria();
  
  // Hook do onboarding
  const {
    hasCompletedOnboarding,
    showOnboarding,
    setShowOnboarding,
    saveOnboardingData,
    userProfile,
    isLoading: onboardingLoading
  } = useOnboarding();

  // Hook para refresh automático da página
  usePageRefresh();

  // Hook para endereços do usuário e cálculo de proximidade
  const { userAddresses, isLoading: addressesLoading } = useUserAddresses();
  const { enrichedProperties, isProcessing: proximityProcessing } = useProximityCalculation(properties, userAddresses);

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
        'alugar', // valor padrão - isso deveria vir do onboarding
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

  // Função para lidar com dados extraídos do ManualPropertySearch
  const handleExtractedProperty = (propertyData: any) => {
    console.log('Index: Dados extraídos recebidos:', propertyData);
    setExtractedPropertyData(propertyData);
    setShowAddForm(true);
  };

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

  // Recalcula pontuações usando propriedades enriquecidas com proximidade
  const displayedProperties = useMemo(() => {
    console.log('Index: Recalculando pontuações para exibição...');
    return enrichedProperties.map(property => {
      const newFinalScore = calculateFinalScore(property.scores, criteriaWeights);
      return {
        ...property,
        finalScore: newFinalScore
      };
    });
  }, [enrichedProperties, criteriaWeights]);

  // Escuta mudanças nos critérios para forçar atualização das pontuações
  useEffect(() => {
    const handleCriteriaUpdate = () => {
      console.log('Index: Critérios atualizados via evento');
      // O useMemo acima irá recalcular automaticamente
    };

    window.addEventListener('criteria-updated', handleCriteriaUpdate);
    
    return () => {
      window.removeEventListener('criteria-updated', handleCriteriaUpdate);
    };
  }, []);

  return (
    <SessionManager>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <AppHeader 
          title="Imobly"
          subtitle="Seu novo jeito de escolher imóveis"
          onAddProperty={handleAddPropertyWithLimits}
          onRefresh={loadProperties}
          isLoading={isLoading}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <AppExplanation />
          
          {userProfile && (
            <UserPreferencesDisplay
              userProfile={userProfile}
              onEdit={() => setShowOnboarding(true)}
            />
          )}
          
          <div className="mb-6">
            <SessionExpiredMessage error={sessionError} />
          </div>
          
          <div className="mb-6">
            <SubscriptionStatus />
          </div>

          {/* Busca Manual - movido para o topo após o card de plano */}
          {hasCompletedOnboarding && (
            <div className="mb-8">
              <ManualPropertySearch onAddProperty={handleExtractedProperty} />
            </div>
          )}
          
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
            properties={enrichedProperties.length > 0 ? enrichedProperties : displayedProperties}
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
            onReset={() => {
              // Reset para valores padrão dos critérios ativos
              activeCriteria.forEach(criterion => {
                updateCriteriaWeight(criterion.key, 3);
              });
            }}
          />
        </div>

        {showAddForm && (
          <AddPropertyForm 
            onSubmit={handleAddProperty}
            onCancel={() => {
              setShowAddForm(false);
              setExtractedPropertyData(null);
            }}
            extractedData={extractedPropertyData}
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

        <EnhancedOnboardingModal
          open={showOnboarding}
          onOpenChange={setShowOnboarding}
        />
      </div>
    </SessionManager>
  );
};

export default Index;
