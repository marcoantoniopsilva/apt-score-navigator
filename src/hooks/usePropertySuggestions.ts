import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { extractPropertyFromUrl } from '@/services/propertyExtractionService';
import { ExtractedPropertyData } from '@/types/extractedProperty';

interface PropertySuggestion extends ExtractedPropertyData {
  sourceUrl: string;
  suggestedScore?: number;
}

interface SearchResult {
  urls: string[];
  searchQuery: string;
  userPreferences: any;
}

export const usePropertySuggestions = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<PropertySuggestion[]>([]);
  const { toast } = useToast();

  const searchProperties = async (customQuery?: string) => {
    setIsSearching(true);
    setSuggestions([]);

    try {
      console.log('Iniciando busca de sugestões...');
      
      // Chamar edge function para buscar URLs
      const { data: searchData, error: searchError } = await supabase.functions.invoke('search-properties', {
        body: { searchQuery: customQuery }
      });

      if (searchError) {
        throw new Error(`Erro na busca: ${searchError.message}`);
      }

      if (!searchData?.success) {
        throw new Error(searchData?.error || 'Falha na busca de imóveis');
      }

      const searchResult: SearchResult = searchData;
      console.log('URLs encontradas:', searchResult.urls.length);

      if (searchResult.urls.length === 0) {
        toast({
          title: "Nenhum imóvel encontrado",
          description: "Tente ajustar seus critérios de busca.",
          variant: "default"
        });
        return;
      }

      // Extrair dados de cada URL encontrada com validação automática
      const extractedProperties: PropertySuggestion[] = [];
      const rejectedProperties: Array<{ url: string; reason: string; violations?: string[] }> = [];
      
      for (const url of searchResult.urls) {
        try {
          console.log('Extraindo dados de:', url);
          const propertyData = await extractPropertyFromUrl(url);
          
          extractedProperties.push({
            ...propertyData,
            sourceUrl: url
          });
          
          // Atualizar estado progressivamente
          setSuggestions([...extractedProperties]);
          
        } catch (error: any) {
          console.warn('Falha ao extrair dados de:', url);
          
          // Verificar se é erro de validação (422)
          if (error?.message?.includes('não atende aos critérios') || 
              (error?.details && error?.details?.violations)) {
            rejectedProperties.push({
              url,
              reason: 'Não atende aos critérios de busca',
              violations: error?.details?.violations || ['Dados incompatíveis com suas preferências']
            });
            console.log(`❌ Imóvel rejeitado: ${url}`, error?.details?.violations);
          } else {
            rejectedProperties.push({
              url,
              reason: 'Erro na extração de dados'
            });
            console.warn('Erro na extração:', error);
          }
        }
      }

      // Log de resultados detalhado
      console.log(`✅ Propriedades aceitas: ${extractedProperties.length}`);
      console.log(`❌ Propriedades rejeitadas: ${rejectedProperties.length}`);
      
      if (rejectedProperties.length > 0) {
        console.log('Detalhes das rejeições:');
        rejectedProperties.forEach(({ url, reason, violations }) => {
          console.log(`  - ${url}: ${reason}`);
          if (violations) {
            violations.forEach(v => console.log(`    * ${v}`));
          }
        });
      }

      if (extractedProperties.length === 0) {
        // Se nenhuma propriedade foi aceita, mostrar detalhes dos problemas
        const violationSummary = rejectedProperties
          .filter(r => r.violations)
          .flatMap(r => r.violations!)
          .slice(0, 3) // Apenas as 3 principais violações
          .join('; ');
        
        toast({
          title: "Nenhum imóvel compatível encontrado",
          description: rejectedProperties.length > 0 
            ? `Problemas: ${violationSummary || 'Imóveis não atendem aos critérios especificados'}`
            : "Não foi possível extrair dados dos imóveis encontrados.",
          variant: "destructive",
          duration: 8000
        });
      } else {
        const message = rejectedProperties.length > 0 
          ? `${extractedProperties.length} imóveis compatíveis encontrados (${rejectedProperties.length} rejeitados por não atenderem aos critérios)`
          : `${extractedProperties.length} imóveis sugeridos com base no seu perfil`;
          
        toast({
          title: "Sugestões encontradas",
          description: message,
          duration: 5000
        });
      }

    } catch (error) {
      console.error('Erro na busca de sugestões:', error);
      toast({
        title: "Erro na busca",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const clearSuggestions = () => {
    setSuggestions([]);
  };

  return {
    isSearching,
    suggestions,
    searchProperties,
    clearSuggestions
  };
};