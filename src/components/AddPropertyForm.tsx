
import React, { useState } from 'react';
import { Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { UrlExtractionForm } from './forms/UrlExtractionForm';
import { PropertyBasicForm } from './forms/PropertyBasicForm';
import { PropertyDetailsForm } from './forms/PropertyDetailsForm';
import { PropertyFinancialForm } from './forms/PropertyFinancialForm';
import { PropertyScoresForm } from './forms/PropertyScoresForm';

interface AddPropertyFormProps {
  onSubmit: (property: Property) => void;
  onCancel: () => void;
}

export const AddPropertyForm: React.FC<AddPropertyFormProps> = ({ onSubmit, onCancel }) => {
  const [url, setUrl] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    bedrooms: 0,
    bathrooms: 0,
    parkingSpaces: 0,
    area: 0,
    floor: '',
    rent: 0,
    condo: 0,
    iptu: 0,
    fireInsurance: 0,
    otherFees: 0
  });

  const [scores, setScores] = useState({
    location: 5,
    internalSpace: 5,
    furniture: 5,
    accessibility: 5,
    finishing: 5,
    price: 5,
    condo: 5,
  });

  const handleDataExtracted = (data: any) => {
    setExtractedData(data);
    setFormData({
      title: data.title || '',
      address: data.address || '',
      bedrooms: data.bedrooms || 0,
      bathrooms: data.bathrooms || 0,
      parkingSpaces: data.parkingSpaces || 0,
      area: data.area || 0,
      floor: data.floor || '',
      rent: data.rent || 0,
      condo: data.condo || 0,
      iptu: data.iptu || 0,
      fireInsurance: data.fireInsurance || 0,
      otherFees: data.otherFees || 0
    });
    setScores({
      location: data.scores?.location || 5,
      internalSpace: data.scores?.internalSpace || 5,
      furniture: data.scores?.furniture || 5,
      accessibility: data.scores?.accessibility || 5,
      finishing: data.scores?.finishing || 5,
      price: data.scores?.price || 5,
      condo: data.scores?.condo || 5,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`AddPropertyForm: Score change - ${name}: "${value}"`);
    
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      const clampedValue = Math.max(0, Math.min(10, numericValue));
      console.log(`AddPropertyForm: Setting score ${name} to ${clampedValue}`);
      setScores(prev => ({
        ...prev,
        [name]: clampedValue
      }));
    } else if (value === '') {
      // Permitir campo vazio temporariamente
      setScores(prev => ({
        ...prev,
        [name]: 0
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('AddPropertyForm: Submitting with scores:', scores);
    
    const newProperty: Property = {
      id: crypto.randomUUID(),
      title: formData.title,
      address: formData.address,
      bedrooms: Number(formData.bedrooms),
      bathrooms: Number(formData.bathrooms),
      parkingSpaces: Number(formData.parkingSpaces),
      area: Number(formData.area),
      floor: formData.floor,
      rent: Number(formData.rent),
      condo: Number(formData.condo),
      iptu: Number(formData.iptu),
      fireInsurance: Number(formData.fireInsurance),
      otherFees: Number(formData.otherFees),
      totalMonthlyCost: Number(formData.rent) + Number(formData.condo) + Number(formData.iptu) + Number(formData.fireInsurance) + Number(formData.otherFees),
      images: extractedData?.images || [],
      sourceUrl: url || undefined,
      scores: scores,
      finalScore: 0
    };

    console.log('AddPropertyForm: Created property with scores:', newProperty.scores);
    onSubmit(newProperty);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Adicionar Nova Propriedade</h2>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <UrlExtractionForm
            url={url}
            setUrl={setUrl}
            onDataExtracted={handleDataExtracted}
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            <PropertyBasicForm
              formData={formData}
              onInputChange={handleInputChange}
            />

            <PropertyDetailsForm
              formData={formData}
              onInputChange={handleInputChange}
            />

            <PropertyFinancialForm
              formData={formData}
              onInputChange={handleInputChange}
            />

            <PropertyScoresForm
              scores={scores}
              onScoreChange={handleScoreChange}
            />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit">
                Adicionar Propriedade
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};
