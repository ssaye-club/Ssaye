import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import logo from '../images/logo.png';
import './Navbar.css';

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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
          <li className="navbar-item">
            <Link 
              to="/" 
              className={`navbar-link ${isActive('/') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Home
            </Link>
          </li>
          <li className="navbar-item">
            <Link 
              to="/assets" 
              className={`navbar-link ${isActive('/assets') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Assets
            </Link>
          </li>
          <li className="navbar-item">
            <Link 
              to="/smart-city" 
              className={`navbar-link ${isActive('/smart-city') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Smart City
            </Link>
          </li>
          <li className="navbar-item">
            <Link 
              to="/farms" 
              className={`navbar-link ${isActive('/farms') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Farms
            </Link>
          </li>
          <li className="navbar-item">
            <Link 
              to="/blog" 
              className={`navbar-link ${isActive('/blog') ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              Blog
            </Link>
          </li>
          {isAuthenticated() ? (
            <li className="navbar-item navbar-user">
              <div className="user-menu-container">
                <button className="user-menu-btn" onClick={toggleUserMenu}>
                  <span className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</span>
                  <span className="user-name">{user?.name}</span>
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown">
                    <div className="user-info">
                      <p className="user-info-name">{user?.name}</p>
                      <p className="user-info-email">{user?.email}</p>
                    </div>
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
