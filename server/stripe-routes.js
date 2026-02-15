const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// -----------------------------------------------------------------------------
// 1. SETUP & CONFIGURATION
// -----------------------------------------------------------------------------

// Load environment variables
require('dotenv').config();

// Initialize Stripe Client
// Using the latest SDK version as requested with specific API version "2026-01-28.clover"
// Initialize Stripe Client
// Using the latest SDK version as requested with specific API version "2026-01-28.clover"
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe;

if (stripeSecretKey && !stripeSecretKey.includes('PLACEHOLDER')) {
    try {
        stripe = require('stripe')(stripeSecretKey, {
            apiVersion: '2026-01-28.clover' // Specific preview version requested
        });
        console.log("✅ Stripe (V2) Inicializado com sucesso!");
    } catch (e) {
        console.error("❌ Erro ao inicializar Stripe:", e.message);
    }
} else {
    console.warn("⚠️  STRIPE_SECRET_KEY ausente ou inválida. Rotas de pagamento desativadas.");
}

// Middleware de proteção: Bloqueia rotas se o Stripe não estiver pronto
router.use((req, res, next) => {
    if (!stripe) {
        return res.status(503).json({
            error: 'Serviço Indisponível',
            message: 'A integração com Stripe não está configurada no servidor (Vercel). Verifique a STRIPE_SECRET_KEY.'
        });
    }
    next();
});

// Create data directory if it doesn't exist to store sample data
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Helper to read/write JSON files (Simulating DB)
const ACCOUNTS_FILE = path.join(dataDir, 'connected_accounts.json');
const PROJECTS_FILE = path.join(dataDir, 'platform_products.json');

const readData = (file) => {
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, 'utf8'));
};

const writeData = (file, data) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// -----------------------------------------------------------------------------
// 2. CONNECTED ACCOUNTS (V2 API)
// -----------------------------------------------------------------------------

