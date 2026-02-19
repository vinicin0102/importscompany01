const express = require('express');
const router = express.Router();
const { calcularPrecoPrazo } = require('correios-brasil');

// Constantes de Frete
const PACOTE_FORMATO = '1'; // 1 = Caixa/Pacote
const CEP_ORIGEM = '01001000'; // Ex: São Paulo - SP (Pode mover para .env)
const SERVICOS = ['04014', '04510']; // 04014 = SEDEX, 04510 = PAC

// Tabela de Contingência (Estimativas 2026 - 1kg Base de SP)
const CONTINGENCIA = {
    'SP': { pac: 22.80, sedex: 28.50, prazoPac: 5, prazoSedex: 1 },
    'RJ': { pac: 26.40, sedex: 42.90, prazoPac: 7, prazoSedex: 2 },
    'MG': { pac: 27.10, sedex: 45.20, prazoPac: 7, prazoSedex: 2 },
    'ES': { pac: 32.50, sedex: 58.60, prazoPac: 8, prazoSedex: 3 },
    'PR': { pac: 28.30, sedex: 48.10, prazoPac: 7, prazoSedex: 2 },
    'SC': { pac: 32.90, sedex: 62.40, prazoPac: 8, prazoSedex: 3 },
    'RS': { pac: 35.60, sedex: 75.80, prazoPac: 9, prazoSedex: 3 },
    'DF': { pac: 35.20, sedex: 65.10, prazoPac: 8, prazoSedex: 2 },
    'GO': { pac: 38.40, sedex: 72.50, prazoPac: 9, prazoSedex: 3 },
    'MS': { pac: 42.10, sedex: 85.30, prazoPac: 10, prazoSedex: 3 },
    'MT': { pac: 55.70, sedex: 98.90, prazoPac: 11, prazoSedex: 4 },
    'BA': { pac: 52.30, sedex: 95.40, prazoPac: 12, prazoSedex: 4 },
    'PE': { pac: 65.80, sedex: 115.20, prazoPac: 14, prazoSedex: 4 },
    'CE': { pac: 68.50, sedex: 120.60, prazoPac: 15, prazoSedex: 4 },
    'RN': { pac: 72.10, sedex: 125.90, prazoPac: 16, prazoSedex: 5 },
    'PB': { pac: 70.40, sedex: 122.30, prazoPac: 15, prazoSedex: 5 },
    'AL': { pac: 68.90, sedex: 118.70, prazoPac: 14, prazoSedex: 4 },
    'SE': { pac: 65.20, sedex: 115.10, prazoPac: 13, prazoSedex: 4 },
    'MA': { pac: 75.60, sedex: 130.50, prazoPac: 16, prazoSedex: 5 },
    'PI': { pac: 72.80, sedex: 128.40, prazoPac: 15, prazoSedex: 5 },
    'PA': { pac: 78.90, sedex: 135.20, prazoPac: 18, prazoSedex: 5 },
    'AM': { pac: 95.40, sedex: 155.80, prazoPac: 22, prazoSedex: 6 },
    'AP': { pac: 85.10, sedex: 145.30, prazoPac: 20, prazoSedex: 6 },
    'RO': { pac: 88.70, sedex: 150.90, prazoPac: 18, prazoSedex: 6 },
    'RR': { pac: 98.50, sedex: 165.10, prazoPac: 25, prazoSedex: 7 },
    'AC': { pac: 92.30, sedex: 160.40, prazoPac: 22, prazoSedex: 7 },
    'TO': { pac: 65.50, sedex: 110.20, prazoPac: 12, prazoSedex: 4 }
};

function getUfByCep(cepStr) {
    const cep = parseInt(cepStr.substring(0, 5));
    if (cep >= 1000 && cep <= 19999) return 'SP';
    if (cep >= 20000 && cep <= 28999) return 'RJ';
    if (cep >= 29000 && cep <= 29999) return 'ES';
    if (cep >= 30000 && cep <= 39999) return 'MG';
    if (cep >= 40000 && cep <= 48999) return 'BA';
    if (cep >= 49000 && cep <= 49999) return 'SE';
    if (cep >= 50000 && cep <= 56999) return 'PE';
    if (cep >= 57000 && cep <= 57999) return 'AL';
    if (cep >= 58000 && cep <= 58999) return 'PB';
    if (cep >= 59000 && cep <= 59999) return 'RN';
    if (cep >= 60000 && cep <= 63999) return 'CE';
    if (cep >= 64000 && cep <= 64999) return 'PI';
    if (cep >= 65000 && cep <= 65999) return 'MA';
    if (cep >= 66000 && cep <= 68899) return 'PA';
    if (cep >= 68900 && cep <= 68999) return 'AP';
    if (cep >= 69000 && cep <= 69299) return 'AM';
    if (cep >= 69300 && cep <= 69399) return 'RR';
    if (cep >= 69400 && cep <= 69899) return 'AM';
    if (cep >= 69900 && cep <= 69999) return 'AC';
    if (cep >= 70000 && cep <= 73699) return 'DF';
    if (cep >= 73700 && cep <= 76799) return 'GO';
    if (cep >= 76800 && cep <= 76999) return 'RO';
    if (cep >= 77000 && cep <= 77999) return 'TO';
    if (cep >= 78000 && cep <= 78899) return 'MT';
    if (cep >= 79000 && cep <= 79999) return 'MS';
    if (cep >= 80000 && cep <= 87999) return 'PR';
    if (cep >= 88000 && cep <= 89999) return 'SC';
    if (cep >= 90000 && cep <= 99999) return 'RS';
    return null;
}

