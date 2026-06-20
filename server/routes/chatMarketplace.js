const express = require('express');
const router  = require('express').Router();
const Product = require('../models/Product');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// POST /api/chat/marketplace
router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Pull live catalogue context from DB
    const [totalCount, categoryCounts] = await Promise.all([
      Product.countDocuments({}),
      Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    ]);

    const categoryList = categoryCounts
      .sort((a, b) => b.count - a.count)
      .map(c => `${c._id} (${c.count} products)`)
      .join(', ');

    const systemPrompt = `You are Ssaye Bot, the friendly grocery assistant for Ssaye Grocery Club — an online South Asian grocery marketplace.

Your personality:
- Warm, enthusiastic, and deeply knowledgeable about South Asian food, spices, and groceries
- You speak like a helpful friend at a desi grocery store — approachable, never robotic
- You love food! Share recipe ideas, ingredient lists, and cooking advice freely and in detail
- Use occasional food emojis to keep things lively
- Be honest when you don't know something

You can help with:
- Full recipe walkthroughs and complete ingredient lists (be thorough — list every spice, protein, dairy item, and aromatic)
- Finding products, categories, or brands in the marketplace
- Explaining South Asian ingredients and how to use them
- Ingredient substitutions and alternatives
- Cooking tips and techniques for South Asian cuisine
- Navigating the marketplace (cart, wishlist, checkout)

The marketplace has ${totalCount.toLocaleString()} products across these categories: ${categoryList}.

When a user asks for ingredients for a recipe, give them the FULL ingredient list with quantities — do not hold back. This helps them shop in the marketplace.
Do not make up specific prices — tell users to check the product page.
Do not discuss investments or finance.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build conversation history — skip the first assistant greeting (no preceding user turn)
    // and enforce strict user/assistant alternation to avoid Gemini errors
    const rawHistory = (history || []).filter(m => m.role === 'user' || m.role === 'assistant');

    // Find the first user message and only include from there onwards
    const firstUserIdx = rawHistory.findIndex(m => m.role === 'user');
    const trimmedHistory = firstUserIdx >= 0 ? rawHistory.slice(firstUserIdx) : [];

    const conversationHistory = trimmedHistory
      .map(m => `${m.role === 'user' ? 'User' : 'Ssaye Bot'}: ${m.content}`)
      .join('\n');

    const prompt = conversationHistory
      ? `${systemPrompt}\n\n${conversationHistory}\nUser: ${message}\nSsaye Bot:`
      : `${systemPrompt}\n\nUser: ${message}\nSsaye Bot:`;

    const result = await model.generateContent(prompt);
    res.json({ response: result.response.text() });
  } catch (err) {
    console.error('Marketplace chat error:', err.message);
    res.status(500).json({ error: 'Failed to process message', detail: err.message });
  }
});

module.exports = router;
