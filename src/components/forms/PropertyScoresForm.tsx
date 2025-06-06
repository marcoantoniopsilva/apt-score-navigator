
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PropertyScores } from '@/types/property';

interface PropertyScoresFormProps {
  scores: PropertyScores;
  onScoreChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PropertyScoresForm: React.FC<PropertyScoresFormProps> = ({
  scores,
  onScoreChange
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Avaliação por Critérios (0-10)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="location">Localização</Label>
          <Input
            id="location"
            name="location"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={scores.location}
            onChange={onScoreChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="internalSpace">Espaço Interno</Label>
          <Input
            id="internalSpace"
            name="internalSpace"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={scores.internalSpace}
            onChange={onScoreChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="furniture">Mobília</Label>
          <Input
            id="furniture"
            name="furniture"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={scores.furniture}
            onChange={onScoreChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="accessibility">Acessibilidade</Label>
          <Input
            id="accessibility"
            name="accessibility"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={scores.accessibility}
            onChange={onScoreChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="finishing">Acabamento</Label>
          <Input
            id="finishing"
            name="finishing"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={scores.finishing}
            onChange={onScoreChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="price">Preço</Label>
          <Input
            id="price"
            name="price"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={scores.price}
            onChange={onScoreChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="condo">Condomínio</Label>
          <Input
            id="condo"
            name="condo"
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={scores.condo}
            onChange={onScoreChange}
            required
          />
        </div>
      </div>
    </div>
  );
};
