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
   Hero Slider
   ======================================== */

function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const nextBtn = document.querySelector('.slider-next');
    const prevBtn = document.querySelector('.slider-prev');

    if (slides.length === 0) return;

    let currentSlide = 0;
    const intervalTime = 5000;
    let slideInterval;

    const nextSlide = () => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    };

    const prevSlide = () => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
    };

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

    // Start Auto Play
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
            alert('Visualização rápida do produto ' + productId);
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
                        <p>Seu carrinho está vazio</p>
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
                    showNotification('Seu carrinho está vazio!', 'error');
                    return;
                }

                let message = "Olá! Gostaria de finalizar meu pedido na Imports Company:\n\n";
                let total = 0;

                cart.forEach(item => {
                    const priceNumber = parseFloat(item.price.replace('R$ ', '').replace('.', '').replace(',', '.'));
                    total += priceNumber;
                    message += `✅ ${item.name}\n   Qtd: 1 | Valor: ${item.price}\n`;
                });

                const totalFormatted = total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                message += `\n💰 *Valor Total: R$ ${totalFormatted}*`;
                message += `\n\nQual a forma de pagamento?`;

                // Encode message for URL
                const encodedMessage = encodeURIComponent(message);
                const phone = "5531999716606"; // Seu número

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
            showNotification('E-mail cadastrado com sucesso! 🎉');
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

console.log('🛩️ Imports Company - Loja Online carregada com sucesso!');

/* ========================================
   CONFIGURAÇÃO YAMPI (LINKS DE CHECKOUT)
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

            // Get current cart
            let cart = JSON.parse(localStorage.getItem('importsCart')) || [];
            cart.push(product);
            localStorage.setItem('importsCart', JSON.stringify(cart));

            // Trigger UI update if possible (hacky since updateCartUI is inside another scope, 
            // but we can dispatch a custom event or reload page. ideally refactor, but for now:)
            // Let's just create a quick notification and manually update text
            showNotification('Produto adicionado ao carrinho!');
            this.innerHTML = '<i class="fas fa-check"></i> <span>Adicionado!</span>';
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-shopping-bag"></i> <span>Adicionar ao Carrinho</span>';
            }, 2000);

            // Try to find the count element and update it blindly
            const countJson = document.querySelector('.cart-count');
            if (countJson) countJson.textContent = cart.length;
        };

        // Configure Buy Now Button (Integração Yampi)
        const buyNowBtn = document.getElementById('modal-buy-now');
        buyNowBtn.onclick = function () {

            // Procura o link correspondente na lista YAMPI_LINKS
            let checkoutLink = null;
            for (const [key, link] of Object.entries(YAMPI_LINKS)) {
                if (name.includes(key)) {
                    checkoutLink = link;
                    break;
                }
            }

            if (checkoutLink && !checkoutLink.includes('SEU_LINK_AQUI')) {
                // Se achou um link válido configurado
                showNotification('Redirecionando para Pagamento Seguro...');
                setTimeout(() => {
                    window.open(checkoutLink, '_blank');
                    closeModal();
                }, 1000);
            } else {
                // Fallback: Se não configurou o link ainda, usa o WhatsApp ou avisa
                console.warn('Link Yampi não configurado para: ' + name);

                // Opção B: Mandar para o WhatsApp (segurança para não perder venda)
                const message = `Olá! Quero comprar o *${name}* que vi no site por ${price}.\nComo faço para pagar?`;
                const phone = "5531999716606";
                window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
            }
        };
    }

    function closeModal() {
        modalOverlay.classList.remove('open');
        document.body.style.overflow = '';
        // Hide lens just in case
        zoomLens.style.display = 'none';
    }

    // Zoom Logic
    function setupZoom(imgSrc) {
        // Update lens background image
        zoomLens.style.backgroundImage = `url('${imgSrc}')`;

        // Calculate ratios and setup events after image loads
        modalImage.onload = function () {
            // We need the image dimensions
            // Reset events to avoid duplicates
            imageContainer.onmousemove = moveLens;
            imageContainer.onmouseenter = () => zoomLens.style.display = 'block';
            imageContainer.onmouseleave = () => zoomLens.style.display = 'none';
        };
    }

    function moveLens(e) {
        e.preventDefault();

        // Get dimensions
        const containerRect = imageContainer.getBoundingClientRect();
        const imgRect = modalImage.getBoundingClientRect();

        // Calculate cursor position relative to image
        let x = e.pageX - containerRect.left - window.pageXOffset;
        let y = e.pageY - containerRect.top - window.pageYOffset;

        // Consider the image might be smaller than container (object-fit: contain)
        // For simplicity in this implementation, we assume the zoom works relative to the container center
        // A more complex implementation would calculate the exact image boundaries within the container

        // Lens position
        let lensX = x - (zoomLens.offsetWidth / 2);
        let lensY = y - (zoomLens.offsetHeight / 2);

        // Prevent lens from going outside container
        if (lensX > containerRect.width - zoomLens.offsetWidth) { lensX = containerRect.width - zoomLens.offsetWidth; }
        if (lensX < 0) { lensX = 0; }
        if (lensY > containerRect.height - zoomLens.offsetHeight) { lensY = containerRect.height - zoomLens.offsetHeight; }
        if (lensY < 0) { lensY = 0; }

        // Set lens position
        zoomLens.style.left = lensX + 'px';
        zoomLens.style.top = lensY + 'px';

        // Calculate zoom ratio (2x zoom for example)
        // We want to show the part of the image that is under the lens
        // The background image position needs to be moved in the opposite direction

        // Ratio of lens position in container (0 to 1)
        const fx = lensX / (containerRect.width - zoomLens.offsetWidth);
        const fy = lensY / (containerRect.height - zoomLens.offsetHeight);

        // Move background image. We zoom 2.5x
        const zoomLevel = 2.5;
        zoomLens.style.backgroundSize = `${containerRect.width * zoomLevel}px ${containerRect.height * zoomLevel}px`;

        // Calculate background position
        const bgX = fx * (containerRect.width * zoomLevel - zoomLens.offsetWidth);
        const bgY = fy * (containerRect.height * zoomLevel - zoomLens.offsetHeight);

        zoomLens.style.backgroundPosition = `-${bgX}px -${bgY}px`;
    }
};

// Initialize Modal
initModal();
