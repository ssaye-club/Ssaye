import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { lockScroll, unlockScroll } from '../utils/scrollLock';
import { useConfirmation } from '../hooks/useConfirmation';
import ConfirmationModal from '../components/ConfirmationModal';
import './InvestmentForm.css';

function InvestmentForm({ investment, onClose, onSubmit }) {
  const { user } = useContext(AuthContext);
  const { confirmationState, showConfirmation } = useConfirmation();
  const [formData, setFormData] = useState({
    // Pre-fill with user data
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    
    // Investment details
    investmentAmount: investment.minInvestment,
    investmentType: 'one-time',
    paymentMethod: 'bank-transfer',
    
    // Agreement
    agreeTerms: false,
    agreeRiskDisclosure: false
  });

  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);

  // Lock body scroll when form is displayed
  useEffect(() => {
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    const amount = parseFloat(formData.investmentAmount);
    
    if (!formData.investmentAmount) {
      newErrors.investmentAmount = 'Investment amount is required';
    } else if (amount < investment.minInvestment) {
      newErrors.investmentAmount = `Minimum investment is $${investment.minInvestment.toLocaleString()}`;
    } else if (amount > investment.totalValue) {
      newErrors.investmentAmount = 'Investment amount exceeds available shares';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'You must accept the terms and conditions';
    }
    if (!formData.agreeRiskDisclosure) {
      newErrors.agreeRiskDisclosure = 'You must acknowledge the risk disclosure';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;
    
    if (step === 1) {
      isValid = validateStep1();
    } else if (step === 2) {
      isValid = validateStep2();
    }
    
    if (isValid && step < 3) {
      setStep(step + 1);
      // Scroll to top of modal
      setTimeout(() => {
        document.querySelector('.investment-form-container')?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      // Scroll to top of modal
      setTimeout(() => {
        document.querySelector('.investment-form-container')?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 3 && validateStep3()) {
      // Confirm before submitting
      const confirmed = await showConfirmation({
        title: 'Submit Investment Application',
        message: `You are about to submit an investment application for ${formatCurrency(formData.investmentAmount)} in ${investment.name}. Please confirm that all information is correct.`,
        confirmText: 'Submit Application',
        cancelText: 'Review Again',
        type: 'info'
      });

      if (!confirmed) return;

      // Submit the investment
      const investmentData = {
        ...formData,
        investmentId: investment._id || investment.id,
        investmentName: investment.name
      };
      
      await onSubmit(investmentData);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="investment-form-overlay" onClick={onClose}>
      <div className="investment-form-container" onClick={(e) => e.stopPropagation()}>
        <button className="form-close-btn" onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Form Header */}
        <div className="form-header">
          <h2>Investment Application</h2>
          <p className="form-investment-name">{investment.name}</p>
          <div className="form-progress">
            <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-number">1</div>
              <span>Personal Info</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-number">2</div>
              <span>Investment</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <span>Review</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="investment-form">
          {/* Step 1: Personal Information */}
          {step === 1 && (
            <div className="form-step">
              <h3>Personal Information</h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={errors.fullName ? 'error' : ''}
                  />
                  {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                </div>
                
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
                
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                    className={errors.phone ? 'error' : ''}
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
                
                <div className="form-group full-width">
                  <label>Street Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={errors.address ? 'error' : ''}
                  />
                  {errors.address && <span className="error-message">{errors.address}</span>}
                </div>
                
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={errors.city ? 'error' : ''}
                  />
                  {errors.city && <span className="error-message">{errors.city}</span>}
                </div>
                
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={errors.state ? 'error' : ''}
                  />
                  {errors.state && <span className="error-message">{errors.state}</span>}
                </div>
                
                <div className="form-group">
                  <label>ZIP Code *</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className={errors.zipCode ? 'error' : ''}
                  />
                  {errors.zipCode && <span className="error-message">{errors.zipCode}</span>}
                </div>
                
                <div className="form-group">
                  <label>Country *</label>
                  <select
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Investment Details */}
          {step === 2 && (
            <div className="form-step">
              <h3>Investment Details</h3>
              
              <div className="investment-summary">
                <div className="summary-item">
                  <span className="summary-label">Property</span>
                  <span className="summary-value">{investment.name}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Location</span>
                  <span className="summary-value">{investment.location}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Expected ROI</span>
                  <span className="summary-value highlight">{investment.expectedROI}%</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Duration</span>
                  <span className="summary-value">{investment.duration}</span>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Investment Amount * (Min: {formatCurrency(investment.minInvestment)})</label>
                  <div className="input-with-icon">
                    <span className="input-icon">$</span>
                    <input
                      type="number"
                      name="investmentAmount"
                      value={formData.investmentAmount}
                      onChange={handleChange}
                      min={investment.minInvestment}
                      step="1000"
                      className={errors.investmentAmount ? 'error' : ''}
                    />
                  </div>
                  {errors.investmentAmount && <span className="error-message">{errors.investmentAmount}</span>}
                  <p className="field-hint">Enter the amount you wish to invest in this property</p>
                </div>
                
                <div className="form-group">
                  <label>Investment Type *</label>
                  <select
                    name="investmentType"
                    value={formData.investmentType}
                    onChange={handleChange}
                  >
                    <option value="one-time">One-Time Investment</option>
                    <option value="recurring">Recurring Monthly</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Payment Method *</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                  >
                    <option value="bank-transfer">Bank Transfer</option>
                    <option value="wire-transfer">Wire Transfer</option>
                    <option value="check">Check</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>
              </div>

              <div className="investment-projection">
                <h4>Investment Projection</h4>
                <div className="projection-grid">
                  <div className="projection-item">
                    <span className="projection-label">Initial Investment</span>
                    <span className="projection-value">{formatCurrency(formData.investmentAmount)}</span>
                  </div>
                  <div className="projection-item">
                    <span className="projection-label">Expected Return ({investment.expectedROI}%)</span>
                    <span className="projection-value positive">
                      +{formatCurrency(formData.investmentAmount * (investment.expectedROI / 100))}
                    </span>
                  </div>
                  <div className="projection-item highlight-box">
                    <span className="projection-label">Total Projected Value</span>
                    <span className="projection-value total">
                      {formatCurrency(formData.investmentAmount * (1 + investment.expectedROI / 100))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review & Agreement */}
          {step === 3 && (
            <div className="form-step">
              <h3>Review & Confirmation</h3>
              
              <div className="review-section">
                <h4>Personal Information</h4>
                <div className="review-grid">
                  <div className="review-item">
                    <span className="review-label">Name:</span>
                    <span>{formData.fullName}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Email:</span>
                    <span>{formData.email}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Phone:</span>
                    <span>{formData.phone}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Address:</span>
                    <span>{formData.address}, {formData.city}, {formData.state} {formData.zipCode}</span>
                  </div>
                </div>
              </div>

              <div className="review-section">
                <h4>Investment Details</h4>
                <div className="review-grid">
                  <div className="review-item">
                    <span className="review-label">Property:</span>
                    <span>{investment.name}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Investment Amount:</span>
                    <span className="highlight">{formatCurrency(formData.investmentAmount)}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Investment Type:</span>
                    <span>{formData.investmentType === 'one-time' ? 'One-Time Investment' : 'Recurring Monthly'}</span>
                  </div>
                  <div className="review-item">
                    <span className="review-label">Payment Method:</span>
                    <span className="capitalize">{formData.paymentMethod.replace('-', ' ')}</span>
                  </div>
                </div>
              </div>

              <div className="agreements-section">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                    />
                    <span>I have read and agree to the <a href="#" target="_blank">Terms and Conditions</a> *</span>
                  </label>
                  {errors.agreeTerms && <span className="error-message">{errors.agreeTerms}</span>}
                </div>
                
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="agreeRiskDisclosure"
                      checked={formData.agreeRiskDisclosure}
                      onChange={handleChange}
                    />
                    <span>I acknowledge the <a href="#" target="_blank">Risk Disclosure Statement</a> and understand that investments carry risks *</span>
                  </label>
                  {errors.agreeRiskDisclosure && <span className="error-message">{errors.agreeRiskDisclosure}</span>}
                </div>
              </div>

              <div className="important-notice">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>
                  By submitting this application, you authorize SSAYE to process your investment and contact you regarding this opportunity. 
                  Our team will review your application and contact you within 2-3 business days.
                </p>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            {step > 1 && (
              <button type="button" onClick={handleBack} className="btn-back">
                Back
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={handleNext} className="btn-next">
                Continue
              </button>
            ) : (
              <button type="submit" className="btn-submit">
                Submit Application
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        type={confirmationState.type}
        onConfirm={confirmationState.onConfirm}
        onCancel={confirmationState.onCancel}
      />
    </div>
  );
}

export default InvestmentForm;
