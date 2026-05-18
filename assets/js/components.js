/**
 * ============================================================
 * TIAKI LOGISTICS — Componenti JavaScript
 * Navbar mobile, contatore statistiche, form validation.
 * Vanilla JS ES2022+, nessuna dipendenza esterna.
 * ============================================================
 */

'use strict';

/* ══════════════════════════════════════════════════════════
   NAVBAR — Sticky + Glassmorphism + Menu Mobile
   ══════════════════════════════════════════════════════════ */

export function initNavbar() {
  const navbar      = document.getElementById('navbar');
  const hamburger   = document.getElementById('navbar-hamburger');
  const mobileMenu  = document.getElementById('navbar-mobile-menu');
  const mobileLinks = mobileMenu?.querySelectorAll('.navbar__mobile-link');

  if (!navbar) return;

  /* ── Effetto glassmorphism allo scroll ─────────────────── */
  let lastScrollY   = window.scrollY;
  let ticking       = false;

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateNavbar);
      ticking = true;
    }
  }

  function updateNavbar() {
    const scrollY = window.scrollY;

    if (scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    lastScrollY = scrollY;
    ticking     = false;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  updateNavbar(); // Stato iniziale

  /* ── Menu hamburger mobile ─────────────────────────────── */
  if (!hamburger || !mobileMenu) return;

  function openMenu() {
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Blocca scroll body
    // Focus sul primo link
    mobileLinks?.[0]?.focus();
  }

  function closeMenu() {
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    hamburger.focus();
  }

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  // Chiudi cliccando su un link
  mobileLinks?.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Chiudi premendo Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    }
  });

  // Chiudi al resize se schermo desktop
  const mediaQuery = window.matchMedia('(min-width: 1024px)');
  mediaQuery.addEventListener('change', (e) => {
    if (e.matches) closeMenu();
  });
}


/* ══════════════════════════════════════════════════════════
   CONTATORE STATISTICHE — Animazione con Intersection Observer
   ══════════════════════════════════════════════════════════ */

export function initCounters() {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  // Funzione di easing (ease-out)
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateCounter(el) {
    const target   = parseFloat(el.dataset.counter);
    const suffix   = el.dataset.suffix ?? '';
    const prefix   = el.dataset.prefix ?? '';
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
    const duration = 2000; // ms
    let startTime  = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed  = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutCubic(progress);
      const current  = target * eased;

      el.textContent = prefix + current.toFixed(decimals) + suffix;

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
      }
    }

    window.requestAnimationFrame(step);
  }

  // Osserva quando i contatori entrano nel viewport
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.animated) {
          entry.target.dataset.animated = 'true';
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach(counter => observer.observe(counter));
}


/* ══════════════════════════════════════════════════════════
   FORM VALIDATION — Lato client con feedback immediato
   ══════════════════════════════════════════════════════════ */

export function initFormValidation(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  const successMsg = form.querySelector('.form-success');

  /* ── Regole di validazione ─────────────────────────────── */
  const rules = {
    required: (value) => value.trim() !== '' || 'Questo campo è obbligatorio',
    email:    (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Inserisci un indirizzo email valido',
    minLength: (min) => (value) => value.trim().length >= min || `Minimo ${min} caratteri richiesti`,
    phone:    (value) => !value || /^[\d\s\-\+\(\)]{7,}$/.test(value) || 'Inserisci un numero di telefono valido',
  };

  /* ── Valida un singolo campo ───────────────────────────── */
  function validateField(input) {
    const group        = input.closest('.form-group');
    const errorEl      = group?.querySelector('.form-error');
    const validations  = (input.dataset.validate ?? '').split('|').filter(Boolean);

    let errorMsg = '';

    for (const rule of validations) {
      const [ruleName, ...args] = rule.split(':');
      const validator = rules[ruleName];

      if (!validator) continue;

      const result = typeof validator === 'function'
        ? (args.length ? validator(args[0])(input.value) : validator(input.value))
        : true;

      if (typeof result === 'string') {
        errorMsg = result;
        break;
      }
    }

    if (errorMsg) {
      group?.classList.add('has-error');
      if (errorEl) errorEl.textContent = errorMsg;
      input.setAttribute('aria-invalid', 'true');
      return false;
    } else {
      group?.classList.remove('has-error');
      if (errorEl) errorEl.textContent = '';
      input.removeAttribute('aria-invalid');
      return true;
    }
  }

  /* ── Valida in tempo reale (blur) ──────────────────────── */
  const inputs = form.querySelectorAll('[data-validate]');
  inputs.forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      // Rimuovi l'errore non appena l'utente inizia a correggere
      if (input.closest('.form-group')?.classList.contains('has-error')) {
        validateField(input);
      }
    });
  });

  /* ── Submit ────────────────────────────────────────────── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Valida tutti i campi
    let allValid = true;
    inputs.forEach(input => {
      if (!validateField(input)) allValid = false;
    });

    if (!allValid) {
      // Focus sul primo campo con errore
      form.querySelector('.has-error input, .has-error textarea, .has-error select')?.focus();
      return;
    }

    // Simula invio (da collegare a backend reale)
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled    = true;
      submitBtn.textContent = 'Invio in corso…';
    }

    try {
      // Recupera dati del form
      const data = Object.fromEntries(new FormData(form));

      // ⚠️ Da sostituire con la chiamata API reale
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Mostra messaggio successo
      if (successMsg) {
        successMsg.classList.add('visible');
        successMsg.focus();
      }
      form.reset();

    } catch (err) {
      console.error('Errore invio form:', err);
      // Mostra errore generico
      if (submitBtn) {
        submitBtn.textContent = 'Errore - Riprova';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        if (!successMsg?.classList.contains('visible')) {
          submitBtn.textContent = 'Invia richiesta';
        }
      }
    }
  });
}


/* ══════════════════════════════════════════════════════════
   TAB AUDIENCE — Switcher Logistici / Committenza
   ══════════════════════════════════════════════════════════ */

export function initAudienceTabs() {
  const tabs    = document.querySelectorAll('[data-tab]');
  const panels  = document.querySelectorAll('[data-panel]');

  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      // Aggiorna tab
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Aggiorna pannelli
      panels.forEach(panel => {
        if (panel.dataset.panel === target) {
          panel.hidden = false;
          panel.setAttribute('aria-hidden', 'false');
        } else {
          panel.hidden = true;
          panel.setAttribute('aria-hidden', 'true');
        }
      });
    });
  });
}
