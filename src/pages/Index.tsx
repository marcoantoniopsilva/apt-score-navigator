
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CriteriaWeights, DEFAULT_WEIGHTS } from '@/types/property';
import { AddPropertyForm } from '@/components/AddPropertyForm';
import PropertyControls from '@/components/PropertyControls';
import PropertyList from '@/components/PropertyList';
import AppHeader from '@/components/AppHeader';
import { AppExplanation } from '@/components/AppExplanation';
import { MobileWeightsEditor } from '@/components/MobileWeightsEditor';
import { PropertyComparison } from '@/components/PropertyComparison';
import { calculateFinalScore } from '@/utils/scoreCalculator';
import { usePropertyLoader } from '@/hooks/usePropertyLoader';
import { usePropertyActions } from '@/hooks/usePropertyActions';
import { usePropertySorting } from '@/hooks/usePropertySorting';
import { usePropertyComparison } from '@/hooks/usePropertyComparison';

const Index = () => {
  const [weights, setWeights] = useState<CriteriaWeights>(DEFAULT_WEIGHTS);
  const [comparisonMode, setComparisonMode] = useState(false);
  
  const { properties, setProperties, isLoading, loadProperties } = usePropertyLoader();
  const { sortBy, sortOrder, setSortBy, setSortOrder } = usePropertySorting();
  
  const {
    showAddForm,
    setShowAddForm,
    handleAddProperty,
    handleUpdateProperty,
    handleDeleteProperty
  } = usePropertyActions(properties, setProperties, weights, loadProperties);

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
      const newFinalScore = calculateFinalScore(property.scores, weights);
      console.log(`Index: Propriedade ${property.id} - nova pontuação: ${newFinalScore}`);
      return {
        ...property,
        finalScore: newFinalScore
      };
    });
  }, [properties, weights]);

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
        onAddProperty={() => setShowAddForm(true)}
        onRefresh={loadProperties}
        isLoading={isLoading}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <AppExplanation />
        
        <PropertyControls
          weights={weights}
          onWeightsChange={setWeights}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortByChange={setSortBy}
          onSortOrderChange={setSortOrder}
          propertiesCount={properties.length}
        />

        <PropertyList
          properties={properties}
          weights={weights}
          isLoading={isLoading}
          onUpdate={handleUpdateProperty}
          onDelete={handleDeleteProperty}
          onAddProperty={() => setShowAddForm(true)}
          sortBy={sortBy}
          sortOrder={sortOrder}
          selectedProperties={comparisonMode ? selectedProperties : undefined}
          onToggleSelection={comparisonMode ? togglePropertySelection : undefined}
          isPropertySelected={comparisonMode ? isPropertySelected : undefined}
          selectedCount={comparisonMode ? selectedCount : 0}
          canCompare={comparisonMode ? canCompare : false}
          onCompare={comparisonMode ? openComparison : undefined}
          onClearSelection={comparisonMode ? clearSelection : undefined}
          onActivateComparison={() => setComparisonMode(true)}
          onDeactivateComparison={() => setComparisonMode(false)}
          comparisonMode={comparisonMode}
        />

        <MobileWeightsEditor
          weights={weights}
          onWeightsChange={setWeights}
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
    </div>
  );
};

export default Index;
