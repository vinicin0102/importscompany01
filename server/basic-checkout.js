const express = require('express');
const router = express.Router();
require('dotenv').config();

// Initialize Stripe
// We use the key from .env. The API version here matches the sample's likely expectation.
// If using the 'preview' version elsewhere, we can match it or use stable. 
// Using stable for broad compatibility with simple samples.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia'
});

// POST /create-checkout-session
// This route matches the 'action' in public/checkout.html
router.post('/create-checkout-session', async (req, res) => {
    try {
        console.log('📦 Creating Basic Checkout Session (Sample)...');

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Stubborn Attachments',
                            images: ['https://i.imgur.com/EHyR2nP.png'],
                        },
                        unit_amount: 2000, // $20.00
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.protocol}://${req.get('host')}/success.html`,
            cancel_url: `${req.protocol}://${req.get('host')}/cancel.html`,
        });

        console.log('✅ Session Created:', session.url);
        res.redirect(303, session.url);
    } catch (err) {
        console.error('❌ Error creating session:', err.message);
        res.status(500).send(`Error: ${err.message}`);
    }
});

module.exports = router;
