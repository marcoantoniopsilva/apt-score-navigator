import { useEffect, useState } from 'react';
import { useSessionMonitor } from '@/hooks/useSessionMonitor';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export const TestSessionRenewal = () => {
  const { refreshSession, validateSession } = useSessionMonitor();
  const { session, user } = useAuth();
  const [testResult, setTestResult] = useState<string>('');

  // Teste automático na inicialização
  useEffect(() => {
    if (session && user) {
      (async () => {
        const ok = await refreshSession();
        const result = `Teste automático de refreshSession: ${ok ? 'Sucesso' : 'Falha'}`;
        console.log(result);
        setTestResult(result);
      })();
    }
  }, [refreshSession, session, user]);

  const handleManualTest = async () => {
    console.log('🧪 Iniciando teste manual de sessão...');
    setTestResult('Testando...');
    
    try {
      // Primeiro validar a sessão
      const isValid = await validateSession();
      console.log('📊 Validação de sessão:', isValid ? 'Válida' : 'Inválida');
      
      // Depois tentar refresh
      const refreshOk = await refreshSession();
      console.log('🔄 Refresh de sessão:', refreshOk ? 'Sucesso' : 'Falha');
      
      setTestResult(`Validação: ${isValid ? 'OK' : 'FALHA'} | Refresh: ${refreshOk ? 'OK' : 'FALHA'}`);
    } catch (error) {
      console.error('Erro no teste manual:', error);
      setTestResult('Erro no teste');
    }
  };

  // Não mostrar se não estiver logado
  if (!session || !user) {
    return null;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      zIndex: 9999, 
      padding: '10px',
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: 'white',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '300px'
    }}>
      <div>🧪 Teste de Sessão</div>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={handleManualTest}
        style={{ marginTop: '5px', fontSize: '11px' }}
      >
        Testar Refresh Manual
      </Button>
      {testResult && (
        <div style={{ marginTop: '5px', fontSize: '10px' }}>
          {testResult}
        </div>
      )}
    </div>
  );
};