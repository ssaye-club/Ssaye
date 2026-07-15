# AI Model Documentation
### Ssaye Club · Technical Reference

---

## Overview

Ssaye Club uses **Google Gemini 2.5 Flash** as the AI backbone for all intelligent features across the platform. The same model powers two distinct systems with different audiences, data contexts, and behavioural personas:

| System | Audience | Location | Purpose |
|---|---|---|---|
| **Ssaye Bot** | Customers | `/marketplace`, `/product/*` | South Asian grocery guide and recipe assistant |
| **CRM Intelligence Bot** | Admins / Super Admins | `/admin`, `/superadmin` | Business analytics and procurement advisor |

Both systems call the model via the `@google/generative-ai` Node.js SDK and share the same API key, but they operate entirely independently with separate endpoints, separate system prompts, and separate data contexts.

---

## The Model: Gemini 2.5 Flash

**Model ID used in code:** `gemini-2.5-flash`
**Provider:** Google DeepMind
**SDK:** `@google/generative-ai` (Node.js)
**API surface:** `genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })`

Gemini 2.5 Flash is Google's highest-efficiency production model — optimised for the price-to-performance tradeoff. It is the first model in the Flash tier to include native thinking/reasoning capabilities, making it suitable for both rapid conversational responses and more deliberate analytical tasks.

---

## Context Window & Output Limits

| Property | Value |
|---|---|
| **Input context window** | 1,048,576 tokens (~1 million tokens) |
| **Output per response** | 65,536 tokens |
| **Knowledge cutoff** | January 2025 |

### What 1M tokens means in practice

- The entire Ssaye codebase fits comfortably inside a single API call
- A typical Ssaye Bot conversation (system prompt + 20 back-and-forth messages + live catalogue data) uses roughly 2,000–5,000 tokens — less than 0.5% of the available window
- The CRM bot's heaviest requests (system prompt + full CRM snapshot + full predictive data + conversation history) use roughly 8,000–15,000 tokens — still under 1.5% of the limit

In practice, neither bot will ever approach the context ceiling under normal operating conditions.

---

## Pricing

Gemini 2.5 Flash has two tiers: a free tier and a pay-as-you-go paid tier.

### Free Tier

| Input | Output |
|---|---|
| Free | Free |

Both Ssaye bots currently operate entirely on the free tier.

### Paid Tier (Pay-As-You-Go)

| Input type | Cost per 1M tokens |
|---|---|
| Text, image, video | $0.30 |
| Audio | $1.00 |
| **Output (all types)** | **$2.50** |

Neither Ssaye bot uses audio input, so the $1.00/1M audio rate does not apply. Both bots are text-only.

### Cost Estimate at Scale

As a reference, if Ssaye Bot handled 10,000 customer conversations per month at an average of 5,000 tokens per conversation (input + output combined), the total token usage would be ~50M tokens/month — costing roughly **$0.15–$1.25/month** on the paid tier. For a community grocery club, AI costs are essentially negligible even at significant scale.

---

## Free Tier Rate Limits

