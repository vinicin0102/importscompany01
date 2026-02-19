const https = require('https');

const url = 'https://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx?nCdEmpresa=&sDsSenha=&sCepOrigem=01001000&sCepDestino=01310100&nVlPeso=1&nCdFormato=1&nVlComprimento=20&nVlAltura=20&nVlLargura=20&sCdMaoPropria=n&nVlValorDeclarado=0&sCdAvisoRecebimento=n&nCdServico=04510&nVlDiametro=0&StrRetorno=xml&nIndicaCalculo=3';

console.log('Fetching:', url);

https.get(url, (res) => {
    console.log('Status Code:', res.statusCode);

    let data = '';
    res.on('data', chunk => data += chunk);

    res.on('end', () => {
        console.log('Body:', data.substring(0, 500)); // Log parcial
    });
}).on('error', (e) => {
    console.error('Error:', e.message);
});
