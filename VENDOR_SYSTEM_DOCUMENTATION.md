# Vendor System Documentation
**Ssaye Marketplace — Vendor Login & Management System**

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [User Journey — End to End](#user-journey--end-to-end)
4. [Authentication & Security](#authentication--security)
5. [Database Models](#database-models)
6. [API Reference](#api-reference)
7. [Frontend Pages](#frontend-pages)
8. [Vendor Dashboard Features](#vendor-dashboard-features)
9. [Super Admin: Vendor Approvals](#super-admin-vendor-approvals)
10. [Marketplace Integration](#marketplace-integration)
11. [File Structure](#file-structure)

---

## Overview

The vendor system is a **completely separate login and management layer** built on top of the existing Ssaye customer marketplace. It allows businesses (suppliers, grocers, specialty importers) to register as vendors, list their own products, and have those products appear alongside the existing CSV-sourced catalogue on the public marketplace — all subject to a super admin approval gate.

### Key Design Principles

- **Full separation** — vendors have their own MongoDB collection, their own JWT tokens, their own localStorage keys, and their own middleware. A vendor JWT cannot be used on customer endpoints and vice versa.
- **Approval-first** — no vendor can log in or list products until a super admin explicitly approves their account.
- **Zero marketplace changes** — vendor products are merged at the API layer; the public Marketplace frontend component required no modification.
- **Image flexibility** — vendors can upload image files (converted to base64 and stored in MongoDB) or paste a URL; either method works transparently in the marketplace display.
- **No bot exposure** — all `/vendor/*` routes are excluded from the chatbot router so no AI assistant is shown on vendor pages.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PUBLIC MARKETPLACE                    │
│        /api/products (GET) — merged product feed        │
│   CSV Products (MongoDB: products) +                    │
│   Vendor Products (MongoDB: vendorproducts, isListed)   │
└─────────────────────────────────────────────────────────┘
              ↑ normalised to same shape
┌──────────────────────┐     ┌──────────────────────────┐
│   CUSTOMER SYSTEM    │     │      VENDOR SYSTEM        │
│                      │     │                           │
│  Model: User         │     │  Model: Vendor            │
│  Token: 'token'      │     │  Token: 'vendor_token'    │
│  Storage: 'user'     │     │  Storage: 'vendor_info'   │
│  Middleware: auth.js │     │  Middleware: vendorAuth.js│
│  Routes: /api/auth   │     │  Routes: /api/vendor/auth │
└──────────────────────┘     └──────────────────────────┘
                                         ↓
                              ┌──────────────────────────┐
                              │   SUPER ADMIN GATE        │
                              │  /api/superadmin/vendors  │
                              │  approve / suspend / reset│
                              └──────────────────────────┘
```

---

## User Journey — End to End

### 1. Login Page — Role Chooser

When a user visits `/login`, they are no longer taken straight to a login form. Instead they see a **role chooser screen** with two cards:

| Card | Icon | Action |
|------|------|--------|
| Customer | 👤 | Reveals the existing email/password form on the same page |
| Vendor | 🏪 | Navigates to `/vendor/login` |

The Customer card uses local state (`role` toggled from `null` to `'customer'`); a **← Back** button resets it to the chooser. The Vendor card is a hard navigation — entirely separate auth flow.

---

### 2. Vendor Registration — `/vendor/register`

New vendors fill in a structured multi-section form:

**Section: Personal Details**
- Full Name (legal name of the person registering)

**Section: Business Details**
- Business Name (the brand/store name that appears on listings)
- Business ID / Licence Number (e.g. ABN, company registration number)

**Section: Contact**
- Email Address (used for login; must be unique)
- Phone Number

**Section: Set Password**
- Password (minimum 6 characters)
- Confirm Password (client-side match validation before any API call)

**On submission:**
- Client validates password match before sending the request
- Server validates all fields with `express-validator`
- Server checks for duplicate email and duplicate businessId separately (giving specific error messages for each)
- Password is hashed with bcrypt (10 salt rounds) before storage
- Account is created with `status: 'pending'`
- **No JWT token is issued** — the vendor cannot log in yet
- A success screen is shown explaining the account is under review

**Success screen message:**
> "Your vendor account is under review. A super admin will approve your registration shortly. You will be able to log in once approved."

---

### 3. Super Admin Approval — `/superadmin` → Vendor Approvals Tab

Once registered, the vendor's account sits in the `pending` state until a super admin takes action.

The Super Admin dashboard has a **"🏪 Vendor Approvals (N)"** tab where N is the count of pending vendors. The tab shows every vendor with:

- Business name (large, prominent)
- Status badge (colour-coded: amber for pending, green for approved, red for suspended)
- Full name, email, phone
- Business ID / licence number
- Registration date

Three action buttons are available per vendor:
- **Approve** — sets status to `approved` (vendor can now log in)
- **Suspend** — sets status to `suspended` (blocks login, shows suspension message)
- **Reset to Pending** — sets status back to `pending` (revokes access without full suspension)

Changes are applied immediately via `PATCH /api/superadmin/vendors/:id/status` and the UI updates in place without a page refresh.

---

### 4. Vendor Login — `/vendor/login`

Once approved, the vendor logs in with their email and password.

The login endpoint checks status before issuing a token:

| Vendor Status | HTTP Response | Message shown to vendor |
|--------------|---------------|-------------------------|
| `pending` | 403 | "Your account is pending approval. You will be notified once a super admin reviews your registration." |
| `suspended` | 403 | "Your vendor account has been suspended. Please contact support." |
| `approved` | 200 | Token issued, redirected to dashboard |

**On successful login:**
- A JWT is issued with a 7-day expiry containing: `{ vendorId, email, businessName, isVendor: true }`
- Token stored in `localStorage` under key `vendor_token`
- Vendor info (fullName, businessName, email, phone, status) stored under key `vendor_info`
- Redirected to `/vendor/dashboard`

The login form includes a **password visibility toggle** (👁️ / 🙈) and a link to register or return to the customer login page.

---

### 5. Vendor Dashboard — `/vendor/dashboard`

The dashboard is a standalone page (no Navbar, no Footer, no chatbot) with its own header and tab navigation.

See [Vendor Dashboard Features](#vendor-dashboard-features) for full detail.

---

### 6. Products Appear on Marketplace

Approved vendor products with `isListed: true` automatically appear in the public marketplace at `/marketplace`. They are merged with CSV products at the API layer and are indistinguishable in display from other products. The category sidebar counts include vendor products. Sorting and pagination apply across the combined set.

---

## Authentication & Security

### Middleware: `server/middleware/vendorAuth.js`

Every vendor-protected endpoint passes through this middleware:

```
Authorization: Bearer <vendor_token>
```

The middleware:
1. Extracts the token from the `Authorization` header
2. Verifies it with `jwt.verify()`
3. Checks that `decoded.isVendor === true` — if this flag is absent or false, returns HTTP 403 "Vendor access only"
4. Attaches `decoded` to `req.vendor` (not `req.user`)

This means a customer JWT — which has no `isVendor` flag — cannot be used to access vendor endpoints even if the user somehow obtains one.

### JWT Payload

```json
{
  "vendorId": "<MongoDB ObjectId>",
  "email": "vendor@example.com",
  "businessName": "Example Store",
  "isVendor": true,
  "iat": <issued at>,
  "exp": <7 days>
}
```

### localStorage Key Separation

| Purpose | Key |
|---------|-----|
| Customer token | `token` |
| Customer profile | `user` |
| Vendor token | `vendor_token` |
| Vendor profile | `vendor_info` |

These never overlap. A customer logged in and a vendor logged in simultaneously in the same browser session will not interfere with each other.

### Ownership Enforcement

All product endpoints verify `vendorId` ownership at the database query level:

```js
VendorProduct.findOne({ _id: req.params.id, vendorId: req.vendor.vendorId })
```

A vendor cannot read, edit, or delete another vendor's products — even with a valid token.

### Password Security

- Passwords hashed with **bcrypt** at 10 salt rounds on registration
- Plain-text password never stored or returned in any response
- All API responses for vendor objects use `.select('-password')` to strip the hash

---

## Database Models

### `Vendor` — `server/models/Vendor.js`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `fullName` | String | required, trimmed | Legal name of the registrant |
| `businessName` | String | required, trimmed | Shown on marketplace listings |
| `businessId` | String | required, **unique**, trimmed | ABN / company number / licence |
| `email` | String | required, **unique**, lowercase | Used for login |
| `phone` | String | required, trimmed | Contact number |
| `password` | String | required, min 6 chars | Stored as bcrypt hash |
| `status` | String | enum: `pending` / `approved` / `suspended` | Default: `pending` |
| `createdAt` | Date | auto | Default: `Date.now` |

Both `businessId` and `email` have MongoDB unique indexes — duplicate registrations are caught at the model level even if the route-level checks are bypassed.

---

### `VendorProduct` — `server/models/VendorProduct.js`

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `vendorId` | ObjectId | required, indexed, ref: Vendor | Links product to its vendor |
| `vendorBusinessName` | String | required | Copied from JWT on creation; used in marketplace display |
| `name` | String | required, trimmed | Product name |
| `brand` | String | required, trimmed | Brand name |
| `category` | String | required, enum (14 values) | Must match marketplace category list |
| `price` | Number | required, min: 0 | Current selling price |
| `originalPrice` | Number | nullable | Strike-through price for discount display |
| `unit` | String | optional | e.g. "5kg", "500g", "per piece" |
| `stock` | String | enum: `In Stock` / `Low` / `Out of Stock` | Default: `In Stock` |
| `description` | String | optional | Short product description |
| `emoji` | String | default: `🛒` | Category emoji fallback |
| `imageUrl` | String | nullable | External image URL |
| `imageData` | String | nullable | Base64 data URI from file upload |
| `badge` | String | enum: `null` / `Low` / `Organic` / `Fresh` / `Halal` | Marketplace badge |
| `isListed` | Boolean | default: `true` | Controls visibility in public marketplace |
| `rating` | Number | min: 0, max: 5, default: 0 | Star rating |
| `reviews` | Number | default: 0 | Review count |
| `createdAt` | Date | auto (timestamps: true) | |
| `updatedAt` | Date | auto (timestamps: true) | |

**Supported categories** (same 14 as the CSV product catalogue):
Dal & Lentils, Rice & Grains, Spices & Masala, Atta & Flour, Oils & Ghee, Snacks & Namkeen, Pickles & Chutneys, Frozen Foods, Dairy & Paneer, Tea, Coffee & Drinks, Sweets & Mithai, Fresh Produce, Meat & Seafood, Pooja Items

---

## API Reference

### Vendor Auth Routes — `/api/vendor/auth`

#### `POST /api/vendor/auth/register`

Register a new vendor. No authentication required.

**Request body:**
```json
{
  "fullName": "Jane Smith",
  "businessName": "Smith's Grocers",
  "businessId": "ABN 12 345 678 901",
  "email": "jane@smithsgrocers.com",
  "phone": "+1 555 000 1234",
  "password": "securepass123"
}
```

**Responses:**

| Status | Condition |
|--------|-----------|
| 201 | Account created, pending approval |
| 400 | Validation error, duplicate email, or duplicate businessId |
| 500 | Server error |

**201 response:**
```json
{
  "success": true,
  "message": "Registration successful. Your account is under review...",
  "vendor": { "id", "fullName", "businessName", "email", "status": "pending" }
}
```

No token is issued. The vendor must wait for approval before logging in.

---

#### `POST /api/vendor/auth/login`

Authenticate a vendor. No authentication required.

**Request body:**
```json
{
  "email": "jane@smithsgrocers.com",
  "password": "securepass123"
}
```

**Responses:**

| Status | Condition |
|--------|-----------|
| 200 | Approved vendor — token issued |
| 400 | Invalid credentials or validation error |
| 403 | Account is `pending` or `suspended` |
| 500 | Server error |

**200 response:**
```json
{
  "success": true,
  "token": "<JWT — 7 day expiry>",
  "vendor": { "id", "fullName", "businessName", "email", "phone", "status": "approved" }
}
```

**403 pending response:**
```json
{
  "success": false,
  "message": "Your account is pending approval...",
  "status": "pending"
}
```

---

#### `GET /api/vendor/auth/me`

Returns the authenticated vendor's full profile. Requires vendor JWT.

**Headers:** `Authorization: Bearer <vendor_token>`

**200 response:**
```json
{
  "success": true,
  "vendor": { "fullName", "businessName", "businessId", "email", "phone", "status", "createdAt" }
}
```

Password is excluded from the response.

---

### Vendor Product Routes — `/api/vendor/products`

All routes require `Authorization: Bearer <vendor_token>`.

#### `GET /api/vendor/products`

Returns all products belonging to the authenticated vendor, sorted newest first.

**200 response:**
```json
{
  "success": true,
  "products": [ /* array of VendorProduct documents */ ]
}
```

---

#### `POST /api/vendor/products`

Add a new product.

**Required fields:** `name`, `brand`, `category`, `price`

**Optional fields:** `originalPrice`, `unit`, `stock`, `description`, `emoji`, `imageUrl`, `imageData`, `badge`

`vendorBusinessName` is set automatically from the JWT payload — the vendor cannot spoof a different business name.

**201 response:**
```json
{
  "success": true,
  "product": { /* new VendorProduct document */ }
}
```

---

#### `PATCH /api/vendor/products/:id`

Update a product. Ownership is verified at database level (`vendorId` must match).

**Updatable fields:** `name`, `brand`, `category`, `price`, `originalPrice`, `unit`, `stock`, `description`, `emoji`, `imageUrl`, `imageData`, `badge`, `isListed`

Only fields present in the request body are updated.

---

#### `DELETE /api/vendor/products/:id`

Delete a product. Ownership is verified at database level. Returns 404 if the product does not belong to this vendor.

---

### Super Admin Vendor Routes — `/api/superadmin`

All routes require super admin authentication (existing `superAdminMiddleware`).

#### `GET /api/superadmin/vendors`

Returns all registered vendors sorted by registration date (newest first). Passwords are excluded.

**200 response:**
```json
{
  "success": true,
  "vendors": [ /* array of Vendor documents without password */ ]
}
```

---

#### `PATCH /api/superadmin/vendors/:id/status`

Change a vendor's status.

**Request body:**
```json
{ "status": "approved" }
```

**Valid values:** `approved`, `suspended`, `pending`

**200 response:**
```json
{
  "success": true,
  "vendor": { /* updated Vendor document without password */ }
}
```

---

### Public Products Route — `/api/products` (modified)

The existing public product endpoint was modified to merge vendor products into the feed.

**Logic:**
1. Build search/category filter from query params
2. Fetch `Product` (CSV) and `VendorProduct` (where `isListed: true`) in parallel using `Promise.all`
3. Normalise each VendorProduct to the same shape the frontend expects
4. Merge both arrays, re-sort by the requested sort key, then paginate

**Normalised VendorProduct shape:**
```json
{
  "id": "vp_<MongoDB _id>",
  "_id": "<MongoDB _id>",
  "name": "Tilda Basmati 5kg",
  "brand": "Tilda",
  "category": "Rice & Grains",
  "price": 12.99,
  "originalPrice": 15.99,
  "rating": 0,
  "reviews": 0,
  "stock": "In Stock",
  "emoji": "🌾",
  "badge": "Organic",
  "imageUrl": "<imageData base64 OR imageUrl string OR null>",
  "vendor": "Smith's Grocers",
  "isVendorProduct": true
}
```

The `id` field uses the `vp_` prefix to ensure it never collides with numeric CSV product IDs.

The `imageUrl` field in the normalised output is resolved as: `imageData || imageUrl || null` — base64 uploads take priority over external URLs.

**Category counts** (`GET /api/products/category-counts`) also runs a parallel aggregation on `VendorProduct` and merges the counts so the sidebar accurately reflects the total number of products in each category across both sources.

---

## Frontend Pages

### `client/src/pages/Login.js` — Role Chooser

**State:** `role` — `null` (chooser visible) or `'customer'` (login form visible)

When `role === null`, renders two cards side by side:
- 👤 Customer → sets `role` to `'customer'`
- 🏪 Vendor → `navigate('/vendor/login')`

When `role === 'customer'`, renders the existing login form with a **← Back** button that resets `role` to `null`.

---

### `client/src/pages/VendorLogin.js`

**Route:** `/vendor/login`

- Email + password fields with password visibility toggle
- Inline error display for any API error (including pending/suspended messages)
- On success: stores `vendor_token` and `vendor_info`, navigates to `/vendor/dashboard`
- Footer links: "Register your business" → `/vendor/register`, "← Back to customer login" → `/login`

---

### `client/src/pages/VendorRegister.js`

**Route:** `/vendor/register`

Multi-section form split into four labelled groups: Personal Details, Business Details, Contact, Set Password.

- Client validates password confirmation before API call
- Shows field-level error from `express-validator` or field-specific duplicate messages
- On success: replaces the form with a success card — no auto-login, no navigation

Footer links: "Already registered? Sign in" → `/vendor/login`, "← Back to customer login" → `/login`

---

### `client/src/pages/VendorDashboard.js`

**Route:** `/vendor/dashboard`

- Auth guard on mount: if `vendor_token` is absent in localStorage, immediately redirects to `/vendor/login`
- On mount: loads vendor info from `vendor_info` in localStorage, fetches products from API
- Two tabs: **📦 My Products** and **👤 Account**

See [Vendor Dashboard Features](#vendor-dashboard-features) below.

---

### `client/src/pages/VendorAuth.css`

Shared stylesheet for VendorLogin and VendorRegister (namespace: `vauth-*`).

Notable features:
- Gradient background: `linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)`
- Responsive two-column row layout for register form (collapses to single column on mobile ≤600px)
- Smooth button hover: `opacity 0.15s, translateY(-1px)`
- Password toggle button absolutely positioned inside the input wrapper

---

### `client/src/pages/VendorDashboard.css`

Full stylesheet for the dashboard (namespaces: `vd-*` for dashboard, `vpf-*` for product form).

- Sticky header with shadow
- Tab bar with indigo active indicator
- Responsive product rows that wrap on mobile ≤640px
- Dashed upload area with hover highlight
- Stock badge colours: green (In Stock), amber (Low), red (Out of Stock)
- Status badge colours: green (approved), amber (pending), red (suspended)

---

## Vendor Dashboard Features

### Header

Displays the vendor's business name (from `vendor_info`) and a "Sign Out" button. Clicking Sign Out clears `vendor_token` and `vendor_info` from localStorage and navigates to `/vendor/login`.

---

### My Products Tab

**Add Product button** — opens the product form inline at the top of the list.

#### Product Form

Fields and their behaviour:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Product Name | Text | Yes | |
| Brand | Text | Yes | |
| Category | Select (14 options) | Yes | Auto-sets emoji on save |
| Unit / Size | Text | No | e.g. "5kg", "per piece" |
| Price (USD) | Number | Yes | Decimal, min 0 |
| Original Price | Number | No | Creates strike-through on marketplace |
| Stock Status | Select | No | In Stock / Low Stock / Out of Stock |
| Badge | Select | No | None / Organic / Fresh / Halal / Low Stock |
| Description | Textarea | No | |
| Product Image | Toggle + input | No | See Image Modes below |

**Image Modes** — toggled by two buttons ("URL" / "Upload File"):

- **URL mode**: Text input for an external image URL. Preview updates live as the vendor types.
- **Upload File mode**: Click-to-upload area triggers a hidden `<input type="file" accept="image/*">`. The file is read with `FileReader.readAsDataURL()` and converted to a base64 data URI which is previewed immediately and sent to the server as `imageData`. Supports JPG, PNG, WEBP; ~2MB recommended maximum.

If no image is provided, a category-mapped emoji is shown in the marketplace instead.

**On submit:**
- `price` and `originalPrice` are parsed to floats
- `emoji` is set from `CATEGORY_EMOJI[form.category]` (overrides any manually set emoji)
- The form closes and the product list refreshes

**Edit mode** — clicking Edit on any product opens the same form pre-populated with that product's current data.

---

#### Product List

Each product appears as a row showing:
- **Thumbnail** — image (from `imageData` or `imageUrl`) or emoji fallback
- **Product name** (truncated with ellipsis if too long)
- **Meta line** — Brand · Category · Unit
- **Badges** — colour-coded stock status, "Hidden" badge if unlisted, product badge (Organic etc.)
- **Price** — current price with original price struck through if set
- **Actions** — Edit, Hide/Show, Delete

**Hide / Show toggle:** Calls `PATCH /api/vendor/products/:id` with `{ isListed: !product.isListed }`. Unlisted products are dimmed (opacity 0.6) in the list and do not appear in the public marketplace. They remain in the vendor's list so they can be re-listed later.

**Delete:** Shows `window.confirm()` before calling `DELETE /api/vendor/products/:id`. The product list refreshes after deletion.

**Empty state:** If no products exist yet, shows a centred empty state with a direct "+ Add Your First Product" call-to-action.

---

### Account Tab

Displays a card with five rows:

| Label | Value |
|-------|-------|
| Full Name | From `vendor_info` |
| Business Name | From `vendor_info` |
| Email | From `vendor_info` |
| Phone | From `vendor_info` |
| Account Status | Colour-coded badge: green (approved) / amber (pending) / red (suspended) |

---

## Super Admin: Vendor Approvals

Located in `client/src/pages/SuperAdmin.js`.

### Tab Button

```
🏪 Vendor Approvals (3)
```

The number in parentheses is the count of vendors currently in `pending` status. It is computed live from the `vendors` state array.

### Vendor Card Layout

Each vendor is displayed in a card with:
- Business name (large heading)
- Status badge (colour-coded)
- Full name, email address, phone number
- Business ID / licence number
- Registration date (formatted)
- Three action buttons

### Status Badge Colours

| Status | Background | Text |
|--------|------------|------|
| pending | Amber / `#fef3c7` | Dark amber |
| approved | Green / `#d1fae5` | Dark green |
| suspended | Red / `#fee2e2` | Dark red |

### Action Buttons

| Button | Status Set | CSS Modifier |
|--------|------------|--------------|
| Approve | `approved` | `--approve` (green) |
| Suspend | `suspended` | `--suspend` (red) |
| Reset to Pending | `pending` | `--pending` (amber) |

Clicking any button calls `PATCH /api/superadmin/vendors/:id/status` and updates the vendor card in place using `setVendors(prev => prev.map(...))` — no page reload required.

### Data Fetching

`fetchVendors()` is called in the initial `useEffect` alongside the existing users and investments fetches. It uses the super admin's `localStorage.getItem('token')` (the customer/admin token), not the vendor token.

---

## Marketplace Integration

### How Vendor Products Appear

From the public marketplace's perspective, vendor products look identical to CSV products. The normalisation in `server/routes/products.js` maps every VendorProduct field to the shape the Marketplace React component already knows how to render:

- `id: vp_${_id}` — prefixed to avoid ID collisions with numeric CSV IDs
- `isVendorProduct: true` — can be used in future for filtering or labelling
- `vendor: vendorBusinessName` — the supplier name (currently stored but not prominently displayed on cards)
- `imageUrl` — resolved as `imageData || imageUrl || null` so uploaded images (base64) and external URLs both work

### Sorting

After merging, the combined array is re-sorted in Node.js using the same sort key requested by the frontend (`popular`, `price-asc`, `price-desc`, `rating`, `name`). Pagination then applies to the sorted merged array.

### Category Counts

The sidebar category filter counts are accurate across both sources. The category-counts endpoint runs two aggregations in parallel and merges the result objects:

```js
const [csvAgg, vendorAgg] = await Promise.all([
  Product.aggregate([...]),
  VendorProduct.aggregate([{ $match: { isListed: true } }, ...]),
]);
// Merges counts for each category
```

### Controlling Visibility

- `isListed: true` — product appears in marketplace
- `isListed: false` — product is hidden from marketplace but remains in the vendor's dashboard
- Vendor account `status: suspended` — the vendor can still log in and see their products, but they cannot change `isListed` to `true` to re-expose them (enforcement would be added at the PATCH route if required)

---

## File Structure

```
server/
├── models/
│   ├── Vendor.js                    ← Vendor schema (separate from User)
│   └── VendorProduct.js             ← Product schema for vendor-sourced items
├── middleware/
│   └── vendorAuth.js                ← JWT middleware (checks isVendor: true)
├── routes/
│   ├── vendorAuth.js                ← /api/vendor/auth (register, login, me)
│   ├── vendorProducts.js            ← /api/vendor/products (CRUD, ownership enforced)
│   ├── products.js                  ← MODIFIED: merges VendorProduct into public feed
│   └── superadmin.js                ← MODIFIED: added GET/PATCH /vendors endpoints
└── server.js                        ← MODIFIED: mounts /api/vendor/auth and /api/vendor/products

client/src/
├── pages/
│   ├── Login.js                     ← MODIFIED: role chooser (Customer / Vendor)
│   ├── Login.css                    ← MODIFIED: chooser and role card styles
│   ├── VendorLogin.js               ← Vendor sign-in page
│   ├── VendorRegister.js            ← Vendor registration page
│   ├── VendorAuth.css               ← Shared CSS for Login + Register
│   ├── VendorDashboard.js           ← Vendor portal (products + account tabs)
│   ├── VendorDashboard.css          ← Dashboard styles
│   ├── SuperAdmin.js                ← MODIFIED: Vendor Approvals tab
│   └── SuperAdmin.css               ← MODIFIED: vendor card and badge styles
└── App.js                           ← MODIFIED: /vendor/* routes + NO_BOT_PATHS
```

---

## Route Summary

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/vendor/login` | GET (page) | None | Vendor sign-in UI |
| `/vendor/register` | GET (page) | None | Vendor registration UI |
| `/vendor/dashboard` | GET (page) | vendor_token in localStorage | Vendor portal |
| `/api/vendor/auth/register` | POST | None | Create vendor account |
| `/api/vendor/auth/login` | POST | None | Authenticate vendor |
| `/api/vendor/auth/me` | GET | Vendor JWT | Get own profile |
| `/api/vendor/products` | GET | Vendor JWT | List own products |
| `/api/vendor/products` | POST | Vendor JWT | Add product |
| `/api/vendor/products/:id` | PATCH | Vendor JWT | Update product |
| `/api/vendor/products/:id` | DELETE | Vendor JWT | Delete product |
| `/api/superadmin/vendors` | GET | Super Admin JWT | List all vendors |
| `/api/superadmin/vendors/:id/status` | PATCH | Super Admin JWT | Approve / suspend / reset |
| `/api/products` | GET | None | Public marketplace (includes vendor products) |
| `/api/products/category-counts` | GET | None | Category counts (includes vendor products) |
