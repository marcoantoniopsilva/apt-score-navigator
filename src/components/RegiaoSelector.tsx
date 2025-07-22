import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, X } from 'lucide-react';
import { LocalidadeService } from '@/services/localidadeService';
import { cn } from '@/lib/utils';

interface LocalidadeSuggestion {
  nome: string;
  tipo: 'estado' | 'municipio' | 'bairro';
  uf?: string;
  cidade?: string;
}

interface RegiaoSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RegiaoSelector: React.FC<RegiaoSelectorProps> = ({
  value,
  onChange,
  placeholder = "Ex: Vila Madalena, São Paulo, Centro..."
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<LocalidadeSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Localidades populares como sugestões iniciais
  const popularLocations = [
    'São Paulo, SP',
    'Rio de Janeiro, RJ',
    'Belo Horizonte, MG',
    'Porto Alegre, RS',
    'Curitiba, PR',
    'Salvador, BA',
    'Brasília, DF',
    'Fortaleza, CE'
  ];

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const buscarSugestoes = async (termo: string) => {
    if (termo.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const resultados = await LocalidadeService.buscarLocalidades(termo);
      setSuggestions(resultados);
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(true);
    
    // Debounce da busca
    setTimeout(() => {
      buscarSugestoes(newValue);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: LocalidadeSuggestion) => {
    let displayValue = suggestion.nome;
    
    // Adicionamos a cidade/UF ao nome do bairro ou município para melhor identificação
    if (suggestion.tipo === 'municipio' && suggestion.uf) {
      displayValue = `${suggestion.nome}, ${suggestion.uf}`;
    } else if (suggestion.tipo === 'bairro' && suggestion.cidade && suggestion.uf) {
      displayValue = `${suggestion.nome}, ${suggestion.cidade}, ${suggestion.uf}`;
    }
    
    setInputValue(displayValue);
    onChange(displayValue);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSelectPopular = (location: string) => {
    setInputValue(location);
    onChange(location);
    setShowSuggestions(false);
  };

  const handleInputBlur = () => {
    // Aguardamos um pouco para que o clique na sugestão seja processado primeiro
    setTimeout(() => {
      if (document.activeElement !== document.getElementById('regiao')) {
        setShowSuggestions(false);
        onChange(inputValue);
      }
    }, 150);
  };

  // Focus handler para mostrar as sugestões
  const handleInputFocus = () => {
    setShowSuggestions(true);
    // Se o input estiver vazio, buscar sugestões iniciais
    if (!inputValue.trim() && !suggestions.length) {
      setTimeout(() => buscarSugestoes('a'), 100);
    }
  };

  const clearInput = () => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
  };

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="regiao">
        <MapPin className="w-4 h-4 inline mr-1" />
        Bairro, cidade ou região de referência
      </Label>
      
      <div className="relative">
        <div className="flex">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              id="regiao"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder={placeholder}
              className="pl-10 pr-10"
            />
            {inputValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearInput}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Sugestões */}
        {showSuggestions && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {/* Sugestões da API */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <div className="text-xs text-muted-foreground mb-2 px-2">Localidades encontradas</div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onMouseDown={(e) => {
                      // Usar onMouseDown em vez de onClick para garantir que o evento ocorra antes do onBlur
                      e.preventDefault();
                      handleSelectSuggestion(suggestion);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-accent rounded-sm flex items-center gap-2"
                  >
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <div className="flex-1">
                      <span className="block">{suggestion.nome}</span>
                      {suggestion.tipo === 'bairro' && suggestion.cidade && suggestion.uf && (
                        <span className="text-xs text-muted-foreground">
                          {suggestion.cidade}, {suggestion.uf}
                        </span>
                      )}
                      {suggestion.tipo === 'municipio' && suggestion.uf && (
                        <span className="text-xs text-muted-foreground">
                          {suggestion.uf}
                        </span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {suggestion.tipo === 'municipio' ? 'Cidade' : 
                       suggestion.tipo === 'bairro' ? 'Bairro' : 'Estado'}
                    </Badge>
                  </button>
                ))}
              </div>
            )}

            {/* Carregando */}
            {isLoading && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Buscando localidades...
              </div>
            )}

            {/* Sem resultados */}
            {!isLoading && inputValue.length >= 2 && suggestions.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Nenhuma localidade encontrada
              </div>
            )}

            {/* Localidades populares */}
            {(!inputValue || inputValue.length < 2) && (
              <div className="p-2">
                <div className="text-xs text-muted-foreground mb-2 px-2">Localidades populares</div>
                {popularLocations.map((location) => (
                  <button
                    key={location}
                    type="button"
                    onMouseDown={(e) => {
                      // Usar onMouseDown em vez de onClick para garantir que o evento ocorra antes do onBlur
                      e.preventDefault();
                      handleSelectPopular(location);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-accent rounded-sm flex items-center gap-2"
                  >
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span>{location}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};