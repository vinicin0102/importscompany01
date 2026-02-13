/**
 * IMPORTS COMPANY - Admin Server v5.0 (SUPABASE EDITION)
 * Backend completo com rotas de API para Admin Panel
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'imports-company-secret-key-2026';

// Supabase Client
// Forçamos o uso das chaves corretas ignorando variáveis de ambiente problemáticas
const supabaseUrl = 'https://ojoekqehkqhampsikuuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qb2VrcWVoa3FoYW1wc2lrdXVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDgyMTYwMSwiZXhwIjoyMDg2Mzk3NjAxfQ.oYxbsPRK6Yhu6O7YxQfol08YzCv-qY0oTsLpDXvxL7k';

const supabase = createClient(supabaseUrl, supabaseKey);

app.get('/api/sys-check', async (req, res) => {
    try {
        if (!supabase) throw new Error('Cliente Supabase não inicializado.');

        // Diagnóstico de Chave
        const keyParts = supabaseKey.split('.');
        const keyDetails = {
            length: supabaseKey.length,
            parts: keyParts.length,
            prefix: supabaseKey.substring(0, 10) + '...',
            suffix: '...' + supabaseKey.substring(supabaseKey.length - 10),
            isFormatValid: keyParts.length === 3
        };

        const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
        if (error) throw error;

        res.json({ ok: true, msg: 'Supabase Conectado com Sucesso!', count, keyDetails });
    } catch (err) {
        res.status(500).json({
            ok: false,
            error: err.message,
            keyDebug: {
                length: supabaseKey.length,
                parts: supabaseKey.split('.').length,
                prefix: supabaseKey.substring(0, 10) + '...'
            },
            hints: 'Se o erro for Invalid Compact JWS, a SERVICE_ROLE_KEY na Vercel está mal formatada.'
        });
    }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir arquivos estáticos (Frontend)
app.use(express.static(path.join(__dirname, '..')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

// Global Check for Supabase on API routes
app.use('/api', (req, res, next) => {
    // Se for rota de debug, permite passar
    if (req.path === '/debug') return next();

    if (!supabase) {
        return res.status(500).json({
            error: 'Erro de Configuração no Servidor (Supabase)',
            details: 'Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.'
        });
    }
    next();
});

// Multer Storage (Memória para upload direto ao Supabase)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB Limit
});

// Auth Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
};

// =============================================
// AUTH ROUTES
// =============================================

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Tentar buscar no Supabase (tabela 'users')
        let user = null;
        const { data: usersData, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (!error && usersData) {
            user = usersData;
        }

        // 2. Fallback: Admin Hardcoded (se banco falhar ou usuário não existir lá)
        if (!user && username === 'admin') {
            // Hash para 'admin123'
            const fallbackHash = '$2a$10$5ffw/5m6tQa7ViJNXa4CMOEvtxy/rqb170oW8z3fxPfs9p9nArn.a';
            user = {
                id: 1,
                username: 'admin',
                password: fallbackHash, // admin123
                name: 'Administrador Principal',
                role: 'admin'
            };
        }

        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: { id: user.id, username: user.username, name: user.name, role: user.role }
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Erro interno no login' });
    }
});

// =============================================
// UPLOAD ROUTE (SUPABASE STORAGE)
// =============================================

app.post('/api/upload', authMiddleware, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    try {
        const fileExt = path.extname(req.file.originalname);
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}${fileExt}`;
        const filePath = `${fileName}`; // Raiz do bucket

        const { data, error } = await supabase.storage
            .from('products image')
            .upload(filePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (error) throw error;

        // Gerar URL Pública
        const { data: { publicUrl } } = supabase.storage
            .from('products image')
            .getPublicUrl(filePath);

        res.json({
            filename: fileName,
            path: publicUrl
        });

    } catch (err) {
        console.error('Upload Error:', err);
        res.status(500).json({ error: 'Erro ao fazer upload da imagem: ' + err.message });
    }
});

// =============================================
// PRODUCTS ROUTES
// =============================================

app.get('/api/products', async (req, res) => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.get('/api/products/:id', async (req, res) => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', req.params.id)
        .single();

    if (error) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(data);
});

app.post('/api/products', authMiddleware, async (req, res) => {
    const { id, ...productData } = req.body; // Remove ID to let DB generate it if needed

    // Se quiser manter ID manual, mantenha o id. Mas geralmente é Serial.
    // O adapter antigo usava logica de array.length + 1. Aqui deixamos o banco decidir ou usamos a lógica se o client mandar.
    // Vamos remover o ID para segurança, a menos que seja explicitamente enviado e o banco aceite.

    const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});

app.put('/api/products/:id', authMiddleware, async (req, res) => {
    const { data, error } = await supabase
        .from('products')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Produto removido com sucesso' });
});

// =============================================
// CATEGORIES ROUTES
// =============================================

app.get('/api/categories', async (req, res) => {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order', { ascending: true }); // Ordenar por 'order' se existir

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/categories', authMiddleware, async (req, res) => {
    const { data, error } = await supabase
        .from('categories')
        .insert([req.body])
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});

app.put('/api/categories/:id', authMiddleware, async (req, res) => {
    const { data, error } = await supabase
        .from('categories')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Categoria removida' });
});

// =============================================
// BANNERS ROUTES
// =============================================

app.get('/api/banners', async (req, res) => {
    const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('order', { ascending: true }); // Ordenar

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/banners', authMiddleware, async (req, res) => {
    const { data, error } = await supabase
        .from('banners')
        .insert([req.body])
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json(data);
});

app.put('/api/banners/:id', authMiddleware, async (req, res) => {
    const { data, error } = await supabase
        .from('banners')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.delete('/api/banners/:id', authMiddleware, async (req, res) => {
    const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', req.params.id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Banner removido' });
});

// =============================================
// SETTINGS ROUTES
// =============================================

app.get('/api/settings', async (req, res) => {
    // Busca a configuração. Assumindo que temos uma tabela 'settings' com id=1 ou similar
    // Ou uma tabela com chave-valor. O adapter indicava 'settings' -> JSON.
    // Vamos tentar pegar a primeira linha.
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        // Se tabela vazia, retorna default
        return res.json({});
    }
    // Se settings for um campo JSONB, retorna ele.
    // O adapter retornava 'config'. Vamos assumir que 'data' é o objeto settings ou tem um campo 'config'.
    // Mas para simplificar, vamos retornar o que vier.
    res.json(data.config || data);
});

app.put('/api/settings', authMiddleware, async (req, res) => {
    // Upsert na tabela settings
    // Assume id=1
    const { data, error } = await supabase
        .from('settings')
        .upsert({ id: 1, config: req.body }) // Ajuste conforme esquema real
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(req.body);
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

        // Stock precisa somar. Supabase não tem SUM() fácil na API JS sem RPC.
        // Vamos buscar só a coluna stock de todos produtos (pode ser pesado se muitos produtos, mas ok p/ agora)
        const { data: stockData } = await supabase.from('products').select('stock');
        const totalStock = stockData ? stockData.reduce((sum, p) => sum + (p.stock || 0), 0) : 0;

        const { count: lowStock } = await supabase.from('products').select('*', { count: 'exact', head: true }).lt('stock', 5);

        // Recent products
        const { data: recentProducts } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false }) // Use created_at ou id
            .limit(5);

        res.json({
            totalProducts: totalProducts || 0,
            activeProducts: activeProducts || 0,
            totalCategories: totalCategories || 0,
            totalBanners: totalBanners || 0,
            totalStock,
            lowStockProducts: lowStock || 0,
            recentProducts: recentProducts || []
        });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// =============================================
// STRIPE CONNECT DEMO ROUTES
// =============================================
console.log('💳 Carregando rotas do Stripe em /api/connect...');
const stripeRoutes = require('./stripe-routes');
app.use('/api/connect', stripeRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Arquivo muito grande. Limite máximo de 50MB.' });
        }
        return res.status(400).json({ error: `Erro no upload: ${err.message}` });
    }
    if (err) {
        console.error('Erro desconhecido:', err);
        return res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
    }
    next();
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server v5.0 (Supabase) rodando em http://localhost:${PORT}`);
    });
}

module.exports = app;
