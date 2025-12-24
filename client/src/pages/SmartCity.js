import React from 'react';
import './SmartCity.css';
import smartTownshipImage from '../images/smart-township.avif';
import smartApartmentImage from '../images/smart-apartment.avif';
import blockchainImage from '../images/blockchain-tech.avif';
import aiTechnologyImage from '../images/ai-technology.avif';
import globalNetworkImage from '../images/global-network.avif';
import partnershipImage from '../images/partnership.avif';

function SmartCity() {
  return (
    <div className="smart-city-page">
      {/* Hero Section */}
      <section className="smart-city-hero-section">
        <div className="smart-city-hero-content">
          <h1 className="smart-city-hero-title">Smart City Solutions</h1>
          <p className="smart-city-hero-subtitle">Building Connected Communities for Sustainable Living</p>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="smart-city-intro-section">
        <div className="container">
          <h2 className="section-title">Advanced Ecosystem for Smart Cities</h2>
          <p className="section-description">
            SSAYE provides an advanced ecosystem for smart cities. Our participation in three pilot smart townships 
            are designed for connected living, enabling citizens to make smarter decisions, leverage local resources 
            and benefit from the best facilities in the world.
          </p>
          <p className="section-description">
            Communities can achieve financial, social, and environmental balance for a healthy life through our 
            innovative smart city solutions powered by cutting-edge technology.
          </p>
        </div>
      </section>

      {/* Smart City Projects Section */}
      <section className="projects-section">
        <div className="container">
          <h2 className="section-title">Smart City Projects</h2>
          <p className="section-description">Pioneering developments that redefine urban living</p>
          
          <div className="projects-grid">
            {/* Future Townships */}
            <div className="project-card featured">
              <div className="project-badge">FLAGSHIP PROJECT</div>
              <div className="project-image">
                <img src={smartTownshipImage} alt="Future Townships Bangalore" />
                <div className="project-image-overlay"></div>
              </div>
              <div className="project-content">
                <h3>Future Townships, Bangalore, India</h3>
                <p className="project-size">750+ Acre Development</p>
                <p className="project-description">
                  A unique 750+ acre township featuring the best facilities including smart living, solar energy, 
                  zero waste management, heli-taxi services, and high security infrastructure. The city is being 
                  planned for optimal resource utilization and a self-sustained economy, with the ability for remote participation.
                </p>
                <div className="project-features">
                  <div className="feature-item">
                    <span className="feature-icon">☀️</span>
                    <span>Solar Energy</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">♻️</span>
                    <span>Zero Waste</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🚁</span>
                    <span>Heli-Taxi</span>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🔒</span>
                    <span>High Security</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Apartment Complex */}
            <div className="project-card">
              <div className="project-image">
                <img src={smartApartmentImage} alt="Smart Apartment Complex" />
                <div className="project-image-overlay"></div>
              </div>
              <div className="project-content">
                <h3>Smart Apartment Complex & Business Center</h3>
                <p className="project-location">USA & India</p>
                <p className="project-description">
                  State-of-the-art residential complexes with work-friendly infrastructure designed for smart living. 
                  Our projects integrate modern amenities with sustainable practices to create the perfect 
                  work-life balance environment.
                </p>
                <ul className="project-highlights">
                  <li>✓ Work-from-home infrastructure</li>
                  <li>✓ Integrated business centers</li>
                  <li>✓ Smart home automation</li>
                  <li>✓ Community collaboration spaces</li>
                  <li>✓ Green building certified</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Specialty Section */}
      <section className="specialty-section">
        <div className="container">
          <h2 className="section-title">Our Specialty</h2>
          <p className="section-description">Leading-edge technology for world-class smart living</p>
          
          <div className="specialty-content">
            <div className="specialty-main">
              <p>
                A leading-edge system with blockchain, AI, and advanced resources brings a trusted, secure, smart, 
                cost-efficient, and hi-tech environment, making one of the best solutions in the world for smart living.
              </p>
              <p>
                Customers anywhere in the world can physically or digitally participate in this smart economy. 
                Our supporting partners include industry leaders committed to sustainable urban development.
              </p>
            </div>

            <div className="specialty-grid">
              <div className="specialty-card">
                <div className="specialty-image">
                  <img src={blockchainImage} alt="Blockchain Technology" />
                  <div className="specialty-image-overlay"></div>
                </div>
                <h3>Blockchain Technology</h3>
                <p>Secure, transparent transactions and smart contracts for property management</p>
              </div>
              <div className="specialty-card">
                <div className="specialty-image">
                  <img src={aiTechnologyImage} alt="AI Integration" />
                  <div className="specialty-image-overlay"></div>
                </div>
                <h3>AI Integration</h3>
                <p>Intelligent systems for energy optimization and predictive maintenance</p>
              </div>
              <div className="specialty-card">
                <div className="specialty-image">
                  <img src={globalNetworkImage} alt="Global Participation" />
                  <div className="specialty-image-overlay"></div>
                </div>
                <h3>Global Participation</h3>
                <p>Physical and digital access to smart city benefits from anywhere</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="container">
          <h2 className="section-title">What Will You Get?</h2>
          <p className="section-description">Join us to leverage experience, wisdom, and systems for a better life</p>
          
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-number">01</div>
              <h3>Plots</h3>
              <p>Premium residential and commercial plots in prime smart city locations with modern infrastructure</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-number">02</div>
              <h3>Apartments</h3>
              <p>Luxury smart apartments equipped with cutting-edge technology and sustainable features</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-number">03</div>
              <h3>Good Return on Investment</h3>
              <p>Strategic locations and future-ready infrastructure ensure excellent appreciation and ROI</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-number">04</div>
              <h3>Partner for Unique Services</h3>
              <p>Collaborate with us to provide innovative services within the smart city ecosystem</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-number">05</div>
              <h3>Smart Community</h3>
              <p>Be part of a thriving community of like-minded individuals committed to sustainable living</p>
            </div>

            <div className="benefit-card">
              <div className="benefit-number">06</div>
              <h3>Privileged Access</h3>
              <p>SSAYE Club members receive exclusive access to smart infrastructure and premium amenities</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Smart City Features</h2>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-number">01</div>
              <h3>Connected Living</h3>
              <p>IoT-enabled infrastructure for seamless connectivity and smart home integration</p>
            </div>

            <div className="feature-card">
              <div className="feature-number">02</div>
              <h3>Sustainable Energy</h3>
              <p>100% solar-powered communities with smart grid management and energy storage</p>
            </div>

            <div className="feature-card">
              <div className="feature-number">03</div>
              <h3>Zero Waste Management</h3>
              <p>Advanced waste processing and recycling systems for environmental sustainability</p>
            </div>

            <div className="feature-card">
              <div className="feature-number">04</div>
              <h3>High Security</h3>
              <p>Multi-layered security with AI surveillance, biometric access, and 24/7 monitoring</p>
            </div>

            <div className="feature-card">
              <div className="feature-number">05</div>
              <h3>Smart Transportation</h3>
              <p>Integrated mobility solutions including electric vehicles, bike-sharing, and heli-taxi</p>
            </div>

            <div className="feature-card">
              <div className="feature-number">06</div>
              <h3>Digital Participation</h3>
              <p>Remote access to community services, governance, and economic opportunities</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="smart-city-cta-section">
        <div className="container">
          <h2>Ready to Join the Smart City Revolution?</h2>
          <p>Secure your place in the future of urban living today</p>
          <div className="cta-buttons">
            <button className="btn-primary">Explore Properties</button>
            <button className="btn-secondary">Schedule Site Visit</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SmartCity;
