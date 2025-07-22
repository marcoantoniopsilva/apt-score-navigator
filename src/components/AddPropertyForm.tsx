
import React, { useState, useEffect } from 'react';
import { Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { UrlExtractionForm } from './forms/UrlExtractionForm';
import { PropertyBasicForm } from './forms/PropertyBasicForm';
import { PropertyDetailsForm } from './forms/PropertyDetailsForm';
import { PropertyFinancialForm } from './forms/PropertyFinancialForm';
import { PropertyScoresForm } from './forms/PropertyScoresForm';
import { useCriteria } from '@/hooks/useCriteria';

interface AddPropertyFormProps {
  onSubmit: (property: Property) => void;
  onCancel: () => void;
}

export const AddPropertyForm: React.FC<AddPropertyFormProps> = ({ onSubmit, onCancel }) => {
  const { activeCriteria, getCriteriaLabel } = useCriteria();
  
  // Estados inicializados a cada render para evitar dados antigos
  const [url, setUrl] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [suggestedScores, setSuggestedScores] = useState<Record<string, number>>({});
  
  const [formData, setFormData] = useState(() => ({
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
  }));

  // Inicializar scores baseado nos critérios dinâmicos
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initialScores: Record<string, number> = {};
    activeCriteria.forEach(criterio => {
      initialScores[criterio.key] = 5; // Score padrão
    });
    return initialScores;
  });

  // Atualizar scores quando os critérios mudarem
  useEffect(() => {
    if (activeCriteria.length > 0) {
      const initialScores: Record<string, number> = {};
      activeCriteria.forEach(criterio => {
        initialScores[criterio.key] = 5; // Score padrão
      });
      setScores(initialScores);
    }
  }, [activeCriteria]);

  const handleDataExtracted = (data: any) => {
    console.log('AddPropertyForm: Dados recebidos em handleDataExtracted:', data);
    setExtractedData(data);
    const newFormData = {
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
      fireInsurance: data.fireInsurance || 50,
      otherFees: data.otherFees || 0
    };
    console.log('AddPropertyForm: Atualizando formData para:', newFormData);
    setFormData(newFormData);
    
    // Atualizar scores baseado nos dados extraídos ou usar scores sugeridos
    if (data.scores && typeof data.scores === 'object') {
      const newScores: Record<string, number> = {};
      activeCriteria.forEach(criterio => {
        newScores[criterio.key] = data.scores[criterio.key] || 5;
      });
      setScores(newScores);
      setSuggestedScores(data.scores); // Guardar as sugestões
    }
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
    
    // Permitir valores vazios durante a digitação, mas manter como 0
    if (value === '') {
      setScores(prev => ({
        ...prev,
        [name]: 0
      }));
      return;
    }
    
    const numericValue = parseFloat(value);
    console.log(`AddPropertyForm: Parsed value: ${numericValue}`);
    
    // Verificar se é um número válido
    if (!isNaN(numericValue)) {
      // Aplicar limites apenas se necessário, mas não forçar para 10
      const finalValue = Math.max(0, Math.min(10, numericValue));
      console.log(`AddPropertyForm: Setting score ${name} to ${finalValue}`);
      setScores(prev => ({
        ...prev,
        [name]: finalValue
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('AddPropertyForm: Submitting with scores:', scores);
    
    // Garantir que todos os scores sejam números válidos
    const validatedScores = Object.entries(scores).reduce((acc, [key, value]) => {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      acc[key] = isNaN(numValue) ? 5 : Math.max(0, Math.min(10, numValue));
      return acc;
    }, {} as any);
    
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
      scores: validatedScores,
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
              activeCriteria={activeCriteria}
              suggestedScores={suggestedScores}
              getCriteriaLabel={getCriteriaLabel}
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
