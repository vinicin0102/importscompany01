-- =============================================
-- IMPORTS COMPANY - SUPABASE SCHEMA (UPDATED v2)
-- Execute este script no SQL Editor para criar as tabelas com suporte a ARRAY/JSON
-- =============================================

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    link TEXT,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    price NUMERIC(10, 2) NOT NULL,
    "oldPrice" NUMERIC(10, 2),
    image TEXT,              -- Imagem principal (URL)
    images JSONB DEFAULT '[]', -- Array de URLs das imagens adicionais
    variants JSONB DEFAULT '[]', -- JSON com variantes: [{ color, size, qty }]
    stock INTEGER DEFAULT 0,
    badge TEXT,
    rating NUMERIC(3, 1) DEFAULT 5.0,
    reviews INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Banners
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    image TEXT NOT NULL,
    title TEXT,
    link TEXT,
    "order" INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Configurações
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    config JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Usuários (Auth Admin)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Público (Leitura)
CREATE POLICY "Public Read Access Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public Read Access Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Read Access Banners" ON banners FOR SELECT USING (true);
CREATE POLICY "Public Read Access Settings" ON settings FOR SELECT USING (true);

-- Políticas de Acesso Service Role (Escrita - O Backend usa Service Role, bypass RLS)
-- Mas para upload direto do client ou admin user, podemos permitir:
CREATE POLICY "Allow All for Authenticated" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All for Authenticated Categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All for Authenticated Banners" ON banners FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow All for Authenticated Settings" ON settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Storage: Criar bucket 'images' e políticas
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true) ON CONFLICT DO NOTHING;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Policies STORAGE
-- DROP POLICY IF EXISTS "Public Access" ON storage.objects;
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'images' );
-- CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'images' );
