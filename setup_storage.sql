-- ==========================================================
-- CONFIGURAÇÃO DO STORAGE PARA FÁBRICA DE PROMPTS
-- Copie e cole este código no SQL Editor do seu Supabase
-- ==========================================================

-- 1. CRIAR O BUCKET DE PROMPTS (E GARANTIR QUE É PÚBLICO)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('prompts', 'prompts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. LIMPAR POLÍTICAS ANTIGAS (EVITA ERRO 42710)
DROP POLICY IF EXISTS "Imagens de prompts são públicas" ON storage.objects;
DROP POLICY IF EXISTS "Admins podem gerenciar imagens" ON storage.objects;

-- 3. CRIAR NOVAS POLÍTICAS DE ACESSO (RLS) PARA O STORAGE

-- Permitir que qualquer pessoa veja as imagens (Público)
CREATE POLICY "Imagens de prompts são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'prompts');

-- Permitir que apenas Admins façam upload/delete
CREATE POLICY "Admins podem gerenciar imagens"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'prompts' AND 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
