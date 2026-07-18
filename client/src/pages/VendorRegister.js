import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './VendorAuth.css';

const API_URL = process.env.REACT_APP_API_URL || '';

export default function VendorRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite') || '';

  const [inviteStatus, setInviteStatus] = useState('verifying'); // 'verifying' | 'valid' | 'invalid'
  const [formData, setFormData] = useState({
    fullName: '', businessName: '', businessId: '',
    email: '', phone: '', password: '', confirmPassword: '',
  });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);

  useEffect(() => {
    if (!inviteToken) { setInviteStatus('invalid'); return; }
    fetch(`${API_URL}/api/vendor/auth/invite/verify?token=${encodeURIComponent(inviteToken)}`)
      .then(r => r.json())
      .then(data => setInviteStatus(data.valid ? 'valid' : 'invalid'))
      .catch(() => setInviteStatus('invalid'));
  }, [inviteToken]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_URL}/api/vendor/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          inviteToken,
          fullName:     formData.fullName,
          businessName: formData.businessName,
          businessId:   formData.businessId,
          email:        formData.email,
          phone:        formData.phone,
          password:     formData.password,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        const msg = data.errors ? data.errors[0].msg : (data.message || 'Registration failed');
        setError(msg);
        return;
      }
      setSuccess(true);
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (inviteStatus === 'verifying') {
    return (
      <div className="vauth-container">
        <div className="vauth-card vauth-card--success">
          <div className="vauth-logo">⏳</div>
          <h1 className="vauth-title">Verifying Invite…</h1>
          <p className="vauth-success-msg">Please wait while we validate your invite link.</p>
        </div>
      </div>
    );
  }

  if (inviteStatus === 'invalid') {
    return (
      <div className="vauth-container">
        <div className="vauth-card vauth-card--success">
          <div className="vauth-logo">🔒</div>
          <h1 className="vauth-title">Invite Only</h1>
          <p className="vauth-success-msg">
            Vendor registration is by invitation only. Please contact a Ssaye administrator to receive a registration link.
          </p>
          <Link to="/vendor/login" className="vauth-btn vauth-btn--link">← Back to Vendor Login</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="vauth-container">
        <div className="vauth-card vauth-card--success">
          <div className="vauth-logo">✅</div>
          <h1 className="vauth-title">Registration Submitted!</h1>
          <p className="vauth-success-msg">
            Your vendor account is under review. A super admin will approve your
            registration shortly. You will be able to log in once approved.
          </p>
          <Link to="/vendor/login" className="vauth-btn vauth-btn--link">Go to Vendor Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="vauth-container">
      <div className="vauth-card vauth-card--register">
        <div className="vauth-logo">🏪</div>
        <h1 className="vauth-title">Register as a Vendor</h1>
        <p className="vauth-subtitle">Join the Ssaye marketplace as a supplier</p>

        {error && <div className="vauth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="vauth-form">
          <div className="vauth-section-label">Personal Details</div>

          <div className="vauth-field">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Your full legal name"
              required
            />
          </div>

          <div className="vauth-section-label">Business Details</div>

          <div className="vauth-field">
            <label htmlFor="businessName">Business Name</label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="Registered business name"
              required
            />
          </div>

          <div className="vauth-field">
            <label htmlFor="businessId">Business ID / Licence Number</label>
            <input
              type="text"
              id="businessId"
              name="businessId"
              value={formData.businessId}
              onChange={handleChange}
              placeholder="e.g. ABN 12 345 678 901"
              required
            />
          </div>

          <div className="vauth-section-label">Contact</div>

          <div className="vauth-row">
            <div className="vauth-field">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="business@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="vauth-field">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                required
              />
            </div>
          </div>

          <div className="vauth-section-label">Set Password</div>

          <div className="vauth-row">
            <div className="vauth-field">
              <label htmlFor="password">Password</label>
              <div className="vauth-pw-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button type="button" className="vauth-pw-toggle" onClick={() => setShowPw(!showPw)} aria-label="Toggle password">
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className="vauth-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type={showPw ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter password"
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="vauth-btn" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit Registration'}
          </button>
        </form>

        <div className="vauth-footer">
          <p>Already registered? <Link to="/vendor/login" className="vauth-link">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
