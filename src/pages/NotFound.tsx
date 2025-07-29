import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ImoblyHeader } from '@/components/ImoblyHeader';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      {/* Header */}
      <div className="bg-blue-600 px-6 py-4 shadow-lg">
        <ImoblyHeader />
      </div>
      
      <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-8xl mb-4">🏠</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Página não encontrada</h1>
          <p className="text-gray-600 mb-8 max-w-md">
            Ops! A página que você está procurando não existe ou foi movida.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate(-1)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <Button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Ir para início
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
