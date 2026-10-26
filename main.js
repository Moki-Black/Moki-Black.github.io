/* Rapid Shift Marketing — site script
   Vanilla JS. No frameworks.
   - Sticky nav transparent → solid on scroll
   - Mobile drawer
   - IntersectionObserver scroll reveals
   - Animated stat counters
   - Video testimonial inline playback (with poster swap)
   - Respects prefers-reduced-motion
*/

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ===== Floating glass nav scroll state =====
     Glass pill stays floating; on scroll past 60px it goes darker + cyan-tinted border. */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 60);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ===== Mobile drawer ===== */
  const burger = document.querySelector('.nav-burger');
  const drawer = document.querySelector('.nav-drawer');
  if (burger && drawer) {
    const toggle = (open) => {
      const next = typeof open === 'boolean' ? open : !drawer.classList.contains('is-open');
      drawer.classList.toggle('is-open', next);
      burger.setAttribute('aria-expanded', String(next));
      document.body.style.overflow = next ? 'hidden' : '';
    };
    burger.addEventListener('click', () => toggle());
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggle(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
  }

  /* ===== Reveal on scroll ===== */
  const revealTargets = document.querySelectorAll('.reveal');
  if (revealTargets.length && 'IntersectionObserver' in window && !prefersReducedMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -80px 0px' });
    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  /* ===== Animated stat counter ===== */
  const stats = document.querySelectorAll('[data-count]');
  if (stats.length && 'IntersectionObserver' in window) {
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const animateNum = (el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const duration = 1600;
      const start = performance.now();
      if (prefersReducedMotion) {
        el.textContent = target.toFixed(decimals) + suffix;
        return;
      }
      const tick = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const v = target * easeOut(t);
        el.textContent = (decimals > 0 ? v.toFixed(decimals) : Math.floor(v).toLocaleString()) + suffix;
        if (t < 1) requestAnimationFrame(tick);
        else el.textContent = (decimals > 0 ? target.toFixed(decimals) : target.toLocaleString()) + suffix;
      };
      requestAnimationFrame(tick);
    };
    const statIo = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateNum(entry.target);
          statIo.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    stats.forEach(el => statIo.observe(el));
  }

  /* ===== Video testimonial — click to play =====
     Two strategies supported:
     A) data-video="path/to/file.mp4" → swaps poster for inline <video> with controls + autoplay
     B) data-embed="https://..." → opens lightbox iframe (YouTube/Vimeo/Loom)
  */
  const players = document.querySelectorAll('.video-player');
  players.forEach(player => {
    player.addEventListener('click', () => {
      const file = player.dataset.video;
      const embed = player.dataset.embed;
      if (file) {
        const video = document.createElement('video');
        video.src = file;
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:3;';
        player.appendChild(video);
        player.style.cursor = 'default';
      } else if (embed) {
        openLightbox(embed);
      } else {
        // Placeholder behavior: show alert until PM provides asset
        const label = player.querySelector('.video-player__label');
        if (label) label.textContent = 'Video coming soon';
      }
    }, { once: true });
  });

  function openLightbox(src) {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.innerHTML = `
      <button class="lightbox__close" aria-label="Close video">&times;</button>
      <div class="lightbox__frame">
        <iframe src="${src}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
      </div>
    `;
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '1000',
      background: 'rgba(6, 11, 20, 0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '4vw', opacity: '0',
      transition: 'opacity 320ms cubic-bezier(0.22, 0.61, 0.36, 1)'
    });
    const frame = overlay.querySelector('.lightbox__frame');
    Object.assign(frame.style, {
      position: 'relative', width: '100%', maxWidth: '1100px',
      aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden',
      boxShadow: '0 28px 60px rgba(0,0,0,0.5)'
    });
    const iframe = overlay.querySelector('iframe');
    Object.assign(iframe.style, {
      position: 'absolute', inset: '0', width: '100%', height: '100%', border: '0'
    });
    const close = overlay.querySelector('.lightbox__close');
    Object.assign(close.style, {
      position: 'absolute', top: '1.5rem', right: '1.5rem',
      width: '44px', height: '44px', borderRadius: '50%',
      background: 'rgba(255,255,255,0.1)', color: '#fff',
      border: '1px solid rgba(255,255,255,0.2)', fontSize: '1.6rem', lineHeight: '1',
      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
    });
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => { overlay.style.opacity = '1'; });
    const dismiss = () => {
      overlay.style.opacity = '0';
      setTimeout(() => { overlay.remove(); document.body.style.overflow = ''; }, 280);
    };
    close.addEventListener('click', dismiss);
    overlay.addEventListener('click', e => { if (e.target === overlay) dismiss(); });
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { dismiss(); document.removeEventListener('keydown', onKey); }
    });
  }

  /* ===== Project filter chips + "view more" cap (work + web-design) ===== */
  const chips = document.querySelectorAll('[data-filter]');
  if (chips.length) {
    const projects = [...document.querySelectorAll('[data-category]')];
    const moreBtn = document.querySelector('[data-work-more]');
    const LIMIT = 12;
    let expanded = false;
    let currentFilter = 'all';
    function renderGrid() {
      let shown = 0, matchCount = 0;
      projects.forEach(p => {
        const cats = (p.dataset.category || '').split(/\s+/);
        const match = currentFilter === 'all' || cats.includes(currentFilter);
        if (match) {
          matchCount++;
          if (expanded || shown < LIMIT) { p.style.display = ''; shown++; }
          else { p.style.display = 'none'; }
        } else { p.style.display = 'none'; }
      });
      if (moreBtn) moreBtn.style.display = (!expanded && matchCount > LIMIT) ? '' : 'none';
    }
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        currentFilter = chip.dataset.filter;
        expanded = false;
        chips.forEach(c => { c.classList.remove('is-active'); c.setAttribute('aria-selected', 'false'); });
        chip.classList.add('is-active');
        chip.setAttribute('aria-selected', 'true');
        renderGrid();
      });
    });
    if (moreBtn) moreBtn.addEventListener('click', () => { expanded = true; renderGrid(); });
    renderGrid();
  }

  /* ===== Interactive scroll roadmap (home "No mystery" section) ===== */
  const roadmap = document.querySelector('.roadmap');
  if (roadmap) {
    const items = [...roadmap.querySelectorAll('.roadmap__item')];
    const fill = roadmap.querySelector('.roadmap__fill');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-shown'); });
      }, { threshold: 0.25, rootMargin: '0px 0px -12% 0px' });
      items.forEach(i => io.observe(i));
    } else {
      items.forEach(i => i.classList.add('is-shown'));
    }
    const onRoadScroll = () => {
      const r = roadmap.getBoundingClientRect();
      const prog = Math.min(Math.max((window.innerHeight * 0.55 - r.top) / r.height, 0), 1);
      if (fill) fill.style.height = (prog * 100) + '%';
    };
    window.addEventListener('scroll', onRoadScroll, { passive: true });
    onRoadScroll();
  }

  /* ===== Case-study video players =====
     Poster shows FULL at its native ratio (no cutoff). On play the frame
     morphs to the video's true ratio (no black bars) and the video fades in. */
  document.querySelectorAll('.csx-player, .cs-player').forEach(function (pl) {
    function play() {
      if (pl.dataset.played) return; pl.dataset.played = '1';
      var v = document.createElement('video');
      v.setAttribute('controls', ''); v.setAttribute('playsinline', '');
      v.muted = false; v.volume = 1;       /* play WITH sound — this runs inside the click gesture */
      var s = document.createElement('source'); s.src = pl.dataset.mp4; s.type = 'video/mp4'; v.appendChild(s);
      pl.appendChild(v);                 /* keep poster underneath so the morph reads cleanly */
      pl.classList.add('is-playing');    /* CSS morphs aspect-ratio + hides poster/play/badge */
      v.play().catch(function () {});
    }
    pl.addEventListener('click', play);
    pl.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } });
  });

  /* ===== Modal triggers ===== */
  const modalTriggers = document.querySelectorAll('[data-modal-trigger]');
  const modalCloses   = document.querySelectorAll('[data-modal-close]');

  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    /* Lazy-load demo iframes — populate src on first open */
    const lazyFrame = m.querySelector('iframe[data-demo-src]');
    if (lazyFrame && !lazyFrame.src) {
      lazyFrame.src = lazyFrame.dataset.demoSrc;
    }
  }
  function closeAllModals() {
    document.querySelectorAll('.modal-overlay.is-open').forEach(m => m.classList.remove('is-open'));
    document.body.style.overflow = '';
  }
  modalTriggers.forEach(t => {
    t.addEventListener('click', e => {
      e.preventDefault();
      openModal(t.dataset.modalTrigger);
    });
  });

  /* ===== Demo chip filter (custom-software page) ===== */
  const demoChips = document.querySelectorAll('[data-demo-filter]');
  if (demoChips.length) {
    const demoCards = document.querySelectorAll('[data-demo-cat]');
    demoChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const f = chip.dataset.demoFilter;
        demoChips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        demoCards.forEach(card => {
          card.style.display = (f === 'all' || card.dataset.demoCat === f) ? '' : 'none';
        });
      });
    });
  }

  /* ===== Lightbox triggers (content page) — reuse modal system ===== */
  document.querySelectorAll('[data-lightbox]').forEach(t => {
    t.addEventListener('click', e => {
      e.preventDefault();
      openModal(t.dataset.lightbox);
    });
  });
  modalCloses.forEach(b => b.addEventListener('click', closeAllModals));
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeAllModals();
    });
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllModals();
  });

  /* ===== Current year ===== */
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  /* ===== FAQ accordion ===== */
  document.querySelectorAll('.faq-item__q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const open = item.classList.contains('is-open');
      // Allow multiple to be open at once — feels less restrictive
      item.classList.toggle('is-open', !open);
      q.setAttribute('aria-expanded', String(!open));
    });
  });

  /* ===== Video testimonial click-to-play ===== */
  document.querySelectorAll('.video-test').forEach(card => {
    const video = card.querySelector('video');
    const play  = card.querySelector('.video-test__play');
    if (!video || !play) return;
    play.addEventListener('click', () => {
      video.controls = true;
      video.play().catch(() => {});
      card.classList.add('is-playing');
    });
    video.addEventListener('pause', () => card.classList.remove('is-playing'));
    video.addEventListener('ended', () => card.classList.remove('is-playing'));
  });

  /* ===== Lead-magnet popup — EXIT-INTENT ONLY. No timers: a timer interrupts
     people who were still reading; exit-intent catches people already leaving. ===== */
  const pop = document.getElementById('lm-popup');
  if (pop) {
    const KEY = 'rsm_lmpop_seen';
    const alreadySeen = sessionStorage.getItem(KEY);
    let shown = false;
    function open() {
      if (shown || alreadySeen) return;
      shown = true;
      pop.classList.add('is-open');
      document.body.classList.add('modal-active');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      pop.classList.remove('is-open');
      document.body.classList.remove('modal-active');
      document.body.style.overflow = '';
      try { sessionStorage.setItem(KEY, '1'); } catch (e) {}  // only suppress after user dismisses
    }
    document.addEventListener('mouseleave', e => { if (e.clientY <= 0 && !window.__modalOpen) open(); });
    pop.querySelectorAll('[data-lm-close]').forEach(b => b.addEventListener('click', close));
    pop.addEventListener('click', e => { if (e.target === pop) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && pop.classList.contains('is-open')) close(); });
  }

  /* ===== Timeline boot-up — rows light to their status color in sequence ===== */
  const timeline = document.querySelector('.timeline');
  if (timeline && 'IntersectionObserver' in window) {
    const rows = timeline.querySelectorAll('.timeline__row');
    if (!prefersReducedMotion && rows.length) {
      timeline.classList.add('js-boot');
      const bootIo = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          rows.forEach((row, idx) => {
            setTimeout(() => row.classList.add('is-lit'), 160 * idx + 200);
          });
          bootIo.disconnect();
        });
      }, { threshold: 0.25 });
      bootIo.observe(timeline);
    }
  }

  /* ===== Video testimonial carousel ===== */
  document.querySelectorAll('.vcar').forEach(car => {
    const track = car.querySelector('.vcar__track');
    const prev = car.querySelector('.vcar__nav--prev');
    const next = car.querySelector('.vcar__nav--next');
    if (!track) return;
    const step = () => {
      const card = track.querySelector('.vcard');
      return card ? card.getBoundingClientRect().width + 20 : 300;
    };
    const sync = () => {
      const maxScroll = track.scrollWidth - track.clientWidth - 4;
      if (prev) prev.disabled = track.scrollLeft <= 4;
      if (next) next.disabled = track.scrollLeft >= maxScroll;
    };
    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -step() * 1.5, behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left: step() * 1.5, behavior: 'smooth' }));
    track.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
    sync();
  });

  /* ===== Video testimonial modal (clean playback for any aspect ratio) ===== */
  const vmodal = document.getElementById('vmodal');
  if (vmodal) {
    const vEl = document.getElementById('vmodal-video');
    const vName = document.getElementById('vmodal-name');
    const vCompany = document.getElementById('vmodal-company');
    const openVModal = (card) => {
      vEl.innerHTML = '';
      const webm = card.dataset.webm, mp4 = card.dataset.mp4;
      if (webm) { const s = document.createElement('source'); s.src = webm; s.type = 'video/webm'; vEl.appendChild(s); }
      if (mp4) { const s = document.createElement('source'); s.src = mp4; s.type = 'video/mp4'; vEl.appendChild(s); }
      vName.textContent = card.dataset.name || '';
      vCompany.textContent = card.dataset.company || '';
      vEl.load();
      vmodal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      window.__modalOpen = true; document.body.classList.add("modal-active");            // suppress booking popup while watching
      vEl.play().catch(() => {});
    };
    const closeVModal = () => {
      vEl.pause();
      vmodal.classList.remove('is-open');
      document.body.style.overflow = '';
      window.__modalOpen = false; document.body.classList.remove("modal-active");
    };
    document.querySelectorAll('[data-vmodal]').forEach(card => {
      card.addEventListener('click', () => openVModal(card));
    });
    vmodal.querySelectorAll('[data-vmodal-close]').forEach(b => b.addEventListener('click', closeVModal));
    vmodal.addEventListener('click', e => { if (e.target === vmodal) closeVModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && vmodal.classList.contains('is-open')) closeVModal(); });
  }

  /* ===== Case study modal ===== */
  const csmodal = document.getElementById('csmodal');
  if (csmodal) {
    const csBody = document.getElementById('csmodal-body');
    const openCs = (id) => {
      const tpl = document.getElementById('case-' + id);
      if (!tpl) return;
      csBody.innerHTML = tpl.innerHTML;
      csmodal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      window.__modalOpen = true; document.body.classList.add("modal-active");
      csmodal.scrollTop = 0;
    };
    const closeCs = () => {
      csBody.querySelectorAll('video').forEach(v => v.pause());
      csBody.innerHTML = '';
      csmodal.classList.remove('is-open');
      document.body.style.overflow = '';
      window.__modalOpen = false; document.body.classList.remove("modal-active");
    };
    document.querySelectorAll('[data-case]').forEach(btn => {
      btn.addEventListener('click', () => openCs(btn.dataset.case));
    });
    csmodal.querySelectorAll('[data-cs-close]').forEach(b => b.addEventListener('click', closeCs));
    csmodal.addEventListener('click', e => { if (e.target === csmodal) closeCs(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && csmodal.classList.contains('is-open')) closeCs(); });
  }

  /* ===== Scroll progress bar ===== */
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.appendChild(progress);
  let progressTicking = false;
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
    progressTicking = false;
  };
  window.addEventListener('scroll', () => {
    if (!progressTicking) { progressTicking = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  updateProgress();

  /* ===== Magnetic primary buttons — desktop fine-pointer only ===== */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !prefersReducedMotion) {
    /* .nav-cta excluded: its float keyframe animation owns transform and would fight the magnet */
    document.querySelectorAll('.btn--primary, .lm-pop__bookcall').forEach(btn => {
      const STRENGTH = 0.22;
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * STRENGTH;
        const y = (e.clientY - r.top - r.height / 2) * STRENGTH;
        btn.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });

    /* Feature images: subtle magnetic follow + pop  */
    document.querySelectorAll('.hero__photo, .manifesto__media, .owner__shot, .owner__portrait, .service-detail__intro img, .content-video__shell').forEach(img => {
      const S = 0.04;
      img.style.transition = 'transform 300ms cubic-bezier(.34,1.56,.64,1), box-shadow 300ms';
      img.addEventListener('mousemove', e => {
        const r = img.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * S;
        const y = (e.clientY - r.top - r.height / 2) * S;
        img.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(1.012)`;
      });
      img.addEventListener('mouseleave', () => { img.style.transform = ''; });
    });
  }

  /* ===== Custom cursor REMOVED  =====
     The navy dot + ring was invisible on white backgrounds and added nothing
     for our ICP — they want a normal, trustworthy cursor. Using the default
     OS cursor site-wide now. (CSS cursor rules are inert without the
     `has-custom-cursor` class this block used to add.) */

  /* ===== Smooth anchor scroll w/ header offset ===== */
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  });
})();

/* ===== Hero widget parallax — gentle scroll-linked drift, confined to the hero ===== */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var els = [].slice.call(document.querySelectorAll('[data-parallax]'));
  if (!els.length) return;
  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight || document.documentElement.clientHeight;
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var hero = el.closest('section');
      if (!hero) continue;
      var r = hero.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh) continue;            /* hero off-screen — skip */
      var speed = parseFloat(el.getAttribute('data-parallax')) || 0.08;
      var offset = (-r.top) * speed;                          /* drift down as the page scrolls up */
      el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
