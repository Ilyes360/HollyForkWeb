import React from 'react';
import './Header.css';

const Header = ({ activePage }) => {
  const searchPlaceholder = activePage === 'planning' 
    ? 'Rechercher un employé...' 
    : 'Rechercher...';

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand">
          <h1 className="brand-name">Holly Fork</h1>
          <p className="brand-subtitle">Gestion restaurant</p>
        </div>
      </div>
      
      <div className="header-center">
        <div className="location-selector">
          <span>Holly Fork Paris Centre</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9L1 4H11L6 9Z" fill="currentColor"/>
          </svg>
        </div>
      </div>
      
      <div className="header-right">
        <div className="search-bar">
          <span className="search-icon">Q</span>
          <input type="text" placeholder={searchPlaceholder} />
        </div>
        <div className="notification-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 2C7.24 2 5 4.24 5 7V11L3 13V14H17V13L15 11V7C15 4.24 12.76 2 10 2Z" fill="currentColor"/>
            <path d="M8 16H12C12 17.1 11.1 18 10 18C8.9 18 8 17.1 8 16Z" fill="currentColor"/>
          </svg>
          <span className="notification-dot"></span>
        </div>
        <div className="user-avatar">
          <span>JD</span>
        </div>
      </div>
    </header>
  );
};

export default Header;

