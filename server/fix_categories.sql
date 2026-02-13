-- =============================================
-- FIX CATEGORIES: REWRITE DEFAULT CATEGORIES
-- =============================================

-- 1. Limpar tabela de Categorias atual
DELETE FROM categories;

-- 2. Inserir novas categorias pré-definidas
INSERT INTO categories (id, name, icon, "order", active, description) VALUES
('infantil', 'Infantil', 'fa-baby', 1, TRUE, 'Moda para os pequenos'),
('acessorios', 'Acessórios', 'fa-ring', 2, TRUE, 'Detalhes que importam'),
('bodysplash-e-hidratantes', 'Body Splash e Hidratantes', 'fa-spray-can-sparkles', 3, TRUE, 'Fragrâncias e cuidados'),
('vitaminas', 'Vitaminas', 'fa-pills', 4, TRUE, 'Saúde e bem-estar'),
('bolsas', 'Bolsas', 'fa-bag-shopping', 5, TRUE, 'Estilo e elegância'),
('tenis', 'Tênis', 'fa-shoe-prints', 6, TRUE, 'Conforto para os pés'),
('oculos', 'Óculos', 'fa-glasses', 7, TRUE, 'Visão com estilo'),
('cosmeticos', 'Cosméticos', 'fa-wand-magic-sparkles', 8, TRUE, 'Beleza realçada'),
('moda-masculina', 'Moda Masculina', 'fa-shirt', 9, TRUE, 'Elegância Moderna'),
('moda-feminina', 'Moda Feminina', 'fa-person-dress', 10, TRUE, 'Tendências Globais');
