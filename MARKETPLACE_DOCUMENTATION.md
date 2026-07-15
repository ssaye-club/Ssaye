# Ssaye Marketplace — Feature & Capability Documentation
### Ssaye Club · Product Design Document

---

## What Is the Ssaye Marketplace?

The Ssaye Marketplace is a community-first, South Asian grocery e-commerce platform built for the diaspora. It is not a general-purpose supermarket app, nor a generic online store — it is purpose-built around the authentic shopping, cooking, and community experience that South Asian households expect.

Every feature was designed with a specific cultural and practical insight:

- South Asian grocery shopping is deeply category-driven (dal, atta, ghee, masala)
- Households reorder the same staples on a recurring cycle
- Recipes require multi-ingredient basket-building, not single-item searches
- Brand loyalty is strong and specific (particular ghee brands, specific dal varieties)
- Price comparison across brands is a habitual part of the shopping decision

The marketplace addresses all five of these patterns directly.

---

## How It Is Different from Other Online Platforms

| Feature | Ssaye Marketplace | Generic Grocery Apps (Amazon, Instacart, etc.) |
|---|---|---|
| South Asian category taxonomy | 14 purpose-built categories with cultural naming | Generic catch-all categories ("International Foods") |
| AI recipe assistant with full ingredient lists | Built-in, grounded in live inventory | None or basic search only |
| Subscribe & Save with frequency options | Weekly to Quarterly, 10% automatic discount | Monthly-only subscription or none |
| Personalised recommendations engine | Multi-signal scoring (purchases + searches + wishlist) | Purchase history only, no wishlist signal |
| Fuzzy spell-check for desi product names | Levenshtein distance correction ("biryni" → "biryani") | Basic autocomplete or blank results |
| Vendor-level procurement | Operators can order directly from specific suppliers | No visibility into supplier relationships |
| CRM intelligence with predictive restocking | AI analysis of velocity, urgency, subscription demand | Separate analytics platforms, no built-in AI |
| Product image fallback (emoji + Open Food Facts) | Automatic image fetch, emoji fallback for missing images | Image upload only |
| Community-driven product requests | Email request link built into category sidebar | None |
| Activity-tracked search analytics | Every search recorded per user for recommendations | Aggregated only, not per-user |

---

## Feature Deep-Dive

### 1. The Category Taxonomy

The marketplace is organised into **14 South Asian-specific product categories**, each with its own emoji icon and product count:

| Category | Icon | Purpose |
|---|---|---|
| Dal & Lentils | 🫘 | All varieties: toor, masoor, chana, moong, urad |
| Rice & Grains | 🌾 | Basmati, sella, biryani rice, oats, semolina |
| Spices & Masala | 🌶️ | Ground spices, whole spices, masala blends |
| Atta & Flour | 🌾 | Whole wheat atta, besan, rice flour, maida |
| Oils & Ghee | 🫙 | Cooking oils, pure ghee, vanaspati |
| Snacks & Namkeen | 🍿 | Bhujia, chakli, murukku, papad, biscuits |
| Pickles & Chutneys | 🥭 | Mango pickle, lime pickle, mixed chutneys |
| Frozen Foods | ❄️ | Frozen parathas, samosas, ready meals |
| Dairy & Paneer | 🧀 | Paneer, yogurt, butter, milk products |
| Tea, Coffee & Drinks | ☕ | Chai blends, masala tea, traditional drinks |
| Sweets & Mithai | 🍮 | Halwa mixes, gulab jamun, ladoo |
| Fresh Produce | 🥬 | Vegetables and fruits used in South Asian cooking |
| Meat & Seafood | 🥩 | Halal meat, seafood, marinated products |
| Pooja Items | 🪔 | Incense, camphor, prayer essentials |

Every category button in the sidebar displays a **live product count** so users know how many items are available before navigating. Clicking a category filters the grid instantly without a full page reload.

---

### 2. Product Grid & Cards

Products are displayed in a responsive CSS grid that adapts from 4 columns on desktop down to 2 columns on tablet and 1 column on mobile.

**Each product card contains:**

