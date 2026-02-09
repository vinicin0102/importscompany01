/* ========================================
   IMPORTS COMPANY - JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', function () {
    // Initialize all components
    initParticles();
    initHeroSlider();
    initHeader();
    initMobileNav();
    initScrollAnimations();
    initProductFilter();
    initCart();
    initBackToTop();
    initNewsletterForm();
    initCounters();
    smoothScroll();
});

/* ========================================
   Particles Background
   ======================================== */

/* ========================================
   Hero Slider (Dynamic from API)
   ======================================== */

async function initHeroSlider() {
    const sliderContainer = document.querySelector('.hero-slider');
    if (!sliderContainer) return;

    try {
        // Tenta buscar banners da API
        const response = await fetch('/api/banners');
        if (response.ok) {
            const banners = await response.json();
            const activeBanners = banners.filter(b => b.active);

            if (activeBanners.length > 0) {
                activeBanners.sort((a, b) => a.order - b.order);
                // NÃO remover slides existentes - manter fallback do HTML
                // const oldSlides = sliderContainer.querySelectorAll('.hero-slide');
                // oldSlides.forEach(s => s.remove());

                activeBanners.forEach((banner, index) => {
                    const slide = document.createElement('div');
                    slide.className = `hero-slide ${index === 0 ? 'active' : ''}`;
                    const imageUrl = banner.image.startsWith('http') ? banner.image : `${banner.image}`;

                    slide.innerHTML = `
                        <div class="hero-bg" style="background-image: url('${imageUrl}');"></div>
                        <div class="hero-overlay" style="opacity: ${banner.overlay || 0.5}"></div>
                        <div class="hero-content ${banner.position || 'center'}">
                            <h1 class="animate-up">${banner.title}</h1>
                            <p class="animate-up delay-100">${banner.subtitle}</p>
                            ${banner.buttonText ? `<a href="${banner.link || '#'}" class="btn btn-primary animate-up delay-200">${banner.buttonText} <i class="fas fa-arrow-right"></i></a>` : ''}
                        </div>
                    `;
                    // Insere antes dos controles
                    const controls = sliderContainer.querySelector('.slider-controls');
                    if (controls) sliderContainer.insertBefore(slide, controls);
                    else sliderContainer.appendChild(slide);
                });
            }
        }
    } catch (e) {
        console.warn('Usando banners padrÃ£o (API offline ou erro):', e);
    }

    // LÃ³gica do Slider
    const slides = document.querySelectorAll('.hero-slide');
    const nextBtn = document.querySelector('.slider-next');
    const prevBtn = document.querySelector('.slider-prev');

    if (slides.length === 0) return;

    let currentSlide = 0;
    const intervalTime = 5000;
    let slideInterval;

    const showSlide = (n) => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (n + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
    };

    const nextSlideFunc = () => showSlide(currentSlide + 1);
    const prevSlideFunc = () => showSlide(currentSlide - 1);

    if (nextBtn) {
        const newNext = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNext, nextBtn);
        newNext.addEventListener('click', () => {
            nextSlideFunc();
            resetInterval();
        });
    }

    if (prevBtn) {
        const newPrev = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrev, prevBtn);
        newPrev.addEventListener('click', () => {
            prevSlideFunc();
            resetInterval();
        });
    }

    function startInterval() {
        slideInterval = setInterval(nextSlideFunc, intervalTime);
    }

    function resetInterval() {
        clearInterval(slideInterval);
        startInterval();
    }

    startInterval();
}

/* ========================================
   Particles Background
   ======================================== */

function initParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        createParticle(particlesContainer, i);
    }
}

