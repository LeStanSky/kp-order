# Changelog

All notable changes to KPOrder are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/), and the project follows
[Semantic Versioning](https://semver.org/).

## [1.5.0] - 2026-05-16

### Added

- **Pack size ("В уп.")** — products can carry a "units per pack" value. It is
  shown as a column in the catalog and can be edited inline by an admin in the
  product card (empty value resets to the automatic fallback). Backed by a new
  nullable `Product.packSize` field (`add_pack_size` migration).

### Changed

- **Cart minimum for chips** — under standard delivery, the "Чипсы" category now
  requires at least 5 units per item (other packaged goods stay at 3, kegs have
  no minimum). The cart identifies chips by the item's category.

## [1.4.0] - 2026-04-21

### Added

- **18+ age verification gate** — a blocking dialog on first visit; the
  confirmation is remembered for 30 days. "I'm under 18" routes to a stub page
  without locking the account.
- **152-FZ consent banner** — a dismissible bottom banner linking to the new
  Privacy policy page.

### Changed

- Public documentation (`README.md`, `onboarding.md`) translated to English.

## [1.3.1] - 2026-04-21

### Fixed

- Kegs sold by the piece (marked "ШТ") were treated as regular packaged goods
  and wrongly required the 3-unit cart minimum. They are now recognized as kegs.

## [1.3.0] - 2026-04-15

### Added

- **Keg-by-piece unit** — kegs marked "ШТ" skip the stock (дкл→pcs) and price
  (×volume) conversion, both in the frontend and in order processing.
- **Editable product description** — admins edit it inline in the product card;
  the description is no longer overwritten by the ERP sync.

### Changed

- **Cart UX** — removed the "Add to cart" button; the quantity field now drives
  the cart directly with a 400 ms debounce.

## [1.2.1] - 2026-04-06

### Fixed

- **Keg order price** — order items and email notifications now apply the volume
  multiplier (20 L = ×2, 30 L = ×3) when saving.
- Keg products are detected by name when the unit is missing.

### Changed

- CI actions bumped to the latest versions (resolves Node.js 20 deprecation
  warnings).
- Internal docs (API reference, architecture, deploy guide, tech spec) moved to
  `docs_internal/` (gitignored); public docs cleaned up.

## [1.2.0] - 2026-04-04

### Added

- **Product visibility by price group** — `PriceGroup.allowedCategories`
  restricts which categories a client sees. An empty list means no restriction.
  First applied to the "Прайс Субы" group.

## [1.1.0] - 2026-04-02

### Added

- Footer component matching the header theme.
- Order comment included in email notifications to manager and client.
- Ability to add a new comment when repeating an order.

## [1.0.1] - 2026-04-01

### Changed

- Pinned all dependencies to exact versions (no `^`/`~`) to avoid unexpected
  upgrades and reduce supply-chain risk.

## [1.0.0] - 2026-03-31

### Added

- First production release.
- Case-insensitive login (email normalized to lowercase everywhere).
- Manager info returned on login/refresh/me; client header shows the assigned
  manager on hover.

---

## Pre-1.0 highlights

Earlier iterations delivered the foundation: responsive layout, VPS deployment
and CD workflow, SMTP delivery fixes (IPv4), `trust proxy` and auth rate-limit
tuning, expiry-based stock filtering with the "Просрочка" chip, dynamic
categories from МойСклад, cart limits, the `canOrder` flag (browse-only
clients), and product image handling.
