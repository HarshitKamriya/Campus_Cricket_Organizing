import React from 'react';
import '../styles/Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container container">
        <div className="footer-brand">
          <span className="footer-logo">🏏</span>
          <div className="footer-brand-text">
            <h3 className="footer-title">Campus Cricket</h3>
            <p className="footer-tagline">Live from NIT Srinagar</p>
          </div>
        </div>

        <div className="footer-info">
          <p className="footer-powered">
            Powered by <strong>NIT Srinagar Cricket Committee</strong>
          </p>
          <p className="footer-nit">
            National Institute of Technology, Srinagar — Jammu & Kashmir
          </p>
        </div>

        <div className="footer-social">
          <a href="#" className="footer-social-link" aria-label="Instagram" title="Instagram">
            📸
          </a>
          <a href="#" className="footer-social-link" aria-label="Twitter" title="Twitter">
            🐦
          </a>
          <a href="#" className="footer-social-link" aria-label="YouTube" title="YouTube">
            ▶️
          </a>
        </div>

        <div className="footer-bottom">
          <p>© {currentYear} Campus Cricket — NIT Srinagar. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
