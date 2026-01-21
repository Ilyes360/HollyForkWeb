import React from 'react';
import './SalesWidget.css';

const SalesWidget = () => {
  const categories = [
    { name: 'Plats', amount: '1,460 €', percentage: 100 },
    { name: 'Boissons', amount: '812 €', percentage: 56 },
    { name: 'Entrées', amount: '584 €', percentage: 40 },
    { name: 'Desserts', amount: '389 €', percentage: 27 },
  ];

  const trendData = [
    { day: 'Lun', value: 45 },
    { day: 'Mar', value: 48 },
    { day: 'Mer', value: 50 },
    { day: 'Jeu', value: 55 },
    { day: 'Ven', value: 65 },
    { day: 'Sam', value: 85 },
    { day: 'Dim', value: 80 },
  ];

  const maxValue = Math.max(...trendData.map(d => d.value));

  return (
    <div className="sales-widget">
      <div className="sales-section">
        <h3 className="widget-title">Ventes par catégorie</h3>
        <div className="categories-list">
          {categories.map((category, index) => (
            <div key={index} className="category-item">
              <div className="category-header">
                <span className="category-name">{category.name}</span>
                <span className="category-amount">{category.amount}</span>
              </div>
              <div className="category-bar">
                <div 
                  className="category-bar-fill" 
                  style={{ width: `${category.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="trend-section">
        <h3 className="widget-title">Courbe de tendance</h3>
        <div className="trend-chart">
          <div className="chart-bars">
            {trendData.map((data, index) => (
              <div key={index} className="chart-bar-container">
                <div 
                  className="chart-bar" 
                  style={{ height: `${(data.value / maxValue) * 100}%` }}
                ></div>
                <span className="chart-label">{data.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesWidget;

