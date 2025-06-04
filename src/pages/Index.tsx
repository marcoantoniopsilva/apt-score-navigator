
import React, { useState, useEffect } from 'react';
import { Property, CriteriaWeights, DEFAULT_WEIGHTS } from '@/types/property';
import { PropertyCard } from '@/components/PropertyCard';
import { AddPropertyForm } from '@/components/AddPropertyForm';
import { CriteriaWeightsEditor } from '@/components/CriteriaWeightsEditor';
import { RankingControls } from '@/components/RankingControls';
import AppHeader from '@/components/AppHeader';
import { RefreshCw, BarChart3, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateFinalScore } from '@/utils/scoreCalculator';
import { 
  loadSavedProperties, 
  savePropertyToDatabase, 
  updatePropertyInDatabase, 
  deletePropertyFromDatabase 
} from '@/utils/propertyExtractor';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [weights, setWeights] = useState<CriteriaWeights>(DEFAULT_WEIGHTS);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sortBy, setSortBy] = useState<'finalScore' | keyof Property['scores']>('finalScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);

  // Carregar propriedades salvas na inicialização
  useEffect(() => {
    if (user) {
      loadProperties();
    }
  }, [user]);

  const loadProperties = async () => {
    try {
      setIsLoading(true);
      console.log('Index: Carregando propriedades do banco...');
      const savedProperties = await loadSavedProperties();
      console.log('Index: Propriedades carregadas do banco:', savedProperties);
      
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

      console.log('Index: Propriedades convertidas:', convertedProperties);
      setProperties(convertedProperties);
      
      if (convertedProperties.length > 0) {
        toast({
          title: "Propriedades carregadas",
          description: `${convertedProperties.length} propriedades carregadas do banco de dados.`,
        });
      }
    } catch (error) {
      console.error('Index: Erro ao carregar propriedades:', error);
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
  }, [weights]);

  const handleAddProperty = async (property: Property) => {
    try {
      console.log('Index: Adicionando nova propriedade:', property);
      const propertyWithScore = {
        ...property,
        finalScore: calculateFinalScore(property.scores, weights)
      };
      
      // Salvar no banco de dados
      console.log('Index: Salvando no banco de dados...');
      await savePropertyToDatabase(propertyWithScore);
      
      // Atualizar o estado local
      setProperties(prev => [...prev, propertyWithScore]);
      setShowAddForm(false);
      
      toast({
        title: "Propriedade adicionada",
        description: "A propriedade foi salva com sucesso no banco de dados.",
      });
      console.log('Index: Propriedade adicionada com sucesso');
    } catch (error) {
      console.error('Index: Erro ao adicionar propriedade:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a propriedade. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateProperty = async (updatedProperty: Property) => {
    try {
      console.log('Index: Atualizando propriedade:', updatedProperty);
      const propertyWithScore = {
        ...updatedProperty,
        finalScore: calculateFinalScore(updatedProperty.scores, weights)
      };
      
      console.log('Index: Propriedade com pontuação recalculada:', propertyWithScore);
      console.log('Index: Enviando para o banco de dados...');
      
      // Atualizar no banco de dados
      const updatedFromDb = await updatePropertyInDatabase(propertyWithScore);
      console.log('Index: Resposta do banco de dados:', updatedFromDb);
      
      // Atualizar o estado local apenas após sucesso no banco
      setProperties(prev => {
        const updated = prev.map(p => p.id === updatedProperty.id ? propertyWithScore : p);
        console.log('Index: Estado local atualizado:', updated);
        return updated;
      });
      
      toast({
        title: "Propriedade atualizada",
        description: "As alterações foram salvas no banco de dados.",
      });
      console.log('Index: Atualização concluída com sucesso');
    } catch (error) {
      console.error('Index: Erro ao atualizar propriedade:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive"
      });
      // Não atualizar o estado local se houve erro no banco
      throw error; // Re-lançar o erro para o PropertyCard saber que falhou
    }
  };

  const handleDeleteProperty = async (id: string) => {
    try {
      console.log('Index: Deletando propriedade:', id);
      // Deletar do banco de dados
      await deletePropertyFromDatabase(id);
      
      // Atualizar o estado local
      setProperties(prev => prev.filter(p => p.id !== id));
      
      toast({
        title: "Propriedade removida",
        description: "A propriedade foi deletada do banco de dados.",
      });
      console.log('Index: Propriedade deletada com sucesso');
    } catch (error) {
      console.error('Index: Erro ao deletar propriedade:', error);
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar a propriedade. Tente novamente.",
        variant: "destructive"
      });
    }
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
      <AppHeader 
        title="Comparador de Imóveis"
        subtitle="Encontre o melhor apartamento para alugar"
        onAddProperty={() => setShowAddForm(true)}
        onRefresh={loadProperties}
        isLoading={isLoading}
      />

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
