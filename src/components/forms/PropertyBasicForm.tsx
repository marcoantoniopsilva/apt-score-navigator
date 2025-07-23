
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PropertyBasicFormProps {
  formData: {
    title: string;
    address: string;
    floor: string;
  };
  onUpdateField: (field: string, value: string) => void;
}

export const PropertyBasicForm: React.FC<PropertyBasicFormProps> = ({
  formData,
  onUpdateField
}) => {
  console.log('PropertyBasicForm: Renderizando com formData:', formData);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`PropertyBasicForm: Campo ${name} alterado para:`, value);
    console.log('PropertyBasicForm: Chamando onUpdateField...');
    onUpdateField(name, value);
  };
  
  return (
    <>
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Digite o título da propriedade"
          />
          <div className="text-xs text-gray-500 mt-1">
            Debug: "{formData.title}"
          </div>
        </div>
        <div>
          <Label htmlFor="address">Endereço</Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            placeholder="Digite o endereço da propriedade"
          />
          <div className="text-xs text-gray-500 mt-1">
            Debug: "{formData.address}"
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="floor">Andar</Label>
        <Input
          id="floor"
          name="floor"
          value={formData.floor}
          onChange={handleChange}
          placeholder="Ex: 3º andar, Térreo, etc."
        />
        <div className="text-xs text-gray-500 mt-1">
          Debug: "{formData.floor}"
        </div>
      </div>
    </>
  );
};
