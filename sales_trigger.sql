-- ==========================================================
-- TRIGGER PARA INCREMENTAR CONTADOR DE VENDAS AUTOMATICAMENTE
-- ==========================================================

-- 1. Função que será executada pelo trigger
CREATE OR REPLACE FUNCTION public.handle_confirmed_purchase()
RETURNS trigger AS $$
BEGIN
  -- Se o status mudou para 'confirmed'
  IF (NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed')) THEN
    UPDATE public.prompts
    SET sales_count = sales_count + 1
    WHERE id = NEW.prompt_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criação do Trigger
DROP TRIGGER IF EXISTS on_purchase_confirmed ON public.purchases;

CREATE TRIGGER on_purchase_confirmed
  AFTER UPDATE OF status ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_confirmed_purchase();

-- 3. Também tratar inserções que já venham como confirmed (raro mas possível)
DROP TRIGGER IF EXISTS on_purchase_inserted ON public.purchases;

CREATE TRIGGER on_purchase_inserted
  AFTER INSERT ON public.purchases
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION public.handle_confirmed_purchase();
