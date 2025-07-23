
import React, { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { UrlExtractor } from './forms/UrlExtractor';
import { PropertyBasicForm } from './forms/PropertyBasicForm';
import { PropertyDetailsForm } from './forms/PropertyDetailsForm';
import { PropertyFinancialForm } from './forms/PropertyFinancialForm';
import { PropertyScoresForm } from './forms/PropertyScoresForm';
import { useCriteria } from '@/hooks/useCriteria';
import { ExtractedData } from '@/services/urlExtractionService';
import { useToast } from '@/hooks/use-toast';

interface AddPropertyFormProps {
  onSubmit: (property: Property) => void;
  onCancel: () => void;
}

export const AddPropertyForm: React.FC<AddPropertyFormProps> = ({ onSubmit, onCancel }) => {
  const { toast } = useToast();
  const { activeCriteria, getCriteriaLabel } = useCriteria();
  
  // Estado centralizado do formulário
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    bedrooms: 1,
    bathrooms: 1,
    parkingSpaces: 0,
    area: 50,
    floor: '',
    rent: 0,
    condo: 0,
    iptu: 0,
    fireInsurance: 50,
    otherFees: 0
  });

  // Estado para imagens e scores
  const [images, setImages] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [sourceUrl, setSourceUrl] = useState('');

  // Inicializar scores baseado nos critérios dinâmicos
  useEffect(() => {
    const initialScores: Record<string, number> = {};
    activeCriteria.forEach(criterio => {
      initialScores[criterio.key] = 5; // Score padrão
    });
    setScores(initialScores);
  }, [activeCriteria]);

  // Função para atualizar campos do formulário
  const updateField = (field: string, value: string | number) => {
    console.log(`📝 Atualizando campo ${field}:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Função chamada quando dados são extraídos da URL
  const handleDataExtracted = (extractedData: ExtractedData) => {
    console.log('🎯 Recebendo dados extraídos:', extractedData);
    
    // Atualizar formData com os dados extraídos
    setFormData({
      title: extractedData.title,
      address: extractedData.address,
      bedrooms: extractedData.bedrooms,
      bathrooms: extractedData.bathrooms,
      parkingSpaces: extractedData.parkingSpaces,
      area: extractedData.area,
      floor: extractedData.floor,
      rent: extractedData.rent,
      condo: extractedData.condo,
      iptu: extractedData.iptu,
      fireInsurance: extractedData.fireInsurance,
      otherFees: extractedData.otherFees
    });

    // Atualizar imagens
    setImages(extractedData.images);

    // Atualizar scores se disponíveis
    if (extractedData.scores && Object.keys(extractedData.scores).length > 0) {
      const newScores: Record<string, number> = {};
      activeCriteria.forEach(criterio => {
        newScores[criterio.key] = extractedData.scores[criterio.key] || 5;
      });
      setScores(newScores);
    }

    console.log('✅ Formulário atualizado com dados extraídos');
    
    toast({
      title: "Formulário preenchido!",
      description: "Revise os dados e clique em 'Adicionar' para salvar.",
    });
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value === '' ? 0 : Math.max(0, Math.min(10, parseFloat(value) || 0));
    
    setScores(prev => ({
      ...prev,
      [name]: numericValue
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('💾 Salvando propriedade...');
    console.log('FormData:', formData);
    console.log('Scores:', scores);
    
    const totalMonthlyCost = formData.rent + formData.condo + formData.iptu + formData.fireInsurance + formData.otherFees;
    
    const newProperty: Property = {
      id: crypto.randomUUID(),
      ...formData,
      totalMonthlyCost,
      images,
      sourceUrl: sourceUrl || undefined,
      scores,
      finalScore: 0
    };

    console.log('🎉 Propriedade criada:', newProperty);
    onSubmit(newProperty);
  };

  console.log('🔄 AddPropertyForm renderizando, formData atual:', formData);

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

          <UrlExtractor onDataExtracted={handleDataExtracted} />

          <form onSubmit={handleSubmit} className="space-y-6">
            <PropertyBasicForm
              title={formData.title}
              address={formData.address}
              floor={formData.floor}
              onUpdateField={updateField}
            />

            <PropertyDetailsForm
              bedrooms={formData.bedrooms}
              bathrooms={formData.bathrooms}
              parkingSpaces={formData.parkingSpaces}
              area={formData.area}
              onUpdateField={updateField}
            />

            <PropertyFinancialForm
              formData={{
                rent: formData.rent,
                condo: formData.condo,
                iptu: formData.iptu,
                fireInsurance: formData.fireInsurance,
                otherFees: formData.otherFees
              }}
              onInputChange={(e) => {
                const value = Number(e.target.value) || 0;
                updateField(e.target.name, value);
              }}
            />

            <PropertyScoresForm
              scores={scores}
              onScoreChange={handleScoreChange}
              activeCriteria={activeCriteria}
              suggestedScores={{}}
              getCriteriaLabel={getCriteriaLabel}
            />

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
