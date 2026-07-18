import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './VendorAuth.css';

const API_URL = process.env.REACT_APP_API_URL || '';

export default function VendorLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_URL}/api/vendor/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(formData),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Login failed');
        return;
      }
      localStorage.setItem('vendor_token',  data.token);
      localStorage.setItem('vendor_info',   JSON.stringify(data.vendor));
      navigate('/vendor/dashboard');
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vauth-container">
      <div className="vauth-card">
        <div className="vauth-logo">🏪</div>
        <h1 className="vauth-title">Vendor Portal</h1>
        <p className="vauth-subtitle">Sign in to manage your store</p>

        {error && <div className="vauth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="vauth-form">
          <div className="vauth-field">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@business.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="vauth-field">
            <label htmlFor="password">Password</label>
            <div className="vauth-pw-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
              <button type="button" className="vauth-pw-toggle" onClick={() => setShowPw(!showPw)} aria-label="Toggle password">
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="vauth-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="vauth-footer">
          <p><Link to="/login" className="vauth-link vauth-link--muted">← Back to customer login</Link></p>
        </div>
      </div>
    </div>
  );
}
