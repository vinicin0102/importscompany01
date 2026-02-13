async function test() {
    console.log('Testando conexão com API de Produtos...');
    try {
        const response = await fetch('http://localhost:3001/api/products');
        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Resposta:', text.substring(0, 500)); // Mostrar primeiros 500 chars

        try {
            JSON.parse(text);
            console.log('✅ JSON Válido');
        } catch (e) {
            console.log('❌ JSON Inválido (Erro aqui!)');
        }
    } catch (err) {
        console.error('Erro de conexão:', err.message);
    }
}

test();
