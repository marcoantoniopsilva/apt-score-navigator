
import React from 'react';
import { Property } from '@/types/property';
import { Calculator } from 'lucide-react';

interface PropertyCostsProps {
  property: Property;
}

export const PropertyCosts: React.FC<PropertyCostsProps> = ({ property }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-6">
      <div className="flex items-center mb-3">
        <Calculator className="h-4 w-4 mr-2 text-gray-600" />
        <h4 className="font-medium text-gray-900">Custos Mensais</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Aluguel:</span>
          <span className="font-medium">{formatCurrency(property.rent)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Condomínio:</span>
          <span className="font-medium">{formatCurrency(property.condo)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">IPTU:</span>
          <span className="font-medium">{formatCurrency(property.iptu)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Seguro:</span>
          <span className="font-medium">{formatCurrency(property.fireInsurance)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Outras:</span>
          <span className="font-medium">{formatCurrency(property.otherFees)}</span>
        </div>
        <div className="flex justify-between col-span-1 sm:col-span-2 lg:col-span-1 border-t pt-2">
          <span className="text-gray-900 font-semibold">Total:</span>
          <span className="font-bold text-blue-600">
            {formatCurrency(property.totalMonthlyCost)}
          </span>
        </div>
      </div>
    </div>
  );
};
