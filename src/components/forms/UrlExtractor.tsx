
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { extractDataFromUrl, ExtractedData } from '@/services/urlExtractionService';
import { useToast } from '@/hooks/use-toast';

interface UrlExtractorProps {
  onDataExtracted: (data: ExtractedData) => void;
}

export const UrlExtractor: React.FC<UrlExtractorProps> = ({ onDataExtracted }) => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState('');

  const handleExtract = async () => {
    if (!url.trim()) {
      toast({
        title: "URL obrigatória",
        description: "Digite uma URL para extrair os dados.",
        variant: "destructive"
      });
      return;
    }

    console.log('🎯 Iniciando processo de extração...');
    setIsExtracting(true);
    setExtractionStatus('Conectando ao site...');
    
    try {
      setExtractionStatus('Extraindo dados do anúncio...');
      const extractedData = await extractDataFromUrl(url);
      
      setExtractionStatus('');
      console.log('🎉 Extração concluída, passando dados para o formulário...');
      
      onDataExtracted(extractedData);
      
      toast({
        title: "Dados extraídos com sucesso!",
        description: `Propriedade: ${extractedData.title}`,
      });
      
    } catch (error) {
      setExtractionStatus('');
      console.error("❌ Erro na extração:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro na extração",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
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
          disabled={isExtracting}
        />
        <Button 
          onClick={handleExtract}
          disabled={isExtracting || !url.trim()}
        >
          {isExtracting ? 'Extraindo...' : 'Extrair'}
        </Button>
      </div>
      
      {extractionStatus && (
        <div className="mt-2 p-2 bg-blue-100 rounded border border-blue-300">
          <p className="text-sm text-blue-700">
            ⏳ {extractionStatus}
          </p>
        </div>
      )}
    </div>
  );
};
