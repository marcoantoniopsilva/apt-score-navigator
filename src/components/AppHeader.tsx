
import React from 'react';
import { Button } from '@/components/ui/button';
import { Home, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AppHeaderProps {
  title: string;
  subtitle: string;
  onAddProperty: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  title, 
  subtitle, 
  onAddProperty, 
  onRefresh, 
  isLoading 
}) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao fazer logout.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Home className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {title}
              </h1>
              <p className="text-gray-600">
                {subtitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-3">
              <Button 
                onClick={onRefresh}
                variant="outline"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button 
                onClick={onAddProperty}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Imóvel
              </Button>
              <Button 
                onClick={handleSignOut}
                variant="outline"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
