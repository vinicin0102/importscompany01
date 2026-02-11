/* ========================================
   Admin Loader - Conecta o Site ao Painel Admin
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Tenta carregar produtos do Admin (API)
    loadProductsFromAdmin();
    loadSettingsFromAdmin();
});

async function loadProductsFromAdmin() {
    try {
        console.log('🔄 Buscando produtos do Admin...');
        const response = await fetch('/api/products');

        if (!response.ok) throw new Error('Falha na API');

        const products = await response.json();
        const activeProducts = products.filter(p => p.active);

        if (activeProducts.length > 0) {
            console.log('✅ Produtos do Admin encontrados:', activeProducts.length);
            renderProducts(activeProducts);
        } else {
            console.log('⚠️ Nenhum produto ativo no Admin. Mantendo estáticos.');
        }

    } catch (error) {
        console.warn('⚠️ Admin API offline ou erro. Mantendo produtos estáticos para segurança.', error);
        // Não faz nada, deixa os produtos hardcoded do HTML visíveis
    }
}

async function loadSettingsFromAdmin() {
    try {
        const response = await fetch('/api/settings');
        if (response.ok) {
            const settings = await response.json();
            applySettings(settings);
        }
    } catch (e) { console.warn('Settings API error'); }
}

function renderProducts(products) {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;

    // Limpa produtos estáticos
    grid.innerHTML = '';

    // Adiciona produtos do Admin
    products.forEach(product => {
        // Calcula parcelamento
        const priceNum = parseFloat(product.price);
        const installmentValue = (priceNum / 12).toFixed(2).replace('.', ',');
        const priceFormatted = priceNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const oldPriceFormatted = product.oldPrice ? product.oldPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';

        // Badge logic
        let badgeHtml = '';
        if (product.badge) {
            let badgeClass = 'badge-new';
            let badgeText = product.badge;

            if (product.badge.toLowerCase().includes('oferta') || product.badge.includes('%')) badgeClass = 'badge-sale';
            if (product.badge.toLowerCase().includes('vendido')) badgeClass = 'badge-hot';

            badgeHtml = `<span class="badge ${badgeClass}">${badgeText}</span>`;
        }


        // Determinar caminho da imagem (URL externa ou local)
        const imageSrc = product.image && product.image.startsWith('http')
            ? product.image
            : (product.image || 'images/placeholder.png');

        const card = document.createElement('article');
        card.className = 'product-card animate-in';
        card.innerHTML = `
            ${badgeHtml}
            <div class="product-image-wrapper">
                <img src="${imageSrc}" alt="${product.name}" class="product-img" onerror="this.onerror=null;this.src='images/placeholder.png';">
            </div>
            <div class="product-details">
                <span class="product-category">${product.category || 'Geral'}</span>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">
                    ${oldPriceFormatted ? `<span class="price-old">${oldPriceFormatted}</span>` : ''}
                    <span class="price-current">${priceFormatted}</span>
                    <span class="installment">ou 12x de R$ ${installmentValue}</span>
                </div>
                <button class="add-to-cart-btn"><i class="fas fa-shopping-bag"></i> Adicionar</button>
            </div>
        `;

        // Reatach Events (Modal, etc)
        reattachEvents(card, product);

        grid.appendChild(card);
    });
}

function reattachEvents(card, data) {
    const btn = card.querySelector('.add-to-cart-btn');
    const imgWrapper = card.querySelector('.product-image-wrapper');
    const img = card.querySelector('img');

    // Dados normalizados para o Modal
    const modalData = {
        img: img.src,
        title: data.name,
        price: parseFloat(data.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        oldPrice: data.oldPrice ? parseFloat(data.oldPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '',
        installment: `ou 12x de R$ ${(data.price / 12).toFixed(2).replace('.', ',')}`,
        category: data.category || 'Oferta',
        variants: data.variants || [],
        yampi_token: data.yampi_token || null,
        images: data.images || []
    };

    const openModalHandler = (e) => {
        e.preventDefault();
        if (typeof openProductModal === 'function') {
            openProductModal(modalData);
        } else {
            console.error('Funçăo openProductModal nâo encontrada!');
        }
    };

    btn.onclick = openModalHandler;
    imgWrapper.onclick = openModalHandler;
}

function applySettings(settings) {
    if (settings.siteName) document.title = settings.siteName;

    // Injetar estilos dinâmicos de Layout
    let dynamicStyles = '';

    // Layout Mobile de Produtos (1 ou 2 por linha)
    if (settings.mobileLayout) {
        const columns = settings.mobileLayout === '1' ? '1fr' : '1fr 1fr';
        dynamicStyles += `
            @media (max-width: 768px) {
                .products-grid {
                    grid-template-columns: ${columns} !important;
                }
            }
        `;
    }

    // Layout de Categorias (Quantidade por linha)
    if (settings.categoryLayout) {
        dynamicStyles += `
            .categories-grid-home {
                grid-template-columns: repeat(${settings.categoryLayout}, 1fr) !important;
            }
            @media (max-width: 992px) {
                .categories-grid-home {
                    grid-template-columns: repeat(2, 1fr) !important;
                }
            }
            @media (max-width: 480px) {
                .categories-grid-home {
                    grid-template-columns: repeat(1, 1fr) !important;
                }
            }
        `;
    }

    if (dynamicStyles) {
        const styleSheet = document.createElement("style");
        styleSheet.innerText = dynamicStyles;
        document.head.appendChild(styleSheet);
    }
}
