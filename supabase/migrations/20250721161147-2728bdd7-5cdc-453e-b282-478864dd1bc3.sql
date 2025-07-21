-- Primeiro, vamos limpar as propriedades existentes
DELETE FROM properties;

-- Modificar a tabela properties para usar scores dinâmicos
-- Remove as colunas de score específicos
ALTER TABLE properties 
DROP COLUMN IF EXISTS location_score,
DROP COLUMN IF EXISTS internal_space_score,
DROP COLUMN IF EXISTS furniture_score,
DROP COLUMN IF EXISTS accessibility_score,
DROP COLUMN IF EXISTS finishing_score,
DROP COLUMN IF EXISTS price_score,
DROP COLUMN IF EXISTS condo_score;

-- Adiciona uma coluna JSON para scores dinâmicos
ALTER TABLE properties 
ADD COLUMN scores JSONB NOT NULL DEFAULT '{}'::jsonb;