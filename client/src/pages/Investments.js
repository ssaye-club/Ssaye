import React, { useState, useEffect, useContext } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import InvestmentForm from './InvestmentForm';
import './Investments.css';

function Investments() {
  const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);
  const [investmentForForm, setInvestmentForForm] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      const response = await fetch(`${API_URL}/api/opportunities`);

      if (response.ok) {
        const data = await response.json();
        setInvestments(data);
      } else {
        console.error('Failed to fetch investment opportunities');
      }
    } catch (error) {
      console.error('Error fetching investment opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Wait for auth to load before redirecting
  if (authLoading) {
    return <div className="investments-page"><div className="investments-container"><p>Loading...</p></div></div>;
  }

  // Redirect if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  // Block admins and super admins from accessing investments
  if (user?.isAdmin || user?.isSuperAdmin) {
    return <Navigate to={user?.isSuperAdmin ? "/superadmin" : "/admin"} />;
  }

  // Filter investments based on category and search
  const filteredInvestments = investments.filter(investment => {
    const matchesCategory = selectedCategory === 'all' || investment.category === selectedCategory;
    const matchesSearch = investment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         investment.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleInvestClick = (investment) => {
    setSelectedInvestment(investment);
  };

  const closeModal = () => {
    setSelectedInvestment(null);
  };

  const handleInvestNow = (investment) => {
    setInvestmentForForm(investment);
    setShowInvestmentForm(true);
    closeModal();
  };

  const handleFormSubmit = async (formData) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/investments/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit application');
      }

      showToast(`Thank you for your investment application! We'll review your submission and contact you at ${formData.email} within 2-3 business days.`, 'success', 5000);
      setShowInvestmentForm(false);
      setInvestmentForForm(null);
    } catch (error) {
      console.error('Error submitting application:', error);
      showToast(`Error: ${error.message}`, 'error');
    }
  };

  const handleCloseForm = () => {
    setShowInvestmentForm(false);
    setInvestmentForForm(null);
  };

  return (
    <div className="investments-page">
      <div className="investments-container">
        {/* Header */}
        <div className="investments-header">
          <div className="header-content">
            <button className="back-btn" onClick={() => navigate('/portfolio')}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Portfolio
            </button>
            <h1>Investment Opportunities</h1>
            <p className="header-subtitle">Explore premium real estate investment opportunities</p>
          </div>
        </div>

        {/* Filters */}
        <div className="investments-filters">
          <div className="filter-group">
            <label>Category</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              <option value="Multi-Family">Multi-Family</option>
              <option value="Commercial">Commercial</option>
              <option value="Mixed-Use">Mixed-Use</option>
            </select>
          </div>
          <div className="filter-group search-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Investment Cards Grid */}
        {loading ? (
          <div className="loading-state">
            <p>Loading investment opportunities...</p>
          </div>
        ) : filteredInvestments.length === 0 ? (
          <div className="empty-results">
            <p>No investment opportunities found matching your criteria.</p>
          </div>
        ) : (
          <div className="investments-grid">
            {filteredInvestments.map((investment) => (
              <div key={investment._id} className="investment-card">
                {investment.images && investment.images.length > 0 && (
                  <div className="card-image">
                    <img src={investment.images[0]} alt={investment.name} />
                  </div>
                )}
                <div className="card-header-section">
                  <div className="card-badges">
                    <span className="category-badge">{investment.category}</span>
                    <span className={`status-badge ${investment.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {investment.status}
                    </span>
                  </div>
                  <div className="card-title">
                    <h3>{investment.name}</h3>
                    <p className="location">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {investment.location}
                    </p>
                  </div>
                </div>

              <div className="card-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <span className="detail-label">Area</span>
                    <span className="detail-value">{investment.area}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Min. Investment</span>
                    <span className="detail-value highlight">{formatCurrency(investment.minInvestment)}</span>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-item">
                    <span className="detail-label">Expected ROI</span>
                    <span className="detail-value roi">{investment.expectedROI}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Duration</span>
                    <span className="detail-value">{investment.duration}</span>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-item">
                    <span className="detail-label">Total Value</span>
                    <span className="detail-value">{formatCurrency(investment.totalValue)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Availability</span>
                    <span className="detail-value">{investment.availableShares}% Available</span>
                  </div>
                </div>
              </div>

              <div className="card-actions">
                <button className="btn-view-details" onClick={() => handleInvestClick(investment)}>
                  View Details
                </button>
                <button className="btn-invest" onClick={() => handleInvestClick(investment)}>
                  Invest Now
                </button>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>

      {/* Investment Details Modal */}
      {selectedInvestment && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="modal-header">
              <h2>{selectedInvestment.name}</h2>
              <div className="modal-badges">
                <span className="category-badge">{selectedInvestment.category}</span>
                <span className={`status-badge ${selectedInvestment.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  {selectedInvestment.status}
                </span>
              </div>
            </div>

            <div className="modal-body">
              <div className="modal-location">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {selectedInvestment.location}
              </div>

              {selectedInvestment.images && selectedInvestment.images.length > 0 && (
                <div className="modal-images">
                  <div className="images-gallery">
                    {selectedInvestment.images.map((image, index) => (
                      <div key={index} className="gallery-image">
                        <img src={image} alt={`${selectedInvestment.name} ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-description">
                <h3>About This Investment</h3>
                <p>{selectedInvestment.description}</p>
              </div>

              <div className="modal-highlights">
                <h3>Key Highlights</h3>
                <ul>
                  {selectedInvestment.highlights.map((highlight, index) => (
                    <li key={index}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="modal-stats">
                <div className="stat-item">
                  <span className="stat-label">Area</span>
                  <span className="stat-value">{selectedInvestment.area}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Min. Investment</span>
                  <span className="stat-value">{formatCurrency(selectedInvestment.minInvestment)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Expected ROI</span>
                  <span className="stat-value roi">{selectedInvestment.expectedROI}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Duration</span>
                  <span className="stat-value">{selectedInvestment.duration}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Total Value</span>
                  <span className="stat-value">{formatCurrency(selectedInvestment.totalValue)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Risk Level</span>
                  <span className="stat-value">{selectedInvestment.riskLevel}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Completion</span>
                  <span className="stat-value">{selectedInvestment.projectedCompletion}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Availability</span>
                  <span className="stat-value">{selectedInvestment.availableShares}% Available</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn-invest-modal" onClick={() => handleInvestNow(selectedInvestment)}>
                Invest Now - {formatCurrency(selectedInvestment.minInvestment)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Investment Form */}
      {showInvestmentForm && investmentForForm && (
        <InvestmentForm
          investment={investmentForForm}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}

export default Investments;
