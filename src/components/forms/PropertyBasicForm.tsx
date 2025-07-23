
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PropertyBasicFormProps {
  title: string;
  address: string;
  floor: string;
  onUpdateField: (field: string, value: string) => void;
}

export const PropertyBasicForm: React.FC<PropertyBasicFormProps> = ({
  title,
  address,
  floor,
  onUpdateField
}) => {
  console.log('PropertyBasicForm: Renderizando com valores diretos:', { title, address, floor });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`PropertyBasicForm: Campo ${name} alterado para:`, value);
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
            value={title}
            onChange={handleChange}
            required
            placeholder="Digite o título da propriedade"
          />
        </div>
        <div>
          <Label htmlFor="address">Endereço</Label>
          <Input
            id="address"
            name="address"
            value={address}
            onChange={handleChange}
            required
            placeholder="Digite o endereço da propriedade"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="floor">Andar</Label>
        <Input
          id="floor"
          name="floor"
          value={floor}
          onChange={handleChange}
          placeholder="Ex: 3º andar, Térreo, etc."
        />
      </div>
    </>
  );
};
