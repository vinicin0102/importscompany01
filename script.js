/* ========================================
   IMPORTS COMPANY - Script Premium
   Focado em UX e Performance
   ======================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Site Premium Carregado!');

    initHeader();
    initMobileMenu();
    initCart();
    initBannerCarousel();
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

/* ========================================
   4. Banner Carousel
   ======================================== */
let currentSlide = 0;
let carouselInterval;
let slideItems = []; // Renamed globally to avoid conflict

function goToSlide(index) {
    const slideElements = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dot');

    // Atualiza indices (Global state update)
    currentSlide = index;
    if (currentSlide >= slideElements.length) currentSlide = 0;
    if (currentSlide < 0) currentSlide = slideElements.length - 1;

    slideElements.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    // Mostra nova
    if (slideElements[currentSlide]) slideElements[currentSlide].classList.add('active');
    if (dots[currentSlide]) dots[currentSlide].classList.add('active');
}

function startCarousel() {
    if (carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
        moveSlide(1);
    }, 5000);
}

window.moveSlide = function (direction) {
    // Uses global currentSlide
    const nextIndex = currentSlide + direction;
    goToSlide(nextIndex);
};

async function initBannerCarousel() {
    try {
        const response = await fetch('/api/banners');
        const banners = await response.json();

        // Filtra ativos e ordena
        const activeBanners = banners.filter(b => b.active).sort((a, b) => (a.order || 0) - (b.order || 0));

        if (activeBanners.length === 0) return; // Mantém o default HTML se não houver banners

        const track = document.getElementById('hero-track');
        const indicators = document.getElementById('hero-indicators');

        track.innerHTML = '';
        indicators.innerHTML = '';
        slideItems = activeBanners;

        activeBanners.forEach((banner, index) => {
            // Slide
            const slide = document.createElement('div');
            slide.className = `carousel-slide ${index === 0 ? 'active' : ''}`;
            const bgImage = banner.image.startsWith('http') || banner.image.startsWith('/') ? banner.image : `../${banner.image}`;
            slide.style.backgroundImage = `url('${bgImage}')`;

            // Content (Title/Subtitle logic)
            // Somente adiciona Overlay/Titulo se houver Título definido
            if (banner.title) {
                const linkHtml = banner.link
                    ? `<a href="${banner.link}" class="btn">Saiba Mais <i class="fas fa-arrow-right"></i></a>`
                    : `<a href="#products" class="btn">Ver Coleção <i class="fas fa-arrow-right"></i></a>`;

                slide.innerHTML = `
                    <div class="hero-content">
                        <span class="hero-subtitle">Nova Coleção</span>
                        <h1 class="hero-title">${banner.title}</h1>
                        <p class="hero-desc">Descubra a exclusividade que só a Imports Company oferece.</p>
                        ${linkHtml}
                    </div>
                `;
            }

            track.appendChild(slide);

            // Indicator
            const dot = document.createElement('div');
            dot.className = `carousel-dot ${index === 0 ? 'active' : ''}`;
            dot.onclick = () => {
                goToSlide(index);
                startCarousel(); // Reset timer on interaction
            };
            indicators.appendChild(dot);
        });

        // Start Auto-play
        startCarousel();

    } catch (e) {
        console.warn('Banner loads failed', e);
    }
}
