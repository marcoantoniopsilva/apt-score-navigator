
import React, { useState, useEffect } from 'react';
import { CriteriaWeights, DEFAULT_WEIGHTS } from '@/types/property';
import { AddPropertyForm } from '@/components/AddPropertyForm';
import PropertyControls from '@/components/PropertyControls';
import PropertyList from '@/components/PropertyList';
import AppHeader from '@/components/AppHeader';
import { MobileWeightsEditor } from '@/components/MobileWeightsEditor';
import { calculateFinalScore } from '@/utils/scoreCalculator';
import { usePropertyLoader } from '@/hooks/usePropertyLoader';
import { usePropertyActions } from '@/hooks/usePropertyActions';
import { usePropertySorting } from '@/hooks/usePropertySorting';

const Index = () => {
  const [weights, setWeights] = useState<CriteriaWeights>(DEFAULT_WEIGHTS);
  
  const { properties, setProperties, isLoading, loadProperties } = usePropertyLoader();
  const { sortBy, sortOrder, setSortBy, setSortOrder } = usePropertySorting();
  
  const {
    showAddForm,
    setShowAddForm,
    handleAddProperty,
    handleUpdateProperty,
    handleDeleteProperty
  } = usePropertyActions(properties, setProperties, weights, loadProperties);

  // Recalcular pontuações quando os pesos mudarem
  useEffect(() => {
    if (properties.length === 0) return; // Evitar processamento desnecessário
    
    console.log('Index: Pesos alterados, recalculando pontuações...');
    const updatedProperties = properties.map(property => {
      const newFinalScore = calculateFinalScore(property.scores, weights);
      console.log(`Index: Propriedade ${property.id} - nova pontuação: ${newFinalScore}`);
      return {
        ...property,
        finalScore: newFinalScore
      };
    });
    setProperties(updatedProperties);
  }, [weights]); // Remover properties da dependência para evitar loops

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
    </div>
  );
};

export default Index;
