# CRM Intelligence Bot — Admin Chatbot
### Product Documentation · Ssaye Club

---

## Overview

The CRM Intelligence Bot is an AI-powered analytics assistant embedded exclusively within the Ssaye Club Admin Dashboard (`/admin`) and Super Admin Dashboard (`/superadmin`). Unlike the customer-facing Ssaye Bot, this tool is purpose-built for internal business use — it gives admins an instant, conversational window into the health of the grocery marketplace: who is buying, what they are buying, how often, how much they spend, and where the business has room to grow.

It combines a **live visual dashboard** with a **Gemini-powered chat interface**, both grounded in real-time data pulled directly from MongoDB. No individual customer data (PII) is ever exposed — all analysis is aggregated.

---

## Positioning & Persona

| Attribute | Detail |
|---|---|
| **Name** | CRM Intelligence |
| **Role** | Senior CRM and retail analytics assistant |
| **Audience** | Admins and Super Admins only |
| **Tone** | Professional, data-grounded, business-focused |
| **Scope** | Grocery marketplace CRM — does not discuss investments |
| **PII Policy** | Zero individual customer data sent to AI |

---

## Where It Lives

The bot is rendered directly inside:
- `client/src/pages/Admin.js` → `/admin`
- `client/src/pages/SuperAdmin.js` → `/superadmin`

It is completely absent from all other pages. The `BotRouter` in `App.js` explicitly suppresses both the generic ChatBot and the marketplace SsayeBot on these paths, ensuring no other chatbot competes with or duplicates the CRM bot.

```
/admin              → CRM Bot only (generic ChatBot suppressed)
/superadmin         → CRM Bot only (generic ChatBot suppressed)
/marketplace-manager → No chatbot at all
All other paths     → Generic ChatBot or SsayeBot as appropriate
```

---

## User Interface

### The FAB (Floating Action Button)
A pill-shaped button fixed at the **bottom-right corner** of the screen, always visible while the admin works. It displays:
- A **code/analytics icon** in its closed state
- The label **"CRM Insights"** beside the icon
- Transforms into a plain **close (×) icon** when the panel is open
- Indigo gradient background (`#6366f1 → #4f46e5`) with a pronounced drop shadow to stand out against the admin dashboard

### The Panel
A 480×680px floating panel anchored above the FAB, with a layered structure:

```
┌────────────────────────────────────┐
│  HEADER (indigo gradient)          │
│  📊 CRM Intelligence               │
│  Live customer analytics · Ssaye   │
│                    [↻ Refresh] [×] │
├────────────────────────────────────┤
│  TABS: [ 📈 Dashboard ] [ 🤖 Ask AI ]│
├────────────────────────────────────┤
│                                    │
│  CONTENT AREA (scrollable)         │
│  — Dashboard: KPI cards, charts    │
│  — Ask AI: chat messages, input    │
│                                    │
└────────────────────────────────────┘
```

The panel animates in with a slide-up + scale effect (`translateY + scale`). The refresh button in the header re-fetches all CRM data on demand, with a spinning animation while loading.

---

## Two-Tab Interface

### Tab 1 — Dashboard

The dashboard loads automatically when the panel is first opened and displays all CRM metrics visually, requiring no questions to be typed.

#### KPI Cards (2-column grid, 6 cards)

Each card has a coloured left border accent, an icon, a headline metric, and a supporting sub-label:

| Card | Metric | Accent Colour | Sub-label |
|---|---|---|---|
| 📦 Avg Orders / Customer | Average number of orders placed per unique customer | Indigo | Total all-time orders |
| 💰 Avg Spend / Customer | Average lifetime spend across all ordering customers | Green | Total lifetime revenue |
| 🔁 Repeat Purchase Rate | % of customers who have ordered more than once | Amber | Count of repeat buyers |
| ⭐ High-Value Customers | Count of customers in the top 20% by lifetime spend | Pink | "Top 20% by lifetime spend" |
| 😴 Lapsed Customers | Customers who ordered historically but not in 60+ days | Red | "No order in 60+ days" |
| 🔄 Active Subscriptions | Count of currently active Subscribe & Save members | Purple | "Subscribe & Save members" |

