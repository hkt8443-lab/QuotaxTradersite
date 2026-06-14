/* ============================================================
   QUOTEX BROKER — script.js
   Handles: charts, carousel, FAQ, navbar, scroll animations,
            prognosis demo, scroll-to-top, mobile menu
============================================================ */

(function () {
  'use strict';

  /* ============================================================
     UTILITY — simple canvas chart helpers
  ============================================================ */

  /** Generate a realistic-looking random walk price series */
  function generatePriceSeries(length, start, volatility) {
    const data = [start];
    for (let i = 1; i < length; i++) {
      const change = (Math.random() - 0.48) * volatility;
      data.push(Math.max(0.5, data[i - 1] + change));
    }
    return data;
  }

  /** Draw a line-area chart on a canvas */
  function drawLineChart(canvas, data, opts) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const { lineColor = '#3a7bd5', fillColor = 'rgba(58,123,213,0.12)', lineWidth = 2 } = opts || {};

    ctx.clearRect(0, 0, w, h);

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padX = 8, padY = 16;

    const toX = (i) => padX + (i / (data.length - 1)) * (w - 2 * padX);
    const toY = (v) => h - padY - ((v - min) / range) * (h - 2 * padY);

    // Fill
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(data[0]));
    data.forEach((v, i) => ctx.lineTo(toX(i), toY(v)));
    ctx.lineTo(toX(data.length - 1), h);
    ctx.lineTo(toX(0), h);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(data[0]));
    data.forEach((v, i) => ctx.lineTo(toX(i), toY(v)));
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  /** Draw a candlestick chart (OHLC) */
  function drawCandlestickChart(canvas, bars, opts) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const { upColor = '#4CAF50', downColor = '#e53935', dividerX = null } = opts || {};

    ctx.clearRect(0, 0, w, h);

    const allPrices = bars.flatMap(b => [b.high, b.low]);
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    const range = max - min || 1;
    const padX = 20, padY = 20;
    const barW = Math.max(4, (w - 2 * padX) / bars.length - 3);

    const toX = (i) => padX + i * ((w - 2 * padX) / bars.length) + barW / 2;
    const toY = (v) => padY + ((max - v) / range) * (h - 2 * padY);

    // Grid lines
    for (let i = 1; i < 5; i++) {
      const y = padY + (i / 5) * (h - 2 * padY);
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(w - padX, y);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Divider line (for prognosis demo)
    if (dividerX !== null) {
      ctx.beginPath();
      ctx.moveTo(dividerX, padY);
      ctx.lineTo(dividerX, h - padY);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      // Circle at divider
      const midY = toY((min + max) / 2);
      ctx.beginPath();
      ctx.arc(dividerX, midY, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    }

    bars.forEach((bar, i) => {
      const x = toX(i);
      const openY  = toY(bar.open);
      const closeY = toY(bar.close);
      const highY  = toY(bar.high);
      const lowY   = toY(bar.low);
      const color  = bar.close >= bar.open ? upColor : downColor;

      // Wick
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Body
      const bodyTop    = Math.min(openY, closeY);
      const bodyHeight = Math.max(2, Math.abs(openY - closeY));
      ctx.fillStyle = color;
      ctx.fillRect(x - barW / 2, bodyTop, barW, bodyHeight);
    });

    // Draw prediction lines after divider
    if (dividerX !== null) {
      const midBar = Math.floor(bars.length * 0.55);
      const startY = toY(bars[midBar].close);

      // Green (up)
      ctx.beginPath();
      ctx.moveTo(dividerX, startY);
      ctx.lineTo(w - padX, padY + 20);
      ctx.strokeStyle = '#4CAF50';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Red (down)
      ctx.beginPath();
      ctx.moveTo(dividerX, startY);
      ctx.lineTo(w - padX, h - padY - 20);
      ctx.strokeStyle = '#e53935';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  /** Generate random OHLC bars */
  function generateBars(count, start) {
    const bars = [];
    let last = start;
    for (let i = 0; i < count; i++) {
      const dir   = Math.random() > 0.45 ? 1 : -1;
      const open  = last;
      const close = open + dir * (Math.random() * 0.0012);
      const high  = Math.max(open, close) + Math.random() * 0.0006;
      const low   = Math.min(open, close) - Math.random() * 0.0006;
      bars.push({ open, close, high, low });
      last = close;
    }
    return bars;
  }

  /* ============================================================
     HERO CHARTS
  ============================================================ */
  function initHeroChart() {
    const data = generatePriceSeries(60, 100, 3);
    drawLineChart(document.getElementById('heroChart'), data, {
      lineColor: '#4CAF50',
      fillColor: 'rgba(76,175,80,0.08)',
      lineWidth: 2.5,
    });
    drawLineChart(document.getElementById('heroChartMobile'), data, {
      lineColor: '#3a7bd5',
      fillColor: 'rgba(58,123,213,0.1)',
      lineWidth: 2,
    });
  }

  /* ============================================================
     PROGNOSIS CHART
  ============================================================ */
  let prognosisBars = [];
  let prognosisAnimFrame = null;
  let prognosisTick = 0;

  function initPrognosisChart() {
    const canvas = document.getElementById('prognosisChart');
    if (!canvas) return;
    prognosisBars = generateBars(30, 1.1314);
    renderPrognosisChart(canvas, null);
  }

  function renderPrognosisChart(canvas, outcome) {
    const divX = canvas.width * 0.55;
    drawCandlestickChart(canvas, prognosisBars, { dividerX: divX });

    if (outcome) {
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = outcome === 'up'
        ? 'rgba(76,175,80,0.08)'
        : 'rgba(229,57,53,0.08)';
      ctx.fillRect(w * 0.55, 0, w * 0.45, h);
    }
  }

  /* ============================================================
     PHONE CHART
  ============================================================ */
  function initPhoneChart() {
    const data = generatePriceSeries(40, 50, 2);
    drawLineChart(document.getElementById('phoneChart'), data, {
      lineColor: '#4CAF50',
      fillColor: 'rgba(76,175,80,0.1)',
      lineWidth: 1.5,
    });
  }

  /* ============================================================
     CTA BANNER CHART
  ============================================================ */
  function initCtaChart() {
    const bars = generateBars(28, 22000);
    drawCandlestickChart(document.getElementById('ctaChart'), bars);
  }

  /* ============================================================
     LIVE TICKER ANIMATION (hero chart updates periodically)
  ============================================================ */
  let heroData = null;
  function startLiveTicker() {
    heroData = generatePriceSeries(60, 100, 3);
    setInterval(() => {
      if (!heroData) return;
      heroData.shift();
      heroData.push(heroData[heroData.length - 1] + (Math.random() - 0.48) * 2.5);
      drawLineChart(document.getElementById('heroChart'), heroData, {
        lineColor: '#4CAF50', fillColor: 'rgba(76,175,80,0.08)', lineWidth: 2.5,
      });
    }, 1800);
  }

  /* ============================================================
     PROGNOSIS DEMO INTERACTION
  ============================================================ */
  function initPrognosis() {
    const btnUp   = document.getElementById('btnUp');
    const btnDown = document.getElementById('btnDown');
    const result  = document.getElementById('prognosisResult');
    const canvas  = document.getElementById('prognosisChart');

    function playResult(predicted) {
      // Random actual outcome weighted slightly toward "up"
      const actual = Math.random() > 0.45 ? 'up' : 'down';
      const won    = actual === predicted;

      btnUp.disabled = btnDown.disabled = true;
      result.hidden = false;
      result.className = 'prognosis-result ' + (won ? 'win' : 'lose');
      result.textContent = won
        ? '✅ Correct! The price went ' + actual + '!'
        : '❌ Wrong! The price went ' + actual + '.';

      renderPrognosisChart(canvas, actual);

      setTimeout(() => {
        prognosisBars = generateBars(30, 1.1314);
        renderPrognosisChart(canvas, null);
        result.hidden = true;
        result.textContent = '';
        btnUp.disabled = btnDown.disabled = false;
      }, 3000);
    }

    btnUp?.addEventListener('click', () => playResult('up'));
    btnDown?.addEventListener('click', () => playResult('down'));
  }

  /* ============================================================
     REVIEWS CAROUSEL
  ============================================================ */
  function initCarousel() {
    const track = document.getElementById('reviewsTrack');
    if (!track) return;
    const cards = Array.from(track.querySelectorAll('.review-card'));
    const dots  = Array.from(document.querySelectorAll('.carousel-dots .dot'));
    let current = 0;
    let timer;

    function showCard(idx) {
      cards.forEach((c, i) => {
        c.classList.toggle('active', i === idx);
        c.setAttribute('aria-hidden', i !== idx);
      });
      dots.forEach((d, i) => {
        d.classList.toggle('active', i === idx);
        d.setAttribute('aria-selected', i === idx);
      });
      current = idx;
    }

    function next() { showCard((current + 1) % cards.length); }

    function startTimer() {
      clearInterval(timer);
      timer = setInterval(next, 5000);
    }

    dots.forEach(d => {
      d.addEventListener('click', () => {
        showCard(parseInt(d.dataset.idx, 10));
        startTimer();
      });
    });

    showCard(0);
    startTimer();
  }

  /* ============================================================
     FAQ ACCORDION
  ============================================================ */
  function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        const answer   = btn.nextElementSibling;

        // Close all others
        document.querySelectorAll('.faq-question').forEach(other => {
          if (other !== btn) {
            other.setAttribute('aria-expanded', 'false');
            const otherAns = other.nextElementSibling;
            otherAns.hidden = true;
          }
        });

        btn.setAttribute('aria-expanded', !expanded);
        answer.hidden = expanded;
      });
    });
  }

  /* ============================================================
     NAVBAR — scroll effect + mobile menu
  ============================================================ */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.querySelector('.nav-hamburger');
    const navLinks  = document.querySelector('.nav-links');
    const navActions = document.querySelector('.nav-actions');
    let menuOpen = false;

    window.addEventListener('scroll', () => {
      navbar?.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });

    hamburger?.addEventListener('click', () => {
      menuOpen = !menuOpen;
      hamburger.setAttribute('aria-expanded', menuOpen);
      navLinks?.classList.toggle('open', menuOpen);
      navActions?.classList.toggle('open', menuOpen);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (menuOpen && !navbar?.contains(e.target)) {
        menuOpen = false;
        navLinks?.classList.remove('open');
        navActions?.classList.remove('open');
        hamburger?.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ============================================================
     SCROLL ANIMATIONS (IntersectionObserver)
  ============================================================ */
  function initScrollAnimations() {
    const targets = document.querySelectorAll('[data-anim="fadeUp"]');
    if (!targets.length) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(el => io.observe(el));
  }

  /* ============================================================
     SCROLL TO TOP
  ============================================================ */
  function initScrollTop() {
    const btn = document.getElementById('scrollTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        btn.hidden = false;
      } else {
        btn.hidden = true;
      }
    }, { passive: true });

    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ============================================================
     BONUS CHART (background mini candlestick)
  ============================================================ */
  function initBonusChart() {
    const canvas = document.getElementById('bonusChart');
    if (!canvas) return;
    const bars = generateBars(40, 22000);
    drawCandlestickChart(canvas, bars);
  }

  /* ============================================================
     STATS COUNTER ANIMATION (benefits 0% → 0%, $1 etc.)
  ============================================================ */
  function initCounterAnimations() {
    const benefitItems = document.querySelectorAll('.benefit-item');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    benefitItems.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      io.observe(el);
    });

    // Second observer to trigger visible
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          io2.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    benefitItems.forEach(el => io2.observe(el));
  }

  /* ============================================================
     SMOOTH SECTION TRANSITIONS — adds pulse on nav link click
  ============================================================ */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const id  = link.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  /* ============================================================
     HOVER GLOW on feature cards
  ============================================================ */
  function initCardHover() {
    document.querySelectorAll('.feature-card, .step-card, .why-item, .benefit-item').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
        const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
        card.style.setProperty('--mx', x + '%');
        card.style.setProperty('--my', y + '%');
      });
    });
  }

  /* ============================================================
     NAVBAR scrolled style injection
  ============================================================ */
  (function addNavScrollStyle() {
    const style = document.createElement('style');
    style.textContent = `
      .navbar.scrolled {
        background: rgba(10, 14, 22, 0.98) !important;
        box-shadow: 0 2px 20px rgba(0,0,0,0.4);
      }
    `;
    document.head.appendChild(style);
  })();

  /* ============================================================
     BOOT — call everything after DOM ready
  ============================================================ */
  function boot() {
    initHeroChart();
    initPhoneChart();
    initPrognosisChart();
    initCtaChart();
    initBonusChart();
    initPrognosis();
    initCarousel();
    initFAQ();
    initNavbar();
    initScrollAnimations();
    initScrollTop();
    initCounterAnimations();
    initSmoothScroll();
    initCardHover();
    startLiveTicker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
