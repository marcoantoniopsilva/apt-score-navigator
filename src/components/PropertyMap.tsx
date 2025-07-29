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

  // Geocodifica endereços com cache para melhor performance
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    // Verifica cache primeiro
    if (geocodeCache.current.has(address)) {
      return geocodeCache.current.get(address) || null;
    }

    // Lista de variações do endereço para tentar
    const addressVariations = [
      `${address}, Brasil`,
      `${address}, Belo Horizonte, MG, Brasil`,
      address,
      address.replace(/,.*$/, ', Belo Horizonte, MG, Brasil'), // Remove tudo após primeira vírgula
    ];

    for (const addressToTry of addressVariations) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressToTry)}&format=json&limit=1&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'AptScoreNavigator/1.0'
            }
          }
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          const coords: [number, number] = [parseFloat(data[0].lon), parseFloat(data[0].lat)];
          console.log(`✅ Geocodificação bem-sucedida para: ${address} -> ${coords}`);
          // Armazena no cache
          geocodeCache.current.set(address, coords);
          return coords;
        }
      } catch (error) {
        console.warn(`Erro ao tentar geocodificar "${addressToTry}":`, error);
      }
    }
    
    console.warn(`❌ Não foi possível geocodificar: ${address}`);
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

  // Cria popup com informações da propriedade (melhorada visibilidade)
  const createPropertyPopup = (property: Property): string => {
    return `
      <div class="p-4 w-72 bg-white rounded-lg shadow-xl border-2 border-gray-100">
        <h3 class="font-bold text-lg mb-3 leading-tight text-gray-900">${property.title}</h3>
        
        <div class="grid grid-cols-2 gap-2 mb-3 text-sm">
          <div class="flex items-center bg-gray-50 p-2 rounded">
            <svg class="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
            </svg>
            <span class="font-medium">${property.bedrooms} Quartos</span>
          </div>
          <div class="flex items-center bg-gray-50 p-2 rounded">
            <svg class="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 14a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 5.677V7a1 1 0 11-2 0V3a1 1 0 011-1zm-6 8a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm0 4a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1z" clip-rule="evenodd"></path>
            </svg>
            <span class="font-medium">${property.bathrooms} Banheiros</span>
          </div>
          <div class="flex items-center bg-gray-50 p-2 rounded">
            <svg class="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clip-rule="evenodd"></path>
            </svg>
            <span class="font-medium">${property.area}m²</span>
          </div>
          <div class="flex items-center bg-gray-50 p-2 rounded">
            <svg class="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"></path>
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3z"></path>
            </svg>
            <span class="font-medium">${property.parkingSpaces} Vagas</span>
          </div>
        </div>
        
        <div class="flex justify-between items-center mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div>
            <span class="text-xl font-bold text-green-700">R$ ${property.rent.toLocaleString()}</span>
            <span class="text-sm text-green-600 block">por mês</span>
          </div>
          <div class="text-center">
            <span class="inline-flex items-center px-3 py-2 rounded-full text-sm font-bold text-white ${getScoreColor(property.finalScore)} shadow-lg">
              ⭐ ${property.finalScore.toFixed(1)}
            </span>
            <span class="text-xs text-gray-600 block mt-1">Pontuação</span>
          </div>
        </div>
        
        <button 
          class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
          onclick="window.selectPropertyFromMap('${property.id}')"
        >
          📋 Ver Detalhes Completos
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

    // Adiciona novos marcadores com processamento paralelo para melhor performance
    const addMarkers = async () => {
      const bounds = new mapboxgl.LngLatBounds();
      let markersAdded = 0;

      // Geocodifica todos os endereços em paralelo para melhor performance
      const geocodePromises = properties.map(property => 
        geocodeAddress(property.address).then(coords => ({ property, coords }))
      );
      
      const geocodeResults = await Promise.all(geocodePromises);

      // Adiciona marcadores para todas as propriedades geocodificadas
      geocodeResults.forEach(({ property, coords }) => {
        if (coords) {
          const [lng, lat] = coords;
          
          // Cria marcador personalizado
          const markerElement = createScoreIcon(property.finalScore);
          
          const marker = new mapboxgl.Marker({ element: markerElement })
            .setLngLat([lng, lat])
            .setPopup(
              new mapboxgl.Popup({ 
                offset: [0, -15],
                closeButton: true,
                closeOnClick: false,
                maxWidth: '320px',
                className: 'property-popup',
                anchor: 'bottom'
              })
                .setHTML(createPropertyPopup(property))
            )
            .addTo(map.current!);

          markersRef.current.push(marker);
          bounds.extend([lng, lat]);
          markersAdded++;
        }
      });

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

    // Executa imediatamente quando o mapa estiver pronto
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
      <div className="w-full h-96 rounded-lg overflow-hidden border shadow-lg">
        <div ref={mapContainer} className="w-full h-full" />
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          .property-popup .mapboxgl-popup-content {
            padding: 0 !important;
            border-radius: 12px !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
            border: 2px solid #e5e7eb !important;
          }
          .property-popup .mapboxgl-popup-tip {
            border-top-color: #e5e7eb !important;
          }
          .property-popup .mapboxgl-popup-close-button {
            font-size: 24px !important;
            padding: 8px !important;
            color: #6b7280 !important;
            right: 8px !important;
            top: 8px !important;
          }
          .property-popup .mapboxgl-popup-close-button:hover {
            background: #f3f4f6 !important;
            border-radius: 50% !important;
          }
        `
      }} />
    </>
  );
};

export default PropertyMap;