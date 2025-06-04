
import React from 'react';
import { Property, CriteriaWeights } from '@/types/property';
import { PropertyCard } from '@/components/PropertyCard';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';

interface PropertyListProps {
  properties: Property[];
  weights: CriteriaWeights;
  isLoading: boolean;
  onUpdate: (property: Property) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddProperty: () => void;
  sortBy: 'finalScore' | keyof Property['scores'];
  sortOrder: 'asc' | 'desc';
}

const PropertyList: React.FC<PropertyListProps> = ({
  properties,
  weights,
  isLoading,
  onUpdate,
  onDelete,
  onAddProperty,
  sortBy,
  sortOrder
}) => {
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

  if (isLoading) {
    return <LoadingState />;
  }

  if (properties.length === 0) {
    return <EmptyState onAddProperty={onAddProperty} />;
  }

  return (
    <div className="space-y-6">
      {sortedProperties.map((property, index) => (
        <PropertyCard
          key={property.id}
          property={property}
          rank={index + 1}
          weights={weights}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default PropertyList;
