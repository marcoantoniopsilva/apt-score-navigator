
import React from 'react';
import { BarChart3, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onAddProperty: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddProperty }) => {
  return (
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
          onClick={onAddProperty}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Primeiro Imóvel
        </Button>
      </div>
    </div>
  );
};

export default EmptyState;
