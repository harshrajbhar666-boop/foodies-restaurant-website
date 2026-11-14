/* ==========================================================================
   Foodies Restaurant — order history page
   Reads GET /orders (optionally filtered by phone) and renders the timeline.
   ========================================================================== */
(function () {
  'use strict';

  const F = window.Foodies;
  if (!F) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const PHONE_KEY = 'foodies_last_phone';

  let listEl, summaryEl, phoneInput, clearBtn;

  const STATUS_LABEL = {
    pending: 'Pending',
    preparing: 'Preparing',
    out_for_delivery: 'On the way',
    completed: 'Delivered',
    cancelled: 'Cancelled'
  };

  /* ---------------- states ---------------- */
  function showSkeletons() {
    listEl.innerHTML = [0, 1, 2].map(() =>
      '<div class="order-card">' +
        '<div class="order-card__head">' +
          '<div style="width:100%">' +
            '<div class="skeleton" style="width:180px;height:18px;margin-bottom:10px"></div>' +
            '<div class="skeleton" style="width:120px;height:12px"></div>' +
          '</div>' +
        '</div>' +
        '<div style="padding-block:18px;display:grid;gap:10px">' +
          '<div class="skeleton" style="height:12px;width:80%"></div>' +
          '<div class="skeleton" style="height:12px;width:60%"></div>' +
        '</div>' +
        '<div class="order-card__foot">' +
          '<div class="skeleton" style="width:90px;height:20px"></div>' +
          '<div class="skeleton" style="width:120px;height:14px"></div>' +
        '</div>' +
      '</div>'
    ).join('');
    summaryEl.innerHTML = '';
  }

  function showError(message) {
    summaryEl.innerHTML = '';
    listEl.innerHTML =
      '<div class="orders-error">' +
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.5"/></svg>' +
        '<div>' +
          '<strong style="display:block;margin-bottom:2px">Could not load your orders</strong>' +
          '<span>' + F.escapeHtml(message) + '</span>' +
          '<div style="margin-top:12px"><button class="btn btn--dark btn--sm" type="button" data-retry>Try again</button></div>' +
        '</div>' +
      '</div>';
    const retry = $('[data-retry]', listEl);
    if (retry) retry.addEventListener('click', load);
  }

  function showEmpty(phone) {
    summaryEl.innerHTML = '';
    listEl.innerHTML =
      '<div class="empty-state">' +
        '<div class="empty-state__icon">' +
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>' +
        '</div>' +
        '<h3>No orders here yet</h3>' +
        '<p>' + (phone
          ? 'We could not find any orders for that phone number. Try clearing the filter, or place your first order.'
          : 'Once you place an order it will show up here with its live status.') + '</p>' +
        '<a class="btn btn--primary" href="menu.html">Browse the menu</a>' +
      '</div>';
  }

  /* ---------------- render ---------------- */
  function renderSummary(orders) {
    if (!orders.length) { summaryEl.innerHTML = ''; return; }
    const spend = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const active = orders.filter((o) => ['pending', 'preparing', 'out_for_delivery'].includes(o.status)).length;
    summaryEl.innerHTML =
      '<div class="why__stats" style="border-top:0;padding-top:0;margin-top:0;margin-bottom:clamp(20px,3vw,30px)">' +
        '<div class="why__stat"><strong style="color:var(--ink)">' + orders.length + '</strong><span style="color:var(--muted)">Orders placed</span></div>' +
        '<div class="why__stat"><strong style="color:var(--ink)">' + F.money(spend) + '</strong><span style="color:var(--muted)">Lifetime spend</span></div>' +
        '<div class="why__stat"><strong style="color:var(--ink)">' + active + '</strong><span style="color:var(--muted)">In progress</span></div>' +
        '<div class="why__stat"><strong style="color:var(--ink)">' + (orders[0] ? F.formatDate(orders[0].created_at).split(',')[0] : '—') + '</strong><span style="color:var(--muted)">Last order</span></div>' +
      '</div>';
  }

  function orderCard(order) {
    const items = (order.items || []).map((it) =>
      '<div class="order-item">' +
        '<span>' + F.escapeHtml(it.name) + ' <small>× ' + it.quantity + '</small></span>' +
        '<span>' + F.money(it.price * it.quantity) + '</span>' +
      '</div>'
    ).join('');

    const status = order.status || 'pending';
    const label = STATUS_LABEL[status] || status;

    return '<article class="order-card">' +
      '<div class="order-card__head">' +
        '<div>' +
          '<div class="order-card__id">Order #' + F.escapeHtml(order.id) + '</div>' +
          '<div class="order-card__meta">' +
            '<span>' + F.formatDate(order.created_at) + '</span>' +
            '<span aria-hidden="true">·</span>' +
            '<span>' + (order.order_type === 'pickup' ? 'Pickup' : 'Delivery') + '</span>' +
            (order.customer_name ? '<span aria-hidden="true">·</span><span>' + F.escapeHtml(order.customer_name) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<span class="status status--' + F.escapeHtml(status) + '">' + label + '</span>' +
      '</div>' +
      '<div class="order-card__items">' + items + '</div>' +
      (order.address
        ? '<div class="order-card__meta" style="padding-bottom:14px">' +
            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s7-4.4 7-10a7 7 0 1 0-14 0c0 5.6 7 10 7 10Z"/><circle cx="12" cy="11" r="2.6"/></svg>' +
            '<span>' + F.escapeHtml(order.address) + '</span>' +
          '</div>'
        : '') +
      (order.notes ? '<div class="order-card__meta" style="padding-bottom:14px"><em>“' + F.escapeHtml(order.notes) + '”</em></div>' : '') +
      '<div class="order-card__foot">' +
        '<div class="order-card__total"><small>Total paid</small>' + F.money(order.total) + '</div>' +
        '<a class="btn btn--ghost btn--sm" href="menu.html">Order again</a>' +
      '</div>' +
    '</article>';
  }

  /* ---------------- data ---------------- */
  async function load() {
    const phone = (phoneInput.value || '').trim().replace(/[\s-]/g, '');
    showSkeletons();
    clearBtn.classList.toggle('is-visible', !!phone);

    const query = phone ? '?phone=' + encodeURIComponent(phone) : '?limit=50';

    try {
      const res = await F.apiFetch('/orders' + query, { method: 'GET' });
      if (!res.ok) throw new Error('The server replied with status ' + res.status + '.');
      const orders = await res.json();
      if (!Array.isArray(orders)) throw new Error('Unexpected response from the server.');

      if (!orders.length) {
        showEmpty(phone);
        return;
      }
      renderSummary(orders);
      listEl.innerHTML = orders.map(orderCard).join('');
      listEl.querySelectorAll('.order-card').forEach((card, i) => {
        card.style.animationDelay = Math.min(i, 6) * 0.05 + 's';
      });
    } catch (err) {
      showError('Make sure the FastAPI backend is running, then try again. (' + err.message + ')');
    }
  }

  function init() {
    listEl = $('[data-orders-list]');
    summaryEl = $('[data-orders-summary]');
    phoneInput = $('#orders-phone');
    clearBtn = $('[data-phone-clear]');

    phoneInput.value = localStorage.getItem(PHONE_KEY) || '';
    clearBtn.classList.toggle('is-visible', !!phoneInput.value);

    let timer;
    phoneInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(load, 400);
    });

    clearBtn.addEventListener('click', () => {
      phoneInput.value = '';
      localStorage.removeItem(PHONE_KEY);
      load();
    });

    $('[data-refresh]').addEventListener('click', load);

    const year = $('[data-year]');
    if (year) year.textContent = new Date().getFullYear();

    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
