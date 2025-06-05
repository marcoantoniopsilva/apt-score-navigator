
import React from 'react';
import { Property } from '@/types/property';
import { Home, Car } from 'lucide-react';

interface PropertyBasicInfoProps {
  property: Property;
}

export const PropertyBasicInfo: React.FC<PropertyBasicInfoProps> = ({ property }) => {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6 text-sm">
      <div className="flex items-center space-x-2">
        <Home className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <span className="truncate">{property.bedrooms} quartos</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="h-4 w-4 text-gray-500 flex-shrink-0">🚿</div>
        <span className="truncate">{property.bathrooms} banheiros</span>
      </div>
      <div className="flex items-center space-x-2">
        <Car className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <span className="truncate">{property.parkingSpaces} vagas</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="truncate">{property.area}m² - {property.floor}</span>
      </div>
    </div>
  );
};
