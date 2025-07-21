
import React from 'react';
import { CriteriaWeights, Property } from '@/types/property';
import { RankingControls } from '@/components/RankingControls';

interface PropertyControlsProps {
  weights: CriteriaWeights;
  onWeightsChange: (weights: CriteriaWeights) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortByChange: (sortBy: string) => void;
  onSortOrderChange: (sortOrder: 'asc' | 'desc') => void;
  propertiesCount: number;
}

const PropertyControls: React.FC<PropertyControlsProps> = ({
  sortBy,
  sortOrder,
  onSortByChange,
  onSortOrderChange,
  propertiesCount
}) => {
  return (
    <div className="mb-6">
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
