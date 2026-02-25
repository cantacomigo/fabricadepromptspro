-- ==========================================================
-- ATUALIZAÇÃO DO ESQUEMA PARA ASSINATURAS (PRO)
-- ==========================================================

-- 1. Adicionar colunas de assinatura à tabela de perfis
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS mp_preapproval_id TEXT;

-- 2. Criar função para verificar se o usuário tem acesso (Compra individual OU Assinatura Ativa)
CREATE OR REPLACE FUNCTION public.has_prompt_access(p_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_is_subscriber BOOLEAN;
BEGIN
    -- 1. Verificar se é Admin (Acesso total)
    IF public.is_admin() THEN
        RETURN TRUE;
    END IF;

    -- 2. Verificar se tem assinatura ativa (não expirada)
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = v_user_id 
        AND subscription_status = 'active'
        AND (subscription_expiry IS NULL OR subscription_expiry > NOW())
    ) INTO v_is_subscriber;

    IF v_is_subscriber THEN
        RETURN TRUE;
    END IF;

    -- 3. Verificar se comprou o prompt individualmente
    RETURN EXISTS (
        SELECT 1 FROM public.purchases
        WHERE user_id = v_user_id 
        AND prompt_id = p_id 
        AND status = 'confirmed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atualizar Políticas de RLS (Opcional - dependendo de quão restrito você quer ser no DB)
-- Por enquanto, usaremos a lógica da função no frontend para facilitar a UX, 
-- mas a função acima pode ser usada para proteger downloads reais de arquivos no futuro.

-- 4. Função para ativar assinatura (Será chamada via RPC no Checkout)
CREATE OR REPLACE FUNCTION public.activate_subscription(p_user_id UUID, p_preapproval_id TEXT, p_days INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET 
        subscription_status = 'active',
        subscription_expiry = NOW() + (p_days || ' days')::interval,
        mp_preapproval_id = p_preapproval_id
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
