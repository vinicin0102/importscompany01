-- =============================================
-- CORRIGIR PERMISSÕES DO SUPABASE STORAGE
-- Execute este script no SQL Editor do Supabase se o upload falhar
-- =============================================

-- 1. Garantir que a extensão "storage" está ativa (normalmente já vem ativa)
-- create extension if not exists "storage"; -- (comentado pois pode dar erro de permissão se não for superuser)

-- 2. Criar o bucket 'images' (Se não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'images', 
    'images', 
    true, 
    5242880, -- 5MB limit
    ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']::text[];

-- 3. Limpar políticas antigas para evitar duplicação/erro
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Service Role Full Access" ON storage.objects; -- (Opcional, Service Role já tem acesso)

-- 4. Criar políticas de acesso (RLS)

-- Permitir que QUALQUER UM veja as imagens (Público)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'images' );

-- Permitir Upload para usuários autenticados (Admin)
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'images' );

-- Permitir Atualizar/Deletar para usuários autenticados (Admin)
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'images' );

CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'images' );

-- 5. Configurar Storage para Pastas (Opcional mas bom)
-- O Supabase Storage funciona melhor se a pasta raiz existir logicamente, mas não é obrigatório.

-- FIM
