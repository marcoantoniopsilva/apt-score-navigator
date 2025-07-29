import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePropertyExtraction } from '@/hooks/usePropertyExtraction';

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
  const { extractPropertyData, isExtracting } = usePropertyExtraction();

  const handleExtractFromUrl = async () => {
    const result = await extractPropertyData(url);
    
    if (result) {
      onDataExtracted(result);
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
    </div>
  );
};