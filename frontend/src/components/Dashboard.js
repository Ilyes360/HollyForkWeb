import React from 'react';
import KPICard from './KPICard';
import MapWidget from './MapWidget';
import SalesWidget from './SalesWidget';
import TeamPlanning from './TeamPlanning';
import Reservations from './Reservations';
import SupplierOrders from './SupplierOrders';
import './Dashboard.css';

const Dashboard = () => {
  const kpiData = [
    {
      title: 'CA JOUR',
      value: '3 245 €',
      trend: 'up',
      trendValue: '+12% vs hier',
    },
    {
      title: 'CA MOIS',
      value: '78 340 €',
      trend: 'up',
      trendValue: '+8% vs M-1',
    },
    {
      title: 'TAUX DE REMPLISSAGE',
      value: '87%',
      trend: 'up',
      trendValue: '+5%',
      details: [
        { label: 'Midi', value: '92%' },
        { label: 'Soir', value: '82%' },
      ],
    },
    {
      title: 'COUVERTS',
      value: '142',
      trend: 'down',
      trendValue: '-3%',
      details: [
        { label: 'Semaine', value: '896' },
      ],
    },
    {
      title: 'FOOD COST',
      value: '28.5%',
      trend: 'up',
      trendValue: '+1.2%',
      objective: '27%',
    },
    {
      title: 'SATISFACTION',
      value: '4.6/5',
      trend: 'up',
      trendValue: '+0.2',
      reviews: '47',
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="kpi-grid">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>
        
        <div className="widgets-row">
          <div className="widget-column">
            <MapWidget />
          </div>
          <div className="widget-column">
            <SalesWidget />
          </div>
        </div>

        <TeamPlanning />
        <Reservations />
        <SupplierOrders />
      </div>
    </div>
  );
};

export default Dashboard;

