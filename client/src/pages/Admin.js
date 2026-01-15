import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Admin.css';

function Admin() {
  const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const { showToast } = useToast();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [approvalModalApplication, setApprovalModalApplication] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [reviewData, setReviewData] = useState({
    status: '',
    adminNotes: ''
  });

  useEffect(() => {
    if (isAuthenticated()) {
      fetchApplications();
    }
  }, [isAuthenticated]);

  // Pre-fill review data when an application is selected
  useEffect(() => {
    if (selectedApplication) {
      setReviewData({
        status: '',
        adminNotes: selectedApplication.adminNotes || ''
      });
    }
  }, [selectedApplication]);

  // Wait for auth to load before redirecting
  if (authLoading) {
    return <div className="admin-page"><div className="admin-container"><p>Loading...</p></div></div>;
  }

  // Redirect if not authenticated or not admin
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/investments/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      } else if (response.status === 403) {
        showToast('Access denied. Admin only.', 'error');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (applicationId) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/investments/admin/review/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewData)
      });

      const data = await response.json();

      if (response.ok) {
        showToast(`Application ${reviewData.status} successfully!`, 'success');
        setSelectedApplication(null);
        setReviewData({ status: '', adminNotes: '' });
        fetchApplications(); // Refresh list
      } else {
        showToast(data.message || 'Failed to update application', 'error');
      }
    } catch (error) {
      console.error('Error reviewing application:', error);
      showToast('Error updating application', 'error');
    }
  };

  const handleApproveInvestment = (application) => {
    setApprovalModalApplication(application);
    setApprovalNotes(application.adminNotes || '');
  };

  const submitApproval = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/investments/admin/approve/${approvalModalApplication._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          adminNotes: approvalNotes || 'Payment received and verified'
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Investment approved and sent to Super Admin for final approval!', 'success');
        setApprovalModalApplication(null);
        setApprovalNotes('');
        fetchApplications(); // Refresh list
      } else {
        showToast(data.message || 'Failed to approve investment', 'error');
      }
    } catch (error) {
      console.error('Error approving investment:', error);
      showToast('Error approving investment', 'error');
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

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved' || a.status === 'waiting-payment').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  return (
    <div className="admin-page">
      <div className="admin-container">
        {/* Header */}
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <p className="admin-subtitle">Review and manage investment applications</p>
          
          {/* Display Admin Permissions */}
          {user?.adminPermissions && (
            (user.adminPermissions.countries?.length > 0 || 
             user.adminPermissions.assetTypes?.length > 0 || 
             user.adminPermissions.minAmount || 
             user.adminPermissions.maxAmount) && (
              <div className="admin-permissions-info">
                <h3>Your Access Restrictions:</h3>
                <div className="permissions-grid">
                  {user.adminPermissions.countries?.length > 0 && (
                    <div className="permission-item">
                      <strong>Countries:</strong> {user.adminPermissions.countries.join(', ')}
                    </div>
                  )}
                  {user.adminPermissions.assetTypes?.length > 0 && (
                    <div className="permission-item">
                      <strong>Asset Types:</strong> {user.adminPermissions.assetTypes.join(', ')}
                    </div>
                  )}
                  {(user.adminPermissions.minAmount || user.adminPermissions.maxAmount) && (
                    <div className="permission-item">
                      <strong>Amount Range:</strong> 
                      {user.adminPermissions.minAmount && ` $${user.adminPermissions.minAmount.toLocaleString()}`}
                      {user.adminPermissions.minAmount && user.adminPermissions.maxAmount && ' - '}
                      {user.adminPermissions.maxAmount && `$${user.adminPermissions.maxAmount.toLocaleString()}`}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>

        {/* Stats */}
        <div className="admin-stats">
          <div className="admin-stat-card">
            <div className="stat-icon total">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h18v18H3zM9 9h6v6H9z" />
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Applications</p>
              <h3 className="stat-value">{stats.total}</h3>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon pending">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Pending Review</p>
              <h3 className="stat-value">{stats.pending}</h3>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon approved">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Approved</p>
              <h3 className="stat-value">{stats.approved}</h3>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon rejected">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Rejected</p>
              <h3 className="stat-value">{stats.rejected}</h3>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="admin-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({stats.total})
          </button>
          <button
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({stats.pending})
          </button>
          <button
            className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved ({stats.approved})
          </button>
          <button
            className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({stats.rejected})
          </button>
        </div>

        {/* Applications List */}
        <div className="admin-content">
          {loading ? (
            <div className="loading-state">Loading applications...</div>
          ) : filteredApplications.length === 0 ? (
            <div className="empty-state">
              <h3>No applications found</h3>
              <p>There are no applications matching your filter.</p>
            </div>
          ) : (
            <div className="applications-table">
              {filteredApplications.map((application) => (
                <div key={application._id} className="admin-application-card">
                  <div className="application-main">
                    <div className="application-user">
                      <div className="user-avatar">
                        {application.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-info">
                        <h4>{application.user?.name}</h4>
                        <p>{application.user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="application-investment">
                      <h5>{application.investmentName}</h5>
                      <div className="investment-details">
                        <span className="investment-amount">{formatCurrency(application.investmentAmount)}</span>
                        <span className="investment-method">{application.paymentMethod.replace('-', ' ')}</span>
                      </div>
                    </div>

                    <div className="application-meta">
                      <p className="application-submitted">
                        Submitted {new Date(application.createdAt).toLocaleDateString()}
                      </p>
                      <span className={`application-status status-${application.status}`}>
                        {application.status}
                      </span>
                    </div>

                    <div className="application-actions">
                      {application.status === 'waiting-payment' ? (
                        <button
                          className="btn-approve-payment"
                          onClick={() => handleApproveInvestment(application)}
                        >
                          Approve Investment
                        </button>
                      ) : application.status === 'pending-final-approval' ? (
                        <span className="status-badge pending-super">Awaiting Super Admin</span>
                      ) : (
                        <button
                          className="btn-view"
                          onClick={() => setSelectedApplication(application)}
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approval Modal */}
        {approvalModalApplication && (
          <div className="modal-overlay" onClick={() => setApprovalModalApplication(null)}>
            <div className="modal-content admin-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setApprovalModalApplication(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="modal-header">
                <h2>Approve Investment</h2>
              </div>

              <div className="modal-body">
                <div className="review-section">
                  <h4>Investment Details</h4>
                  <div className="review-grid">
                    <div className="review-item">
                      <span className="review-label">Applicant:</span>
                      <span>{approvalModalApplication.fullName}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Investment:</span>
                      <span>{approvalModalApplication.investmentName}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Amount:</span>
                      <span className="highlight">{formatCurrency(approvalModalApplication.investmentAmount)}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Payment Method:</span>
                      <span className="capitalize">{approvalModalApplication.paymentMethod.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>

                <div className="admin-review-actions-section">
                  <h4>Approval Notes</h4>
                  {approvalModalApplication.adminNotes && (
                    <div className="admin-existing-notes">
                      <strong>Previous Notes:</strong> {approvalModalApplication.adminNotes}
                    </div>
                  )}
                  <div className="admin-review-form">
                    <div className="form-group">
                      <label>{approvalModalApplication.adminNotes ? 'Update notes (optional)' : 'Add notes (optional)'}</label>
                      <textarea
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="Add notes about payment verification, special conditions, or any other relevant information..."
                        rows="6"
                      />
                    </div>
                  </div>
                  <p className="approval-info">
                    This will approve the investment and send it to Super Admin for final approval.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setApprovalModalApplication(null)}>
                  Cancel
                </button>
                <button
                  className="admin-btn-submit-review"
                  onClick={submitApproval}
                >
                  Approve & Send to Super Admin
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {selectedApplication && (
          <div className="modal-overlay" onClick={() => setSelectedApplication(null)}>
            <div className="modal-content admin-modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedApplication(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="modal-header">
                <h2>Review Application</h2>
                <span className={`application-status status-${selectedApplication.status}`}>
                  {selectedApplication.status}
                </span>
              </div>

              <div className="modal-body">
                <div className="review-section">
                  <h4>Applicant Information</h4>
                  <div className="review-grid">
                    <div className="review-item">
                      <span className="review-label">Name:</span>
                      <span>{selectedApplication.fullName}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Email:</span>
                      <span>{selectedApplication.email}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Phone:</span>
                      <span>{selectedApplication.phone}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Address:</span>
                      <span>{selectedApplication.address}, {selectedApplication.city}, {selectedApplication.state} {selectedApplication.zipCode}</span>
                    </div>
                  </div>
                </div>

                <div className="review-section">
                  <h4>Investment Details</h4>
                  <div className="review-grid">
                    <div className="review-item">
                      <span className="review-label">Property:</span>
                      <span>{selectedApplication.investmentName}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Amount:</span>
                      <span className="highlight">{formatCurrency(selectedApplication.investmentAmount)}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Type:</span>
                      <span className="capitalize">{selectedApplication.investmentType}</span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Payment Method:</span>
                      <span className="capitalize">{selectedApplication.paymentMethod.replace('-', ' ')}</span>
                    </div>
                  </div>
                </div>

                {selectedApplication.status === 'pending' && (
                  <div className="admin-review-actions-section">
                    <h4>Review Decision</h4>
                    <div className="admin-review-form">
                      <div className="form-group">
                        <label>Decision *</label>
                        <select
                          value={reviewData.status}
                          onChange={(e) => setReviewData({ ...reviewData, status: e.target.value })}
                        >
                          <option value="">Select decision...</option>
                          <option value="waiting-payment">Approve & Await Payment</option>
                          <option value="rejected">Reject</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Admin Notes</label>
                        <textarea
                          value={reviewData.adminNotes}
                          onChange={(e) => setReviewData({ ...reviewData, adminNotes: e.target.value })}
                          placeholder="Add notes for the applicant..."
                          rows="4"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedApplication.adminNotes && (
                  <div className="admin-existing-notes">
                    <strong>Previous Notes:</strong> {selectedApplication.adminNotes}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setSelectedApplication(null)}>
                  Cancel
                </button>
                {selectedApplication.status === 'pending' && (
                  <button
                    className="admin-btn-submit-review"
                    onClick={() => handleReview(selectedApplication._id)}
                    disabled={!reviewData.status}
                  >
                    Submit Review
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;
