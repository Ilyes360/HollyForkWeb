import React, { useState } from 'react';
import './TeamPlanning.css';

const TeamPlanning = () => {
  const [activeFilter, setActiveFilter] = useState('Salle');

  const filters = ['Salle', 'Cuisine', 'Bar', 'Administration'];

  const shifts = [
    { time: '11:00', role: 'Chef de rang', name: 'Alice M.', status: 'assigned' },
    { time: '11:00', role: 'Serveur', name: 'Thomas L.', status: 'assigned' },
    { time: '12:00', role: 'Serveur', name: 'Julie P.', status: 'assigned' },
    { time: '18:00', role: 'Chef de rang', name: 'Marc D.', status: 'assigned' },
    { time: '18:00', role: 'Serveur', name: 'Sophie B.', status: 'unassigned' },
    { time: '19:00', role: 'Serveur', name: 'Non assigné', status: 'unassigned' },
  ];

  return (
    <div className="team-planning-widget">
      <div className="widget-header">
        <h2 className="widget-title">Planning équipe</h2>
        <div className="filter-buttons">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      <div className="shifts-container">
        <div className="shifts-scroll">
          {shifts.map((shift, index) => (
            <div key={index} className={`shift-card ${shift.status === 'unassigned' ? 'unassigned' : ''}`}>
              <div className={`status-dot ${shift.status === 'assigned' ? 'assigned' : 'unassigned'}`}></div>
              <div className="shift-time">{shift.time}</div>
              <div className="shift-role">{shift.role}</div>
              <div className="shift-name">{shift.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamPlanning;