#### Top Categories Bar Chart
Horizontal bar chart showing up to **6 product categories** ranked by total units sold across all marketplace orders. Each bar is a distinct colour and labelled with the category name and unit count. The longest bar represents the #1 category and acts as the 100% baseline for all other bars.

#### Top Brands Bar Chart
Horizontal bar chart showing up to **8 brands** ranked by total units sold. Uses a separate colour palette from the category chart for visual distinction.

#### Top Search Terms Tag Cloud
The top 10 search keywords typed by customers across the entire platform, rendered as pill-shaped tags in indigo. Tags fade slightly in opacity as rank decreases, providing a subtle visual hierarchy without cluttering the display.

#### Most Wishlisted Products (Ranked List)
Top 8 products saved to customer wishlists across the platform, shown as a ranked list with product name, category, and save count. This is particularly useful for identifying **demand that hasn't converted to purchases** — a direct signal for promotions or stock prioritisation.

#### Best-Selling Products (Ranked List)
Top 10 products by units sold across all marketplace orders. Shows product name, brand, category, and unit count. This is the ground truth of what customers actually buy, as opposed to what they browse or wishlist.

---

### Tab 2 — Ask AI

A conversational interface where admins can ask open-ended business questions and receive AI-generated answers grounded in live CRM data.

#### Suggested Starter Questions
Shown only before the first question is typed, five pre-written prompts help admins get started immediately:

| Suggested Question | Business Purpose |
|---|---|
| Which category has the most growth opportunity? | Identify underserved demand vs wishlist data |
| Who are our most loyal customers? | Segment analysis — repeat purchasers |
| What products are wishlisted but not purchased? | Conversion gap identification |
| How can we reduce lapsed customers? | Retention strategy |
| What's driving repeat purchases? | Loyalty driver analysis |

Clicking a suggestion populates the input field (rather than sending immediately), allowing the admin to edit the question before sending.

#### Message Thread
- **Bot messages** — left-aligned with a 🤖 avatar, light grey bubble, supports multi-line responses and `**bold**` markdown rendering
- **Admin messages** — right-aligned, indigo gradient bubble, white text
- **Typing indicator** — three-dot bouncing animation while Gemini is generating a response
- Auto-scrolls to the latest message on every new reply

#### Input
A resizable textarea (grows up to 120px tall for longer questions), with:
- `Enter` to send, `Shift+Enter` for a new line
- Send button disabled when input is empty or AI is processing
- Disabled state while a response is loading to prevent duplicate submissions

---

## Conversation Flow

```
Admin navigates to /admin or /superadmin
               ↓
CRM Bot FAB appears (bottom-right, always visible)
               ↓
Admin clicks "CRM Insights"
               ↓
Panel opens → Dashboard tab active by default
               ↓
[Automatic] GET /api/admin/crm-insights called
               ↓
6 MongoDB collections queried in parallel
               ↓
KPI cards, bar charts, lists render with live data
               ↓
Admin switches to "Ask AI" tab
               ↓
Suggested questions displayed
               ↓
Admin types or selects a question
               ↓
POST /api/admin/crm-chat
(fresh CRM data fetched on every chat request)
               ↓
Gemini 2.5 Flash generates insight grounded in data
               ↓
Response rendered in message thread
               ↓
Conversation continues — full history maintained
```

---

## Backend Architecture

### File
`server/routes/adminCrm.js` — mounted at `/api/admin`

### Authentication & Authorisation
Every endpoint requires:
1. **`authMiddleware`** — validates `Authorization: Bearer <token>`, decodes JWT, attaches `req.user`
2. **`requireAdmin`** — checks `req.user.isAdmin || req.user.isSuperAdmin`; returns HTTP 403 if neither is true

This means the endpoints are completely inaccessible to regular customers, even if they discover the URL.

---

### Endpoint 1 — GET /api/admin/crm-insights

Returns the full aggregated CRM dataset for the dashboard. Runs **6 parallel MongoDB queries** using `Promise.all`:

| Query | Collection | Purpose |
|---|---|---|
| All orders (all time) | `MarketplaceOrder` | Base data for frequency, spend, categories, brands, products |
| Recent orders (last 30 days) | `MarketplaceOrder` | Trend window for lapsed customer detection and recent revenue |
| User activity documents | `UserActivity` | Search keyword extraction |
| All wishlist entries | `Wishlist` | Most-saved product ranking |
| All subscriptions | `Subscription` | Active count and frequency breakdown |
| Registered user count | `User` | Baseline denominator for conversion metrics |

