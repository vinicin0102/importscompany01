/**
 * IMPORTS COMPANY - Admin Server v3
 * PERSISTÊNCIA REAL via GitHub API
 * - Dados: JSON files commitados no repo via GitHub API
 * - Imagens: upload via ImgBB (hospedagem externa gratuita)
 * - Fallback: memória (se GitHub não configurado)
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'imports-company-secret-key-2026';

// GitHub config para persistência
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const GITHUB_REPO = process.env.GITHUB_REPO || 'vinicin0102/Importscompany';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

// ImgBB config para upload de imagens
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '';

// =============================================
// IN-MEMORY DATA STORE
// =============================================
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
    // Salvar local (dev)
    try {
        fs.writeFileSync(path.join(__dirname, 'data', `${key}.json`), JSON.stringify(data, null, 2));
    } catch (e) { }
    // Persistir no GitHub (produção)
    persistToGitHub(key, data).catch(err => {
        console.log(`[GITHUB] Erro ao persistir ${key}: ${err.message}`);
    });
}

// =============================================
// GITHUB API - PERSISTÊNCIA
// =============================================
async function githubRequest(endpoint, method = 'GET', body = null) {
    if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN não configurado');

    return new Promise((resolve, reject) => {
        const url = new URL(`https://api.github.com${endpoint}`);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method,
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'ImportsCompany-Admin',
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 400) {
                        reject(new Error(`GitHub API ${res.statusCode}: ${parsed.message || data}`));
                    } else {
                        resolve(parsed);
                    }
                } catch (e) {
                    resolve(data);
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function persistToGitHub(key, data) {
    if (!GITHUB_TOKEN) return;

    const filePath = `server/data/${key}.json`;
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

    // Buscar SHA atual do arquivo
    let sha = null;
    try {
        const file = await githubRequest(`/repos/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`);
        sha = file.sha;
    } catch (e) { }

    // Commit o arquivo
    const body = {
        message: `[admin] atualizar ${key}`,
        content,
        branch: GITHUB_BRANCH
    };
    if (sha) body.sha = sha;

    await githubRequest(`/repos/${GITHUB_REPO}/contents/${filePath}`, 'PUT', body);
    console.log(`[GITHUB] ✅ ${key}.json persistido com sucesso`);
}

// =============================================
// IMGBB - UPLOAD DE IMAGENS
// =============================================
async function uploadToImgBB(buffer, filename) {
    if (!IMGBB_API_KEY) return null;

    return new Promise((resolve, reject) => {
        const base64Image = buffer.toString('base64');
        const postData = `key=${IMGBB_API_KEY}&image=${encodeURIComponent(base64Image)}&name=${encodeURIComponent(filename)}`;

        const options = {
            hostname: 'api.imgbb.com',
            path: '/1/upload',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.success) {
                        resolve(parsed.data.display_url || parsed.data.url);
                    } else {
                        reject(new Error('ImgBB upload failed'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..')));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// Upload - Memory Storage
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
    saveData('products', products.filter(p => p.id !== id));
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
    if (Array.isArray(settings) && settings.length === 0) settings = {};
    res.json(settings);
});

app.put('/api/settings', authMiddleware, (req, res) => {
    saveData('settings', req.body);
    res.json(req.body);
});

// =============================================
// UPLOAD ROUTE (ImgBB + Base64 Fallback)
// =============================================
app.post('/api/upload', authMiddleware, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });

    try {
        const fileExt = req.file.originalname.split('.').pop().toLowerCase();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

        // 1. Tentar ImgBB (hospedagem permanente e gratuita)
        if (IMGBB_API_KEY) {
            try {
                const imgUrl = await uploadToImgBB(req.file.buffer, fileName);
                if (imgUrl) {
                    console.log(`🖼️ Imagem hospedada no ImgBB: ${imgUrl}`);
                    return res.json({ filename: fileName, path: imgUrl });
                }
            } catch (e) {
                console.log(`[IMGBB] Falha: ${e.message}, usando fallback...`);
            }
        }

        // 2. Tentar salvar local (dev)
        try {
            const localPath = path.join(__dirname, '..', 'images', fileName);
            fs.writeFileSync(localPath, req.file.buffer);
            console.log(`📂 Imagem salva localmente: images/${fileName}`);
            return res.json({ filename: fileName, path: `images/${fileName}` });
        } catch (e) { }

        // 3. Fallback: base64 data URL
        const base64 = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
        console.log(`📦 Imagem como data URL (${req.file.size} bytes)`);
        res.json({ filename: fileName, path: dataUrl });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Falha no upload', details: error.message });
    }
});

// =============================================
// DEBUG ROUTES
// =============================================
app.get('/api/debug', (req, res) => {
    const products = loadData('products', 'products.json');
    res.json({
        status: 'OK',
        version: '3.1',
        productsCount: products.length,
        isVercel: !!process.env.VERCEL,
        hasGitHubToken: !!GITHUB_TOKEN,
        hasImgBBKey: !!IMGBB_API_KEY,
        hasJwtSecret: !!process.env.JWT_SECRET,
        githubRepo: GITHUB_REPO,
        timestamp: new Date().toISOString()
    });
});

// Testar GitHub token
app.get('/api/debug/github', async (req, res) => {
    if (!GITHUB_TOKEN) return res.json({ error: 'GITHUB_TOKEN não configurado' });
    try {
        const user = await githubRequest('/user');
        const file = await githubRequest(`/repos/${GITHUB_REPO}/contents/server/data/products.json?ref=${GITHUB_BRANCH}`);
        res.json({
            status: 'OK',
            githubUser: user.login,
            repo: GITHUB_REPO,
            fileSha: file.sha,
            tokenWorking: true
        });
    } catch (err) {
        res.json({ status: 'ERROR', error: err.message, tokenWorking: false });
    }
});

// Testar persistência (forçar um commit)
app.get('/api/debug/test-persist', authMiddleware, async (req, res) => {
    try {
        const products = loadData('products', 'products.json');
        await persistToGitHub('products', products);
        res.json({ status: 'OK', message: 'Dados persistidos com sucesso no GitHub!' });
    } catch (err) {
        res.json({ status: 'ERROR', error: err.message });
    }
});

// Export & Start
module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server v3 rodando em http://localhost:${PORT}`);
        console.log(`   GitHub Persist: ${GITHUB_TOKEN ? '✅' : '❌ (configure GITHUB_TOKEN)'}`);
        console.log(`   ImgBB Upload: ${IMGBB_API_KEY ? '✅' : '❌ (configure IMGBB_API_KEY)'}`);
    });
}
