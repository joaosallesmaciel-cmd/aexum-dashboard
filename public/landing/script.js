/* ================================== */
/* AEXUM — Landing Page Scripts        */
/* ================================== */

(function () {
  'use strict';

  // ============= 1. NAVBAR SCROLL EFFECT =============
  const navbar = document.getElementById('navbar');

  function handleScroll() {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // ============= 2. MOBILE MENU TOGGLE =============
  const navToggle = document.getElementById('navToggle');
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navbar.classList.toggle('mobile-open');
    });

    // Fecha o menu ao clicar em um link
    document.querySelectorAll('.navbar__links a').forEach(link => {
      link.addEventListener('click', () => {
        navbar.classList.remove('mobile-open');
      });
    });
  }

  // ============= 3. SCROLL REVEAL (Intersection Observer) =============
  const revealEls = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Pequeno delay escalonado para elementos no mesmo grid
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -50px 0px'
  });

  revealEls.forEach((el, i) => {
    // Aplica delay escalonado em elementos irmãos
    const parent = el.parentElement;
    const siblings = Array.from(parent.querySelectorAll('.reveal'));
    if (siblings.length > 1 && siblings.length < 8) {
      const index = siblings.indexOf(el);
      el.dataset.delay = index * 80;
    }
    revealObserver.observe(el);
  });

  // ============= 4. CONTADOR ANIMADO DE MÉTRICAS =============
  const counters = document.querySelectorAll('[data-counter]');

  function animateCounter(el) {
    const target = parseFloat(el.dataset.counter);
    const suffix = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimals || '0');
    const duration = 2000;
    const startTime = performance.now();

    function easeOutQuad(t) {
      return 1 - (1 - t) * (1 - t);
    }

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuad(progress);
      const current = target * eased;

      el.textContent = current.toFixed(decimals) + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toFixed(decimals) + suffix;
      }
    }

    requestAnimationFrame(update);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => counterObserver.observe(counter));

  // ============= 5. PARTÍCULAS NO HERO (Canvas) =============
  const canvas = document.getElementById('particlesCanvas');

  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    let width, height;

    // Detecta se é mobile para reduzir densidade
    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 30 : 60;
    const CONNECT_DISTANCE = isMobile ? 100 : 140;
    const PARTICLE_COLOR = 'rgba(137, 217, 87, ';

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      width = rect.width;
      height = rect.height;
    }

    class Particle {
      constructor() {
        this.reset();
        this.y = Math.random() * height;
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.radius = Math.random() * 1.5 + 0.8;
        this.opacity = Math.random() * 0.5 + 0.3;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = PARTICLE_COLOR + this.opacity + ')';
        ctx.fill();
      }
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(new Particle());
      }
    }

    function connectParticles() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < CONNECT_DISTANCE) {
            const opacity = (1 - distance / CONNECT_DISTANCE) * 0.25;
            ctx.beginPath();
            ctx.strokeStyle = PARTICLE_COLOR + opacity + ')';
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      connectParticles();
      animationId = requestAnimationFrame(animate);
    }

    function startParticles() {
      resizeCanvas();
      initParticles();
      animate();
    }

    // Pausa animação quando aba não está visível (economia de recursos)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        animate();
      }
    });

    // Reinicia no resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cancelAnimationFrame(animationId);
        startParticles();
      }, 200);
    });

    // Respeita preferência de movimento reduzido
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      startParticles();
    }
  }

  // ============= 6. SMOOTH SCROLL PARA LINKS ÂNCORA =============
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href.length <= 1) return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ============= 7. FAQ — FECHA OUTROS AO ABRIR UM =============
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    item.addEventListener('toggle', (e) => {
      if (item.open) {
        faqItems.forEach(other => {
          if (other !== item && other.open) {
            other.open = false;
          }
        });
      }
    });
  });

  // ============= 8. TILT SUTIL NOS CARDS DE FEATURES (desktop only) =============
  if (window.matchMedia('(hover: hover) and (min-width: 1024px)').matches) {
    const tiltCards = document.querySelectorAll('.feature-card');

    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -3;
        const rotateY = ((x - centerX) / centerX) * 3;

        card.style.transform = `translateY(-6px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

})();
