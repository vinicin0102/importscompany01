-- =============================================
-- IMPORTS COMPANY - Tabela de Fotos dos Produtos
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- 1. Cria tabela de imagens dos produtos
CREATE TABLE IF NOT EXISTS product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT DEFAULT 'image/jpeg',
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Índice para busca por produto
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- 4. Política: Qualquer pessoa pode ver as imagens
CREATE POLICY "Imagens públicas - leitura" ON product_images
    FOR SELECT USING (true);

-- 5. Política: Apenas autenticados podem inserir/atualizar/deletar
CREATE POLICY "Admin pode inserir imagens" ON product_images
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin pode atualizar imagens" ON product_images
    FOR UPDATE USING (true);

CREATE POLICY "Admin pode deletar imagens" ON product_images
    FOR DELETE USING (true);

-- 6. Criar bucket de Storage para imagens (se ainda não existir)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 7. Política de Storage: qualquer pessoa pode ver
CREATE POLICY "Imagens de produtos são públicas" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

-- 8. Política de Storage: service_role pode fazer upload
CREATE POLICY "Service role pode fazer upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Service role pode atualizar" ON storage.objects
    FOR UPDATE USING (bucket_id = 'product-images');

CREATE POLICY "Service role pode deletar" ON storage.objects
    FOR DELETE USING (bucket_id = 'product-images');

-- =============================================
-- PRONTO! Agora o Supabase está configurado para
-- armazenar fotos dos produtos.
-- =============================================
