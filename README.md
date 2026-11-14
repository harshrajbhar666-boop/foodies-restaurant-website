# Foodies Restaurant — redesigned

A premium redesign of the Foodies Restaurant website: warm-cream editorial layout, orange
accent, forest-green and charcoal feature sections, scroll-reveal motion, an interactive menu
with search and filtering, and a slide-over cart that talks to the same FastAPI + SQLite
backend as before.

Nothing about the data model or the API contract changed — only the experience did.

---

## 1. Run it

```bash
cd foodies-restaurant
python3 -m pip install -r requirements.txt
python3 -m uvicorn backend.main:app --reload --port 8000
```

Open <http://127.0.0.1:8000>.

`./run.sh` does the same thing (installs requirements, then starts uvicorn on port 8000).

The frontend is served by FastAPI from the same origin, so the browser calls `/orders`
directly. Opening `frontend/index.html` from the file system also works — the app then talks
to `http://127.0.0.1:8000` automatically.

The SQLite file `foodies.db` is created next to the backend on first boot. Override it with
`FOODIES_DB=/path/to/file.db` if you prefer.

---

## 2. Project structure

```
foodies-restaurant/
├── backend/
│   ├── main.py           FastAPI app + routes + static mount
│   ├── database.py       SQLite engine, session factory, Base
│   ├── models.py         Order, OrderItem (same schema, additive columns)
│   └── schemas.py        Pydantic request/response models
├── frontend/
│   ├── index.html        Home: hero, popular, offers, about, why-us, reviews, gallery, contact
│   ├── menu.html         Full menu with search, category chips, veg filter
│   ├── orders.html       Order history with phone filter and live status
│   ├── css/style.css     Design tokens + every component
│   ├── js/data.js        Dish catalogue, testimonials, gallery (single source of truth)
│   ├── js/app.js         Cart store, drawer, checkout, toasts, nav, reveal, counters, lightbox
│   ├── js/home.js        Homepage rendering (popular dishes, marquee, gallery, countdown)
│   ├── js/menu.js        Filtering, search, skeletons, empty state
│   ├── js/orders.js      Order history fetch + render + states
│   └── assets/
│       ├── img/          25 optimised photographs (all local — no external image URLs)
│       ├── fonts/        Self-hosted Fraunces + Plus Jakarta Sans (woff2)
│       ├── favicon.svg
│       └── CREDITS.md    Photo attribution
├── requirements.txt
├── run.sh
└── README.md
```

---

## 3. API (unchanged contract)

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/orders` | Create an order from the cart |
| `GET` | `/orders` | Order history, newest first. `?phone=` filters, `?limit=` caps |
| `GET` | `/orders/{id}` | Single order |
| `PATCH` | `/orders/{id}/status` | Move an order through the kitchen (`pending`, `preparing`, `out_for_delivery`, `completed`, `cancelled`) |
| `GET` | `/health` | Liveness probe |

Request body for `POST /orders`:

```json
{
  "customer_name": "Harsh Rajbhar",
  "phone": "9820011223",
  "address": "12 Hill Road, Bandra West, Mumbai 400050",
  "order_type": "delivery",
  "notes": "Less spicy",
  "items": [
    { "dish_id": "butter-chicken", "name": "Old Delhi Butter Chicken", "price": 449, "quantity": 2 }
  ]
}
```

Totals are recalculated on the server (`price × quantity`, summed) so the stored amount is
always trustworthy. `422` is returned when an item list is empty, the phone is malformed, or a
delivery order has no address. `address` is optional for `order_type: "pickup"`.

Database schema (SQLite):

```
orders(id, customer_name, phone, address, order_type, notes, total, status, created_at)
order_items(id, order_id → orders.id, dish_id, name, price, quantity)
```

Interactive docs: <http://127.0.0.1:8000/docs>.

---

## 4. What the redesign covers

**Design system** — cream `#FFF8F0` canvas, orange `#F97316` accent, forest `#183D32` and
charcoal `#171717` feature bands, `#292524` text, white cards. Fraunces for display type,
Plus Jakarta Sans for UI text. One set of tokens for radii, shadows and easing curves, so
every component moves the same way.

**Homepage** — sticky glass navigation that condenses on scroll, split hero with an arched
photo, floating rating/delivery cards and a rotating freshness seal, animated stat counters,
trust marquee, four popular-dish cards, a 30% offer panel with a live countdown and copy-code
button, an about collage, a green "why choose us" band, a testimonial marquee with a rating
summary, a six-image gallery with a keyboard-accessible lightbox, contact cards with an
embedded map, and a four-column footer.

**Menu** — sticky filter bar with live search (debounced), six category chips with counts,
a veg-only toggle, skeleton cards on first paint, result count, empty state with reset, and
shareable `?category=` deep links. Every card adds to the cart with a check-mark
micro-interaction and a toast.

**Cart & checkout** — slide-over drawer, quantity steppers, per-line totals, free-delivery
progress hint, subtotal / delivery / total summary, and a checkout dialog with delivery vs
pickup, inline validation that clears as you type, a loading state on the submit button, and
an animated confirmation with the order number. Cart lives in `localStorage` under
`foodies_cart`, so it survives reloads and syncs across tabs.

**Order history** — reads `GET /orders`, filters by the phone number saved from your last
order, shows summary stats, per-order items, address, notes and a status chip, with skeleton,
error (with retry) and empty states.

**Motion** — IntersectionObserver scroll reveals with per-card stagger, hover lift and image
zoom, floating hero elements, animated counters, marquee strips, button shine sweep, cart
badge bump, page loader, toasts. Everything is CSS-driven and honours
`prefers-reduced-motion: reduce`.

**Responsive** — 1440 / 1100 / 960 / 720 / 420 breakpoints, mobile drawer navigation, single
column cards on phones, horizontally scrollable chips, and images sized per breakpoint.

**Accessibility** — semantic landmarks, skip-free focus outlines, `aria-label`/`aria-pressed`
on icon buttons, `aria-live` on the menu grid and order list, keyboard support for the
lightbox and drawer, and Escape to close overlays.

---

## 5. Quality checks run

- `POST /orders` → `201` with server-computed total; empty items, bad phone and
  delivery-without-address all return `422`; pickup without address returns `201`.
- `GET /orders`, `GET /orders?phone=`, `GET /orders/{id}`, `PATCH /orders/{id}/status` and
  `404` for an unknown id.
- Static delivery of every page, stylesheet, script, image and font (all `200`).
- Browser run-through at 1440×900 and 390×844: 15 dish cards render, category filter and
  search return the right counts, veg filter narrows to 11, add-to-cart updates the badge,
  the drawer totals recalculate on quantity change (₹827 → ₹1,107), empty-form validation
  flags all three required fields, the order posts successfully, the cart clears, and the new
  order appears in the history with status `pending`. No console errors on any page.
- No broken local references; no external image URLs.

---

## 6. Notes

- Photography is bundled locally in `frontend/assets/img/` and credited in
  `frontend/assets/CREDITS.md`. Nothing loads from a stock-photo CDN, so the site cannot
  break because a remote URL died.
- Fonts are self-hosted, so the typography works offline too.
- The Google Maps iframe on the contact section is the only third-party embed; it degrades
  to a styled map placeholder if it cannot load.
- Dish content lives in `js/data.js`. Add a dish there and it appears on the menu page, in the
  category counts and (with `popular: true`) on the homepage — no other file to touch.
