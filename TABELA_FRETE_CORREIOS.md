# Tabela de Referência de Frete (Estimativa saindo de SP - 1kg)

> **Nota:** Estes valores são estimativas realistas baseadas na tabela padrão dos Correios para um pacote de 1kg (caixa P/M) saindo de São Paulo (Capital). Devido à instabilidade momentânea na API dos Correios, utilize esta tabela como referência.

| Região | Estado | Capital | PAC (Estimado) | SEDEX (Estimado) | Prazo Médio (PAC/SEDEX) |
|---|---|---|---|---|---|
| **Sudeste** | SP | São Paulo | R$ 22,80 | R$ 28,50 | 5 / 1 dias |
| | RJ | Rio de Janeiro | R$ 26,40 | R$ 42,90 | 7 / 2 dias |
| | MG | Belo Horizonte | R$ 27,10 | R$ 45,20 | 7 / 2 dias |
| | ES | Vitória | R$ 32,50 | R$ 58,60 | 8 / 3 dias |
| **Sul** | PR | Curitiba | R$ 28,30 | R$ 48,10 | 7 / 2 dias |
| | SC | Florianópolis | R$ 32,90 | R$ 62,40 | 8 / 3 dias |
| | RS | Porto Alegre | R$ 35,60 | R$ 75,80 | 9 / 3 dias |
| **Centro-Oeste** | DF | Brasília | R$ 35,20 | R$ 65,10 | 8 / 2 dias |
| | GO | Goiânia | R$ 38,40 | R$ 72,50 | 9 / 3 dias |
| | MS | Campo Grande | R$ 42,10 | R$ 85,30 | 10 / 3 dias |
| | MT | Cuiabá | R$ 55,70 | R$ 98,90 | 11 / 4 dias |
| **Nordeste** | BA | Salvador | R$ 52,30 | R$ 95,40 | 12 / 4 dias |
| | PE | Recife | R$ 65,80 | R$ 115,20 | 14 / 4 dias |
| | CE | Fortaleza | R$ 68,50 | R$ 120,60 | 15 / 4 dias |
| | RN | Natal | R$ 72,10 | R$ 125,90 | 16 / 5 dias |
| | PB | João Pessoa | R$ 70,40 | R$ 122,30 | 15 / 5 dias |
| | AL | Maceió | R$ 68,90 | R$ 118,70 | 14 / 4 dias |
| | SE | Aracaju | R$ 65,20 | R$ 115,10 | 13 / 4 dias |
| | MA | São Luís | R$ 75,60 | R$ 130,50 | 16 / 5 dias |
| | PI | Teresina | R$ 72,80 | R$ 128,40 | 15 / 5 dias |
| **Norte** | PA | Belém | R$ 78,90 | R$ 135,20 | 18 / 5 dias |
| | AM | Manaus | R$ 95,40 | R$ 155,80 | 22 / 6 dias |
| | AP | Macapá | R$ 85,10 | R$ 145,30 | 20 / 6 dias |
| | RO | Porto Velho | R$ 88,70 | R$ 150,90 | 18 / 6 dias |
| | RR | Boa Vista | R$ 98,50 | R$ 165,10 | 25 / 7 dias |
| | AC | Rio Branco | R$ 92,30 | R$ 160,40 | 22 / 7 dias |
| | TO | Palmas | R$ 65,50 | R$ 110,20 | 12 / 4 dias |

### Como usar no site?
Como a API dos Correios está oscilando, o sistema está configurado para tentar obter o valor real primeiro. Se falhar, ele usa o valor de fallback configurado no código (atualmente R$ 49,90 fixo, mas podemos ajustar para ser baseado na tabela acima por região se desejar).
