import React, { useState, useEffect, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './SuperAdmin.css';

function SuperAdmin() {
  const { user, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [pendingInvestments, setPendingInvestments] = useState([]);
  const [approvedInvestments, setApprovedInvestments] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'investments', 'approved', or 'opportunities'
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalSuperAdmins: 0,
    regularUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [opportunityForm, setOpportunityForm] = useState({
    name: '',
    category: 'Multi-Family',
    location: '',
    area: '',
    description: '',
    highlights: [''],
    minInvestment: '',
    totalValue: '',
    expectedROI: '',
    duration: '',
    riskLevel: 'Medium',
    status: 'Open',
    availableShares: '',
    projectedCompletion: '',
    images: []
  });
  const [adminPermissions, setAdminPermissions] = useState({
    countries: [],
    assetTypes: [],
    minAmount: '',
    maxAmount: ''
  });
  
  // Pending investments filters and sort
  const [pendingFilters, setPendingFilters] = useState({
    country: 'all',
    investmentName: ''
  });
  const [pendingSort, setPendingSort] = useState('dateDesc');
  
  // Approved investments filters and sort
  const [approvedFilters, setApprovedFilters] = useState({
    country: 'all',
    investmentName: ''
  });
  const [approvedSort, setApprovedSort] = useState('dateDesc');

  useEffect(() => {
    if (isAuthenticated() && user?.isSuperAdmin) {
      fetchUsers();
      fetchStats();
      fetchPendingInvestments();
      fetchApprovedInvestments();
      fetchOpportunities();
    }
  }, [isAuthenticated, user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openActionMenuId && !event.target.closest('.action-dropdown')) {
        setOpenActionMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openActionMenuId]);

  // Wait for auth to load before redirecting
  if (authLoading) {
    return (
      <div className="superadmin-page">
        <div className="superadmin-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated or not super admin
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  if (!user?.isSuperAdmin) {
    return <Navigate to="/" />;
  }

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/superadmin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else if (response.status === 403) {
        showToast('Access denied. Super Admin only.', 'error');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/superadmin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const promoteToAdmin = async (userId) => {
    setSelectedUserId(userId);
    setIsEditMode(false);
    setAdminPermissions({
      countries: [],
      assetTypes: [],
      minAmount: '',
      maxAmount: ''
    });
    setShowPermissionsModal(true);
  };

  const editAdminPermissions = (userToEdit) => {
    setSelectedUserId(userToEdit._id);
    setIsEditMode(true);
    setAdminPermissions({
      countries: userToEdit.adminPermissions?.countries || [],
      assetTypes: userToEdit.adminPermissions?.assetTypes || [],
      minAmount: userToEdit.adminPermissions?.minAmount || '',
      maxAmount: userToEdit.adminPermissions?.maxAmount || ''
    });
    setShowPermissionsModal(true);
  };

  const handlePromoteWithPermissions = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const endpoint = isEditMode 
        ? `${API_URL}/api/superadmin/users/${selectedUserId}/update-permissions`
        : `${API_URL}/api/superadmin/users/${selectedUserId}/promote-admin`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          countries: adminPermissions.countries,
          assetTypes: adminPermissions.assetTypes,
          minAmount: adminPermissions.minAmount ? Number(adminPermissions.minAmount) : null,
          maxAmount: adminPermissions.maxAmount ? Number(adminPermissions.maxAmount) : null
        })
      });

      if (response.ok) {
        showToast(isEditMode ? 'Admin permissions updated successfully' : 'User promoted to admin successfully', 'success');
        setShowPermissionsModal(false);
        setAdminPermissions({
          countries: [],
          assetTypes: [],
          minAmount: '',
          maxAmount: ''
        });
        fetchUsers();
        fetchStats();
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to update permissions', 'error');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      showToast('Failed to update permissions', 'error');
    }
  };

  const handleCountryChange = (e) => {
    const value = e.target.value;
    if (value && !adminPermissions.countries.includes(value)) {
      setAdminPermissions({
        ...adminPermissions,
        countries: [...adminPermissions.countries, value]
      });
    }
  };

  const removeCountry = (country) => {
    setAdminPermissions({
      ...adminPermissions,
      countries: adminPermissions.countries.filter(c => c !== country)
    });
  };

  const handleAssetTypeChange = (e) => {
    const value = e.target.value;
    if (value && !adminPermissions.assetTypes.includes(value)) {
      setAdminPermissions({
        ...adminPermissions,
        assetTypes: [...adminPermissions.assetTypes, value]
      });
    }
  };

  const removeAssetType = (assetType) => {
    setAdminPermissions({
      ...adminPermissions,
      assetTypes: adminPermissions.assetTypes.filter(a => a !== assetType)
    });
  };

  const demoteAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to demote this admin to regular user?')) {
      return;
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/superadmin/users/${userId}/demote-admin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showToast('Admin demoted to user successfully', 'success');
        fetchUsers();
        fetchStats();
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to demote admin', 'error');
      }
    } catch (error) {
      console.error('Error demoting admin:', error);
      showToast('Failed to demote admin', 'error');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/superadmin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToast('User deleted successfully', 'success');
        setOpenActionMenuId(null);
        fetchUsers();
        fetchStats();
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user', 'error');
    }
  };

  const toggleDisableUser = async (userId, currentStatus) => {
    const action = currentStatus ? 'enable' : 'disable';
    if (!window.confirm(`Are you sure you want to ${action} this user account?`)) {
      return;
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/superadmin/users/${userId}/${action}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showToast(`User account ${action}d successfully`, 'success');
        setOpenActionMenuId(null);
        fetchUsers();
        fetchStats();
      } else {
        const data = await response.json();
        showToast(data.message || `Failed to ${action} user`, 'error');
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      showToast(`Failed to ${action} user`, 'error');
    }
  };

  const fetchPendingInvestments = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/investments/superadmin/pending-final`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingInvestments(data);
      }
    } catch (error) {
      console.error('Error fetching pending investments:', error);
    }
  };

  const fetchApprovedInvestments = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/investments/superadmin/approved`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApprovedInvestments(data);
      }
    } catch (error) {
      console.error('Error fetching approved investments:', error);
    }
  };

  const openApprovalModal = (application) => {
    setSelectedInvestment(application);
    setApprovalNotes(application.superAdminNotes || '');
    setShowApprovalModal(true);
  };

  const closeApprovalModal = () => {
    setShowApprovalModal(false);
    setSelectedInvestment(null);
    setApprovalNotes('');
  };

  const handleFinalApprove = async () => {
    if (!selectedInvestment) return;

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/investments/superadmin/final-approve/${selectedInvestment._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          superAdminNotes: approvalNotes
        })
      });

      if (response.ok) {
        showToast('Investment approved and added to user portfolio!', 'success');
        closeApprovalModal();
        fetchPendingInvestments();
        fetchApprovedInvestments();
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to approve investment', 'error');
      }
    } catch (error) {
      console.error('Error approving investment:', error);
      showToast('Failed to approve investment', 'error');
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

  // Investment Opportunities Functions
  const fetchOpportunities = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/opportunities/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOpportunities(data);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    }
  };

  const handleCreateOpportunity = () => {
    setEditingOpportunity(null);
    setOpportunityForm({
      name: '',
      category: 'Multi-Family',
      location: '',
      area: '',
      description: '',
      highlights: [''],
      minInvestment: '',
      totalValue: '',
      expectedROI: '',
      duration: '',
      riskLevel: 'Medium',
      status: 'Open',
      availableShares: '',
      projectedCompletion: '',
      images: []
    });
    setShowOpportunityModal(true);
  };

  const handleEditOpportunity = (opportunity) => {
    setEditingOpportunity(opportunity);
    setOpportunityForm({
      name: opportunity.name,
      category: opportunity.category,
      location: opportunity.location,
      area: opportunity.area,
      description: opportunity.description,
      highlights: opportunity.highlights.length ? opportunity.highlights : [''],
      minInvestment: opportunity.minInvestment,
      totalValue: opportunity.totalValue,
      expectedROI: opportunity.expectedROI,
      duration: opportunity.duration,
      riskLevel: opportunity.riskLevel,
      status: opportunity.status,
      availableShares: opportunity.availableShares,
      projectedCompletion: opportunity.projectedCompletion,
      images: opportunity.images || []
    });
    setShowOpportunityModal(true);
  };

  const handleSaveOpportunity = async (e) => {
    e.preventDefault();
    
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const url = editingOpportunity 
        ? `${API_URL}/api/opportunities/${editingOpportunity._id}`
        : `${API_URL}/api/opportunities`;
      
      const method = editingOpportunity ? 'PUT' : 'POST';
      
      // Filter out empty highlights
      const cleanedHighlights = opportunityForm.highlights.filter(h => h.trim() !== '');
      const cleanedImages = opportunityForm.images.filter(img => img.trim() !== '');
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...opportunityForm,
          highlights: cleanedHighlights,
          images: cleanedImages,
          minInvestment: Number(opportunityForm.minInvestment),
          totalValue: Number(opportunityForm.totalValue),
          expectedROI: Number(opportunityForm.expectedROI),
          availableShares: Number(opportunityForm.availableShares)
        })
      });

      if (response.ok) {
        showToast(editingOpportunity ? 'Opportunity updated successfully!' : 'Opportunity created successfully!', 'success');
        setShowOpportunityModal(false);
        fetchOpportunities();
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to save opportunity', 'error');
      }
    } catch (error) {
      console.error('Error saving opportunity:', error);
      showToast('Failed to save opportunity', 'error');
    }
  };

  const handleDeleteOpportunity = async (id) => {
    if (!window.confirm('Are you sure you want to delete this investment opportunity?')) {
      return;
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/opportunities/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToast('Opportunity deleted successfully!', 'success');
        fetchOpportunities();
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to delete opportunity', 'error');
      }
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      showToast('Failed to delete opportunity', 'error');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/api/opportunities/${id}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchOpportunities();
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to toggle status', 'error');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      showToast('Failed to toggle status', 'error');
    }
  };

  const addHighlight = () => {
    setOpportunityForm({
      ...opportunityForm,
      highlights: [...opportunityForm.highlights, '']
    });
  };

  const removeHighlight = (index) => {
    const newHighlights = opportunityForm.highlights.filter((_, i) => i !== index);
    setOpportunityForm({
      ...opportunityForm,
      highlights: newHighlights.length ? newHighlights : ['']
    });
  };

  const updateHighlight = (index, value) => {
    const newHighlights = [...opportunityForm.highlights];
    newHighlights[index] = value;
    setOpportunityForm({
      ...opportunityForm,
      highlights: newHighlights
    });
  };

  // Image upload function - converts file to base64
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        showToast('Please upload only image files', 'error');
        return;
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setOpportunityForm({
          ...opportunityForm,
          images: [...opportunityForm.images, reader.result]
        });
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    e.target.value = '';
  };

  const removeImage = (index) => {
    const newImages = opportunityForm.images.filter((_, i) => i !== index);
    setOpportunityForm({
      ...opportunityForm,
      images: newImages
    });
  };

  const filteredUsers = users.filter(u => {
    // Filter by role
    if (filter === 'admins' && !u.isAdmin) return false;
    if (filter === 'users' && u.isAdmin) return false;
    if (filter === 'superadmins' && !u.isSuperAdmin) return false;

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      );
    }

    return true;
  });

  if (loading) {
    return (
      <div className="superadmin-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="superadmin-page">
      <div className="superadmin-container">
        {/* Header */}
        <div className="superadmin-header">
          <div className="header-content">
            <h1>Super Admin Dashboard</h1>
            <p className="header-subtitle">Manage all users and final investment approvals</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="superadmin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>
          <button 
            className={`tab-btn ${activeTab === 'investments' ? 'active' : ''}`}
            onClick={() => setActiveTab('investments')}
          >
            Pending Approvals ({pendingInvestments.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Approved Investments ({approvedInvestments.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'opportunities' ? 'active' : ''}`}
            onClick={() => setActiveTab('opportunities')}
          >
            Opportunities ({opportunities.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>

        {/* Stats */}
        <div className="superadmin-stats">
          <div className="sa-stat-card">
            <div className="sa-stat-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="sa-stat-content">
              <div className="sa-stat-label">Total Users</div>
              <div className="sa-stat-value">{stats.totalUsers}</div>
            </div>
          </div>

          <div className="sa-stat-card">
            <div className="sa-stat-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="sa-stat-content">
              <div className="sa-stat-label">Regular Users</div>
              <div className="sa-stat-value">{stats.regularUsers}</div>
            </div>
          </div>

          <div className="sa-stat-card">
            <div className="sa-stat-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="sa-stat-content">
              <div className="sa-stat-label">Admins</div>
              <div className="sa-stat-value">{stats.totalAdmins}</div>
            </div>
          </div>

          <div className="sa-stat-card">
            <div className="sa-stat-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="sa-stat-content">
              <div className="sa-stat-label">Super Admins</div>
              <div className="sa-stat-value">{stats.totalSuperAdmins}</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="superadmin-filters">
          <div className="filter-group">
            <label>Filter by Role</label>
            <select 
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="users">Regular Users</option>
              <option value="admins">Admins</option>
              <option value="superadmins">Super Admins</option>
            </select>
          </div>

          <div className="search-group">
            <label>Search Users</label>
            <input
              type="text"
              className="search-input"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, index) => (
                <tr key={u._id}>
                  <td>
                    <div className="user-name">
                      {u.name}
                      {u._id === user.id && <span className="badge-you">You</span>}
                      {u.isPremium && <span className="badge-premium">Premium</span>}
                      {u.isDisabled && <span className="badge-disabled">Disabled</span>}
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    {u.isSuperAdmin ? (
                      <span className="badge badge-superadmin">Super Admin</span>
                    ) : u.isAdmin ? (
                      <span className="badge badge-admin">Admin</span>
                    ) : (
                      <span className="badge badge-user">User</span>
                    )}
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      {!u.isSuperAdmin ? (
                        <div className="action-dropdown">
                          <button 
                            className="btn-action-menu"
                            onClick={() => setOpenActionMenuId(openActionMenuId === u._id ? null : u._id)}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </button>
                          
                          {openActionMenuId === u._id && (
                            <div className={`action-menu-dropdown ${index < 3 ? 'dropdown-bottom' : 'dropdown-top'}`}>
                              {!u.isAdmin ? (
                                <button
                                  className="dropdown-item"
                                  onClick={() => {
                                    promoteToAdmin(u._id);
                                    setOpenActionMenuId(null);
                                  }}
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                  </svg>
                                  Promote to Admin
                                </button>
                              ) : (
                                <>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => {
                                      editAdminPermissions(u);
                                      setOpenActionMenuId(null);
                                    }}
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                    Edit Permissions
                                  </button>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => {
                                      demoteAdmin(u._id);
                                      setOpenActionMenuId(null);
                                    }}
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
                                    </svg>
                                    Demote to User
                                  </button>
                                </>
                              )}
                              <button
                                className="dropdown-item"
                                onClick={() => toggleDisableUser(u._id, u.isDisabled)}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  {u.isDisabled ? (
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                                  ) : (
                                    <>
                                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                      <line x1="1" y1="1" x2="23" y2="23" />
                                    </>
                                  )}
                                </svg>
                                {u.isDisabled ? 'Enable Account' : 'Disable Account'}
                              </button>
                              <div className="dropdown-divider"></div>
                              <button
                                className="dropdown-item danger"
                                onClick={() => deleteUser(u._id)}
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Delete User
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="protected-text">Protected</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="no-results">
              <p>No users found matching your criteria.</p>
            </div>
          )}
        </div>
        </>
        )}

        {/* Investments Tab */}
        {activeTab === 'investments' && (
          <div className="investments-section">
            <h2 className="section-title">Pending Final Approvals</h2>
            
            {/* Filters and Sort for Pending */}
            <div className="filters-sort-container">
              <div className="filters-group">
                <input
                  type="text"
                  placeholder="Search by investment name..."
                  value={pendingFilters.investmentName}
                  onChange={(e) => setPendingFilters({...pendingFilters, investmentName: e.target.value})}
                  className="filter-input-wide"
                />
                
                <select 
                  value={pendingFilters.country}
                  onChange={(e) => setPendingFilters({...pendingFilters, country: e.target.value})}
                  className="filter-select"
                >
                  <option value="all">All Countries</option>
                  {[...new Set(pendingInvestments.map(inv => inv.country))].sort().map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              
              <div className="sort-group">
                <label>Sort:</label>
                <select 
                  value={pendingSort}
                  onChange={(e) => setPendingSort(e.target.value)}
                  className="sort-select"
                >
                  <option value="dateDesc">Date (Newest)</option>
                  <option value="dateAsc">Date (Oldest)</option>
                  <option value="amountDesc">Amount (High to Low)</option>
                  <option value="amountAsc">Amount (Low to High)</option>
                  <option value="investorName">Investor Name (A-Z)</option>
                </select>
              </div>
              
              <button 
                className="btn-clear-filters"
                onClick={() => setPendingFilters({ country: 'all', investmentName: '' })}
              >
                Clear
              </button>
            </div>
            
            {pendingInvestments.filter(app => {
              // Apply filters
              if (pendingFilters.country !== 'all' && app.country !== pendingFilters.country) return false;
              if (pendingFilters.investmentName && !app.investmentName.toLowerCase().includes(pendingFilters.investmentName.toLowerCase())) return false;
              return true;
            }).sort((a, b) => {
              // Apply sort
              switch(pendingSort) {
                case 'dateDesc': return new Date(b.createdAt) - new Date(a.createdAt);
                case 'dateAsc': return new Date(a.createdAt) - new Date(b.createdAt);
                case 'amountDesc': return b.investmentAmount - a.investmentAmount;
                case 'amountAsc': return a.investmentAmount - b.investmentAmount;
                case 'investorName': return (a.fullName || '').localeCompare(b.fullName || '');
                default: return 0;
              }
            }).length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <h3>No Pending Approvals</h3>
                <p>{pendingInvestments.length === 0 ? 'All investment applications have been reviewed' : 'No investments match your filters'}</p>
              </div>
            ) : (
              <div className="pending-investments-table">
                <table>
                  <thead>
                    <tr>
                      <th>Investment</th>
                      <th>Investor</th>
                      <th>Amount</th>
                      <th>Payment</th>
                      <th>Admin Approval</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingInvestments.filter(app => {
                      if (pendingFilters.country !== 'all' && app.country !== pendingFilters.country) return false;
                      if (pendingFilters.investmentName && !app.investmentName.toLowerCase().includes(pendingFilters.investmentName.toLowerCase())) return false;
                      return true;
                    }).sort((a, b) => {
                      switch(pendingSort) {
                        case 'dateDesc': return new Date(b.createdAt) - new Date(a.createdAt);
                        case 'dateAsc': return new Date(a.createdAt) - new Date(b.createdAt);
                        case 'amountDesc': return b.investmentAmount - a.investmentAmount;
                        case 'amountAsc': return a.investmentAmount - b.investmentAmount;
                        case 'investorName': return (a.fullName || '').localeCompare(b.fullName || '');
                        default: return 0;
                      }
                    }).map((application) => (
                      <tr key={application._id}>
                        <td>
                          <div className="investment-info">
                            <strong>{application.investmentName}</strong>
                            <span className="investment-location">{application.city}, {application.country}</span>
                          </div>
                        </td>
                        <td>
                          <div className="investor-info">
                            <strong>{application.user?.name}</strong>
                            <span>{application.user?.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className="amount-highlight">{formatCurrency(application.investmentAmount)}</span>
                        </td>
                        <td>
                          <span className="payment-method">{application.paymentMethod.replace('-', ' ')}</span>
                        </td>
                        <td>
                          <div className="admin-approval">
                            <span>{application.approvedByAdmin?.name}</span>
                            <span className="approval-date">{new Date(application.adminApprovedAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td>{new Date(application.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="btn-approve-compact"
                            onClick={() => openApprovalModal(application)}
                          >
                            Review & Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Approved Investments Tab */}
        {activeTab === 'approved' && (
          <div className="approved-section">
            <h2 className="section-title">Approved Investments</h2>
            
            {/* Filters and Sort for Approved */}
            <div className="filters-sort-container">
              <div className="filters-group">
                <input
                  type="text"
                  placeholder="Search by investment name..."
                  value={approvedFilters.investmentName}
                  onChange={(e) => setApprovedFilters({...approvedFilters, investmentName: e.target.value})}
                  className="filter-input-wide"
                />
                
                <select 
                  value={approvedFilters.country}
                  onChange={(e) => setApprovedFilters({...approvedFilters, country: e.target.value})}
                  className="filter-select"
                >
                  <option value="all">All Countries</option>
                  {[...new Set(approvedInvestments.map(inv => inv.country))].sort().map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              
              <div className="sort-group">
                <label>Sort:</label>
                <select 
                  value={approvedSort}
                  onChange={(e) => setApprovedSort(e.target.value)}
                  className="sort-select"
                >
                  <option value="dateDesc">Approval Date (Newest)</option>
                  <option value="dateAsc">Approval Date (Oldest)</option>
                  <option value="amountDesc">Amount (High to Low)</option>
                  <option value="amountAsc">Amount (Low to High)</option>
                  <option value="investorName">Investor Name (A-Z)</option>
                </select>
              </div>
              
              <button 
                className="btn-clear-filters"
                onClick={() => setApprovedFilters({ country: 'all', investmentName: '' })}
              >
                Clear
              </button>
            </div>
            
            {approvedInvestments.filter(app => {
              // Apply filters
              if (approvedFilters.country !== 'all' && app.country !== approvedFilters.country) return false;
              if (approvedFilters.investmentName && !app.investmentName.toLowerCase().includes(approvedFilters.investmentName.toLowerCase())) return false;
              return true;
            }).sort((a, b) => {
              // Apply sort
              switch(approvedSort) {
                case 'dateDesc': return new Date(b.finalApprovedAt) - new Date(a.finalApprovedAt);
                case 'dateAsc': return new Date(a.finalApprovedAt) - new Date(b.finalApprovedAt);
                case 'amountDesc': return b.investmentAmount - a.investmentAmount;
                case 'amountAsc': return a.investmentAmount - b.investmentAmount;
                case 'investorName': return (a.user?.name || '').localeCompare(b.user?.name || '');
                default: return 0;
              }
            }).length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <h3>No Approved Investments{approvedInvestments.length > 0 ? ' Match Your Filters' : ' Yet'}</h3>
                <p>{approvedInvestments.length === 0 ? 'Approved applications will appear here' : 'Try adjusting your filters'}</p>
              </div>
            ) : (
              <div className="approved-investments-table">
                <table>
                  <thead>
                    <tr>
                      <th>Investment</th>
                      <th>Investor</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Approved By</th>
                      <th>Approval Date</th>
                      <th>Notes</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedInvestments.filter(app => {
                      if (approvedFilters.country !== 'all' && app.country !== approvedFilters.country) return false;
                      if (approvedFilters.investmentName && !app.investmentName.toLowerCase().includes(approvedFilters.investmentName.toLowerCase())) return false;
                      return true;
                    }).sort((a, b) => {
                      switch(approvedSort) {
                        case 'dateDesc': return new Date(b.finalApprovedAt) - new Date(a.finalApprovedAt);
                        case 'dateAsc': return new Date(a.finalApprovedAt) - new Date(b.finalApprovedAt);
                        case 'amountDesc': return b.investmentAmount - a.investmentAmount;
                        case 'amountAsc': return a.investmentAmount - b.investmentAmount;
                        case 'investorName': return (a.user?.name || '').localeCompare(b.user?.name || '');
                        default: return 0;
                      }
                    }).map((application) => (
                      <tr key={application._id}>
                        <td>
                          <div className="investment-info">
                            <strong>{application.investmentName}</strong>
                            <span className="investment-location">{application.city}, {application.country}</span>
                          </div>
                        </td>
                        <td>
                          <div className="investor-info">
                            <strong>{application.user?.name}</strong>
                            <span>{application.user?.email}</span>
                          </div>
                        </td>
                        <td>
                          <span className="amount-highlight">{formatCurrency(application.investmentAmount)}</span>
                        </td>
                        <td>
                          <span className="status-badge approved">Approved</span>
                        </td>
                        <td>{application.finalApprovedBy?.name || 'System'}</td>
                        <td>{new Date(application.finalApprovedAt).toLocaleDateString()}</td>
                        <td>
                          {(application.adminNotes || application.superAdminNotes) ? (
                            <div className="notes-cell">
                              {application.adminNotes && (
                                <div className="admin-note" title={`Admin: ${application.adminNotes}`}>
                                  <span className="note-label">Admin:</span> 
                                  {application.adminNotes.substring(0, 20)}{application.adminNotes.length > 20 ? '...' : ''}
                                </div>
                              )}
                              {application.superAdminNotes && (
                                <div className="superadmin-note" title={`Super Admin: ${application.superAdminNotes}`}>
                                  <span className="note-label">Super Admin:</span> 
                                  {application.superAdminNotes.substring(0, 20)}{application.superAdminNotes.length > 20 ? '...' : ''}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="no-notes">—</span>
                          )}
                        </td>
                        <td>
                          <button 
                            className="btn-view-details"
                            onClick={() => openApprovalModal(application)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Opportunities Tab */}
        {activeTab === 'opportunities' && (
          <div className="opportunities-section">
            <div className="section-header-with-action">
              <h2 className="section-title">Investment Opportunities Management</h2>
              <button className="btn-create-opportunity" onClick={handleCreateOpportunity}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create New Opportunity
              </button>
            </div>

            {opportunities.length === 0 ? (
              <div className="empty-state">
                <p>No investment opportunities created yet</p>
                <button className="btn-create-first" onClick={handleCreateOpportunity}>
                  Create Your First Opportunity
                </button>
              </div>
            ) : (
              <div className="opportunities-grid">
                {opportunities.map((opp) => (
                  <div key={opp._id} className="opportunity-management-card">
                    <div className="opp-card-header">
                      <h3>{opp.name}</h3>
                      <div className="opp-badges">
                        <span className="opp-category-badge">{opp.category}</span>
                        <span className={`opp-status-badge status-${opp.status.toLowerCase()}`}>
                          {opp.status}
                        </span>
                        <span className={`opp-active-badge ${opp.isActive ? 'active' : 'inactive'}`}>
                          {opp.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="opp-card-body">
                      <div className="opp-info-row">
                        <span className="opp-label">Location:</span>
                        <span>{opp.location}</span>
                      </div>
                      <div className="opp-info-row">
                        <span className="opp-label">Min Investment:</span>
                        <span className="opp-highlight">{formatCurrency(opp.minInvestment)}</span>
                      </div>
                      <div className="opp-info-row">
                        <span className="opp-label">Expected ROI:</span>
                        <span className="opp-roi">{opp.expectedROI}%</span>
                      </div>
                      <div className="opp-info-row">
                        <span className="opp-label">Available:</span>
                        <span>{opp.availableShares}%</span>
                      </div>
                    </div>

                    <div className="opp-card-actions">
                      <button 
                        className="btn-opp-edit"
                        onClick={() => handleEditOpportunity(opp)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </button>
                      <button 
                        className={`btn-opp-toggle ${opp.isActive ? 'deactivate' : 'activate'}`}
                        onClick={() => handleToggleActive(opp._id)}
                      >
                        {opp.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button 
                        className="btn-opp-delete"
                        onClick={() => handleDeleteOpportunity(opp._id)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Opportunity Form Modal */}
      {showOpportunityModal && (
        <div className="sa-modal-overlay" onClick={() => setShowOpportunityModal(false)}>
          <div className="sa-modal-content opportunity-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h2>{editingOpportunity ? 'Edit Investment Opportunity' : 'Create New Investment Opportunity'}</h2>
              <button className="sa-modal-close" onClick={() => setShowOpportunityModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveOpportunity} className="opportunity-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={opportunityForm.name}
                    onChange={(e) => setOpportunityForm({...opportunityForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={opportunityForm.category}
                    onChange={(e) => setOpportunityForm({...opportunityForm, category: e.target.value})}
                    required
                  >
                    <option value="Multi-Family">Multi-Family</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Mixed-Use">Mixed-Use</option>
                    <option value="Residential">Residential</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    value={opportunityForm.location}
                    onChange={(e) => setOpportunityForm({...opportunityForm, location: e.target.value})}
                    placeholder="City, State"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Area *</label>
                  <input
                    type="text"
                    value={opportunityForm.area}
                    onChange={(e) => setOpportunityForm({...opportunityForm, area: e.target.value})}
                    placeholder="e.g., 45,000 sq ft"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={opportunityForm.description}
                  onChange={(e) => setOpportunityForm({...opportunityForm, description: e.target.value})}
                  rows="4"
                  required
                />
              </div>

              <div className="form-group">
                <label>Key Highlights</label>
                {opportunityForm.highlights.map((highlight, index) => (
                  <div key={index} className="highlight-input-row">
                    <input
                      type="text"
                      value={highlight}
                      onChange={(e) => updateHighlight(index, e.target.value)}
                      placeholder="Enter a highlight"
                    />
                    {opportunityForm.highlights.length > 1 && (
                      <button 
                        type="button" 
                        className="btn-remove-highlight"
                        onClick={() => removeHighlight(index)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-add-highlight" onClick={addHighlight}>
                  + Add Highlight
                </button>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Min Investment ($) *</label>
                  <input
                    type="number"
                    value={opportunityForm.minInvestment}
                    onChange={(e) => setOpportunityForm({...opportunityForm, minInvestment: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Total Value ($) *</label>
                  <input
                    type="number"
                    value={opportunityForm.totalValue}
                    onChange={(e) => setOpportunityForm({...opportunityForm, totalValue: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expected ROI (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={opportunityForm.expectedROI}
                    onChange={(e) => setOpportunityForm({...opportunityForm, expectedROI: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Duration *</label>
                  <input
                    type="text"
                    value={opportunityForm.duration}
                    onChange={(e) => setOpportunityForm({...opportunityForm, duration: e.target.value})}
                    placeholder="e.g., 36 months"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Risk Level *</label>
                  <select
                    value={opportunityForm.riskLevel}
                    onChange={(e) => setOpportunityForm({...opportunityForm, riskLevel: e.target.value})}
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={opportunityForm.status}
                    onChange={(e) => setOpportunityForm({...opportunityForm, status: e.target.value})}
                    required
                  >
                    <option value="Open">Open</option>
                    <option value="Funding">Funding</option>
                    <option value="Closed">Closed</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Available Shares (%) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={opportunityForm.availableShares}
                    onChange={(e) => setOpportunityForm({...opportunityForm, availableShares: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Projected Completion *</label>
                  <input
                    type="text"
                    value={opportunityForm.projectedCompletion}
                    onChange={(e) => setOpportunityForm({...opportunityForm, projectedCompletion: e.target.value})}
                    placeholder="e.g., Q3 2024"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Upload Images (Optional)</label>
                <p className="form-helper-text">Upload images to showcase the investment opportunity. Maximum 5MB per image. Supported formats: JPG, PNG, GIF, WebP.</p>
                
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="file-input"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="btn-upload-image">
                  📁 Choose Images
                </label>
                
                {opportunityForm.images.length > 0 && (
                  <div className="image-preview-grid">
                    {opportunityForm.images.map((image, index) => (
                      <div key={index} className="image-preview-item">
                        <img 
                          src={image} 
                          alt={`Preview ${index + 1}`}
                        />
                        <button
                          type="button"
                          className="btn-remove-image-preview"
                          onClick={() => removeImage(index)}
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="sa-modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowOpportunityModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save-opportunity">
                  {editingOpportunity ? 'Update Opportunity' : 'Create Opportunity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Permissions Modal */}
      {showPermissionsModal && (
        <div className="sa-modal-overlay" onClick={() => setShowPermissionsModal(false)}>
          <div className="sa-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h2>{isEditMode ? 'Edit Admin Permissions' : 'Set Admin Permissions'}</h2>
              <button 
                className="sa-modal-close" 
                onClick={() => setShowPermissionsModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="sa-modal-body">
              <div className="permission-section">
                <label>Countries (Leave empty for all countries)</label>
                <select onChange={handleCountryChange} value="">
                  <option value="">Select a country to add</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="India">India</option>
                  <option value="China">China</option>
                  <option value="Japan">Japan</option>
                  <option value="Brazil">Brazil</option>
                  <option value="Mexico">Mexico</option>
                  <option value="UAE">UAE</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Other">Other</option>
                </select>
                <div className="selected-items">
                  {adminPermissions.countries.map((country) => (
                    <span key={country} className="tag">
                      {country}
                      <button onClick={() => removeCountry(country)}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="permission-section">
                <label>Asset Types (Leave empty for all types)</label>
                <select onChange={handleAssetTypeChange} value="">
                  <option value="">Select an asset type to add</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Smart Cities">Smart Cities</option>
                  <option value="Urban Agriculture">Urban Agriculture</option>
                  <option value="Digital Assets">Digital Assets</option>
                  <option value="Alternative Assets">Alternative Assets</option>
                  <option value="Social Assets">Social Assets</option>
                </select>
                <div className="selected-items">
                  {adminPermissions.assetTypes.map((assetType) => (
                    <span key={assetType} className="tag">
                      {assetType}
                      <button onClick={() => removeAssetType(assetType)}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="permission-section">
                <label>Investment Amount Range (Leave empty for no limit)</label>
                <div className="amount-range">
                  <div className="amount-input">
                    <label>Minimum Amount ($)</label>
                    <input
                      type="number"
                      placeholder="e.g., 1000"
                      value={adminPermissions.minAmount}
                      onChange={(e) => setAdminPermissions({
                        ...adminPermissions,
                        minAmount: e.target.value
                      })}
                    />
                  </div>
                  <div className="amount-input">
                    <label>Maximum Amount ($)</label>
                    <input
                      type="number"
                      placeholder="e.g., 100000"
                      value={adminPermissions.maxAmount}
                      onChange={(e) => setAdminPermissions({
                        ...adminPermissions,
                        maxAmount: e.target.value
                      })}
                    />
                  </div>
                </div>
              </div>

              <p className="permission-note">
                <strong>Note:</strong> If no restrictions are set, the admin will have access to all applications.
              </p>
            </div>

            <div className="sa-modal-footer">
              <button 
                className="btn-cancel" 
                onClick={() => setShowPermissionsModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-confirm" 
                onClick={handlePromoteWithPermissions}
              >
                {isEditMode ? 'Update Permissions' : 'Promote to Admin'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedInvestment && (
        <div className="modal-overlay" onClick={closeApprovalModal}>
          <div className="approval-modal" onClick={(e) => e.stopPropagation()}>
            <div className="approval-modal-header">
              <h2>Final Approval Review</h2>
              <button className="sa-modal-close" onClick={closeApprovalModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="approval-modal-body">
              <div className="approval-summary">
                <div className="approval-summary-item">
                  <span className="approval-summary-label">Investment</span>
                  <span className="approval-summary-value investment-name">{selectedInvestment.investmentName}</span>
                </div>
                <div className="approval-summary-item">
                  <span className="approval-summary-label">Amount</span>
                  <span className="approval-summary-value amount-large">{formatCurrency(selectedInvestment.investmentAmount)}</span>
                </div>
              </div>

              <div className="approval-details-grid">
                <div className="detail-section">
                  <h4>Investor Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{selectedInvestment.fullName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedInvestment.user?.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{selectedInvestment.phone}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{selectedInvestment.city}, {selectedInvestment.state}, {selectedInvestment.country}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{selectedInvestment.address}, {selectedInvestment.zipCode}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Investment Details</h4>
                  <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value capitalize">{selectedInvestment.investmentType}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Payment Method:</span>
                    <span className="detail-value capitalize">{selectedInvestment.paymentMethod.replace('-', ' ')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Submitted:</span>
                    <span className="detail-value">{new Date(selectedInvestment.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Admin Approved By:</span>
                    <span className="detail-value">{selectedInvestment.approvedByAdmin?.name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Admin Approved On:</span>
                    <span className="detail-value">{new Date(selectedInvestment.adminApprovedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {selectedInvestment.adminNotes && (
                <div className="existing-notes">
                  <h4>Previous Admin Notes</h4>
                  <p>{selectedInvestment.adminNotes}</p>
                </div>
              )}

              <div className="approval-notes-section">
                <h4>Super Admin Notes {selectedInvestment?.status === 'approved' ? '' : '(Optional)'}</h4>
                {selectedInvestment?.status === 'approved' ? (
                  <p className="notes-help">{selectedInvestment.superAdminNotes || approvalNotes || 'No notes were added during approval.'}</p>
                ) : (
                  <>
                    <p className="notes-help">These notes will be visible to the user in their application status.</p>
                    <textarea
                      value={approvalNotes}
                      onChange={(e) => setApprovalNotes(e.target.value)}
                      placeholder="Add any notes or comments for the investor..."
                      rows="4"
                    />
                  </>
                )}
              </div>
            </div>

            <div className="approval-modal-footer">
              <button className="btn-cancel" onClick={closeApprovalModal}>
                {selectedInvestment?.status === 'approved' ? 'Close' : 'Cancel'}
              </button>
              {selectedInvestment?.status !== 'approved' && (
                <button className="btn-approve-final" onClick={handleFinalApprove}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Approve & Add to Portfolio
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdmin;
