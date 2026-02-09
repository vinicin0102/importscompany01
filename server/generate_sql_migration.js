const fs = require('fs');
const path = require('path');

function escapeSQL(value) {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') return value;
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    // Escape single quotes by doubling them
    return `'${String(value).replace(/'/g, "''")}'`;
}

function generateSQL() {
    console.log('📝 Gerando script SQL completo...');
    let sql = `-- MIGRAÇÃO COMPLETA IMPORTS COMPANY --\n\n`;

    // 1. Ler JSONs
    const readJSON = (file) => {
        try {
            return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', file), 'utf8'));
        } catch { return []; }
    };

    const categories = readJSON('categories.json');
    const products = readJSON('products.json');
    const banners = readJSON('banners.json');
    const settings = readJSON('settings.json');

    // 2. Insert Categories
    if (categories.length > 0) {
        sql += `-- Categorias --\n`;
        categories.forEach(c => {
            // ID agora é TEXTO, precisa de escapeSQL
            sql += `INSERT INTO categories (id, name, icon, link, "order") VALUES (${escapeSQL(c.id)}, ${escapeSQL(c.name)}, ${escapeSQL(c.icon)}, ${escapeSQL(c.link)}, ${c.order || 0}) ON CONFLICT DO NOTHING;\n`;
        });
        sql += `\n`;
    }

    // 3. Insert Products
    if (products.length > 0) {
        sql += `-- Produtos --\n`;
        products.forEach(p => {
            sql += `INSERT INTO products (id, name, category, price, "oldPrice", image, stock, badge, rating, reviews, active) VALUES (${p.id}, ${escapeSQL(p.name)}, ${escapeSQL(p.category)}, ${p.price}, ${p.oldPrice || 'NULL'}, ${escapeSQL(p.image)}, ${p.stock || 0}, ${escapeSQL(p.badge)}, ${p.rating || 0}, ${p.reviews || 0}, ${p.active ? 'TRUE' : 'FALSE'}) ON CONFLICT DO NOTHING;\n`;
        });
        sql += `\n`;
    }

    // 4. Insert Banners
    if (banners.length > 0) {
        sql += `-- Banners --\n`;
        banners.forEach(b => {
            sql += `INSERT INTO banners (id, image, title, link, "order", active) VALUES (${b.id}, ${escapeSQL(b.image)}, ${escapeSQL(b.title)}, ${escapeSQL(b.link)}, ${b.order || 0}, TRUE) ON CONFLICT DO NOTHING;\n`;
        });
        sql += `\n`;
    }

    // 5. Insert Settings
    if (settings && Object.keys(settings).length > 0) {
        sql += `-- Settings --\n`;
        sql += `INSERT INTO settings (id, config) VALUES (1, '${JSON.stringify(settings).replace(/'/g, "''")}') ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config;\n`;
        sql += `\n`;
    }

    // 6. Fix Sequences (Importante!)
    sql += `-- Corrigir Sequências --\n`;
    sql += `SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));\n`;
    // Categorias agora usam TEXT ID, não tem sequência --> sql += `SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));\n`;
    sql += `SELECT setval('banners_id_seq', (SELECT MAX(id) FROM banners));\n`;
    sql += `SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));\n`;

    fs.writeFileSync(path.join(__dirname, 'migration_full.sql'), sql);
    console.log('✅ Arquivo server/migration_full.sql gerado com sucesso!');
}

generateSQL();
