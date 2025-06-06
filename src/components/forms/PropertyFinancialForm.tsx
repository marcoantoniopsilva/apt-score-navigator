
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PropertyFinancialFormProps {
  formData: {
    rent: number;
    condo: number;
    iptu: number;
    fireInsurance: number;
    otherFees: number;
  };
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PropertyFinancialForm: React.FC<PropertyFinancialFormProps> = ({
  formData,
  onInputChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <Label htmlFor="rent">Aluguel (R$)</Label>
        <Input
          id="rent"
          name="rent"
          type="number"
          min="0"
          value={formData.rent}
          onChange={onInputChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="condo">Condomínio (R$)</Label>
        <Input
          id="condo"
          name="condo"
          type="number"
          min="0"
          value={formData.condo}
          onChange={onInputChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="iptu">IPTU (R$)</Label>
        <Input
          id="iptu"
          name="iptu"
          type="number"
          min="0"
          value={formData.iptu}
          onChange={onInputChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="fireInsurance">Seguro Incêndio (R$)</Label>
        <Input
          id="fireInsurance"
          name="fireInsurance"
          type="number"
          min="0"
          value={formData.fireInsurance}
          onChange={onInputChange}
          required
        />
      </div>
      <div>
        <Label htmlFor="otherFees">Outras Taxas (R$)</Label>
        <Input
          id="otherFees"
          name="otherFees"
          type="number"
          min="0"
          value={formData.otherFees}
          onChange={onInputChange}
          required
        />
      </div>
    </div>
  );
};
