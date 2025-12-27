import React, { useState, useContext } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Investments.css';

function Investments() {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  // Redirect if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  // Investment opportunities data
  const investments = [
    {
      id: 1,
      name: 'Parkside Villas',
      category: 'Multi-Family',
      location: '30 Mountain Blvd, Warren, NJ',
      area: '7.29 Acres',
      status: 'Pre-Development Phase',
      minInvestment: 50000,
      expectedROI: 18.5,
      duration: '36 months',
      totalValue: 12500000,
      availableShares: 75,
      description: 'Premium multi-family residential development in Warren, NJ. This project offers exceptional growth potential in a high-demand area with excellent school districts and amenities.',
      highlights: [
        'Prime location in Warren, NJ',
        'High-demand residential area',
        'Excellent school district',
        'Close to major highways and NYC'
      ],
      riskLevel: 'Moderate',
      projectedCompletion: 'Q4 2027'
    },
    {
      id: 2,
      name: 'Luxury Lofts',
      category: 'Multi-Family',
      location: '25-31 W Main St, Bound Brook, NJ',
      area: '149k Sq.ft',
      status: 'Pre-Construction Phase',
      minInvestment: 75000,
      expectedROI: 21.0,
      duration: '42 months',
      totalValue: 18750000,
      availableShares: 60,
      description: 'Upscale luxury loft development in the heart of Bound Brook. Features modern amenities, high-end finishes, and strategic location near transportation hubs.',
      highlights: [
        'Large-scale development (149k sq.ft)',
        'Downtown location',
        'Modern luxury finishes',
        'Near NJ Transit station'
      ],
      riskLevel: 'Moderate-High',
      projectedCompletion: 'Q2 2028'
    },
    {
      id: 3,
      name: 'Times Sq. Lofts',
      category: 'Multi-Family',
      location: '38 - 40 West Main St, Bound Brook, NJ',
      area: '19.5k Sq.ft',
      status: 'Pre-Development Phase',
      minInvestment: 35000,
      expectedROI: 16.5,
      duration: '30 months',
      totalValue: 6250000,
      availableShares: 85,
      description: 'Boutique loft-style residential complex in prime Bound Brook location. Ideal for urban professionals seeking modern living spaces with city convenience.',
      highlights: [
        'Boutique development',
        'Main Street location',
        'Urban lifestyle amenities',
        'High rental demand'
      ],
      riskLevel: 'Moderate',
      projectedCompletion: 'Q1 2027'
    },
    {
      id: 4,
      name: 'Nexus Lofts',
      category: 'Multi-Family',
      location: '400 & 500 Corporate Drive, Lebanon, NJ',
      area: '22.2 Acres',
      status: 'Pre-Development Phase',
      minInvestment: 100000,
      expectedROI: 22.5,
      duration: '48 months',
      totalValue: 25000000,
      availableShares: 50,
      description: 'Large-scale mixed-use development combining residential and commercial spaces. Strategic corporate location with excellent growth prospects.',
      highlights: [
        'Massive 22.2-acre development',
        'Mixed-use opportunity',
        'Corporate corridor location',
        'High appreciation potential'
      ],
      riskLevel: 'Moderate-High',
      projectedCompletion: 'Q3 2028'
    },
    {
      id: 5,
      name: 'Hillsborough Complex',
      category: 'Multi-Family',
      location: '111 Raiders Blvd, Hillsborough, NJ',
      area: '5,366 Sq.ft & 145,000 Sq.ft',
      status: 'Pre-Development Phase',
      minInvestment: 60000,
      expectedROI: 19.0,
      duration: '38 months',
      totalValue: 15000000,
      availableShares: 70,
      description: 'Comprehensive residential development in Hillsborough featuring multiple building phases. Excellent location with strong community appeal and infrastructure.',
      highlights: [
        'Multi-phase development',
        'Family-friendly location',
        'Modern community amenities',
        'Strong local economy'
      ],
      riskLevel: 'Moderate',
      projectedCompletion: 'Q1 2028'
    }
  ];

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
    // In production, this would handle the investment process
    alert(`Investment initiated for ${investment.name}. In production, this would open the investment flow.`);
    closeModal();
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
        <div className="investments-grid">
          {filteredInvestments.map((investment) => (
            <div key={investment.id} className="investment-card">
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

        {filteredInvestments.length === 0 && (
          <div className="no-results">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <h3>No investments found</h3>
            <p>Try adjusting your filters or search terms</p>
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
    </div>
  );
}

export default Investments;
