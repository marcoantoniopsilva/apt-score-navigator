
import React from 'react';
import { RefreshCw } from 'lucide-react';

const LoadingState: React.FC = () => {
  return (
    <div className="text-center py-12">
      <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
        <RefreshCw className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Carregando propriedades...
        </h3>
        <p className="text-gray-600">
          Aguarde enquanto carregamos suas propriedades salvas.
        </p>
      </div>
    </div>
  );
};

export default LoadingState;
