# Guia de Integração de Pagamentos - Imports Company

Para transformar seu site em uma máquina de vendas real, você tem opções incríveis. Abaixo detalhamos como usar **Mercado Pago** e **Yampi**.

## 🚀 Opção Recomendada: Yampi (Checkout de Alta Conversão)
Ideal para dropshipping e lojas que querem vender muito com upsells e recuperação de carrinho.

### 1. Link Direto (Botão Comprar Agora)
Essa é a forma mais simples e robusta.
1. Cadastre seus produtos no painel da Yampi.
2. Em cada produto, copie o **Link do Checkout** (ex: `seguro.importscompany.com/r/CX82...`).
3. No arquivo `script.js` do site, configure o botão para abrir esse link:

```javascript
/* Exemplo de configuração no script.js */
buyNowBtn.onclick = function() {
    // Verifica qual produto está aberto e redireciona
    if (name.includes('iPhone')) {
        window.location.href = 'SEU_LINK_YAMPI_IPHONE';
    } else if (name.includes('AirPods')) {
        window.location.href = 'SEU_LINK_YAMPI_AIRPODS';
    }
};
```

### 2. Carrinho Inteligente (Vários Produtos)
Para que o botão "Finalizar Compra" do carrinho leve todos os itens para a Yampi:
1. Instale o **Pixel da Yampi** no `index.html` (eles fornecem esse código no painel em "Integrações").
2. Ao invés de usar nosso carrinho interno, usamos a função da Yampi `yampi.addToCart(produto)`.

---

## 🔁 Opção Alternativa: Mercado Pago
Opção sólida e confiável, aceita PIX nativamente.

### 1. Links de Pagamento (Nível Fácil)
1. Crie uma conta no **Mercado Pago**.
2. Vá em **"Link de pagamento"** > **"Criar novo link"**.
3. Use os links gerados nos botões do site.

### 2. Integração Via WhatsApp (Atual)
Atualmente o site está configurado para montar o pedido e enviar para o seu WhatsApp.
*   **Vantagem:** Zero custo, contato pessoal.
*   **Desvantagem:** Manual, você precisa gerar o link de pagamento na hora conversa.

---

## 💡 Resumo
*   Se quer **automatização total e marketing forte**: Vá de **Yampi**.
*   Se quer **começar hoje sem custo mensal**: Mantenha o **WhatsApp** ou use **Links do Mercado Pago**.
