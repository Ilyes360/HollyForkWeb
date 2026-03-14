import React from 'react';
import './KPICard.css';

const KPICard = ({ title, value, trend, trendValue, details, objective, reviews }) => {
  const isPositive = trend === 'up' && (title !== 'FOOD COST');
  const isNegative = trend === 'down' || (trend === 'up' && title === 'FOOD COST');
  
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <h3 className="kpi-title">{title}</h3>
      </div>
      <div className="kpi-content">
        <div className="kpi-value">{value}</div>
        {trend && (
          <div className={`kpi-trend ${isPositive ? 'positive' : isNegative ? 'negative' : ''}`}>
            <span className="trend-icon">
              {trend === 'up' ? '↑' : '↓'}
            </span>
            <span className="trend-value">{trendValue}</span>
          </div>
        )}
      </div>
      {details && (
        <div className="kpi-details">
          {details.map((detail, index) => (
            <div key={index} className="detail-item">
              <span className="detail-label">{detail.label}</span>
              <span className="detail-value">{detail.value}</span>
            </div>
          ))}
        </div>
      )}
      {objective && (
        <div className="kpi-objective">
          Objectif: {objective}
        </div>
      )}
      {reviews && (
        <div className="kpi-reviews">
          {reviews} avis ce mois
        </div>
      )}
    </div>
  );
};

export default KPICard;