router.post('/calculate', async (req, res) => {
    let fallbackUsed = false;
    let totalValue = 0;

    try {
        const { cep, items } = req.body;

        if (!cep) {
            return res.status(400).json({ error: 'CEP de destino é obrigatório' });
        }

        // 1. Calcular Peso e Dimensões Totais do Pacote
        let totalWeight = 0;
        let totalWidth = 11;
        let totalLength = 16;
        let totalHeight = 0;

        items.forEach(item => {
            const quantity = parseInt(item.quantity) || 1;
            const weight = 0.3; // Default 300g

            // Empilhamos a altura (ex: camisetas dobradas)
            const itemHeight = 4; // 4cm dobrada (aumentei para evitar limite minimo de 2cm do pacote que as vezes buga)

            // Parse Preço (R$ 100,00 -> 100.00)
            let price = 0;
            if (typeof item.price === 'string') {
                price = parseFloat(item.price.replace('R$', '').replace(/\./g, '').replace(',', '.'));
            } else if (typeof item.price === 'number') {
                price = item.price;
            }

            totalWeight += weight * quantity;
            totalHeight += itemHeight * quantity;
            totalValue += price * quantity; // Update global totalValue
        });

        // Garantir mínimos
        if (totalHeight < 2) totalHeight = 2; // Mínimo Correios
        if (totalHeight > 100) totalHeight = 100; // Limite

        // Args para Correios
        const args = {
            sCepOrigem: CEP_ORIGEM,
            sCepDestino: cep.replace(/\D/g, ''),
            nVlPeso: totalWeight < 1 ? '1' : String(Math.ceil(totalWeight)),
            nCdFormato: PACOTE_FORMATO,
            nVlComprimento: String(totalLength),
            nVlAltura: String(totalHeight),
            nVlLargura: String(totalWidth),
            nCdServico: SERVICOS, // SEDEX, PAC
            nVlDiametro: '0',
        };

        console.log('📦 Solicitando cotação Correios (Real):', args);

        // Tenta pegar a cotação real (com timeout agressivo para não prender o user)
        let response = null;
        try {
            // Timeout manual de 4s
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout Correios')), 4000));
            response = await Promise.race([calcularPrecoPrazo(args), timeoutPromise]);
        } catch (apiError) {
            console.error('Erro/Timeout na Lib correios-brasil:', apiError.message);
            // Se falhar, response continua null, ativando fallback
        }

        let validOptions = [];

        // Verifica se a resposta da API é válida
        if (response) {
            const results = Array.isArray(response) ? response : [response];
            results.forEach(r => {
                if (!r.Erro || r.Erro === '0' || r.Erro === 0) {
                    const valor = parseFloat(r.Valor.replace(',', '.'));
                    if (valor > 0) {
                        validOptions.push({
                            code: r.Codigo,
                            name: r.Codigo === '04014' ? 'SEDEX' : 'PAC',
                            price: valor,
                            days: parseInt(r.PrazoEntrega),
                        });
                    }
                }
            });
        }

        // --- FALLBACK INTELIGENTE (Se API falhou ou não retornou nada válido) ---
        if (validOptions.length === 0) {
            console.warn('⚠️ API Correios falhou. Usando Tabela de Contingência.');
            const cleanCep = cep.replace(/\D/g, '');
            const uf = getUfByCep(cleanCep);

            if (uf && CONTINGENCIA[uf]) {
                const table = CONTINGENCIA[uf];
                fallbackUsed = true;

                // Adiciona opções da tabela
                validOptions.push({
                    code: 'PAC_FALLBACK',
                    name: 'PAC (Estimado)',
                    price: table.pac,
                    days: table.prazoPac,
                    note: 'Valor estimado devido a instabilidade nos Correios'
                });
                validOptions.push({
                    code: 'SEDEX_FALLBACK',
                    name: 'SEDEX (Estimado)',
                    price: table.sedex,
                    days: table.prazoSedex,
                    note: 'Valor estimado devido a instabilidade nos Correios'
                });
            } else {
                // Se CEP não bate com nenhuma faixa conhecida (inválido ou novo)
                return res.status(400).json({ error: 'CEP não identificado ou inválido.' });
            }
        }

        // Lógica de Frete Grátis (> R$ 999)
        if (totalValue >= 999) {
            const pacOption = validOptions.find(o => o.name.includes('PAC')) || validOptions[0];
            validOptions.unshift({
                code: 'FREE',
                name: 'Frete Grátis (Econômico)',
                price: 0.00,
                days: pacOption ? pacOption.days + 2 : 10
            });
        }

        res.json(validOptions);

    } catch (error) {
        console.error('❌ Erro CRÍTICO no cálculo de frete:', error.message);
        res.status(500).json({ error: 'Serviço de frete indisponível no momento.' });
    }
});

module.exports = router;
