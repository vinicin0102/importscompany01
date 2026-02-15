const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// -----------------------------------------------------------------------------
// 1. CONFIGURATION & SETUP
// -----------------------------------------------------------------------------
require('dotenv').config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe;

// Initialize Stripe with safe check
if (stripeSecretKey && !stripeSecretKey.includes('PLACEHOLDER')) {
    try {
        stripe = require('stripe')(stripeSecretKey, {
            apiVersion: '2026-01-28.clover' // Latest Preview API
        });
        console.log("✅ Stripe Connect (Controller Mode) Initialized!");
    } catch (e) {
        console.error("❌ Stripe Init Error:", e.message);
    }
} else {
    console.warn("⚠️  STRIPE_SECRET_KEY missing. Payment routes disabled.");
}

// Middleware to ensure Stripe is ready
router.use((req, res, next) => {
    if (!stripe) {
        return res.status(503).json({ error: 'Stripe not configured.' });
    }
    next();
});

// Data Storage (JSON Files)
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const ACCOUNTS_FILE = path.join(dataDir, 'connected_accounts.json');
const PRODUCTS_FILE = path.join(dataDir, 'platform_products.json');

const readData = (file) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
const writeData = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));


// -----------------------------------------------------------------------------
// 2. CRITICAL: PLATFORM CHECKOUT (Kept for existing cart compatibility)
// -----------------------------------------------------------------------------
router.post('/platform-checkout', async (req, res) => {
    try {
        const { items } = req.body;
        if (!items?.length) return res.status(400).json({ error: 'No items' });

        const parsePrice = (p) => typeof p === 'number' ? p : Math.round(parseFloat(p.replace('R$', '').replace(/\./g, '').replace(',', '.')) * 100);

        const session = await stripe.checkout.sessions.create({
            line_items: items.map(item => ({
                price_data: {
                    currency: 'brl',
                    product_data: { name: item.title },
                    unit_amount: parsePrice(item.price),
                },
                quantity: item.quantity || 1,
            })),
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/sucesso-whatsapp.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/cancel.html`,
            shipping_address_collection: { allowed_countries: ['BR'] },
            phone_number_collection: { enabled: true },
        });
        res.json({ url: session.url });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// -----------------------------------------------------------------------------
// 3. STRIPE CONNECT FLOWS (REQUESTED IMPLEMENTATION)
// -----------------------------------------------------------------------------

// POST /api/connect/account
// Creates a connected account using the 'controller' property
router.post('/account', async (req, res) => {
    try {
        const { name, email } = req.body;
        // Create account with specific controller configuration
        const account = await stripe.accounts.create({
            country: 'US', // Adjust as needed
            email: email,
            controller: {
                fees: {
                    payer: 'application' // Platform pays fees
                },
                losses: {
                    payments: 'application' // Platform liable for losses
                },
                stripe_dashboard: {
                    type: 'express' // Gives access to Express Dashboard
                }
            },
            capabilities: {
                transfers: { requested: true },
            },
        });

        // Store mapping
        const accounts = readData(ACCOUNTS_FILE);
        accounts.push({ id: account.id, name, email, created: new Date() });
        writeData(ACCOUNTS_FILE, accounts);

        res.json({ account: account.id });
    } catch (error) {
        console.error('Create Account Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/connect/onboard
// Generates an Account Link for onboarding
router.post('/onboard', async (req, res) => {
    try {
        const { accountId } = req.body;
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${req.protocol}://${req.get('host')}/stripe-connect.html`,
            return_url: `${req.protocol}://${req.get('host')}/stripe-connect.html?accountId=${accountId}`,
            type: 'account_onboarding',
        });
        res.json({ url: accountLink.url });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/connect/status/:accountId
// Retrieves account status directly from API
router.get('/status/:accountId', async (req, res) => {
    try {
        const account = await stripe.accounts.retrieve(req.params.accountId);
        // specific logic to determine if payouts/charges are enabled
        const isEnabled = account.payouts_enabled && account.charges_enabled;
        res.json({
            isEnabled,
            details: account,
            requirements: account.requirements
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/connect/product
// Creates a product on the PLATFORM account
router.post('/product', async (req, res) => {
    try {
        const { name, description, price, currency, connectedAccountId } = req.body;

        // Create product on Platform
        const product = await stripe.products.create({
            name,
            description,
            default_price_data: {
                unit_amount: Math.round(parseFloat(price) * 100),
                currency: currency || 'usd',
            },
            metadata: {
                connected_account_id: connectedAccountId // Link to seller
            }
        });

        // Save to local JSON for display
        const products = readData(PRODUCTS_FILE);
        products.push({
            id: product.id,
            priceId: product.default_price,
            name,
            price,
            connectedAccountId,
            created: new Date()
        });
        writeData(PRODUCTS_FILE, products);

        res.json({ product });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/connect/checkout
// Creates a Destination Charge Checkout Session
router.post('/checkout', async (req, res) => {
    try {
        const { priceId, quantity, connectedAccountId } = req.body;

        const session = await stripe.checkout.sessions.create({
            line_items: [{
                price: priceId,
                quantity: quantity || 1,
            }],
            payment_intent_data: {
                application_fee_amount: 500, // $5.00 fee example
                transfer_data: {
                    destination: connectedAccountId,
                },
            },
            mode: 'payment',
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/sucesso-whatsapp.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/stripe-storefront.html`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Checkout Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/connect/checkout-session/:sessionId
// Retrieve session details for the success page (WhatsApp redirect)
router.get('/checkout-session/:sessionId', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, {
            expand: ['line_items', 'customer_details'],
        });
        res.json(session);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/connect/accounts (Helper for UI)
router.get('/accounts', (req, res) => {
    res.json(readData(ACCOUNTS_FILE));
});

// GET /api/connect/products (Helper for UI)
router.get('/products', (req, res) => {
    res.json(readData(PRODUCTS_FILE));
});

module.exports = router;
