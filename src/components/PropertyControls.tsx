
import React from 'react';
import { CriteriaWeights, Property } from '@/types/property';
import { CriteriaWeightsEditor } from '@/components/CriteriaWeightsEditor';
import { RankingControls } from '@/components/RankingControls';

interface PropertyControlsProps {
  weights: CriteriaWeights;
  onWeightsChange: (weights: CriteriaWeights) => void;
  sortBy: 'finalScore' | keyof Property['scores'];
  sortOrder: 'asc' | 'desc';
  onSortByChange: (sortBy: 'finalScore' | keyof Property['scores']) => void;
  onSortOrderChange: (sortOrder: 'asc' | 'desc') => void;
  propertiesCount: number;
}

const PropertyControls: React.FC<PropertyControlsProps> = ({
  weights,
  onWeightsChange,
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  propertiesCount
}) => {
  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      <CriteriaWeightsEditor 
        weights={weights} 
        onWeightsChange={onWeightsChange} 
      />
      <RankingControls
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortByChange={onSortByChange}
        onSortOrderChange={onSortOrderChange}
        propertiesCount={propertiesCount}
      />
    </div>
  );
};

export default PropertyControls;
