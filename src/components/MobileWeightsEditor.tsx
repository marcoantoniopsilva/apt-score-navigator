
import React from 'react';
import { CriteriaWeights } from '@/types/property';
import { CriteriaWeightsEditor } from '@/components/CriteriaWeightsEditor';
import { useCriteria } from '@/hooks/useCriteria';

interface MobileWeightsEditorProps {
  weights: CriteriaWeights;
  onWeightsChange: (weights: CriteriaWeights) => void;
  onReset?: () => void;
}

export const MobileWeightsEditor: React.FC<MobileWeightsEditorProps> = ({
  weights,
  onWeightsChange,
  onReset
}) => {
  const { activeCriteria } = useCriteria();
  
  return (
    <div className="mt-8">
      <CriteriaWeightsEditor 
        weights={weights} 
        onWeightsChange={onWeightsChange}
        activeCriteria={activeCriteria}
        onReset={onReset}
      />
    </div>
  );
};
