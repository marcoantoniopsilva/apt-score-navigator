import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MapPin, Bed, Bath, Square, DollarSign } from 'lucide-react';
import { usePropertySuggestions } from '@/hooks/usePropertySuggestions';
import LoadingState from '@/components/LoadingState';

interface PropertySuggestionsProps {
  onAddProperty?: (propertyData: any) => void;
}

export const PropertySuggestions = ({ onAddProperty }: PropertySuggestionsProps) => {
  const { isSearching, suggestions, searchProperties, clearSuggestions } = usePropertySuggestions();

  const handleAddToComparison = (suggestion: any) => {
    console.log('PropertySuggestions: Adicionando sugestão:', suggestion);
    
    if (onAddProperty) {
      const propertyData = {
        id: `suggestion-${Date.now()}`,
        title: suggestion.title || 'Imóvel Sugerido',
        address: suggestion.address || 'Endereço não informado',
        bedrooms: suggestion.bedrooms || 1,
        bathrooms: suggestion.bathrooms || 1,
        parkingSpaces: suggestion.parkingSpaces || 0,
        area: suggestion.area || 50,
        floor: suggestion.floor || '',
        rent: suggestion.rent || 0,
        condo: suggestion.condo || 0,
        iptu: suggestion.iptu || 0,
        fireInsurance: 50,
        otherFees: 0,
        totalMonthlyCost: (suggestion.rent || 0) + (suggestion.condo || 0) + (suggestion.iptu || 0) + 50,
        images: suggestion.images || [],
        sourceUrl: suggestion.sourceUrl || undefined,
        scores: {},
        finalScore: 0
      };
      
      console.log('PropertySuggestions: Dados formatados:', propertyData);
      onAddProperty(propertyData);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalCost = (suggestion: any) => {
    return (suggestion.rent || 0) + (suggestion.condo || 0) + (suggestion.iptu || 0);
  };

  if (isSearching) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Buscando sugestões...</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearSuggestions}
          >
            Cancelar
          </Button>
        </div>
        <LoadingState />
        
        {suggestions.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-4">
              {suggestions.length} sugestões encontradas até agora...
            </p>
            <div className="grid gap-4">
              {suggestions.map((suggestion, index) => (
                <SuggestionCard 
                  key={index} 
                  suggestion={suggestion} 
                  onAdd={() => handleAddToComparison(suggestion)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold mb-2">Sugestões Personalizadas</h3>
        <p className="text-muted-foreground mb-4">
          Encontre imóveis que combinam com seu perfil e preferências
        </p>
        <Button onClick={() => searchProperties()}>
          Buscar Sugestões
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Sugestões para você</h3>
          <p className="text-sm text-muted-foreground">
            {suggestions.length} imóveis encontrados baseados no seu perfil
          </p>
        </div>
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => searchProperties()}
          >
            Nova busca
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearSuggestions}
          >
            Limpar
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {suggestions.map((suggestion, index) => (
          <SuggestionCard 
            key={index} 
            suggestion={suggestion} 
            onAdd={() => handleAddToComparison(suggestion)}
          />
        ))}
      </div>
    </div>
  );
};

const SuggestionCard = ({ suggestion, onAdd }: { suggestion: any; onAdd: () => void }) => {
  const totalCost = (suggestion.rent || 0) + (suggestion.condo || 0) + (suggestion.iptu || 0);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base line-clamp-2 flex-1 mr-4">
            {suggestion.title}
          </CardTitle>
          <Badge variant="secondary">Sugestão</Badge>
        </div>
        {suggestion.address && (
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            {suggestion.address}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center">
            <Bed className="h-4 w-4 mr-1 text-muted-foreground" />
            {suggestion.bedrooms} quartos
          </div>
          <div className="flex items-center">
            <Bath className="h-4 w-4 mr-1 text-muted-foreground" />
            {suggestion.bathrooms} banheiros
          </div>
          <div className="flex items-center">
            <Square className="h-4 w-4 mr-1 text-muted-foreground" />
            {suggestion.area}m²
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total mensal:</span>
            <span className="font-semibold text-lg">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(totalCost)}
            </span>
          </div>
          
          {suggestion.rent > 0 && (
            <div className="flex justify-between text-sm">
              <span>Aluguel:</span>
              <span>{new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(suggestion.rent)}</span>
            </div>
          )}
          
          {suggestion.condo > 0 && (
            <div className="flex justify-between text-sm">
              <span>Condomínio:</span>
              <span>{new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(suggestion.condo)}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={onAdd}
          >
            Adicionar à Comparação
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.open(suggestion.sourceUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};