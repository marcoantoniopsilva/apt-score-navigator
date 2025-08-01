
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PropertyBasicFormProps {
  formData: {
    title: string;
    address: string;
    floor: string;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PropertyBasicForm: React.FC<PropertyBasicFormProps> = ({
  formData,
  onInputChange
}) => {
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
            onChange={onInputChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="address">Endereço</Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={onInputChange}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="floor">Andar</Label>
        <Input
          id="floor"
          name="floor"
          value={formData.floor}
          onChange={onInputChange}
        />
      </div>
    </>
  );
};
