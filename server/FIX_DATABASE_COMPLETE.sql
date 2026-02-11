-- =========================================================
-- SCRIPT DE CORREÇÃO TOTAL DO BANCO DE DADOS (IMPÓRTS)
-- EXECUTE ESTE SCRIPT COMPLETO NO SUPABASE SQL EDITOR
-- =========================================================

-- 1. LIMPEZA (Apaga tabelas antigas para evitar conflitos)
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- STORAGE (Upload de Imagens)
-- Tenta criar o bucket 'images' (se a extensão storage estiver ativa)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public) 
  VALUES ('images', 'images', true)
  ON CONFLICT (id) DO NOTHING;
  
  -- Remove policies antigas para recriar (Evita erro de policy duplicada)
  DROP POLICY IF EXISTS "Public Access" ON storage.objects;
  DROP POLICY IF EXISTS "Public Insert" ON storage.objects;
  
  -- Cria policy para leitura pública (ESSENCIAL PARA AS IMAGENS APARECEREM NO SITE)
  CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'images' );
  
  -- Cria policy para upload (autenticado ou anonimo dependendo da necessidade, aqui deixamos publico para testar, ou restrito)
  -- Para simplificar e garantir que funcione:
  CREATE POLICY "Public Insert" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'images' );
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 2. CRIAÇÃO DAS TABELAS (Schema correto)

-- Categorias (ID como TEXTO)
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    link TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Produtos
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    price NUMERIC(10, 2) NOT NULL,
    "oldPrice" NUMERIC(10, 2),
    image TEXT, -- Imagem principal (cache/atalho)
    stock INTEGER DEFAULT 0,
    badge TEXT,
    rating NUMERIC(3, 1) DEFAULT 0,
    reviews INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    description TEXT,
    variants JSONB DEFAULT '[]', -- Variants ainda em JSON pois é estrutura complexa
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela Separada de Imagens (Solicitado pelo usuário)
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_main BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Banners
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    image TEXT NOT NULL,
    title TEXT,
    link TEXT,
    "order" INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações
CREATE TABLE settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    config JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usuários
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policies (Segurança Básica)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Access Products" ON products FOR SELECT USING (true);
CREATE POLICY "Public Read Access Product Images" ON product_images FOR SELECT USING (true);
CREATE POLICY "Public Read Access Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public Read Access Banners" ON banners FOR SELECT USING (true);
CREATE POLICY "Public Read Access Settings" ON settings FOR SELECT USING (true);

-- Permissão total para service role (API)
-- O backend usa service role, que bupassa RLS, mas se usar cliente anon:
CREATE POLICY "Admin All Access Products" ON products USING (true) WITH CHECK (true);
CREATE POLICY "Admin All Access Product Images" ON product_images USING (true) WITH CHECK (true);
CREATE POLICY "Admin All Access Categories" ON categories USING (true) WITH CHECK (true);
CREATE POLICY "Admin All Access Banners" ON banners USING (true) WITH CHECK (true);
CREATE POLICY "Admin All Access Settings" ON settings USING (true) WITH CHECK (true);
CREATE POLICY "Admin All Access Users" ON users USING (true) WITH CHECK (true);


-- 3. INSERÇÃO DOS DADOS (Migration)

-- Categorias
INSERT INTO categories (id, name, icon, link, "order") VALUES ('bags', 'Bolsas', 'fa-bag-shopping', NULL, 1) ON CONFLICT DO NOTHING;
INSERT INTO categories (id, name, icon, link, "order") VALUES ('sneakers', 'Tênis', 'fa-shoe-prints', NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO categories (id, name, icon, link, "order") VALUES ('womens-fashion', 'Moda Feminina', 'fa-person-dress', NULL, 3) ON CONFLICT DO NOTHING;
INSERT INTO categories (id, name, icon, link, "order") VALUES ('mens-fashion', 'Moda Masculina', 'fa-shirt', NULL, 4) ON CONFLICT DO NOTHING;
INSERT INTO categories (id, name, icon, link, "order") VALUES ('wallets', 'Carteiras', 'fa-wallet', NULL, 5) ON CONFLICT DO NOTHING;
INSERT INTO categories (id, name, icon, link, "order") VALUES ('watches', 'Relógios', 'fa-clock', NULL, 6) ON CONFLICT DO NOTHING;
INSERT INTO categories (id, name, icon, link, "order") VALUES ('bodysplash', 'Body Splash', 'fa-spray-can-sparkles', NULL, 7) ON CONFLICT DO NOTHING;
INSERT INTO categories (id, name, icon, link, "order") VALUES ('vitamins', 'Vitaminas', 'fa-pills', NULL, 8) ON CONFLICT DO NOTHING;

-- Produtos Exemplo
INSERT INTO products (id, name, category, price, "oldPrice", image, stock, badge, rating, reviews, active) VALUES (1, 'Camisa Tommy Hilfiger Listrada', 'mens-fashion', 389.9, 499.9, 'images/banner_raw_2.jpg', 15, 'hot', 5, 42, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO products (id, name, category, price, "oldPrice", image, stock, badge, rating, reviews, active) VALUES (2, 'Malha Tommy Hilfiger Cinza', 'mens-fashion', 549.9, 699.9, 'images/banner_raw_1.jpg', 8, 'new', 4.5, 28, TRUE) ON CONFLICT DO NOTHING;

-- Banners
INSERT INTO banners (id, image, title, link, "order", active) VALUES (1, 'images/hero_banner_full.png', 'Estilo Que Define', NULL, 1, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO banners (id, image, title, link, "order", active) VALUES (2, 'images/banner_female.jpg', 'Elegância & Atitude', NULL, 2, TRUE) ON CONFLICT DO NOTHING;

-- Settings
INSERT INTO settings (id, config) VALUES (1, '{"siteName":"Imports Company","logo":"images/logo.jpg","whatsapp":"+55 31 9971-6606","email":"contato@importscompany.com.br"}') ON CONFLICT (id) DO NOTHING;

-- 4. AJUSTE DE SEQUÊNCIAS
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('product_images_id_seq', (SELECT MAX(id) FROM product_images));
SELECT setval('banners_id_seq', (SELECT MAX(id) FROM banners));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
