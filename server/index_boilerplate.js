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
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB Limit

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

// ... (existing routes) ...

// =============================================
// GLOBAL ERROR HANDLER
// =============================================
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Multer-specific errors
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
