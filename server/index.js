/**
 * IMPORTS COMPANY - Admin Server v3.2
 * PERSISTÊNCIA REAL via GitHub API + ImgBB
 * - Dados: JSON files commitados no repo via GitHub API
 * - Imagens: upload via ImgBB (hospedagem externa gratuita)
 * - Leitura: Prioriza GitHub API para evitar dados obsoletos entre deploys
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
// GITHUB API - AUXILIARES
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

async function persistToGitHub(filename, data) {
    if (!GITHUB_TOKEN) return;

    const filePath = `server/data/${filename}`;
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

    // Buscar SHA atual do arquivo
    let sha = null;
    try {
        const file = await githubRequest(`/repos/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`);
        sha = file.sha;
    } catch (e) { }

    // Commit o arquivo
    const body = {
        message: `[admin] atualizar ${filename}`,
        content,
        branch: GITHUB_BRANCH
    };
    if (sha) body.sha = sha;

    await githubRequest(`/repos/${GITHUB_REPO}/contents/${filePath}`, 'PUT', body);
    console.log(`[GITHUB] ✅ ${filename} persistido com sucesso`);
}

// =============================================
// DATA MANAGER (Cache Memória + Sync GitHub)
// =============================================
let memoryStore = {};

function readFromDisk(filename) {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', filename), 'utf8'));
    } catch (e) {
        return [];
    }
}

// ⚠️ CORE: Garante dados frescos mesmo se o Vercel estiver com deploy antigo rodando
async function getFreshData(key, filename) {
    // 1. Memória quente (instância ativa)
    if (memoryStore[key]) return memoryStore[key];

    // 2. Tentar GitHub (fonte da verdade)
    if (GITHUB_TOKEN) {
        try {
            console.log(`[SYNC] Buscando ${filename} do GitHub...`);
            const file = await githubRequest(`/repos/${GITHUB_REPO}/contents/server/data/${filename}?ref=${GITHUB_BRANCH}`);
            const content = Buffer.from(file.content, 'base64').toString('utf8');
            const data = JSON.parse(content);
            memoryStore[key] = data;
            console.log(`[SYNC] ✅ ${filename} carregado do GitHub`);
            return data;
        } catch (e) {
            console.log(`[SYNC] ⚠️ Falha GitHub (${e.message}). Usando disco...`);
        }
    }

    // 3. Disco local (pode estar desatualizado no serverless)
    const localData = readFromDisk(filename);
    memoryStore[key] = localData;
    return localData;
}

// Salvar (Memória -> GitHub Background -> Disco)
async function saveData(key, data, filename) {
    memoryStore[key] = data;

    // Salvar local
    try {
        fs.writeFileSync(path.join(__dirname, 'data', filename), JSON.stringify(data, null, 2));
    } catch (e) { }

    // Persistir GitHub (não bloquear request)
    persistToGitHub(filename, data).catch(err => {
        console.error(`[GITHUB] Erro persistência: ${err.message}`);
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
// PRODUCTS ROUTES (ASYNC)
// =============================================
app.get('/api/products', async (req, res) => {
    const data = await getFreshData('products', 'products.json');
    res.json(data);
});

app.post('/api/products', authMiddleware, async (req, res) => {
    const products = await getFreshData('products', 'products.json');
    const newProduct = {
        ...req.body,
        id: products.length ? Math.max(...products.map(p => p.id || 0)) + 1 : 1,
        created_at: new Date().toISOString()
    };
    products.push(newProduct);
    await saveData('products', products, 'products.json');
    res.status(201).json(newProduct);
});

app.put('/api/products/:id', authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const products = await getFreshData('products', 'products.json');
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Produto não encontrado' });
    products[index] = { ...products[index], ...req.body, updatedAt: new Date().toISOString() };
    await saveData('products', products, 'products.json');
    res.json(products[index]);
});

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const products = await getFreshData('products', 'products.json');
    const filtered = products.filter(p => p.id !== id);
    await saveData('products', filtered, 'products.json');
    res.json({ message: 'Produto removido' });
});

// =============================================
// CATEGORIES ROUTES (ASYNC)
// =============================================
app.get('/api/categories', async (req, res) => {
    const data = await getFreshData('categories', 'categories.json');
    res.json(data);
});

app.post('/api/categories', authMiddleware, async (req, res) => {
    const categories = await getFreshData('categories', 'categories.json');
    if (!req.body.id) req.body.id = `cat_${Date.now()}`;
    categories.push(req.body);
    await saveData('categories', categories, 'categories.json');
    res.status(201).json(req.body);
});

app.put('/api/categories/:id', authMiddleware, async (req, res) => {
    const categories = await getFreshData('categories', 'categories.json');
    const index = categories.findIndex(c => String(c.id) === String(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Categoria não encontrada' });
    categories[index] = { ...categories[index], ...req.body };
    await saveData('categories', categories, 'categories.json');
    res.json(categories[index]);
});

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
    const categories = await getFreshData('categories', 'categories.json');
    const filtered = categories.filter(c => String(c.id) !== String(req.params.id));
    await saveData('categories', filtered, 'categories.json');
    res.json({ message: 'Categoria removida' });
});

// =============================================
// BANNERS ROUTES (ASYNC)
// =============================================
app.get('/api/banners', async (req, res) => {
    const data = await getFreshData('banners', 'banners.json');
    res.json(data);
});

app.post('/api/banners', authMiddleware, async (req, res) => {
    const banners = await getFreshData('banners', 'banners.json');
    req.body.id = Date.now();
    banners.push(req.body);
    await saveData('banners', banners, 'banners.json');
    res.status(201).json(req.body);
});

app.delete('/api/banners/:id', authMiddleware, async (req, res) => {
    const banners = await getFreshData('banners', 'banners.json');
    const filtered = banners.filter(b => b.id != req.params.id);
    await saveData('banners', filtered, 'banners.json');
    res.json({ message: 'Banner removido' });
});

// =============================================
// SETTINGS ROUTES (ASYNC)
// =============================================
app.get('/api/settings', async (req, res) => {
    let settings = await getFreshData('settings', 'settings.json');
    if (Array.isArray(settings) && settings.length === 0) settings = {};
    res.json(settings);
});

app.put('/api/settings', authMiddleware, async (req, res) => {
    await saveData('settings', req.body, 'settings.json');
    res.json(req.body);
});

// =============================================
// UPLOAD ROUTE (ImgBB + Base64 Fallback)
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
                    if (parsed.success) resolve(parsed.data.display_url || parsed.data.url);
                    else reject(new Error('ImgBB Error'));
                } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

app.post('/api/upload', authMiddleware, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });

    try {
        const fileExt = req.file.originalname.split('.').pop().toLowerCase();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

        // 1. Tentar ImgBB
        if (IMGBB_API_KEY) {
            try {
                const imgUrl = await uploadToImgBB(req.file.buffer, fileName);
                if (imgUrl) return res.json({ filename: fileName, path: imgUrl });
            } catch (e) {
                console.log(`[IMGBB] Falha: ${e.message}, usando fallback...`);
            }
        }

        // 2. Fallback Base64
        const base64 = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64}`;
        res.json({ filename: fileName, path: dataUrl });

    } catch (error) {
        res.status(500).json({ error: 'Falha no upload', details: error.message });
    }
});

// =============================================
// DEBUG ROUTES
// =============================================
app.get('/api/debug', async (req, res) => {
    const products = await getFreshData('products', 'products.json');
    res.json({
        status: 'OK',
        version: '3.2 (GitHub Priority)',
        productsCount: products.length,
        isVercel: !!process.env.VERCEL,
        hasGitHubToken: !!GITHUB_TOKEN,
        hasImgBBKey: !!IMGBB_API_KEY,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/debug/github', async (req, res) => {
    if (!GITHUB_TOKEN) return res.json({ error: 'GITHUB_TOKEN não configurado' });
    try {
        const user = await githubRequest('/user');
        res.json({ status: 'OK', githubUser: user.login, tokenWorking: true });
    } catch (err) {
        res.json({ status: 'ERROR', error: err.message, tokenWorking: false });
    }
});

// Export & Start
module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server v3.2 rodando em http://localhost:${PORT}`);
    });
}
