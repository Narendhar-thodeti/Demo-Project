/* =============================================
   script.js — Foodie Restaurant
   One-card-at-a-time infinite looping carousel
   ============================================= */
   (function () {
    'use strict';
  
    /* ============================================
       CART
    ============================================= */
    let cartCount = 0;
    const cartBadge = document.getElementById('cartCount');
  
    function bumpCart() {
      cartCount++;
      cartBadge.textContent = cartCount;
      cartBadge.style.transition = 'transform 0.18s ease';
      cartBadge.style.transform  = 'scale(1.6)';
      setTimeout(() => { cartBadge.style.transform = 'scale(1)'; }, 220);
    }
  
    /* ============================================
       TOAST
    ============================================= */
    const toastBox = document.getElementById('toastBox');
    const toastMsg = document.getElementById('toastMsg');
    let toastTimer;
    function showToast(msg) {
      toastMsg.textContent = msg;
      toastBox.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastBox.classList.remove('show'), 2600);
    }
  
    /* ============================================
       ADD TO CART  (event delegation — works on clones too)
    ============================================= */
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('.dish-card__btn');
      if (!btn) return;
      const name = btn.dataset.name || 'Item';
      btn.classList.add('added');
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
      bumpCart();
      showToast('"' + name + '" added to cart!');
      setTimeout(() => {
        btn.classList.remove('added');
        btn.innerHTML = '<i class="fa-solid fa-plus"></i> Add to Cart';
      }, 1800);
    });
  
    /* ============================================
       INFINITE CAROUSEL
       Technique: clone N slides at front + back.
       Real slides start at index N.
       On transitionend → silently jump back to real zone.
    ============================================= */
    const track    = document.getElementById('dishesTrack');
    const prevBtn  = document.getElementById('prevBtn');
    const nextBtn  = document.getElementById('nextBtn');
    const dotsEl   = document.getElementById('dishesDots');
  
    if (!track || !prevBtn || !nextBtn) return;
  
    /* ── 1. Snapshot original slides ── */
    const originals = Array.from(track.querySelectorAll('.dishes__slide'));
    const N = originals.length;   // 8
  
    /* ── 2. Clone N slides at END, then N at START ── */
    originals.forEach(el => {
      const c = el.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      track.appendChild(c);
    });
    [...originals].reverse().forEach(el => {
      const c = el.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      track.insertBefore(c, track.firstChild);
    });
  
    /* After cloning, total slides = 3N; real zone = [N … 2N-1] */
  
    /* ── 3. State ── */
    let pos        = N;   // current index inside the full (3N) list, starts at first real
    let busy       = false;
    const GAP      = 20; // must match CSS gap
  
    /* ── 4. Helpers ── */
    function allSlides() {
      return Array.from(track.querySelectorAll('.dishes__slide'));
    }
  
    function slideW() {
      return allSlides()[0].getBoundingClientRect().width;
    }
  
    function visibleCount() {
      const w = window.innerWidth;
      if (w >= 992) return 4;
      if (w >= 576) return 2;
      return 1;
    }
  
    function setTranslate(idx, animate) {
      const offset = idx * (slideW() + GAP);
      track.style.transition = animate
        ? 'transform 0.42s cubic-bezier(0.4, 0, 0.2, 1)'
        : 'none';
      track.style.transform = 'translateX(-' + offset + 'px)';
    }
  
    /* ── 5. Dots (based on real cards only) ── */
    function buildDots() {
      dotsEl.innerHTML = '';
      const pages = Math.ceil(N / visibleCount());
      for (let i = 0; i < pages; i++) {
        const d = document.createElement('button');
        d.className = 'dishes__dot';
        d.setAttribute('aria-label', 'Page ' + (i + 1));
        d.addEventListener('click', () => {
          if (busy) return;
          busy = true;
          pos  = N + i * visibleCount();
          setTranslate(pos, true);
          syncDots();
        });
        dotsEl.appendChild(d);
      }
      syncDots();
    }
  
    function syncDots() {
      const realPos  = pos - N;                        // 0-based within real slides
      const safePosn = ((realPos % N) + N) % N;
      const page     = Math.floor(safePosn / visibleCount());
      dotsEl.querySelectorAll('.dishes__dot').forEach((d, i) => {
        d.classList.toggle('active', i === page);
      });
    }
  
    /* ── 6. Arrow handlers ── */
    nextBtn.addEventListener('click', () => {
      if (busy) return;
      busy = true;
      pos++;
      setTranslate(pos, true);
      syncDots();
    });
  
    prevBtn.addEventListener('click', () => {
      if (busy) return;
      busy = true;
      pos--;
      setTranslate(pos, true);
      syncDots();
    });
  
    /* ── 7. Infinite wrap on animation end ── */
    track.addEventListener('transitionend', () => {
      busy = false;
  
      // Wrapped past end → jump to real start zone
      if (pos >= N + N) {
        pos = pos - N;
        setTranslate(pos, false);
      }
  
      // Wrapped past start → jump to real end zone
      if (pos < N) {
        pos = pos + N;
        setTranslate(pos, false);
      }
  
      syncDots();
    });
  
    /* ── 8. Touch swipe ── */
    let tStartX = 0;
    track.addEventListener('touchstart', e => {
      tStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    track.addEventListener('touchend', e => {
      if (busy) return;
      const diff = tStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) < 40) return;
      busy = true;
      pos += diff > 0 ? 1 : -1;
      setTranslate(pos, true);
      syncDots();
    }, { passive: true });
  
    /* ── 9. Resize ── */
    let rTimer;
    window.addEventListener('resize', () => {
      clearTimeout(rTimer);
      rTimer = setTimeout(() => {
        buildDots();
        setTranslate(pos, false);
      }, 160);
    });
  
    /* ── 10. Init ── */
    buildDots();
    setTranslate(pos, false);     // snap to first real card, no animation
  
    /* ============================================
       NAV ACTIVE STATE
    ============================================= */
    document.querySelectorAll('.navbar__link').forEach(link => {
      link.addEventListener('click', function () {
        document.querySelectorAll('.navbar__link').forEach(l => l.classList.remove('navbar__link--active'));
        this.classList.add('navbar__link--active');
      });
    });
  
    /* ============================================
       SCROLL REVEAL (only real slides)
    ============================================= */
    const ro = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity   = '1';
          e.target.style.transform = 'translateY(0)';
          ro.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
  
    originals.forEach(slide => {
      const card = slide.querySelector('.dish-card');
      if (!card) return;
      card.style.opacity   = '0';
      card.style.transform = 'translateY(22px)';
      card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      ro.observe(card);
    });
  
    /* ============================================
       HERO LOAD REVEAL
    ============================================= */
    window.addEventListener('load', () => {
      const hl = document.querySelector('.hero__left');
      const hr = document.querySelector('.hero__right');
      if (hl) { hl.style.opacity = '1'; hl.style.transform = 'translateY(0)'; }
      if (hr) setTimeout(() => { hr.style.opacity = '1'; hr.style.transform = 'translateY(0)'; }, 160);
    });
  
    /* ============================================
       SMOOTH SCROLL
    ============================================= */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', function (e) {
        const t = document.querySelector(this.getAttribute('href'));
        if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });
  
  })();



 
