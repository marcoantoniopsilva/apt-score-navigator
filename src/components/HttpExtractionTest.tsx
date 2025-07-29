import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHttpDirectExtraction } from '@/hooks/useHttpDirectExtraction';

/**
 * Test component for the direct HTTP extraction hook
 * This is for testing purposes only and can be removed later
 */
export const HttpExtractionTest: React.FC = () => {
  const [testUrl, setTestUrl] = useState('');
  const [lastResult, setLastResult] = useState<any>(null);
  const { extractPropertyData, isExtracting } = useHttpDirectExtraction();

  const handleTest = async () => {
    if (!testUrl.trim()) return;
    
    console.log('🧪 Testando extração HTTP direta...');
    const result = await extractPropertyData(testUrl);
    setLastResult(result);
    console.log('🧪 Resultado do teste:', result);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>🧪 Teste de Extração HTTP Direta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            type="url"
            placeholder="Cole a URL do anúncio para teste..."
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="flex-1"
          />
          <Button 
            onClick={handleTest}
            disabled={isExtracting || !testUrl.trim()}
          >
            {isExtracting ? 'Testando...' : 'Testar'}
          </Button>
        </div>
        
        {lastResult && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Último Resultado:</h4>
            <pre className="text-sm overflow-auto max-h-64">
              {JSON.stringify(lastResult, null, 2)}
            </pre>
          </div>
        )}
        
        {isExtracting && (
          <div className="text-center text-muted-foreground">
            ⏳ Extraindo dados...
          </div>
        )}
      </CardContent>
    </Card>
  );
};