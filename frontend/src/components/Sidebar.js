import React from 'react';
import './Sidebar.css';

const Sidebar = ({ activePage, setActivePage }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'planning', label: 'Planning', icon: '📅' },
    { id: 'reservations', label: 'Réservations', icon: '📅' },
    { id: 'salle', label: 'Salle', icon: '🍽️' },
    { id: 'cuisine', label: 'Cuisine', icon: '👨‍🍳' },
    { id: 'administration', label: 'Administration', icon: '⚙️' },
    { id: 'fournisseurs', label: 'Fournisseurs', icon: '🚚' },
    { id: 'stocks', label: 'Stocks', icon: '📦' },
    { id: 'parametres', label: 'Paramètres', icon: '🔧' },
  ];

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => setActivePage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

