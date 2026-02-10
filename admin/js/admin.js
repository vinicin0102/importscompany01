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
