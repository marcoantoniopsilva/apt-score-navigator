
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, RefreshCw, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SubscriptionStatus } from './SubscriptionStatus';
import { ImoblyHeader } from './ImoblyHeader';

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
  const { signOut } = useAuth();
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
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <ImoblyHeader variant="light" showSubtitle={false} />
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base text-white/90 truncate">
                {subtitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 w-full sm:w-auto">
            <Button 
              onClick={onRefresh}
              variant="outline"
              disabled={isLoading}
              size="sm"
              className="flex-1 sm:flex-none border-white bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-1 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button 
              onClick={onAddProperty}
              className="bg-white text-blue-600 hover:bg-white/90 flex-1 sm:flex-none"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Adicionar</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <Button 
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="px-2 sm:px-3 border-white bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
