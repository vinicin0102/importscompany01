/**
 * IMPORTS COMPANY - Admin Server v4.0 (SUPABASE EDITION)
 * PERSISTÊNCIA REAL via Supabase Database & Storage
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'imports-company-secret-key-2026';

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role for backend operations

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRO CRÍTICO: Supabase URL ou Key não definidos no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..')));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// Upload - Memory Storage (buffer for Supabase upload)
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Auth Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
};

// =============================================
// AUTH ROUTES
// =============================================
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    // Simple admin check (can be expanded to DB users table)
    if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign(
            { id: 1, username: 'admin', role: 'admin' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        return res.json({ token, user: { id: 1, username: 'admin' } });
    }
    res.status(401).json({ error: 'Credenciais inválidas' });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json(req.user);
});

// =============================================
// PRODUCTS ROUTES (Supabase)
// =============================================
// =============================================
// PRODUCTS ROUTES (Supabase with product_images table + Backup JSONB)
// =============================================
app.get('/api/products', async (req, res) => {
    try {
        // 1. Tenta query relacional
        const relationalQuery = await supabase
            .from('products')
            .select(`
                *,
                product_images (
                    image_url
                )
            `)
            .order('created_at', { ascending: false });

        let products = relationalQuery.data;
        let error = relationalQuery.error;

        // 2. Fallback: Se der erro (ex: tabela nao existe), tenta query simples
        if (error) {
            console.warn('⚠️ Erro na busca relacional. Usando fallback simples.', error.message);
            const simpleQuery = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (simpleQuery.error) throw simpleQuery.error;
            products = simpleQuery.data;
            error = null;
        }

        // Transform data: Prioritize product_images table, fallback to images JSONB column
        const formatted = products.map(p => {
            let finalImages = [];

            // 1. Try relational table
            if (p.product_images && p.product_images.length > 0) {
                finalImages = p.product_images.map(img => img.image_url);
            }
            // 2. Fallback to JSONB column (Backup)
            else if (p.images && Array.isArray(p.images) && p.images.length > 0) {
                finalImages = p.images;
            }
            // 3. Last resort: Main image only
            else if (p.image) {
                finalImages = [p.image];
            }

            return {
                ...p,
                images: finalImages
            };
        });

        res.json(formatted);

    } catch (err) {
        console.error('Erro ao buscar produtos:', err);
        res.status(500).json({ error: 'Erro interno', details: err.message });
    }
});


app.post('/api/products', authMiddleware, async (req, res) => {
    const { name, price, oldPrice, description, category, image, images, variants, stock, badge, active } = req.body;

    // 1. Insert Product (Saving images to JSONB too as backup)
    const { data: product, error } = await supabase
        .from('products')
        .insert([{
            name,
            price,
            "oldPrice": oldPrice,
            description,
            category,
            image,      // Main image URL (cache)
            images,     // BACKUP: Save to JSONB column too
            variants,   // JSON of variants
            stock,
            badge,
            active,
            rating: 5,
            reviews: 0
        }])
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });

    // 2. Insert Images (if any) to relational table
    if (images && images.length > 0) {
        try {
            const imagesToInsert = images.map(url => ({
                product_id: product.id,
                image_url: url,
                is_main: url === image
            }));

            const { error: imgError } = await supabase
                .from('product_images')
                .insert(imagesToInsert);

            if (imgError) console.error('⚠️ Aviso: Falha ao salvar em product_images (verifique se a tabela existe). O backup em JSONB foi salvo.', imgError.message);
        } catch (e) {
            console.error('⚠️ Erro ao tentar salvar em product_images:', e);
        }
    }

    res.status(201).json(product);
});

app.put('/api/products/:id', authMiddleware, async (req, res) => {
    const id = req.params.id;
    const { name, price, oldPrice, description, category, image, images, variants, stock, badge, active } = req.body;

    // 1. Update Product (Saving images to JSONB too as backup)
    const { data: product, error } = await supabase
        .from('products')
        .update({
            name,
            price,
            "oldPrice": oldPrice,
            description,
            category,
            image,
            images,    // BACKUP: Update JSONB column
            variants,
            stock,
            badge,
            active,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });

    // 2. Update Images (Delete all and re-insert for simplicity)
    if (images) {
        try {
            // Delete old
            const { error: delError } = await supabase.from('product_images').delete().eq('product_id', id);

            // Insert new (only if delete didn't fail hard, though we ignore explicit errors to rely on backup)
            if (!delError && images.length > 0) {
                const imagesToInsert = images.map(url => ({
                    product_id: id,
                    image_url: url,
                    is_main: url === image
                }));
                await supabase.from('product_images').insert(imagesToInsert);
            }
        } catch (e) {
            console.warn('⚠️ Falha ao atualizar tabela product_images (usando backup JSONB)', e);
        }
    }

    res.json(product);
});

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', req.params.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Produto removido' });
});

// =============================================
// CATEGORIES ROUTES (Supabase)
// =============================================
app.get('/api/categories', async (req, res) => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/categories', authMiddleware, async (req, res) => {
    const { id, name, icon, link } = req.body;
    // Ensure ID is unique string if not provided
    const catId = id || `cat_${Date.now()}`;

    const { data, error } = await supabase
        .from('categories')
        .insert([{ id: catId, name, icon, link }])
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});

// =============================================
// BANNERS ROUTES (Supabase)
// =============================================
app.get('/api/banners', async (req, res) => {
    const { data, error } = await supabase.from('banners').select('*').order('order');
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/banners', authMiddleware, async (req, res) => {
    const { image, title, link, active } = req.body;
    const { data, error } = await supabase
        .from('banners')
        .insert([{ image, title, link, active }])
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});

app.delete('/api/banners/:id', authMiddleware, async (req, res) => {
    const { error } = await supabase.from('banners').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Banner removido' });
});

// =============================================
// SETTINGS ROUTES (Supabase)
// =============================================
app.get('/api/settings', async (req, res) => {
    const { data, error } = await supabase
        .from('settings')
        .select('config')
        .eq('id', 1)
        .single();

    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
    res.json(data?.config || {});
});

app.put('/api/settings', authMiddleware, async (req, res) => {
    const config = req.body;
    // Upsert logic for ID=1
    const { data, error } = await supabase
        .from('settings')
        .upsert({ id: 1, config })
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(config);
});

// =============================================
// UPLOAD ROUTE (Supabase Storage)
// =============================================
app.post('/api/upload', authMiddleware, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });

    try {
        const fileExt = req.file.originalname.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { data, error } = await supabase
            .storage
            .from('images')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (error) throw error;

        // Get Public URL
        const { data: publicUrlData } = supabase
            .storage
            .from('images')
            .getPublicUrl(filePath);

        res.json({
            filename: fileName,
            path: publicUrlData.publicUrl
        });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Falha no upload', details: error.message });
    }
});

// =============================================
// DEBUG ROUTES
// =============================================
app.get('/api/debug', async (req, res) => {
    res.json({
        status: 'OK',
        mode: 'SUPABASE_ONLY',
        timestamp: new Date().toISOString()
    });
});

module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server v4.0 (Supabase) rodando em http://localhost:${PORT}`);
    });
}
