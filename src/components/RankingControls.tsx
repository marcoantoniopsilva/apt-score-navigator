
import React from 'react';
import { Property } from '@/types/property';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart3, ArrowUpDown } from 'lucide-react';
import { useCriteria } from '@/hooks/useCriteria';

interface RankingControlsProps {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortByChange: (value: string) => void;
  onSortOrderChange: (value: 'asc' | 'desc') => void;
  propertiesCount: number;
}

export const RankingControls: React.FC<RankingControlsProps> = ({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  propertiesCount
}) => {
  const { activeCriteria } = useCriteria();
  
  const getSortOptions = () => {
    const options = [
      { value: 'finalScore', label: 'Pontuação Final' },
      ...activeCriteria.map(criterion => ({
        value: criterion.key,
        label: criterion.label
      }))
    ];
    return options;
  };

  return (
    <Card className="p-4">
      <div className="flex items-center mb-4">
        <BarChart3 className="h-5 w-5 mr-2" />
        <h3 className="text-lg font-semibold">Ranking</h3>
        {propertiesCount > 0 && (
          <span className="ml-2 text-sm text-gray-600">
            ({propertiesCount} {propertiesCount === 1 ? 'imóvel' : 'imóveis'})
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium mb-2 block">Ordenar por:</label>
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getSortOptions().map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Ordem:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSortOrderChange(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center space-x-1"
          >
            <ArrowUpDown className="h-4 w-4" />
            <span>{sortOrder === 'desc' ? 'Maior → Menor' : 'Menor → Maior'}</span>
          </Button>
        </div>
      </div>

      {propertiesCount > 0 && (
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-gray-600">
            {sortBy === 'finalScore' 
              ? 'Ranking baseado na pontuação ponderada de todos os critérios.'
              : `Ranking baseado apenas no critério: ${activeCriteria.find(c => c.key === sortBy)?.label || sortBy}.`
            }
          </p>
        </div>
      )}
    </Card>
  );
};
