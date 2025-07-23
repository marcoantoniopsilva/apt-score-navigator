
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PropertyDetailsFormProps {
  formData: {
    bedrooms: number;
    bathrooms: number;
    parkingSpaces: number;
    area: number;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PropertyDetailsForm: React.FC<PropertyDetailsFormProps> = ({
  formData,
  onInputChange
}) => {
  console.log('PropertyDetailsForm: Renderizando com formData:', formData);
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <Label htmlFor="bedrooms">Quartos</Label>
        <Input
          id="bedrooms"
          name="bedrooms"
          type="number"
          min="0"
          value={formData.bedrooms}
          onChange={onInputChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="bathrooms">Banheiros</Label>
        <Input
          id="bathrooms"
          name="bathrooms"
          type="number"
          min="0"
          value={formData.bathrooms}
          onChange={onInputChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="parkingSpaces">Vagas</Label>
        <Input
          id="parkingSpaces"
          name="parkingSpaces"
          type="number"
          min="0"
          value={formData.parkingSpaces}
          onChange={onInputChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="area">Área (m²)</Label>
        <Input
          id="area"
          name="area"
          type="number"
          min="0"
          value={formData.area}
          onChange={onInputChange}
          required
        />
      </div>
    </div>
  );
};
