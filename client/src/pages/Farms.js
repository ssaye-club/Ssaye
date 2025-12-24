import React from 'react';
import './Farms.css';
import hydroponicsImage from '../images/hydroponics.avif';
import urbanAgricultureImage from '../images/urban-agriculture.avif';
import microgreensImage from '../images/microgreens.avif';
import roboticFarmImage from '../images/Robotic-farm.jpg';

function Farms() {
  return (
    <div className="farms-page">
      {/* Hero Section */}
      <section className="farms-hero-section">
        <div className="farms-hero-content">
          <h1 className="farms-hero-title">SSAYE Farms</h1>
          <p className="farms-hero-subtitle">Innovative Agricultural Solutions for Sustainable Living</p>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="farms-intro-section">
        <div className="container">
          <div className="intro-layout">
            <div className="intro-content">
              <h2 className="section-title">Revolutionizing Urban Agriculture</h2>
              <p className="section-description">
                SSAYE Farms brings cutting-edge agricultural technology to urban environments, making fresh, 
                sustainable farming accessible to everyone. Our innovative solutions combine hydroponics, 
                vertical farming, and microgreens cultivation to create efficient, eco-friendly food production systems.
              </p>
              <p className="section-description">
                Whether you're looking to set up your own micro-farm, participate in our community farms, 
                or host memorable events surrounded by nature, SSAYE Farms offers the perfect solution for 
                modern sustainable living.
              </p>
            </div>
            <div className="intro-image">
              <img src={roboticFarmImage} alt="Robotic Farm Technology" />
            </div>
          </div>
        </div>
      </section>

      {/* Farming Solutions Section */}
      <section className="farming-solutions-section">
        <div className="container">
          <h2 className="section-title">Our Farming Solutions</h2>
          <p className="section-description">Explore our innovative agricultural technologies</p>
          
          <div className="solutions-grid">
            {/* Hydroponics */}
            <div className="solution-card">
              <div className="solution-image">
                <img src={hydroponicsImage} alt="Hydroponic Farming System" />
                <div className="solution-image-overlay"></div>
              </div>
              <div className="solution-content">
                <h3>Hydroponics Systems</h3>
                <p className="solution-tagline">Soil-Free, Water-Efficient Farming</p>
                <p className="solution-description">
                  Our advanced hydroponic systems allow plants to grow in nutrient-rich water solutions, 
                  using up to 90% less water than traditional farming. Perfect for growing fresh vegetables, 
                  herbs, and leafy greens year-round in any environment.
                </p>
                <ul className="solution-features">
                  <li>✓ 90% less water consumption</li>
                  <li>✓ Faster growth rates (up to 30%)</li>
                  <li>✓ Year-round production</li>
                  <li>✓ No soil-borne diseases</li>
                  <li>✓ Space-efficient vertical systems</li>
                  <li>✓ Automated nutrient delivery</li>
                </ul>
              </div>
            </div>

            {/* Urban Agriculture */}
            <div className="solution-card">
              <div className="solution-image">
                <img src={urbanAgricultureImage} alt="Urban Agriculture" />
                <div className="solution-image-overlay"></div>
              </div>
              <div className="solution-content">
                <h3>Urban Agriculture</h3>
                <p className="solution-tagline">Bringing Farms to the City</p>
                <p className="solution-description">
                  Transform unused urban spaces into productive green areas. Our urban agriculture solutions 
                  include rooftop gardens, vertical farms, and community growing spaces that bring fresh, 
                  local produce directly to city dwellers while improving air quality and community well-being.
                </p>
                <ul className="solution-features">
                  <li>✓ Rooftop garden installations</li>
                  <li>✓ Vertical farming systems</li>
                  <li>✓ Community garden programs</li>
                  <li>✓ Educational workshops</li>
                  <li>✓ Fresh local produce</li>
                  <li>✓ Reduced carbon footprint</li>
                </ul>
              </div>
            </div>

            {/* Microgreens */}
            <div className="solution-card">
              <div className="solution-image">
                <img src={microgreensImage} alt="Microgreens Cultivation" />
                <div className="solution-image-overlay"></div>
              </div>
              <div className="solution-content">
                <h3>Microgreens Production</h3>
                <p className="solution-tagline">Nutrient-Dense Superfoods</p>
                <p className="solution-description">
                  Grow nutrient-packed microgreens with our specialized cultivation systems. These tiny 
                  powerhouses contain up to 40 times more nutrients than their mature counterparts and 
                  can be harvested in just 7-14 days, providing a quick, profitable, and healthy farming option.
                </p>
                <ul className="solution-features">
                  <li>✓ 7-14 day harvest cycle</li>
                  <li>✓ 40x more nutrients than mature plants</li>
                  <li>✓ Minimal space required</li>
                  <li>✓ High-profit margins</li>
                  <li>✓ Easy to grow indoors</li>
                  <li>✓ Year-round production</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="farms-services-section">
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <p className="section-description">Comprehensive solutions for every farming need</p>
          
          <div className="services-grid">
            <div className="service-detail-card">
              <div className="service-number">01</div>
              <h3>Micro-Farm Setup</h3>
              <p className="service-intro">
                We help you establish your own micro-farm with complete end-to-end solutions
              </p>
              <ul className="service-features">
                <li><strong>Custom Design:</strong> Tailored systems for your space and needs</li>
                <li><strong>Equipment Installation:</strong> Professional setup of all growing systems</li>
                <li><strong>Training & Support:</strong> Comprehensive training on farm management</li>
                <li><strong>Ongoing Maintenance:</strong> Regular check-ups and technical support</li>
                <li><strong>Crop Planning:</strong> Guidance on what to grow for maximum yield</li>
                <li><strong>Market Connection:</strong> Help connecting with local markets and buyers</li>
              </ul>
            </div>

            <div className="service-detail-card">
              <div className="service-number">02</div>
              <h3>Farm Participation Program</h3>
              <p className="service-intro">
                Join our community farms and enjoy fresh produce without the full responsibility
              </p>
              <ul className="service-features">
                <li><strong>Shared Farming:</strong> Co-own sections of our community farms</li>
                <li><strong>Weekly Harvest:</strong> Regular supply of fresh organic produce</li>
                <li><strong>Learn & Grow:</strong> Hands-on farming workshops and classes</li>
                <li><strong>Community Network:</strong> Connect with like-minded individuals</li>
                <li><strong>Flexible Plans:</strong> Monthly or annual participation options</li>
                <li><strong>Farm Visits:</strong> Unlimited access to visit your farm plot</li>
              </ul>
            </div>

            <div className="service-detail-card">
              <div className="service-number">03</div>
              <h3>Events & Experiences</h3>
              <p className="service-intro">
                Host unforgettable events in our beautiful farm settings
              </p>
              <ul className="service-features">
                <li><strong>Corporate Events:</strong> Team-building and company retreats</li>
                <li><strong>Family Gatherings:</strong> Birthday parties and family reunions</li>
                <li><strong>Educational Tours:</strong> School trips and learning experiences</li>
                <li><strong>Farm-to-Table Events:</strong> Dining experiences with fresh produce</li>
                <li><strong>Workshops:</strong> Gardening, cooking, and sustainability sessions</li>
                <li><strong>Custom Packages:</strong> Tailored events for your specific needs</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="farms-benefits-section">
        <div className="container">
          <h2 className="section-title">Why Choose SSAYE Farms?</h2>
          
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon-wrapper">
                <div className="benefit-number">01</div>
              </div>
              <h3>Sustainable & Eco-Friendly</h3>
              <p>Our farming methods use minimal water, no harmful pesticides, and significantly reduce carbon emissions compared to traditional agriculture.</p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-wrapper">
                <div className="benefit-number">02</div>
              </div>
              <h3>Fresh & Nutritious</h3>
              <p>Harvest-to-table freshness ensures maximum nutrient retention. Our produce is never more than a day old when it reaches you.</p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-wrapper">
                <div className="benefit-number">03</div>
              </div>
              <h3>Year-Round Production</h3>
              <p>Controlled environment systems allow continuous growing regardless of season or weather conditions.</p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-wrapper">
                <div className="benefit-number">04</div>
              </div>
              <h3>Space Efficient</h3>
              <p>Vertical farming and hydroponic systems produce up to 10x more yield per square foot than traditional farming, making it perfect for urban environments and maximizing productivity in limited spaces.</p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-wrapper">
                <div className="benefit-number">05</div>
              </div>
              <h3>Educational & Community</h3>
              <p>Learn about sustainable agriculture and food systems through hands-on experiences while connecting with neighbors and building a strong community around sustainable living.</p>
            </div>

            <div className="benefit-item">
              <div className="benefit-icon-wrapper">
                <div className="benefit-number">06</div>
              </div>
              <h3>Advanced Robotics</h3>
              <p>Integrated robotics and IoT systems automate monitoring, optimize growing conditions, and maximize efficiency with smart sensors and AI-driven crop management.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="farms-stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">90%</div>
              <div className="stat-label">Less Water Used</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">365</div>
              <div className="stat-label">Days of Growing</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">10x</div>
              <div className="stat-label">Higher Yield</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">100%</div>
              <div className="stat-label">Pesticide Free</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="farms-cta-section">
        <div className="container">
          <h2>Ready to Start Your Farming Journey?</h2>
          <p>Join SSAYE Farms and experience the future of sustainable agriculture</p>
          <div className="cta-buttons">
            <button className="btn-primary">Setup Your Micro-Farm</button>
            <button className="btn-secondary">Join Community Farm</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Farms;