#### Computed Metrics

**Shopping Frequency**
- Orders per user mapped via `ordersByUser` dictionary
- Average orders per customer calculated across all buyers
- Segmented into one-time buyers (count = 1) vs repeat buyers (count > 1)
- Repeat purchase rate = (repeat buyers / total buyers) × 100

**Lapsed Customers**
- `allBuyerIds` — set of all users who have ever ordered
- `recentBuyerIds` — set of users who ordered in the last 30 days
- Lapsed = `allBuyerIds` minus `recentBuyerIds` (ordered historically, silent for 30+ days)

**Average Spending**
- Lifetime spend summed per user via `spendByUser` dictionary
- Average calculated across all buyers who have placed at least one order
- High-value segment: top 20% threshold computed by sorting all spend values descending and taking the value at the 20th percentile index

**Preferred Categories**
- Iterates every item across every order, accumulates `quantity` per `category`
- Returns top 6 by unit volume

**Favourite Brands**
- Same approach as categories but keyed by `brand`
- Returns top 8 by unit volume

**Top Products**
- Keyed by product `name` (includes category and brand for context)
- Returns top 10 by unit volume

**Search Trends**
- Iterates `UserActivity.searches` across all users
- Keywords lowercased and trimmed before counting
- Returns top 10 most-searched terms

**Wishlist Favourites**
- Counts occurrences of each `productId` (using `name` as display key) across all `Wishlist` documents
- Returns top 8 most-saved products

**Subscription Breakdown**
- Groups by `frequency` (weekly, biweekly, monthly, bimonthly, quarterly)
- Counts active subscriptions (`status === 'active'`)