function createParticle(container, index) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    const size = Math.random() * 4 + 2;
    const left = Math.random() * 100;
    const delay = Math.random() * 15;
    const duration = Math.random() * 10 + 10;

    particle.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${left}%;
        animation-delay: ${delay}s;
        animation-duration: ${duration}s;
    `;

    container.appendChild(particle);
}

/* ========================================
   Header Scroll Effect
   ======================================== */

function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
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
   Scroll Animations
   ======================================== */

function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 100);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(element => {
            observer.observe(element);
        });
    } else {
        // Fallback for browsers without IntersectionObserver
        animatedElements.forEach(element => {
            element.classList.add('visible');
        });
    }
}

/* ========================================
   Product Filter
   ======================================== */

function initProductFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.dataset.filter;

            // Filter products
            productCards.forEach(card => {
                const category = card.dataset.category;
                const shouldShow = filter === 'all' || category === filter;

                if (shouldShow) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 10);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // Quick view functionality
    const quickViewButtons = document.querySelectorAll('.quick-view-btn');
    quickViewButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const productId = button.dataset.product;
            // You can implement a modal or redirect to product page
            console.log('Quick view product:', productId);
            alert('VisualizaÃ§Ã£o rÃ¡pida do produto ' + productId);
        });
    });
}

/* ========================================
   Cart Functionality
   ======================================== */

function initCart() {
    const cartBtn = document.getElementById('cart-btn');
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCart = document.getElementById('close-cart');
    const addToCartButtons = document.querySelectorAll('.add-cart-btn');
    const cartCount = document.querySelector('.cart-count');
    const cartItems = document.getElementById('cart-items');
    const totalValue = document.querySelector('.total-value');

    let cart = JSON.parse(localStorage.getItem('importsCart')) || [];

    updateCartUI();

    // Open cart
    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            cartSidebar.classList.add('open');
            cartOverlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        });
    }

    // Close cart
    function closeCartSidebar() {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (closeCart) {
        closeCart.addEventListener('click', closeCartSidebar);
    }

    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCartSidebar);
    }

    // Add to cart
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function () {
            const productCard = this.closest('.product-card');
            const productName = productCard.querySelector('.product-name').textContent;
            const productPrice = productCard.querySelector('.price-current').textContent;
            const productImage = productCard.querySelector('.product-image img').src;
            const productCategory = productCard.querySelector('.product-category').textContent;

            const product = {
                id: Date.now(),
                name: productName,
                price: productPrice,
                image: productImage,
                category: productCategory,
                quantity: 1
            };

            cart.push(product);
            localStorage.setItem('importsCart', JSON.stringify(cart));
            updateCartUI();

            // Animation feedback
            this.innerHTML = '<i class="fas fa-check"></i> <span>Adicionado!</span>';
            this.style.background = 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)';

            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-shopping-bag"></i> <span>Adicionar ao Carrinho</span>';
                this.style.background = '';
            }, 2000);

            // Show notification
            showNotification('Produto adicionado ao carrinho!');
        });
    });

    function updateCartUI() {
        // Update cart count
        if (cartCount) {
            cartCount.textContent = cart.length;
        }

        // Update cart items
        if (cartItems) {
            if (cart.length === 0) {
                cartItems.innerHTML = `
                    <div class="empty-cart">
                        <i class="fas fa-shopping-bag"></i>
                        <p>Seu carrinho estÃ¡ vazio</p>
                        <a href="#products" class="btn btn-primary btn-sm" onclick="closeCartSidebar()">Ver Produtos</a>
                    </div>
                `;
            } else {
                cartItems.innerHTML = cart.map((item, index) => `
                    <div class="cart-item" style="display: flex; gap: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 8px; margin-bottom: 1rem;">
                        <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                        <div style="flex: 1;">
                            <h4 style="font-size: 0.875rem; margin-bottom: 4px;">${item.name}</h4>
                            <p style="color: #c9a84c; font-weight: 600;">${item.price}</p>
                        </div>
                        <button onclick="removeFromCart(${index})" style="background: none; color: #dc3545; cursor: pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
            }
        }

        // Update total
        if (totalValue) {
            const total = cart.reduce((sum, item) => {
                const price = parseFloat(item.price.replace('R$ ', '').replace('.', '').replace(',', '.'));
                return sum + price;
            }, 0);
            totalValue.textContent = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }

        // Configure Checkout Button
        const checkoutBtn = document.querySelector('.cart-footer .btn-primary');
        if (checkoutBtn) {
            checkoutBtn.onclick = function () {
                if (cart.length === 0) {
                    showNotification('Seu carrinho estÃ¡ vazio!', 'error');
                    return;
                }

                let message = "OlÃ¡! Gostaria de finalizar meu pedido na Imports Company:\n\n";
                let total = 0;

                cart.forEach(item => {
                    const priceNumber = parseFloat(item.price.replace('R$ ', '').replace('.', '').replace(',', '.'));
                    total += priceNumber;
                    message += `âœ… ${item.name}\n   Qtd: 1 | Valor: ${item.price}\n`;
                });

                const totalFormatted = total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                message += `\nðŸ’° *Valor Total: R$ ${totalFormatted}*`;
                message += `\n\nQual a forma de pagamento?`;

                // Encode message for URL
                const encodedMessage = encodeURIComponent(message);
                const phone = "5531999716606"; // Seu nÃºmero

                showNotification('Gerando pedido no WhatsApp...');
                setTimeout(() => {
                    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
                }, 1000);
            };
        }
    }

    // Make removeFromCart globally accessible
    window.removeFromCart = function (index) {
        cart.splice(index, 1);
        localStorage.setItem('importsCart', JSON.stringify(cart));
        updateCartUI();
        showNotification('Produto removido do carrinho');
    };

    window.closeCartSidebar = closeCartSidebar;
}

