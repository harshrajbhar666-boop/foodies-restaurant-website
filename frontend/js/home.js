/* ==========================================================================
   Foodies Restaurant — homepage behaviour
   Popular dishes, testimonials marquee, gallery, offer countdown.
   ========================================================================== */
(function () {
  'use strict';

  const F = window.Foodies;
  const data = window.FOODIES_DATA;
  if (!F || !data) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  /* ---------------- Popular dishes ---------------- */
  function renderPopular() {
    const host = $('[data-popular-dishes]');
    if (!host) return;
    const popular = data.DISHES.filter((d) => d.popular).slice(0, 4);
    popular.forEach((dish, i) => {
      const card = F.dishCard(dish);
      card.style.setProperty('--d', (0.06 * i) + 's');
      host.appendChild(card);
    });
  }

  /* ---------------- Testimonials ---------------- */
  function starRow(count) {
    let out = '';
    for (let i = 0; i < count; i++) {
      out += '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z"/></svg>';
    }
    return out;
  }

  function renderTestimonials() {
    const track = $('[data-testi-track]');
    if (!track) return;

    const cardHtml = (t, i) =>
      '<article class="testi-card">' +
        '<span class="testi-card__quote" aria-hidden="true">&ldquo;</span>' +
        '<div class="testi-card__stars" aria-label="' + t.stars + ' out of 5">' + starRow(t.stars) + '</div>' +
        '<p>' + F.escapeHtml(t.text) + '</p>' +
        '<div class="testi-card__author">' +
          '<span class="avatar' + (i % 2 ? ' avatar--orange' : '') + '">' + F.escapeHtml(t.initials) + '</span>' +
          '<div>' +
            '<strong>' + F.escapeHtml(t.name) + '</strong>' +
            '<small>' +
              '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>' +
              F.escapeHtml(t.role) +
            '</small>' +
          '</div>' +
        '</div>' +
      '</article>';

    const single = data.TESTIMONIALS.map(cardHtml).join('');
    // duplicated once so the CSS marquee loops seamlessly
    track.innerHTML = single + single;
  }

  /* ---------------- Gallery ---------------- */
  function renderGallery() {
    const host = $('[data-gallery]');
    if (!host) return;
    host.innerHTML = data.GALLERY.map((item) => {
      const cls = 'gallery__item';
      return '<figure class="' + cls + ' reveal reveal--scale" data-lightbox="' + item.src + '">' +
        '<img src="' + item.src + '" alt="' + F.escapeHtml(item.caption) + '" loading="lazy">' +
        '<span class="gallery__zoom" aria-hidden="true">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/></svg>' +
        '</span>' +
        '<figcaption>' + F.escapeHtml(item.caption) + '</figcaption>' +
      '</figure>';
    }).join('');
  }

  /* ---------------- Offer countdown ---------------- */
  function initCountdown() {
    const wrap = $('[data-countdown]');
    if (!wrap) return;

    function target() {
      const now = new Date();
      const end = new Date(now);
      const day = now.getDay(); // 0 = Sunday
      let add = (7 - day) % 7;
      end.setDate(now.getDate() + add);
      end.setHours(23, 59, 59, 999);
      if (end <= now) end.setDate(end.getDate() + 7);
      return end;
    }

    let end = target();
    const set = (key, value) => {
      const el = $('[data-cd="' + key + '"]', wrap);
      if (el) el.textContent = String(value).padStart(2, '0');
    };

    function tick() {
      let diff = end - new Date();
      if (diff <= 0) { end = target(); diff = end - new Date(); }
      const s = Math.floor(diff / 1000);
      set('days', Math.floor(s / 86400));
      set('hours', Math.floor((s % 86400) / 3600));
      set('mins', Math.floor((s % 3600) / 60));
      set('secs', s % 60);
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------- Copy coupon ---------------- */
  function initCopy() {
    $$('[data-copy-code]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const code = btn.dataset.copyCode;
        const label = $('span', btn);
        try {
          await navigator.clipboard.writeText(code);
        } catch (err) {
          // fallback for browsers without the async clipboard API
          const input = document.createElement('input');
          input.value = code;
          document.body.appendChild(input);
          input.select();
          try { document.execCommand('copy'); } catch (e) { /* ignore */ }
          input.remove();
        }
        const original = label.textContent;
        label.textContent = 'Copied';
        F.toast('Coupon ' + code + ' copied to clipboard');
        setTimeout(() => { label.textContent = original; }, 1800);
      });
    });
  }

  /* ---------------- Footer year ---------------- */
  function initYear() {
    const el = $('[data-year]');
    if (el) el.textContent = new Date().getFullYear();
  }

  function init() {
    renderPopular();
    renderTestimonials();
    renderGallery();
    initCountdown();
    initCopy();
    initYear();
    F.initReveal();
    F.initCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
