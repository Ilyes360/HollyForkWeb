import React from 'react';
import './MapWidget.css';

const MapWidget = () => {
  return (
    <div className="map-widget">
      <div className="map-placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#999"/>
        </svg>
        <p className="map-text">Carte interactive avec pins</p>
        <p className="map-subtext">Restaurant • Fournisseurs</p>
      </div>
      <div className="map-stats">
        <div className="stat-item">
          <span className="stat-label">Établissements</span>
          <span className="stat-value">3</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Fournisseurs</span>
          <span className="stat-value">12</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Délai moyen</span>
          <span className="stat-value">2.4h</span>
        </div>
      </div>
    </div>
  );
};

export default MapWidget;