- **Product image** — fetched from the Open Food Facts API; falls back to a category-appropriate emoji if the image URL is unavailable or fails to load
- **Sale/stock/type badge** — priority-ordered: discount percentage (% OFF) > Low Stock > Organic > Fresh > Halal. Only one badge shows at a time to keep the card clean
- **Wishlist heart button** — top-right corner; filled red when wishlisted, updates optimistically without waiting for the server
- **Brand name** — displayed above the product name in a subdued style
- **Star rating** — 5-star visual display with review count
- **Price row** — current price + original price (struck through) if a discount applies
- **Add to Cart / quantity stepper** — when qty is 0, a single "Add to Cart" button is shown; once added, it transforms into a +/− stepper with the current quantity in the centre
- **Buy Now button** — always visible below the cart control; skips the cart entirely and opens a direct order confirmation modal
- **Price Compare hint** — a subtle "📊 Compare Prices" label appears on hover to signal that users can drill into the product page for price comparisons

---

### 3. Search

The search bar is persistent in the top toolbar and operates with several layers of intelligence:

**Debounced live filtering** — A 350ms debounce prevents the server being hit on every keystroke. After the user stops typing for 350ms, the product grid updates to show matching results.

**Full-text search** — Search runs across product name, brand name, and category simultaneously.

**Fuzzy spell-check** — When a search returns zero results and the query is at least 2 characters, the backend runs a **Levenshtein distance algorithm** against all known product names and category keywords. If a near-match is found within an edit distance of 2, the frontend displays a clickable "Did you mean **'[suggestion]'**?" prompt that instantly applies the corrected search.

*Example: typing "biriyani rice" or "biryni" still surfaces Basmati rice and biryani-grade grain products.*

**Search activity tracking** — Authenticated users' search terms are silently recorded (1.5s debounce) and used to improve their personalised recommendations in future sessions.

**Inline result count** — The toolbar shows a live count ("1,240 products for 'masala'") so users know immediately whether they're in a broad or narrow result set.

---

### 4. Sort Options

Five sort modes are available from a dropdown in the toolbar:

| Sort Mode | Logic |
|---|---|
| Most Popular | Default — sorted by review count descending |
| Price: Low to High | Ascending price |
| Price: High to Low | Descending price |
| Top Rated | Descending rating |
| Name: A–Z | Alphabetical by product name |

---

### 5. Pagination

Products load 40 per page with a pagination bar at the bottom of the grid. The pagination system shows:
- Previous / Next buttons (disabled at boundaries)
- Up to 5 page number buttons, windowed to keep the current page centred
- A summary line ("4,200 products · page 3/105")

Navigating to a new page does not reset search or category filters.

---

### 6. Wishlist

The wishlist allows authenticated users to save products for later, across sessions and devices.

**Key behaviours:**
- **Optimistic UI** — the heart icon fills and unfills immediately on click, without waiting for the API response. If the server returns an error, the state reverts automatically.
- **Cross-device persistence** — wishlist data is stored in MongoDB against the user's account, not in browser storage.
- **Guest protection** — clicking the wishlist heart when not logged in opens the Login Prompt Modal rather than silently failing.
- **Recommendations signal** — wishlisted products contribute a +10 score boost to the personalised recommendations engine (the strongest single signal in the system).

---

### 7. Cart

The cart is a client-side state object (`{ [productId]: quantity }`) persisted in `localStorage` under the key `ssaye_cart`.

**Cart behaviours:**
- Survives page refreshes and navigation away from the marketplace
- Cleared automatically on logout (both in memory and in localStorage)
- Shared with the Product Detail page — adding to cart from a product page updates the same cart state the marketplace page reads
- Accessible from any marketplace page via the Cart button in the toolbar (shows live item count)
- Supports multi-item checkout in a single order

**Cart page features:**
- Itemised list with brand, name, unit price, quantity stepper, line subtotal, and remove button
- Order summary panel with subtotal, delivery (always FREE), and total
- "Proceed to Checkout" button submits all cart items as a single `POST /api/marketplace-orders` request
- On success: displays an order confirmation screen with the auto-generated order number (ORD-001 format) and total
- On error: displays an inline error message without losing cart contents

---

### 8. Buy Now

A fast-path purchase flow that bypasses the cart entirely.

1. User clicks "Buy Now" on any product card (or product detail page)
2. A confirmation modal appears showing product name, quantity (defaulting to 1), and total
3. User confirms → order is placed immediately via `POST /api/marketplace-orders`
4. Success screen shows the order number and total
5. The cart is not touched — Buy Now and the cart are independent flows

