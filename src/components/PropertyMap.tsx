import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Property } from '@/types/property';
import { getScoreColor } from '@/utils/scoreCalculator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Home, Car, Bath, Bed } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PropertyGeocodingService } from '@/services/propertyGeocoding';

interface PropertyMapProps {
  properties: Property[];
  onPropertySelect?: (property: Property) => void;
}

const PropertyMap: React.FC<PropertyMapProps> = ({ properties, onPropertySelect }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [isLoadingToken, setIsLoadingToken] = useState(true);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Função global para selecionar propriedade do popup
  useEffect(() => {
    (window as any).selectPropertyFromMap = (propertyId: string) => {
      const property = properties.find(p => p.id === propertyId);
      if (property && onPropertySelect) {
        onPropertySelect(property);
      }
    };

    return () => {
      delete (window as any).selectPropertyFromMap;
    };
  }, [properties, onPropertySelect]);

  // Busca o token do Mapbox configurado no Supabase
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) {
          console.error('Erro ao buscar token do Mapbox:', error);
          toast.error('Erro ao carregar configuração do mapa');
          return;
        }
        
        if (data?.token) {
          setMapboxToken(data.token);
        } else {
          toast.error('Token do Mapbox não configurado. Entre em contato com o administrador.');
        }
      } catch (error) {
        console.error('Erro ao buscar token:', error);
        toast.error('Erro ao configurar o mapa');
      } finally {
        setIsLoadingToken(false);
      }
    };

    fetchMapboxToken();
  }, []);

  // Cache para geocodificação
  const geocodeCache = useRef<Map<string, [number, number] | null>>(new Map());
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Geocodifica endereços usando a API do Mapbox com cache
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    // Verifica cache primeiro
    if (geocodeCache.current.has(address)) {
      console.log(`Cache hit para: ${address}`);
      return geocodeCache.current.get(address) || null;
    }

    try {
      console.log(`Geocodificando com serviço central: "${address}"`);
      const result = await PropertyGeocodingService.getCachedCoordinates(address);
      if (result) {
        const coords: [number, number] = [result.lng, result.lat];
        geocodeCache.current.set(address, coords);
        console.log(`✅ Geocodificado: "${address}" -> [${coords[0]}, ${coords[1]}]`);
        return coords;
      } else {
        console.warn(`❌ Nenhum resultado encontrado para: "${address}"`);
      }
    } catch (error) {
      console.error(`❌ Erro ao geocodificar "${address}":`, error);
    }
    
    // Armazena null no cache para evitar tentativas repetidas
    geocodeCache.current.set(address, null);
    return null;
  };

  // Cria ícone personalizado baseado na pontuação
  const createScoreIcon = (score: number): HTMLDivElement => {
    const el = document.createElement('div');
    const size = Math.max(20, Math.min(40, 20 + (score / 10) * 20)); // Tamanho baseado na pontuação
    const colorClass = getScoreColor(score);
    
    el.className = `rounded-full border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-110 flex items-center justify-center text-white font-bold text-xs ${colorClass}`;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.textContent = score.toFixed(1);
    
    return el;
  };

  // Cria popup compacto com informações essenciais
  const createPropertyPopup = (property: Property): string => {
    return `
      <div class="p-3 w-48 bg-white rounded-lg shadow-lg">
        <h3 class="font-bold text-sm mb-2 text-gray-900 leading-tight">${property.title.length > 30 ? property.title.substring(0, 30) + '...' : property.title}</h3>
        
        <div class="flex justify-between text-xs mb-2">
          <span>🏠 ${property.bedrooms}Q ${property.bathrooms}B</span>
          <span>📐 ${property.area}m²</span>
        </div>
        
        <div class="flex justify-between items-center mb-3">
          <div>
            <span class="text-sm font-bold text-green-600">R$ ${(property.rent / 1000).toFixed(0)}k</span>
            <span class="text-xs text-gray-500">/mês</span>
          </div>
          <span class="px-2 py-1 rounded text-xs font-bold text-white ${getScoreColor(property.finalScore)}">
            ${property.finalScore.toFixed(1)}
          </span>
        </div>
        
        <button 
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded text-xs transition-colors"
          onclick="window.selectPropertyFromMap('${property.id}')"
        >
          Ver detalhes
        </button>
      </div>
    `;
  };

  // Inicializa o mapa
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    console.log('PropertyMap: Inicializando mapa...');
    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-43.9378, -19.9208], // Belo Horizonte como centro inicial
      zoom: 11
    });

    // Adiciona controles de navegação
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Aguarda o mapa carregar completamente
    map.current.on('load', () => {
      console.log('PropertyMap: Mapa carregado completamente');
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapboxToken]);

  // Atualiza marcadores quando as propriedades mudam
  useEffect(() => {
    if (!map.current || !properties.length) {
      console.log('PropertyMap: Aguardando mapa e propriedades...');
      return;
    }

    console.log('PropertyMap: Adicionando marcadores para', properties.length, 'propriedades');

    // Remove marcadores existentes
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Adiciona marcadores com processamento sequencial otimizado para melhor performance
    const addMarkers = async () => {
      const bounds = new mapboxgl.LngLatBounds();
      let markersAdded = 0;
      const total = properties.length;

      // Processa propriedades em lotes pequenos para evitar sobrecarga
      const batchSize = 3;
      for (let i = 0; i < properties.length; i += batchSize) {
        const batch = properties.slice(i, i + batchSize);
        
        // Processa lote atual
        const batchPromises = batch.map(async (property) => {
          const coords = await geocodeAddress(property.address);
          return { property, coords };
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        // Adiciona marcadores do lote
        batchResults.forEach(({ property, coords }) => {
          if (coords) {
            const [lng, lat] = coords;
            
            const markerElement = createScoreIcon(property.finalScore);
            
            const marker = new mapboxgl.Marker({ element: markerElement })
              .setLngLat([lng, lat])
              .setPopup(
                new mapboxgl.Popup({ 
                  offset: [0, -10],
                  closeButton: true,
                  closeOnClick: true,
                  maxWidth: '200px',
                  className: 'property-popup-compact'
                })
                  .setHTML(createPropertyPopup(property))
              )
              .addTo(map.current!);

            markersRef.current.push(marker);
            bounds.extend([lng, lat]);
            markersAdded++;
          }
        });
        
        // Atualiza progresso
        setLoadingProgress(Math.round(((i + batchSize) / total) * 100));
        
        // Pequena pausa entre lotes para não sobrecarregar
        if (i + batchSize < properties.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setLoadingProgress(100);
      console.log('PropertyMap: Total de marcadores adicionados:', markersAdded);

      // Ajusta o mapa para mostrar todos os marcadores
      if (markersAdded > 0) {
        if (!bounds.isEmpty() && markersRef.current.length > 1) {
          map.current?.fitBounds(bounds, { padding: 50 });
        } else if (markersRef.current.length === 1) {
          const firstMarker = markersRef.current[0];
          map.current?.setCenter(firstMarker.getLngLat());
          map.current?.setZoom(14);
        }
      }
    };

    // Limpa progresso e executa quando mapa estiver pronto
    setLoadingProgress(0);
    if (map.current.loaded()) {
      addMarkers();
    } else {
      map.current.on('load', addMarkers);
    }
  }, [properties, onPropertySelect]);

  if (isLoadingToken) {
    return (
      <Card className="w-full h-96 flex items-center justify-center">
        <CardContent className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <CardTitle className="mb-2">Carregando mapa...</CardTitle>
          <p className="text-muted-foreground">
            Configurando o mapa interativo
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!mapboxToken) {
    return (
      <Card className="w-full h-96 flex items-center justify-center">
        <CardContent className="text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <CardTitle className="mb-2">Mapa não disponível</CardTitle>
          <p className="text-muted-foreground">
            O token do Mapbox não foi configurado. Entre em contato com o administrador.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="w-full h-96 rounded-lg overflow-hidden border shadow-lg relative">
        <div ref={mapContainer} className="w-full h-full" />
        {loadingProgress > 0 && loadingProgress < 100 && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <span className="text-gray-600 font-medium">{loadingProgress}%</span>
            </div>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          .property-popup-compact .mapboxgl-popup-content {
            padding: 0 !important;
            border-radius: 8px !important;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2) !important;
            border: 1px solid #d1d5db !important;
            max-width: 200px !important;
          }
          .property-popup-compact .mapboxgl-popup-tip {
            border-top-color: #d1d5db !important;
          }
          .property-popup-compact .mapboxgl-popup-close-button {
            font-size: 18px !important;
            padding: 4px !important;
            color: #6b7280 !important;
            right: 4px !important;
            top: 4px !important;
          }
        `
      }} />
    </>
  );
};

export default PropertyMap;