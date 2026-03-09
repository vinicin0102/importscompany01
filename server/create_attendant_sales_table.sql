-- Script para criar a tabela de controle de vendas de atendentes

CREATE TABLE IF NOT EXISTS attendant_sales (
    id SERIAL PRIMARY KEY,
    product_name TEXT NOT NULL,
    product_photo TEXT,
    payment_method TEXT NOT NULL,
    sale_value NUMERIC(10, 2) NOT NULL,
    attendant_name TEXT NOT NULL,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE attendant_sales ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
DROP POLICY IF EXISTS "Allow All for Authenticated Attendant Sales" ON attendant_sales;
CREATE POLICY "Allow All for Authenticated Attendant Sales" ON attendant_sales FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Para garantir que o backend acesse se precisar sem auth (Service Role bypass)
DROP POLICY IF EXISTS "Public Read Access Attendant Sales" ON attendant_sales;
CREATE POLICY "Public Read Access Attendant Sales" ON attendant_sales FOR SELECT USING (true);
