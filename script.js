/* ==========================================================================
   SALTALIA — interactions v2
   ========================================================================== */
(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- loader ---------- */
  const loader = document.querySelector('.loader');
  const finishLoading = () => {
    if (loader) loader.classList.add('is-done');
    document.body.classList.remove('is-locked');
    document.body.classList.add('is-ready');
  };
  if (loader) {
    window.setTimeout(finishLoading, prefersReducedMotion ? 0 : 1500);
  } else {
    document.body.classList.add('is-ready');
  }

  /* ---------- star field ---------- */
  const canvas = document.querySelector('#starCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let stars = [];
  let shootingStars = [];
  let scrollY = 0;

  function resizeCanvas() {
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    createStars();
  }

  function createStars() {
    const count = Math.floor((window.innerWidth * window.innerHeight) / 9000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.5 + 0.25,
      a: Math.random() * 0.65 + 0.2,
      speed: Math.random() * 0.018 + 0.006,
      phase: Math.random() * Math.PI * 2,
      depth: Math.random() * 0.6 + 0.2 // parallax layer
    }));
  }

  function spawnShootingStar() {
    shootingStars.push({
      x: Math.random() * window.innerWidth * 0.7 + window.innerWidth * 0.3,
      y: Math.random() * window.innerHeight * 0.35,
      vx: -(5 + Math.random() * 5),
      vy: 2.2 + Math.random() * 2.4,
      life: 1
    });
  }

  function drawStars(time) {
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const h = window.innerHeight;

    for (const s of stars) {
      const twinkle = s.a + Math.sin(time * s.speed + s.phase) * 0.16;
      // subtle parallax: deeper stars move slower against scroll
      const py = (s.y - scrollY * s.depth * 0.12) % h;
      const y = py < 0 ? py + h : py;
      ctx.beginPath();
      ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,253,245,${Math.max(0.1, twinkle)})`;
      ctx.fill();
    }

    shootingStars = shootingStars.filter((s) => s.life > 0);
    for (const s of shootingStars) {
      const tail = 16;
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * tail, s.y - s.vy * tail);
      grad.addColorStop(0, `rgba(255,248,225,${0.9 * s.life})`);
      grad.addColorStop(1, 'rgba(255,248,225,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.vx * tail, s.y - s.vy * tail);
      ctx.stroke();
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.017;
    }

    requestAnimationFrame(drawStars);
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  if (ctx && !prefersReducedMotion) {
    requestAnimationFrame(drawStars);
    window.setInterval(() => { if (Math.random() < 0.55) spawnShootingStar(); }, 4000);
  } else if (ctx) {
    drawStars(0);
  }

  /* ---------- header / progress / parallax ---------- */
  const header = document.querySelector('.site-header');
  const progressBar = document.querySelector('#progressBar');
  const heroImage = document.querySelector('#heroImage');
  let ticking = false;

  function onScroll() {
    scrollY = window.scrollY;
    if (header) header.classList.toggle('is-scrolled', scrollY > 50);
    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    }
    if (heroImage && !prefersReducedMotion && scrollY < window.innerHeight * 1.2) {
      heroImage.style.transform = `scale(1.06) translateY(${scrollY * 0.14}px)`;
    }
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ---------- fullscreen menu ---------- */
  const menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('is-locked', open);
    });
    document.querySelectorAll('.menu-nav a').forEach((link) => {
      link.addEventListener('click', () => {
        document.body.classList.remove('menu-open', 'is-locked');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) {
        document.body.classList.remove('menu-open', 'is-locked');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- clock ---------- */
  const clock = document.querySelector('#clock');
  if (clock) {
    const tick = () => {
      const now = new Date();
      const p = (n) => String(n).padStart(2, '0');
      clock.textContent = `JST ${p(now.getHours())}:${p(now.getMinutes())}:${p(now.getSeconds())}`;
    };
    tick();
    window.setInterval(tick, 1000);
  }

  /* ---------- reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal, .reveal-line').forEach((el) => revealObserver.observe(el));

  /* ---------- mouse sparkles ---------- */
  let sparkleTick = 0;
  function createSparkle(x, y) {
    if (prefersReducedMotion) return;
    const sparkle = document.createElement('span');
    sparkle.className = `mouse-sparkle ${Math.random() > 0.55 ? 'small' : ''}`.trim();
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;
    sparkle.style.setProperty('--dx', `${(Math.random() - 0.5) * 16}px`);
    sparkle.style.setProperty('--dy', `${-8 - Math.random() * 14}px`);
    sparkle.style.animationDuration = `${650 + Math.random() * 320}ms`;
    document.body.appendChild(sparkle);
    window.setTimeout(() => sparkle.remove(), 1100);
  }
  window.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;
    sparkleTick += 1;
    if (sparkleTick % 3 !== 0) return;
    createSparkle(event.clientX + (Math.random() - 0.5) * 10, event.clientY + (Math.random() - 0.5) * 10);
  });
})();
