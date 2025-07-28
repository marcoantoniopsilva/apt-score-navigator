import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface SessionStatus {
  status: 'healthy' | 'warning' | 'error' | 'checking';
  message: string;
  showRefresh?: boolean;
}

export const SessionStatus: React.FC = () => {
  const { user, session, loading } = useAuth();
  const { validateSession, refreshSession } = useSessionMonitor();
  const [status, setStatus] = useState<SessionStatus>({ 
    status: 'checking', 
    message: 'Verificando...' 
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkStatus = async () => {
    if (loading) {
      setStatus({ status: 'checking', message: 'Carregando...' });
      return;
    }

    if (!user || !session) {
      setStatus({ 
        status: 'error', 
        message: 'Não logado',
        showRefresh: false
      });
      return;
    }

    setStatus({ status: 'checking', message: 'Verificando sessão...' });

    try {
      const isValid = await validateSession();
      
      if (isValid) {
        setStatus({ 
          status: 'healthy', 
          message: 'Sessão ativa',
          showRefresh: false
        });
      } else {
        setStatus({ 
          status: 'warning', 
          message: 'Sessão precisa ser atualizada',
          showRefresh: true
        });
      }
    } catch (error) {
      setStatus({ 
        status: 'error', 
        message: 'Erro na validação',
        showRefresh: true
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const success = await refreshSession();
      if (success) {
        setStatus({ 
          status: 'healthy', 
          message: 'Sessão atualizada',
          showRefresh: false
        });
      } else {
        setStatus({ 
          status: 'error', 
          message: 'Falha ao atualizar',
          showRefresh: true
        });
      }
    } catch (error) {
      setStatus({ 
        status: 'error', 
        message: 'Erro ao atualizar',
        showRefresh: true
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Verificar status a cada 30 segundos
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, [user, session, loading]);

  const getStatusIcon = () => {
    switch (status.status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'healthy':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'error':
        return 'destructive';
      case 'checking':
        return 'outline';
    }
  };

  // Só mostrar quando há algo relevante para exibir
  if (loading || status.status === 'healthy') {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border">
      <Badge variant={getStatusColor()} className="flex items-center gap-1">
        {getStatusIcon()}
        {status.message}
      </Badge>
      
      {status.showRefresh && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-6 px-2"
        >
          {isRefreshing ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            'Atualizar'
          )}
        </Button>
      )}
    </div>
  );
};