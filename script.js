/* =========================================================
   MENTHE PLOMBERIE — interactions
   ========================================================= */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  /* ---------------------------------------------------------
     En-tête
     --------------------------------------------------------- */
  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------------------------------------------------------
     Menu (drawer)
     --------------------------------------------------------- */
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const scrim = document.getElementById('scrim');

  if (burger && nav) {
    const isOpen = () => nav.classList.contains('is-open');

    const openMenu = () => {
      nav.classList.add('is-open');
      burger.classList.add('is-open');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Fermer le menu');
      if (scrim) {
        scrim.hidden = false;
        requestAnimationFrame(() => scrim.classList.add('is-visible'));
      }
      document.body.classList.add('nav-open');
    };

    const closeMenu = () => {
      nav.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Ouvrir le menu');
      document.body.classList.remove('nav-open');
      if (scrim) {
        scrim.classList.remove('is-visible');
        window.setTimeout(() => { if (!isOpen()) scrim.hidden = true; }, 260);
      }
    };

    burger.addEventListener('click', () => (isOpen() ? closeMenu() : openMenu()));
    if (scrim) scrim.addEventListener('click', closeMenu);
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) { closeMenu(); burger.focus(); }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1160 && isOpen()) closeMenu();
    });
  }

  /* ---------------------------------------------------------
     Lien de navigation actif
     --------------------------------------------------------- */
  const navLinks = $$('.nav__link');
  const sections = $$('main section[id]');
  if ('IntersectionObserver' in window && sections.length && navLinks.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((l) =>
          l.classList.toggle('is-active', l.getAttribute('href') === '#' + entry.target.id)
        );
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach((s) => observer.observe(s));
  }

  /* ---------------------------------------------------------
     Apparition au scroll (sobre)
     --------------------------------------------------------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el, i) => {
      el.style.transitionDelay = Math.min(i % 3, 3) * 90 + 'ms';
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------------------------------------------------------
     Réalisations — filtres
     --------------------------------------------------------- */
  const gallery = document.getElementById('gallery');
  const filtersBar = document.getElementById('galleryFilters');
  const galleryEmpty = document.getElementById('galleryEmpty');

  if (gallery && filtersBar) {
    const items = $$('.gitem', gallery);

    filtersBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter');
      if (!btn) return;
      const filter = btn.dataset.filter;
      let visible = 0;

      $$('.filter', filtersBar).forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });

      items.forEach((item) => {
        const show = filter === 'all' || item.dataset.category === filter;
        item.classList.toggle('is-hidden', !show);
        if (show) visible++;
      });

      if (galleryEmpty) galleryEmpty.hidden = visible > 0;
    });
  }

  /* ---------------------------------------------------------
     Formulaire de devis multi-étapes
     --------------------------------------------------------- */
  const form = document.getElementById('devisForm');

  if (form) {
    const steps = $$('.step', form);
    const dots = $$('#stepDots span');
    const stepLabel = document.getElementById('stepLabel');
    const formError = document.getElementById('formError');
    const needGrid = document.getElementById('needGrid');
    const besoinInput = document.getElementById('besoin');

    const cpField = document.getElementById('cp');
    const villeField = document.getElementById('ville');
    const nomField = document.getElementById('nom');
    const telField = document.getElementById('tel');
    const emailField = document.getElementById('email');
    const messageField = document.getElementById('message');

    let current = 1;
    let selectedNeed = '';

    const showError = (msg) => {
      if (!formError) return;
      formError.textContent = msg || '';
      formError.hidden = !msg;
    };

    const clearFieldErrors = () => {
      $$('.is-invalid', form).forEach((el) => el.classList.remove('is-invalid'));
    };

    const showStep = (n) => {
      current = Math.min(Math.max(n, 1), steps.length);
      steps.forEach((s) => s.classList.toggle('is-active', Number(s.dataset.step) === current));
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-done', i + 1 < current);
        dot.classList.toggle('is-active', i + 1 === current);
      });
      if (stepLabel) stepLabel.textContent = 'Étape ' + current + ' sur ' + steps.length;
      if (current === 4) updateRecap();
      showError('');
    };

    /* Validation par étape : renvoie un message d'erreur ou null */
    const validate = (n) => {
      clearFieldErrors();
      if (n === 1) {
        return selectedNeed ? null : 'Sélectionnez la nature de votre besoin pour continuer.';
      }
      if (n === 2) {
        const cp = cpField ? cpField.value.trim() : '';
        if (!/^\d{5}$/.test(cp)) {
          if (cpField) cpField.classList.add('is-invalid');
          return 'Indiquez un code postal valide (5 chiffres), par exemple 69003.';
        }
        return null;
      }
      /* étape 3 */
      let msg = null;
      if (messageField && messageField.value.trim().length < 5) {
        messageField.classList.add('is-invalid');
        msg = 'Décrivez brièvement votre problème (quelques mots suffisent).';
      }
      if (nomField && !nomField.value.trim()) {
        nomField.classList.add('is-invalid');
        msg = msg || 'Indiquez votre nom.';
      }
      if (telField && telField.value.replace(/\D/g, '').length < 8) {
        telField.classList.add('is-invalid');
        msg = msg || 'Indiquez un numéro de téléphone valide.';
      }
      if (emailField && emailField.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailField.value.trim())) {
        emailField.classList.add('is-invalid');
        msg = msg || "L'adresse e-mail semble incorrecte.";
      }
      return msg;
    };

    const goNext = () => {
      const msg = validate(current);
      if (msg) { showError(msg); return; }
      showStep(current + 1);
      const panel = $('.step.is-active', form);
      if (panel) panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    };

    const goPrev = () => showStep(current - 1);

    /* Sélection du besoin */
    if (needGrid) {
      $$('.needopt', needGrid).forEach((btn) => btn.setAttribute('aria-pressed', 'false'));

      needGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.needopt');
        if (!btn) return;
        selectedNeed = btn.dataset.value || '';
        if (besoinInput) besoinInput.value = selectedNeed;
        $$('.needopt', needGrid).forEach((b) => {
          const active = b === btn;
          b.classList.toggle('is-selected', active);
          b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        showError('');
      });
    }

    /* Récapitulatif */
    function updateRecap() {
      const set = (key, value) => {
        const el = form.querySelector('[data-recap="' + key + '"]');
        if (el) el.textContent = value || '—';
      };
      const cp = cpField ? cpField.value.trim() : '';
      const ville = villeField ? villeField.value.trim() : '';
      const nom = nomField ? nomField.value.trim() : '';
      const tel = telField ? telField.value.trim() : '';

      set('besoin', selectedNeed);
      set('secteur', [cp, ville].filter(Boolean).join(' '));
      set('contact', [nom, tel].filter(Boolean).join(' — '));
    }

    /* Navigation */
    $$('[data-next]', form).forEach((btn) => btn.addEventListener('click', goNext));
    $$('[data-prev]', form).forEach((btn) => btn.addEventListener('click', goPrev));

    /* Nettoyage des erreurs à la saisie */
    $$('.field input, .field textarea, .field select', form).forEach((field) => {
      field.addEventListener('input', () => {
        field.classList.remove('is-invalid');
        showError('');
      });
    });

    /* Envoi */
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      for (let n = 1; n <= 3; n++) {
        const msg = validate(n);
        if (msg) { showStep(n); showError(msg); return; }
      }

      const submit = form.querySelector('button[type="submit"]');
      const original = submit ? submit.textContent : '';
      if (submit) { submit.disabled = true; submit.textContent = 'Envoi en cours…'; }

      window.setTimeout(() => {
        const success = document.getElementById('formSuccess');
        if (success) {
          success.hidden = false;
          success.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        }
        form.reset();
        selectedNeed = '';
        if (besoinInput) besoinInput.value = '';
        $$('.needopt', needGrid).forEach((b) => {
          b.classList.remove('is-selected');
          b.setAttribute('aria-pressed', 'false');
        });
        resetUpload();
        if (submit) { submit.disabled = false; submit.textContent = original; }
        showStep(1);
      }, 900);
    });

    /* Photo */
    const photoInput = document.getElementById('photo');
    const photoPreview = document.getElementById('photoPreview');
    const uploadTitle = document.getElementById('uploadTitle');
    let photoUrl = null;

    function resetUpload() {
      if (photoInput) photoInput.value = '';
      if (photoPreview) {
        photoPreview.hidden = true;
        photoPreview.innerHTML = '';
      }
      if (uploadTitle) uploadTitle.textContent = 'Choisir une photo';
      if (photoUrl) { URL.revokeObjectURL(photoUrl); photoUrl = null; }
    }

    if (photoInput && photoPreview) {
      photoInput.addEventListener('change', () => {
        const file = photoInput.files && photoInput.files[0];
        resetUpload();
        if (!file) return;

        if (uploadTitle) uploadTitle.textContent = file.name;
        photoPreview.hidden = false;
        photoPreview.textContent = 'Photo ajoutée : ' + file.name;

        if (file.type.indexOf('image/') === 0) {
          photoUrl = URL.createObjectURL(file);
          const img = document.createElement('img');
          img.src = photoUrl;
          img.alt = "Aperçu de la photo de l'installation";
          photoPreview.appendChild(img);
        }
      });
    }

    showStep(1);
  }

  /* ---------------------------------------------------------
     Année du pied de page
     --------------------------------------------------------- */
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
