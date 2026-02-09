/**
 * IMPORTS COMPANY - Admin Server (Hybrid: Supabase + Local JSON Fallback)
 * Garante que o painel funcione mesmo se o banco de dados falhar.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'imports-company-secret-key-2026';

// Supabase Init (Try/Catch wrapper not needed for init, but client usage)
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        console.log('✅ Supabase Client configurado.');

        // Criar bucket de imagens automaticamente (se não existir)
        (async () => {
            try {
                const { data: buckets } = await supabase.storage.listBuckets();
                const imagesBucket = buckets?.find(b => b.name === 'images');

                if (!imagesBucket) {
                    const { error } = await supabase.storage.createBucket('images', {
                        public: true,
                        fileSizeLimit: 5242880 // 5MB
                    });
                    if (!error) console.log('📁 Bucket "images" criado com sucesso!');
                    else console.log('⚠️ Bucket já existe ou erro:', error.message);
                } else {
                    console.log('📁 Bucket "images" já existe.');
                }
            } catch (e) {
                console.log('⚠️ Não foi possível verificar/criar bucket:', e.message);
            }
        })();

    } catch (e) {
        console.error('⚠️ Erro ao configurar Supabase:', e.message);
    }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));

// File Storage (Local/Temp)
const uploadDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'images');
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}_${file.originalname.replace(/\s/g, '_')}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

// =============================================
// DATA HANDLERS (HYBRID STRATEGY)
// =============================================

function readJSON(filename) {
    try {
        return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', filename), 'utf8'));
    } catch (e) { return []; }
}

function writeJSON(filename, data) {
    try {
        fs.writeFileSync(path.join(__dirname, 'data', filename), JSON.stringify(data, null, 2));
        return true;
    } catch (e) { return false; }
}

// Helper genérico para buscar dados (Supabase -> Fallback JSON)
async function getData(table, jsonFile, orderBy = 'id') {
    if (supabase) {
        try {
            const { data, error } = await supabase.from(table).select('*').order(orderBy, { ascending: true });
            if (!error && data) return data;
            console.warn(`⚠️ Erro Supabase [${table}]:`, error.message);
        } catch (e) {
            console.warn(`⚠️ Falha conexão Supabase [${table}]:`, e.message);
        }
    }
    console.log(`📂 Usando dados locais para ${table}`);
    return readJSON(jsonFile);
}

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
// AUTH ROUTES
// =============================================

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    let user = null;

    // Tentar Supabase
    if (supabase) {
        const { data } = await supabase.from('users').select('*').eq('username', username).single();
        user = data;
    }

    // Fallback Admin
    if (!user && username === 'admin') {
        // Hash hardcoded para 'admin123'
        const adminHash = '$2a$10$5ffw/5m6tQa7ViJNXa4CMOEvtxy/rqb170oW8z3fxPfs9p9nArn.a';
        if (await bcrypt.compare(password, adminHash)) {
            user = { id: 1, username: 'admin', role: 'admin', name: 'Admin Local' };
        }
    }

    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    // Verifica senha (se veio do banco)
    if (user.password) {
        if (!(await bcrypt.compare(password, user.password))) return res.status(401).json({ error: 'Senha incorreta' });
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
    res.json(req.user);
});

// =============================================
// PRODUCTS ROUTES
// =============================================

app.get('/api/products', async (req, res) => {
    const products = await getData('products', 'products.json');
    res.json(products);
});

app.post('/api/products', authMiddleware, async (req, res) => {
    const newProduct = req.body;

    // Tentar Supabase
    if (supabase) {
        const { data, error } = await supabase.from('products').insert([newProduct]).select();
        if (!error && data) return res.status(201).json(data[0]);
    }

    // Fallback JSON
    const products = readJSON('products.json');
    newProduct.id = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
    newProduct.created_at = new Date();
    products.push(newProduct);
    writeJSON('products.json', products);
    res.status(201).json(newProduct);
});

app.put('/api/products/:id', authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);
    const updates = req.body;

    // Tentar Supabase
    if (supabase) {
        const { data, error } = await supabase.from('products').update(updates).eq('id', id).select();
        if (!error && data) return res.json(data[0]);
    }

    // Fallback JSON
    const products = readJSON('products.json');
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
        products[index] = { ...products[index], ...updates };
        writeJSON('products.json', products);
        res.json(products[index]);
    } else {
        res.status(404).json({ error: 'Produto não encontrado' });
    }
});

app.delete('/api/products/:id', authMiddleware, async (req, res) => {
    const id = parseInt(req.params.id);

    // Tentar Supabase
    if (supabase) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) return res.json({ message: 'Deletado com sucesso' });
    }

    // Fallback JSON
    const products = readJSON('products.json');
    const filtered = products.filter(p => p.id !== id);
    writeJSON('products.json', filtered);
    res.json({ message: 'Produto removido (Local)' });
});

// =============================================
// CATEGORIES ROUTES
// =============================================

app.get('/api/categories', async (req, res) => {
    const data = await getData('categories', 'categories.json', 'order');
    res.json(data);
});

app.post('/api/categories', authMiddleware, async (req, res) => {
    // Tentar Supabase
    if (supabase) {
        const { data, error } = await supabase.from('categories').insert([req.body]).select();
        if (!error) return res.status(201).json(data[0]);
    }
    // Fallback
    const list = readJSON('categories.json');
    // Se ID não vier, cria timestamp string
    if (!req.body.id) req.body.id = `cat_${Date.now()}`;
    list.push(req.body);
    writeJSON('categories.json', list);
    res.status(201).json(req.body);
});

app.delete('/api/categories/:id', authMiddleware, async (req, res) => {
    if (supabase) await supabase.from('categories').delete().eq('id', req.params.id);

    const list = readJSON('categories.json');
    const filtered = list.filter(c => String(c.id) !== String(req.params.id));
    writeJSON('categories.json', filtered);
    res.json({ message: 'Categoria removida' });
});

// =============================================
// BANNERS ROUTES
// =============================================

app.get('/api/banners', async (req, res) => {
    const data = await getData('banners', 'banners.json', 'order');
    res.json(data);
});

app.post('/api/banners', authMiddleware, async (req, res) => {
    if (supabase) {
        const { data, error } = await supabase.from('banners').insert([req.body]).select();
        if (!error) return res.status(201).json(data[0]);
    }
    const list = readJSON('banners.json');
    req.body.id = Date.now();
    list.push(req.body);
    writeJSON('banners.json', list);
    res.status(201).json(req.body);
});

app.delete('/api/banners/:id', authMiddleware, async (req, res) => {
    if (supabase) await supabase.from('banners').delete().eq('id', req.params.id);
    const list = readJSON('banners.json');
    const filtered = list.filter(b => b.id != req.params.id);
    writeJSON('banners.json', filtered);
    res.json({ message: 'Banner removido' });
});

// =============================================
// SETTINGS ROUTES
// =============================================

app.get('/api/settings', async (req, res) => {
    if (supabase) {
        const { data } = await supabase.from('settings').select('config').eq('id', 1).single();
        if (data) return res.json(data.config);
    }
    res.json(readJSON('settings.json'));
});

app.put('/api/settings', authMiddleware, async (req, res) => {
    if (supabase) {
        await supabase.from('settings').upsert({ id: 1, config: req.body });
    }
    writeJSON('settings.json', req.body);
    res.json(req.body);
});

// =============================================
// UPLOAD ROUTE
// =============================================

// =============================================
// UPLOAD ROUTE (Supabase Storage Integrado)
// =============================================

app.post('/api/upload', authMiddleware, upload.single('image'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Nenhuma imagem enviada' });

    try {
        // Se Supabase estiver ativo, fazer upload para o Bucket 'images'
        if (supabase) {
            const fileExt = req.file.originalname.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = req.file.path;
            const fileBuffer = fs.readFileSync(filePath);

            console.log(`📤 Enviando para Supabase Storage: ${fileName}`);

            const { data, error } = await supabase.storage
                .from('images')
                .upload(fileName, fileBuffer, {
                    contentType: req.file.mimetype,
                    upsert: false
                });

            // Limpar arquivo temporário
            try { fs.unlinkSync(filePath); } catch (e) { }

            if (error) {
                console.error('❌ Erro Supabase Storage:', error);
                throw error;
            }

            // Obter URL Pública
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(fileName);

            console.log(`✅ Upload sucesso: ${publicUrl}`);
            return res.json({ filename: fileName, path: publicUrl });
        }

        // Fallback Local (apenas desenvolvimento)
        res.json({ filename: req.file.filename, path: `images/${req.file.filename}` });

    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Falha ao salvar imagem no servidor' });
    }
});

// =============================================
// DEBUG ROUTE (Diagnóstico)
// =============================================

app.get('/api/debug', (req, res) => {
    res.json({
        status: 'OK',
        supabaseConfigured: !!supabase,
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasJwtSecret: !!process.env.JWT_SECRET,
        isVercel: !!process.env.VERCEL,
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
    });
});

// Export & Start
module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running (Hybrid Mode) on http://localhost:${PORT}`);
    });
}
