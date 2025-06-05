
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
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  console.log('PropertyCard: isMobile =', isMobile, 'isEditing =', isEditing);

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

  const handleEditToggle = () => {
    console.log('PropertyCard: Toggling edit mode from', isEditing, 'to', !isEditing);
    if (!isEditing) {
      // Garantir que os dados estão atualizados quando iniciamos a edição
      setEditedProperty(property);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    console.log('PropertyCard: Iniciando save das alterações');
    console.log('PropertyCard: Scores editados:', editedProperty.scores);
    
    const updatedProperty = {
      ...editedProperty,
      finalScore: calculateFinalScore(editedProperty.scores, weights)
    };
    
    console.log('PropertyCard: Propriedade com nova pontuação final:', updatedProperty);
    console.log('PropertyCard: Chamando onUpdate...');
    
    try {
      await onUpdate(updatedProperty);
      console.log('PropertyCard: onUpdate executado com sucesso');
      setIsEditing(false);
    } catch (error) {
      console.error('PropertyCard: Erro ao salvar alterações:', error);
      // Manter o modo de edição se houver erro
    }
  };

  const handleCancel = () => {
    console.log('PropertyCard: Cancelando edição, resetando para:', property);
    setEditedProperty(property);
    setIsEditing(false);
  };

  const handleScoreChange = (criterion: keyof Property['scores'], value: number) => {
    console.log(`PropertyCard: Alterando ${criterion} para ${value}`);
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
    <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className={`${getRankColor(rank)} text-white px-2 sm:px-3 py-1 rounded-full font-bold text-sm flex-shrink-0`}>
            #{rank}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{property.title}</h3>
            <div className="flex items-center text-gray-600 mt-1">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="text-sm truncate">{property.address}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
          <div className="text-right">
            <div className={`text-xl sm:text-2xl font-bold px-2 sm:px-3 py-1 rounded-lg ${getScoreColor(property.finalScore)}`}>
              {property.finalScore.toFixed(1)}
            </div>
            <span className="text-xs text-gray-500">Pontuação</span>
          </div>
          <div className="flex flex-col space-y-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditToggle}
              className="h-8 w-8 sm:h-9 sm:w-auto sm:px-2"
            >
              <Edit className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Editar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(property.id)}
              className="text-red-600 hover:text-red-700 h-8 w-8 sm:h-9 sm:w-auto sm:px-2"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Excluir</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Informações básicas */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-6 text-sm">
        <div className="flex items-center space-x-2">
          <Home className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <span className="truncate">{property.bedrooms} quartos</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 text-gray-500 flex-shrink-0">🚿</div>
          <span className="truncate">{property.bathrooms} banheiros</span>
        </div>
        <div className="flex items-center space-x-2">
          <Car className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <span className="truncate">{property.parkingSpaces} vagas</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="truncate">{property.area}m² - {property.floor}</span>
        </div>
      </div>

      {/* Custos */}
      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-6">
        <div className="flex items-center mb-3">
          <Calculator className="h-4 w-4 mr-2 text-gray-600" />
          <h4 className="font-medium text-gray-900">Custos Mensais</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Aluguel:</span>
            <span className="font-medium">{formatCurrency(property.rent)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Condomínio:</span>
            <span className="font-medium">{formatCurrency(property.condo)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">IPTU:</span>
            <span className="font-medium">{formatCurrency(property.iptu)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Seguro:</span>
            <span className="font-medium">{formatCurrency(property.fireInsurance)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Outras:</span>
            <span className="font-medium">{formatCurrency(property.otherFees)}</span>
          </div>
          <div className="flex justify-between col-span-1 sm:col-span-2 lg:col-span-1 border-t pt-2">
            <span className="text-gray-900 font-semibold">Total:</span>
            <span className="font-bold text-blue-600">
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
              <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <Label className="text-sm font-medium w-full sm:w-32 flex-shrink-0">{label}:</Label>
                <div className="flex items-center space-x-2 flex-1">
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
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-gray-500 flex-shrink-0">
                    (peso: {weights[key as keyof CriteriaWeights]})
                  </span>
                </div>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t">
              <Button onClick={handleSave} size="sm" className="flex-1 sm:flex-none">
                Salvar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancel}
                className="flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(CRITERIA_LABELS).map(([key, label]) => {
              const score = property.scores[key as keyof Property['scores']];
              const weight = weights[key as keyof CriteriaWeights];
              const weightedScore = score * weight;
              
              return (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium truncate">{label}</span>
                  <div className="flex items-center space-x-2 flex-shrink-0">
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
            className="text-blue-600 hover:text-blue-700 text-sm underline break-all"
          >
            Ver anúncio original →
          </a>
        </div>
      )}
    </Card>
  );
};
