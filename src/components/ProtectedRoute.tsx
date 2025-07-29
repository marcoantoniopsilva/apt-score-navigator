
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, session, loading } = useAuth();
  
  console.log('🛡️ ProtectedRoute: Checking access');
  console.log('   - Loading:', loading);
  console.log('   - User:', !!user);
  console.log('   - Session:', !!session);
  console.log('   - User email:', user?.email || 'None');
  console.log('   - Current location:', window.location.pathname);

  if (loading) {
    console.log('🔄 ProtectedRoute: Still loading, showing loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Carregando...
          </h3>
          <p className="text-gray-600">
            Verificando sua autenticação
          </p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    console.log('🚫 ProtectedRoute: No valid user/session, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('✅ ProtectedRoute: Access granted');
  return <>{children}</>;
};

export default ProtectedRoute;
