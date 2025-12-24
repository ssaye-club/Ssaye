import React from 'react';
import './Assets.css';
import digitalAssetImage from '../images/crypto.webp';
import residentialImage from '../images/residential-real-estate.avif';
import commercialImage from '../images/commercial-real-estate.avif';
import alternativeImage from '../images/alternative-assets.avif';
import socialImage from '../images/social-assets.avif';

function Assets() {
  return (
    <div className="assets-page">
      {/* Hero Section */}
      <section className="assets-hero-section">
        <div className="assets-hero-content">
          <h1 className="assets-hero-title">Asset Management Solutions</h1>
          <p className="assets-hero-subtitle">Buy, Sell, and Manage Your Assets with Confidence</p>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="assets-intro-section">
        <div className="container">
          <h2 className="section-title">Comprehensive Asset Portfolio Management</h2>
          <p className="section-description">
            SSAYE Club offers a complete ecosystem for managing diverse asset portfolios. From digital assets to real estate, 
            we provide expert guidance and cutting-edge tools to help you maximize returns and minimize risks across all asset classes.
          </p>
        </div>
      </section>

      {/* Asset Categories Section */}
      <section className="asset-categories-section">
        <div className="container">
          <h2 className="section-title">Asset Categories</h2>
          <p className="section-description">Explore our diverse range of asset management services</p>
          
          <div className="asset-categories-grid">
            {/* Digital Assets */}
            <div className="asset-category-card">
              <div className="asset-category-image">
                <img src={digitalAssetImage} alt="Digital Assets - Cryptocurrency and Blockchain" />
                <div className="asset-category-overlay">
                  <span className="asset-category-label">Digital Assets</span>
                </div>
              </div>
              <div className="asset-category-content">
                <h3>Digital Assets</h3>
                <p>Cryptocurrency, NFTs, and blockchain-based tokens. Navigate the digital economy with secure storage, trading strategies, and portfolio diversification.</p>
                <ul className="asset-features">
                  <li>✓ Cryptocurrency Management</li>
                  <li>✓ NFT Portfolio Tracking</li>
                  <li>✓ Blockchain Integration</li>
                  <li>✓ Secure Digital Wallets</li>
                </ul>
              </div>
            </div>

            {/* Real Estate - Residential */}
            <div className="asset-category-card">
              <div className="asset-category-image">
                <img src={residentialImage} alt="Residential Real Estate" />
                <div className="asset-category-overlay">
                  <span className="asset-category-label">Residential</span>
                </div>
              </div>
              <div className="asset-category-content">
                <h3>Residential Real Estate</h3>
                <p>Single-family homes, condos, and multi-family properties. Build wealth through strategic residential property investments with expert market analysis.</p>
                <ul className="asset-features">
                  <li>✓ Property Acquisition</li>
                  <li>✓ Rental Management</li>
                  <li>✓ Market Analysis</li>
                  <li>✓ Property Valuation</li>
                </ul>
              </div>
            </div>

            {/* Real Estate - Commercial */}
            <div className="asset-category-card">
              <div className="asset-category-image">
                <img src={commercialImage} alt="Commercial Real Estate" />
                <div className="asset-category-overlay">
                  <span className="asset-category-label">Commercial</span>
                </div>
              </div>
              <div className="asset-category-content">
                <h3>Commercial Real Estate</h3>
                <p>Office buildings, retail spaces, and industrial properties. Maximize returns with professional commercial property management and investment strategies.</p>
                <ul className="asset-features">
                  <li>✓ Commercial Leasing</li>
                  <li>✓ Tenant Management</li>
                  <li>✓ ROI Optimization</li>
                  <li>✓ Portfolio Expansion</li>
                </ul>
              </div>
            </div>

            {/* Alternative Assets */}
            <div className="asset-category-card">
              <div className="asset-category-image">
                <img src={alternativeImage} alt="Alternative Assets - Art and Collectibles" />
                <div className="asset-category-overlay">
                  <span className="asset-category-label">Alternative</span>
                </div>
              </div>
              <div className="asset-category-content">
                <h3>Alternative Assets</h3>
                <p>Art, collectibles, commodities, and precious metals. Diversify your portfolio with unique assets that provide stability and growth potential.</p>
                <ul className="asset-features">
                  <li>✓ Art & Collectibles</li>
                  <li>✓ Precious Metals</li>
                  <li>✓ Commodity Trading</li>
                  <li>✓ Authentication Services</li>
                </ul>
              </div>
            </div>

            {/* Social Assets */}
            <div className="asset-category-card">
              <div className="asset-category-image">
                <img src={socialImage} alt="Social Assets - Community Investments" />
                <div className="asset-category-overlay">
                  <span className="asset-category-label">Social</span>
                </div>
              </div>
              <div className="asset-category-content">
                <h3>Social Assets</h3>
                <p>Community projects, social enterprises, and impact investments. Create positive change while building sustainable financial returns.</p>
                <ul className="asset-features">
                  <li>✓ Impact Investing</li>
                  <li>✓ Community Projects</li>
                  <li>✓ ESG Compliance</li>
                  <li>✓ Social ROI Tracking</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-detail-section">
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <p className="section-description">Comprehensive solutions for every stage of your asset journey</p>
          
          <div className="services-detail-grid">
            <div className="service-detail-card">
              <div className="service-detail-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
              </div>
              <h3>Buy Assets</h3>
              <p>Access exclusive investment opportunities across all asset classes. Our expert team provides thorough due diligence, market analysis, and negotiation support to ensure you make informed purchasing decisions.</p>
              <ul className="service-detail-features">
                <li>Market Research & Analysis</li>
                <li>Property Inspections</li>
                <li>Negotiation Support</li>
                <li>Legal Documentation</li>
                <li>Transaction Management</li>
              </ul>
            </div>

            <div className="service-detail-card">
              <div className="service-detail-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <h3>Sell Assets</h3>
              <p>Maximize your returns with our professional asset selling services. We leverage advanced marketing strategies, extensive networks, and market insights to connect you with qualified buyers.</p>
              <ul className="service-detail-features">
                <li>Professional Valuation</li>
                <li>Marketing & Promotion</li>
                <li>Buyer Qualification</li>
                <li>Price Optimization</li>
                <li>Closing Assistance</li>
              </ul>
            </div>

            <div className="service-detail-card">
              <div className="service-detail-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <h3>Manage Assets</h3>
              <p>Comprehensive asset management services to optimize performance and protect your investments. From day-to-day operations to long-term strategy, we handle it all.</p>
              <ul className="service-detail-features">
                <li>Portfolio Monitoring</li>
                <li>Performance Analytics</li>
                <li>Risk Management</li>
                <li>Maintenance Coordination</li>
                <li>Financial Reporting</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="container">
          <h2 className="section-title">Why Choose SSAYE Asset Management?</h2>
          <p className="section-description">Experience the advantages of working with industry-leading professionals</p>
          
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h3>Secure & Transparent</h3>
              <p>Blockchain-powered security and complete transparency in all transactions. Track every aspect of your portfolio in real-time with our advanced platform.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                  <circle cx="9" cy="14" r="1"/>
                  <circle cx="15" cy="14" r="1"/>
                </svg>
              </div>
              <h3>AI-Powered Insights</h3>
              <p>Leverage artificial intelligence for predictive analytics, market trends, and automated portfolio optimization to stay ahead of the market.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
              <h3>Global Reach</h3>
              <p>Access international markets and investment opportunities worldwide. Our global network connects you with assets and investors across continents.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3>Expert Guidance</h3>
              <p>Work with certified asset managers and financial advisors who provide personalized strategies tailored to your goals and risk tolerance.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                  <polyline points="2 17 12 22 22 17"/>
                  <polyline points="2 12 12 17 22 12"/>
                </svg>
              </div>
              <h3>Diversification</h3>
              <p>Build a balanced portfolio across multiple asset classes to minimize risk and maximize returns with our centralized platform.</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
              </div>
              <h3>24/7 Access</h3>
              <p>Monitor and manage your assets anytime, anywhere with our mobile-friendly platform and dedicated customer support team.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="assets-cta-section">
        <div className="container">
          <h2>Ready to Build Your Asset Portfolio?</h2>
          <p>Join thousands of successful investors who trust SSAYE for their asset management needs</p>
          <div className="cta-buttons">
            <button className="btn-primary">Get Started Today</button>
            <button className="btn-secondary">Schedule Consultation</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Assets;
