/**
 * Stock Management Logic v2
 * Imports Company
 */

let products = [];
let categories = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof checkAuth === 'function' && !checkAuth()) return;
    await initStock();
});

async function initStock() {
    try {
        const [pData, cData] = await Promise.all([
            apiRequest('/api/products'),
            apiRequest('/api/categories')
        ]);
        products = pData;
        categories = cData;
        
        // Populate category select in modal
        const catSelect = document.getElementById('f-category');
        if (catSelect) {
            catSelect.innerHTML = '<option value="">Selecione...</option>' + 
                categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }

        updateStats();
        renderStock();
    } catch (err) {
        console.error('Error init stock:', err);
        const container = document.getElementById('stock-container');
        if (container) container.innerHTML = `<div class="loading"><i class="fas fa-exclamation-triangle"></i> Erro: ${err.message}</div>`;
    }
}

function updateStats() {
    let totalPieces = 0, totalVariants = 0, lowCount = 0, outCount = 0;

    products.forEach(p => {
        if (p.variants && p.variants.length > 0) {
            p.variants.forEach(v => {
                totalPieces += v.qty || 0;
                totalVariants++;
                if ((v.qty || 0) === 0) outCount++;
                else if ((v.qty || 0) < 5) lowCount++;
            });
        } else {
            totalPieces += p.stock || 0;
            if ((p.stock || 0) === 0) outCount++;
            else if ((p.stock || 0) < 5) lowCount++;
        }
    });

    const elTotal = document.getElementById('stat-total');
    const elProd = document.getElementById('stat-products');
    const elLow = document.getElementById('stat-low');
    const elOut = document.getElementById('stat-out');

    if (elTotal) elTotal.textContent = totalPieces;
    if (elProd) elProd.textContent = products.length;
    if (elLow) elLow.textContent = lowCount;
    if (elOut) elOut.textContent = outCount;
}

