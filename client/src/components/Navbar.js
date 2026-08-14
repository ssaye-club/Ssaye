import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { lockScroll, unlockScroll } from '../utils/scrollLock';
import logo from '../images/logo.png';
import './Navbar.css';

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [livingOpen, setLivingOpen] = useState(false);
  const [farmsOpen, setFarmsOpen] = useState(false);
  const livingRef = useRef(null);
  const farmsRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useContext(AuthContext);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock/unlock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      lockScroll();
    } else {
      unlockScroll();
    }

    // Cleanup function to ensure scroll is unlocked when component unmounts
    return () => {
      unlockScroll();
    };
  }, [mobileMenuOpen]);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    closeMobileMenu();
    navigate('/');
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (livingRef.current && !livingRef.current.contains(e.target)) {
        setLivingOpen(false);
      }
      if (farmsRef.current && !farmsRef.current.contains(e.target)) {
        setFarmsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
          <img src={logo} alt="Ssaye Logo" className="navbar-logo-img" />
        </Link>

        <button 
          className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`navbar-menu ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
          {!user?.isAdmin && !user?.isSuperAdmin && (
            <>
              <li className="navbar-item">
                <Link 
                  to="/" 
                  className={`navbar-link ${isActive('/') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <span>Home</span>
                  <svg className="mobile-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </Link>
              </li>
              <li className="navbar-item">
                <Link 
                  to="/assets" 
                  className={`navbar-link ${isActive('/assets') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <span>Assets</span>
                  <svg className="mobile-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </Link>
              </li>
              <li className="navbar-item">
                <Link 
                  to="/smart-city" 
                  className={`navbar-link ${isActive('/smart-city') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <span>Smart City</span>
                  <svg className="mobile-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </Link>
              </li>
              <li className="navbar-item navbar-item--has-dropdown" ref={livingRef}>
                <button
                  className={`navbar-link navbar-link--dropdown-trigger ${isActive('/marketplace') ? 'active' : ''}`}
                  onClick={() => setLivingOpen(!livingOpen)}
                  aria-haspopup="true"
                  aria-expanded={livingOpen}
                >
                  <span>Living Essentials</span>
                  <svg className={`nav-chevron ${livingOpen ? 'nav-chevron--open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                  <svg className="mobile-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
                {livingOpen && (
                  <ul className="nav-dropdown">
                    <li>
                      <Link
                        to="/marketplace"
                        className={`nav-dropdown-item ${isActive('/marketplace') ? 'nav-dropdown-item--active' : ''}`}
                        onClick={() => { setLivingOpen(false); closeMobileMenu(); }}
                      >
                        <span>Grocery</span>
                      </Link>
                    </li>
                    <li>
                      <span className="nav-dropdown-item nav-dropdown-item--disabled">
                        <span>Home Goods</span>
                        <span className="nav-dropdown-coming-soon">Coming Soon</span>
                      </span>
                    </li>
                  </ul>
                )}
              </li>
              <li className="navbar-item">
                <Link
                  to="/blog"
                  className={`navbar-link ${isActive('/blog') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <span>Blog</span>
                  <svg className="mobile-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </Link>
              </li>
            </>
          )}
          <li className="navbar-item navbar-item--has-dropdown" ref={farmsRef}>
            <button
              className={`navbar-link navbar-link--dropdown-trigger ${isActive('/farms') || isActive('/farms/events') ? 'active' : ''}`}
              onClick={() => setFarmsOpen(!farmsOpen)}
              aria-haspopup="true"
              aria-expanded={farmsOpen}
            >
              <span>Farms</span>
              <svg className={`nav-chevron ${farmsOpen ? 'nav-chevron--open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6"/>
              </svg>
              <svg className="mobile-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
            {farmsOpen && (
              <ul className="nav-dropdown">
                <li>
                  <Link
                    to="/farms"
                    className={`nav-dropdown-item ${isActive('/farms') ? 'nav-dropdown-item--active' : ''}`}
                    onClick={() => { setFarmsOpen(false); closeMobileMenu(); }}
                  >
                    <span>Overview</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/farms/events"
                    className={`nav-dropdown-item ${isActive('/farms/events') ? 'nav-dropdown-item--active' : ''}`}
                    onClick={() => { setFarmsOpen(false); closeMobileMenu(); }}
                  >
                    <span>Events</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>
          {isAuthenticated() && !user?.isAdmin && !user?.isSuperAdmin && (
            <li className="navbar-item">
              <Link 
                to="/portfolio" 
                className={`navbar-link navbar-link-portfolio ${isActive('/portfolio') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span>My Portfolio</span>
                <svg className="mobile-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </Link>
            </li>
          )}
          {isAuthenticated() && user?.isAdmin && !user?.isSuperAdmin && (
            <li className="navbar-item">
              <Link 
                to="/admin" 
                className={`navbar-link ${isActive('/admin') ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <span>Admin</span>
                <svg className="mobile-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </Link>
            </li>
          )}
          {isAuthenticated() && user?.isSuperAdmin && (
            <>
              <li className="navbar-item">
                <Link
                  to="/superadmin"
                  className={`navbar-link ${isActive('/superadmin') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <span>Super Admin</span>
                  <svg className="mobile-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </Link>
              </li>
              <li className="navbar-item">
                <Link
                  to="/marketplace-manager"
                  className={`navbar-link navbar-link-mm ${isActive('/marketplace-manager') ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <span>Marketplace Manager</span>
                  <svg className="mobile-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </Link>
              </li>
            </>
          )}
          {isAuthenticated() ? (
            <li className="navbar-item navbar-user">
              <div className="user-menu-container">
                <button className="user-menu-btn" onClick={toggleUserMenu}>
                  <span className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</span>
                  <span className="user-name">{user?.name}</span>
                  {user?.isPremium && (
                    <span className="user-premium-star" title="Premium Member">★</span>
                  )}
                  <svg className="dropdown-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-info">
                      <p className="user-info-name">{user?.name}</p>
                      <p className="user-info-email">{user?.email}</p>
                    </div>
                    {user?.isAdmin && !user?.isSuperAdmin && (
                      <Link 
                        to="/admin" 
                        className="dropdown-item dropdown-link"
                        onClick={() => { setUserMenuOpen(false); closeMobileMenu(); }}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    {user?.isSuperAdmin && (
                      <Link 
                        to="/superadmin" 
                        className="dropdown-item dropdown-link"
                        onClick={() => { setUserMenuOpen(false); closeMobileMenu(); }}
                      >
                        Super Admin Dashboard
                      </Link>
                    )}
                    {!user?.isAdmin && !user?.isSuperAdmin && (
                      <Link
                        to="/my-orders"
                        className="dropdown-item dropdown-link"
                        onClick={() => { setUserMenuOpen(false); closeMobileMenu(); }}
                      >
                        My Orders
                      </Link>
                    )}
                    <Link
                      to="/settings"
                      className="dropdown-item dropdown-link"
                      onClick={() => { setUserMenuOpen(false); closeMobileMenu(); }}
                    >
                      Settings
                    </Link>
                    <button className="dropdown-item" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </li>
          ) : (
            <>
              <li className="navbar-item">
                <Link to="/login" className="navbar-link" onClick={closeMobileMenu}>
                  Login
                </Link>
              </li>
              <li className="navbar-item navbar-cta">
                <Link to="/signup" className="btn-join" onClick={closeMobileMenu}>
                  Sign Up
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
