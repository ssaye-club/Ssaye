import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import techCity from '../images/tech-city.avif';
import './Home.css';

function Home() {
  const { isAuthenticated } = useContext(AuthContext);
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubscribe = (e) => {
    e.preventDefault();
    // Handle subscription logic here
    console.log('Subscribed with email:', email);
    showToast('Thank you for subscribing!', 'success');
    setEmail('');
  };

  const handleContactChange = (e) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Handle contact form submission here
    console.log('Contact form submitted:', contactForm);
    
    // Create mailto link with pre-filled content
    const mailtoLink = `mailto:contact@ssaye.club?subject=${encodeURIComponent(contactForm.subject)}&body=${encodeURIComponent(
      `Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\nMessage:\n${contactForm.message}`
    )}`;
    window.location.href = mailtoLink;
    
    // Reset form
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  const scrollToContact = () => {
    const contactSection = document.getElementById('contact-section');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">SMART LIVING MARKETPLACE</h1>
          <p className="hero-subtitle">Empowering communities for sustainable and smart living</p>
          <p className="hero-intro">SSAYE Club provides an advanced digital marketplace for individuals, communities, suppliers and developers to make smart decisions on assets and energy, secured transactions and adopt sustainable practices in the interest of smart economy.</p>
          <div className="hero-buttons">
            {isAuthenticated() ? (
              <Link to="/portfolio" className="btn-hero-primary">My Portfolio</Link>
            ) : (
              <Link to="/signup" className="btn-hero-primary">Get Started</Link>
            )}
            <button className="btn-hero-secondary" onClick={scrollToContact}>Contact Us</button>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="value-proposition">
        <div className="container">
          <h2 className="section-title">SSAYE Value Proposition</h2>
          <div className="value-layout">
            <div className="value-content">
              <p>
                SSAYE Club provides an advanced marketplace for people to make smart decisions, secured transactions and adopt sustainable practices in the interest of smart economy. Products and service offering include:
              </p>
              <ul className="value-bullets">
                <li><strong>Asset Management:</strong> Advanced solutions for smart investments and portfolio management</li>
                <li><strong>Energy Sustainability:</strong> Innovative approaches to renewable energy and sustainable living</li>
                <li><strong>Social Engagement:</strong> Community projects and initiatives for collective growth and development</li>
              </ul>
              <p>
                SSAYE is powered with advanced technologies including Blockchain, IOT and Artificial Intelligence, and global dynamic resources thus enabling a centralized platform for trusted, secured and economical living.
              </p>
            </div>
            <div className="value-video">
              <h3 className="video-title">Watch Our Story</h3>
              <div className="video-container">
                <iframe
                  src="https://www.youtube.com/embed/LV6jbm1ZxnE"
                  title="SSAYE Introduction Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="video-iframe"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services-section">
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <p className="section-description">Comprehensive solutions for smart and sustainable living</p>
          <div className="services-grid">
            <Link to="/assets" className="service-card">
              <div className="service-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
              <h3>SSAYE Assets</h3>
              <p>Advanced asset management solutions for smart investments</p>
              <div className="service-learn-more">
                <span className="learn-more-text">Learn More</span>
                <div className="service-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                  </svg>
                </div>
              </div>
            </Link>
            <Link to="/smart-city" className="service-card">
              <div className="service-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18"/>
                  <path d="M9 8h1"/>
                  <path d="M9 12h1"/>
                  <path d="M9 16h1"/>
                  <path d="M14 8h1"/>
                  <path d="M14 12h1"/>
                  <path d="M14 16h1"/>
                  <path d="M5 21V7l8-4v18"/>
                  <path d="M19 21V9l-6-2"/>
                </svg>
              </div>
              <h3>SSAYE Smart City</h3>
              <p>Building sustainable and intelligent urban communities</p>
              <div className="service-learn-more">
                <span className="learn-more-text">Learn More</span>
                <div className="service-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                  </svg>
                </div>
              </div>
            </Link>
            <Link to="/farms" className="service-card">
              <div className="service-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 22h20"/>
                  <path d="M3.77 10.77 2 9l2-4.5 1.77 1.77"/>
                  <path d="M5.77 8.77 4 7l2-4.5 1.77 1.77"/>
                  <path d="M7.77 6.77 6 5l2-4.5 1.77 1.77"/>
                  <path d="M9.77 4.77 8 3l2-4.5 1.77 1.77"/>
                  <path d="M11.77 2.77 10 1l2-4.5 1.77 1.77"/>
                  <path d="m16 16 3 3"/>
                  <path d="M16 16v6"/>
                  <path d="M19 19v3"/>
                  <circle cx="16" cy="9" r="3"/>
                </svg>
              </div>
              <h3>SSAYE Farms</h3>
              <p>Innovative agricultural and farming solutions</p>
              <div className="service-learn-more">
                <span className="learn-more-text">Learn More</span>
                <div className="service-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                  </svg>
                </div>
              </div>
            </Link>
            <Link to="/blog" className="service-card">
              <div className="service-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
                  <path d="M18 14h-8"/>
                  <path d="M15 18h-5"/>
                  <path d="M10 6h8v4h-8V6Z"/>
                </svg>
              </div>
              <h3>SSAYE Blog</h3>
              <p>Latest insights, news, and community updates</p>
              <div className="service-learn-more">
                <span className="learn-more-text">Learn More</span>
                <div className="service-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="container">
          <h2 className="section-title">Know Us Better</h2>
          <p className="section-subtitle">Everyday we work hard to make life of our clients better and happier</p>
          
          <div className="about-grid">
            <div className="about-card">
              <div className="about-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <h3>Our Members</h3>
              <p>Communities, individuals and companies having interest to contribute or benefit in the smart & sustainable economy anywhere in the world</p>
            </div>
            <div className="about-card">
              <div className="about-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                  <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
                </svg>
              </div>
              <h3>How we got started</h3>
              <p>Looking at the challenges in the complex society, and with the expertise of digital world & smart city, passionate individuals got together to make a better place</p>
            </div>
            <div className="about-card">
              <div className="about-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </div>
              <h3>What we do</h3>
              <p>Our marketplace enables people to make smarter decisions, engage, collaborate, make a safe, affordable and sustainable living ecosystem for the new economy</p>
            </div>
          </div>
        </div>
      </section>

      {/* Membership Section */}
      <section className="membership-section">
        <div className="container">
          <h2 className="section-title">MEMBERSHIP</h2>
          <p className="section-description">Choose the plan that's right for you</p>
          
          <div className="membership-grid">
            <div className="membership-card premium">
              <div className="membership-badge">POPULAR</div>
              <h3>SSAYE Club Silver Member</h3>
              <p>A unique member experience to avail the services and be part of a global smart community</p>
              <div className="price">
                <span className="amount">35 USD</span>
                <span className="period">/month</span>
              </div>
              <ul className="membership-features">
                <li>✓ Full marketplace access</li>
                <li>✓ Priority support</li>
                <li>✓ Community engagement</li>
                <li>✓ Exclusive resources</li>
              </ul>
              <Link to="/premium" className="btn-primary">Join Now</Link>
            </div>

            <div className="membership-card free">
              <h3>FREE Member</h3>
              <p>We want to provide the opportunity to every person on this earth to be part of our club.</p>
              <p>You can avail limited transaction on the marketplace.</p>
              <ul className="membership-features">
                <li>✓ Basic marketplace access</li>
                <li>✓ Community participation</li>
                <li>✓ Newsletter updates</li>
                <li>✓ Event notifications</li>
              </ul>
              <p className="benefits">Sign up to participate in our communities, hear about the opportunities, events, specials and create your own community! SSAYE gives its members the opportunity to use our advanced resources to enhance their standard of living.</p>
              <Link to={isAuthenticated() ? "/portfolio" : "/signup"} className="btn-secondary">Sign Up Free</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="newsletter-section">
        <div className="container">
          <h2>Stay Updated</h2>
          <p>Subscribe to our newsletter for latest updates and opportunities</p>
          <form onSubmit={handleSubscribe} className="newsletter-form">
            <input 
              type="email" 
              placeholder="Your Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="newsletter-input"
            />
            <button type="submit" className="btn-primary">Subscribe</button>
          </form>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section" id="contact-section">
        <div className="container">
          <h2 className="contact-section-title">Get In Touch</h2>
          <p className="contact-description">Have questions or want to learn more? We'd love to hear from you!</p>
          
          <form onSubmit={handleContactSubmit} className="contact-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  value={contactForm.name}
                  onChange={handleContactChange}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="john@example.com"
                  value={contactForm.email}
                  onChange={handleContactChange}
                  required
                  className="form-input"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                placeholder="How can we help you?"
                value={contactForm.subject}
                onChange={handleContactChange}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                placeholder="Tell us more about your inquiry..."
                value={contactForm.message}
                onChange={handleContactChange}
                required
                className="form-textarea"
                rows="6"
              ></textarea>
            </div>
            
            <button type="submit" className="btn-submit">
              <svg className="send-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
              Send Message
            </button>
          </form>

          <div className="contact-info">
            <p className="contact-info-text">Or reach us directly at:</p>
            <a href="mailto:contact@ssaye.club" className="contact-email-link">
              <svg className="email-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              contact@ssaye.club
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
