
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PropertyDetailsFormProps {
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  area: number;
  onUpdateField: (field: string, value: number) => void;
}

export const PropertyDetailsForm: React.FC<PropertyDetailsFormProps> = ({
  bedrooms,
  bathrooms,
  parkingSpaces,
  area,
  onUpdateField
}) => {
  console.log('🏗️ PropertyDetailsForm renderizando:', { bedrooms, bathrooms, parkingSpaces, area });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = Number(value) || 0;
    console.log(`🔢 Campo ${name} alterado para:`, numericValue);
    onUpdateField(name, numericValue);
  };
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <Label htmlFor="bedrooms">Quartos</Label>
        <Input
          id="bedrooms"
          name="bedrooms"
          type="number"
          min="0"
          value={bedrooms}
          onChange={handleChange}
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
          value={bathrooms}
          onChange={handleChange}
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
          value={parkingSpaces}
          onChange={handleChange}
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
          value={area}
          onChange={handleChange}
          required
        />
      </div>
    </div>
  );
};
