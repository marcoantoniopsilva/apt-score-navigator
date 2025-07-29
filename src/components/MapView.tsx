import React, { useState } from 'react';
import { Property } from '@/types/property';
import PropertyMap from './PropertyMap';
import MapFilters from './MapFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Map, List, Eye } from 'lucide-react';

interface MapViewProps {
  properties: Property[];
  onPropertySelect?: (property: Property) => void;
}

const MapView: React.FC<MapViewProps> = ({ properties, onPropertySelect }) => {
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(properties);
  const [showLegend, setShowLegend] = useState(true);

  React.useEffect(() => {
    setFilteredProperties(properties);
  }, [properties]);

  const handleFilterChange = (filtered: Property[]) => {
    setFilteredProperties(filtered);
  };

  const handlePropertySelect = (property: Property) => {
    if (onPropertySelect) {
      onPropertySelect(property);
    }
  };

  if (properties.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Map className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma propriedade para exibir</h3>
          <p className="text-muted-foreground text-center">
            Adicione algumas propriedades para visualizá-las no mapa interativo.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Map className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold">Mapa Interativo</h2>
          <Badge variant="secondary" className="text-sm">
            {filteredProperties.length} propriedades no mapa
          </Badge>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowLegend(!showLegend)}
          className="flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          {showLegend ? 'Ocultar' : 'Mostrar'} Legenda
        </Button>
      </div>

      {/* Legenda */}
      {showLegend && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Legenda do Mapa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Pontuação por Cor:</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span>0.0 - 3.9 (Baixa)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                    <span>4.0 - 6.9 (Média)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span>7.0 - 10.0 (Alta)</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Tamanho do Ícone:</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span>Pontuação menor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gray-400"></div>
                    <span>Pontuação maior</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Interações:</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span>🖱️ Clique: Ver detalhes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>🎯 Hover: Informações rápidas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📍 Popup: Dados completos</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapa com Filtros */}
      <div className="relative">
        <PropertyMap 
          properties={filteredProperties} 
          onPropertySelect={handlePropertySelect}
        />
        <MapFilters 
          properties={properties}
          onFilterChange={handleFilterChange}
        />
        
        {/* Contador de propriedades filtradas */}
        {filteredProperties.length !== properties.length && (
          <div className="absolute bottom-4 right-4 z-10">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm shadow-lg">
              <List className="w-3 h-3 mr-1" />
              {filteredProperties.length} propriedades visíveis
            </Badge>
          </div>
        )}
      </div>

      {/* Informações adicionais */}
      <div className="text-xs text-muted-foreground">
        <p>
          💡 <strong>Dica:</strong> Use os filtros no canto superior esquerdo para refinar sua busca. 
          Clique nos marcadores para ver detalhes completos das propriedades.
        </p>
      </div>
    </div>
  );
};

export default MapView;