import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('=== TESTE: Buscando preferências do usuário ===')
    
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header presente:', !!authHeader)
    
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: 'Sem autorização',
        authHeader: false
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('Token recebido (primeiros 20 chars):', token.substring(0, 20))

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validar token
    const { data: user, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user.user) {
      console.error('Erro na validação do usuário:', userError)
      return new Response(JSON.stringify({ 
        error: 'Token inválido',
        details: userError?.message
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = user.user.id
    console.log('User ID:', userId)

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    console.log('Perfil encontrado:', !!profile)
    console.log('Erro no perfil:', profileError)

    // Buscar critérios ativos
    const { data: criteria, error: criteriaError } = await supabase
      .from('user_criteria_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('ativo', true)

    console.log('Critérios encontrados:', criteria?.length || 0)
    console.log('Erro nos critérios:', criteriaError)

    return new Response(JSON.stringify({
      success: true,
      userId: userId,
      profile: profile,
      profileError: profileError,
      criteria: criteria,
      criteriaError: criteriaError,
      criteriaCount: criteria?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Erro geral:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})