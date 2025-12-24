import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Footer Top Section */}
        <div className="footer-top footer-three-col">
          <div className="footer-column footer-column-wide">
            <h3 className="footer-heading">SSAYE Club</h3>
            <p className="footer-description">
              Smart Living Marketplace powered by advanced technologies including Blockchain, IOT and Artificial Intelligence.
            </p>
            <div className="footer-social">
              <a 
                href="https://www.facebook.com/SSAYE-CLUB-1933812619966120/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Facebook"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://twitter.com/ssayeclub" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Twitter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h3 className="footer-heading">Navigate</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/assets">Assets</Link></li>
              <li><Link to="/smart-city">Smart City</Link></li>
              <li><Link to="/farms">Farms</Link></li>
              <li><Link to="/blog">Blog</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-heading">Contact Us</h3>
            <ul className="footer-contact">
              <li>
                <span className="contact-icon">📧</span>
                <a href="mailto:contact@ssaye.club">contact@ssaye.club</a>
              </li>
              <li>
                <span className="contact-icon">🌐</span>
                <span>www.ssaye.club</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Divider */}
        <div className="footer-divider"></div>

        {/* Footer Bottom Section */}
        <div className="footer-bottom">
          <div className="footer-copyright">
            <p>Copyright © 2025 SSAYE Club - All Rights Reserved.</p>
            <p className="footer-disclaimer">
              The logos highlighted above belong to the respective companies and SSAYE is pursuing opportunities to work together with them.
            </p>
          </div>
          <div className="footer-powered">
            <p>Powered by <strong>YESJ EXPERT</strong></p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
