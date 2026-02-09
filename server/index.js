/**
 * IMPORTS COMPANY - Admin Server (Supabase Edition)
 * Backend API for the Admin Panel using Supabase Database
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'imports-company-secret-key-2026';

// Supabase Client (Service Role para acesso total ao banco)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..'))); // Serve the main site
app.use('/images', express.static(path.join(__dirname, '..', 'images'))); // Serve images explicitly
app.use('/admin', express.static(path.join(__dirname, '..', 'admin'))); // Serve admin panel

// File upload config (Vercel compatible for TEMP storage)
// Nota: Em produção, idealmente usar Supabase Storage
const uploadDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'images');
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}_${file.originalname.replace(/\s/g, '_')}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

// Auth Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

// =============================================
// AUTH ROUTES (Custom Table 'users')
// =============================================

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Buscar usuário no Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        // Fallback Admin se tabela vazia ou erro
        if (!user && username === 'admin') {
            const fallbackHash = '$2a$10$5ffw/5m6tQa7ViJNXa4CMOEvtxy/rqb170oW8z3fxPfs9p9nArn.a'; // admin123
            if (await bcrypt.compare(password, fallbackHash)) {
                const token = jwt.sign({ id: 1, username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
                return res.json({ token, user: { id: 1, username: 'admin', name: 'Administrador Principal', role: 'admin' } });
            }
        }

        if (!user || error) return res.status(401).json({ error: 'Usuário não encontrado' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Senha incorreta' });

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Erro interno no login' });
    }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
    if (req.user.username === 'admin') {
        return res.json({ id: 1, username: 'admin', name: 'Administrador Principal', role: 'admin' });
    }
    const { data: user } = await supabase.from('users').select('id, username, name, role').eq('id', req.user.id).single();
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
});

// =============================================
// PRODUCTS ROUTES
// =============================================

app.get('/api/products', async (req, res) => {
    const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.get('/api/products/:id', async (req, res) => {
    const { data, error } = await supabase.from('products').select('*').eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(data);
});

app.post('/api/products', authMiddleware, async (req, res) => {
    const { data, error } = await supabase.from('products').insert([req.body]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
});

app.put('/api/products/:id', authMiddleware, async (req, res) => {
    const { data, error } = await supabase
        .from('products')
        .update({ ...req.body, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Produto removido com sucesso' });
});

// =============================================
// CATEGORIES ROUTES
// =============================================

app.get('/api/categories', async (req, res) => {
    const { data, error } = await supabase.from('categories').select('*').order('order', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/categories', authMiddleware, async (req, res) => {
    const { data, error } = await supabase.from('categories').insert([req.body]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
});

app.put('/api/categories/:id', authMiddleware, async (req, res) => {
    const { data, error } = await supabase.from('categories').update(req.body).eq('id', req.params.id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
    const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Categoria removida' });
});

// =============================================
// BANNERS ROUTES
// =============================================

app.get('/api/banners', async (req, res) => {
    const { data, error } = await supabase.from('banners').select('*').order('order', { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/banners', authMiddleware, async (req, res) => {
    const { data, error } = await supabase.from('banners').insert([req.body]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json(data[0]);
});

app.put('/api/banners/:id', authMiddleware, async (req, res) => {
    const { data, error } = await supabase.from('banners').update(req.body).eq('id', req.params.id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

app.delete('/api/banners/:id', authMiddleware, async (req, res) => {
    const { error } = await supabase.from('banners').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Banner removido' });
});

// =============================================
// SETTINGS ROUTES
// =============================================

app.get('/api/settings', async (req, res) => {
    const { data, error } = await supabase.from('settings').select('config').eq('id', 1).single();
    if (error) return res.json({}); // Default empty object on error
    res.json(data.config);
});

app.put('/api/settings', authMiddleware, async (req, res) => {
    // Upsert id=1
    const { data, error } = await supabase
        .from('settings')
        .upsert({ id: 1, config: req.body, updated_at: new Date().toISOString() })
        .select();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0].config);
});

// =============================================
// UPLOAD ROUTES (Temp Local / Vercel compatible)
// =============================================

app.post('/api/upload', authMiddleware, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    res.json({ filename: req.file.filename, path: `images/${req.file.filename}` });
});

// =============================================
// DASHBOARD STATS
// =============================================

app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
    try {
        const { count: totalProducts } = await supabase.from('products').select('*', { count: 'exact', head: true });
        const { count: activeProducts } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true);
        const { count: totalCategories } = await supabase.from('categories').select('*', { count: 'exact', head: true });
        const { count: totalBanners } = await supabase.from('banners').select('*', { count: 'exact', head: true });

        // Sum stock (precisa query completa ou RPC) - Vamos fazer simples: busca só coluna stock
        const { data: products } = await supabase.from('products').select('stock, id, name, price, image').order('created_at', { ascending: false }).limit(5);

        const totalStock = products ? products.reduce((sum, p) => sum + (p.stock || 0), 0) : 0;
        const lowStock = products ? products.filter(p => p.stock < 5).length : 0;

        res.json({
            totalProducts: totalProducts || 0,
            activeProducts: activeProducts || 0,
            totalCategories: totalCategories || 0,
            totalBanners: totalBanners || 0,
            totalStock,
            lowStockProducts: lowStock,
            recentProducts: products || []
        });

    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ error: 'Erro ao carregar estatísticas' });
    }
});

// Export for Vercel
module.exports = app;

// Start Server locally
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
