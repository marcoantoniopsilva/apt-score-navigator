
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function validateUser(authHeader: string | null, supabaseUrl: string, supabaseServiceRoleKey: string) {
  if (!authHeader) {
    throw new Error('Token de autorização é obrigatório');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Verificar o usuário autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  
  if (authError || !user) {
    throw new Error('Usuário não autenticado');
  }

  return user;
}