This is designed for impulse purchases or "I just need this one thing" situations, where adding to cart and checking out feels like unnecessary steps.

---

### 9. Subscribe & Save

The Subscribe & Save feature enables recurring grocery orders at a **10% automatic discount**.

Available from the Product Detail page, it allows users to choose a delivery frequency:

| Frequency | Interval |
|---|---|
| Weekly | Every 7 days |
| Bi-Weekly | Every 14 days |
| Monthly | Every 30 days |
| Bi-Monthly | Every 60 days |
| Quarterly | Every 90 days |

**How it works:**
- User selects quantity and frequency in the Subscribe modal
- The discounted price (10% off) is calculated and displayed before confirmation
- On confirmation, a subscription record is created in MongoDB with a unique auto-incrementing subscription number (SUB-001 format)
- Subscription demand is tracked by the CRM predictive engine to forecast inventory needs 30 days forward

**Why this matters:** Most South Asian staples (dal, rice, atta, oil) are household basics that run out on a predictable cycle. Subscribe & Save removes the cognitive overhead of reordering the same items repeatedly.

---

### 10. Personalised Recommendations ("Suggested For You")

When a logged-in user visits the marketplace without any active search or category filter, a horizontal scrolling strip of recommended products appears at the top of the grid under the label **"✨ Suggested For You — Based on your searches & purchases."**

**The recommendation scoring engine:**

| Signal | Score |
|---|---|
| Product in a previously purchased category | +3 per match |
| Product name matches a past search term | +1 per match |
| Product keyword (brand/category) matches a past search | +2 per match |
| Product is on the user's wishlist | +10 |
| Product rating | +0.2 × rating |
| Product already purchased by this user | −1 (deprioritises re-buys) |

Products are ranked by total score, deduplicated, and the top results are returned. This approach surfaces new products in categories the user already cares about, not just repeat recommendations of things they already bought.

**The strip only appears when browsing "All Products" with no active search** — it disappears when the user is actively filtering, so it never conflicts with intentional navigation.

---

### 11. Product Detail Pages

Each product has its own dedicated page (`/product/:id`) with an extended feature set beyond the card view:

- Full product image (with emoji fallback)
- Complete product information (name, brand, category, rating with review count)
- Price display with discount percentage and original price if applicable
- Stock and badge indicators (Low Stock / Organic / Fresh / Halal)
- Quantity selector and Add to Cart
- Buy Now button
- **Subscribe & Save** button with full modal flow
- **Product Reviews & Comments** — authenticated users can leave a rating and written review; all reviews are displayed with timestamp and username
- **Item number** visible for reference against printed catalogues or CSV inventory

---

### 12. Ssaye Bot — AI Grocery Assistant

Ssaye Bot is a floating AI chatbot that lives exclusively on the marketplace and product pages. It is powered by **Google Gemini 2.5 Flash** and functions as a knowledgeable South Asian grocery companion.

**What makes it unique:**

- **Live catalogue awareness** — on every message, the backend queries MongoDB for the current product count and category breakdown, and injects this data into the AI's system prompt. The bot always knows exactly how many products are in each category right now.
- **Full recipe walkthroughs** — the bot is instructed to provide complete ingredient lists with quantities, not partial answers. A biryani recipe returns the full shopping list: basmati rice, chicken, whole spices, ground spices, ghee, saffron, mint, fried onions, yogurt — all findable in the marketplace.
- **Ingredient education** — can explain unfamiliar South Asian ingredients (what is hing? what is kalonji?), their flavour profiles, and how to cook with them.
- **Ingredient substitutions** — if a product is unavailable or unrecognised, the bot suggests practical alternatives.
- **Marketplace navigation help** — walks users through how the cart, wishlist, Subscribe & Save, and checkout work.
- **Conversation memory** — the full conversation history is sent with every message, so the bot maintains context across a multi-turn conversation.
- **No hallucinated prices** — the system prompt explicitly instructs the bot not to quote specific prices; it directs users to the product page instead.

**Quick action starters** appear on first open: "What spices do you carry?", "Help me find dal", "How does checkout work?", "Suggest a recipe ingredient" — lowering the barrier for users who don't know how to start.

---

### 13. Mobile Experience

The marketplace is fully responsive:

