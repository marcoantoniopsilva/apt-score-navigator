-- Adicionar novos campos à tabela user_profiles para suportar aluguel/compra
ALTER TABLE public.user_profiles 
ADD COLUMN intencao text,
ADD COLUMN faixa_preco text,
ADD COLUMN regiao_referencia text;