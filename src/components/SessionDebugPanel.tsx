import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export const SessionDebugPanel = () => {
  const { user, session, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        position: 'fixed', 
        bottom: '10px', 
        left: '10px', 
        zIndex: 9999, 
        padding: '10px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        color: 'white',
        borderRadius: '8px',
        fontSize: '12px'
      }}>
        🔄 Loading...
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '10px', 
      left: '10px', 
      zIndex: 9999, 
      padding: '10px',
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: 'white',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '300px'
    }}>
      <div>📊 Session Debug</div>
      <div>User: {user ? `✅ ${user.email}` : '❌ None'}</div>
      <div>Session: {session ? '✅ Active' : '❌ None'}</div>
      <div>Access Token: {session?.access_token ? '✅ Present' : '❌ Missing'}</div>
      <div>Refresh Token: {session?.refresh_token ? '✅ Present' : '❌ Missing'}</div>
      {user && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={signOut}
          style={{ marginTop: '5px', fontSize: '11px' }}
        >
          Logout
        </Button>
      )}
    </div>
  );
};