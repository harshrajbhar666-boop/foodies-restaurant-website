/* ==========================================================================
   Foodies Restaurant — menu page
   Category chips, live search, veg filter, skeleton loading, empty state.
   ========================================================================== */
(function () {
  'use strict';

  const F = window.Foodies;
  const data = window.FOODIES_DATA;
  if (!F || !data) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const state = {
    category: 'all',
    query: '',
    vegOnly: false
  };

  let grid, chipsHost, countEl, noteEl, resetBtn, searchInput, vegInput, clearBtn;

  /* ---------------- filtering ---------------- */
  function matches(dish) {
    if (state.category !== 'all' && dish.category !== state.category) return false;
    if (state.vegOnly && !dish.veg) return false;
    if (!state.query) return true;
    const haystack = (dish.name + ' ' + dish.desc + ' ' + dish.category).toLowerCase();
    return state.query.split(/\s+/).every((word) => haystack.includes(word));
  }

  /* ---------------- rendering ---------------- */
  function skeletons(n) {
    let out = '';
    for (let i = 0; i < n; i++) {
      out +=
        '<div class="dish-card dish-card--skeleton" aria-hidden="true">' +
          '<div class="sk-media skeleton"></div>' +
          '<div class="dish-card__body">' +
            '<div class="sk-line skeleton" style="width:70%"></div>' +
            '<div class="sk-line skeleton" style="width:95%"></div>' +
            '<div class="sk-line skeleton" style="width:55%"></div>' +
            '<div class="sk-line skeleton" style="width:40%;height:30px;border-radius:999px;margin-top:8px"></div>' +
          '</div>' +
        '</div>';
    }
    return out;
  }

  function emptyState() {
    return '<div class="empty-state" style="grid-column:1/-1">' +
      '<div class="empty-state__icon">' +
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>' +
      '</div>' +
      '<h3>Nothing matches that yet</h3>' +
      '<p>Try a different word, or clear the filters to see all fifteen dishes.</p>' +
      '<button class="btn btn--primary btn--sm" type="button" data-empty-reset>Clear filters</button>' +
    '</div>';
  }

  function render() {
    const results = data.DISHES.filter(matches);
    grid.innerHTML = '';

    if (!results.length) {
      grid.innerHTML = emptyState();
      const btn = $('[data-empty-reset]', grid);
      if (btn) btn.addEventListener('click', reset);
    } else {
      results.forEach((dish, i) => {
        const card = F.dishCard(dish);
        card.style.setProperty('--d', Math.min(i, 8) * 0.04 + 's');
        grid.appendChild(card);
      });
      F.initReveal(grid);
    }

    countEl.textContent = results.length;
    const bits = [];
    if (state.category !== 'all') {
      const cat = data.CATEGORIES.find((c) => c.id === state.category);
      if (cat) bits.push('in ' + cat.label.toLowerCase());
    }
    if (state.query) bits.push('for “' + state.query + '”');
    if (state.vegOnly) bits.push('· veg only');
    noteEl.textContent = bits.join(' ');

    const active = state.category !== 'all' || state.query || state.vegOnly;
    resetBtn.hidden = !active;
    clearBtn.classList.toggle('is-visible', !!state.query);
  }

  /* ---------------- chips ---------------- */
  function renderChips() {
    chipsHost.innerHTML = data.CATEGORIES.map((cat) => {
      const count = cat.id === 'all'
        ? data.DISHES.length
        : data.DISHES.filter((d) => d.category === cat.id).length;
      return '<button class="chip' + (cat.id === state.category ? ' is-active' : '') + '" type="button" role="tab" ' +
        'aria-selected="' + (cat.id === state.category) + '" data-category="' + cat.id + '">' +
        cat.label + ' <span style="opacity:.5">' + count + '</span></button>';
    }).join('');

    $$('[data-category]', chipsHost).forEach((chip) => {
      chip.addEventListener('click', () => {
        state.category = chip.dataset.category;
        $$('[data-category]', chipsHost).forEach((c) => {
          const on = c === chip;
          c.classList.toggle('is-active', on);
          c.setAttribute('aria-selected', String(on));
        });
        render();
        // keep the chosen category in the URL so links can be shared
        const url = new URL(location.href);
        if (state.category === 'all') url.searchParams.delete('category');
        else url.searchParams.set('category', state.category);
        history.replaceState(null, '', url);
      });
    });
  }

  /* ---------------- events ---------------- */
  function reset() {
    state.category = 'all';
    state.query = '';
    state.vegOnly = false;
    searchInput.value = '';
    vegInput.checked = false;
    renderChips();
    render();
    const url = new URL(location.href);
    url.searchParams.delete('category');
    history.replaceState(null, '', url);
  }

  function debounce(fn, ms) {
    let timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }

  function init() {
    grid = $('[data-menu-grid]');
    chipsHost = $('[data-chips]');
    countEl = $('[data-result-count]');
    noteEl = $('[data-result-note]');
    resetBtn = $('[data-reset]');
    searchInput = $('#menu-search');
    vegInput = $('#veg-only');
    clearBtn = $('[data-search-clear]');

    // deep link: menu.html?category=mains
    const param = new URLSearchParams(location.search).get('category');
    if (param && data.CATEGORIES.some((c) => c.id === param)) state.category = param;

    renderChips();

    // first paint shows skeleton cards, then the real ones
    grid.innerHTML = skeletons(6);
    setTimeout(render, 320);

    searchInput.addEventListener('input', debounce(() => {
      state.query = searchInput.value.trim().toLowerCase();
      render();
    }, 180));

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.query = '';
      render();
      searchInput.focus();
    });

    vegInput.addEventListener('change', () => {
      state.vegOnly = vegInput.checked;
      render();
    });

    resetBtn.addEventListener('click', reset);

    const year = $('[data-year]');
    if (year) year.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
