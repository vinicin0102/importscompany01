const express = require('express');
const router = express.Router();
const { calcularPrecoPrazo } = require('correios-brasil');

// Constantes de Frete
const PACOTE_FORMATO = '1'; // 1 = Caixa/Pacote
const CEP_ORIGEM = '01001000'; // Ex: São Paulo - SP (Pode mover para .env)
const SERVICOS = ['04014', '04510']; // 04014 = SEDEX, 04510 = PAC

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
            const itemHeight = 3; // 3cm dobrada

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
            nVlPeso: totalWeight < 1 ? '1' : String(Math.ceil(totalWeight)), // Mínimo 1kg para cálculo seguro
            nCdFormato: PACOTE_FORMATO,
            nVlComprimento: String(totalLength),
            nVlAltura: String(totalHeight),
            nVlLargura: String(totalWidth),
            nCdServico: SERVICOS,
            nVlDiametro: '0',
        };

        console.log('📦 Solicitando cotação Correios:', args);

        const response = await calcularPrecoPrazo(args);

        // Processar Resposta
        const results = Array.isArray(response) ? response : [response];

        let options = results
            .map(r => {
                // Tratamento de erro da API
                if (r.Erro && r.Erro !== '0' && r.Erro !== 0) {
                    // console.warn(`Erro Correios [${r.Codigo}]: ${r.MsgErro}`);
                    return null;
                }

                return {
                    code: r.Codigo,
                    name: r.Codigo === '04014' ? 'SEDEX' : 'PAC',
                    price: parseFloat(r.Valor.replace(',', '.')),
                    days: parseInt(r.PrazoEntrega),
                };
            })
            .filter(Boolean); // Remove nulos

        // Se API retornou vazio (erro genérico ou timeout interno da lib que não explode Exception)
        if (options.length === 0) {
            console.warn('⚠️ API Correios retornou lista vazia. Usando Fallback.');
            throw new Error('Lista Vazia Correios');
        }

        // Lógica de Frete Grátis (> R$ 999)
        if (totalValue >= 999) {
            const pacOption = options.find(o => o.name === 'PAC') || options[0];
            options.unshift({
                code: 'FREE',
                name: 'Frete Grátis (Econômico)',
                price: 0.00,
                days: pacOption ? pacOption.days + 2 : 10
            });
        }

        res.json(options);

    } catch (error) {
        console.error('❌ Erro no cálculo de frete (Usando Fallback):', error.message);
        fallbackUsed = true;

        // Fallback Fixo
        const fallbackOptions = [];

        if (totalValue >= 999) {
            fallbackOptions.push({
                code: 'FREE',
                name: 'Frete Grátis',
                price: 0.00,
                days: 7 // Estimativa Padrão
            });
        } else {
            fallbackOptions.push({
                code: 'FIXED',
                name: 'Entrega Padrão',
                price: 49.90,
                days: 7,
                note: 'Correios indisponível temporariamente'
            });
        }

        res.json(fallbackOptions);
    }
});

module.exports = router;
