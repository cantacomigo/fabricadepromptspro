-- ==========================================================
-- FUNÇÃO PARA BUSCAR ESTATÍSTICAS GLOBAIS (Bypassing RLS)
-- ==========================================================

-- Esta função permite que o site conte o total de vendas confirmadas
-- sem precisar dar acesso de leitura à tabela de 'purchases' para todos os usuários.
-- O prefixo 'SECURITY DEFINER' faz com que a função rode com permissões de administrador.

CREATE OR REPLACE FUNCTION public.get_total_confirmed_sales()
RETURNS bigint AS $$
BEGIN
  RETURN (
    SELECT count(*)
    FROM public.purchases
    WHERE status = 'confirmed'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que qualquer usuário (logado ou não) possa chamar esta função
GRANT EXECUTE ON FUNCTION public.get_total_confirmed_sales() TO anon, authenticated, service_role;
