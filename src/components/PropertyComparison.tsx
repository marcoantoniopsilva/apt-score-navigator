import React from 'react';
import { Property } from '@/types/property';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, TrendingUp, MapPin, Home, Car, Bath, Bed } from 'lucide-react';
import { CRITERIA_LABELS } from '@/types/property';

interface PropertyComparisonProps {
  properties: Property[];
  onRemoveProperty: (propertyId: string) => void;
  onClose: () => void;
}

export const PropertyComparison: React.FC<PropertyComparisonProps> = ({
  properties,
  onRemoveProperty,
  onClose
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getBestValue = (values: number[], type: 'high' | 'low' = 'high') => {
    if (type === 'high') {
      return Math.max(...values);
    }
    return Math.min(...values);
  };

  const isBest = (value: number, values: number[], type: 'high' | 'low' = 'high') => {
    return value === getBestValue(values, type);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-auto bg-white">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">
                Comparação de Imóveis
              </h2>
              <Badge variant="secondary">{properties.length} imóveis</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 font-medium text-gray-900 sticky left-0 bg-white z-10">
                    Critério
                  </th>
                  {properties.map((property) => (
                    <th key={property.id} className="text-center p-3 min-w-[200px]">
                      <div className="space-y-2">
                        <div className="font-medium text-gray-900 truncate">
                          {property.title}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveProperty(property.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Nota Final */}
                <tr className="border-b border-gray-100">
                  <td className="p-3 font-medium text-gray-900 sticky left-0 bg-white">
                    🏆 Nota Final
                  </td>
                  {properties.map((property) => {
                    const finalScores = properties.map(p => p.finalScore);
                    const isBestScore = isBest(property.finalScore, finalScores);
                    return (
                      <td key={property.id} className="p-3 text-center">
                        <Badge 
                          className={`${getScoreColor(property.finalScore)} ${isBestScore ? 'ring-2 ring-green-500' : ''}`}
                        >
                          {property.finalScore.toFixed(1)}
                        </Badge>
                      </td>
                    );
                  })}
                </tr>

                {/* Custo Total */}
                <tr className="border-b border-gray-100">
                  <td className="p-3 font-medium text-gray-900 sticky left-0 bg-white">
                    💰 Custo Total Mensal
                  </td>
                  {properties.map((property) => {
                    const costs = properties.map(p => p.totalMonthlyCost);
                    const isBestCost = isBest(property.totalMonthlyCost, costs, 'low');
                    return (
                      <td key={property.id} className="p-3 text-center">
                        <span className={isBestCost ? 'font-bold text-green-600' : ''}>
                          {formatCurrency(property.totalMonthlyCost)}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                {/* Informações Básicas */}
                <tr className="border-b border-gray-100">
                  <td className="p-3 font-medium text-gray-900 sticky left-0 bg-white">
                    🏠 Informações Básicas
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="p-3 text-center">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center justify-center gap-1">
                          <Bed className="h-3 w-3" />
                          <span>{property.bedrooms}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <Bath className="h-3 w-3" />
                          <span>{property.bathrooms}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <Car className="h-3 w-3" />
                          <span>{property.parkingSpaces}</span>
                        </div>
                        <div className="text-gray-600">{property.area}m²</div>
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Endereço */}
                <tr className="border-b border-gray-100">
                  <td className="p-3 font-medium text-gray-900 sticky left-0 bg-white">
                    📍 Endereço
                  </td>
                  {properties.map((property) => (
                    <td key={property.id} className="p-3 text-center">
                      <div className="text-sm text-gray-600 max-w-[180px] mx-auto">
                        {property.address}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Scores detalhados */}
                {Object.entries(CRITERIA_LABELS).map(([criterion, label]) => (
                  <tr key={criterion} className="border-b border-gray-100">
                    <td className="p-3 font-medium text-gray-900 sticky left-0 bg-white">
                      📊 {label}
                    </td>
                    {properties.map((property) => {
                      const scores = properties.map(p => p.scores[criterion as keyof typeof p.scores]);
                      const isBestScore = isBest(property.scores[criterion as keyof typeof property.scores], scores);
                      return (
                        <td key={property.id} className="p-3 text-center">
                          <Badge 
                            variant="outline"
                            className={isBestScore ? 'border-green-500 text-green-700' : ''}
                          >
                            {property.scores[criterion as keyof typeof property.scores].toFixed(1)}
                          </Badge>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Custos detalhados */}
                <tr className="border-b border-gray-100">
                  <td className="p-3 font-medium text-gray-900 sticky left-0 bg-white">
                    🏠 Aluguel
                  </td>
                  {properties.map((property) => {
                    const rents = properties.map(p => p.rent);
                    const isBestRent = isBest(property.rent, rents, 'low');
                    return (
                      <td key={property.id} className="p-3 text-center">
                        <span className={isBestRent ? 'font-bold text-green-600' : ''}>
                          {formatCurrency(property.rent)}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                <tr className="border-b border-gray-100">
                  <td className="p-3 font-medium text-gray-900 sticky left-0 bg-white">
                    🏢 Condomínio
                  </td>
                  {properties.map((property) => {
                    const condos = properties.map(p => p.condo);
                    const isBestCondo = isBest(property.condo, condos, 'low');
                    return (
                      <td key={property.id} className="p-3 text-center">
                        <span className={isBestCondo ? 'font-bold text-green-600' : ''}>
                          {formatCurrency(property.condo)}
                        </span>
                      </td>
                    );
                  })}
                </tr>

                <tr className="border-b border-gray-100">
                  <td className="p-3 font-medium text-gray-900 sticky left-0 bg-white">
                    🏛️ IPTU
                  </td>
                  {properties.map((property) => {
                    const iptus = properties.map(p => p.iptu);
                    const isBestIptu = isBest(property.iptu, iptus, 'low');
                    return (
                      <td key={property.id} className="p-3 text-center">
                        <span className={isBestIptu ? 'font-bold text-green-600' : ''}>
                          {formatCurrency(property.iptu)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
            <p className="font-medium mb-2">💡 Como interpretar:</p>
            <ul className="space-y-1">
              <li>• <strong>Valores em verde</strong>: Melhor opção neste critério</li>
              <li>• <strong>Nota Final</strong>: Calculada com base nos pesos definidos</li>
              <li>• <strong>Custo Total</strong>: Soma de aluguel + condomínio + IPTU + seguro + outras taxas</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};