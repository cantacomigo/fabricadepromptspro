-- ==========================================================
-- SINCRONIZAÇÃO E REPARO DOS CONTADORES DE VENDAS
-- ==========================================================

-- 1. SINCRONIZAÇÃO INICIAL (Corrige vendas passadas)
UPDATE prompts p
SET sales_count = (
  SELECT count(*) 
  FROM purchases pur 
  WHERE pur.prompt_id = p.id AND pur.status = 'confirmed'
);

-- 2. TRIGGER ROBUSTO (Garante vendas futuras)
-- Esta versão lida com UPDATES (pagamento confirmado depois) 
-- e INSERTS (pagamento já entra como confirmado)

CREATE OR REPLACE FUNCTION increment_prompt_sales_v2()
RETURNS TRIGGER AS $$
BEGIN
    -- Caso seja uma nova inserção já confirmada
    IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed') THEN
        UPDATE prompts
        SET sales_count = COALESCE(sales_count, 0) + 1
        WHERE id = NEW.prompt_id;
    
    -- Caso seja uma atualização para confirmado
    ELSIF (TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status <> 'confirmed') THEN
        UPDATE prompts
        SET sales_count = COALESCE(sales_count, 0) + 1
        WHERE id = NEW.prompt_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger antigo e aplicar o novo
DROP TRIGGER IF EXISTS on_purchase_confirmed ON purchases;
CREATE TRIGGER on_purchase_confirmed_v2
  AFTER INSERT OR UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION increment_prompt_sales_v2();

-- 3. PERMISSÕES
GRANT SELECT ON prompts TO anon, authenticated;
