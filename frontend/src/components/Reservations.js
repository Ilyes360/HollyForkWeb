import React, { useState } from 'react';
import './Reservations.css';

const Reservations = () => {
  const [activePeriod, setActivePeriod] = useState('Midi');

  const reservations = [
    { client: 'Martin Dupont', heure: '12:30', couverts: 4, canal: 'Site', statut: 'Confirmée', statutType: 'confirmed' },
    { client: 'Sophie Bernard', heure: '13:00', couverts: 2, canal: 'Téléphone', statut: 'Arrivée', statutType: 'arrived' },
    { client: 'Jean Moreau', heure: '19:30', couverts: 6, canal: 'TheFork', statut: 'Confirmée', statutType: 'confirmed' },
    { client: 'Marie Leclerc', heure: '20:00', couverts: 3, canal: 'Site', statut: 'En Attente', statutType: 'pending' },
    { client: 'Pierre Dubois', heure: '20:30', couverts: 2, canal: 'Téléphone', statut: 'Confirmée', statutType: 'confirmed' },
  ];

  const getStatusClass = (type) => {
    switch (type) {
      case 'confirmed':
        return 'status-badge confirmed';
      case 'arrived':
        return 'status-badge arrived';
      case 'pending':
        return 'status-badge pending';
      default:
        return 'status-badge';
    }
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'confirmed':
      case 'arrived':
        return '✓';
      case 'pending':
        return '!';
      default:
        return '';
    }
  };

  return (
    <div className="reservations-widget">
      <div className="widget-header">
        <h2 className="widget-title">Réservations du jour</h2>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${activePeriod === 'Midi' ? 'active' : ''}`}
            onClick={() => setActivePeriod('Midi')}
          >
            Midi
          </button>
          <button
            className={`filter-btn ${activePeriod === 'Soir' ? 'active' : ''}`}
            onClick={() => setActivePeriod('Soir')}
          >
            Soir
          </button>
        </div>
      </div>
      <div className="table-container">
        <table className="reservations-table">
          <thead>
            <tr>
              <th>CLIENT</th>
              <th>HEURE</th>
              <th>COUVERTS</th>
              <th>CANAL</th>
              <th>STATUT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation, index) => (
              <tr key={index}>
                <td className="client-name">{reservation.client}</td>
                <td>{reservation.heure}</td>
                <td>{reservation.couverts}</td>
                <td>{reservation.canal}</td>
                <td>
                  <span className={getStatusClass(reservation.statutType)}>
                    {getStatusIcon(reservation.statutType)} {reservation.statut}
                  </span>
                </td>
                <td>
                  <button className="action-btn">Voir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reservations;

