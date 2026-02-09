/* ========================================
   IMPORTS COMPANY - Script Premium
   Focado em UX e Performance
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Site Premium Carregado!');

    initHeader();
    initMobileMenu();
    initCart();
});

/* ========================================
   1. Header Sticky e Efeitos
   ======================================== */
function initHeader() {
    const header = document.querySelector('.header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

/* ========================================
   2. Menu Mobile
   ======================================== */
function initMobileMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.mobile-nav');

    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        nav.classList.toggle('active');
        const icon = toggle.querySelector('i');

        if (nav.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });

    // Fechar ao clicar em link
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            toggle.querySelector('i').classList.remove('fa-times');
            toggle.querySelector('i').classList.add('fa-bars');
        });
    });
}

/* ========================================
   3. Carrinho Simples
   ======================================== */
function initCart() {
    const buttons = document.querySelectorAll('.add-to-cart-btn');
    const countBadge = document.querySelector('.cart-count');
    let count = 0;

    buttons.forEach(btn => {
        btn.addEventListener('click', function () {
            // Efeito visual
            const originalContent = this.innerHTML;
            this.innerHTML = '<i class="fas fa-check"></i> Adicionado!';
            this.style.background = '#28a745';
            this.style.transform = 'scale(0.95)';

            // Incrementar contador
            count++;
            if (countBadge) {
                countBadge.textContent = count;
                countBadge.classList.add('bump'); // Adicionar classe de animação se existir no CSS
                setTimeout(() => countBadge.classList.remove('bump'), 300);
            }

            // Restaurar botão
            setTimeout(() => {
                this.innerHTML = originalContent;
                this.style.background = '';
                this.style.transform = '';
            }, 2000);
        });
    });
}
