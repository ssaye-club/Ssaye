import React from 'react';
import { Helmet } from 'react-helmet-async';
import './Farms.css';
import hydroponicsImage from '../images/hydroponics.avif';
import urbanAgricultureImage from '../images/urban-agriculture.avif';
import microgreensImage from '../images/microgreens.avif';
import roboticFarmImage from '../images/Robotic-farm.jpg';

function Farms() {
  return (
    <div className="farms-page">
      <Helmet>
        <title>Ssaye Farms — Sustainable & Urban Agriculture</title>
        <meta name="description" content="Ssaye Farms delivers fresh hydroponics, microgreens and urban farm produce. Innovative agricultural solutions for sustainable, healthy living." />
        <meta property="og:title" content="Ssaye Farms — Sustainable & Urban Agriculture" />
        <meta property="og:description" content="Fresh hydroponics, microgreens and urban farm produce from Ssaye Farms. Sustainable agricultural solutions for modern living." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://ssaye.club/farms" />
      </Helmet>

      {/* Hero */}
      <section className="farms-hero">
        <div className="farms-hero-inner">
          <div className="farms-hero-text">
            <div className="farms-hero-eyebrow">
              <span className="farms-leaf-icon">🌿</span> SSAYE FARMS
              <span className="farms-hero-tagline-small">Growing a Greener Tomorrow</span>
            </div>
            <h1 className="farms-hero-title">
              FROM URBAN SPACES<br />
              TO A <span className="farms-hero-accent">GREENER FUTURE</span>
            </h1>
            <p className="farms-hero-desc">
              SSAYE Farms is redefining how cities grow. Through innovative technology
              and sustainable practices, we bring fresh, healthy, and local produce closer to you.
            </p>
            <div className="farms-hero-pillars">
              <div className="farms-pillar"><span>💧</span><span>Use Less<br/>Water</span></div>
              <div className="farms-pillar"><span>🥗</span><span>Eat Better<br/>Live Healthier</span></div>
              <div className="farms-pillar"><span>🌍</span><span>Reduce<br/>Carbon</span></div>
              <div className="farms-pillar"><span>🤝</span><span>Build Stronger<br/>Communities</span></div>
            </div>
          </div>
          <div className="farms-hero-image-wrap">
            <img src={roboticFarmImage} alt="Ssaye urban farm" className="farms-hero-img" />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="farms-stats-bar">
        <div className="farms-stat-item">
          <span className="farms-stat-num">90%</span>
          <span className="farms-stat-label">Less Water Used</span>
        </div>
        <div className="farms-stat-divider" />
        <div className="farms-stat-item">
          <span className="farms-stat-num">365</span>
          <span className="farms-stat-label">Days of Growing</span>
        </div>
        <div className="farms-stat-divider" />
        <div className="farms-stat-item">
          <span className="farms-stat-num">10x</span>
          <span className="farms-stat-label">Higher Yield</span>
        </div>
        <div className="farms-stat-divider" />
        <div className="farms-stat-item">
          <span className="farms-stat-num">100%</span>
          <span className="farms-stat-label">Pesticide Free</span>
        </div>
      </section>

      {/* Tagline band */}
      <div className="farms-tagline-band">
        <span className="farms-script">Small Farms.</span>
        <span className="farms-script">Big Difference.</span>
        <span className="farms-leaf-deco">🌱</span>
      </div>

      {/* Farming Solutions */}
      <section className="farms-solutions">
        <div className="farms-container">
          <div className="farms-section-header">
            <h2 className="farms-section-title">Our Farming Solutions</h2>
            <span className="farms-section-arrow">←</span>
          </div>

          <div className="farms-solutions-grid">
            <div className="farms-solution-card">
              <div className="farms-solution-img-wrap">
                <img src={hydroponicsImage} alt="Hydroponic Farming" />
                <div className="farms-solution-label">
                  <span className="farms-solution-icon">🌿</span>
                  <span>HYDROPONIC SYSTEMS</span>
                </div>
              </div>
              <div className="farms-solution-body">
                <p className="farms-solution-tagline">Soil-free. Water-efficient.<br/>Grow more with less. All year round.</p>
                <ul className="farms-check-list">
                  <li>90% less water</li>
                  <li>Faster growth (up to 30%)</li>
                  <li>No soil-borne diseases</li>
                  <li>Automated nutrient delivery</li>
                  <li>Space-efficient systems</li>
                </ul>
              </div>
            </div>

            <div className="farms-solution-card">
              <div className="farms-solution-img-wrap">
                <img src={urbanAgricultureImage} alt="Urban Agriculture" />
                <div className="farms-solution-label">
                  <span className="farms-solution-icon">🏙️</span>
                  <span>URBAN AGRICULTURE</span>
                </div>
              </div>
              <div className="farms-solution-body">
                <p className="farms-solution-tagline">Turning rooftops and city spaces into productive green zones.</p>
                <ul className="farms-check-list">
                  <li>Rooftop & vertical farms</li>
                  <li>Community gardens</li>
                  <li>Fresh local produce</li>
                  <li>Workshops & education</li>
                  <li>Greener cities, healthier lives</li>
                </ul>
              </div>
            </div>

            <div className="farms-solution-card">
              <div className="farms-solution-img-wrap">
                <img src={microgreensImage} alt="Microgreens Cultivation" />
                <div className="farms-solution-label">
                  <span className="farms-solution-icon">🌱</span>
                  <span>MICROGREENS CULTIVATION</span>
                </div>
              </div>
              <div className="farms-solution-body">
                <p className="farms-solution-tagline">Tiny greens.<br/>Massive nutrition.<br/>Big impact.</p>
                <ul className="farms-check-list">
                  <li>7–14 day harvest cycle</li>
                  <li>40x more nutrients</li>
                  <li>Minimal space required</li>
                  <li>High-profit potential</li>
                  <li>Easy to grow indoors</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="farms-services">
        <div className="farms-container">
          <div className="farms-section-header">
            <h2 className="farms-section-title">Our Services</h2>
            <span className="farms-leaf-deco">🌿</span>
          </div>

          <div className="farms-services-grid">
            <div className="farms-service-card">
              <div className="farms-service-num">01</div>
              <h3>Micro-Farm Setup</h3>
              <ul className="farms-check-list">
                <li>Custom design for your space</li>
                <li>Professional installation</li>
                <li>Training & ongoing support</li>
                <li>Crop planning & guidance</li>
                <li>Market connection</li>
              </ul>
            </div>

            <div className="farms-service-card">
              <div className="farms-service-num">02</div>
              <h3>Farm Participation Program</h3>
              <ul className="farms-check-list">
                <li>Join our community farms</li>
                <li>Weekly fresh harvest</li>
                <li>Learn & grow with experts</li>
                <li>Flexible monthly or annual plans</li>
                <li>Unlimited farm visits</li>
              </ul>
            </div>

            <div className="farms-service-card">
              <div className="farms-service-num">03</div>
              <h3>Events & Experiences</h3>
              <ul className="farms-check-list">
                <li>Corporate events & retreats</li>
                <li>Family gatherings & parties</li>
                <li>Educational tours & workshops</li>
                <li>Farm-to-table experiences</li>
                <li>Custom packages available</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="farms-differentiators">
        <div className="farms-container">
          <h2 className="farms-diff-heading">WHAT MAKES US DIFFERENT</h2>
          <div className="farms-diff-grid">
            <div className="farms-diff-item">
              <div className="farms-diff-icon">♻️</div>
              <h4>Sustainable &amp; Eco-Friendly</h4>
              <p>Low water usage, no harmful chemicals, better for our planet.</p>
            </div>
            <div className="farms-diff-item">
              <div className="farms-diff-icon">📡</div>
              <h4>Advanced Technology</h4>
              <p>Smart systems, IoT monitoring &amp; data-driven growth.</p>
            </div>
            <div className="farms-diff-item">
              <div className="farms-diff-icon">🥦</div>
              <h4>Fresh &amp; Nutritious</h4>
              <p>Harvest-to-table freshness. Packed with nutrients.</p>
            </div>
            <div className="farms-diff-item">
              <div className="farms-diff-icon">🤝</div>
              <h4>Community Focused</h4>
              <p>Empowering people to grow together and thrive.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="farms-cta">
        <div className="farms-cta-left">
          <p className="farms-cta-script">Real Food.<br/>Real Change.<br/>Real Future.</p>
        </div>
        <div className="farms-cta-center">
          <h2 className="farms-cta-headline">EAT BETTER.<br/>LIVE BETTER.<br/><span className="farms-cta-accent">Grow Better.</span></h2>
        </div>
        <div className="farms-cta-right">
          <p className="farms-cta-subhead">LET'S GROW TOGETHER!</p>
          <p className="farms-cta-contact">🌐 www.ssaye.club</p>
          <p className="farms-cta-contact">✉️ contact@ssaye.club</p>
          <div className="farms-cta-buttons">
            <button className="farms-btn-primary">Setup Your Micro-Farm</button>
            <button className="farms-btn-secondary">Join Community Farm</button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Farms;
