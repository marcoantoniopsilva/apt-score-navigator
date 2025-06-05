
import React from 'react';
import { Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, MapPin } from 'lucide-react';

interface PropertyHeaderProps {
  property: Property;
  rank: number;
  isEditing: boolean;
  onEditToggle: () => void;
  onDelete: (id: string) => void;
}

export const PropertyHeader: React.FC<PropertyHeaderProps> = ({
  property,
  rank,
  isEditing,
  onEditToggle,
  onDelete
}) => {
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500';
    if (rank === 2) return 'bg-gray-400';
    if (rank === 3) return 'bg-amber-600';
    return 'bg-blue-500';
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50';
    if (score >= 4) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <div className={`${getRankColor(rank)} text-white px-2 sm:px-3 py-1 rounded-full font-bold text-sm flex-shrink-0`}>
          #{rank}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{property.title}</h3>
          <div className="flex items-center text-gray-600 mt-1">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="text-sm truncate">{property.address}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
        <div className="text-right">
          <div className={`text-xl sm:text-2xl font-bold px-2 sm:px-3 py-1 rounded-lg ${getScoreColor(property.finalScore)}`}>
            {property.finalScore.toFixed(1)}
          </div>
          <span className="text-xs text-gray-500">Pontuação</span>
        </div>
        <div className="flex flex-col space-y-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onEditToggle}
            className="h-8 w-8 sm:h-9 sm:w-auto sm:px-2"
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Editar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(property.id)}
            className="text-red-600 hover:text-red-700 h-8 w-8 sm:h-9 sm:w-auto sm:px-2"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">Excluir</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
