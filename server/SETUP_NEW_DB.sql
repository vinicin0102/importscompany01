-- ==============================================================================
-- SCRIPT DE MIGRAÇÃO COMPLETA - IMPORTS COMPANY (NOVO PROJETO)
-- ==============================================================================

-- 1. LIMPEZA
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS banners CASCADE;
-- DROP TABLE IF EXISTS settings CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- 2. CRIAR TABELAS

-- Tabela de Categorias (Usando ID como Slug conforme frontend)
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY, -- O frontend envia o slug aqui
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    active BOOLEAN DEFAULT TRUE,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT, -- armazenaremos o ID da categoria aqui
    price NUMERIC(10, 2) NOT NULL,
    "oldPrice" NUMERIC(10, 2),
    image TEXT,    -- url da imagem principal
    images TEXT[], -- array de urls de imagens
    badge TEXT,    -- 'hot', 'new', 'sale', etc.
    stock INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    rating NUMERIC(3, 1) DEFAULT 5.0,
    reviews INTEGER DEFAULT 0,
    variants JSONB DEFAULT '[]'::jsonb, -- Armazena array de {color, size, qty}
    yampi_token TEXT,                   -- Token exclusivo do produto na Yampi
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Banners
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title TEXT,
    subtitle TEXT,
    description TEXT,
    "buttonText" TEXT,
    "buttonLink" TEXT,
    image TEXT NOT NULL,
    image_mobile TEXT,
    link TEXT,
    "containMode" BOOLEAN DEFAULT FALSE,
    "position" TEXT, -- 'home_main', 'home_secondary'
    active BOOLEAN DEFAULT TRUE,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Configurações
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    config JSONB DEFAULT '{}'::jsonb, -- Armazena toda a config do site
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Usuários (Admin)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Hash bcrypt
    name TEXT,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INSERIR DADOS INICIAIS (SEED)

-- Usuário Admin (Senha: admin123)
INSERT INTO users (username, password, name, role)
VALUES ('admin', '$2a$10$5ffw/5m6tQa7ViJNXa4CMOEvtxy/rqb170oW8z3fxPfs9p9nArn.a', 'Administrador Principal', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Configurações Iniciais
INSERT INTO settings (id, config)
VALUES (1, '{
    "siteName": "Imports Company",
    "primaryColor": "#6c5ce7",
    "whatsapp": "5511999999999",
    "instagram": "@importscompany",
    "desktopLayout": 4,
    "mobileLayout": 2
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Categorias Iniciais
INSERT INTO categories (id, name, "order") VALUES
('times', 'Camisetas de Time', 1),
('tenis', 'Tênis Esportivos', 2),
('acessorios', 'Acessórios', 3),
('lancamentos', 'Lançamentos', 4)
ON CONFLICT (id) DO NOTHING;


-- 4. CONFIGURAR STORAGE (BUCKET DE IMAGENS)

-- Criar bucket 'products image' se não existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'products image', 
    'products image', 
    true, 
    5242880, -- 5MB limit
    ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 5242880;

-- 5. POLÍTICAS DE SEGURANÇA (RLS)

-- Habilitar RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Limpar e recriar políticas
DROP POLICY IF EXISTS "Public Read Products" ON products;
DROP POLICY IF EXISTS "Public Read Categories" ON categories;
DROP POLICY IF EXISTS "Public Read Banners" ON banners;
DROP POLICY IF EXISTS "Public Read Settings" ON settings;

DROP POLICY IF EXISTS "Admin Write Products" ON products;
DROP POLICY IF EXISTS "Admin Write Categories" ON categories;
DROP POLICY IF EXISTS "Admin Write Banners" ON banners;
DROP POLICY IF EXISTS "Admin Write Settings" ON settings;
DROP POLICY IF EXISTS "Admin Users Access" ON users;

CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Read Banners" ON banners FOR SELECT USING (true);
CREATE POLICY "Public Read Settings" ON settings FOR SELECT USING (true);

CREATE POLICY "Admin Write Products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write Categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write Banners" ON banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write Settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin Users Access" ON users FOR ALL USING (true) WITH CHECK (true);

-- Policies do Storage
DROP POLICY IF EXISTS "Public Access Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Manage Images" ON storage.objects;

CREATE POLICY "Public Access Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'products image' );

CREATE POLICY "Admin Manage Images"
ON storage.objects FOR ALL
USING ( bucket_id = 'products image' )
WITH CHECK ( bucket_id = 'products image' );