#### Response Shape
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalOrders": 1240,
      "ordersLast30d": 187,
      "totalRevenue": 48320.50,
      "revenueL30d": 7210.00,
      "totalCustomers": 312,
      "totalRegistered": 890,
      "avgOrdersPerCustomer": 3.97,
      "avgSpendPerCustomer": 154.87,
      "repeatRate": 71.2,
      "oneTimeCustomers": 90,
      "repeatCustomers": 222,
      "lapsedCustomers": 44,
      "highValueCustomers": 62,
      "activeSubscriptions": 38
    },
    "topCategories": [{ "name": "Spices & Masala", "count": 4210 }, ...],
    "topBrands": [{ "name": "MDH", "count": 1840 }, ...],
    "topProducts": [{ "name": "MDH Chana Masala 500g", "category": "Spices & Masala", "brand": "MDH", "count": 312 }, ...],
    "topSearches": [{ "term": "basmati rice", "count": 87 }, ...],
    "topWishlisted": [{ "name": "Tilda Basmati 5kg", "category": "Rice & Grains", "count": 54 }, ...],
    "subscriptionFrequencies": { "monthly": 22, "weekly": 8, "biweekly": 8 }
  }
}
```

---

### Endpoint 2 — POST /api/admin/crm-chat

Handles conversational AI queries. On every request it:

1. Validates the `message` field
2. **Re-runs `buildCrmData()`** — fetches fresh live data (not cached from the dashboard load)
3. Serialises the full CRM snapshot into a structured plain-text context block
4. Constructs the Gemini system prompt with the data embedded
5. Appends conversation history and current message
6. Calls Gemini 2.5 Flash
7. Returns the text response

#### Request Payload
```json
{
  "message": "Which category has growth potential based on wishlist vs sales data?",
  "history": [
    { "role": "assistant", "content": "Hi! I'm your CRM analyst..." }
  ]
}
```

#### The AI System Prompt — What Gemini Is Told

The system prompt establishes the AI's identity, rules, and injects the live data snapshot:

**Identity:** Senior CRM and retail analytics assistant for Ssaye Club

**Behavioural Rules:**
- Answer in clear, business-focused English with bullet points where appropriate
- Always cite specific numbers from the data — never speak in generalities
- Highlight growth opportunities (categories with high wishlist but lower sales)
- Flag risks (high lapsed rate, low repeat rate, stagnant categories)
- Suggest concrete, actionable next steps when asked
- Never invent data not present in the snapshot
- Keep responses under 300 words unless the admin asks to elaborate

**Data Injected (live, on every request):**
- Full overview metrics (all 13 computed values)
- Ranked category list with unit counts
- Ranked brand list with unit counts
- Top 10 products with category and unit counts
- Top 10 search terms with frequencies
- Top 8 wishlisted products with save counts
- Subscription frequency breakdown

**History Format:**
Conversation turns are labelled `Admin:` and `Analyst:` (not `User:` and `Assistant:`) to reinforce the professional context for the AI.

#### PII Guarantee
Individual customer names, emails, addresses, and order details are **never included** in the data context sent to Gemini. All metrics are aggregated counts and averages computed in Node.js before the AI sees anything. The `buildCrmData` function never selects name or email fields.

---

## Key Features Summary

### 1. Zero-Question Dashboard
The Dashboard tab renders a complete CRM picture the moment the panel opens — no questions needed. An admin can get the full business health snapshot in under 3 seconds.

### 2. Live Data on Every Interaction
Both the dashboard and the AI chat fetch fresh data directly from MongoDB at the time of each request. There is no caching layer — the numbers the admin sees are always current.

### 3. Parallel Database Queries
All 6 MongoDB queries run simultaneously via `Promise.all`, keeping the dashboard load time as low as possible regardless of data volume.

### 4. AI Grounded in Real Numbers
Gemini does not guess or hallucinate business metrics. Every AI response is constrained by the live data snapshot injected into the prompt. If the admin asks "what's our repeat purchase rate?", the AI cites the exact computed figure.

### 5. Customer Segmentation
Four distinct customer segments are computed and surfaced:
- **One-time buyers** — purchased once, may need re-engagement
- **Repeat buyers** — core loyal base
- **High-value customers** — top 20% by lifetime spend
- **Lapsed customers** — previously active, silent for 30+ days (retention risk)

### 6. Wishlist vs Sales Gap Analysis
By surfacing both the most-wishlisted and best-selling products, the dashboard and AI can identify products with high intent (wishlist saves) but lower conversion to purchase — a direct signal for targeted promotions or price adjustments.

### 7. Refresh on Demand
The refresh button in the panel header re-runs the data fetch without closing the panel, so an admin can update their view at any point during a session.

### 8. Persistent Conversation
The full chat history is maintained in component state for the duration of the session. The admin can ask a follow-up question referencing a previous answer ("what about the second category you mentioned?") and the AI has the full context to respond correctly.

### 9. Admin-Only Access
Two layers of protection ensure this tool is never accessible to regular users:
- **Frontend:** `CrmBot` is only imported and rendered inside `Admin.js` and `SuperAdmin.js`
- **Backend:** Both endpoints require a valid JWT with `isAdmin` or `isSuperAdmin` set to true; all other requests receive HTTP 403

---

## AI Model — Gemini 2.5 Flash

The CRM Intelligence Bot runs on **Google Gemini 2.5 Flash** via the `@google/generative-ai` Node.js SDK.

### Context Window & Output

| Property | Limit |
|---|---|
| Input context window | 1,048,576 tokens (~1 million tokens) |
| Output per response | 65,536 tokens |
| Knowledge cutoff | January 2025 |

The CRM bot sends the most tokens per call of any Ssaye AI feature — a full CRM snapshot plus a full predictive data snapshot are injected into every chat request alongside the conversation history. Even so, this payload is a small fraction of the 1M input ceiling.

### Pricing

| Tier | Input | Output |
|---|---|---|
| **Free** | Free | Free |
| **Paid — text / image / video** | $0.30 / 1M tokens | $2.50 / 1M tokens |
| **Paid — audio input** | $1.00 / 1M tokens | $2.50 / 1M tokens |

The CRM bot is admin-only and call volume is inherently low (a handful of admins, not thousands of customers). This use case comfortably fits within the free tier indefinitely.

### Free Tier Rate Limits

- **500 requests per day** (grounding/search features)
- Per-minute and per-day RPM/TPM thresholds are account-specific — check your key's limits in [Google AI Studio](https://aistudio.google.com)

Since the CRM bot is exclusively for internal admin use, daily request volumes are far below the free-tier ceiling.

### Thinking / Reasoning

Gemini 2.5 Flash is the first model in the Flash tier to include **native thinking capabilities** — it reasons through a problem before producing its final response. This is included within the free tier output budget. For the CRM bot, this capability directly improves the quality of procurement recommendations, where the model must weigh multiple signals (velocity, trend, subscription demand, wishlist gap) before giving a prioritised answer.

### Multimodal Capabilities

The model supports text, images, video, and audio (30 HD voices, 24 languages). The CRM bot uses **text only** — all data context and all responses are plain text.

### Why Flash Over Pro

| | Gemini 2.5 Flash | Gemini 2.5 Pro |
|---|---|---|
| Context window | 1M tokens | 1M tokens |
| Native thinking | Yes | Yes (more advanced) |
| Price | Much lower | Higher |
| Best for | High-volume, price-efficient tasks | Deep reasoning tasks |

For an admin analytics assistant working with structured aggregated data, Flash's native thinking is sufficient. Pro's more advanced reasoning would add cost without a meaningful quality improvement for this use case.

---

## Technical Specifications

| Property | Value |
|---|---|
| Frontend component | `client/src/components/CrmBot.js` |
| Stylesheet | `client/src/components/CrmBot.css` |
| Backend route file | `server/routes/adminCrm.js` |
| Server mount point | `app.use('/api/admin', adminCrmRoutes)` |
| Dashboard endpoint | `GET /api/admin/crm-insights` |
| Chat endpoint | `POST /api/admin/crm-chat` |
| Authentication | JWT Bearer token (required) |
| Authorisation | `isAdmin` or `isSuperAdmin` flag |
| AI provider | Google Gemini |
| AI model | `gemini-2.5-flash` |
| Model input limit | 1,048,576 tokens |
| Model output limit | 65,536 tokens per response |
| Current pricing tier | Free |
| Active pages | `/admin`, `/superadmin` |
| Suppressed pages | All other pages |
| DB collections queried | MarketplaceOrder, UserActivity, Wishlist, Subscription, User |
| Parallel DB queries | 6 (via Promise.all) |
| PII in AI prompts | None — aggregated data only |
| Conversation history | Maintained in React state for session duration |

---

## Data Flow Diagram

```
Admin opens /admin or /superadmin
               ↓
