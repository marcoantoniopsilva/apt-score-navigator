
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

interface FormData {
  title: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  area: number;
  floor: string;
  rent: number;
  condo: number;
  iptu: number;
  fireInsurance: number;
  otherFees: number;
}

export const AddPropertyForm: React.FC<AddPropertyFormProps> = ({ onSubmit, onCancel }) => {
  const { activeCriteria, getCriteriaLabel } = useCriteria();
  
  // Estado para URL
  const [url, setUrl] = useState('');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [suggestedScores, setSuggestedScores] = useState<Record<string, number>>({});
  
  // Estados do formulário inicializados vazios
  const [formData, setFormData] = useState<FormData>({
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
    console.log('=== INÍCIO HANDLE DATA EXTRACTED ===');
    console.log('AddPropertyForm: Dados recebidos em handleDataExtracted:', data);
    
    if (!data || typeof data !== 'object') {
      console.error('AddPropertyForm: Dados inválidos recebidos:', data);
      return;
    }
    
    setExtractedData(data);
    
    // Criar novo objeto com valores válidos
    const newFormData: FormData = {
      title: String(data.title || ''),
      address: String(data.address || ''),
      bedrooms: Number(data.bedrooms) || 0,
      bathrooms: Number(data.bathrooms) || 0,
      parkingSpaces: Number(data.parkingSpaces) || 0,
      area: Number(data.area) || 0,
      floor: String(data.floor || ''),
      rent: Number(data.rent) || 0,
      condo: Number(data.condo) || 0,
      iptu: Number(data.iptu) || 0,
      fireInsurance: Number(data.fireInsurance) || 50,
      otherFees: Number(data.otherFees) || 0
    };
    
    console.log('AddPropertyForm: Novo FormData criado:', newFormData);
    console.log('AddPropertyForm: FormData ANTES da atualização:', formData);
    
    // Atualizar o estado usando callback funcional para garantir a atualização
    setFormData(newFormData);
    
    // Log adicional após definir o estado (será executado no próximo render)
    console.log('AddPropertyForm: setFormData chamado com:', newFormData);
    
    // Atualizar scores baseado nos dados extraídos
    if (data.scores && typeof data.scores === 'object') {
      console.log('AddPropertyForm: Scores recebidos:', data.scores);
      
      const newScores: Record<string, number> = {};
      
      // Mapear scores extraídos para critérios ativos
      activeCriteria.forEach(criterio => {
        newScores[criterio.key] = data.scores[criterio.key] || 5;
      });
      
      console.log('AddPropertyForm: Scores mapeados:', newScores);
      setScores(newScores);
      setSuggestedScores(data.scores);
    }
    
    console.log('=== FIM HANDLE DATA EXTRACTED ===');
  };

  const updateFormField = (field: keyof FormData, value: string | number) => {
    console.log(`AddPropertyForm: updateFormField chamado - campo: ${field}, valor:`, value, 'tipo:', typeof value);
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      console.log(`AddPropertyForm: FormData atualizado - campo ${field}:`, updated);
      return updated;
    });
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
    
    console.log('AddPropertyForm: Submitting with formData:', formData);
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

    console.log('AddPropertyForm: Created property:', newProperty);
    onSubmit(newProperty);
  };

  // Debug: Log dos valores atuais do formData
  useEffect(() => {
    console.log('AddPropertyForm: FormData mudou:', formData);
    console.log('AddPropertyForm: FormData após mudança - título:', formData.title, 'endereço:', formData.address);
  }, [formData]);

  // Log adicional quando extractedData mudar
  useEffect(() => {
    if (extractedData) {
      console.log('AddPropertyForm: extractedData atualizado:', extractedData);
      console.log('AddPropertyForm: Verificando se formData foi atualizado após extractedData...');
      console.log('AddPropertyForm: FormData atual após extractedData:', formData);
    }
  }, [extractedData]);

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

          {/* Debug: Mostrar formData atual */}
          <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
            <strong>Debug - FormData atual:</strong>
            <pre>{JSON.stringify(formData, null, 2)}</pre>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <PropertyBasicForm
              formData={{
                title: formData.title,
                address: formData.address,
                floor: formData.floor
              }}
              onUpdateField={updateFormField}
            />

            <PropertyDetailsForm
              formData={{
                bedrooms: formData.bedrooms,
                bathrooms: formData.bathrooms,
                parkingSpaces: formData.parkingSpaces,
                area: formData.area
              }}
              onUpdateField={updateFormField}
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
                console.log('AddPropertyForm: PropertyFinancialForm onChange:', e.target.name, e.target.value);
                updateFormField(e.target.name as keyof FormData, Number(e.target.value) || 0);
              }}
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
