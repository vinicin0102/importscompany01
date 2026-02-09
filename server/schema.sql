-- =============================================
-- IMPORTS COMPANY - SUPABASE SCHEMA (FINAL)
-- Execute este script no SQL Editor para criar as tabelas
-- =============================================

-- Remover tabelas antigas forçadamente
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Tabela de Categorias (ID é TEXTO para aceitar 'bags', 'mens-fashion')
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    link TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,  -- ou category_id INTEGER REFERENCES categories(id)
    price NUMERIC(10, 2) NOT NULL,
    "oldPrice" NUMERIC(10, 2),
    image TEXT,
    stock INTEGER DEFAULT 0,
    badge TEXT,
    rating NUMERIC(3, 1) DEFAULT 0,
    reviews INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Banners
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    image TEXT NOT NULL,
    title TEXT,
    link TEXT,
    "order" INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Configurações (apenas 1 registro)
CREATE TABLE settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    config JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Usuários (Auth Admin)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Hash BCrypt
    name TEXT,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir Configurações Padrão
INSERT INTO settings (id, config) VALUES (1, '{
    "storeName": "Imports Company",
    "whatsapp": "5511999999999",
    "themeColor": "#1a2744",
    "announcements": ["Frete Grátis para todo Brasil", "Parcelamento em até 12x sem juros"]
}') ON CONFLICT DO NOTHING;

-- Habilitar Row Level Security (RLS) - Opcional, mas recomendado
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

-- Políticas de Acesso Restrito (Escrita - Apenas Service Role / Admin Auth)
-- Por enquanto, vamos permitir acesso via API Key (Anon) se necessário, ou apenas Service Role
CREATE POLICY "Admin All Access Products" ON products USING (true) WITH CHECK (true);
CREATE POLICY "Admin All Access Categories" ON categories USING (true) WITH CHECK (true);
CREATE POLICY "Admin All Access Banners" ON banners USING (true) WITH CHECK (true);
CREATE POLICY "Admin All Access Settings" ON settings USING (true) WITH CHECK (true);
