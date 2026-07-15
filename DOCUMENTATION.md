# Ssaye Club — End-to-End Technical Documentation

**Last Updated:** July 2026  
**Stack:** MongoDB · Express.js · React 18 · Node.js (MERN)  
**Scope:** Full platform — Marketplace, Investments, Smart City, Admin

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Directory Structure](#2-architecture--directory-structure)
3. [Environment & Configuration](#3-environment--configuration)
4. [Database Models](#4-database-models)
5. [Server — API Reference](#5-server--api-reference)
6. [Client — Pages & Components](#6-client--pages--components)
7. [Marketplace — Deep Dive](#7-marketplace--deep-dive)
8. [Authentication System](#8-authentication-system)
9. [State Management & Context](#9-state-management--context)
10. [Key User Workflows](#10-key-user-workflows)
11. [Admin & Super Admin Features](#11-admin--super-admin-features)
12. [Security](#12-security)
13. [Deployment](#13-deployment)

---

## 1. Project Overview

Ssaye Club is a full-stack MERN web application serving the South Asian community. It combines three major product pillars:

| Pillar | Description |
|---|---|
| **Marketplace** | South Asian grocery e-commerce with personalization, subscriptions, and AI assistance |
| **Investments** | Real estate, farm, and asset investment opportunities |
| **Smart City** | Smart city features and community services |

The brand mission: *"Empowering communities through authentic South Asian flavours."*

---

## 2. Architecture & Directory Structure

```
Ssaye/
├── client/                        # React 18 frontend (port 3000)
│   ├── public/
│   └── src/
│       ├── App.js                 # Root router (18 routes)
│       ├── index.js               # React DOM entry point
│       ├── pages/                 # 17 page components
│       │   ├── Marketplace.js     # Core shopping interface (1022 lines)
│       │   ├── ProductDetail.js   # Single product page
│       │   ├── MarketplaceManager.js
│       │   ├── Home.js
│       │   ├── Assets.js
│       │   ├── SmartCity.js
│       │   ├── Farms.js
│       │   ├── Blog.js
│       │   ├── Login.js
│       │   ├── Signup.js
│       │   ├── Portfolio.js
│       │   ├── Investments.js
│       │   ├── Admin.js
│       │   ├── SuperAdmin.js
│       │   ├── Premium.js
│       │   └── Settings.js
│       ├── components/            # 8 shared components
│       │   ├── Navbar.js
│       │   ├── Footer.js
│       │   ├── ChatBot.js         # General AI chatbot
│       │   ├── SsayeBot.js        # Marketplace-specific AI bot
│       │   ├── ConfirmationModal.js
│       │   ├── Toast.js
│       │   ├── Pagination.js
│       │   └── ScrollToTop.js
│       ├── context/
│       │   ├── AuthContext.js     # JWT auth state
│       │   └── ToastContext.js    # Toast notifications
│       ├── hooks/
│       │   └── useConfirmation.js
│       └── utils/
│           └── scrollLock.js
│
├── server/                        # Express.js backend (port 5001)
│   ├── server.js                  # App entry point, middleware, route mounting
│   ├── middleware/
│   │   ├── auth.js                # JWT verification middleware
│   │   └── superAdmin.js          # Super admin role check
│   ├── models/                    # 10 Mongoose schemas
│   │   ├── Product.js
│   │   ├── User.js
│   │   ├── MarketplaceOrder.js
│   │   ├── Wishlist.js
│   │   ├── Review.js
│   │   ├── Subscription.js
│   │   ├── UserActivity.js
│   │   ├── Investment.js
│   │   ├── InvestmentOpportunity.js
│   │   └── InvestmentApplication.js
│   └── routes/                    # 14 route modules
│       ├── products.js
│       ├── marketplaceOrders.js
│       ├── wishlist.js
│       ├── reviews.js
│       ├── recommendations.js
│       ├── subscriptions.js
│       ├── auth.js
│       ├── investments.js
│       ├── opportunities.js
│       ├── chat.js
│       ├── chatMarketplace.js
│       ├── compare.js
│       ├── inventory.js
│       ├── market.js
│       └── superadmin.js
│
├── package.json                   # Root — monorepo scripts via concurrently
└── DOCUMENTATION.md               # This file
```

---

## 3. Environment & Configuration

### Root `package.json` Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `concurrently "npm run server" "npm run client"` | Start both frontend and backend |
| `client` | `npm start --prefix client` | Start React dev server only |
| `server` | `nodemon server/server.js` | Start Express with hot reload |
| `install-all` | Installs all dependencies | First-time setup |
| `build` | `npm run build --prefix client` | Production React build |
| `start` | `node server/server.js` | Production start |

### Server Environment Variables (`server/.env`)

| Variable | Value | Purpose |
|---|---|---|
| `PORT` | `5001` | Express server port |
| `MONGO_URI` | `mongodb+srv://ssaye_user:...@cluster0.inqkful.mongodb.net/` | MongoDB Atlas connection |
| `JWT_SECRET` | `ssaye-super-secret-jwt-key-2024` | Token signing secret |
| `EMAIL_USER` | `invest@ssaye.club` | SMTP sender address |
| `EMAIL_PASS` | (GoDaddy SMTP password) | Email password |
| `OPENAI_API_KEY` | (key) | GPT-based chat features |
| `GEMINI_API_KEY` | (key) | Google Gemini AI chat |

### Client Environment Variables (`client/.env`)

| Variable | Value | Purpose |
|---|---|---|
| `REACT_APP_API_URL` | (empty) | Uses proxy config instead |

The client `package.json` sets `"proxy": "http://localhost:5001"` — all `/api/...` calls in development are forwarded to the Express server automatically.

### Express Server Setup (`server/server.js`)

- CORS enabled for all origins
- JSON body parsing with 50 MB limit (to support base64 image uploads)
- Request timeout middleware: **30 seconds** per request
- Serves built React app from `client/build/` in production (catch-all route)
- 14 route modules mounted under `/api/`

---

## 4. Database Models

All models use Mongoose and are stored in MongoDB Atlas.

### 4.1 Product

The core product catalog for the marketplace.

| Field | Type | Notes |
|---|---|---|
| `id` | Number | Numeric product ID (used in frontend) |
| `name` | String | Product display name |
| `brand` | String | Brand name |
| `category` | String (enum) | One of 14 categories (see below) |
| `price` | Number | Current selling price |
| `originalPrice` | Number | Pre-discount price |
| `rating` | Number (0–5) | Auto-recalculated from reviews |
| `reviews` | Number | Review count (auto-updated) |
| `stock` | String | `"in-stock"` / `"low-stock"` / `"out-of-stock"` |
| `emoji` | String | Display emoji (fallback if no image) |
| `badge` | String (enum) | `"Low"` / `"Organic"` / `"Fresh"` / `"Halal"` |
| `imageUrl` | String | Stored as base64 or URL |
| `itemNum` | String | SKU / item number |

**14 Product Categories:**

| Category | Emoji |
|---|---|
| Dal & Lentils | 🫘 |
| Rice & Grains | 🌾 |
| Spices & Masala | 🌶️ |
| Atta & Flour | 🌾 |
| Oils & Ghee | 🫙 |
| Snacks & Namkeen | 🍿 |
| Pickles & Chutneys | 🥒 |
| Frozen Foods | 🧊 |
| Dairy & Paneer | 🧀 |
| Tea/Coffee/Drinks | ☕ |
| Sweets & Mithai | 🍬 |
| Fresh Produce | 🥦 |
| Meat & Seafood | 🥩 |
| Pooja Items | 🪔 |

---

### 4.2 User

| Field | Type | Notes |
|---|---|---|
| `name` | String | Full name |
| `email` | String (unique) | Login identifier |
| `password` | String | bcrypt hashed |
| `isAdmin` | Boolean | Basic admin access |
| `isSuperAdmin` | Boolean | Full platform access |
| `isPremium` | Boolean | Premium subscription status |
| `isDisabled` | Boolean | Account disabled flag |
| `adminPermissions` | Object | `{ countries[], assetTypes[], minAmount, maxAmount }` |
| `notificationPreferences` | Object | 5 boolean flags for email/push notifications |

---

### 4.3 MarketplaceOrder

Auto-incrementing order numbers (ORD-001, ORD-002, ...).

| Field | Type | Notes |
|---|---|---|
| `orderNumber` | String | Auto-generated (ORD-001) |
| `user` | ObjectId ref | User who placed the order |
| `customerName` | String | Snapshot at time of order |
| `customerEmail` | String | Snapshot at time of order |
| `items` | Array | `{ productId, name, brand, category, emoji, price, quantity, lineTotal }` |
| `subtotal` | Number | Sum of lineTotals |
| `deliveryFee` | Number | Currently 0 (FREE delivery) |
| `total` | Number | subtotal + deliveryFee |
| `status` | String (enum) | `pending` / `in-transit` / `delivered` / `cancelled` / `refunded` |
| `dispatchedTo` | String | Optional vendor/driver assignment |
| `createdAt` | Date | Auto-timestamp |

---

### 4.4 Wishlist

One document per (user, productId) pair. Compound unique index enforced.

| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId ref | Owning user |
| `productId` | Number | References Product.id |
| `name` | String | Product name snapshot |
| `brand` | String | Brand snapshot |
| `category` | String | Category snapshot |
| `price` | Number | Price snapshot |
| `emoji` | String | Emoji snapshot |
| `imageUrl` | String | Image snapshot |
| `addedAt` | Date | Auto-timestamp |

---

### 4.5 Review

Enforces one review per user per product (upsert pattern).

| Field | Type | Notes |
|---|---|---|
| `productId` | Number | Product being reviewed |
| `user` | ObjectId ref | Reviewer |
| `userName` | String | Name snapshot |
| `rating` | Number (1–5) | Star rating |
| `body` | String (max 1000) | Review text |
| `createdAt` | Date | Auto-timestamp |

On every create/update/delete, the server recalculates `Product.rating` (average) and `Product.reviews` (count).

---

### 4.6 Subscription (Subscribe & Save)

Auto-incrementing subscription numbers (SUB-001, SUB-002, ...).

| Field | Type | Notes |
|---|---|---|
| `subscriptionNumber` | String | Auto-generated (SUB-001) |
| `user` | ObjectId ref | Subscribing user |
| `customerName` | String | Snapshot |
| `customerEmail` | String | Snapshot |
| `productId` | Number | Product reference |
| `name` | String | Product name |
| `brand` | String | Brand |
| `category` | String | Category |
| `emoji` | String | Emoji |
| `price` | Number | Price at subscription time |
| `frequency` | String (enum) | `weekly` / `biweekly` / `monthly` / `bimonthly` / `quarterly` |
| `startDate` | Date | Subscription start |
| `endDate` | Date | Subscription end |
| `status` | String (enum) | `active` / `paused` / `cancelled` / `completed` |
| `notes` | String | Optional notes |

---

### 4.7 UserActivity

One document per user. Keeps rolling history for the recommendation engine.

| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId ref (unique) | One per user |
| `searches` | Array | `{ keyword, searchedAt }` — capped at 50 most recent |
| `purchases` | Array | `{ productId, name, category, purchasedAt }` — capped at 100 most recent |

---

### 4.8 Investment

Tracks a user's investment in a specific opportunity.

| Field | Type | Notes |
|---|---|---|
| `user` | ObjectId ref | Investor |
| `application` | ObjectId ref | InvestmentApplication |
| `opportunity` | ObjectId ref | InvestmentOpportunity |
| `investmentName` | String | Display name |
| `investmentAmount` | Number | Principal invested |
| `investmentType` | String | `one-time` / `recurring` |
| `assetType` | String | Asset category |
| `status` | String | `active` / `matured` / `withdrawn` |
| `currentValue` | Number | Current market value |
| `returnRate` | Number | Expected return % |
| `purchaseDate` | Date | When invested |
| `maturityDate` | Date | When it matures |

---

### 4.9 InvestmentOpportunity

Listed investment projects viewable to users.

| Field | Type | Notes |
|---|---|---|
| `name` | String | Project name |
| `category` | String (enum) | 6 categories |
| `location` | String | Geographic location |
| `area` | String | Area/region |
| `description` | String | Full description |
| `highlights` | Array | Bullet-point highlights |
| `minInvestment` | Number | Minimum investment amount |
| `totalValue` | Number | Total project value |
| `expectedROI` | Number | Expected return % |
| `duration` | String | Investment period |
| `riskLevel` | String | Risk rating |
| `status` | String | `Open` / `Funding` / `Closed` / `Completed` |
| `availableShares` | Number (0–100) | % shares remaining |
| `projectedCompletion` | Date | Expected completion |
| `images` | Array | Project images |
| `isActive` | Boolean | Visibility flag |
| `createdBy` | ObjectId ref | Admin who created it |

---

## 5. Server — API Reference

Base URL: `http://localhost:5001/api` (development) or same origin in production.

Auth headers where required: `Authorization: Bearer <jwt_token>`

---

### 5.1 Auth Routes — `/api/auth`

#### `POST /api/auth/signup`
Register a new user.

**Body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "eyJ...",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "isAdmin": false,
    "isSuperAdmin": false,
    "isPremium": false,
    "createdAt": "...",
    "adminPermissions": {}
  }
}
```

#### `POST /api/auth/login`
Authenticate existing user. Returns same shape as signup.

---

### 5.2 Product Routes — `/api/products`

#### `GET /api/products`
Paginated, filtered, sorted product list with optional fuzzy search.

**Query Parameters:**

| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | number | 1 | Page number |
| `limit` | number | 40 | Max 80 |
| `search` | string | — | Full-text search (name, brand) |
| `category` | string | — | Filter by category name |
| `sort` | string | `popular` | `popular` / `price-asc` / `price-desc` / `rating` / `name` |

**Response:**
```json
{
  "products": [...],
  "total": 245,
  "page": 1,
  "totalPages": 7
}
```

Query timeout: 15 seconds. Fuzzy spell-check is handled separately.

#### `GET /api/products/category-counts`
Returns count of products per category, respecting active search filter.

**Response:**
```json
{
  "Dal & Lentils": 18,
  "Rice & Grains": 12,
  ...
}
```

#### `GET /api/products/categories`
Returns distinct list of category names.

#### `GET /api/products/fuzzy-suggest`
Returns spelling suggestions when a search yields zero results. Uses Levenshtein distance algorithm on product names and brands.

**Query:** `?q=tumeric` → suggests "Turmeric"

#### `GET /api/products/:id`
Single product by numeric ID.

#### `POST /api/products/search-activity` *(Auth required)*
Records a search keyword for personalization. Maintains rolling window of 50 most recent searches per user.

**Body:** `{ "keyword": "basmati rice" }`

---

### 5.3 Order Routes — `/api/marketplace-orders`

#### `POST /api/marketplace-orders` *(Auth required)*
Place a new order from cart contents. Server recomputes all prices from database to prevent client-side tampering.

**Body:**
```json
{
  "items": [
    { "productId": 12, "quantity": 2 }
  ],
  "customerName": "string",
  "customerEmail": "string"
}
```

**Response:** Created order object including generated `orderNumber` (e.g., `"ORD-047"`).

Side effect: fires `UserActivity` purchase tracking asynchronously.

#### `GET /api/marketplace-orders/my` *(Auth required)*
Returns all orders for the authenticated user, newest first.

#### `GET /api/marketplace-orders` *(Super admin only)*
Returns all orders across all users.

#### `GET /api/marketplace-orders/stats` *(Super admin only)*
Returns aggregate stats: total revenue, order counts by status, refund totals, unique customer count.

#### `PATCH /api/marketplace-orders/:id/status` *(Super admin only)*
Update order status and optionally assign dispatch info.

**Body:** `{ "status": "in-transit", "dispatchedTo": "Driver Name" }`

---

### 5.4 Wishlist Routes — `/api/wishlist`

All routes require authentication.

#### `GET /api/wishlist`
Returns array of wishlisted products for authenticated user.

#### `POST /api/wishlist`
Add a product to wishlist. Upserts — safe to call multiple times.

**Body:**
```json
{
  "productId": 42,
  "name": "Basmati Rice",
  "brand": "Kohinoor",
  "category": "Rice & Grains",
  "price": 8.99,
  "emoji": "🌾",
  "imageUrl": "..."
}
```

#### `DELETE /api/wishlist/:productId`
Remove a product from wishlist by numeric product ID.

---

### 5.5 Review Routes — `/api/reviews`

#### `GET /api/reviews/:productId`
Public. Returns all reviews for a product, newest first.

#### `POST /api/reviews/:productId` *(Auth required)*
Submit or update review (upsert — one per user per product). Automatically recalculates product rating and review count.

**Body:** `{ "rating": 4, "body": "Great quality rice!" }`

#### `DELETE /api/reviews/:productId` *(Auth required)*
Delete own review. Recalculates product stats.

---

### 5.6 Recommendation Routes — `/api/recommendations`

#### `GET /api/recommendations` *(Auth required)*
Returns up to 8 personalized product recommendations.

**Scoring algorithm:**

| Signal | Score Change |
|---|---|
| Category matches a purchased category | +3 per purchase match |
| Category matches a searched keyword | +1 per search match |
| Product name/brand contains a search keyword | +2 |
| Product is in user's wishlist | +10 |
| Product rating | +0.2 × rating |
| Already purchased this product | −1 (still shown, ranked lower) |

Falls back to wishlisted items if no search/purchase history exists.

---

### 5.7 Subscription Routes — `/api/subscriptions`

#### `POST /api/subscriptions` *(Auth required)*
Create a Subscribe & Save subscription. Auto-generates SUB-001 numbering.

**Body:**
```json
{
  "productId": 12,
  "name": "...",
  "brand": "...",
  "category": "...",
  "emoji": "...",
  "price": 8.99,
  "frequency": "monthly",
  "startDate": "2026-07-01",
  "endDate": "2026-12-31"
}
```

#### `GET /api/subscriptions` *(Super admin only)*
All subscriptions across all users.

#### `PATCH /api/subscriptions/:id/status` *(Super admin only)*
Update subscription status (active/paused/cancelled/completed).

---

### 5.8 Other Routes

| Route | Description |
|---|---|
| `/api/investments` | User investment CRUD |
| `/api/opportunities` | Investment opportunity listings |
| `/api/chat` | General AI chatbot (Gemini/OpenAI) |
| `/api/chat/marketplace` | Marketplace-specific AI assistant (SsayeBot) |
| `/api/compare` | Product comparison |
| `/api/inventory` | Inventory management (admin) |
| `/api/market` | Market data |
| `/api/superadmin` | Super admin management (users, settings) |

---

## 6. Client — Pages & Components

### 6.1 App Router (`client/src/App.js`)

18 routes with automatic scroll-to-top on navigation:

| Path | Component | Notes |
|---|---|---|
| `/` | Home | Landing page |
| `/marketplace` | Marketplace | Core shopping |
| `/product/:id` | ProductDetail | Single product |
| `/marketplace-manager` | MarketplaceManager | Admin order management |
| `/assets` | Assets | Asset management |
| `/smart-city` | SmartCity | Smart city features |
| `/farms` | Farms | Farm investments |
| `/blog` | Blog | Blog content |
| `/login` | Login | Auth |
| `/signup` | Signup | Registration |
| `/portfolio` | Portfolio | User investment dashboard |
| `/investments` | Investments | Investment tracking |
| `/admin` | Admin | Admin dashboard |
| `/superadmin` | SuperAdmin | Super admin panel |
| `/premium` | Premium | Premium subscription info |
| `/settings` | Settings | User account settings |

**Chatbot routing logic:**
- Paths `/marketplace` and `/product/*` → renders `SsayeBot` (marketplace-specific AI)
- All other paths → renders `ChatBot` (general AI assistant)

### 6.2 Shared Components

| Component | Purpose |
|---|---|
| `Navbar.js` | Top navigation with dropdown menus, mobile hamburger, user account menu |
| `Footer.js` | Site footer |
| `ChatBot.js` | General-purpose AI chatbot sidebar (powered by Gemini) |
| `SsayeBot.js` | Marketplace AI assistant — product questions, recommendations |
| `ConfirmationModal.js` | Reusable yes/no confirmation dialog |
| `Toast.js` | Slide-in notification messages |
| `Pagination.js` | Reusable pagination with max 5 page buttons |
| `ScrollToTop.js` | Scrolls window to top on every route change |

---

## 7. Marketplace — Deep Dive

The Marketplace (`client/src/pages/Marketplace.js`, ~1022 lines) is the largest and most feature-rich part of the application.

### 7.1 State

| State | Type | Persisted | Purpose |
|---|---|---|---|
| `cart` | `{ [productId]: quantity }` | localStorage (`ssaye_cart`) | Shopping cart |
| `products` | Array | — | Current page of products |
| `total` | Number | — | Total product count for pagination |
| `page` | Number | — | Current page (1-indexed) |
| `search` | String | — | Search input value |
| `sort` | String | — | Active sort option |
| `category` | String | — | Active category filter |
| `categoryCounts` | Object | — | Product count per category |
| `wishlist` | Set\<productId\> | Server | Wishlisted product IDs |
| `suggestions` | Array | — | Personalized recommendations |
| `showCart` | Boolean | — | Cart panel vs product grid toggle |
| `buyNowProduct` | Object\|null | — | Product in "Buy Now" modal |
| `showLoginPrompt` | Boolean | — | Login prompt modal state |
| `sidebarOpen` | Boolean | — | Mobile sidebar toggle |

### 7.2 Product Loading Pipeline

```
User types search / changes filter / changes page
    ↓
350ms debounce (prevents excessive API calls)
    ↓
GET /api/products?page=&limit=40&search=&category=&sort=
    ↓ (timeout: 10 seconds)
If results: render product grid
If zero results + search term: GET /api/products/fuzzy-suggest?q=<search>
    ↓
Show "Did you mean: X?" suggestion banner
```

Category counts also refresh on search change: `GET /api/products/category-counts?search=`

### 7.3 Product Card

Each card displays:

1. **Image / Emoji** — tries `imageUrl`, falls back to `emoji`
2. **Badges** (priority order):
   - Discount badge (e.g., "Save 15%") if `originalPrice > price`
   - Low stock warning if `stock === "low-stock"`
   - Category badge: Organic / Fresh / Halal (from `product.badge`)
3. **Brand** and **Name**
4. **Rating** — star display + review count
5. **Price** — current price + struck-through original price
6. **Add to Cart / Quantity Stepper** — shows stepper with `−` and `+` if already in cart
7. **Buy Now button** — opens instant checkout modal
8. **Wishlist heart** — filled/outline based on wishlist state (authenticated users only)

### 7.4 Cart

Cart is stored in `localStorage` as `ssaye_cart` and survives page reloads. Cart is **cleared on logout**.

The cart panel replaces the product grid when `showCart = true`. It shows:

- Line items with quantity controls
- Subtotal
- Delivery: **FREE** (deliveryFee = 0)
- Total
- "Place Order" button → calls `POST /api/marketplace-orders`

On successful order: displays order number (e.g., "Order ORD-047 placed!"), clears cart.

### 7.5 Buy Now Modal

Clicking "Buy Now" on any product opens a modal showing:
- Product summary (name, price, quantity selector)
- "Confirm Purchase" → places a single-item order immediately
- Bypasses the main cart entirely

### 7.6 Wishlist

- Heart icon on every product card (shown only when authenticated)
- Clicking heart toggles wishlist state **optimistically** (instant UI update before server confirms)
- Server persists via `POST /api/wishlist` or `DELETE /api/wishlist/:id`
- Wishlist product IDs stored in a `Set` for O(1) lookup
- Wishlisted items receive a +10 score boost in recommendations

### 7.7 "Suggested For You" Strip

A horizontal carousel shown above the product grid when the user is logged in and has activity. Pulls from `GET /api/recommendations` (up to 8 products). Each card in the strip has the same "Add to Cart" and "Buy Now" functionality.

### 7.8 Search Activity Tracking

Every search triggers a fire-and-forget `POST /api/products/search-activity` call:
- Debounced **1.5 seconds** after the user stops typing
- Only fires for authenticated users
- Server caps at 50 most recent searches per user
- Used by the recommendation engine

### 7.9 Sidebar & Filters

- **Category sidebar** — shows all 14 categories with product counts in brackets
- Click a category to filter; click again (or "All") to clear
- On mobile: sidebar slides in over content with a backdrop
- `scrollLock` utility prevents body scroll when mobile sidebar is open

### 7.10 Pagination

- 40 products per page
- Max 5 page buttons displayed (first, last, current ±1)
- Clicking a page scrolls to top of product grid

---

## 8. Authentication System

### Flow

```
User submits login/signup form
    ↓
POST /api/auth/login or /signup
    ↓
Server: validate → hash check (bcrypt) → generate JWT (7-day expiry)
    ↓
Client receives: { token, user }
    ↓
AuthContext.login() stores in localStorage:
    - "token" = JWT string
    - "user" = JSON.stringify(user)
    ↓
All subsequent API calls include:
    Authorization: Bearer <token>
    ↓
auth.js middleware verifies token → populates req.user
```

### Logout

`AuthContext.logout()` clears:
- `localStorage.token`
- `localStorage.user`
- `localStorage.ssaye_cart` (cart cleared on logout)

### Auth Middleware (`server/middleware/auth.js`)

Extracts and verifies the Bearer token from every protected request. Decodes into:

```js
req.user = { userId, email, name, isAdmin, isSuperAdmin, isPremium }
```

Returns `401 Unauthorized` if token is missing, malformed, or expired.

### Role Hierarchy

| Role | Flag | Access |
|---|---|---|
| Guest | — | Browse products, view reviews |
| User | authenticated | Cart, wishlist, orders, reviews, subscriptions |
| Admin | `isAdmin: true` | MarketplaceManager (order status management) |
| Super Admin | `isSuperAdmin: true` | All admin routes + user management + all orders/subscriptions |

---

## 9. State Management & Context

### AuthContext (`client/src/context/AuthContext.js`)

```js
{
  token,             // JWT string or null
  user,              // User object or null
  login(token, user) // Saves to state + localStorage
  logout()           // Clears state + localStorage + cart
  isAuthenticated()  // Returns !!token
}
```

Wrapped around entire app in `App.js`. Reads from localStorage on mount (persists across page refreshes).

### ToastContext (`client/src/context/ToastContext.js`)

Provides a `showToast(message, type)` function available anywhere in the app. Renders the `Toast` component at page level.

### Local State (Marketplace)

Cart state lives entirely in `Marketplace.js` local state, mirrored to localStorage. There is no global cart context — the cart is scoped to the Marketplace page. Cart state is passed down to child modals and the cart panel via props or direct access.

---

## 10. Key User Workflows

### 10.1 First-Time Buyer

```
1. Visit /marketplace
2. Browse or search products
3. Attempt "Add to Cart" → prompted to login if not authenticated
4. Login at /login → redirected back
5. Add items to cart
6. Click cart icon → review cart
7. Place order → see ORD-001 confirmation
```

### 10.2 Returning Buyer

```
1. Visit /marketplace (already logged in)
2. "Suggested For You" strip shows personalized recommendations
3. Wishlist hearts pre-filled with saved items
4. Cart restored from localStorage if previously filled
5. Quick "Buy Now" on a single item for instant checkout
```

### 10.3 Wishlist & Discovery

```
1. Click heart on any product → added to wishlist instantly (optimistic)
2. Server persists wishlist entry
3. Next visit to /marketplace:
   - Hearts refill from GET /api/wishlist
   - Wishlisted items float to top of recommendations (+10 score)
```

### 10.4 Subscribe & Save

```
1. Open any product at /product/:id
2. Click "Subscribe & Save" → see 10% discount badge
3. Choose frequency: weekly / biweekly / monthly / bimonthly / quarterly
4. Pick start and end dates
5. Confirm → SUB-001 created in database
6. Super admin can manage subscriptions (pause/cancel/complete)
```

### 10.5 Writing a Review

```
1. Visit /product/:id
2. Submit star rating (1–5) + optional text body
3. Server upserts (1 review per user per product)
4. Product's average rating and review count recalculate immediately
5. Review appears for all users on that product page
```

---

## 11. Admin & Super Admin Features

### MarketplaceManager (`/marketplace-manager`)

Accessible to admins. Displays all marketplace orders in a table:
- Filter by status
- Update order status (pending → in-transit → delivered)
- Assign dispatch info (driver/vendor name)

### SuperAdmin Dashboard (`/superadmin`)

Full platform management:
- **User Management:** View all users, enable/disable accounts, set admin roles and permissions
- **Order Management:** All orders with stats (revenue, refunds, unique customers)
- **Subscription Management:** All subscriptions, update status
- **Investment Opportunities:** Create/edit investment listings
- **Inventory Management:** Product CRUD

### Admin Permissions (Granular)

Super admins can grant admins filtered access via `adminPermissions`:

```json
{
  "countries": ["UK", "UAE"],
  "assetTypes": ["Real Estate", "Farms"],
  "minAmount": 5000,
  "maxAmount": 500000
}
```

This scopes which investment opportunities an admin can see/manage.

---

## 12. Security

### Password Handling
- bcryptjs with salt factor 10
- Passwords never returned in API responses
- Login uses `bcrypt.compare()` — constant-time comparison

### JWT Tokens
- 7-day expiry
- Signed with `JWT_SECRET` environment variable
- Extracted from `Authorization: Bearer <token>` header
- Never stored in cookies (localStorage only)

### Input Validation
- Server-side validation on all create/update endpoints
- Prices recomputed from database on order creation (prevents client-side price tampering)
- Review body capped at 1000 characters
- Cart limit enforced at API layer

### Timeout Protection
- Global request timeout: **30 seconds** (Express middleware)
- Product query timeout: **15 seconds** (Mongoose `.maxTimeMS()`)
- Frontend fetch timeouts: **10–15 seconds** with `AbortController`
- Search debounce: **350ms** (prevents spam)
- Activity tracking debounce: **1.5 seconds**

### CORS
- Currently set to allow all origins (appropriate for development; should be restricted in production)

### File Uploads
- Images stored as base64 strings directly in MongoDB
- 50 MB body limit on Express handles base64-encoded images

---

## 13. Deployment

### Development

```bash
# Install all dependencies
npm run install-all

# Start both frontend (port 3000) and backend (port 5001)
npm run dev
```

Client at `http://localhost:3000`  
API at `http://localhost:5001`  
Client proxies `/api/*` to the server automatically.

### Production Build

```bash
# Build React app
npm run build

# Start production server (serves React + API on port 5001)
npm start
```

In production, Express serves the React build from `client/build/` and all unmatched routes return `index.html` (SPA fallback).

### Database

MongoDB Atlas cluster: `cluster0.inqkful.mongodb.net`  
Database name derived from URI. All models auto-create collections on first write.

### Third-Party Services

| Service | Used For | Config |
|---|---|---|
| MongoDB Atlas | Primary database | `MONGO_URI` in `.env` |
| GoDaddy SMTP | Transactional email | `EMAIL_USER`, `EMAIL_PASS` in `.env` |
| OpenAI API | ChatBot AI responses | `OPENAI_API_KEY` in `.env` |
| Google Gemini | SsayeBot & ChatBot | `GEMINI_API_KEY` in `.env` |

---

## Appendix: Quick Reference

### API Endpoints Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Register |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/products` | — | Browse products |
| GET | `/api/products/category-counts` | — | Category counts |
| GET | `/api/products/fuzzy-suggest` | — | Spell suggestions |
| GET | `/api/products/:id` | — | Single product |
| POST | `/api/products/search-activity` | ✓ | Track search |
| GET | `/api/marketplace-orders/my` | ✓ | My orders |
| POST | `/api/marketplace-orders` | ✓ | Place order |
| GET | `/api/marketplace-orders` | Super Admin | All orders |
| GET | `/api/marketplace-orders/stats` | Super Admin | Order stats |
| PATCH | `/api/marketplace-orders/:id/status` | Super Admin | Update order |
| GET | `/api/wishlist` | ✓ | My wishlist |
| POST | `/api/wishlist` | ✓ | Add to wishlist |
| DELETE | `/api/wishlist/:productId` | ✓ | Remove from wishlist |
| GET | `/api/reviews/:productId` | — | Product reviews |
| POST | `/api/reviews/:productId` | ✓ | Submit review |
| DELETE | `/api/reviews/:productId` | ✓ | Delete review |
| GET | `/api/recommendations` | ✓ | Personalized picks |
| POST | `/api/subscriptions` | ✓ | Subscribe & Save |
| GET | `/api/subscriptions` | Super Admin | All subscriptions |
| PATCH | `/api/subscriptions/:id/status` | Super Admin | Update subscription |

### Key File Locations

| File | Lines | Purpose |
|---|---|---|
| [client/src/pages/Marketplace.js](client/src/pages/Marketplace.js) | ~1022 | Core shopping interface |
| [client/src/pages/ProductDetail.js](client/src/pages/ProductDetail.js) | ~200+ | Single product page |
| [client/src/App.js](client/src/App.js) | ~73 | Route definitions |
| [client/src/context/AuthContext.js](client/src/context/AuthContext.js) | — | Auth state |
| [server/server.js](server/server.js) | — | Express app setup |
| [server/routes/products.js](server/routes/products.js) | ~253 | Product API |
| [server/routes/marketplaceOrders.js](server/routes/marketplaceOrders.js) | ~175 | Order API |
| [server/models/Product.js](server/models/Product.js) | — | Product schema |
| [server/models/User.js](server/models/User.js) | — | User schema |
| [server/middleware/auth.js](server/middleware/auth.js) | — | JWT middleware |