const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

/* Create particles */
for (let i = 0; i < 80; i++) {
  particles.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 1,
    vy: (Math.random() - 0.5) * 1,
    size: Math.random() * 2 + 1
  });
}

/* Animation loop */
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;

    /* Bounce */
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    /* Draw particle */
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = "#f59e0b";
    ctx.fill();
  });

  /* Connect lines */
  for (let i = 0; i < particles.length; i++) {
    for (let j = i; j < particles.length; j++) {
      let dx = particles[i].x - particles[j].x;
      let dy = particles[i].y - particles[j].y;
      let dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 120) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(245,158,11,0.2)";
        ctx.lineWidth = 1;
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(animate);
}

animate();

/* Responsive */
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});




const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];
let mouse = { x: null, y: null };

/* Particle setup */
function createParticles(count) {
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      size: Math.random() * 2 + 1
    });
  }
}

createParticles(window.innerWidth < 768 ? 40 : 80);

/* Mouse interaction */
window.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

/* Animation */
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  particles.forEach(p => {

    /* Movement */
    p.x += p.vx;
    p.y += p.vy;

    /* Bounce */
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    /* Mouse attraction */
    let dx = mouse.x - p.x;
    let dy = mouse.y - p.y;
    let dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < 120) {
      p.x -= dx * 0.01;
      p.y -= dy * 0.01;
    }

    /* Draw */
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = "#f59e0b";
    ctx.fill();
  });

  /* Connections */
  for (let i = 0; i < particles.length; i++) {
    for (let j = i; j < particles.length; j++) {
      let dx = particles[i].x - particles[j].x;
      let dy = particles[i].y - particles[j].y;
      let dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < 100) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(245,158,11,0.15)";
        ctx.lineWidth = 1;
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(animate);
}

animate();

/* Responsive */
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  createParticles(window.innerWidth < 768 ? 40 : 80);
});
