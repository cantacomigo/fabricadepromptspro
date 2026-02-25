-- ==========================================================
-- ADIÇÃO DE INSTRUÇÕES PASSO A PASSO AOS PROMPTS
-- ==========================================================

-- 1. Adiciona a coluna de instruções à tabela de prompts
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS instructions TEXT;

-- 2. (Opcional) Adiciona uma instrução padrão para todos os prompts existentes
UPDATE prompts 
SET instructions = '1. Abra o seu ChatGPT (Plus/GPT-4 preferencialmente para imagens). \n2. Cole o prompt acima. \n3. Caso queira, peça variações ou ajustes específicos baseados no resultado.'
WHERE instructions IS NULL;
