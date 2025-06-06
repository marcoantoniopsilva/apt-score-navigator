
import { useState } from 'react';
import { Property, CriteriaWeights } from '@/types/property';
import { calculateFinalScore } from '@/utils/scoreCalculator';
import { 
  savePropertyToDatabase, 
  updatePropertyInDatabase, 
  deletePropertyFromDatabase 
} from '@/services/propertyDatabaseService';
import { useToast } from '@/hooks/use-toast';

export const usePropertyActions = (
  properties: Property[],
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>,
  weights: CriteriaWeights,
  loadProperties: () => Promise<void>
) => {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddProperty = async (property: Property) => {
    try {
      console.log('PropertyActions: Adicionando nova propriedade:', property);
      const propertyWithScore = {
        ...property,
        finalScore: calculateFinalScore(property.scores, weights)
      };
      
      console.log('PropertyActions: Salvando no banco de dados...');
      await savePropertyToDatabase(propertyWithScore);
      
      // Em vez de adicionar ao estado local, recarregar as propriedades do banco
      console.log('PropertyActions: Recarregando propriedades do banco...');
      await loadProperties();
      
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
        finalScore: calculateFinalScore(updatedProperty.scores, weights)
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
      console.log('PropertyActions: Deletando propriedade:', id);
      await deletePropertyFromDatabase(id);
      
      setProperties(prev => prev.filter(p => p.id !== id));
      
      toast({
        title: "Propriedade removida",
        description: "A propriedade foi deletada do banco de dados.",
      });
      console.log('PropertyActions: Propriedade deletada com sucesso');
    } catch (error) {
      console.error('PropertyActions: Erro ao deletar propriedade:', error);
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar a propriedade. Tente novamente.",
        variant: "destructive"
      });
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
