/* ========================================
   IMPORTS COMPANY - JavaScript
   Versão Simplificada e Robusta
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Script carregado com sucesso!');

    try {
        initHeader();
        initMobileNav();
        initHeroSlider();
        initScrollAnimations();
        initProductFilter();
        initCart();
        initBackToTop();
        initWhatsAppBtn();
    } catch (error) {
        console.error('Erro na inicialização:', error);
    }
});

/* ========================================
   Header Scroll Effect
   ======================================== */
function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

/* ========================================
   Mobile Navigation
   ======================================== */
function initMobileNav() {
    const menuToggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('nav');

    if (!menuToggle || !nav) return;

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        nav.classList.toggle('open');
        document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });

    // Close menu when clicking on a link
    const navLinks = nav.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            nav.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}

/* ========================================
   Hero Slider - Versão Simplificada
   ======================================== */
function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const nextBtn = document.querySelector('.slider-next');
    const prevBtn = document.querySelector('.slider-prev');

    if (slides.length === 0) {
        console.log('Nenhum slide encontrado');
        return;
    }

    console.log('✅ Slides encontrados:', slides.length);

    let currentSlide = 0;
    const intervalTime = 5000;
    let slideInterval;

    const showSlide = (n) => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (n + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
    };

    const nextSlide = () => showSlide(currentSlide + 1);
    const prevSlide = () => showSlide(currentSlide - 1);

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            resetInterval();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            resetInterval();
        });
    }

    function startInterval() {
        slideInterval = setInterval(nextSlide, intervalTime);
    }

    function resetInterval() {
        clearInterval(slideInterval);
        startInterval();
    }

    startInterval();
    console.log('✅ Slider iniciado');
}

/* ========================================
   Scroll Animations
   ======================================== */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    if (animatedElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, { threshold: 0.1 });

    animatedElements.forEach(el => observer.observe(el));
}

/* ========================================
   Product Filter
   ======================================== */
function initProductFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const products = document.querySelectorAll('.product-card');

    if (filterBtns.length === 0 || products.length === 0) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            products.forEach(product => {
                if (filter === 'all' || product.dataset.category === filter) {
                    product.style.display = '';
                } else {
                    product.style.display = 'none';
                }
            });
        });
    });
}

/* ========================================
   Shopping Cart
   ======================================== */
function initCart() {
    const cartCount = document.querySelector('.cart-count');
    let count = 0;

    // Add to cart buttons
    document.querySelectorAll('.add-cart-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            count++;
            if (cartCount) cartCount.textContent = count;

            // Animation feedback
            this.innerHTML = '<i class="fas fa-check"></i><span>Adicionado!</span>';
            this.style.background = '#28a745';

            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-shopping-bag"></i><span>Adicionar ao Carrinho</span>';
                this.style.background = '';
            }, 2000);
        });
    });
}

/* ========================================
   Back to Top Button
   ======================================== */
function initBackToTop() {
    const backToTop = document.getElementById('back-to-top');
    if (!backToTop) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ========================================
   WhatsApp Button
   ======================================== */
function initWhatsAppBtn() {
    const whatsappBtn = document.querySelector('.whatsapp-float');
    if (!whatsappBtn) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 200) {
            whatsappBtn.classList.add('visible');
        } else {
            whatsappBtn.classList.remove('visible');
        }
    });
}

/* ========================================
   Utility Functions
   ======================================== */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

window.showToast = showToast;
