# Ssaye Bot — Marketplace Chatbot
### Product Documentation · Ssaye Club

---

## Overview

Ssaye Bot is the customer-facing AI assistant embedded within the Ssaye Club marketplace. It is designed to feel like a knowledgeable friend at a South Asian grocery store — helpful, warm, and deeply familiar with the products, ingredients, and cuisine on the platform. It operates exclusively on the `/marketplace` and `/product/*` pages and is never shown on administrative or investment pages.

---

## Positioning & Persona

| Attribute | Detail |
|---|---|
| **Name** | Ssaye Bot |
| **Role** | South Asian grocery guide and recipe advisor |
| **Tone** | Warm, enthusiastic, approachable — never robotic |
| **Scope** | Marketplace only — does not discuss investments or finance |
| **Branding** | Uses the Ssaye Club logo as its avatar throughout the UI |

The bot's persona is deliberately modelled on a trusted grocery store companion — someone who can rattle off a full biryani ingredient list, explain what hing is, or tell you which brand of ghee is popular, all in the same breath.

---

## Where It Lives

The bot is rendered via the `BotRouter` component in `App.js`. A path check runs on every navigation:

```
/marketplace        → SsayeBot renders
/product/*          → SsayeBot renders
All other paths     → Generic ChatBot or suppressed (admin pages)
```

It sits as a **fixed floating button** at the bottom-right corner of the screen — always accessible while the user browses the marketplace, without blocking any product content.

---

## User Interface

### The Toggle Button
- Displays the **Ssaye Club logo** as its icon in the closed state
- Shows a **red unread badge** with a count when new messages arrive while the chat is minimised
- Transitions to an **X (close) icon** when the chat window is open
- Clicking toggles the chat window open or closed

### The Chat Window
A compact floating panel that appears above the toggle button, containing:

1. **Header bar** — Ssaye Bot name, logo avatar, and a green "online" status dot labelled *"Your grocery guide"*
2. **Message thread** — scrollable conversation history with distinct styling for user messages (right-aligned) and bot messages (left-aligned with logo avatar)
3. **Quick Action buttons** — four pre-written starter prompts shown only on the first message, before any conversation has taken place
4. **Text input** — single-line input field with send button; disabled while a response is loading
5. **Footer** — *"Powered by Ssaye · South Asian Grocery Club"*

### Quick Action Prompts
These appear immediately when the chat is first opened, giving users an instant entry point without needing to think of a question:

| Button | Intent |
|---|---|
| 🌶️ What spices do you carry? | Catalogue discovery |
| 🫘 Help me find dal | Category navigation |
| 🛒 How does checkout work? | Marketplace guidance |
| 🍛 Suggest a recipe ingredient | Recipe assistance |

---

## Conversation Flow

```
User opens marketplace
        ↓
Ssaye Bot floating button appears (bottom-right)
        ↓
User clicks button → Chat window opens
        ↓
Greeting message displayed automatically:
"Hey there! I'm Ssaye Bot ✨ — your South Asian grocery guide..."
        ↓
Quick action buttons shown (disappear after first message)
        ↓
User types or clicks a quick action
        ↓
[Frontend] Message appended to history → POST /api/chat/marketplace
        ↓
[Backend] Live catalogue data fetched from MongoDB
        ↓
[Backend] System prompt constructed with live product context
        ↓
[Backend] Gemini 2.5 Flash generates response
        ↓
Response displayed with typing indicator → conversation continues
```

---

## Backend Architecture

### Endpoint
`POST /api/chat/marketplace`
**File:** `server/routes/chatMarketplace.js`
**Auth:** None required — publicly accessible

### Request Payload
```json
{
  "message": "What ingredients do I need for butter chicken?",
  "history": [
    { "role": "assistant", "content": "Hey there! I'm Ssaye Bot..." },
    { "role": "user", "content": "What spices do you carry?" },
    { "role": "assistant", "content": "We have a great range of..." }
  ]
}
```

### Live Catalogue Injection
On every request, the server runs **two MongoDB queries in parallel** before calling the AI:

