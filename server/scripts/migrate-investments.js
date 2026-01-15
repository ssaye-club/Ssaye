const mongoose = require('mongoose');
require('dotenv').config();
const InvestmentOpportunity = require('../models/InvestmentOpportunity');

// Existing hardcoded investment opportunities
const existingInvestments = [
  {
    name: "Luxury Waterfront Condominiums",
    category: "Multi-Family",
    location: "Miami, Florida",
    area: "45,000 sq ft",
    description: "Premium waterfront development featuring 120 luxury condominiums with ocean views, state-of-the-art amenities, and direct beach access. Located in one of Miami's most prestigious neighborhoods.",
    highlights: [
      "Ocean-view units with premium finishes",
      "Resort-style amenities including infinity pool",
      "Prime beachfront location",
      "Expected completion: Q3 2024",
      "Strong rental demand in the area"
    ],
    minInvestment: 250000,
    totalValue: 85000000,
    expectedROI: 14.5,
    duration: "36 months",
    riskLevel: "Medium",
    status: "Open",
    availableShares: 35,
    projectedCompletion: "Q3 2024",
    images: [],
    isActive: true
  },
  {
    name: "Downtown Tech Hub Office Complex",
    category: "Commercial",
    location: "Austin, Texas",
    area: "250,000 sq ft",
    description: "Class A office building in Austin's booming tech corridor. Pre-leased to major technology companies with long-term agreements. Features modern design, sustainable construction, and flexible workspace configurations.",
    highlights: [
      "Pre-leased to Fortune 500 tech companies",
      "LEED Gold certified building",
      "Prime downtown location near transit",
      "10-year lease agreements in place",
      "Built-in tenant retention program"
    ],
    minInvestment: 500000,
    totalValue: 125000000,
    expectedROI: 12.8,
    duration: "48 months",
    riskLevel: "Low",
    status: "Funding",
    availableShares: 22,
    projectedCompletion: "Q1 2025",
    images: [],
    isActive: true
  },
  {
    name: "Urban Mixed-Use Development",
    category: "Mixed-Use",
    location: "Denver, Colorado",
    area: "180,000 sq ft",
    description: "Innovative mixed-use project combining retail, office space, and residential units in Denver's revitalized downtown district. Features sustainable design and community-focused amenities.",
    highlights: [
      "Mix of retail, office, and residential spaces",
      "Located in rapidly developing neighborhood",
      "Sustainable design with solar panels",
      "Underground parking for 400 vehicles",
      "Walkable urban lifestyle destination"
    ],
    minInvestment: 350000,
    totalValue: 95000000,
    expectedROI: 15.2,
    duration: "42 months",
    riskLevel: "Medium",
    status: "Open",
    availableShares: 48,
    projectedCompletion: "Q4 2024",
    images: [],
    isActive: true
  },
  {
    name: "Suburban Apartment Community",
    category: "Multi-Family",
    location: "Charlotte, North Carolina",
    area: "35,000 sq ft",
    description: "Modern apartment community featuring 200 units with resort-style amenities in a high-growth suburban market. Pet-friendly with excellent schools nearby.",
    highlights: [
      "200 modern apartment units",
      "Resort-style pool and fitness center",
      "Pet-friendly community with dog park",
      "Near top-rated schools",
      "Strong rental market fundamentals"
    ],
    minInvestment: 200000,
    totalValue: 62000000,
    expectedROI: 13.5,
    duration: "36 months",
    riskLevel: "Low",
    status: "Open",
    availableShares: 60,
    projectedCompletion: "Q2 2024",
    images: [],
    isActive: true
  },
  {
    name: "Medical Office Plaza",
    category: "Commercial",
    location: "Phoenix, Arizona",
    area: "75,000 sq ft",
    description: "Purpose-built medical office building adjacent to major hospital campus. Designed specifically for healthcare providers with specialized infrastructure and ample parking.",
    highlights: [
      "Adjacent to regional hospital",
      "Built for medical use with specialized systems",
      "Pre-leased to healthcare providers",
      "Ample parking and easy access",
      "Growing healthcare market"
    ],
    minInvestment: 300000,
    totalValue: 48000000,
    expectedROI: 11.5,
    duration: "30 months",
    riskLevel: "Low",
    status: "Funding",
    availableShares: 28,
    projectedCompletion: "Q1 2024",
    images: [],
    isActive: true
  },
  {
    name: "Retail Shopping Center Renovation",
    category: "Commercial",
    location: "San Diego, California",
    area: "120,000 sq ft",
    description: "Major renovation of established shopping center in high-traffic area. Modernization includes updated facades, improved parking, and new tenant mix strategy.",
    highlights: [
      "High-traffic established location",
      "Complete modernization and renovation",
      "Attracting premium retail tenants",
      "Improved parking and accessibility",
      "Strong local demographics"
    ],
    minInvestment: 275000,
    totalValue: 72000000,
    expectedROI: 13.8,
    duration: "40 months",
    riskLevel: "Medium",
    status: "Open",
    availableShares: 42,
    projectedCompletion: "Q3 2024",
    images: [],
    isActive: true
  }
];

async function migrateInvestments() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ssaye';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if opportunities already exist
    const count = await InvestmentOpportunity.countDocuments();
    
    if (count > 0) {
      console.log(`Database already has ${count} investment opportunities.`);
      console.log('Skipping migration to avoid duplicates.');
      process.exit(0);
    }

    // Insert the investment opportunities
    const result = await InvestmentOpportunity.insertMany(existingInvestments);
    console.log(`Successfully migrated ${result.length} investment opportunities to database!`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run the migration
migrateInvestments();
