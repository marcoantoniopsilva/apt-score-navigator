
import { useState } from 'react';
import { Property, CriteriaWeights } from '@/types/property';
import { calculateFinalScore } from '@/utils/scoreCalculator';
import { 
  savePropertyToDatabase, 
  updatePropertyInDatabase, 
  deletePropertyFromDatabase 
} from '@/services/propertyDatabaseService';
import { useToast } from '@/hooks/use-toast';
import { apiCall } from '@/utils/apiUtils';

export const usePropertyActions = (
  properties: Property[],
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>,
  criteriaWeights: CriteriaWeights,
  loadProperties: () => Promise<void>
) => {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddProperty = async (property: Property) => {
    try {
      console.log('PropertyActions: Adicionando nova propriedade:', property);
      
      // Se a propriedade tem scores da IA (vindos da extração), usar eles diretamente
      // Se não, calcular baseado nos critérios do usuário
      const hasAIScores = property.scores && Object.keys(property.scores).length > 0;
      
      const propertyWithScore = {
        ...property,
        finalScore: hasAIScores 
          ? calculateFinalScore(property.scores, criteriaWeights)
          : calculateFinalScore(property.scores, criteriaWeights)
      };
      
      console.log('PropertyActions: Usando scores da IA:', hasAIScores ? 'SIM' : 'NÃO');
      console.log('PropertyActions: Scores finais:', propertyWithScore.scores);
      console.log('PropertyActions: Salvando no banco de dados...');
      const savedProperty = await savePropertyToDatabase(propertyWithScore);
      console.log('PropertyActions: Propriedade salva, resposta do banco:', savedProperty);
      
      // Usar a propriedade retornada do banco (com ID correto) em vez da local
      const propertyFromDb: Property = {
        id: savedProperty.id,
        title: savedProperty.title,
        address: savedProperty.address,
        bedrooms: savedProperty.bedrooms,
        bathrooms: savedProperty.bathrooms,
        parkingSpaces: savedProperty.parking_spaces,
        area: savedProperty.area,
        floor: savedProperty.floor || '',
        rent: savedProperty.rent,
        condo: savedProperty.condo,
        iptu: savedProperty.iptu,
        fireInsurance: savedProperty.fire_insurance,
        otherFees: savedProperty.other_fees,
        totalMonthlyCost: savedProperty.total_monthly_cost,
        images: savedProperty.images || [],
        sourceUrl: savedProperty.source_url || undefined,
        locationSummary: savedProperty.location_summary || undefined,
        scores: (savedProperty.scores as any) || propertyWithScore.scores,
        finalScore: Number(savedProperty.final_score)
      };
      
      console.log('PropertyActions: Adicionando ao estado local a propriedade do banco:', propertyFromDb);
      setProperties(prev => {
        // Verificar se a propriedade já existe para evitar duplicatas
        const exists = prev.find(p => p.id === propertyFromDb.id);
        if (exists) {
          console.log('PropertyActions: Propriedade já existe no estado, ignorando...');
          return prev;
        }
        
        const newProperties = [...prev, propertyFromDb];
        console.log('PropertyActions: Estado atualizado com nova propriedade do banco');
        return newProperties;
      });
      
      setShowAddForm(false);
      
      toast({
        title: "Propriedade adicionada",
        description: "A propriedade foi salva com sucesso no banco de dados.",
      });
      console.log('PropertyActions: Propriedade adicionada com sucesso');
    } catch (error) {
      console.error('PropertyActions: Erro ao adicionar propriedade:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a propriedade. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateProperty = async (updatedProperty: Property) => {
    try {
      console.log('=== INÍCIO HANDLE UPDATE ===');
      console.log('PropertyActions: Propriedade recebida para atualização:', updatedProperty);
      console.log('PropertyActions: Scores atuais:', updatedProperty.scores);
      
      const propertyWithScore = {
        ...updatedProperty,
        finalScore: calculateFinalScore(updatedProperty.scores, criteriaWeights)
      };
      
      console.log('PropertyActions: Propriedade com pontuação recalculada:', propertyWithScore);
      console.log('PropertyActions: Scores que serão enviados para o banco:', propertyWithScore.scores);
      console.log('PropertyActions: Final score calculado:', propertyWithScore.finalScore);
      console.log('PropertyActions: Enviando para o banco de dados...');
      
      const updatedFromDb = await updatePropertyInDatabase(propertyWithScore);
      console.log('PropertyActions: Resposta do banco de dados:', updatedFromDb);
      
      setProperties(prev => {
        const updated = prev.map(p => p.id === updatedProperty.id ? propertyWithScore : p);
        console.log('PropertyActions: Estado local atualizado');
        console.log('PropertyActions: Propriedade atualizada no estado:', updated.find(p => p.id === updatedProperty.id));
        return updated;
      });
      
      toast({
        title: "Propriedade atualizada",
        description: "As alterações foram salvas no banco de dados.",
      });
      console.log('PropertyActions: Atualização concluída com sucesso');
      console.log('=== FIM HANDLE UPDATE ===');
    } catch (error) {
      console.error('PropertyActions: Erro ao atualizar propriedade:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleDeleteProperty = async (id: string) => {
    try {
      console.log('PropertyActions: Iniciando exclusão da propriedade:', id);
      console.log('PropertyActions: Propriedades atuais no estado:', properties.map(p => ({ id: p.id, title: p.title })));
      
      // Use apiCall wrapper for better session management
      await apiCall(
        () => deletePropertyFromDatabase(id),
        { retries: 3, refreshOnAuth: true }
      );
      console.log('PropertyActions: Propriedade deletada do banco com sucesso');
      
      setProperties(prev => {
        const filtered = prev.filter(p => p.id !== id);
        console.log('PropertyActions: Estado atualizado, propriedades restantes:', filtered.map(p => ({ id: p.id, title: p.title })));
        return filtered;
      });
      
      toast({
        title: "Propriedade removida",
        description: "A propriedade foi deletada do banco de dados.",
      });
      console.log('PropertyActions: Propriedade deletada com sucesso');
    } catch (error) {
      console.error('PropertyActions: Erro ao deletar propriedade:', error);
      
      // Check if it's a session-related error
      if (error instanceof Error && error.message.includes('Session expired')) {
        toast({
          title: "Sessão expirada",
          description: "Sua sessão expirou. Por favor, atualize a página e tente novamente.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro ao deletar",
          description: "Não foi possível deletar a propriedade. Tente novamente.",
          variant: "destructive"
        });
      }
    }
  };

  return {
    showAddForm,
    setShowAddForm,
    handleAddProperty,
    handleUpdateProperty,
    handleDeleteProperty
  };
};
