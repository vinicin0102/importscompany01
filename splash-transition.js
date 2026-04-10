/* ========================================
   IMPORTS COMPANY - Splash & Page Transition
   Animação de avião para carregamento e transições
   ======================================== */

(function () {
    // Analytics: Ping backend to track active users (every 30 seconds)
    function pingActiveUser() {
        let sid = sessionStorage.getItem('sessionId');
        if (!sid) {
            sid = Math.random().toString(36).substring(2, 10);
            sessionStorage.setItem('sessionId', sid);
        }
        fetch('/api/ping?sid=' + sid).catch(() => {});
    }
    pingActiveUser(); // Send immediately on load
    setInterval(pingActiveUser, 30000); // Ping every 30s

    // Verifica se já existe splash no DOM (index.html tem inline)
    if (document.getElementById('splashScreen')) return;

    // ============================================
    // 1. INJETAR HTML DA SPLASH
    // ============================================
    const splashHTML = `
    <div id="splashScreen" class="splash-screen">
        <div class="splash-stars" id="splashStars"></div>
        <div class="splash-plane" id="splashPlane">
            <i class="fas fa-plane"></i>
            <div class="plane-trail"></div>
        </div>
        <div class="splash-particles" id="splashParticles"></div>
        <div class="splash-logo" id="splashLogo">
            <div class="logo-glow"></div>
            <img src="/images/logo_nova.png" alt="Imports Company" class="splash-logo-img">
            <div class="logo-ring"></div>
        </div>
        <div class="splash-text" id="splashText">
            <span class="splash-title">IMPORTS COMPANY</span>
            <span class="splash-subtitle">Luxo & Exclusividade</span>
        </div>
    </div>`;

    // ============================================
    // 2. INJETAR CSS DA SPLASH
    // ============================================
    const splashCSS = `
    .splash-screen {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: linear-gradient(135deg, #020617 0%, #0f172a 40%, #020617 100%);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        overflow: hidden;
        transition: opacity 0.8s ease, visibility 0.8s ease;
    }
    .splash-screen.fade-out { opacity: 0; visibility: hidden; }
    .splash-screen.hidden { display: none; }

    .splash-stars { position: absolute; inset: 0; pointer-events: none; }
    .splash-star {
        position: absolute; width: 3px; height: 3px;
        background: white; border-radius: 50%; opacity: 0;
        animation: starTwinkle 2s ease-in-out infinite;
    }
    @keyframes starTwinkle {
        0%, 100% { opacity: 0.1; transform: scale(0.5); }
        50% { opacity: 0.8; transform: scale(1.2); }
    }

    .splash-plane {
        position: absolute; font-size: 2.8rem; color: #c5a059;
        filter: drop-shadow(0 0 25px rgba(197, 160, 89, 0.9));
        transform: translate(-120vw, 40vh) rotate(-15deg);
        z-index: 10; opacity: 0;
    }
    .splash-plane.fly {
        animation: planeFly 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    @keyframes planeFly {
        0% { transform: translate(-120vw, 40vh) rotate(-15deg) scale(0.6); opacity: 0; }
        10% { opacity: 1; }
        50% { transform: translate(0vw, 0vh) rotate(-20deg) scale(1.2); opacity: 1; }
        70% { transform: translate(30vw, -15vh) rotate(-25deg) scale(1); opacity: 1; }
        100% { transform: translate(120vw, -50vh) rotate(-30deg) scale(0.5); opacity: 0; }
    }

    .plane-trail {
        position: absolute; top: 50%; right: 100%;
        width: 200px; height: 3px;
        background: linear-gradient(to left, rgba(197, 160, 89, 0.8), rgba(197, 160, 89, 0));
        transform: translateY(-50%); border-radius: 2px; filter: blur(1px);
    }

    .splash-particles { position: absolute; inset: 0; pointer-events: none; z-index: 5; }
    .splash-particle {
        position: absolute; width: 6px; height: 6px;
        background: #c5a059; border-radius: 50%; opacity: 0; filter: blur(1px);
    }
    .splash-particle.active {
        animation: particleFade 1.5s ease-out forwards;
    }
    @keyframes particleFade {
        0% { opacity: 1; transform: scale(1) translate(0, 0); }
        100% { opacity: 0; transform: scale(0) translate(var(--px), var(--py)); }
    }

    .splash-logo {
        position: relative; width: 150px; height: 150px;
        opacity: 0; transform: scale(0.3); z-index: 10;
    }
    .splash-logo.reveal {
        animation: logoReveal 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes logoReveal {
        0% { opacity: 0; transform: scale(0.3) rotate(-10deg); }
        60% { opacity: 1; transform: scale(1.1) rotate(3deg); }
        100% { opacity: 1; transform: scale(1) rotate(0); }
    }

    .splash-logo-img {
        width: 100%; height: 100%; border-radius: 50%; object-fit: cover;
        border: 3px solid #c5a059;
        box-shadow: 0 0 60px rgba(197, 160, 89, 0.5), 0 0 120px rgba(197, 160, 89, 0.2);
        position: relative; z-index: 2;
    }

    .logo-ring {
        position: absolute; top: -15px; left: -15px; right: -15px; bottom: -15px;
        border: 2px solid rgba(197, 160, 89, 0.3); border-radius: 50%; opacity: 0;
    }
    .splash-logo.reveal .logo-ring {
        animation: ringPulse 2s ease-out 0.5s forwards;
    }
    @keyframes ringPulse {
        0% { transform: scale(0.8); opacity: 0; }
        50% { opacity: 0.8; }
        100% { transform: scale(1.5); opacity: 0; }
    }

    .logo-glow {
        position: absolute; top: 50%; left: 50%; width: 200%; height: 200%;
        transform: translate(-50%, -50%);
        background: radial-gradient(circle, rgba(197, 160, 89, 0.15) 0%, transparent 70%);
        opacity: 0; z-index: 1;
    }
    .splash-logo.reveal .logo-glow {
        animation: glowAppear 1.5s ease-out 0.3s forwards;
    }
    @keyframes glowAppear {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }

    .splash-text {
        display: flex; flex-direction: column; align-items: center;
        gap: 8px; margin-top: 30px; opacity: 0;
        transform: translateY(20px); z-index: 10;
    }
    .splash-text.reveal {
        animation: textReveal 0.8s ease-out forwards;
    }
    @keyframes textReveal {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
    }

    .splash-title {
        font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700;
        color: #c5a059; letter-spacing: 8px;
        text-shadow: 0 0 30px rgba(197, 160, 89, 0.4);
    }
    .splash-subtitle {
        font-family: 'Inter', sans-serif; font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.6); letter-spacing: 5px;
        font-weight: 300; text-transform: uppercase;
    }

    @media (max-width: 768px) {
        .splash-logo { width: 120px; height: 120px; }
        .splash-title { font-size: 1.4rem; letter-spacing: 5px; }
        .splash-subtitle { font-size: 0.7rem; letter-spacing: 3px; }
        .splash-plane { font-size: 2rem; }
        .plane-trail { width: 120px; }
    }

    /* Transition overlay for page navigation */
    .page-transition-overlay {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: linear-gradient(135deg, #020617 0%, #0f172a 40%, #020617 100%);
        z-index: 99998;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.4s ease, visibility 0.4s ease;
        overflow: hidden;
    }
    .page-transition-overlay.active {
        opacity: 1;
        visibility: visible;
    }
    .transition-plane {
        font-size: 3rem; color: #c5a059;
        filter: drop-shadow(0 0 25px rgba(197, 160, 89, 0.9));
        animation: transitionPlaneFly 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    @keyframes transitionPlaneFly {
        0% { transform: translate(-50vw, 20vh) rotate(-15deg); opacity: 0; }
        20% { opacity: 1; }
        100% { transform: translate(60vw, -30vh) rotate(-25deg); opacity: 0.3; }
    }
    .transition-logo-mini {
        position: absolute;
        width: 80px; height: 80px;
        opacity: 0;
        animation: miniLogoAppear 0.6s ease-out 0.4s forwards;
    }
    .transition-logo-mini img {
        width: 100%; height: 100%; border-radius: 50%; object-fit: cover;
        border: 2px solid #c5a059;
        box-shadow: 0 0 40px rgba(197, 160, 89, 0.4);
    }
    @keyframes miniLogoAppear {
        0% { opacity: 0; transform: scale(0.5); }
        100% { opacity: 1; transform: scale(1); }
    }
    `;

    // Inject CSS
    const styleEl = document.createElement('style');
    styleEl.id = 'splash-transition-css';
    styleEl.textContent = splashCSS;
    document.head.appendChild(styleEl);

    // Inject Splash HTML
    document.body.insertAdjacentHTML('afterbegin', splashHTML);

    // Inject Transition Overlay
    const transitionHTML = `
    <div id="pageTransitionOverlay" class="page-transition-overlay">
        <div class="transition-plane"><i class="fas fa-plane"></i></div>
        <div class="transition-logo-mini"><img src="/images/logo_nova.png" alt="IC"></div>
    </div>`;
    document.body.insertAdjacentHTML('afterbegin', transitionHTML);

    // ============================================
    // 3. SPLASH SCREEN ANIMATION (entrada)
    // ============================================
    function runSplashAnimation() {
        const splash = document.getElementById('splashScreen');
        if (!splash) return;

        document.body.style.overflow = 'hidden';

        // Stars
        const starsContainer = document.getElementById('splashStars');
        for (let i = 0; i < 60; i++) {
            const star = document.createElement('div');
            star.className = 'splash-star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.width = (Math.random() * 3 + 1) + 'px';
            star.style.height = star.style.width;
            star.style.animationDelay = (Math.random() * 3) + 's';
            star.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
            starsContainer.appendChild(star);
        }

        // Particles
        const particlesContainer = document.getElementById('splashParticles');
        function spawnParticles() {
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const particle = document.createElement('div');
                    particle.className = 'splash-particle';
                    particle.style.left = (30 + Math.random() * 40) + '%';
                    particle.style.top = (30 + Math.random() * 40) + '%';
                    particle.style.setProperty('--px', (Math.random() * 100 - 50) + 'px');
                    particle.style.setProperty('--py', (Math.random() * 100 - 50) + 'px');
                    particle.style.width = (Math.random() * 5 + 2) + 'px';
                    particle.style.height = particle.style.width;
                    particlesContainer.appendChild(particle);
                    requestAnimationFrame(() => particle.classList.add('active'));
                    setTimeout(() => particle.remove(), 1500);
                }, i * 80);
            }
        }

        const plane = document.getElementById('splashPlane');
        const logo = document.getElementById('splashLogo');
        const text = document.getElementById('splashText');

        setTimeout(() => plane.classList.add('fly'), 300);
        setTimeout(() => spawnParticles(), 1200);
        setTimeout(() => logo.classList.add('reveal'), 1400);
        setTimeout(() => text.classList.add('reveal'), 1900);
        setTimeout(() => {
            splash.classList.add('fade-out');
            document.body.style.overflow = '';
        }, 3200);
        setTimeout(() => splash.classList.add('hidden'), 4000);
    }

    runSplashAnimation();

    // ============================================
    // 4. PAGE TRANSITION (ao clicar em links)
    // ============================================
    function showTransitionAndNavigate(url) {
        const overlay = document.getElementById('pageTransitionOverlay');
        if (!overlay) {
            window.location.href = url;
            return;
        }

        // Reset animation by cloning
        const planeEl = overlay.querySelector('.transition-plane');
        const logoEl = overlay.querySelector('.transition-logo-mini');
        const newPlane = planeEl.cloneNode(true);
        const newLogo = logoEl.cloneNode(true);
        planeEl.replaceWith(newPlane);
        logoEl.replaceWith(newLogo);

        overlay.classList.add('active');

        // Navigate after transition
        setTimeout(() => {
            window.location.href = url;
        }, 800);
    }

    // Intercept internal links
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        if (!href) return;

        // Skip external links, anchors, javascript:, mailto:, tel:, whatsapp
        if (href.startsWith('#') ||
            href.startsWith('javascript:') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            href.startsWith('https://wa.me') ||
            href.startsWith('https://checkout.') ||
            href.includes('stripe.com') ||
            href.includes('yampi.com') ||
            link.target === '_blank') {
            return;
        }

        // Only intercept internal navigation (.html pages or relative paths)
        if (href.endsWith('.html') ||
            href === '/' ||
            href.startsWith('/') ||
            href.startsWith('index') ||
            href.startsWith('cart') ||
            href.startsWith('public/')) {
            e.preventDefault();
            showTransitionAndNavigate(href);
        }
    });

    // Also intercept form submits and programmatic navigation for checkout
    window.navigateWithTransition = showTransitionAndNavigate;

})();