1. `Product.countDocuments({})` — total product count across the entire catalogue
2. `Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }])` — product count per category, sorted by volume

This data is injected directly into the system prompt, ensuring the bot always reflects the current state of the inventory. For example:

> *"The marketplace has 4,200 products across these categories: Spices & Masala (610 products), Dal & Lentils (540 products), Rice & Grains (480 products)..."*

### Conversation History Handling
The backend applies strict sanitisation to the conversation history before sending it to Gemini:

- Filters to only `user` and `assistant` roles (no system messages)
- Trims the history to start from the **first user message** — the opening greeting is excluded, since it has no preceding user turn
- This prevents Gemini API errors caused by conversations that start with an assistant message

### AI Model
- **Provider:** Google Gemini via `@google/generative-ai`
- **Model:** `gemini-2.5-flash`
- **Prompt style:** Single concatenated string (system prompt + conversation history + current message)

---

## System Prompt — What the AI Is Told

The system prompt defines the bot's complete identity, knowledge scope, and behavioural rules:

**Identity & Tone**
- Warm, enthusiastic, deeply knowledgeable about South Asian food
- Speaks like a helpful friend at a desi grocery store
- Uses food emojis naturally throughout responses
- Honest when it doesn't know something

**Capabilities the Bot Is Explicitly Allowed**
- Full recipe walkthroughs with complete ingredient lists and quantities
- Finding products, categories, or brands in the marketplace
- Explaining South Asian ingredients and their culinary uses
- Ingredient substitutions and alternatives
- Cooking tips and techniques for South Asian cuisine
- Navigating the marketplace (cart, wishlist, checkout process)

**Explicit Restrictions**
- Does not discuss investments, finance, or anything outside the grocery domain
- Does not make up specific prices — directs users to the product page
- Does not engage with topics unrelated to the marketplace

---

## Key Features

### 1. Full Recipe Assistance
The single most powerful feature. When a user asks for a recipe, the bot is instructed to provide the **complete ingredient list with quantities** — not a partial or vague answer. This directly serves the marketplace by giving the user a shopping list they can fill from the catalogue.

*Example: Asking for a biryani recipe returns a full list covering basmati rice, chicken/mutton, yoghurt, whole spices (bay leaves, cardamom, cloves, cinnamon), ground spices (turmeric, chilli powder, garam masala), aromatics (onion, garlic, ginger), ghee, saffron, mint, and fried onions — all available as products.*

### 2. Live Catalogue Awareness
The bot knows exactly how many products are in the marketplace and how they are distributed across categories at the time of each conversation. This means its answers about product availability are always grounded in real data, not static training knowledge.

### 3. Ingredient Education
The bot can explain what unfamiliar South Asian ingredients are — their flavour profiles, culinary uses, and how to cook with them. This lowers the barrier for customers who are exploring South Asian cuisine for the first time.

### 4. Ingredient Substitution Guidance
If a product is unavailable or a user doesn't recognise an ingredient, the bot can suggest practical substitutes, helping them complete a recipe with what they can find in the marketplace.

### 5. Marketplace Navigation Help
The bot can walk users through how checkout works, how to use the wishlist, what "Subscribe & Save" means, and how to find products — reducing support queries.

### 6. Unread Message Counter
If a bot reply arrives while the chat window is closed (e.g. after a quick action was clicked and the user scrolled away), a red badge appears on the toggle button showing the number of unread messages. This ensures users don't miss a response.

### 7. Typing Indicator
A three-dot animated typing indicator appears in the message thread while the AI is generating a response, providing clear visual feedback that the system is working.

### 8. Markdown Bold Rendering
Bot responses support `**bold**` formatting. The frontend parser splits on `**text**` patterns and renders them as `<strong>` elements, allowing the AI to emphasise important words, ingredients, or steps.

---

## AI Model — Gemini 2.5 Flash

Ssaye Bot runs on **Google Gemini 2.5 Flash** via the `@google/generative-ai` Node.js SDK.

### Context Window & Output

