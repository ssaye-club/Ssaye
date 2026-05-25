# AI Chatbot Setup Guide

## Quick Start (Choose One)

### Option 1: OpenAI (ChatGPT) - Recommended
**Best for: Most popular, reliable, good pricing**

1. **Get API Key:**
   - Go to https://platform.openai.com/api-keys
   - Sign up/login
   - Create new API key
   - Copy the key (starts with `sk-...`)

2. **Install Package:**
   ```bash
   cd server
   npm install openai
   ```

3. **Add to .env:**
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

4. **In server/routes/chat.js:**
   - Uncomment lines 7-10 (OpenAI import)
   - Uncomment lines 36-59 (OpenAI implementation)
   - Comment out line 125 (rule-based response)
   - Delete the `generateResponse` function (lines 128-end)

5. **Pricing:**
   - GPT-3.5 Turbo: ~$0.001 per 1K tokens (very cheap)
   - GPT-4 Turbo: ~$0.01 per 1K tokens (better quality)

---

### Option 2: Anthropic (Claude)
**Best for: Advanced reasoning, better context understanding**

1. **Get API Key:**
   - Go to https://console.anthropic.com/
   - Sign up/login
   - Get API key from settings

2. **Install Package:**
   ```bash
   cd server
   npm install @anthropic-ai/sdk
   ```

3. **Add to .env:**
   ```
   ANTHROPIC_API_KEY=your-key-here
   ```

4. **In server/routes/chat.js:**
   - Uncomment lines 12-15 (Anthropic import)
   - Uncomment lines 61-93 (Anthropic implementation)
   - Comment out line 125 (rule-based response)
   - Delete the `generateResponse` function (lines 128-end)

5. **Pricing:**
   - Claude 3 Sonnet: ~$0.003 per 1K tokens
   - Better at complex reasoning than GPT-3.5

---

### Option 3: Google Gemini
**Best for: Free tier available, good for testing**

1. **Get API Key:**
   - Go to https://makersuite.google.com/app/apikey
   - Create API key

2. **Install Package:**
   ```bash
   cd server
   npm install @google/generative-ai
   ```

3. **Add to .env:**
   ```
   GOOGLE_API_KEY=your-key-here
   ```

4. **In server/routes/chat.js:**
   - Uncomment lines 17-19 (Google import)
   - Uncomment lines 95-123 (Google implementation)
   - Comment out line 125 (rule-based response)
   - Delete the `generateResponse` function (lines 128-end)

5. **Pricing:**
   - Gemini Pro: FREE up to 60 requests/minute
   - Great for development/testing

---

## After Setup

1. **Restart your server:**
   ```bash
   npm start
   ```

2. **Test the chatbot** on your website

3. **Monitor usage** in your API provider dashboard

## Troubleshooting

- **"API key not found"**: Check your .env file and restart server
- **Rate limit errors**: Upgrade your API plan or add retry logic
- **Slow responses**: Consider using faster models (GPT-3.5 vs GPT-4)

## Cost Estimates

For ~1000 chat messages/month:
- **OpenAI GPT-3.5**: ~$1-2/month
- **OpenAI GPT-4**: ~$10-20/month
- **Anthropic Claude**: ~$3-5/month
- **Google Gemini**: FREE (within limits)

## Recommendation

Start with **Google Gemini** (free) for testing, then upgrade to **OpenAI GPT-3.5** for production.
