
import React, { useState } from 'react';
import { Property, CriteriaWeights, CRITERIA_LABELS } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Trash2, Star, MapPin, Home, Car, Calculator } from 'lucide-react';
import { calculateFinalScore } from '@/utils/scoreCalculator';

interface PropertyCardProps {
  property: Property;
  rank: number;
  weights: CriteriaWeights;
  onUpdate: (property: Property) => void;
  onDelete: (id: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  rank,
  weights,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProperty, setEditedProperty] = useState(property);

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500';
    if (rank === 2) return 'bg-gray-400';
    if (rank === 3) return 'bg-amber-600';
    return 'bg-blue-500';
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-50';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50';
    if (score >= 4) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const handleSave = () => {
    const updatedProperty = {
      ...editedProperty,
      finalScore: calculateFinalScore(editedProperty.scores, weights)
    };
    onUpdate(updatedProperty);
    setIsEditing(false);
  };

  const handleScoreChange = (criterion: keyof Property['scores'], value: number) => {
    setEditedProperty(prev => ({
      ...prev,
      scores: {
        ...prev.scores,
        [criterion]: Math.max(0, Math.min(10, value))
      }
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`${getRankColor(rank)} text-white px-3 py-1 rounded-full font-bold text-sm`}>
            #{rank}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{property.title}</h3>
            <div className="flex items-center text-gray-600 mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">{property.address}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${getScoreColor(property.finalScore)}`}>
              {property.finalScore.toFixed(1)}
            </div>
            <span className="text-xs text-gray-500">Pontuação Final</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(property.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Informações básicas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Home className="h-4 w-4 text-gray-500" />
          <span className="text-sm">{property.bedrooms} quartos</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 text-gray-500">🚿</div>
          <span className="text-sm">{property.bathrooms} banheiros</span>
        </div>
        <div className="flex items-center space-x-2">
          <Car className="h-4 w-4 text-gray-500" />
          <span className="text-sm">{property.parkingSpaces} vagas</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm">{property.area}m² - {property.floor}</span>
        </div>
      </div>

      {/* Custos */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center mb-3">
          <Calculator className="h-4 w-4 mr-2 text-gray-600" />
          <h4 className="font-medium text-gray-900">Custos Mensais</h4>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Aluguel:</span>
            <span className="ml-2 font-medium">{formatCurrency(property.rent)}</span>
          </div>
          <div>
            <span className="text-gray-600">Condomínio:</span>
            <span className="ml-2 font-medium">{formatCurrency(property.condo)}</span>
          </div>
          <div>
            <span className="text-gray-600">IPTU:</span>
            <span className="ml-2 font-medium">{formatCurrency(property.iptu)}</span>
          </div>
          <div>
            <span className="text-gray-600">Seguro:</span>
            <span className="ml-2 font-medium">{formatCurrency(property.fireInsurance)}</span>
          </div>
          <div>
            <span className="text-gray-600">Outras taxas:</span>
            <span className="ml-2 font-medium">{formatCurrency(property.otherFees)}</span>
          </div>
          <div className="md:col-span-1 col-span-2">
            <span className="text-gray-900 font-semibold">Total:</span>
            <span className="ml-2 font-bold text-lg text-blue-600">
              {formatCurrency(property.totalMonthlyCost)}
            </span>
          </div>
        </div>
      </div>

      {/* Pontuações */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <Star className="h-4 w-4 mr-2" />
          Avaliação por Critérios
        </h4>
        
        {isEditing ? (
          <div className="space-y-3">
            {Object.entries(CRITERIA_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-3">
                <Label className="w-32 text-sm">{label}:</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={editedProperty.scores[key as keyof Property['scores']]}
                  onChange={(e) => handleScoreChange(
                    key as keyof Property['scores'], 
                    parseFloat(e.target.value) || 0
                  )}
                  className="w-20"
                />
                <span className="text-sm text-gray-500">
                  (peso: {weights[key as keyof CriteriaWeights]})
                </span>
              </div>
            ))}
            <div className="flex space-x-2 pt-3">
              <Button onClick={handleSave} size="sm">Salvar</Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setEditedProperty(property);
                  setIsEditing(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(CRITERIA_LABELS).map(([key, label]) => {
              const score = property.scores[key as keyof Property['scores']];
              const weight = weights[key as keyof CriteriaWeights];
              const weightedScore = score * weight;
              
              return (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{label}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={getScoreColor(score)}>
                      {score.toFixed(1)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      ×{weight} = {weightedScore.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Link do anúncio */}
      {property.sourceUrl && (
        <div className="mt-4 pt-4 border-t">
          <a 
            href={property.sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 text-sm underline"
          >
            Ver anúncio original →
          </a>
        </div>
      )}
    </Card>
  );
};