function renderStock() {
    const search = document.getElementById('search')?.value.toLowerCase();
    const filter = document.getElementById('filter')?.value;
    const container = document.getElementById('stock-container');
    if (!container) return;

    let rows = [];
    products.forEach(p => {
        if (search && !p.name.toLowerCase().includes(search)) return;

        const catName = categories.find(c => c.id === p.category)?.name || p.category || 'Geral';
        const imgSrc = p.image && p.image.startsWith('http') ? p.image : `../${p.image || 'images/placeholder.png'}`;

        if (p.variants && p.variants.length > 0) {
            p.variants.forEach((v, idx) => {
                const qty = v.qty || 0;
                const status = qty === 0 ? 'out' : qty < 5 ? 'low' : 'ok';
                if (filter && filter !== status) return;
                rows.push({ 
                    id: p.id, 
                    product: p, 
                    catName, 
                    imgSrc, 
                    color: v.color, 
                    size: v.size, 
                    qty, 
                    status, 
                    variantIdx: idx,
                    active: p.active 
                });
            });
        } else {
            const qty = p.stock || 0;
            const status = qty === 0 ? 'out' : qty < 5 ? 'low' : 'ok';
            if (filter && filter !== status) return;
            rows.push({ 
                id: p.id, 
                product: p, 
                catName, 
                imgSrc, 
                color: '-', 
                size: '-', 
                qty, 
                status, 
                variantIdx: null,
                active: p.active 
            });
        }
    });

    if (rows.length === 0) {
        container.innerHTML = `<div class="loading"><i class="fas fa-box-open"></i> Nenhum item encontrado</div>`;
        return;
    }

    let html = `
        <table class="stock-table">
            <thead>
                <tr>
                    <th>Produto</th>
                    <th>Variante</th>
                    <th>Qtd</th>
                    <th>Ações</th>
                    <th>Site</th>
                </tr>
            </thead>
            <tbody>`;

    rows.forEach(r => {
        const colorHtml = r.color !== '-' ? `<span class="badge-mini">${r.color}</span>` : '';
        const sizeHtml = r.size !== '-' ? `<span class="badge-mini secondary">${r.size}</span>` : '';
        
        html += `
            <tr data-id="${r.id}" data-variant="${r.variantIdx}">
                <td>
                    <div class="product-cell">
                        <img src="${r.imgSrc}" alt="" onerror="this.src='../images/placeholder.png'">
                        <div class="info">
                            <div class="name">${r.product.name}</div>
                            <div class="cat">${r.catName}</div>
                        </div>
                    </div>
                </td>
                <td style="white-space: nowrap;">
                    ${colorHtml} ${sizeHtml}
                    ${r.color === '-' && r.size === '-' ? '<span class="no-variants">Sem variantes</span>' : ''}
                </td>
                <td>
                    <span class="qty-badge ${r.status}" id="qty-${r.id}-${r.variantIdx}">${r.qty}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action dec" onclick="changeQty(${r.id}, -1, ${r.variantIdx})" title="Remover 1"><i class="fas fa-minus"></i></button>
                        <button class="btn-action inc" onclick="changeQty(${r.id}, 1, ${r.variantIdx})" title="Adicionar 1"><i class="fas fa-plus"></i></button>
                        <button class="btn-action edit" onclick="editFullProduct(${r.id})" title="Editar Produto Completo"><i class="fas fa-edit"></i></button>
                    </div>
                </td>
                <td>
                    <label class="switch">
                        <input type="checkbox" ${r.active ? 'checked' : ''} onchange="toggleActive(${r.id}, this.checked)">
                        <span class="slider round"></span>
                    </label>
                </td>
            </tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

// ====== FUNCTIONS ======

async function toggleActive(id, newState) {
    try {
        await apiRequest(`/api/products/${id}`, 'PUT', { active: newState });
        // Update local state
        const p = products.find(x => x.id === id);
        if (p) p.active = newState;
        
        showToast(`Produto ${newState ? 'ativado' : 'desativado'} no site.`);
    } catch (err) {
        showToast(err.message, 'error');
        renderStock(); // Revert UI
    }
}

async function changeQty(id, delta, variantIdx) {
    const p = products.find(x => x.id === id);
    if (!p) return;

    try {
        let updateData = {};
        
        if (variantIdx !== null) {
            const variant = p.variants[variantIdx];
            const newQty = Math.max(0, (variant.qty || 0) + delta);
            variant.qty = newQty;
            updateData = { variants: p.variants };
            
            // Recalcular total stock
            p.stock = p.variants.reduce((sum, v) => sum + (v.qty || 0), 0);
            updateData.stock = p.stock;
        } else {
            const newQty = Math.max(0, (p.stock || 0) + delta);
            p.stock = newQty;
            updateData = { stock: newQty };
        }

        await apiRequest(`/api/products/${id}`, 'PUT', updateData);
        
        updateStats();
        renderStock();
    } catch (err) {
        showToast(err.message, 'error');
        initStock(); // Reload from server on error
    }
}

function openNewProductModal() {
    const modal = document.getElementById('new-product-modal');
    if (modal) modal.classList.add('active');
}

function closeNewProductModal() {
    const modal = document.getElementById('new-product-modal');
    if (modal) modal.classList.remove('active');
}

async function saveQuickProduct(event) {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    const data = {
        name: document.getElementById('f-name').value,
        category: document.getElementById('f-category').value,
        price: parseFloat(document.getElementById('f-price').value),
        stock: parseInt(document.getElementById('f-stock').value) || 0,
        active: document.getElementById('f-active-modal').checked,
        image: document.getElementById('f-image-url').value || 'images/placeholder.png'
    };

    try {
        await apiRequest('/api/products', 'POST', data);
        showToast('Produto adicionado com sucesso!');
        closeNewProductModal();
        event.target.reset();
        await initStock();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Salvar Produto';
    }
}

function editFullProduct(id) {
    // Redireciona para a página de produtos filtrando por esse ID ou apenas abre? 
    // Como aqui é o admin, podemos mandar para a products.html com um parametro ou apenas abrir lá.
    window.location.href = `/admin/products.html?edit=${id}`;
}

// ====== IMAGE UPLOAD (SIMPLE) ======
async function handleQuickUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` },
            body: formData
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        document.getElementById('f-image-url').value = data.path;
        showToast('Imagem carregada!');
    } catch (err) {
        showToast(err.message, 'error');
    }
}
