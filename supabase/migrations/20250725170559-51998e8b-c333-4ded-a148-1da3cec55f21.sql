-- Adicionar novos campos para suportar seleções múltiplas no onboarding
-- Estas colunas vão armazenar arrays de strings para as seleções múltiplas

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS objetivo_principal_multi TEXT[],
ADD COLUMN IF NOT EXISTS situacao_moradia_multi TEXT[],
ADD COLUMN IF NOT EXISTS valor_principal_multi TEXT[];

-- Criar índices para melhorar performance de consultas em arrays
CREATE INDEX IF NOT EXISTS idx_user_profiles_objetivo_principal_multi 
ON public.user_profiles USING GIN(objetivo_principal_multi);

CREATE INDEX IF NOT EXISTS idx_user_profiles_situacao_moradia_multi 
ON public.user_profiles USING GIN(situacao_moradia_multi);

CREATE INDEX IF NOT EXISTS idx_user_profiles_valor_principal_multi 
ON public.user_profiles USING GIN(valor_principal_multi);

-- Comentários para documentar os novos campos
COMMENT ON COLUMN public.user_profiles.objetivo_principal_multi IS 'Array de objetivos principais selecionados pelo usuário (até 2 opções)';
COMMENT ON COLUMN public.user_profiles.situacao_moradia_multi IS 'Array de situações de moradia selecionadas pelo usuário (até 2 opções)';
COMMENT ON COLUMN public.user_profiles.valor_principal_multi IS 'Array de valores principais selecionados pelo usuário (múltiplas opções permitidas)';