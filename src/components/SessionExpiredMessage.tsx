import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSimpleSession } from '@/hooks/useSimpleSession';
import { isAuthError } from '@/utils/sessionUtils';

export const SessionExpiredMessage = ({ error }: { error?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { user, session } = useAuth();
  const { isAuthenticated } = useSimpleSession();
  const navigate = useNavigate();

  useEffect(() => {
    // Simplified session expiry check
    const hasError = error && isAuthError(error);
    
    if (hasError || (!user && !session)) {
      setIsVisible(true);
    } else if (isAuthenticated) {
      setIsVisible(false);
    }
  }, [error, user, session, isAuthenticated]);

  const handleLoginRedirect = () => {
    navigate('/auth');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">Sessão expirada</p>
            <p className="text-sm text-amber-700">Faça login novamente para continuar</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </Button>
          <Button
            size="sm"
            onClick={handleLoginRedirect}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            Fazer Login
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};