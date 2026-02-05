/**
 * IMPORTS COMPANY - Admin Server
 * Backend API for the Admin Panel
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'imports-company-secret-key-2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..'))); // Serve the main site
app.use('/admin', express.static(path.join(__dirname, '..', 'admin'))); // Serve admin panel

// File upload config - Vercel compatible (using /tmp for temporary storage if in lambda)
const uploadDir = process.env.VERCEL ? '/tmp' : path.join(__dirname, '..', 'images');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}_${file.originalname.replace(/\s/g, '_')}`;
        cb(null, uniqueName);
    }
});
const upload = multer({ storage });

// Helper functions with read-only fallback
const readData = (filename) => {
    try {
        const filepath = path.join(__dirname, 'data', filename);
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch (error) {
        console.warn(`File read warning (${filename}):`, error.message);
        return [];
    }
};

const writeData = (filename, data) => {
    try {
        const filepath = path.join(__dirname, 'data', filename);
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error writing data (Vercel read-only?):', error);
    }
};

// Auth Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }
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
    try {
        const { username, password } = req.body;

        // Tenta ler do arquivo
        let user = null;
        try {
            const users = readData('users.json');
            user = users.find(u => u.username === username);
        } catch (e) { console.error(e); }

        // FALLBACK: Se não achar no arquivo, usa hardcoded Admin
        // Isso impede que problemas no file system bloqueiem o login
        if (!user && username === 'admin') {
            const fallbackHash = '$2a$10$5ffw/5m6tQa7ViJNXa4CMOEvtxy/rqb170oW8z3fxPfs9p9nArn.a'; // admin123
            user = {
                id: 1,
                username: 'admin',
                password: fallbackHash,
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
        console.error('Login critical error:', err);
        res.status(500).json({ error: 'Erro interno no login' });
    }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
    // Fallback simple check
    if (req.user.username === 'admin') {
        return res.json({ id: 1, username: 'admin', name: 'Administrador Principal', role: 'admin' });
    }

    const users = readData('users.json');
    const user = users.find(u => u.id === req.user.id);
    if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ id: user.id, username: user.username, name: user.name, role: user.role });
});

// =============================================
// PRODUCTS ROUTES
// =============================================

app.get('/api/products', (req, res) => {
    const products = readData('products.json');
    res.json(products);
});

app.get('/api/products/:id', (req, res) => {
    const products = readData('products.json');
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' });
    res.json(product);
});

app.post('/api/products', authMiddleware, (req, res) => {
    const products = readData('products.json');
    const newProduct = {
        id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
        ...req.body,
        createdAt: new Date().toISOString()
    };
    products.push(newProduct);
    writeData('products.json', products);
    res.status(201).json(newProduct);
});

app.put('/api/products/:id', authMiddleware, (req, res) => {
    const products = readData('products.json');
    const index = products.findIndex(p => p.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Produto não encontrado' });
    products[index] = { ...products[index], ...req.body, updatedAt: new Date().toISOString() };
    writeData('products.json', products);
    res.json(products[index]);
});

app.delete('/api/products/:id', authMiddleware, (req, res) => {
    let products = readData('products.json');
    products = products.filter(p => p.id !== parseInt(req.params.id));
    writeData('products.json', products);
    res.json({ message: 'Produto removido com sucesso' });
});

// =============================================
// CATEGORIES ROUTES
// =============================================

app.get('/api/categories', (req, res) => {
    const categories = readData('categories.json');
    res.json(categories);
});

app.post('/api/categories', authMiddleware, (req, res) => {
    const categories = readData('categories.json');
    const newCategory = { ...req.body, order: categories.length + 1 };
    categories.push(newCategory);
    writeData('categories.json', categories);
    res.status(201).json(newCategory);
});

app.put('/api/categories/:id', authMiddleware, (req, res) => {
    const categories = readData('categories.json');
    const index = categories.findIndex(c => c.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Categoria não encontrada' });
    categories[index] = { ...categories[index], ...req.body };
    writeData('categories.json', categories);
    res.json(categories[index]);
});

app.delete('/api/categories/:id', authMiddleware, (req, res) => {
    let categories = readData('categories.json');
    categories = categories.filter(c => c.id !== req.params.id);
    writeData('categories.json', categories);
    res.json({ message: 'Categoria removida' });
});

// =============================================
// BANNERS ROUTES
// =============================================

app.get('/api/banners', (req, res) => {
    const banners = readData('banners.json');
    res.json(banners);
});

app.post('/api/banners', authMiddleware, (req, res) => {
    const banners = readData('banners.json');
    const newBanner = {
        id: banners.length > 0 ? Math.max(...banners.map(b => b.id)) + 1 : 1,
        ...req.body,
        order: banners.length + 1
    };
    banners.push(newBanner);
    writeData('banners.json', banners);
    res.status(201).json(newBanner);
});

app.put('/api/banners/:id', authMiddleware, (req, res) => {
    const banners = readData('banners.json');
    const index = banners.findIndex(b => b.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Banner não encontrado' });
    banners[index] = { ...banners[index], ...req.body };
    writeData('banners.json', banners);
    res.json(banners[index]);
});

app.delete('/api/banners/:id', authMiddleware, (req, res) => {
    let banners = readData('banners.json');
    banners = banners.filter(b => b.id !== parseInt(req.params.id));
    writeData('banners.json', banners);
    res.json({ message: 'Banner removido' });
});

// =============================================
// SETTINGS ROUTES
// =============================================

app.get('/api/settings', (req, res) => {
    const settings = readData('settings.json');
    res.json(settings);
});

app.put('/api/settings', authMiddleware, (req, res) => {
    const currentSettings = readData('settings.json');
    const updatedSettings = { ...currentSettings, ...req.body };
    writeData('settings.json', updatedSettings);
    res.json(updatedSettings);
});

// =============================================
// UPLOAD ROUTES
// =============================================

app.post('/api/upload', authMiddleware, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }
    res.json({ filename: req.file.filename, path: `images/${req.file.filename}` });
});

// =============================================
// DASHBOARD STATS
// =============================================

app.get('/api/dashboard/stats', authMiddleware, (req, res) => {
    const products = readData('products.json');
    const categories = readData('categories.json');
    const banners = readData('banners.json');

    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const lowStock = products.filter(p => p.stock < 5).length;
    const activeProducts = products.filter(p => p.active).length;

    res.json({
        totalProducts: products.length,
        activeProducts,
        totalCategories: categories.length,
        totalBanners: banners.length,
        totalStock,
        lowStockProducts: lowStock,
        recentProducts: products.slice(-5).reverse()
    });
});

// Export for Vercel
module.exports = app;

// Start Server locally
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
