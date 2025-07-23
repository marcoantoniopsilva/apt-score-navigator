
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
    console.log('UrlExtractionForm: Botão clicado, iniciando extração');
    console.log('UrlExtractionForm: URL:', url);
    
    setIsExtracting(true);
    setExtractedData(null); // Limpar dados anteriores
    setExtractionStatus('Iniciando extração...');
    
    try {
      setExtractionStatus('Validando URL...');
      console.log('UrlExtractionForm: Chamando extractPropertyFromUrl...');
      
      setExtractionStatus('Extraindo dados do anúncio...');
      const data = await extractPropertyFromUrl(url);
      
      console.log('UrlExtractionForm: Dados recebidos do serviço de extração:', data);
      console.log('UrlExtractionForm: Tipo dos dados recebidos:', typeof data);
      console.log('UrlExtractionForm: Keys dos dados recebidos:', Object.keys(data || {}));
      
      if (data && Object.keys(data).length > 0) {
        setExtractedData(data);
        setExtractionStatus('');
        console.log('UrlExtractionForm: Passando dados para onDataExtracted:', data);
        
        // Garantir que os dados sejam passados no formato correto
        const formattedData = {
          title: data.title || '',
          address: data.address || '',
          bedrooms: Number(data.bedrooms) || 0,
          bathrooms: Number(data.bathrooms) || 0,
          parkingSpaces: Number(data.parkingSpaces) || 0,
          area: Number(data.area) || 0,
          floor: data.floor || '',
          rent: Number(data.rent) || 0,
          condo: Number(data.condo) || 0,
          iptu: Number(data.iptu) || 0,
          fireInsurance: Number(data.fireInsurance) || 50,
          otherFees: Number(data.otherFees) || 0,
          images: data.images || [],
          scores: data.scores || {}
        };
        
        console.log('UrlExtractionForm: Dados formatados para o formulário:', formattedData);
        onDataExtracted(formattedData);
        
        toast({
          title: "Dados extraídos com sucesso!",
          description: `Título: ${formattedData.title || 'N/A'}, Endereço: ${formattedData.address || 'N/A'}, Aluguel: R$ ${formattedData.rent || 0}`,
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