- **500 requests per day** for grounding/search-augmented features
- Standard RPM (requests per minute) and TPM (tokens per minute) limits apply and vary by account tier
- Check the limits tied to your specific API key at [Google AI Studio → API keys](https://aistudio.google.com)

### Relevance to Ssaye

- **Ssaye Bot** is customer-facing and public — if usage grows, this is the most likely limit to be hit first. 500 RPD is sufficient for a community-scale grocery platform but would need upgrading for mass-market usage.
- **CRM Intelligence Bot** is admin-only — a handful of admins making periodic queries will never approach the free tier ceiling.

---

## Thinking / Reasoning

Gemini 2.5 Flash is the **first Flash-tier model to include native thinking capabilities**.

Before producing a final response, the model can reason through the problem internally — similar to a chain-of-thought process, but handled natively by the model rather than prompted explicitly. This reasoning is:

- **Included in the free tier** — it counts against the output token budget but does not incur additional charges
- **Invisible to the user** — the thinking process is internal; only the final response is returned
- **Automatically applied** — the model decides when to use extended reasoning based on query complexity

### Impact on Ssaye

| Bot | Benefit of thinking |
|---|---|
| Ssaye Bot | More coherent multi-ingredient recipe walkthroughs; better ingredient substitution reasoning |
| CRM Bot | Better multi-signal procurement prioritisation (weighing velocity + trend + subscription demand + wishlist gap simultaneously) |

---

## Multimodal Capabilities

Gemini 2.5 Flash natively processes multiple input modalities:

| Modality | Supported | Used in Ssaye |
|---|---|---|
| Text | Yes | Yes — all bots |
| Images | Yes | No (future potential) |
| Video | Yes | No |
| Audio input | Yes | No |
| Audio output | Yes — 30 HD voices, 24 languages | No |
| Automatic language detection | Yes | No |

### Future Potential for Ssaye

- **Image input:** A customer could photograph an ingredient or a product label and ask Ssaye Bot to identify it or suggest recipes
- **Voice queries:** Audio input could allow hands-free cooking assistant mode ("Hey, how much turmeric goes in this?")
- **Multilingual support:** Automatic language detection could allow South Asian diaspora users to query in Hindi, Urdu, Tamil, Punjabi, etc.

None of these are currently implemented — both bots are text-only.

---

## Gemini 2.5 Flash vs. Gemini 2.5 Pro

| Property | Gemini 2.5 Flash | Gemini 2.5 Pro |
|---|---|---|
| Context window | 1,048,576 tokens | 1,048,576 tokens |
| Output limit | 65,536 tokens | 65,536 tokens |
| Native thinking | Yes | Yes (more advanced) |
| Multimodal | Yes | Yes |
| Input price (text) | $0.30 / 1M | Higher |
| Output price | $2.50 / 1M | Higher |
| Free tier | Yes | Limited |
| Best suited for | High-volume, price-efficient conversational tasks | Complex long-horizon reasoning tasks |

### Why Ssaye uses Flash

Neither the grocery chatbot nor the CRM advisor requires the deeper reasoning headroom of Pro. Flash's native thinking is sufficient for recipe walkthroughs and procurement recommendations. Choosing Flash over Pro keeps API costs low and maintains free-tier eligibility at Ssaye's current scale.

---

## How the Model Is Called

Both bots use the same invocation pattern in Node.js:

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const result = await model.generateContent(prompt);
const text = result.response.text();
```

The full prompt — system instructions + injected data context + conversation history + current message — is concatenated into a single string and passed to `generateContent`. There is no streaming; the full response is returned before being sent to the client.

---

## Where the Model Is Invoked

| File | Route | Bot |
|---|---|---|
| `server/routes/chatMarketplace.js` | `POST /api/chat/marketplace` | Ssaye Bot |
| `server/routes/adminCrm.js` | `POST /api/admin/crm-chat` | CRM Intelligence Bot |
| `server/routes/chat.js` | `POST /api/chat` | Legacy general chatbot (inactive on admin pages) |

---

## Environment Configuration

The Gemini API key is stored as an environment variable and never committed to the repository:

```
GEMINI_API_KEY=your_key_here
```

Referenced in all three route files as `process.env.GEMINI_API_KEY`. The key grants access to the Gemini API under whichever billing tier it is associated with in Google AI Studio.

---

## Data Privacy & AI Safety

### What is sent to Gemini

| Bot | Data sent |
|---|---|
| Ssaye Bot | System prompt + live product count + category breakdown + conversation history + user message |
| CRM Bot | System prompt + aggregated CRM metrics + aggregated predictive data + conversation history + admin message |

### What is never sent to Gemini

- Individual customer names, emails, or account details
- Individual order details (items, addresses, payment info)
- User passwords, tokens, or any authentication data
- Any personally identifiable information (PII)

All CRM and predictive data is pre-aggregated in Node.js before the AI sees it — the model only ever receives counts, averages, rankings, and computed metrics. This is enforced at the data-building layer (`buildCrmData()` and `buildPredictiveData()` in `server/routes/adminCrm.js`) which never selects name or email fields from any MongoDB query.

---

*Ssaye Club · Internal Technical Documentation*
