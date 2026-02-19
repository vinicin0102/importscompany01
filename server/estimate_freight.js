const { calcularPrecoPrazo } = require('correios-brasil');

const capitais = [
    { uf: 'AC', cep: '69900001', cidade: 'Rio Branco' },
    { uf: 'AL', cep: '57020000', cidade: 'Maceió' },
    { uf: 'AP', cep: '68900000', cidade: 'Macapá' },
    { uf: 'AM', cep: '69010000', cidade: 'Manaus' },
    { uf: 'BA', cep: '40020000', cidade: 'Salvador' },
    { uf: 'CE', cep: '60025000', cidade: 'Fortaleza' },
    { uf: 'DF', cep: '70040000', cidade: 'Brasília' },
    { uf: 'ES', cep: '29010000', cidade: 'Vitória' },
    { uf: 'GO', cep: '74000000', cidade: 'Goiânia' },
    { uf: 'MA', cep: '65010000', cidade: 'São Luís' },
    { uf: 'MT', cep: '78005000', cidade: 'Cuiabá' },
    { uf: 'MS', cep: '79002000', cidade: 'Campo Grande' },
    { uf: 'MG', cep: '30110000', cidade: 'Belo Horizonte' },
    { uf: 'PA', cep: '66010000', cidade: 'Belém' },
    { uf: 'PB', cep: '58010000', cidade: 'João Pessoa' },
    { uf: 'PR', cep: '80010000', cidade: 'Curitiba' },
    { uf: 'PE', cep: '50010000', cidade: 'Recife' },
    { uf: 'PI', cep: '64000000', cidade: 'Teresina' },
    { uf: 'RJ', cep: '20010000', cidade: 'Rio de Janeiro' },
    { uf: 'RN', cep: '59010000', cidade: 'Natal' },
    { uf: 'RS', cep: '90010000', cidade: 'Porto Alegre' },
    { uf: 'RO', cep: '76801000', cidade: 'Porto Velho' },
    { uf: 'RR', cep: '69301000', cidade: 'Boa Vista' },
    { uf: 'SC', cep: '88010000', cidade: 'Florianópolis' },
    { uf: 'SP', cep: '01001000', cidade: 'São Paulo' },
    { uf: 'SE', cep: '49010000', cidade: 'Aracaju' },
    { uf: 'TO', cep: '77001000', cidade: 'Palmas' }
];

const CEP_ORIGEM = '01001000'; // São Paulo - SP
const argsBase = {
    sCepOrigem: CEP_ORIGEM,
    nVlPeso: '1', // 1kg
    nCdFormato: '1', // Caixa
    nVlComprimento: '20',
    nVlAltura: '10',
    nVlLargura: '20',
    nCdServico: ['04014', '04510'], // SEDEX, PAC
    nVlDiametro: '0',
};

async function simularTudo() {
    console.log('ESTADO | CAPITAL       | PAC (R$) | SEDEX (R$)');
    console.log('-------|---------------|----------|-----------');

    for (const capital of capitais) {
        const args = { ...argsBase, sCepDestino: capital.cep };

        try {
            const res = await calcularPrecoPrazo(args);
            const results = Array.isArray(res) ? res : [res];

            let pac = '---';
            let sedex = '---';

            results.forEach(r => {
                if (r.Erro === '0' || r.Erro === 0) {
                    if (r.Codigo === '04510') pac = r.Valor;
                    if (r.Codigo === '04014') sedex = r.Valor;
                }
            });

            console.log(`${capital.uf.padEnd(6)} | ${capital.cidade.padEnd(13)} | ${pac.padStart(8)} | ${sedex.padStart(9)}`);

        } catch (e) {
            console.log(`${capital.uf} - Erro`);
        }
    }
}

simularTudo();
