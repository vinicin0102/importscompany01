-- MIGRAÇÃO COMPLETA IMPORTS COMPANY --

-- Categorias --
INSERT INTO categories (id, name, icon, link, "order") VALUES ('bags', 'Bolsas', 'fa-bag-shopping', NULL, 1) ON CONFLICT DO NOTHING;
INSERT INTO categories (id, name, icon, link, "order") VALUES ('sneakers', 'Tênis', 'fa-shoe-prints', NULL, 2) ON CONFLICT DO NOTHING;
INSERT INTO categories (id, name, icon, link, "order") VALUES ('womens-fashion', 'Moda Feminina', 'fa-person-dress', NULL, 3) ON CONFLICT DO NOTHING;
INSERT INTO categories (id, name, icon, link, "order") VALUES ('mens-fashion', 'Moda Masculina', 'fa-shirt', NULL, 4) ON CONFLICT DO NOTHING;
INSERT INTO categories (id, name, icon, link, "order") VALUES ('wallets', 'Carteiras', 'fa-wallet', NULL, 5) ON CONFLICT DO NOTHING;
INSERT INTO categories (id, name, icon, link, "order") VALUES ('watches', 'Relógios', 'fa-clock', NULL, 6) ON CONFLICT DO NOTHING;
INSERT INTO categories (id, name, icon, link, "order") VALUES ('bodysplash', 'Body Splash', 'fa-spray-can-sparkles', NULL, 7) ON CONFLICT DO NOTHING;
INSERT INTO categories (id, name, icon, link, "order") VALUES ('vitamins', 'Vitaminas', 'fa-pills', NULL, 8) ON CONFLICT DO NOTHING;

-- Produtos --
INSERT INTO products (id, name, category, price, "oldPrice", image, stock, badge, rating, reviews, active) VALUES (1, 'Camisa Tommy Hilfiger Listrada', 'mens-fashion', 389.9, 499.9, 'images/banner_raw_2.jpg', 15, 'hot', 5, 42, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO products (id, name, category, price, "oldPrice", image, stock, badge, rating, reviews, active) VALUES (2, 'Malha Tommy Hilfiger Cinza', 'mens-fashion', 549.9, 699.9, 'images/banner_raw_1.jpg', 8, 'new', 4.5, 28, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO products (id, name, category, price, "oldPrice", image, stock, badge, rating, reviews, active) VALUES (3, 'T-Shirt Tommy Hilfiger Signature', 'womens-fashion', 289.9, 349.9, 'images/banner_female.jpg', 22, 'discount', 5, 156, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO products (id, name, category, price, "oldPrice", image, stock, badge, rating, reviews, active) VALUES (4, 'Polo Ralph Lauren Iconic', 'mens-fashion', 449.9, 599.9, 'images/1770589606276_camisa_1.png', 10, 'exclusive', 5, 0, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO products (id, name, category, price, "oldPrice", image, stock, badge, rating, reviews, active) VALUES (5, 'Bolsa Michael Kors Couro Black', 'bags', 1499, 1899, 'images/banner_bag_black.jpg', 5, 'hot', 5, 34, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO products (id, name, category, price, "oldPrice", image, stock, badge, rating, reviews, active) VALUES (6, 'Bolsa Michael Kors Crossbody', 'bags', 1299, 1599, 'images/banner_bag_brown.jpg', 7, 'new', 4.5, 12, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO products (id, name, category, price, "oldPrice", image, stock, badge, rating, reviews, active) VALUES (7, 'Camisa Floral Primavera', 'womens-fashion', 299, 389, 'images/banner_raw_4.jpg', 18, 'exclusive', 5, 67, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO products (id, name, category, price, "oldPrice", image, stock, badge, rating, reviews, active) VALUES (8, 'Camisa Social Ralph Lauren', 'womens-fashion', 399, 499, 'images/camisa_ralph_lauren.jpeg', 12, 'hot', 4.5, 98, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO products (id, name, category, price, "oldPrice", image, stock, badge, rating, reviews, active) VALUES (9, 'Camiseta Armani Exchange A|X', 'mens-fashion', 349.9, 449.9, 'images/placeholder.png', 20, 'new', 5, 0, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO products (id, name, category, price, "oldPrice", image, stock, badge, rating, reviews, active) VALUES (10, 'Camiseta FIFA World Cup', 'mens-fashion', 299.9, 399.9, 'images/placeholder.png', 15, 'hot', 5, 0, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO products (id, name, category, price, "oldPrice", image, stock, badge, rating, reviews, active) VALUES (11, 'Camiseta Nike Air', 'mens-fashion', 279.9, 349.9, 'images/placeholder.png', 25, 'new', 5, 0, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO products (id, name, category, price, "oldPrice", image, stock, badge, rating, reviews, active) VALUES (12, 'Camiseta Tommy Hilfiger Navy', 'mens-fashion', 329.9, 429.9, 'images/camiseta_tommy_navy.jpg', 18, 'exclusive', 5, 0, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO products (id, name, category, price, "oldPrice", image, stock, badge, rating, reviews, active) VALUES (13, 'Camiseta Tommy Hilfiger Blue', 'mens-fashion', 329.9, 429.9, 'images/placeholder.png', 18, 'exclusive', 5, 0, TRUE) ON CONFLICT DO NOTHING;

-- Banners --
INSERT INTO banners (id, image, title, link, "order", active) VALUES (1, 'images/hero_banner_full.png', 'Estilo Que Define', NULL, 1, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO banners (id, image, title, link, "order", active) VALUES (2, 'images/banner_female.jpg', 'Elegância & Atitude', NULL, 2, TRUE) ON CONFLICT DO NOTHING;
INSERT INTO banners (id, image, title, link, "order", active) VALUES (3, 'images/1770595783647_WhatsApp_Image_2026-02-05_at_15.30.35_(1).jpeg', 'Detalhes Preciosos', NULL, 3, TRUE) ON CONFLICT DO NOTHING;

-- Settings --
INSERT INTO settings (id, config) VALUES (1, '{"siteName":"Imports Company","logo":"images/logo.jpg","whatsapp":"+55 31 9971-6606","email":"contato@importscompany.com.br","freeShippingThreshold":999,"colors":{"primaryNavy":"#0a1628","primaryNavyLight":"#1a2744","gold":"#c9a84c","goldLight":"#d4b86a"},"socialLinks":{"instagram":"https://instagram.com/importscompany","facebook":"","tiktok":""},"announcements":{"freeShipping":"FRETE GRÁTIS para compras acima de R$ 999","authentic":"Produtos 100% Originais","payment":"Parcelamos em até 12x"},"footer":{"about":"Sua loja de importados de luxo. Produtos autênticos das melhores marcas do mundo, entregues em todo Brasil.","address":"Belo Horizonte, MG - Brasil"}}') ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config;

-- Corrigir Sequências --
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('banners_id_seq', (SELECT MAX(id) FROM banners));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
