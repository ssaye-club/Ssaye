import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Premium.css';

const Premium = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleJoinNow = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // TODO: Integrate with payment gateway (Stripe, PayPal, etc.)
    setLoading(true);
    
    // Placeholder for checkout process
    // In production, this would redirect to payment gateway
    showToast('Payment integration coming soon!', 'info');
    setLoading(false);
  };

  return (
    <div className="premium-page">
      <div className="premium-container">
        <div className="premium-header">
          <h1 className="premium-title">Unlock Premium Features</h1>
          <p className="premium-subtitle">
            Elevate your investment experience with exclusive insights and tools
          </p>
        </div>

        <div className="membership-card">
          <div className="membership-badge">PREMIUM</div>
          <h2 className="membership-name">SSAYE Club Silver Member</h2>
          <p className="membership-description">
            A unique member experience to avail the services and be part of a global smart community
          </p>

          <div className="membership-price">
            <span className="price-amount">35 USD</span>
            <span className="price-period">/month</span>
          </div>

          <div className="membership-features">
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span className="feature-text">Full marketplace access</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span className="feature-text">Priority support</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span className="feature-text">Community engagement</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✓</span>
              <span className="feature-text">Exclusive resources</span>
            </div>
          </div>

          <button 
            className="btn-join-now" 
            onClick={handleJoinNow}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Join Now'}
          </button>
        </div>

        <div className="premium-benefits-section">
          <h3 className="benefits-title">What You'll Get</h3>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">📊</div>
              <h4>Advanced Analytics</h4>
              <p>Access detailed performance charts and investment insights</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🎯</div>
              <h4>Portfolio Tracking</h4>
              <p>Real-time monitoring of your investment portfolio</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🌐</div>
              <h4>Global Network</h4>
              <p>Connect with investors and partners worldwide</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🔒</div>
              <h4>Exclusive Deals</h4>
              <p>Early access to premium investment opportunities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Premium;
