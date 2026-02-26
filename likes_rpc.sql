-- ==========================================================
-- RPC PARA CURTIDAS ANÔNIMAS (sem necessidade de login)
-- Execute no SQL Editor do Supabase
-- ==========================================================

-- Drop old versions
DROP FUNCTION IF EXISTS toggle_like_count(uuid, integer);

-- Função para incrementar/decrementar likes_count em prompts
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