// POST /api/connect/account
// Creates a Stripe Connected Account using V2 API
router.post('/account', async (req, res) => {
    try {
        const { email, name } = req.body;
        if (!email || !name) return res.status(400).json({ error: 'Email and Name are required.' });

        // Create account via V2 API
        const account = await stripe.v2.core.accounts.create({
            display_name: name,
            contact_email: email,
            identity: {
                country: 'us', // Default to US for sample, or pass from body
            },
            dashboard: 'express',
            defaults: {
                responsibilities: {
                    fees_collector: 'application',
                    losses_collector: 'application',
                },
            },
            configuration: {
                recipient: {
                    capabilities: {
                        stripe_balance: {
                            stripe_transfers: {
                                requested: true,
                            },
                        },
                    },
                },
            },
        });

        // Store mapping: User (Email) -> Account ID
        const accounts = readData(ACCOUNTS_FILE);
        accounts.push({ email, name, accountId: account.id, created: new Date() });
        writeData(ACCOUNTS_FILE, accounts);

        res.json({ account: account.id });
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/connect/accounts
// Lists all created connected accounts (from local storage)
router.get('/accounts', (req, res) => {
    try {
        const accounts = readData(ACCOUNTS_FILE);
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// -----------------------------------------------------------------------------
// 3. ONBOARDING (V2 API)
// -----------------------------------------------------------------------------

// POST /api/connect/onboard
// Generates an account link for onboarding
router.post('/onboard', async (req, res) => {
    try {
        const { accountId } = req.body;
        if (!accountId) return res.status(400).json({ error: 'Account ID is required.' });

        const accountLink = await stripe.v2.core.accountLinks.create({
            account: accountId,
            use_case: {
                type: 'account_onboarding',
                account_onboarding: {
                    // Start collecting requirements for transfers
                    configurations: ['recipient'],
                    refresh_url: `${req.protocol}://${req.get('host')}/stripe-connect.html`,
                    return_url: `${req.protocol}://${req.get('host')}/stripe-connect.html?accountId=${accountId}`,
                },
            },
        });

        res.json({ url: accountLink.url });
    } catch (error) {
        console.error('Error creating account link:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/connect/status/:accountId
// Checks the onboarding status of a connected account via API
router.get('/status/:accountId', async (req, res) => {
    try {
        const { accountId } = req.params;

        // Retrieve account details via V2/Core API
        const account = await stripe.v2.core.accounts.retrieve(accountId, {
            include: ["configuration.recipient", "requirements"],
        });

        const readyToReceivePayments = account?.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status === "active";

        // Check requirements status
        const requirementsStatus = account.requirements?.summary?.minimum_deadline?.status;
        // Logic from prompt: considered complete if not currently_due or past_due
        const onboardingComplete = requirementsStatus !== "currently_due" && requirementsStatus !== "past_due";

        res.json({
            readyToReceivePayments,
            onboardingComplete,
            details: account
        });
    } catch (error) {
        console.error('Error getting status:', error);
        res.status(500).json({ error: error.message });
    }
});


// -----------------------------------------------------------------------------
// 4. WEBHOOKS (THIN EVENTS)
// -----------------------------------------------------------------------------

// POST /api/connect/webhook
// Listens for V2 thin events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET; // Placeholder in .env needed

    if (!webhookSecret) {
        console.warn('⚠️  STRIPE_WEBHOOK_SECRET is missing. Webhooks will not be verified.');
        return res.sendStatus(200);
    }

    let thinEvent;
    try {
        // Parse the thin event
        // Note: SDK usually handles body parsing. Assuming req.body is available.
        // If express.json() is global, req.body is object. stripe.parseThinEvent needs string payload or object?
        // Checking SDK docs via implementation pattern: client.parseThinEvent(req.body, sig, secret)
        thinEvent = stripe.parseThinEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
        if (thinEvent.type === 'v2.core.account.updated' || thinEvent.type === 'v2.core.account.requirements.updated') {
            // Fetch full event details
            const event = await stripe.v2.core.events.retrieve(thinEvent.id);
            console.log('🔔 Received Event:', event.type);
            console.log('   Data:', JSON.stringify(event.data, null, 2));

            // Implement logic to update local DB status if needed
        }

        res.json({ received: true });
    } catch (err) {
        console.error('Error handling event:', err);
        res.status(500).json({ error: err.message });
    }
});


// -----------------------------------------------------------------------------
// 5. PRODUCTS (PLATFORM LEVEL)
// -----------------------------------------------------------------------------

// POST /api/connect/product
// Creates a product on the Platform account, mapping it to a connected account
router.post('/product', async (req, res) => {
    try {
        const { name, description, price, currency, connectedAccountId } = req.body;

        if (!name || !price || !connectedAccountId) {
            return res.status(400).json({ error: 'Name, Price and Connected Account ID are required.' });
        }

        // Create product on Platform
        const product = await stripe.products.create({
            name: name,
            description: description || 'Platform Product',
            default_price_data: {
                unit_amount: Math.round(parseFloat(price) * 100), // Convert to cents
                currency: currency || 'usd', // Default to USD
            },
            metadata: {
                connected_account_id: connectedAccountId // Store mapping in metadata
            }
        });

        // Store persistent mapping in JSON file
        const products = readData(PROJECTS_FILE);
        products.push({
            id: product.id,
            priceId: product.default_price,
            name,
            price,
            connectedAccountId,
            created: new Date()
        });
        writeData(PROJECTS_FILE, products);

        res.json({ product });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/connect/products
// Lists available platform products
router.get('/products', (req, res) => {
    try {
        const products = readData(PROJECTS_FILE);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// -----------------------------------------------------------------------------
// 6. CHECKOUT (DESTINATION CHARGES)
// -----------------------------------------------------------------------------

// POST /api/connect/checkout
// Creates a checkout session sending funds to the connected account
router.post('/checkout', async (req, res) => {
    try {
        const { priceId, quantity, connectedAccountId } = req.body;

        if (!priceId || !connectedAccountId) {
            return res.status(400).json({ error: 'Price ID and Connected Account ID are required.' });
        }

        // Create Session with Destination Charge
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price: priceId,
                    quantity: quantity || 1,
                },
            ],
            payment_intent_data: {
                application_fee_amount: 1000, // $10.00 fee (sample)
                transfer_data: {
                    destination: connectedAccountId,
                },
            },
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.protocol}://${req.get('host')}/stripe-storefront.html`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