- Category sidebar collapses behind a "☰ Categories" toggle button on mobile
- A dark backdrop overlay appears when the sidebar is open, and tapping it closes the sidebar
- Product grid collapses from 4 columns → 2 columns → 1 column across breakpoints
- Cart, search, and sort controls reflow for touch-friendly use
- All modals (Buy Now, Subscribe, Login Prompt) are touch-optimised

---

### 14. Product Request Flow

Users who cannot find a product they are looking for can use the **"Can't Find It?"** box at the bottom of the category sidebar. Clicking "Request Product" opens a pre-filled email to `info@ssayeclub.com` with the subject "Product Request", connecting the user directly to the Ssaye team. This turns a failed search into a community feedback signal.

---

## Administration & Operations Layer

The marketplace is backed by a full operator management suite accessible via the **Marketplace Manager** (`/marketplace-manager` route, admin-only).

### Cockpit Dashboard

An at-a-glance overview with 7 live KPI cards:

| Metric | Card Colour |
|---|---|
| Total Revenue | Green |
| Total Refunded | Red |
| Pending Orders | Amber |
| In Transit | Blue |
| Delivered | Teal |
| Unique Customers | Purple |
| Total Orders | Indigo |

A "Dispatch Queue" panel shows the 5 oldest pending orders with one-click status updates.

### Orders Tab

Full order management with:
- Paginated order list with all orders across all customers
- Status filtering (pending / in-transit / delivered / cancelled / refunded)
- Date-range filtering
- Customer name, email, order number, total, and item count per row
- Individual order status updates

### Inventory Tab

Full CSV-driven inventory management:
- Upload a CSV file to bulk-import or update products
- Auto-detection of column positions — the importer reads the header row and maps columns by name, so column order does not matter
- Supports optional `Vendor` column — CSVs without vendor data import cleanly alongside CSVs that include it
- Live edit individual product prices, stock status, and metadata via inline form

### Vendors Tab

A complete vendor relationship view, powered by the `/api/inventory/vendors` and `/api/inventory/vendors/:name/products` endpoints:

**Vendor list view:**
- Card per vendor with product count, stock health breakdown (in-stock / low-stock / out-of-stock counts), and category chips showing which product categories the vendor supplies
- Vendor name search for quick filtering in large supplier lists

**Vendor product drill-down:**
- Selecting a vendor shows a paginated product list for that supplier
- Qty +/− controls per product
- Floating cart summary bar showing selected products and totals
- "Place Vendor Order" button submits the entire vendor basket as a single order via `POST /api/marketplace-orders`

### Subscriptions Tab

A view of all active Subscribe & Save subscriptions across all customers, with frequency breakdowns and the ability to manage subscription status.

### Customers Tab (via Admin Dashboard)

Accessible from the Admin page, not the Marketplace Manager, but directly related to marketplace activity:
- Full customer list with order history
- Order count, total spend, and account creation date per customer

---

## CRM Intelligence Layer

The Ssaye Marketplace is backed by a **dual-AI intelligence system** — one bot facing customers, and one facing operators.

### CRM Dashboard (Admin & Super Admin only)

Available as a floating "CRM Insights" button on the Admin and Super Admin pages. Three tabs:

**📈 Dashboard tab — 6 KPI cards:**
- Average orders per customer
- Average spend per customer
- Repeat purchase rate
- High-value customer count
- Lapsed customer count (no order in 90 days)
- Active subscriptions

Plus: category preference bar charts, favourite brand bar charts, top search term tags, wishlisted product rankings, best-selling product rankings.

