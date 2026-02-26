-- ==========================================================
-- RPC PARA CURTIDAS ANÔNIMAS + REALTIME
-- Execute TUDO no SQL Editor do Supabase
-- ==========================================================

-- 1. Drop versões anteriores
DROP FUNCTION IF EXISTS toggle_like_count(uuid, integer);

-- 2. Função para incrementar/decrementar likes_count
-- Pode ser chamada por qualquer pessoa (anon ou autenticada)
CREATE OR REPLACE FUNCTION toggle_like_count(
  p_prompt_id UUID,
  p_delta INTEGER
) RETURNS void AS $$
BEGIN
  UPDATE prompts
  SET likes_count = GREATEST(0, COALESCE(likes_count, 0) + p_delta)
  WHERE id = p_prompt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ativar Realtime na tabela prompts (atualização automática)
ALTER PUBLICATION supabase_realtime ADD TABLE prompts;