CRM Bot FAB renders (CrmBot.js injected into page)
               ↓
Admin clicks "CRM Insights" → panel opens
               ↓
┌──────────────────────────────────────────────┐
│  GET /api/admin/crm-insights                 │
│                                              │
│  authMiddleware → requireAdmin               │
│                                              │
│  Promise.all([                               │
│    MarketplaceOrder.find(all),               │
│    MarketplaceOrder.find(last 30d),          │
│    UserActivity.find(all),                   │
│    Wishlist.find(all),                       │
│    Subscription.find(all),                   │
│    User.countDocuments(regular users)        │
│  ])                                          │
│                                              │
│  buildCrmData():                             │
│  • Shopping frequency + repeat rate          │
│  • Lapsed customer detection                 │
│  • Avg spend + high-value segment            │
│  • Category / brand / product rankings       │
│  • Search keyword frequency                  │
│  • Wishlist rankings                         │
│  • Subscription breakdown                    │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
          Dashboard renders with live data
          (KPI cards, bar charts, ranked lists)
                       │
                       ▼
          Admin switches to "Ask AI" tab
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  POST /api/admin/crm-chat                    │
│                                              │
│  authMiddleware → requireAdmin               │
│                                              │
│  buildCrmData() called again (fresh data)    │
│                                              │
│  System prompt constructed:                  │
│  • Senior CRM analyst persona                │
│  • Behavioural rules                         │
│  • Full aggregated data snapshot             │
│                                              │
│  + conversation history (Admin/Analyst fmt)  │
│  + current admin question                    │
└──────────────────────┬───────────────────────┘
                       │  generateContent(prompt)
                       ▼
          Google Gemini 2.5 Flash
          Generates data-grounded insight
                       │
                       ▼
          Response rendered in chat thread
          Bold markdown parsed
          Conversation history updated
```

---

*Ssaye Club · Internal Technical Documentation*
