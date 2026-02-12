// =================================================================
// SCRIPT DE TESTE MANUAL DE CORES
// =================================================================
// 1. Abra o seu site no navegador (http://localhost:3001)
// 2. Abra o Console do Desenvolvedor (F12 ou Botão Direito > Inspecionar > Console)
// 3. Cole o código abaixo e aperte Enter.
// =================================================================

// Verifica se a função existe (para evitar erros se o site não carregar direito)
if (typeof window.openProductModal === 'function') {

    console.log("Iniciando teste de modal...");

    window.openProductModal({
        // Dados básicos
        img: "images/banner_raw_2.jpg", // Imagem padrão
        title: "Produto de Teste (Cores & Tint)",
        price: "R$ 99,90",
        oldPrice: "R$ 150,00",
        installment: "ou 3x de R$ 33,30",
        category: "Teste de Funcionalidade",
        description: "Este é um produto gerado via código para testar a troca de cores.",
        rating: 5,
        reviews: 42,

        // VARIANTES DE TESTE
        variants: [
            // CASO 1: Cor com Imagem (Deve trocar a foto)
            {
                color: "Azul (Com Foto)",
                colorHex: "#000080",
                image: "images/banner_raw_2.jpg", // Usa a mesma imagem só pra mostrar que carrega
                size: "M",
                qty: 10
            },

            // CASO 2: Cor SEM Imagem (Deve aplicar o efeito visual de cor)
            {
                color: "Vermelho (Sem Foto - Efeito)",
                colorHex: "#FF0000",
                // image: null, // Sem imagem definida
                size: "M",
                qty: 10
            },

            // CASO 3: Outra cor sem imagem
            {
                color: "Verde (Sem Foto - Efeito)",
                colorHex: "#008000",
                size: "G",
                qty: 5
            }
        ]
    });

    console.log("Modal aberto! Teste os botões de cor.");
} else {
    console.error("Erro: A função openProductModal não foi encontrada. Verifique se você está na página inicial do site.");
}
