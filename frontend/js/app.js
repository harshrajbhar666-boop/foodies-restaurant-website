/* ==========================================================================
   Foodies Restaurant — shared application core
   Cart (localStorage), drawer, checkout, toasts, nav, reveal & counters.
   Plain script (no ES modules) so the pages also work when opened directly.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Config                                                              */
  /* ------------------------------------------------------------------ */
  const CART_KEY = 'foodies_cart';
  const PHONE_KEY = 'foodies_last_phone';
  const FREE_DELIVERY_OVER = 999;
  const DELIVERY_FEE = 49;

  const API_BASES = (function () {
    if (location.protocol === 'file:') return ['http://127.0.0.1:8000'];
    // Same origin first (FastAPI serves the frontend), then a local dev server.
    return ['', 'http://127.0.0.1:8000'];
  })();

  /* ------------------------------------------------------------------ */
  /* Tiny helpers                                                        */
  /* ------------------------------------------------------------------ */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
  const escapeHtml = (str) =>
    String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  /* ------------------------------------------------------------------ */
  /* Icons                                                               */
  /* ------------------------------------------------------------------ */
  const ICONS = {
    cart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2.2l2.3 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H6"/></svg>',
    plus: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    star: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z"/></svg>',
    heart: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8Z"/></svg>',
    trash: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
    bag: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>'
  };

  /* ------------------------------------------------------------------ */
  /* Cart store                                                          */
  /* ------------------------------------------------------------------ */
  const listeners = [];

  function readCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw
        .filter((it) => it && it.id && Number(it.price) >= 0)
        .map((it) => ({
          id: String(it.id),
          name: String(it.name || 'Dish'),
          price: Number(it.price) || 0,
          img: String(it.img || ''),
          qty: Math.max(1, Math.min(99, parseInt(it.qty, 10) || 1))
        }));
    } catch (err) {
      return [];
    }
  }

  function writeCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch (err) {
      /* storage full or blocked — cart stays in memory for this page */
    }
    listeners.forEach((fn) => {
      try { fn(items); } catch (e) { /* keep other listeners alive */ }
    });
  }

  const Cart = {
    items: readCart(),
    get() { return this.items.slice(); },
    count() { return this.items.reduce((sum, it) => sum + it.qty, 0); },
    subtotal() { return this.items.reduce((sum, it) => sum + it.price * it.qty, 0); },
    fee() { return this.items.length === 0 || this.subtotal() >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE; },
    total() { return this.subtotal() + this.fee(); },
    qtyOf(id) {
      const found = this.items.find((it) => it.id === id);
      return found ? found.qty : 0;
    },
    add(dish, qty) {
      const step = Math.max(1, parseInt(qty, 10) || 1);
      const found = this.items.find((it) => it.id === dish.id);
      if (found) {
        found.qty = Math.min(99, found.qty + step);
      } else {
        this.items.push({
          id: String(dish.id),
          name: dish.name,
          price: Number(dish.price) || 0,
          img: dish.img || '',
          qty: step
        });
      }
      this.commit();
      return this.qtyOf(dish.id);
    },
    setQty(id, qty) {
      const found = this.items.find((it) => it.id === id);
      if (!found) return;
      const next = Math.max(0, Math.min(99, parseInt(qty, 10) || 0));
      if (next === 0) {
        this.items = this.items.filter((it) => it.id !== id);
      } else {
        found.qty = next;
      }
      this.commit();
    },
    remove(id) {
      this.items = this.items.filter((it) => it.id !== id);
      this.commit();
    },
    clear() {
      this.items = [];
      this.commit();
    },
    commit() { writeCart(this.items); },
    subscribe(fn) { listeners.push(fn); fn(this.items); },
    onChange(fn) { listeners.push(fn); }
  };

  /* ------------------------------------------------------------------ */
  /* Toasts                                                              */
  /* ------------------------------------------------------------------ */
  let toastHost = null;
  function toast(message, type) {
    if (!toastHost) {
      toastHost = document.createElement('div');
      toastHost.className = 'toasts';
      toastHost.setAttribute('role', 'status');
      toastHost.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastHost);
    }
    const el = document.createElement('div');
    el.className = 'toast toast--' + (type || 'success');
    el.innerHTML =
      '<span class="toast__icon">' + (type === 'error' ? ICONS.close : ICONS.check) + '</span>' +
      '<span>' + escapeHtml(message) + '</span>';
    toastHost.appendChild(el);
    setTimeout(() => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 380);
    }, 2600);
  }

  /* ------------------------------------------------------------------ */
  /* API access                                                          */
  /* ------------------------------------------------------------------ */
  async function apiFetch(path, options) {
    let lastError = null;
    for (const base of API_BASES) {
      try {
        const res = await fetch(base + path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, options));
        if (res.status === 404 && base === '') { lastError = new Error('not found'); continue; }
        return res;
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('Network error');
  }

  /* ------------------------------------------------------------------ */
  /* Dish card                                                           */
  /* ------------------------------------------------------------------ */
  function dishCard(dish) {
    const card = document.createElement('article');
    card.className = 'dish-card reveal';
    card.dataset.id = dish.id;
    card.dataset.category = dish.category;

    const badge = dish.badge
      ? '<span class="pill ' + (dish.badge === 'Bestseller' ? 'pill--orange' : 'pill--green') + '">' + escapeHtml(dish.badge) + '</span>'
      : '';
    const favKey = 'foodies_fav_' + dish.id;
    const isFav = localStorage.getItem(favKey) === '1';

    card.innerHTML =
      '<div class="dish-card__media">' +
        '<img src="' + dish.img + '" alt="' + escapeHtml(dish.name) + '" loading="lazy" width="900" height="675">' +
        '<div class="dish-card__badges">' + badge + '</div>' +
        '<button class="dish-card__fav' + (isFav ? ' is-active' : '') + '" type="button" aria-label="Save ' + escapeHtml(dish.name) + '" aria-pressed="' + isFav + '">' + ICONS.heart + '</button>' +
      '</div>' +
      '<div class="dish-card__body">' +
        '<div class="dish-card__top">' +
          '<h3 class="dish-card__name">' + escapeHtml(dish.name) + '</h3>' +
          '<span class="dish-card__rating">' + ICONS.star + dish.rating.toFixed(1) + '</span>' +
        '</div>' +
        '<p class="dish-card__desc">' + escapeHtml(dish.desc) + '</p>' +
        '<div class="dish-card__foot">' +
          '<div class="dish-card__price"><small>' +
            '<span class="veg-dot' + (dish.veg ? '' : ' veg-dot--nonveg') + '"></span> ' +
            (dish.veg ? 'Veg' : 'Non-veg') +
          '</small>' + money(dish.price) + '</div>' +
          '<button class="add-btn" type="button" data-add="' + dish.id + '">' + ICONS.plus + '<span>Add</span></button>' +
        '</div>' +
      '</div>';

    const favBtn = $('.dish-card__fav', card);
    favBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const now = !favBtn.classList.contains('is-active');
      favBtn.classList.toggle('is-active', now);
      favBtn.setAttribute('aria-pressed', String(now));
      localStorage.setItem(favKey, now ? '1' : '0');
      toast(now ? 'Saved to your favourites' : 'Removed from favourites');
    });

    const addBtn = $('[data-add]', card);
    addBtn.addEventListener('click', function () {
      Cart.add(dish, 1);
      addBtn.classList.add('is-added');
      addBtn.innerHTML = ICONS.check + '<span>Added</span>';
      bumpCartIcon();
      toast(dish.name + ' added to cart');
      setTimeout(() => {
        addBtn.classList.remove('is-added');
        addBtn.innerHTML = ICONS.plus + '<span>Add</span>';
      }, 1400);
    });

    return card;
  }

  function bumpCartIcon() {
    const btn = $('[data-cart-open]');
    if (!btn) return;
    btn.classList.remove('is-bump');
    void btn.offsetWidth;
    btn.classList.add('is-bump');
  }

  /* ------------------------------------------------------------------ */
  /* Cart drawer                                                         */
  /* ------------------------------------------------------------------ */
  let drawerEl, overlayEl, modalEl;

  function buildDrawer() {
    overlayEl = document.createElement('div');
    overlayEl.className = 'overlay';
    overlayEl.dataset.closeAll = 'true';

    drawerEl = document.createElement('aside');
    drawerEl.className = 'drawer';
    drawerEl.setAttribute('aria-hidden', 'true');
    drawerEl.setAttribute('aria-label', 'Your cart');
    drawerEl.innerHTML =
      '<div class="drawer__head">' +
        '<div class="drawer__title">Your cart <span data-cart-count-label>0</span></div>' +
        '<button class="icon-btn" type="button" data-cart-close aria-label="Close cart">' + ICONS.close + '</button>' +
      '</div>' +
      '<div class="drawer__body" data-cart-body></div>' +
      '<div class="drawer__foot" data-cart-foot></div>';

    document.body.appendChild(overlayEl);
    document.body.appendChild(drawerEl);

    drawerEl.addEventListener('click', function (e) {
      const inc = e.target.closest('[data-inc]');
      const dec = e.target.closest('[data-dec]');
      const rm = e.target.closest('[data-remove]');
      if (inc) Cart.setQty(inc.dataset.inc, Cart.qtyOf(inc.dataset.inc) + 1);
      if (dec) Cart.setQty(dec.dataset.dec, Cart.qtyOf(dec.dataset.dec) - 1);
      if (rm) {
        Cart.remove(rm.dataset.remove);
        toast('Item removed from cart');
      }
    });

    $('[data-cart-close]', drawerEl).addEventListener('click', closeCart);

    Cart.subscribe(renderCart);
  }

  function renderCart(items) {
    if (!drawerEl) return;
    const body = $('[data-cart-body]', drawerEl);
    const foot = $('[data-cart-foot]', drawerEl);
    const label = $('[data-cart-count-label]', drawerEl);
    const count = Cart.count();
    label.textContent = count;

    $$('[data-cart-count]').forEach((el) => {
      el.textContent = count;
      el.classList.toggle('is-visible', count > 0);
    });

    if (!items.length) {
      body.innerHTML =
        '<div class="drawer__empty">' +
          '<div class="empty-state__icon">' + ICONS.bag + '</div>' +
          '<h3>Your cart is empty</h3>' +
          '<p>Add something delicious from the menu and it will show up here.</p>' +
          '<a class="btn btn--primary btn--sm" href="menu.html">Browse the menu</a>' +
        '</div>';
      foot.innerHTML = '';
      return;
    }

    body.innerHTML = items.map((it) =>
      '<div class="cart-item">' +
        '<img src="' + it.img + '" alt="' + escapeHtml(it.name) + '" loading="lazy">' +
        '<div>' +
          '<div class="cart-item__name">' + escapeHtml(it.name) + '</div>' +
          '<div class="cart-item__price">' + money(it.price) + ' each</div>' +
          '<div class="qty">' +
            '<button type="button" data-dec="' + it.id + '" aria-label="Decrease quantity">' + ICONS.minus + '</button>' +
            '<span>' + it.qty + '</span>' +
            '<button type="button" data-inc="' + it.id + '" aria-label="Increase quantity">' + ICONS.plus + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="cart-item__right">' +
          '<div class="cart-item__total">' + money(it.price * it.qty) + '</div>' +
          '<button class="cart-item__remove" type="button" data-remove="' + it.id + '">Remove</button>' +
        '</div>' +
      '</div>'
    ).join('');

    const fee = Cart.fee();
    const remaining = FREE_DELIVERY_OVER - Cart.subtotal();
    foot.innerHTML =
      (remaining > 0
        ? '<div class="free-hint">Add <strong>' + money(remaining) + '</strong> more for free delivery</div>'
        : '<div class="free-hint">You have unlocked <strong>free delivery</strong></div>') +
      '<div class="summary">' +
        '<div class="summary__row"><span>Subtotal</span><span>' + money(Cart.subtotal()) + '</span></div>' +
        '<div class="summary__row"><span>Delivery</span><span>' + (fee === 0 ? 'Free' : money(fee)) + '</span></div>' +
        '<div class="summary__row summary__row--total"><span>Total</span><span>' + money(Cart.total()) + '</span></div>' +
      '</div>' +
      '<button class="btn btn--primary btn--block" type="button" data-checkout>' +
        'Checkout · ' + money(Cart.total()) +
      '</button>';

    $('[data-checkout]', foot).addEventListener('click', openCheckout);
  }

  function openCart() {
    if (!drawerEl) return;
    drawerEl.classList.add('is-open');
    overlayEl.classList.add('is-open');
    drawerEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }
  function closeCart() {
    if (!drawerEl) return;
    drawerEl.classList.remove('is-open');
    if (!modalEl || !modalEl.classList.contains('is-open')) {
      overlayEl.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
    }
    drawerEl.setAttribute('aria-hidden', 'true');
  }

  /* ------------------------------------------------------------------ */
  /* Checkout modal                                                      */
  /* ------------------------------------------------------------------ */
  function buildModal() {
    modalEl = document.createElement('div');
    modalEl.className = 'modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-hidden', 'true');
    modalEl.innerHTML =
      '<div class="modal__panel">' +
        '<div class="modal__head">' +
          '<div><h2>Complete your order</h2><p data-order-eta>Freshly prepared · 30–40 min</p></div>' +
          '<button class="icon-btn" type="button" data-modal-close aria-label="Close checkout">' + ICONS.close + '</button>' +
        '</div>' +
        '<form class="modal__body" id="order-form" data-order-form novalidate>' +
          '<div class="seg" data-order-type>' +
            '<button type="button" class="is-active" data-type="delivery">Delivery</button>' +
            '<button type="button" data-type="pickup">Pickup</button>' +
          '</div>' +
          '<div class="field" data-field="name">' +
            '<label for="ck-name">Full name</label>' +
            '<input id="ck-name" name="name" type="text" placeholder="e.g. Harsh Rajbhar" autocomplete="name" required>' +
            '<span class="field__error">Please enter your name</span>' +
          '</div>' +
          '<div class="field" data-field="phone">' +
            '<label for="ck-phone">Phone number</label>' +
            '<input id="ck-phone" name="phone" type="tel" placeholder="10-digit mobile number" autocomplete="tel" inputmode="numeric" required>' +
            '<span class="field__error">Enter a valid 10-digit phone number</span>' +
          '</div>' +
          '<div class="field" data-field="address">' +
            '<label for="ck-address">Delivery address</label>' +
            '<textarea id="ck-address" name="address" placeholder="Flat / house, street, landmark, area, pincode"></textarea>' +
            '<span class="field__error">Please add a delivery address</span>' +
          '</div>' +
          '<div class="field">' +
            '<label for="ck-notes">Kitchen notes <span style="text-transform:none;letter-spacing:0;font-weight:500">(optional)</span></label>' +
            '<textarea id="ck-notes" name="notes" placeholder="Less spicy, no onion, extra chutney…"></textarea>' +
          '</div>' +
        '</form>' +
        '<div class="modal__foot">' +
          '<button class="btn btn--primary btn--block" type="submit" form="order-form" data-submit-order>Place order · <span data-modal-total></span></button>' +
          '<p class="modal__note">You will receive a call to confirm before we start cooking.</p>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modalEl);

    const form = $('[data-order-form]', modalEl);
    const submitBtn = $('[data-submit-order]', modalEl);
    const typeWrap = $('[data-order-type]', modalEl);

    typeWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-type]');
      if (!btn) return;
      $$('[data-type]', typeWrap).forEach((b) => b.classList.toggle('is-active', b === btn));
      form.dataset.orderType = btn.dataset.type;
      const addressField = $('[data-field="address"]', modalEl);
      addressField.style.display = btn.dataset.type === 'pickup' ? 'none' : '';
      $('[data-order-eta]', modalEl).textContent =
        btn.dataset.type === 'pickup' ? 'Pickup from Bandra West · ready in 25 min' : 'Freshly prepared · 30–40 min delivery';
    });
    form.dataset.orderType = 'delivery';

    $('[data-modal-close]', modalEl).addEventListener('click', closeModal);

    // clear the error state as soon as the guest starts fixing a field
    form.addEventListener('input', (e) => {
      const wrap = e.target.closest('.field');
      if (wrap) wrap.classList.remove('is-invalid');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitOrder(form, submitBtn);
    });
  }

  function openCheckout() {
    if (!Cart.count()) {
      toast('Your cart is empty', 'error');
      return;
    }
    closeCart();
    modalEl.classList.add('is-open');
    overlayEl.classList.add('is-open');
    modalEl.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    $('[data-modal-total]', modalEl).textContent = money(Cart.total());
    const phoneInput = $('#ck-phone', modalEl);
    if (!phoneInput.value) phoneInput.value = localStorage.getItem(PHONE_KEY) || '';
    setTimeout(() => $('#ck-name', modalEl).focus(), 350);
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');
    overlayEl.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    // reset success view if it was showing
    const panel = $('.modal__panel', modalEl);
    if (panel.dataset.done === 'true') {
      setTimeout(() => { panel.dataset.done = 'false'; location.reload(); }, 250);
    }
  }

  async function submitOrder(form, btn) {
    const modal = modalEl;
    const orderType = form.dataset.orderType || 'delivery';
    const fields = form.elements;
    const name = fields.name.value.trim();
    const phone = fields.phone.value.trim().replace(/[\s-]/g, '');
    const address = fields.address.value.trim();
    const notes = fields.notes.value.trim();

    const setInvalid = (field, bad) => {
      const wrap = $('[data-field="' + field + '"]', modal);
      if (wrap) wrap.classList.toggle('is-invalid', bad);
    };

    const nameBad = name.length < 2;
    const phoneBad = !/^(\+91)?[6-9]\d{9}$/.test(phone.replace('+91', ''));
    const addrBad = orderType === 'delivery' && address.length < 8;
    setInvalid('name', nameBad);
    setInvalid('phone', phoneBad);
    setInvalid('address', addrBad);
    if (nameBad || phoneBad || addrBad) {
      const first = $('.field.is-invalid input, .field.is-invalid textarea', modal);
      if (first) first.focus();
      toast('Please check the highlighted fields', 'error');
      return;
    }

    const payload = {
      customer_name: name,
      phone: phone,
      address: orderType === 'delivery' ? address : null,
      order_type: orderType,
      notes: notes || null,
      items: Cart.get().map((it) => ({
        dish_id: it.id,
        name: it.name,
        price: it.price,
        quantity: it.qty
      }))
    };

    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Placing your order…';

    try {
      const res = await apiFetch('/orders', { method: 'POST', body: JSON.stringify(payload) });
      if (!res.ok) {
        let detail = 'Could not place the order. Please try again.';
        try {
          const body = await res.json();
          if (body && body.detail) {
            detail = typeof body.detail === 'string' ? body.detail : 'Please check your order details.';
          }
        } catch (err) { /* keep default */ }
        throw new Error(detail);
      }
      const order = await res.json();
      localStorage.setItem(PHONE_KEY, phone);
      Cart.clear();
      showSuccess(order);
      toast('Order placed — we are on it!');
    } catch (err) {
      toast(err.message || 'Network error — is the backend running?', 'error');
      btn.disabled = false;
      btn.innerHTML = original;
    }
  }

  function showSuccess(order) {
    const panel = $('.modal__panel', modalEl);
    panel.dataset.done = 'true';
    const total = order && order.total != null ? money(order.total) : money(0);
    panel.innerHTML =
      '<div class="success">' +
        '<div class="success__icon">' +
          '<svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
        '</div>' +
        '<h2>Order confirmed</h2>' +
        '<p>Thank you! Our kitchen has received your order and will call to confirm.</p>' +
        '<span class="success__id">Order #' + escapeHtml(order && order.id != null ? order.id : '—') + ' · ' + total + '</span>' +
        '<div class="success__actions">' +
          '<a class="btn btn--primary btn--block" href="orders.html">View order history</a>' +
          '<button class="btn btn--ghost btn--block" type="button" data-modal-close>Order something else</button>' +
        '</div>' +
      '</div>';
    $('[data-modal-close]', panel).addEventListener('click', closeModal);
  }

  /* ------------------------------------------------------------------ */
  /* Navigation                                                          */
  /* ------------------------------------------------------------------ */
  function initNav() {
    const nav = $('.nav');
    const onScroll = () => {
      if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 24);
      const top = $('.to-top');
      if (top) top.classList.toggle('is-visible', window.scrollY > 620);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const burger = $('[data-burger]');
    const menu = $('[data-mobile-menu]');
    if (burger && menu) {
      const toggle = (open) => {
        menu.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('no-scroll', open);
        if (open) {
          $$('.mobile-menu__link', menu).forEach((link, i) => {
            link.style.transitionDelay = (0.06 * i + 0.1) + 's';
          });
        }
      };
      burger.addEventListener('click', () => toggle(!menu.classList.contains('is-open')));
      $$('[data-menu-close]', menu).forEach((b) => b.addEventListener('click', () => toggle(false)));
      $$('.mobile-menu__link', menu).forEach((a) => a.addEventListener('click', () => toggle(false)));
    }

    // mark the current page in the nav
    const path = location.pathname.split('/').pop() || 'index.html';
    $$('.nav__link').forEach((link) => {
      const href = link.getAttribute('href');
      if (href === path) link.classList.add('is-active');
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-cart-open]')) {
        e.preventDefault();
        openCart();
      }
      if (e.target.closest('[data-cart-close]')) closeCart();
      if (e.target.classList.contains('overlay')) {
        closeCart();
        if (modalEl && modalEl.classList.contains('is-open')) closeModal();
      }
      if (e.target.closest('[data-modal-close]') && modalEl && !e.target.closest('.drawer')) {
        if (modalEl.classList.contains('is-open')) closeModal();
      }
      const top = e.target.closest('[data-to-top]');
      if (top) window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (modalEl && modalEl.classList.contains('is-open')) closeModal();
      else if (drawerEl && drawerEl.classList.contains('is-open')) closeCart();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Scroll reveal + counters                                            */
  /* ------------------------------------------------------------------ */
  function initReveal(root) {
    const els = $$('.reveal:not(.is-visible)', root || document);
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
  }

  function initCounters(root) {
    const counters = $$('[data-count]', root || document);
    if (!counters.length) return;
    const run = (el) => {
      const target = parseFloat(el.dataset.count) || 0;
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1600;
      const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        const value = target * eased;
        el.textContent = value.toLocaleString('en-IN', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) { counters.forEach(run); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => io.observe(el));
  }

  /* ------------------------------------------------------------------ */
  /* Lightbox                                                            */
  /* ------------------------------------------------------------------ */
  function initLightbox() {
    const items = $$('[data-lightbox]');
    if (!items.length) return;
    const sources = items.map((el) => el.dataset.lightbox);
    let index = 0;

    const box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML =
      '<button class="lightbox__close" type="button" aria-label="Close">' + ICONS.close + '</button>' +
      '<button class="lightbox__nav lightbox__nav--prev" type="button" aria-label="Previous image">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>' +
      '</button>' +
      '<img alt="">' +
      '<button class="lightbox__nav lightbox__nav--next" type="button" aria-label="Next image">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>' +
      '</button>';
    document.body.appendChild(box);
    const img = $('img', box);

    const show = (i) => {
      index = (i + sources.length) % sources.length;
      img.src = sources[index];
    };
    const open = (i) => {
      show(i);
      box.classList.add('is-open');
      document.body.classList.add('no-scroll');
    };
    const close = () => {
      box.classList.remove('is-open');
      document.body.classList.remove('no-scroll');
    };

    items.forEach((el, i) => {
      el.addEventListener('click', () => open(i));
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
      });
    });
    $('.lightbox__close', box).addEventListener('click', close);
    $('.lightbox__nav--prev', box).addEventListener('click', () => show(index - 1));
    $('.lightbox__nav--next', box).addEventListener('click', () => show(index + 1));
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    document.addEventListener('keydown', (e) => {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(index + 1);
      if (e.key === 'ArrowLeft') show(index - 1);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Page loader                                                         */
  /* ------------------------------------------------------------------ */
  function initLoader() {
    const loader = $('.loader');
    if (!loader) return;
    const done = () => loader.classList.add('is-done');
    if (document.readyState === 'complete') {
      setTimeout(done, 260);
    } else {
      window.addEventListener('load', () => setTimeout(done, 260));
      setTimeout(done, 2200); // never trap the user behind the loader
    }
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */
  function boot() {
    initLoader();
    buildDrawer();
    buildModal();
    initNav();
    initReveal();
    initCounters();
    initLightbox();
    // keep every page in sync when the cart changes in another tab
    window.addEventListener('storage', (e) => {
      if (e.key === CART_KEY) {
        Cart.items = readCart();
        renderCart(Cart.items);
      }
    });
  }

  window.Foodies = {
    Cart, toast, money, formatDate, escapeHtml, apiFetch, dishCard,
    initReveal, initCounters, openCart, openCheckout, ICONS
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
