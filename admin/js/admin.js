/**
 * Admin Panel - Utility Functions v2
 * Imports Company
 */

const API_URL = window.location.origin;

// ====== AUTH ======
function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin/login.html';
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/login.html';
}

// ====== API REQUEST ======
async function apiRequest(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('adminToken');

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);

    if (response.status === 401) {
        logout();
        throw new Error('Sessão expirada. Faça login novamente.');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `Erro ${response.status}`);
    }

    return data;
}

// ====== TOAST NOTIFICATION ======
function showToast(message, type = 'success') {
    // Remove toasts existentes
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
    });

    // Auto-remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ====== FORMATTERS ======
function formatCurrency(value) {
    return `R$ ${parseFloat(value || 0).toFixed(2).replace('.', ',')}`;
}

// ====== IMAGE CROPPER v2 ======
/**
 * Abre o modal de recorte para uma imagem
 * @param {File} file Arquivo original
 * @param {Number} aspectRatio Proporção do recorte (ex: 1 para 1:1, 16/9 para wide)
 * @param {Function} callback Função que recebe o arquivo recortado
 */
function openCropper(file, aspectRatio, callback) {
    // Garante que o CSS do Cropper está carregado
    if (!document.getElementById('cropper-css')) {
        const link = document.createElement('link');
        link.id = 'cropper-css';
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.css';
        document.head.appendChild(link);
    }

    // Carrega o JS do Cropper se não existir
    if (typeof Cropper === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.6.1/cropper.min.js';
        script.onload = () => startCropperProcess(file, aspectRatio, callback);
        document.head.appendChild(script);
    } else {
        startCropperProcess(file, aspectRatio, callback);
    }
}

function startCropperProcess(file, aspectRatio, callback) {
    let modal = document.getElementById('cropper-modal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cropper-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h2><i class="fas fa-crop-alt"></i> Ajustar Imagem</h2>
                    <button type="button" class="modal-close" id="cropper-close"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body" style="background: #111; display: flex; align-items: center; justify-content: center; min-height: 400px; max-height: 65vh; padding: 0;">
                    <img id="cropper-image" style="display: block; max-width: 100%;">
                </div>
                <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="cropper-controls">
                        <button type="button" class="btn btn-icon" onclick="window.cropper.rotate(-90)" title="Girar Esquerda"><i class="fas fa-undo"></i></button>
                        <button type="button" class="btn btn-icon" onclick="window.cropper.rotate(90)" title="Girar Direita"><i class="fas fa-redo"></i></button>
                    </div>
                    <div>
                        <button type="button" class="btn btn-secondary" id="cropper-cancel">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="cropper-confirm">
                            <i class="fas fa-check"></i> Confirmar Recorte
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const closeBtn = document.getElementById('cropper-close');
        const cancelBtn = document.getElementById('cropper-cancel');

        closeBtn.onclick = () => modal.classList.remove('active');
        cancelBtn.onclick = () => modal.classList.remove('active');
    }

    const imageElement = document.getElementById('cropper-image');
    const reader = new FileReader();

    reader.onload = (e) => {
        imageElement.src = e.target.result;
        modal.classList.add('active');

        if (window.cropper) {
            window.cropper.destroy();
        }

        window.cropper = new Cropper(imageElement, {
            aspectRatio: aspectRatio,
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 0.8,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: false,
        });

        document.getElementById('cropper-confirm').onclick = () => {
            const canvas = window.cropper.getCroppedCanvas({
                maxWidth: 4096,
                maxHeight: 4096,
                imageSmoothingEnabled: true,
                imageSmoothingQuality: 'high',
            });

            canvas.toBlob((blob) => {
                const croppedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' });
                callback(croppedFile);
                modal.classList.remove('active');
            }, 'image/webp', 0.9);
        };
    };
    reader.readAsDataURL(file);
}