/* ========================================
   Notification System
   ======================================== */

function showNotification(message, type = 'success') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'linear-gradient(135deg, #28a745 0%, #1e7e34 100%)' : 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Add keyframes animation
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/* ========================================
   Back to Top Button
   ======================================== */

function initBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 500) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/* ========================================
   Newsletter Form
   ======================================== */

function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = form.querySelector('input[type="email"]').value;

        // Simulate form submission
        form.querySelector('button').innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Enviando...</span>';

        setTimeout(() => {
            showNotification('E-mail cadastrado com sucesso! ðŸŽ‰');
            form.reset();
            form.querySelector('button').innerHTML = '<span>Cadastrar</span> <i class="fas fa-paper-plane"></i>';
        }, 1500);
    });
}

/* ========================================
   Counter Animation
   ======================================== */

function initCounters() {
    const counters = document.querySelectorAll('.stat-number');

    const observerOptions = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.dataset.count);
                animateCounter(counter, target);
                observer.unobserve(counter);
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        observer.observe(counter);
    });
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    const duration = 2000;
    const stepTime = duration / 50;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString('pt-BR');
            if (element.closest('.stat').querySelector('.stat-label').textContent.includes('%')) {
                element.textContent += '%';
            } else {
                element.textContent += '+';
            }
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString('pt-BR');
        }
    }, stepTime);
}

/* ========================================
   Smooth Scroll
   ======================================== */

function smoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerHeight = document.getElementById('header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* ========================================
   Search Functionality
   ======================================== */

const searchInput = document.querySelector('.search-input');
if (searchInput) {
    searchInput.addEventListener('input', debounce(function (e) {
        const searchTerm = e.target.value.toLowerCase();
        const products = document.querySelectorAll('.product-card');

        products.forEach(product => {
            const name = product.querySelector('.product-name').textContent.toLowerCase();
            const category = product.querySelector('.product-category').textContent.toLowerCase();

            if (name.includes(searchTerm) || category.includes(searchTerm)) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        });
    }, 300));
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/* ========================================
   Active Navigation Link
   ======================================== */

window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        if (window.pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

/* ========================================
   Image Lazy Loading
   ======================================== */

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

/* ========================================
   Keyboard Navigation
   ======================================== */

document.addEventListener('keydown', (e) => {
    // Close cart with Escape
    if (e.key === 'Escape') {
        const cartSidebar = document.getElementById('cart-sidebar');
        const nav = document.getElementById('nav');

        if (cartSidebar && cartSidebar.classList.contains('open')) {
            window.closeCartSidebar();
        }

        if (nav && nav.classList.contains('open')) {
            const menuToggle = document.getElementById('menu-toggle');
            menuToggle.classList.remove('active');
            nav.classList.remove('open');
            document.body.style.overflow = '';
        }
    }
});

console.log('ðŸ›©ï¸ Imports Company - Loja Online carregada com sucesso!');

/* ========================================
   CONFIGURAÃ‡ÃƒO YAMPI (LINKS DE CHECKOUT)
   ========================================
   Cole aqui os links de checkout dos seus produtos na Yampi.
   A chave (lado esquerdo) deve conter parte do nome do produto.
*/
const YAMPI_LINKS = {
    "iPhone": "https://seguro.yampi.com.br/r/SEU_LINK_AQUI_IPHONE",
    "AirPods": "https://seguro.yampi.com.br/r/SEU_LINK_AQUI_AIRPODS",
    "Watch": "https://seguro.yampi.com.br/r/SEU_LINK_AQUI_WATCH",
    "PlayStation": "https://seguro.yampi.com.br/r/SEU_LINK_AQUI_PS5",
    "Opulence": "https://seguro.yampi.com.br/r/SEU_LINK_AQUI_PERFUME",
    "Nike": "https://seguro.yampi.com.br/r/SEU_LINK_AQUI_NIKE",
    "Bolsa": "https://seguro.yampi.com.br/r/SEU_LINK_AQUI_BOLSA",
    // Adicione mais produtos aqui
};

/* ========================================
   Product Modal & Zoom Functionality
   ======================================== */

// Make initModal globally accessible so we can call it if needed
window.initModal = function () {
    const modalOverlay = document.getElementById('product-modal-overlay');
    const closeModalBtn = document.getElementById('close-modal');
    const modalImage = document.getElementById('modal-product-image');
    const zoomLens = document.getElementById('zoom-lens');
    const imageContainer = document.querySelector('.modal-image-container');

    // Quick View Buttons Logic
    document.querySelectorAll('.quick-view-btn').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const productCard = this.closest('.product-card');
            openModal(productCard);
        });
    });

    // Close Modal Logic
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
            closeModal();
        }
    });

    function openModal(productCard) {
        // Extract Data
        const imageSrc = productCard.querySelector('.product-image img').src;
        const category = productCard.querySelector('.product-category').textContent;
        const name = productCard.querySelector('.product-name').textContent;
        const price = productCard.querySelector('.price-current').textContent;
        const installment = productCard.querySelector('.price-installment').textContent;

        // Populate Modal
        document.getElementById('modal-product-image').src = imageSrc;
        document.getElementById('modal-product-category').textContent = category;
        document.getElementById('modal-product-name').textContent = name;
        document.getElementById('modal-product-price').textContent = price;
        // Update installment text if needed, stripping "ou "
        // document.querySelector('.modal-installments').textContent = installment; 

        // Show Modal
        modalOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';

        // Setup Zoom for this image
        setupZoom(imageSrc);

        // Configure Add to Cart Button in Modal
        const addToCartBtn = document.getElementById('modal-add-cart');
        addToCartBtn.onclick = function () {
            // Re-use the existing logic or simpler:
            const product = {
                id: Date.now(),
                name: name,
                price: price,
                image: imageSrc,
                category: category,
                quantity: 1
            };

            // Assuming cart functions are global or accessible
            let cart = JSON.parse(localStorage.getItem('importsCart')) || [];
            cart.push(product);
            localStorage.setItem('importsCart', JSON.stringify(cart));

            // Se as funÃ§Ãµes de UI do carrinho forem globais:
            // updateCartUI(); 
            // Mas como estÃ£o dentro de initCart, nÃ£o temos acesso direto sem expor.
            // Para simplificar, vou recarregar a pÃ¡gina ou disparar evento.
            // O ideal seria que initCart expusesse updateCartUI.
            // Vou apenas fechar o modal e mostrar notificaÃ§Ã£o.

            closeModal();
            showNotification('Produto adicionado ao carrinho!');
            setTimeout(() => location.reload(), 1000); // Hack simples para atualizar carrinho
        };
    }

    function closeModal() {
        modalOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    function setupZoom(imageSrc) {
        imageContainer.style.backgroundImage = `url('${imageSrc}')`;

        imageContainer.addEventListener('mousemove', moveLens);
        imageContainer.addEventListener('mouseleave', () => {
            imageContainer.style.backgroundPosition = 'center';
            imageContainer.style.backgroundSize = 'contain';
        });

        function moveLens(e) {
            const rect = imageContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const xPercent = (x / rect.width) * 100;
            const yPercent = (y / rect.height) * 100;

            imageContainer.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
            imageContainer.style.backgroundSize = '200%'; // Zoom level
        }
    }
}

