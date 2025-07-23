
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
  onUpdateField: (field: string, value: number) => void;
}

export const PropertyDetailsForm: React.FC<PropertyDetailsFormProps> = ({
  formData,
  onUpdateField
}) => {
  console.log('PropertyDetailsForm: Renderizando com formData:', formData);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = Number(value) || 0;
    console.log(`PropertyDetailsForm: Campo ${name} alterado para:`, numericValue);
    console.log('PropertyDetailsForm: Chamando onUpdateField...');
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
          value={formData.bedrooms}
          onChange={handleChange}
          required
        />
        <div className="text-xs text-gray-500 mt-1">
          Debug: {formData.bedrooms}
        </div>
      </div>
      <div>
        <Label htmlFor="bathrooms">Banheiros</Label>
        <Input
          id="bathrooms"
          name="bathrooms"
          type="number"
          min="0"
          value={formData.bathrooms}
          onChange={handleChange}
          required
        />
        <div className="text-xs text-gray-500 mt-1">
          Debug: {formData.bathrooms}
        </div>
      </div>
      <div>
        <Label htmlFor="parkingSpaces">Vagas</Label>
        <Input
          id="parkingSpaces"
          name="parkingSpaces"
          type="number"
          min="0"
          value={formData.parkingSpaces}
          onChange={handleChange}
          required
        />
        <div className="text-xs text-gray-500 mt-1">
          Debug: {formData.parkingSpaces}
        </div>
      </div>
      <div>
        <Label htmlFor="area">Área (m²)</Label>
        <Input
          id="area"
          name="area"
          type="number"
          min="0"
          value={formData.area}
          onChange={handleChange}
          required
        />
        <div className="text-xs text-gray-500 mt-1">
          Debug: {formData.area}
        </div>
      </div>
    </div>
  );
};
