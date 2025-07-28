
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractPropertyFromUrl } from '@/utils/propertyExtractor';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UrlExtractionFormProps {
  url: string;
  setUrl: (url: string) => void;
  onDataExtracted: (data: any) => void;
}

export const UrlExtractionForm: React.FC<UrlExtractionFormProps> = ({
  url,
  setUrl,
  onDataExtracted
}) => {
  const { toast } = useToast();
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);

  const handleExtractFromUrl = async () => {
    console.log('UrlExtractionForm: Iniciando extração com avaliação da IA');
    console.log('UrlExtractionForm: URL:', url);
    
    setIsExtracting(true);
    try {
      console.log('UrlExtractionForm: Chamando extractPropertyFromUrl...');
      const data = await extractPropertyFromUrl(url);
      
      if (data) {
        console.log('UrlExtractionForm: Dados extraídos:', data);
        
        // Avaliar o imóvel com IA (mesmo que ManualPropertySearch faz)
        let evaluationData = null;
        try {
          console.log('UrlExtractionForm: Avaliando imóvel com IA...');
          const { data: aiEvaluation, error: evaluationError } = await supabase.functions.invoke('evaluate-property-scores', {
            body: { propertyData: data }
          });

          if (!evaluationError && aiEvaluation) {
            evaluationData = aiEvaluation;
            console.log('UrlExtractionForm: Avaliação da IA recebida:', aiEvaluation);
          } else {
            console.warn('UrlExtractionForm: Erro na avaliação IA:', evaluationError);
          }
        } catch (error) {
          console.warn('UrlExtractionForm: Erro na avaliação IA:', error);
        }

        // Combinar dados extraídos com avaliação da IA
        const enrichedData = {
          ...data,
          scores: evaluationData?.scores || {},
          finalScore: evaluationData?.finalScore || 0
        };

        console.log('UrlExtractionForm: Dados finais com IA:', enrichedData);
        setExtractedData(enrichedData);
        onDataExtracted(enrichedData);
        
        toast({
          title: "Dados extraídos",
          description: "Os dados do anúncio foram extraídos e as sugestões da IA foram aplicadas automaticamente.",
        });
      } else {
        toast({
          title: "Erro na extração",
          description: "Não foi possível extrair os dados do anúncio.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("UrlExtractionForm: Erro ao extrair dados da URL:", error);
      toast({
        title: "Erro na extração",
        description: "Ocorreu um erro ao tentar extrair os dados do anúncio.",
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <Label className="text-sm font-medium mb-2 block">
        Extrair dados de um anúncio (opcional)
      </Label>
      <div className="flex space-x-2">
        <Input
          type="url"
          placeholder="Cole a URL do anúncio aqui..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button 
          onClick={handleExtractFromUrl}
          disabled={isExtracting || !url}
        >
          {isExtracting ? 'Extraindo...' : 'Extrair'}
        </Button>
      </div>
      {extractedData && (
        <p className="text-sm text-green-600 mt-2">
          ✅ Dados extraídos e sugestões da IA aplicadas automaticamente! Revise os dados e clique em "Adicionar Propriedade" para salvar.
        </p>
      )}
    </div>
  );
};
