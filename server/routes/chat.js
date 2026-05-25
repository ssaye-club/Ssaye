const express = require('express');
const router = express.Router();
const InvestmentOpportunity = require('../models/InvestmentOpportunity');

// Google Gemini Integration
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// POST /api/chat - Handle chatbot messages
router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Fetch active investment opportunities from database
    const opportunities = await InvestmentOpportunity.find({ isActive: true })
      .select('name category location area description minInvestment totalValue expectedROI duration riskLevel status availableShares')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get aggregated platform statistics (privacy-safe)
    const totalOpportunities = opportunities.length;
    const categoriesAvailable = [...new Set(opportunities.map(o => o.category))];
    const avgROI = opportunities.length > 0 
      ? (opportunities.reduce((sum, o) => sum + o.expectedROI, 0) / opportunities.length).toFixed(1)
      : 0;
    const minInvestmentRange = opportunities.length > 0
      ? Math.min(...opportunities.map(o => o.minInvestment))
      : 0;

    // Format opportunities for the AI
    const opportunitiesText = opportunities.length > 0
      ? `\n\nCurrent Available Investment Opportunities:\n${opportunities.map((opp, idx) => 
          `${idx + 1}. ${opp.name}
   - Category: ${opp.category}
   - Location: ${opp.location}, ${opp.area}
   - Min Investment: $${opp.minInvestment.toLocaleString()}
   - Total Value: $${opp.totalValue.toLocaleString()}
   - Expected ROI: ${opp.expectedROI}%
   - Duration: ${opp.duration}
   - Risk Level: ${opp.riskLevel}
   - Status: ${opp.status}
   - Available: ${opp.availableShares}%
   - Description: ${opp.description}`
        ).join('\n\n')}`
      : '\n\nNo active investment opportunities available at the moment.';

    // Platform information (non-sensitive)
    const platformInfo = `

Platform Statistics:
- Total Active Opportunities: ${totalOpportunities}
- Categories Available: ${categoriesAvailable.join(', ')}
- Average Expected ROI: ${avgROI}%
- Minimum Investment Starting From: $${minInvestmentRange.toLocaleString()}

Investment Process:
1. Browse available investment opportunities
2. Submit investment application with required details
3. Admin reviews application (typically 1-3 business days)
4. Upon approval, complete payment using your chosen method
5. Track your investment in your portfolio

Investment Types:
- One-time: Single lump sum investment
- Recurring: Regular monthly/quarterly investments

Payment Methods Accepted:
- Bank Transfer
- Wire Transfer
- Check
- Cryptocurrency

Risk Levels Explained:
- Low Risk: Stable returns, lower volatility, established markets
- Medium Risk: Balanced risk-reward, moderate growth potential
- High Risk: Higher potential returns, greater market volatility

Application Status Types:
- Pending: Under review by admin team
- Approved: Application accepted, ready for payment
- Rejected: Application not approved (reasons provided)

Investment Status Types:
- Active: Currently invested and generating returns
- Matured: Investment period completed
- Withdrawn: Investment withdrawn by investor

Premium Features:
- Advanced analytics and performance tracking
- Priority application review
- Exclusive investment opportunities
- Personalized investment recommendations
- Dedicated account manager

Account Management:
- Update personal information in Settings
- Change password anytime
- View complete investment history
- Download transaction reports
- Manage notification preferences`;

    // Google Gemini Implementation
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `You are a helpful assistant for Ssaye, an investment platform. You help users with:
- Investment opportunities (Real Estate, Smart Cities, Urban Agriculture)
- Application process and status tracking
- Portfolio management and analytics
- Account settings and premium features
- General investment questions

When users ask about investment opportunities, reference the specific opportunities available from our database.
When discussing investment amounts, always use proper currency formatting.
If users ask about their personal data, applications, or portfolio, politely inform them they need to log in to their account to view that information.
Never make up or assume personal user information.
Be professional, friendly, and concise. Always prioritize user security and privacy.${opportunitiesText}${platformInfo}`;

    const conversationHistory = history
      .filter(msg => msg.role !== 'system')
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const prompt = conversationHistory 
      ? `${systemPrompt}\n\n${conversationHistory}\nUser: ${message}\nAssistant:`
      : `${systemPrompt}\n\nUser: ${message}\nAssistant:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    console.error('Error details:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
