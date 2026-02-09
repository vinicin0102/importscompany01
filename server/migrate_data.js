require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const readJSON = (file) => {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', file), 'utf8'));
    } catch { return []; }
};

async function migrate() {
    console.log('🔄 Iniciando migração para Supabase...');

    // 1. Migrar Categorias
    const categories = readJSON('categories.json');
    if (categories.length > 0) {
        console.log(`📦 Migrando ${categories.length} categorias...`);
        const { error } = await supabase.from('categories').upsert(categories.map(c => ({
            id: parseInt(c.id),
            name: c.name,
            icon: c.icon,
            link: c.link,
            order: c.order || 0
        })), { onConflict: 'id' });

        if (error) console.error('❌ Erro Categorias:', error.message);
        else console.log('✅ Categorias migradas!');
    }

    // 2. Migrar Produtos
    const products = readJSON('products.json');
    if (products.length > 0) {
        console.log(`📦 Migrando ${products.length} produtos...`);
        // Ajustar campos para bater com o schema (camelCase para snake_case se necessário, mas usei aspas no schema)
        const { error } = await supabase.from('products').upsert(products.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category, // TEXT
            price: p.price,
            "oldPrice": p.oldPrice,
            image: p.image,
            stock: p.stock,
            badge: p.badge,
            rating: p.rating,
            reviews: p.reviews,
            active: p.active
        })), { onConflict: 'id' });

        if (error) console.error('❌ Erro Produtos:', error.message);
        else console.log('✅ Produtos migrados!');
    }

    // 3. Migrar Banners
    const banners = readJSON('banners.json');
    if (banners.length > 0) {
        console.log(`📦 Migrando ${banners.length} banners...`);
        const { error } = await supabase.from('banners').upsert(banners, { onConflict: 'id' });
        if (error) console.error('❌ Erro Banners:', error.message);
        else console.log('✅ Banners migrados!');
    }

    // 4. Migrar Configurações
    const settings = readJSON('settings.json');
    if (settings) {
        console.log('⚙️ Migrando configurações...');
        // settings.json geralmente é um objeto único, não array
        const { error } = await supabase.from('settings').upsert({
            id: 1,
            config: settings
        }, { onConflict: 'id' });

        if (error) console.error('❌ Erro Settings:', error.message);
        else console.log('✅ Configurações migradas!');
    }

    console.log('🏁 Migração concluída!');
}

migrate();
