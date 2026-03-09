require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function test() {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['pix'], // Trying PIX
            line_items: [{ price_data: { currency: 'brl', product_data: { name: 't' }, unit_amount: 1000 }, quantity: 1 }],
            mode: 'payment',
            success_url: 'http://localhost:3001/success.html',
            cancel_url: 'http://localhost:3001/cancel.html'
        });
        console.log('✅ SUCESSO! PIX LIGADO:', session.url);
    } catch (e) {
        console.log('❌ FALHA AO USAR PIX:', e.message);
    }
}
test();