**🔮 Predictions tab — Procurement intelligence:**
- Alert bar: current out-of-stock count and low-stock count
- Reorder priority cards: each product needing restock shows its weekly velocity (units/week), 30-day trend vs prior 30 days (↑ or ↓ with percentage), urgency (CRITICAL for out of stock, HIGH for low stock), suggested reorder quantity (4 weeks' supply), and vendor name
- Subscription demand forecast: projects how many units of subscription products will be needed in the next 30 days based on active subscriptions and their frequency intervals
- Trending products: products with accelerating sell-through velocity
- Wishlist gap analysis: products that appear frequently in customer wishlists but have not converted to purchases — representing latent demand

**🤖 Ask AI tab:**
- Free-text conversation with a Gemini-powered procurement advisor
- Pre-loaded with both CRM data and predictive data as context
- Suggested questions: "Which products should I reorder this week?", "Who are my highest-value customers?", "What's driving the increase in spice sales?", "Which subscriptions are at risk of churning?"

---

## Technical Architecture Summary

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router DOM 6.30.2 |
| State management | React hooks + Context (no Redux) |
| Cart persistence | localStorage (`ssaye_cart`) |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas via Mongoose |
| AI — customer bot | Google Gemini 2.5 Flash |
| AI — CRM bot | Google Gemini 2.5 Flash |
| Authentication | JWT (7-day expiry, Bearer token) |
| Product images | Open Food Facts API + emoji fallback |
| Inventory ingest | CSV upload with auto-column detection |
| Search algorithm | MongoDB text index + Levenshtein fuzzy fallback |
| Recommendation engine | Multi-signal scoring in Node.js |
| Request timeouts | 10–15s AbortController on all fetch calls |
| Search debounce | 350ms for product fetch, 1.5s for activity tracking |

---

## AI Model Reference — Gemini 2.5 Flash

Both AI systems (Ssaye Bot and the CRM Intelligence Bot) use the same underlying model: **Google Gemini 2.5 Flash**, accessed via the `@google/generative-ai` Node.js SDK.

### Limits

| Property | Value |
|---|---|
| Input context window | 1,048,576 tokens (~1 million tokens) |
| Output per response | 65,536 tokens |
| Knowledge cutoff | January 2025 |

### Pricing

| Tier | Input | Output |
|---|---|---|
| **Free** | Free | Free |
| **Paid — text / image / video** | $0.30 / 1M tokens | $2.50 / 1M tokens |
| **Paid — audio input** | $1.00 / 1M tokens | $2.50 / 1M tokens |

Both bots operate on the **free tier** at current Ssaye Club scale. The customer-facing Ssaye Bot is text-only; the CRM bot is text-only with aggregated data payloads. Audio pricing does not apply to either.

### Free Tier Rate Limits

- **500 requests per day** (grounding/search features)
- RPM/TPM limits are account-specific — check [Google AI Studio](https://aistudio.google.com) for the limits tied to your API key

### Thinking / Reasoning

Gemini 2.5 Flash includes **native thinking capabilities** — the first Flash-tier model to do so. The model reasons internally before producing its response, improving answer quality for complex queries such as multi-ingredient recipe walkthroughs (Ssaye Bot) and multi-signal procurement recommendations (CRM Bot). Thinking is included within the free tier output budget.

### Multimodal Support (available but unused)

The model natively supports text, images, video, and audio (30 HD voices, 24 languages). Both Ssaye bots are currently text-only. These capabilities are available for future extensions such as voice queries, product image recognition, or multilingual support.

### Flash vs. Pro

| | Gemini 2.5 Flash | Gemini 2.5 Pro |
|---|---|---|
| Context window | 1M tokens | 1M tokens |
| Native thinking | Yes | Yes (more advanced) |
| Cost | Much lower | Higher |
| Ideal for | High-volume, price-efficient tasks | Deep reasoning tasks |

Flash is the appropriate choice for both Ssaye bots — it provides native thinking at low cost, and neither use case (grocery Q&A or CRM analytics) requires the deeper reasoning headroom of Pro.

---

## Data Security & Privacy

- **Cart data** is stored locally in the browser only — it is never uploaded to the server
- **Wishlist data** is stored server-side but is fully user-deletable
- **Search activity** is linked to the user's account and used only for personalised recommendations — it is never shared or sold
- **CRM analytics** sent to the AI engine are pre-aggregated — individual customer names, emails, or order details are never included in AI prompts
- **JWT tokens** expire after 7 days; logout clears the token and the cart simultaneously

---

## Order Lifecycle

```
Customer adds items to cart (localStorage)
        ↓
Customer proceeds to checkout
        ↓
POST /api/marketplace-orders
  • Validates JWT token
  • Creates Order document in MongoDB
  • Assigns auto-incrementing order number (ORD-001, ORD-002...)
  • Stores all line items with product ID, name, brand, category, price, quantity
        ↓
Order confirmation screen shown (order number + total)
        ↓
Marketplace Manager shows order in Cockpit (pending → in-transit → delivered)
        ↓
CRM engine tracks order for recommendations, CRM analytics, and velocity calculations
```

---

*Ssaye Club · Internal Product Documentation*
