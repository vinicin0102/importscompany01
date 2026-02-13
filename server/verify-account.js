require('dotenv').config();
const key = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(key);

(async () => {
    try {
        console.log('\n🔍 VERIFICANDO CONTA STRIPE...');
        const account = await stripe.account.retrieve();
        console.log(`✅ CONECTADO NA CONTA: ${account.settings?.dashboard?.display_name || 'Nome não configurado'}`);
        console.log(`📧 EMAIL: ${account.email}`);
        console.log(`🔑 TIPO DE CHAVE: ${key.startsWith('sk_live') ? 'PRODUÇÃO (Dinheiro Real) 🟢' : 'TESTE (Simulação) 🟡'}`);

        if (key.startsWith('sk_test')) {
            console.log('\n⚠️  AVISO: Você está usando uma chave de TESTE.');
            console.log('    Para receber dinheiro de verdade, você precisa da chave que começa com "sk_live_".');
        }
    } catch (error) {
        console.error('\n❌ ERRO NA CHAVE:', error.message);
    }
})();
