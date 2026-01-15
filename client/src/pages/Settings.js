import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Settings.css';

function Settings() {
  const { user, token, logout, login, loading: authLoading } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  // Profile settings
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    investmentUpdates: true,
    portfolioAlerts: true,
    marketingEmails: false
  });

  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    
    if (!token) {
      navigate('/login');
      return;
    }

    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user, token, navigate, authLoading]);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleNotificationChange = (e) => {
    setNotifications({
      ...notifications,
      [e.target.name]: e.target.checked
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (response.ok) {
        // Update user in context
        login(token, { ...user, ...data.user });
        showToast('Profile updated successfully', 'success');
      } else {
        showToast(data.message || 'Failed to update profile', 'error');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Password changed successfully', 'success');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showToast(data.message || 'Failed to change password', 'error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showToast('Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/update-notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notifications)
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Notification preferences updated', 'success');
      } else {
        showToast(data.message || 'Failed to update preferences', 'error');
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      showToast('Failed to update preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      'This will permanently delete all your data. Are you absolutely sure?'
    );

    if (!doubleConfirm) return;

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToast('Account deleted successfully', 'success');
        logout();
        navigate('/');
      } else {
        const data = await response.json();
        showToast(data.message || 'Failed to delete account', 'error');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast('Failed to delete account', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return null;
  }

  if (!token) {
    return null;
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1>Account Settings</h1>
          <p>Manage your account preferences and security</p>
        </div>

        <div className="settings-content">
          <div className="settings-tabs">
            <button
              className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <i className="icon-user"></i>
              Profile
            </button>
            <button
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <i className="icon-lock"></i>
              Security
            </button>
            <button
              className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <i className="icon-bell"></i>
              Notifications
            </button>
            <button
              className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <i className="icon-settings"></i>
              Account
            </button>
          </div>

          <div className="settings-panel">
            {activeTab === 'profile' && (
              <div className="settings-section">
                <h2>Profile Information</h2>
                <p className="section-description">Update your personal information</p>
                
                <form onSubmit={handleProfileUpdate} className="settings-form">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      required
                      minLength={2}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>

                  <div className="user-info-display">
                    <div className="info-item">
                      <span className="info-label">Account Type:</span>
                      <span className="info-value">
                        {user?.isSuperAdmin ? 'Super Admin' : user?.isAdmin ? 'Admin' : user?.isPremium ? 'Premium' : 'Standard'}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Member Since:</span>
                      <span className="info-value">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="settings-section">
                <h2>Security Settings</h2>
                <p className="section-description">Change your password to keep your account secure</p>
                
                <form onSubmit={handlePasswordUpdate} className="settings-form">
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                    />
                    <small>Minimum 6 characters</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm New Password</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                    />
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Updating...' : 'Change Password'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="settings-section">
                <h2>Notification Preferences</h2>
                <p className="section-description">Choose what notifications you want to receive</p>
                
                <form onSubmit={handleNotificationUpdate} className="settings-form">
                  <div className="notification-options">
                    <div className="notification-item">
                      <div className="notification-info">
                        <label htmlFor="emailNotifications">Email Notifications</label>
                        <p>Receive general email notifications</p>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          id="emailNotifications"
                          name="emailNotifications"
                          checked={notifications.emailNotifications}
                          onChange={handleNotificationChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="notification-item">
                      <div className="notification-info">
                        <label htmlFor="investmentUpdates">Investment Updates</label>
                        <p>Get notified about your investment performance and opportunities</p>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          id="investmentUpdates"
                          name="investmentUpdates"
                          checked={notifications.investmentUpdates}
                          onChange={handleNotificationChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="notification-item">
                      <div className="notification-info">
                        <label htmlFor="portfolioAlerts">Portfolio Alerts</label>
                        <p>Receive alerts about significant portfolio changes</p>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          id="portfolioAlerts"
                          name="portfolioAlerts"
                          checked={notifications.portfolioAlerts}
                          onChange={handleNotificationChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>

                    <div className="notification-item">
                      <div className="notification-info">
                        <label htmlFor="marketingEmails">Marketing Emails</label>
                        <p>Receive promotional offers and news</p>
                      </div>
                      <label className="switch">
                        <input
                          type="checkbox"
                          id="marketingEmails"
                          name="marketingEmails"
                          checked={notifications.marketingEmails}
                          onChange={handleNotificationChange}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="settings-section">
                <h2>Account Management</h2>
                <p className="section-description">Manage your account and data</p>
                
                <div className="account-actions">
                  {!user?.isAdmin && !user?.isSuperAdmin && (
                    <div className="action-card">
                      <h3>Upgrade to Premium</h3>
                      <p>Get access to exclusive investment opportunities and features</p>
                      <button 
                        className="btn-upgrade"
                        onClick={() => navigate('/premium')}
                        disabled={user?.isPremium}
                      >
                        {user?.isPremium ? 'You are Premium' : 'Upgrade Now'}
                      </button>
                    </div>
                  )}

                  <div className="action-card danger">
                    <h3>Delete Account</h3>
                    <p>Permanently delete your account and all associated data</p>
                    <button 
                      className="btn-danger"
                      onClick={handleDeleteAccount}
                      disabled={loading}
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
