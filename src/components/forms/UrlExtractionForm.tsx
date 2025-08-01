
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractPropertyFromUrl } from '@/utils/propertyExtractor';
import { useToast } from '@/hooks/use-toast';

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
    console.log('UrlExtractionForm: Iniciando extração apenas para preenchimento do formulário');
    console.log('UrlExtractionForm: URL:', url);
    
    setIsExtracting(true);
    try {
      console.log('UrlExtractionForm: Chamando extractPropertyFromUrl para extração apenas...');
      const data = await extractPropertyFromUrl(url);
      
      if (data) {
        console.log('UrlExtractionForm: Dados extraídos para preenchimento:', data);
        setExtractedData(data);
        onDataExtracted(data);
        toast({
          title: "Dados extraídos",
          description: "Os dados do anúncio foram extraídos e preenchidos no formulário. Clique em 'Adicionar Propriedade' para salvar.",
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
          ✅ Dados extraídos e preenchidos no formulário! Revise os dados e clique em "Adicionar Propriedade" para salvar.
        </p>
      )}
    </div>
  );
};
