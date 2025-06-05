
import React from 'react';
import { CriteriaWeights } from '@/types/property';
import { CriteriaWeightsEditor } from '@/components/CriteriaWeightsEditor';

interface MobileWeightsEditorProps {
  weights: CriteriaWeights;
  onWeightsChange: (weights: CriteriaWeights) => void;
}

export const MobileWeightsEditor: React.FC<MobileWeightsEditorProps> = ({
  weights,
  onWeightsChange
}) => {
  return (
    <div className="mt-8">
      <CriteriaWeightsEditor 
        weights={weights} 
        onWeightsChange={onWeightsChange} 
      />
    </div>
  );
};
