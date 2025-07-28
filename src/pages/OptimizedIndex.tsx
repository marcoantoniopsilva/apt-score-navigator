import React, { useState, useEffect, useMemo } from 'react';
import { AddPropertyForm } from '@/components/AddPropertyForm';
import PropertyControls from '@/components/PropertyControls';
import { OptimizedPropertyList } from '@/components/OptimizedPropertyList';
import AppHeader from '@/components/AppHeader';
import { AppExplanation } from '@/components/AppExplanation';
import { UserPreferencesDisplay } from '@/components/UserPreferencesDisplay';
import { MobileWeightsEditor } from '@/components/MobileWeightsEditor';
import { PropertyComparison } from '@/components/PropertyComparison';
import { ManualPropertySearch } from '@/components/ManualPropertySearch';

import { calculateFinalScore } from '@/utils/scoreCalculator';
import { useOptimizedProperties } from '@/hooks/useOptimizedProperties';
import { useOptimizedCriteria } from '@/hooks/useOptimizedCriteria';
import { useSimpleSession } from '@/hooks/useSimpleSession';
import { usePropertyActions } from '@/hooks/usePropertyActions';
import { usePropertySorting } from '@/hooks/usePropertySorting';
import { usePropertyComparison } from '@/hooks/usePropertyComparison';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useTabVisibility } from '@/hooks/useTabVisibility';
import { EnhancedOnboardingModal } from '@/components/EnhancedOnboardingModal';
import { UserProfileType } from '@/types/onboarding';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Optimized Index page with React Query, minimal re-renders, and simplified session management
 */
const OptimizedIndex = () => {
  const [comparisonMode, setComparisonMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [extractedPropertyData, setExtractedPropertyData] = useState<any>(null);

  // Simplified session management
  const { isAuthenticated, isReady } = useSimpleSession();
  
  // Tab visibility hook - ativa automaticamente nas mudanças de aba
  useTabVisibility();
  
  // Optimized hooks with caching
  const { properties, isLoading, refreshProperties, updateProperty, removeProperty } = useOptimizedProperties();
  const { criteriaWeights, updateCriteriaWeight, activeCriteria, getWeightsObject, isLoading: criteriaLoading } = useOptimizedCriteria();
  const { sortBy, sortOrder, setSortBy, setSortOrder } = usePropertySorting();
  
  // Onboarding hook
  const {
    hasCompletedOnboarding,
    showOnboarding,
    setShowOnboarding,
    saveOnboardingData,
    userProfile,
    isLoading: onboardingLoading
  } = useOnboarding();

  // Property comparison hook
  const {
    selectedProperties,
    isComparisonOpen,
    togglePropertySelection,
    removeProperty: removeFromComparison,
    clearSelection,
    openComparison,
    closeComparison,
    isPropertySelected,
    selectedCount,
    canCompare
  } = usePropertyComparison();

  // Show onboarding for authenticated users who haven't completed it
  useEffect(() => {
    const checkShouldShowOnboarding = async () => {
      if (isAuthenticated && !hasCompletedOnboarding && !onboardingLoading) {
        setTimeout(() => {
          setShowOnboarding(true);
        }, 1000);
      }
    };

    if (isReady) {
      checkShouldShowOnboarding();
    }
  }, [isAuthenticated, isReady, hasCompletedOnboarding, onboardingLoading, setShowOnboarding]);

  // Handle onboarding completion
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
        'alugar',
        'objetivo_principal',
        'situacao_moradia',
        'valor_principal',
        weights
      );
      
      if (result.success) {
        setShowOnboarding(false);
      }
    }
  };

  // Property actions
  const handleAddProperty = () => {
    setShowAddForm(true);
  };

  const handleToggleComparison = () => {
    setComparisonMode(!comparisonMode);
  };

  const handleAddPropertySubmit = async (propertyData: any) => {
    // This would normally trigger a mutation and refresh the cache
    console.log('Adding property:', propertyData);
    setShowAddForm(false);
    setExtractedPropertyData(null);
    refreshProperties();
  };

  const handleUpdateProperty = async (updatedProperty: any) => {
    console.log('Updating property:', updatedProperty);
    updateProperty(updatedProperty);
  };

  const handleDeleteProperty = async (propertyId: string) => {
    console.log('Deleting property:', propertyId);
    removeProperty(propertyId);
  };

  const handleExtractedProperty = (propertyData: any) => {
    setExtractedPropertyData(propertyData);
    setShowAddForm(true);
  };

  // Memoized properties with recalculated scores
  const displayedProperties = useMemo(() => {
    if (criteriaLoading) return properties;
    
    return properties.map(property => ({
      ...property,
      finalScore: calculateFinalScore(property.scores, criteriaWeights)
    }));
  }, [properties, criteriaWeights, criteriaLoading]);

  // Handle weights change
  const handleWeightsChange = (newWeights: Record<string, number>) => {
    Object.entries(newWeights).forEach(([key, weight]) => {
      updateCriteriaWeight(key, weight);
    });
  };

  // Handle reset weights
  const handleResetWeights = () => {
    activeCriteria.forEach(criterion => {
      updateCriteriaWeight(criterion.key, 3);
    });
  };

  if (!isReady) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AppHeader 
        title="Imobly"
        subtitle="Seu novo jeito de escolher imóveis"
        onAddProperty={handleAddProperty}
        onRefresh={refreshProperties}
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
        

        {hasCompletedOnboarding && (
          <div className="mb-8">
            <ManualPropertySearch onAddProperty={handleExtractedProperty} />
          </div>
        )}
        
        <PropertyControls
          weights={criteriaWeights}
          onWeightsChange={handleWeightsChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
          propertiesCount={properties.length}
        />

        <OptimizedPropertyList
          properties={displayedProperties}
          weights={criteriaWeights}
          isLoading={isLoading}
          onUpdate={handleUpdateProperty}
          onDelete={handleDeleteProperty}
          onAddProperty={handleAddProperty}
          sortBy={sortBy}
          sortOrder={sortOrder}
          selectedProperties={comparisonMode ? selectedProperties : undefined}
          onToggleSelection={comparisonMode ? togglePropertySelection : undefined}
          isPropertySelected={comparisonMode ? isPropertySelected : undefined}
          selectedCount={comparisonMode ? selectedCount : 0}
          canCompare={comparisonMode ? canCompare : false}
          onCompare={comparisonMode ? openComparison : undefined}
          onClearSelection={comparisonMode ? clearSelection : undefined}
          onActivateComparison={handleToggleComparison}
          onDeactivateComparison={() => setComparisonMode(false)}
          comparisonMode={comparisonMode}
        />

        <MobileWeightsEditor
          weights={criteriaWeights}
          onWeightsChange={handleWeightsChange}
          onReset={handleResetWeights}
        />
      </div>

      {showAddForm && (
        <AddPropertyForm 
          onSubmit={handleAddPropertySubmit}
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
          onRemoveProperty={removeFromComparison}
          onClose={closeComparison}
        />
      )}


      <EnhancedOnboardingModal
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
      />
    </div>
  );
};

export default OptimizedIndex;