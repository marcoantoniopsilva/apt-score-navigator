
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
  const [extractionStatus, setExtractionStatus] = useState('');

  const handleExtractFromUrl = async () => {
    console.log('UrlExtractionForm: Iniciando extração para URL:', url);
    
    setIsExtracting(true);
    setExtractedData(null);
    setExtractionStatus('Iniciando extração...');
    
    try {
      setExtractionStatus('Extraindo dados do anúncio...');
      const data = await extractPropertyFromUrl(url);
      
      console.log('UrlExtractionForm: Dados recebidos (já mapeados):', data);
      
      if (data && Object.keys(data).length > 0) {
        setExtractedData(data);
        setExtractionStatus('');
        
        // Passar os dados diretamente (já estão no formato correto)
        console.log('UrlExtractionForm: Passando dados para onDataExtracted:', data);
        onDataExtracted(data);
        
        toast({
          title: "Dados extraídos com sucesso!",
          description: `Título: ${data.title || 'N/A'}, Endereço: ${data.address || 'N/A'}, Aluguel: R$ ${data.rent || 0}`,
        });
      } else {
        setExtractionStatus('');
        console.error('UrlExtractionForm: Dados vazios ou inválidos recebidos:', data);
        toast({
          title: "Erro na extração",
          description: "Não foi possível extrair os dados do anúncio. Verifique se a URL está correta.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setExtractionStatus('');
      console.error("Erro ao extrair dados da URL:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro na extração",
        description: `Erro: ${errorMessage}`,
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
      {extractionStatus && (
        <p className="text-sm text-blue-600 mt-2">
          {extractionStatus}
        </p>
      )}
      {extractedData && (
        <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
          <p className="text-sm text-green-600 font-medium">
            ✅ Dados extraídos com sucesso!
          </p>
          <div className="text-xs text-green-600 mt-1">
            <p>Título: {extractedData.title || 'N/A'}</p>
            <p>Endereço: {extractedData.address || 'N/A'}</p>
            <p>Quartos: {extractedData.bedrooms || 0} | Banheiros: {extractedData.bathrooms || 0}</p>
            <p>Aluguel: R$ {extractedData.rent || 0}</p>
          </div>
          <p className="text-xs text-green-600 mt-1">
            Revise e ajuste os dados conforme necessário.
          </p>
        </div>
      )}
    </div>
  );
};
