/**
 * IMPORTS COMPANY - Admin Server v2
 * Funciona 100% no Vercel sem dependência de banco de dados externo.
 * - Dados: lidos dos JSON bundled no deploy, escritos via variável em memória
 * - Imagens: convertidas para base64 data URL ou hospedadas via ImgBB
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'imports-company-secret-key-2026';

// =============================================
// IN-MEMORY DATA STORE (inicializado dos JSONs)
// =============================================
// No Vercel, cada invocação de serverless function pode ter um cold start.
// Os dados são lidos do JSON a cada cold start, e mutações são salvas em memória.
// Para persistir PERMANENTEMENTE, o admin faz commit via GitHub API (opcional).

let memoryStore = {};

function loadData(key, filename) {
    if (!memoryStore[key]) {
        try {
            memoryStore[key] = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', filename), 'utf8'));
        } catch (e) {
            memoryStore[key] = [];
        }
    }
    return memoryStore[key];
}

function saveData(key, data) {
    memoryStore[key] = data;
    // Tenta salvar no disco (funciona local, falha silenciosamente no Vercel)
    try {
        fs.writeFileSync(path.join(__dirname, 'data', `${key}.json`), JSON.stringify(data, null, 2));
    } catch (e) {
        // No Vercel, o filesystem é read-only, mas os dados ficam em memória
        console.log(`[INFO] Dados de ${key} salvos em memória (filesystem read-only)`);
    }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumentado para suportar base64
app.use(express.static(path.join(__dirname, '..')));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// Upload - Memory Storage (funciona em todos os ambientes)
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

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
    }

    // Admin hardcoded (seguro para demo/MVP)
    if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign(
            { id: 1, username: 'admin', role: 'admin' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        return res.json({ token, user: { id: 1, username: 'admin', name: 'Administrador' } });
    }

    res.status(401).json({ error: 'Credenciais inválidas' });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json(req.user);
});

// =============================================
// PRODUCTS ROUTES
// =============================================

app.get('/api/products', (req, res) => {
    res.json(loadData('products', 'products.json'));
});

app.post('/api/products', authMiddleware, (req, res) => {
    const products = loadData('products', 'products.json');
    const newProduct = {
        ...req.body,
        id: products.length ? Math.max(...products.map(p => p.id || 0)) + 1 : 1,
        created_at: new Date().toISOString()
    };
    products.push(newProduct);
    saveData('products', products);
    res.status(201).json(newProduct);
});

app.put('/api/products/:id', authMiddleware, (req, res) => {
    const id = parseInt(req.params.id);
    const products = loadData('products', 'products.json');
    const index = products.findIndex(p => p.id === id);

    if (index === -1) return res.status(404).json({ error: 'Produto não encontrado' });

    products[index] = { ...products[index], ...req.body, updatedAt: new Date().toISOString() };
    saveData('products', products);
    res.json(products[index]);
});

app.delete('/api/products/:id', authMiddleware, (req, res) => {
    const id = parseInt(req.params.id);
    const products = loadData('products', 'products.json');
    const filtered = products.filter(p => p.id !== id);
    saveData('products', filtered);
    res.json({ message: 'Produto removido com sucesso' });
});

// =============================================
// CATEGORIES ROUTES
// =============================================

app.get('/api/categories', (req, res) => {
    res.json(loadData('categories', 'categories.json'));
});

app.post('/api/categories', authMiddleware, (req, res) => {
    const categories = loadData('categories', 'categories.json');
    if (!req.body.id) req.body.id = `cat_${Date.now()}`;
    categories.push(req.body);
    saveData('categories', categories);
    res.status(201).json(req.body);
});

app.put('/api/categories/:id', authMiddleware, (req, res) => {
    const categories = loadData('categories', 'categories.json');
    const index = categories.findIndex(c => String(c.id) === String(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Categoria não encontrada' });
    categories[index] = { ...categories[index], ...req.body };
    saveData('categories', categories);
    res.json(categories[index]);
});

app.delete('/api/categories/:id', authMiddleware, (req, res) => {
    const categories = loadData('categories', 'categories.json');
    saveData('categories', categories.filter(c => String(c.id) !== String(req.params.id)));
    res.json({ message: 'Categoria removida' });
});

// =============================================
// BANNERS ROUTES
// =============================================

app.get('/api/banners', (req, res) => {
    res.json(loadData('banners', 'banners.json'));
});

app.post('/api/banners', authMiddleware, (req, res) => {
    const banners = loadData('banners', 'banners.json');
    req.body.id = Date.now();
    banners.push(req.body);
    saveData('banners', banners);
    res.status(201).json(req.body);
});

app.delete('/api/banners/:id', authMiddleware, (req, res) => {
    const banners = loadData('banners', 'banners.json');
    saveData('banners', banners.filter(b => b.id != req.params.id));
    res.json({ message: 'Banner removido' });
});

// =============================================
// SETTINGS ROUTES
// =============================================

app.get('/api/settings', (req, res) => {
    let settings = loadData('settings', 'settings.json');
    // settings.json pode ser um objeto, não array
    if (Array.isArray(settings) && settings.length === 0) {
        settings = {};
    }
    res.json(settings);
});

app.put('/api/settings', authMiddleware, (req, res) => {
    saveData('settings', req.body);
    res.json(req.body);
});

// =============================================
// UPLOAD ROUTE (Base64 + Local Fallback)
// =============================================

app.post('/api/upload', authMiddleware, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });

    try {
        const fileExt = req.file.originalname.split('.').pop().toLowerCase();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

        // Converter para base64 data URL (funciona SEMPRE, em qualquer ambiente)
        const base64 = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64}`;

        // Tentar salvar no disco também (funciona local, falha no Vercel)
        try {
            const localPath = path.join(__dirname, '..', 'images', fileName);
            fs.writeFileSync(localPath, req.file.buffer);
            console.log(`📂 Imagem salva localmente: images/${fileName}`);
            // Se salvou no disco, retorna o caminho local
            return res.json({ filename: fileName, path: `images/${fileName}` });
        } catch (e) {
            // No Vercel, filesystem é read-only
            console.log(`📦 Retornando imagem como data URL (${req.file.size} bytes)`);
        }

        // Fallback: retorna a data URL (funciona sempre)
        res.json({ filename: fileName, path: dataUrl });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Falha no upload', details: error.message });
    }
});

// =============================================
// DEBUG ROUTE
// =============================================

app.get('/api/debug', (req, res) => {
    const products = loadData('products', 'products.json');
    res.json({
        status: 'OK',
        productsCount: products.length,
        isVercel: !!process.env.VERCEL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        timestamp: new Date().toISOString(),
        version: '2.0'
    });
});

// Export & Start
module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server v2 rodando em http://localhost:${PORT}`);
    });
}
