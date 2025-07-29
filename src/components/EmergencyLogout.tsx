import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export const EmergencyLogout = () => {
  const { signOut } = useAuth();

  const forceLogout = () => {
    console.log('🚨 Emergency logout triggered');
    
    // Limpar tudo
    localStorage.clear();
    sessionStorage.clear();
    
    // Forçar reload na página de auth
    window.location.href = '/auth';
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 10001, 
      padding: '10px',
      backgroundColor: 'rgba(255,0,0,0.9)',
      color: 'white',
      borderRadius: '8px',
      fontSize: '12px',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: '8px' }}>🚨 Ferramentas de Emergência</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={signOut}
          style={{ fontSize: '11px' }}
        >
          Logout Normal
        </Button>
        <Button 
          size="sm" 
          variant="destructive" 
          onClick={forceLogout}
          style={{ fontSize: '11px' }}
        >
          Logout Forçado
        </Button>
      </div>
    </div>
  );
};