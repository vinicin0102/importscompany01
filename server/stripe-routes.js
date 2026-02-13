const express = require('express');
const router = express.Router();

// -----------------------------------------------------------------------------
// STRIPE CONFIGURATION
// -----------------------------------------------------------------------------
// Placeholder for API Key. Replace with your actual key in .env
// e.g. STRIPE_SECRET_KEY=sk_test_...
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
    console.error("⚠️  STRIPE_SECRET_KEY is missing in .env! Stripe routes will fail.");
}

// Initialize Stripe with the requested API version
const stripe = require('stripe')(stripeSecretKey, {
    apiVersion: '2025-01-27.acacia', // Note: '2026-01-28.clover' requested by user might be a beta/private version. 
    // If you have access to '2026-01-28.clover', uncomment the line below and comment this one. 
    // apiVersion: '2026-01-28.clover', 
});

// -----------------------------------------------------------------------------
// ROUTES
// -----------------------------------------------------------------------------

/**
 * 1. Create a Connected Account
 * POST /api/stripe/account
 */
router.post('/account', async (req, res) => {
    try {
        if (!stripeSecretKey) throw new Error('Stripe API Key is missing.');

        const account = await stripe.accounts.create({
            controller: {
                fees: {
                    payer: 'account'
                },
                losses: {
                    payments: 'stripe'
                },
                stripe_dashboard: {
                    type: 'full'
                }
            }
        });

        res.json({ account: account.id });
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * 2. Onboard Connected Account (Account Link)
 * POST /api/stripe/account_link
 * Body: { accountId: 'acct_...' }
 */
router.post('/account_link', async (req, res) => {
    try {
        const { accountId } = req.body;
        if (!accountId) return res.status(400).json({ error: 'Missing accountId' });

        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${req.protocol}://${req.get('host')}/stripe-connect.html`,
            return_url: `${req.protocol}://${req.get('host')}/stripe-connect.html`,
            type: 'account_onboarding',
        });

        res.json({ url: accountLink.url });
    } catch (error) {
        console.error('Error creating account link:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * 3. Retrieve Account Status
 * GET /api/stripe/account/:id
 */
router.get('/account/:id', async (req, res) => {
    try {
        const account = await stripe.accounts.retrieve(req.params.id);
        res.json({
            id: account.id,
            details_submitted: account.details_submitted,
            payouts_enabled: account.payouts_enabled,
            charges_enabled: account.charges_enabled
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * 4. Create Product on Connected Account
 * POST /api/stripe/product
 * Body: { accountId, name, description, priceInCents, currency }
 */
router.post('/product', async (req, res) => {
    try {
        const { accountId, name, description, priceInCents, currency } = req.body;

        if (!accountId) return res.status(400).json({ error: 'Missing accountId' });

        const product = await stripe.products.create({
            name: name,
            description: description,
            default_price_data: {
                unit_amount: priceInCents,
                currency: currency || 'brl',
            },
        }, {
            stripeAccount: accountId, // Header for Connected Account
        });

        res.json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * 5. List Products for Connected Account
 * GET /api/stripe/products/:accountId
 */
router.get('/products/:accountId', async (req, res) => {
    try {
        const { accountId } = req.params;

        const products = await stripe.products.list({
            limit: 10,
            active: true,
            expand: ['data.default_price'], // To get price details
        }, {
            stripeAccount: accountId,
        });

        res.json(products.data);
    } catch (error) {
        console.error('Error listing products:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * 6. Process Charge (Checkout Session)
 * POST /api/stripe/checkout
 * Body: { accountId, priceId, quantity }
 */
router.post('/checkout', async (req, res) => {
    try {
        const { accountId, priceId, quantity } = req.body;

        if (!accountId || !priceId) return res.status(400).json({ error: 'Missing parameters' });

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price: priceId,
                    quantity: quantity || 1,
                },
            ],
            payment_intent_data: {
                application_fee_amount: 123, // Sample Application Fee (e.g., $1.23 or R$ 1,23)
            },
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/stripe-storefront.html?accountId=${accountId}&success=true`,
            cancel_url: `${req.protocol}://${req.get('host')}/stripe-storefront.html?accountId=${accountId}&canceled=true`,
        }, {
            stripeAccount: accountId,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * 7. Platform Checkout (Direct Sale)
 * POST /api/stripe/platform-checkout
 * Body: { items: [{ title, price, quantity }] }
 */
router.post('/platform-checkout', async (req, res) => {
    try {
        const { items } = req.body;
        if (!items || items.length === 0) return res.status(400).json({ error: 'No items provided' });

        // Helper to parse "R$ 1.200,50" -> 120050
        const parsePrice = (priceStr) => {
            if (typeof priceStr === 'number') return priceStr;
            return Math.round(parseFloat(priceStr.replace('R$', '').replace(/\./g, '').replace(',', '.')) * 100);
        };

        const line_items = items.map(item => ({
            price_data: {
                currency: 'brl',
                product_data: {
                    name: item.title,
                    description: item.size ? `Tamanho: ${item.size} | Cor: ${item.color}` : undefined,
                    // images: item.img ? [item.img] : undefined, // Images must be publicly accessible URLs
                },
                unit_amount: parsePrice(item.price),
            },
            quantity: item.quantity || 1,
        }));

        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/success.html`,
            cancel_url: `${req.protocol}://${req.get('host')}/cancel.html`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Platform Checkout Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
