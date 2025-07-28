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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface AddPropertyFormProps {
  onSubmit: (property: Property) => void;
  onCancel: () => void;
  extractedData?: any;
}

export const AddPropertyForm: React.FC<AddPropertyFormProps> = ({ onSubmit, onCancel, extractedData }) => {
  const [url, setUrl] = useState('');
  const [urlExtractedData, setUrlExtractedData] = useState<any>(null);
  const { activeCriteria, getCriteriaLabel } = useCriteria();
  const [suggestedScores, setSuggestedScores] = useState<Record<string, number>>({});
  const { toast } = useToast();
  
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

  // Inicializar scores baseado nos critérios dinâmicos
  const [scores, setScores] = useState<Record<string, number>>({});

  // Atualizar scores quando os critérios mudarem
  useEffect(() => {
    if (activeCriteria.length > 0) {
      const initialScores: Record<string, number> = {};
      activeCriteria.forEach(criterio => {
        initialScores[criterio.key] = 5; // Score padrão
      });
      setScores(initialScores);
      
      // Se temos dados extraídos pendentes, aplicar os scores agora
      if (urlExtractedData && urlExtractedData.scores) {
        console.log('AddPropertyForm: Aplicando scores dos dados extraídos após critérios carregarem');
        const newScores: Record<string, number> = {};
        activeCriteria.forEach(criterio => {
          const scoreValue = urlExtractedData.scores[criterio.key];
          console.log(`AddPropertyForm: Mapeando ${criterio.key} -> ${scoreValue}`);
          // Usar a sugestão da IA se disponível, senão usar 5 como padrão
          newScores[criterio.key] = typeof scoreValue === 'number' ? scoreValue : 5;
        });
        console.log('AddPropertyForm: Aplicando scores finais:', newScores);
        setScores(newScores);
        setSuggestedScores(urlExtractedData.scores);
      }
    }
  }, [activeCriteria, urlExtractedData]);

  // Preencher formulário com dados extraídos se fornecidos
  useEffect(() => {
    if (extractedData) {
      console.log('AddPropertyForm: Preenchendo formulário com dados extraídos:', extractedData);
      handleDataExtracted(extractedData);
    }
  }, [extractedData]);

  const handleDataExtracted = (data: any) => {
    console.log('AddPropertyForm: Dados extraídos recebidos para preenchimento:', data);
    console.log('AddPropertyForm: Scores recebidos:', data.scores);
    console.log('AddPropertyForm: Critérios ativos:', activeCriteria.map(c => c.key));
    setUrlExtractedData(data);
    
    // Preencher APENAS os campos do formulário, SEM SALVAR no banco
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
      fireInsurance: data.fireInsurance || 50,
      otherFees: data.otherFees || 0
    });
    
    // Atualizar scores baseado nos dados extraídos
    if (data.scores && typeof data.scores === 'object') {
      console.log('AddPropertyForm: Processando scores recebidos:', data.scores);
      setSuggestedScores(data.scores); // Guardar as sugestões sempre
      
      // Se os critérios já estão carregados, aplicar imediatamente
      if (activeCriteria.length > 0) {
        const newScores: Record<string, number> = {};
        activeCriteria.forEach(criterio => {
          const scoreValue = data.scores[criterio.key];
          console.log(`AddPropertyForm: Mapeando ${criterio.key} -> ${scoreValue}`);
          // Usar a sugestão da IA se disponível, senão usar 5 como padrão
          newScores[criterio.key] = typeof scoreValue === 'number' ? scoreValue : 5;
        });
        console.log('AddPropertyForm: Aplicando scores finais imediatamente:', newScores);
        setScores(newScores);
      } else {
        console.log('AddPropertyForm: Critérios ainda não carregados, aguardando...');
      }
    } else {
      console.log('AddPropertyForm: Não há scores nos dados extraídos');
    }
    
    console.log('AddPropertyForm: Formulário preenchido, aguardando submissão do usuário');
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
    
    console.log('AddPropertyForm: SUBMISSÃO DO FORMULÁRIO - Salvando no banco apenas agora');
    console.log('AddPropertyForm: Dados do formulário:', formData);
    console.log('AddPropertyForm: Scores:', scores);
    
    // Garantir que todos os scores sejam números válidos
    const validatedScores = Object.entries(scores).reduce((acc, [key, value]) => {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      acc[key] = isNaN(numValue) ? 5 : Math.max(0, Math.min(10, numValue));
      return acc;
    }, {} as any);
    
    // Criar a propriedade que será salva APENAS quando o usuário clicar em "Adicionar"
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
      images: (extractedData || urlExtractedData)?.images || [],
      sourceUrl: (extractedData || urlExtractedData)?.sourceUrl || url || undefined,
      scores: validatedScores,
      finalScore: 0
    };

    console.log('AddPropertyForm: Propriedade criada, enviando para salvamento:', newProperty);
    onSubmit(newProperty);
  };

  const testUserPreferences = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.access_token) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        return;
      }

      const response = await supabase.functions.invoke('test-user-preferences', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        }
      });

      console.log('Teste de preferências:', response);
      
      toast({
        title: "Resultado do teste",
        description: `Critérios encontrados: ${response.data?.criteriaCount || 0}`,
      });
      
    } catch (error) {
      console.error('Erro no teste:', error);
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive"
      });
    }
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
              <Button 
                type="button" 
                variant="secondary" 
                onClick={testUserPreferences}
              >
                🔍 Testar Critérios
              </Button>
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
