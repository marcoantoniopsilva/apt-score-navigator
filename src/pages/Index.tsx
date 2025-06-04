
import React, { useState, useEffect } from 'react';
import { Property, CriteriaWeights, DEFAULT_WEIGHTS } from '@/types/property';
import { PropertyCard } from '@/components/PropertyCard';
import { AddPropertyForm } from '@/components/AddPropertyForm';
import { CriteriaWeightsEditor } from '@/components/CriteriaWeightsEditor';
import { RankingControls } from '@/components/RankingControls';
import { Button } from '@/components/ui/button';
import { Plus, Home, BarChart3, RefreshCw } from 'lucide-react';
import { calculateFinalScore } from '@/utils/scoreCalculator';
import { loadSavedProperties } from '@/utils/propertyExtractor';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [weights, setWeights] = useState<CriteriaWeights>(DEFAULT_WEIGHTS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sortBy, setSortBy] = useState<'finalScore' | keyof Property['scores']>('finalScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);

  // Carregar propriedades salvas na inicialização
  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      const savedProperties = await loadSavedProperties();
      
      // Converter formato do banco para formato da aplicação
      const convertedProperties: Property[] = savedProperties.map(prop => ({
        id: prop.id,
        title: prop.title,
        address: prop.address,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        parkingSpaces: prop.parking_spaces,
        area: prop.area,
        floor: prop.floor || '',
        rent: prop.rent,
        condo: prop.condo,
        iptu: prop.iptu,
        fireInsurance: prop.fire_insurance,
        otherFees: prop.other_fees,
        totalMonthlyCost: prop.total_monthly_cost,
        images: prop.images || [],
        sourceUrl: prop.source_url || undefined,
        scores: {
          location: prop.location_score,
          internalSpace: prop.internal_space_score,
          furniture: prop.furniture_score,
          accessibility: prop.accessibility_score,
          finishing: prop.finishing_score,
          price: prop.price_score,
        },
        finalScore: prop.final_score
      }));

      setProperties(convertedProperties);
      
      if (convertedProperties.length > 0) {
        toast({
          title: "Propriedades carregadas",
          description: `${convertedProperties.length} propriedades carregadas do banco de dados.`,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar propriedades:', error);
      toast({
        title: "Erro ao carregar propriedades",
        description: "Não foi possível carregar as propriedades salvas.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Recalcular pontuações quando os pesos mudarem
  useEffect(() => {
    const updatedProperties = properties.map(property => ({
      ...property,
      finalScore: calculateFinalScore(property.scores, weights)
    }));
    setProperties(updatedProperties);
  }, [weights]);

  const handleAddProperty = (property: Property) => {
    const propertyWithScore = {
      ...property,
      finalScore: calculateFinalScore(property.scores, weights)
    };
    setProperties(prev => [...prev, propertyWithScore]);
    setShowAddForm(false);
    
    toast({
      title: "Propriedade adicionada",
      description: "A propriedade foi salva com sucesso.",
    });
  };

  const handleUpdateProperty = (updatedProperty: Property) => {
    const propertyWithScore = {
      ...updatedProperty,
      finalScore: calculateFinalScore(updatedProperty.scores, weights)
    };
    setProperties(prev => 
      prev.map(p => p.id === updatedProperty.id ? propertyWithScore : p)
    );
  };

  const handleDeleteProperty = (id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const sortedProperties = [...properties].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    if (sortBy === 'finalScore') {
      aValue = a.finalScore;
      bValue = b.finalScore;
    } else {
      aValue = a.scores[sortBy];
      bValue = b.scores[sortBy];
    }

    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Comparador de Imóveis
                </h1>
                <p className="text-gray-600">
                  Encontre o melhor apartamento para alugar
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={loadProperties}
                variant="outline"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Imóvel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controles */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <CriteriaWeightsEditor 
            weights={weights} 
            onWeightsChange={setWeights} 
          />
          <RankingControls
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
            propertiesCount={properties.length}
          />
        </div>

        {/* Lista de Imóveis */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
              <RefreshCw className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Carregando propriedades...
              </h3>
              <p className="text-gray-600">
                Aguarde enquanto carregamos suas propriedades salvas.
              </p>
            </div>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum imóvel adicionado
              </h3>
              <p className="text-gray-600 mb-4">
                Comece adicionando imóveis para comparar e encontrar a melhor opção.
              </p>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Imóvel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedProperties.map((property, index) => (
              <PropertyCard
                key={property.id}
                property={property}
                rank={index + 1}
                weights={weights}
                onUpdate={handleUpdateProperty}
                onDelete={handleDeleteProperty}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Adicionar Imóvel */}
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
