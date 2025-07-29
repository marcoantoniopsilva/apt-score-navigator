import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export const SupabaseConnectionTest = () => {
  const [status, setStatus] = useState<string>('Testando...');

  const testConnection = async () => {
    setStatus('🔄 Testando conexão...');
    
    try {
      // Teste 1: Verificar se consegue acessar Supabase
      console.log('🔗 Testando conexão básica com Supabase...');
      const { data, error } = await supabase.from('user_profiles').select('count').single();
      
      if (error) {
        console.log('❌ Erro na conexão:', error.message);
        setStatus(`❌ Erro: ${error.message}`);
        return;
      }
      
      // Teste 2: Verificar auth
      console.log('🔐 Testando sistema de autenticação...');
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError) {
        console.log('❌ Erro de auth:', authError.message);
        setStatus(`❌ Erro Auth: ${authError.message}`);
        return;
      }
      
      console.log('✅ Conexão OK');
      console.log('📊 Estado da sessão:', authData.session ? 'Ativa' : 'Inativa');
      setStatus(`✅ Conexão OK | Sessão: ${authData.session ? 'Ativa' : 'Inativa'}`);
      
    } catch (error) {
      console.error('💥 Erro geral:', error);
      setStatus(`💥 Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    }
  };

  const testLogin = async () => {
    setStatus('🔐 Testando login...');
    
    try {
      // Teste com credenciais de exemplo (deve falhar, mas nos dará informações)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'teste@exemplo.com',
        password: 'senha123'
      });
      
      if (error) {
        console.log('📋 Resposta do login de teste:', error.message);
        setStatus(`📋 Sistema auth funcionando: ${error.message}`);
      } else {
        console.log('⚠️ Login de teste inesperadamente funcionou');
        setStatus('⚠️ Login de teste funcionou (inesperado)');
      }
    } catch (error) {
      console.error('💥 Erro no teste de login:', error);
      setStatus(`💥 Erro no teste: ${error instanceof Error ? error.message : 'Desconhecido'}`);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)',
      zIndex: 10000, 
      padding: '20px',
      backgroundColor: 'rgba(255,255,255,0.95)',
      border: '2px solid #333',
      borderRadius: '12px',
      fontSize: '14px',
      textAlign: 'center',
      minWidth: '300px'
    }}>
      <div style={{ marginBottom: '15px', fontWeight: 'bold' }}>
        🔧 Teste de Conectividade Supabase
      </div>
      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
        {status}
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <Button size="sm" onClick={testConnection}>
          Testar Conexão
        </Button>
        <Button size="sm" variant="outline" onClick={testLogin}>
          Testar Login
        </Button>
      </div>
    </div>
  );
};