| Property | Limit |
|---|---|
| Input context window | 1,048,576 tokens (~1 million tokens) |
| Output per response | 65,536 tokens |
| Knowledge cutoff | January 2025 |

The 1M input window means the entire conversation history, the live catalogue context, and the system prompt can be sent in a single call with virtually no risk of hitting the limit, even in very long conversations.

### Pricing

| Tier | Input | Output |
|---|---|---|
| **Free** | Free | Free |
| **Paid — text / image / video** | $0.30 / 1M tokens | $2.50 / 1M tokens |
| **Paid — audio input** | $1.00 / 1M tokens | $2.50 / 1M tokens |

At current Ssaye Club usage levels the free tier is sufficient. The marketplace chatbot is text-only so audio pricing does not apply.

### Free Tier Rate Limits

- **500 requests per day** (grounding/search features)
- Per-minute and per-day RPM/TPM thresholds are account-specific — check your key's limits in [Google AI Studio](https://aistudio.google.com)

### Thinking / Reasoning

Gemini 2.5 Flash is the first model in the Flash tier to include **native thinking capabilities**. The model reasons through a query internally before producing its final response. This is included within the free tier output token budget and contributes to the quality of recipe suggestions and ingredient explanations.

### Multimodal Capabilities

The model supports text, images, video, and audio (30 HD voices, 24 languages with automatic language detection). Ssaye Bot currently uses **text only** — these additional modalities are available for future features such as voice queries or image-based product identification.

### Why Flash Over Pro

| | Gemini 2.5 Flash | Gemini 2.5 Pro |
|---|---|---|
| Context window | 1M tokens | 1M tokens |
| Native thinking | Yes | Yes (more advanced) |
| Price | Much lower | Higher |
| Best for | High-volume, price-efficient tasks | Deep reasoning tasks |

For a customer-facing grocery chatbot, Flash provides the right balance — fast, affordable, and capable enough for recipe walkthroughs, ingredient queries, and marketplace navigation. Pro's deeper reasoning is unnecessary overhead for this use case.

---

## Technical Specifications

| Property | Value |
|---|---|
| Frontend component | `client/src/components/SsayeBot.js` |
| Stylesheet | `client/src/components/SsayeBot.css` |
| Backend route | `server/routes/chatMarketplace.js` |
| API endpoint | `POST /api/chat/marketplace` |
| Authentication | None (public) |
| AI provider | Google Gemini |
| AI model | `gemini-2.5-flash` |
| Model input limit | 1,048,576 tokens |
| Model output limit | 65,536 tokens per response |
| Current pricing tier | Free |
| Active pages | `/marketplace`, `/product/*` |
| Suppressed pages | `/admin`, `/superadmin`, `/marketplace-manager` |
| Live DB queries per request | 2 (product count + category aggregation) |
| History sanitisation | Yes — trims to first user message, removes system roles |

---

## Data Flow Diagram

```
┌─────────────────────────────────────┐
│         User (Browser)              │
│                                     │
│  Types message → clicks Send        │
└──────────────┬──────────────────────┘
               │  POST /api/chat/marketplace
               │  { message, history[] }
               ▼
┌─────────────────────────────────────┐
│      Express Server                 │
│                                     │
│  1. Validate message                │
│  2. Query MongoDB (parallel):       │
│     • Total product count           │
│     • Category breakdown            │
│  3. Build system prompt with        │
│     live catalogue context          │
│  4. Sanitise conversation history   │
│  5. Concatenate full prompt         │
└──────────────┬──────────────────────┘
               │  generateContent(prompt)
               ▼
┌─────────────────────────────────────┐
│      Google Gemini 2.5 Flash        │
│                                     │
│  Generates contextual response      │
│  grounded in live catalogue data    │
└──────────────┬──────────────────────┘
               │  response.text()
               ▼
┌─────────────────────────────────────┐
│      Browser renders reply          │
│                                     │
│  • Bold markdown parsed             │
│  • Message appended to thread       │
│  • Unread badge updated if closed   │
└─────────────────────────────────────┘
```

---

*Ssaye Club · Internal Technical Documentation*
