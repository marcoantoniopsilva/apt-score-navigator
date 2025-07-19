
import React, { useState } from 'react';
import { Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PropertyLocationSummaryProps {
  property: Property;
  onSummaryUpdate: (propertyId: string, summary: string) => void;
}

export const PropertyLocationSummary: React.FC<PropertyLocationSummaryProps> = ({
  property,
  onSummaryUpdate
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState(property.locationSummary || '');
  const { toast } = useToast();

  const generateLocationSummary = async () => {
    if (!property.address) {
      toast({
        title: "Endereço necessário",
        description: "É necessário ter um endereço para gerar o resumo da localização.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      console.log('Gerando resumo da localização para:', property.address);
      
      const { data, error } = await supabase.functions.invoke('generate-location-summary', {
        body: { 
          address: property.address,
          propertyId: property.id
        }
      });

      if (error) {
        console.error('Erro ao gerar resumo:', error);
        throw error;
      }

      if (data.summary) {
        setSummary(data.summary);
        onSummaryUpdate(property.id, data.summary);
        
        toast({
          title: "Resumo gerado",
          description: "Resumo da localização gerado com sucesso!",
        });
      }
    } catch (error) {
      console.error('Erro ao gerar resumo da localização:', error);
      toast({
        title: "Erro ao gerar resumo",
        description: "Não foi possível gerar o resumo da localização. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 flex items-center">
          <MapPin className="h-4 w-4 mr-2" />
          Resumo da Localização
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={generateLocationSummary}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isGenerating ? 'Gerando...' : summary ? 'Atualizar' : 'Gerar Resumo'}
        </Button>
      </div>

      {summary ? (
        <Card className="p-4 bg-gray-50 border-gray-200">
          <div className="text-sm text-gray-700 leading-relaxed">
            <div 
              className="space-y-3"
              dangerouslySetInnerHTML={{
                __html: summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              }}
            />
          </div>
        </Card>
      ) : (
        <Card className="p-4 bg-gray-50 border-gray-200">
          <div className="text-sm text-gray-500 text-center">
            Clique em "Gerar Resumo" para obter informações detalhadas sobre a localização desta propriedade.
          </div>
        </Card>
      )}
    </div>
  );
};
