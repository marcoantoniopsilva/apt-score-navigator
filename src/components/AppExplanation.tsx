
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export const AppExplanation = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-6 mb-6 bg-white border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Como funciona o Comparador de Imóveis</h3>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="mt-6 space-y-4 text-sm text-gray-800">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2 text-gray-900 flex items-center gap-2">
              <span>📋</span> Adicionar Propriedades:
            </h4>
            <p className="text-gray-700 leading-relaxed">
              Clique em "Adicionar Propriedade" para inserir manualmente ou cole a URL de um anúncio para extração automática dos dados.
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2 text-gray-900 flex items-center gap-2">
              <span>⚖️</span> Sistema de Pontuação:
            </h4>
            <p className="text-gray-700 leading-relaxed">
              Cada propriedade é avaliada em 7 critérios (Localização, Espaço Interno, Mobília, Acessibilidade, Acabamento, Preço e Condomínio) numa escala de 1 a 10.
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2 text-gray-900 flex items-center gap-2">
              <span>🎯</span> Pesos dos Critérios:
            </h4>
            <p className="text-gray-700 leading-relaxed">
              Ajuste a importância de cada critério (1-5) conforme suas preferências. Critérios com peso maior influenciam mais a pontuação final.
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2 text-gray-900 flex items-center gap-2">
              <span>📊</span> Ranking Automático:
            </h4>
            <p className="text-gray-700 leading-relaxed">
              As propriedades são automaticamente ordenadas pela pontuação final, calculada com base nas notas e pesos definidos.
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2 text-gray-900 flex items-center gap-2">
              <span>✏️</span> Edição:
            </h4>
            <p className="text-gray-700 leading-relaxed">
              Clique no ícone de edição em qualquer propriedade para ajustar as pontuações. As alterações são salvas automaticamente.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
