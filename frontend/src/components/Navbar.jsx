import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import '../styles/Navbar.css';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container container">
        {/* Logo */}
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="navbar-logo">🏏</span>
          <div className="navbar-brand-text">
            <span className="navbar-title">Campus Cricket</span>
            <span className="navbar-subtitle">NIT Srinagar</span>
          </div>
        </Link>

        {/* Connection indicator */}
        <div className={`connection-indicator ${connected ? 'connected' : 'disconnected'}`}>
          <span className="connection-dot"></span>
          <span className="connection-text">{connected ? 'Live' : 'Offline'}</span>
        </div>

        {/* Hamburger */}
        <button
          className={`navbar-hamburger ${menuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Nav Links */}
        <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          <Link to="/" className="navbar-link" onClick={closeMenu}>
            Home
          </Link>
          <Link to="/" className="navbar-link" onClick={closeMenu}>
            Live Matches
          </Link>

          <div className="navbar-divider"></div>

          {isAuthenticated ? (
            <>
              <span className="navbar-user">
                👤 {user?.username || 'User'}
              </span>
              {user?.role === 'admin' && (
                <Link to="/admin/setup" className="navbar-link navbar-link-admin" onClick={closeMenu}>
                  Admin Panel
                </Link>
              )}
              <button className="btn btn-ghost btn-sm navbar-logout" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/admin/login" className="btn btn-accent btn-sm" onClick={closeMenu}>
              🔐 Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
