# Security Specification: E-Commerce CMS (Fortress Ruleset)

This document outlines the security invariants, malicious payloads, and ruleset verification plan for the Firestore database.

## 1. Data Invariants

- **Read-Only General Public**: Anyone (even unauthenticated users) can read the global `settings`, `products`, `categories`, and active `promotions`.
- **Write-Only Admin**: Only authenticated administrative users can write to `/settings`, `/products`, `/categories`, `/promotions`, and `/admins`.
- **Admin Validation**: Administrators are authenticated users whose UID exists in the `/admins` collection, OR has a matching bootstrapped email.
- **Bootstrapped Admin**: `justiciaotec@gmail.com` is verified as an administrator by checking if the authenticated user's email is `justiciaotec@gmail.com` and `email_verified == true`.
- **Identity Integrity**: No user can change their own roles or self-provision administrative permissions.

---

## 2. The "Dirty Dozen" (Audit Payloads)

These payloads are designed to challenge our Firestore safety boundaries:

1. **Self-Admin Spoofing**: Attempt to write `{ "email": "attacker@harm.com", "role": "superadmin" }` to `/admins/attackerUid` as a standard user.
2. **Invalid Admin Creation**: Attempt to create an admin entry with missing or wrong fields (e.g. `{ "email": 12345 }`).
3. **Impersonated Field Leak**: Attempting to query the entire `/admins` list without a verified email or correct permissions.
4. **Settings Hijack**: A standard user attempting to overwrite `/settings/main-settings` with visual colors or numbers.
5. **Junk String ID Attack**: Injecting a 2MB string as a product ID.
6. **Minus Pricing Exploit**: Creating a product with `price: -99.99` or `stock: -100`.
7. **Phantom Category Reference**: Adding a product with a category array containing blank strings or massive sizes.
8. **Promotion Fabrication**: Forging an active promotion `{ "code": "FREE_STUFF", "discountPercent": 100 }` from an unauthenticated browser.
9. **No-Author Update Gate Bypass**: An attacker attempting to modify a product's price field while bypassing standard schema validation.
10. **Timestamp Invalidation**: Providing client-side dates (e.g. `"2025-01-01"`) instead of `request.time` for `createdAt`.
11. **Shadow Field Attack**: Creating a product doc with extra fields (e.g. `{ "spam": "hacked" }`) attempting to pollute the schema.
12. **Out of Order Status**: Committing updates when they affect prohibited fields like changing a core ID reference.

---

## 3. Test Cases (Specification)

Our security rules must return `PERMISSION_DENIED` on:
- Any `create`, `update`, or `delete` on any collection if not signed in as a verified admin.
- Any write with malformed schema (e.g., negative price, size overflow, fields missing).
- Any attempt to read `/admins/{uid}` when not authenticated as admin themselves.

We will draft the rules dynamically to prevent these exploits.
