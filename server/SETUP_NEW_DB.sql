-- ==============================================================================
-- SCRIPT DE MIGRAÇÃO COMPLETA - IMPORTS COMPANY (NOVO PROJETO)
-- ==============================================================================
--
-- INSTRUÇÕES:
-- 1. Acesse o Supabase: https://supabase.com/dashboard/project/ojoekqehkqhampsikuuk
-- 2. Vá em "SQL Editor" (ícone de terminal na esquerda)
-- 3. Clique em "New Query"
-- 4. Cole TODO este conteúdo e clique em "Run"
--
-- ==============================================================================

-- 1. LIMPEZA (Se quiser recomeçar do zero, descomente as linhas abaixo)
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS banners CASCADE;
-- DROP TABLE IF EXISTS settings CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- 2. CRIAR TABELAS

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT, -- armazenaremos o ID ou Slug da categoria aqui
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
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Banners
CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title TEXT,
    subtitle TEXT,
    image TEXT NOT NULL,
    link TEXT,
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
INSERT INTO categories (name, slug, "order") VALUES
('Camisetas de Time', 'times', 1),
('Tênis Esportivos', 'tenis', 2),
('Acessórios', 'acessorios', 3),
('Lançamentos', 'lancamentos', 4)
ON CONFLICT DO NOTHING;

-- Produto Exemplo
INSERT INTO products (name, category, price, "oldPrice", image, stock, badge, active)
VALUES 
('Camisa Brasil 2026', 'times', 299.90, 399.90, 'https://placehold.co/600x600/green/yellow?text=Brasil', 100, 'hot', true)
ON CONFLICT DO NOTHING;


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

-- 5. POLÍTICAS DE SEGURANÇA (RLS) - Permitir tudo para facilitar (ou autenticado para escrita)

-- Habilitar RLS nas tabelas (boa prática, mesmo que liberemos tudo por enquanto)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política: Leitura Pública (Qualquer um pode ver produtos)
CREATE POLICY "Public Read Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public Read Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Read Banners" ON banners FOR SELECT USING (true);
CREATE POLICY "Public Read Settings" ON settings FOR SELECT USING (true);

-- Política: Escrita Apenas Admin (Authenticated ou Service Role)
-- Nota: O backend usa a Chave Service Role, que ignora RLS. 
-- Mas se usarmos cliente autenticado, precisamos dessas policies.
CREATE POLICY "Admin Write Products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write Categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write Banners" ON banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write Settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin Users Access" ON users FOR ALL USING (true) WITH CHECK (true);

-- Policies do Storage (Imagens)
DROP POLICY IF EXISTS "Public Access Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Manage Images" ON storage.objects;

-- Leitura Pública de Imagens
CREATE POLICY "Public Access Images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'products image' );

-- Upload/Update/Delete (Permitir tudo para Service Role/Authenticated)
CREATE POLICY "Admin Manage Images"
ON storage.objects FOR ALL
USING ( bucket_id = 'products image' )
WITH CHECK ( bucket_id = 'products image' );

-- FIM
