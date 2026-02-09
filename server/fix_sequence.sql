-- Execute isso APÓS migrar os dados para corrigir os IDs automáticos
SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));
SELECT setval('banners_id_seq', (SELECT MAX(id) FROM banners));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