/* ========================================
   Notificações de Venda (Urotestom)
   ======================================== */

function initFakeSales() {
    // Lista extensa de nomes masculinos para não repetir
    const names = [
        'José', 'João', 'Antônio', 'Francisco', 'Carlos', 'Paulo', 'Pedro', 'Lucas', 'Luiz', 'Marcos',
        'Luis', 'Gabriel', 'Rafael', 'Daniel', 'Marcelo', 'Bruno', 'Eduardo', 'Felipe', 'Raimundo', 'Rodrigo',
        'Manoel', 'Mateus', 'André', 'Fernando', 'Fábio', 'Leonardo', 'Gustavo', 'Guilherme', 'Leandro', 'Tiago',
        'Ângelo', 'Alexandre', 'Ricardo', 'Raul', 'Sergio', 'Vitor', 'Thiago', 'Anderson', 'Joaquim', 'Roberto',
        'Jorge', 'Samuel', 'Mario', 'Gilberto', 'Diego', 'Victor', 'Cláudio', 'Otávio', 'Caio', 'Júlio',
        'César', 'Renato', 'Murilo', 'Rogério', 'Breno', 'Arthur', 'Henrique', 'Alberto', 'Luciano', 'Ronaldo'
    ];

    // Variações de mensagem (exatamente como pedido)
    const actions = [
        'adquiriu Urotestom 3 meses',
        'acabou de comprar 5 meses Urotestom',
        'acabou de comprar Amostra Grátis Urotestom',
        'garantiu o kit 3 meses Urotestom',
        'aproveitou a oferta Urotestom 5 meses',
        'solicitou Amostra Grátis Urotestom',
        'comprou o tratamento 3 meses Urotestom'
    ];

    // Cidades para dar mais realismo (opcional, pode ser removido se quiser só a frase exata)
    const cities = [
        'São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Curitiba, PR', 
        'Porto Alegre, RS', 'Salvador, BA', 'Brasília, DF', 'Fortaleza, CE', 
        'Recife, PE', 'Goiânia, GO', 'Manaus, AM', 'Belém, PA'
    ];

    // Estado interno para evitar repetição recente
    let availableNames = [...names];
    
    // Função para embaralhar array
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Embaralha nomes inicialmente
    shuffle(availableNames);

    function createNotification() {
        // Se acabarem os nomes, recomeça
        if (availableNames.length === 0) {
            availableNames = shuffle([...names]);
        }

        const name = availableNames.pop(); // Pega um nome único da pilha
        const action = actions[Math.floor(Math.random() * actions.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        const timeAgo = Math.floor(Math.random() * 5) + 1; // 1 a 5 min atrás

        // Remove notificação anterior se houver
        const existing = document.querySelector('.sales-notification');
        if (existing) existing.remove();

        const notif = document.createElement('div');
        notif.className = 'sales-notification';
        notif.innerHTML = \
            <div class='sales-notification-icon'>
                <i class='fas fa-check-circle'></i>
            </div>
            <div class='sales-notification-content'>
                <h4>\</h4>
                <p>\</p>
                <div class='sales-notification-time'>Há \ minutos • \</div>
            </div>
        \;

        document.body.appendChild(notif);

        // Animação de entrada
        setTimeout(() => notif.classList.add('visible'), 100);

        // Remove após 5 segundos
        setTimeout(() => {
            notif.classList.remove('visible');
            setTimeout(() => notif.remove(), 600);
        }, 5000);
    }

    // Loop infinito de notificações
    function startLoop() {
        // Primeira notificação rápida (3s)
        setTimeout(() => {
            createNotification();
            
            // Depois, a cada 10-20 segundos
            setInterval(() => {
                createNotification();
            }, Math.random() * 10000 + 10000); // Entre 10s e 20s
        }, 3000);
    }

    startLoop();
}

// Inicia automaticamente
initFakeSales();


