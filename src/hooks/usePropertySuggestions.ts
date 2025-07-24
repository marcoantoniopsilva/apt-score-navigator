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

      // Extrair dados de cada URL encontrada
      const extractedProperties: PropertySuggestion[] = [];
      
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
          
        } catch (error) {
          console.warn('Falha ao extrair dados de:', url, error);
          // Continuar com as outras URLs mesmo se uma falhar
        }
      }

      if (extractedProperties.length === 0) {
        toast({
          title: "Nenhum dado extraído",
          description: "Não foi possível extrair dados dos imóveis encontrados.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sugestões encontradas",
          description: `${extractedProperties.length} imóveis sugeridos com base no seu perfil.`,
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