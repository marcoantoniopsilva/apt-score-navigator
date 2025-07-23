import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SessionExpiredMessage = ({ error }: { error?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { user, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if error indicates session expiry
    if (error && (error.includes('JWT') || error.includes('expired') || error.includes('invalid_token'))) {
      setIsVisible(true);
    } else if (!user && !session) {
      // Also check if user suddenly became null (could indicate expired session)
      const wasLoggedIn = localStorage.getItem('was_logged_in');
      if (wasLoggedIn === 'true') {
        setIsVisible(true);
        localStorage.removeItem('was_logged_in');
      }
    } else if (user && session) {
      // User is logged in, store this state
      localStorage.setItem('was_logged_in', 'true');
      setIsVisible(false);
    }
  }, [error, user, session]);

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