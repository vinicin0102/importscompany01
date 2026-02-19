const { calcularPrecoPrazo } = require('correios-brasil');

async function test() {
    console.log('Testando SP -> SP...');
    const args = {
        sCepOrigem: '01001000',
        sCepDestino: '01310100', // Paulista
        nVlPeso: '1',
        nCdFormato: '1',
        nVlComprimento: '20',
        nVlAltura: '10',
        nVlLargura: '20',
        nCdServico: ['04510'], // PAC
        nVlDiametro: '0',
    };

    try {
        const res = await calcularPrecoPrazo(args);
        console.log('Sucesso:', JSON.stringify(res, null, 2));
    } catch (e) {
        console.error('Erro:', e);
    }
}
test();
