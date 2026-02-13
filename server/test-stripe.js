const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
console.log('Chave do Stripe:', stripeSecretKey ? (stripeSecretKey.substring(0, 8) + '...') : 'AUSENTE');

if (!stripeSecretKey || stripeSecretKey.includes('PLACEHOLDER')) {
    console.error('❌ Chave INVÁLIDA ou PLACEHOLDER. O teste vai falhar.');
}

const stripe = require('stripe')(stripeSecretKey, {
    apiVersion: '2025-01-27.acacia',
});

async function testCheckout() {
    console.log('🔄 Tentando criar sessão de checkout de teste...');
    try {
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: 'Produto Teste',
                        },
                        unit_amount: 5000, // R$ 50,00
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: 'http://localhost:3001/success.html',
            cancel_url: 'http://localhost:3001/cancel.html',
        });
        console.log('✅ SUCESSO! Sessão criada.');
        console.log('URL:', session.url);
    } catch (error) {
        console.error('❌ ERRO ao criar sessão:', error.message);
        if (error.type) console.error('Tipo:', error.type);
        if (error.code) console.error('Código:', error.code);
    }
}

testCheckout();
