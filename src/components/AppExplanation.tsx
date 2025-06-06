
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export const AppExplanation = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-800">Como funciona o Comparador de Imóveis</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-700"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="mt-4 space-y-3 text-sm text-blue-700">
          <div>
            <h4 className="font-medium mb-1">📋 Adicionar Propriedades:</h4>
            <p>Clique em "Adicionar Propriedade" para inserir manualmente ou cole a URL de um anúncio para extração automática dos dados.</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">⚖️ Sistema de Pontuação:</h4>
            <p>Cada propriedade é avaliada em 7 critérios (Localização, Espaço Interno, Mobília, Acessibilidade, Acabamento, Preço e Condomínio) numa escala de 1 a 10.</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">🎯 Pesos dos Critérios:</h4>
            <p>Ajuste a importância de cada critério (1-5) conforme suas preferências. Critérios com peso maior influenciam mais a pontuação final.</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">📊 Ranking Automático:</h4>
            <p>As propriedades são automaticamente ordenadas pela pontuação final, calculada com base nas notas e pesos definidos.</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-1">✏️ Edição:</h4>
            <p>Clique no ícone de edição em qualquer propriedade para ajustar as pontuações. As alterações são salvas automaticamente.</p>
          </div>
        </div>
      )}
    </Card>
  );
};
