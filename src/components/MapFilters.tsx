import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Filter, MapPin, DollarSign, Star } from 'lucide-react';
import { Property } from '@/types/property';

interface MapFiltersProps {
  properties: Property[];
  onFilterChange: (filteredProperties: Property[]) => void;
}

export interface FilterCriteria {
  scoreRange: [number, number];
  priceRange: [number, number];
  location: string;
  bedrooms: string;
  parkingSpaces: string;
}

const MapFilters: React.FC<MapFiltersProps> = ({ properties, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({
    scoreRange: [0, 10],
    priceRange: [0, 10000],
    location: '',
    bedrooms: '',
    parkingSpaces: ''
  });

  // Calcula valores mínimos e máximos dos dados
  const minPrice = Math.min(...properties.map(p => p.rent));
  const maxPrice = Math.max(...properties.map(p => p.rent));
  const minScore = Math.min(...properties.map(p => p.finalScore));
  const maxScore = Math.max(...properties.map(p => p.finalScore));

  // Extrai localizações únicas
  const uniqueLocations = Array.from(new Set(
    properties.map(p => {
      // Extrai cidade/bairro do endereço
      const parts = p.address.split(',');
      return parts[parts.length - 2]?.trim() || parts[0];
    })
  )).filter(Boolean);

  // Aplica filtros
  const applyFilters = () => {
    const filtered = properties.filter(property => {
      // Filtro de pontuação
      if (property.finalScore < filters.scoreRange[0] || property.finalScore > filters.scoreRange[1]) {
        return false;
      }

      // Filtro de preço
      if (property.rent < filters.priceRange[0] || property.rent > filters.priceRange[1]) {
        return false;
      }

      // Filtro de localização
      if (filters.location && !property.address.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }

      // Filtro de quartos
      if (filters.bedrooms && property.bedrooms.toString() !== filters.bedrooms) {
        return false;
      }

      // Filtro de vagas
      if (filters.parkingSpaces && property.parkingSpaces.toString() !== filters.parkingSpaces) {
        return false;
      }

      return true;
    });

    onFilterChange(filtered);
  };

  // Remove filtros
  const clearFilters = () => {
    setFilters({
      scoreRange: [minScore, maxScore],
      priceRange: [minPrice, maxPrice],
      location: '',
      bedrooms: '',
      parkingSpaces: ''
    });
    onFilterChange(properties);
  };

  // Conta filtros ativos
  const activeFiltersCount = [
    filters.scoreRange[0] !== minScore || filters.scoreRange[1] !== maxScore,
    filters.priceRange[0] !== minPrice || filters.priceRange[1] !== maxPrice,
    filters.location !== '',
    filters.bedrooms !== '',
    filters.parkingSpaces !== ''
  ].filter(Boolean).length;

  React.useEffect(() => {
    // Inicializa filtros com valores reais dos dados
    setFilters(prev => ({
      ...prev,
      scoreRange: [minScore, maxScore],
      priceRange: [minPrice, maxPrice]
    }));
  }, [properties, minScore, maxScore, minPrice, maxPrice]);

  React.useEffect(() => {
    applyFilters();
  }, [filters]);

  if (!isOpen) {
    return (
      <div className="absolute top-4 left-4 z-10">
        <Button
          onClick={() => setIsOpen(true)}
          variant="secondary"
          size="sm"
          className="shadow-lg bg-white/90 backdrop-blur-sm"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-4 z-10 w-80">
      <Card className="shadow-lg bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filtros do Mapa
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filtro de Pontuação */}
          <div className="space-y-2">
            <Label className="flex items-center text-sm font-medium">
              <Star className="w-4 h-4 mr-1" />
              Pontuação: {filters.scoreRange[0].toFixed(1)} - {filters.scoreRange[1].toFixed(1)}
            </Label>
            <Slider
              value={filters.scoreRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, scoreRange: value as [number, number] }))}
              min={minScore}
              max={maxScore}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Filtro de Preço */}
          <div className="space-y-2">
            <Label className="flex items-center text-sm font-medium">
              <DollarSign className="w-4 h-4 mr-1" />
              Aluguel: R$ {filters.priceRange[0].toLocaleString()} - R$ {filters.priceRange[1].toLocaleString()}
            </Label>
            <Slider
              value={filters.priceRange}
              onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
              min={minPrice}
              max={maxPrice}
              step={100}
              className="w-full"
            />
          </div>

          {/* Filtro de Localização */}
          <div className="space-y-2">
            <Label className="flex items-center text-sm font-medium">
              <MapPin className="w-4 h-4 mr-1" />
              Localização
            </Label>
            <Select value={filters.location} onValueChange={(value) => setFilters(prev => ({ ...prev, location: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as localizações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as localizações</SelectItem>
                {uniqueLocations.map(location => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Quartos */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quartos</Label>
            <Select value={filters.bedrooms} onValueChange={(value) => setFilters(prev => ({ ...prev, bedrooms: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Qualquer quantidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Qualquer quantidade</SelectItem>
                {[1, 2, 3, 4, 5].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'quarto' : 'quartos'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Vagas */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Vagas de Garagem</Label>
            <Select value={filters.parkingSpaces} onValueChange={(value) => setFilters(prev => ({ ...prev, parkingSpaces: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Qualquer quantidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Qualquer quantidade</SelectItem>
                {[0, 1, 2, 3, 4].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'vaga' : 'vagas'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2 pt-2">
            <Button onClick={clearFilters} variant="outline" size="sm" className="flex-1">
              Limpar
            </Button>
            <Button onClick={applyFilters} size="sm" className="flex-1">
              Aplicar
            </Button>
          </div>

          {/* Contador de Resultados */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Mostrando propriedades filtradas no mapa
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MapFilters;