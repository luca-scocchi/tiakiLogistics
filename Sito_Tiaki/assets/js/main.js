/**
 * ============================================================
 * TIAKI LOGISTICS — Main JS
 * Entry point: inizializza tutti i moduli e gli effetti globali.
 * Progressive enhancement: il sito funziona senza JS.
 * ============================================================
 */

'use strict';

/* Marca il documento come "JS attivo" — sblocca le animazioni .reveal */
document.documentElement.classList.add('js-ready');

import {
  initNavbar,
  initCounters,
  initFormValidation,
  initAudienceTabs,
} from './components.js';


/* ══════════════════════════════════════════════════════════
   SCROLL REVEAL — Intersection Observer per animazioni
   ══════════════════════════════════════════════════════════ */

function initScrollReveal() {
  // Rispetta preferenze utente per riduzione movimento
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  revealEls.forEach(el => observer.observe(el));
}


/* ══════════════════════════════════════════════════════════
   SMOOTH SCROLL — Ancora con offset per navbar fissa
   ══════════════════════════════════════════════════════════ */

function initSmoothScroll() {
  // La maggior parte dei browser moderni supporta scroll-behavior: smooth nativo.
  // Qui gestiamo solo l'offset per la navbar fissa.
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      const navbarHeight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')
      ) || 72;

      const top = target.getBoundingClientRect().top + window.scrollY - navbarHeight - 16;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}


/* ══════════════════════════════════════════════════════════
   BARRE ESG HERO — Animazione all'entrata
   ══════════════════════════════════════════════════════════ */

function initEsgBars() {
  const bars = document.querySelectorAll('.hero__esg-fill');
  if (!bars.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const width = entry.target.dataset.width ?? '0%';
          // Ritardo lieve per effetto visivo
          setTimeout(() => {
            entry.target.style.width = width;
          }, 300);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  bars.forEach(bar => {
    bar.style.width = '0%'; // Parte da zero
    observer.observe(bar);
  });
}


/* ══════════════════════════════════════════════════════════
   UTILITY — Debounce
   ══════════════════════════════════════════════════════════ */

function debounce(fn, delay = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}


/* ══════════════════════════════════════════════════════════
   UTILITY — Trap focus nel menu mobile
   ══════════════════════════════════════════════════════════ */

function initFocusTrap() {
  const menu = document.getElementById('navbar-mobile-menu');
  if (!menu) return;

  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;

    const focusable = menu.querySelectorAll(
      'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}


/* ══════════════════════════════════════════════════════════
   LAZY LOADING POLYFILL (fallback browser vecchi)
   ══════════════════════════════════════════════════════════ */

function initLazyImages() {
  // I browser moderni supportano loading="lazy" nativo.
  // Questo è un fallback minimale per browser non supportati.
  if ('loading' in HTMLImageElement.prototype) return;

  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  if (!lazyImages.length) return;

  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) img.src = img.dataset.src;
        imageObserver.unobserve(img);
      }
    });
  });

  lazyImages.forEach(img => imageObserver.observe(img));
}


/* ══════════════════════════════════════════════════════════
   COOKIE BANNER MINIMALE (placeholder)
   ══════════════════════════════════════════════════════════ */

function initCookieBanner() {
  const banner   = document.getElementById('cookie-banner');
  const acceptBtn = document.getElementById('cookie-accept');
  if (!banner || !acceptBtn) return;

  // Controlla se già accettato
  if (localStorage.getItem('cookiesAccepted')) {
    banner.hidden = true;
    return;
  }

  // Mostra banner
  banner.hidden = false;

  acceptBtn.addEventListener('click', () => {
    localStorage.setItem('cookiesAccepted', '1');
    banner.style.transform = 'translateY(100%)';
    banner.style.opacity   = '0';
    setTimeout(() => { banner.hidden = true; }, 400);
  });
}


/* ══════════════════════════════════════════════════════════
   INIT — Avvia tutti i moduli al DOMContentLoaded
   ══════════════════════════════════════════════════════════ */

function init() {
  initNavbar();
  initScrollReveal();
  initSmoothScroll();
  initCounters();
  initEsgBars();
  initFocusTrap();
  initLazyImages();
  initCookieBanner();
  initFormValidation('contact-form');
  initFormValidation('demo-form');
  initAudienceTabs();

  // Gestione resize con debounce
  window.addEventListener('resize', debounce(() => {
    // Ricalcola altezza navbar su resize
    const navbar = document.getElementById('navbar');
    if (navbar) {
      document.documentElement.style.setProperty(
        '--navbar-height',
        `${navbar.offsetHeight}px`
      );
    }
  }, 200));
}

// Attendi che il DOM sia pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init(); // DOM già pronto
}
