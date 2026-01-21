import React, { useState } from 'react';
import './Planning.css';

const Planning = () => {
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const filters = ['Tous', 'Salle', 'Cuisine', 'Bar', 'Administration', 'Plonge'];

  const getWeekDates = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      days.push(dayDate);
    }
    const sunday = days[6];
    return { monday, sunday, days };
  };

  const { monday, sunday, days: weekDays } = getWeekDates(currentWeek);
  const weekRange = `Semaine du ${monday.getDate()} au ${sunday.getDate()} ${monday.toLocaleString('fr-FR', { month: 'long' })} ${monday.getFullYear()}`;
  
  const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  
  const formatDayHeader = (date, dayName) => {
    return `${dayName} ${date.getDate()}/${date.getMonth() + 1}`;
  };

  const employees = [
    {
      id: 1,
      name: 'Alice Martin',
      initials: 'AM',
      role: 'Chef de rang',
      weeklyHours: 42,
      color: '#e3f2fd',
      shifts: {
        0: [{ type: 'Midi', start: '11:00', end: '15:00' }, { type: 'Soir', start: '18:00', end: '23:00' }],
        1: [{ type: 'Soir', start: '18:00', end: '23:00' }],
        2: [{ type: 'Midi', start: '11:00', end: '15:00' }, { type: 'Soir', start: '18:00', end: '23:00' }],
        3: [{ type: 'Midi', start: '11:00', end: '15:00' }, { type: 'Soir', start: '18:00', end: '23:00' }],
        4: [{ type: 'Midi', start: '11:00', end: '15:00' }, { type: 'Soir', start: '18:00', end: '23:00' }],
        5: [],
        6: [],
      }
    },
    {
      id: 2,
      name: 'Thomas Dubois',
      initials: 'TD',
      role: 'Serveur',
      weeklyHours: 40,
      color: '#e3f2fd',
      shifts: {
        0: [{ type: 'Soir', start: '18:00', end: '23:00' }],
        1: [{ type: 'Soir', start: '18:00', end: '23:00' }],
        2: [{ type: 'Soir', start: '18:00', end: '23:00' }],
        3: [{ type: 'Soir', start: '18:00', end: '23:00' }],
        4: [{ type: 'Soir', start: '18:00', end: '23:00' }],
        5: [{ type: 'Midi', start: '11:00', end: '15:00' }, { type: 'Soir', start: '18:00', end: '23:00' }],
        6: [],
      }
    },
    {
      id: 3,
      name: 'Julie Leroy',
      initials: 'JL',
      role: 'Serveuse',
      weeklyHours: 38,
      color: '#e3f2fd',
      shifts: {
        0: [{ type: 'Midi', start: '11:00', end: '15:00' }],
        1: [{ type: 'Midi', start: '11:00', end: '15:00' }],
        2: [{ type: 'Midi', start: '11:00', end: '15:00' }],
        3: [{ type: 'Midi', start: '11:00', end: '15:00' }],
        4: [{ type: 'Midi', start: '11:00', end: '15:00' }],
        5: [],
        6: [],
      }
    },
    {
      id: 4,
      name: 'Marc Dupont',
      initials: 'MD',
      role: 'Chef de cuisine',
      weeklyHours: 45,
      color: '#fff3e0',
      shifts: {
        0: [{ type: 'Midi', start: '10:00', end: '15:00' }, { type: 'Soir', start: '17:00', end: '23:00' }],
        1: [{ type: 'Midi', start: '10:00', end: '15:00' }, { type: 'Soir', start: '17:00', end: '23:00' }],
        2: [{ type: 'Midi', start: '10:00', end: '15:00' }, { type: 'Soir', start: '17:00', end: '23:00' }],
        3: [{ type: 'Midi', start: '10:00', end: '15:00' }, { type: 'Soir', start: '17:00', end: '23:00' }],
        4: [],
        5: [],
        6: [],
      }
    },
    {
      id: 5,
      name: 'Sophie Bernard',
      initials: 'SB',
      role: 'Commis de cuisine',
      weeklyHours: 41,
      color: '#fff3e0',
      shifts: {
        0: [{ type: 'Midi', start: '11:00', end: '15:00' }],
        1: [{ type: 'Midi', start: '11:00', end: '15:00' }],
        2: [{ type: 'Midi', start: '11:00', end: '15:00' }],
        3: [{ type: 'Midi', start: '11:00', end: '15:00' }],
        4: [{ type: 'Midi', start: '11:00', end: '15:00' }],
        5: [],
        6: [],
      }
    },
    {
      id: 6,
      name: 'Pierre Moreau',
      initials: 'PM',
      role: 'Barman',
      weeklyHours: 38,
      color: '#f3e5f5',
      shifts: {
        0: [],
        1: [],
        2: [{ type: 'Soir', start: '18:00', end: '23:00' }],
        3: [{ type: 'Soir', start: '18:00', end: '23:00' }],
        4: [{ type: 'Soir', start: '18:00', end: '23:00' }],
        5: [{ type: 'Midi', start: '11:00', end: '15:00' }, { type: 'Soir', start: '18:00', end: '23:00' }],
        6: [{ type: 'Soir', start: '18:00', end: '23:00' }],
      }
    },
  ];

  // Capacity for each day and shift type
  const capacity = {
    midi: { 0: 4, 1: 4, 2: 4, 3: 4, 4: 5, 5: 5, 6: 3 },
    soir: { 0: 4, 1: 4, 2: 5, 3: 4, 4: 6, 5: 6, 6: 4 },
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newDate);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const getDayStaffing = (dayIndex) => {
    const midiCount = employees.reduce((sum, emp) => {
      const dayShifts = emp.shifts[dayIndex] || [];
      return sum + dayShifts.filter(s => s.type === 'Midi').length;
    }, 0);
    
    const soirCount = employees.reduce((sum, emp) => {
      const dayShifts = emp.shifts[dayIndex] || [];
      return sum + dayShifts.filter(s => s.type === 'Soir' || s.type === 'Journée').length;
    }, 0);

    const midiCap = capacity.midi[dayIndex];
    const soirCap = capacity.soir[dayIndex];

    const getStatus = (current, cap) => {
      if (current === 0) return 'critical';
      if (current < cap * 0.7) return 'low';
      if (current <= cap) return 'good';
      return 'over';
    };

    return {
      midi: { current: midiCount, capacity: midiCap, status: getStatus(midiCount, midiCap) },
      soir: { current: soirCount, capacity: soirCap, status: getStatus(soirCount, soirCap) },
    };
  };

  return (
    <div className="planning-page">
      <div className="planning-header">
        <div className="planning-title-section">
          <h1 className="planning-title">
            Planning général
            <span className="dropdown-icon">▼</span>
          </h1>
          <p className="planning-subtitle">Organisez les horaires de votre équipe</p>
        </div>
        
        <div className="planning-actions">
          <button className="action-btn secondary">Exporter</button>
          <button className="action-btn secondary">Dupliquer semaine</button>
          <button className="action-btn primary">+ Ajouter un shift</button>
        </div>
      </div>

      <div className="planning-filters">
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

      <div className="week-selector">
        <button className="nav-arrow" onClick={() => navigateWeek('prev')}>←</button>
        <div className="week-range">{weekRange}</div>
        <button className="nav-arrow" onClick={() => navigateWeek('next')}>→</button>
        <button className="today-btn" onClick={goToToday}>Aujourd'hui</button>
      </div>

      <div className="schedule-container">
        <table className="schedule-table">
          <thead>
            <tr>
              <th className="employee-col">EMPLOYÉ</th>
              {weekDays.map((date, index) => {
                const staffing = getDayStaffing(index);
                return (
                  <th key={index} className="day-col">
                    <div className="day-name">{formatDayHeader(date, dayNames[index])}</div>
                    <div className="day-hours">
                      <span className={`hours-badge midi ${staffing.midi.status}`}>
                        Midi {staffing.midi.current}/{staffing.midi.capacity}
                      </span>
                      <span className={`hours-badge soir ${staffing.soir.status}`}>
                        Soir {staffing.soir.current}/{staffing.soir.capacity}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td className="employee-cell">
                  <div className="employee-info">
                    <div className="employee-avatar" style={{ backgroundColor: employee.color }}>
                      {employee.initials}
                    </div>
                    <div className="employee-details">
                      <div className="employee-name">{employee.name}</div>
                      <div className="employee-role">{employee.role}</div>
                      <div className="employee-hours">{employee.weeklyHours}h/sem</div>
                    </div>
                  </div>
                </td>
                {weekDays.map((date, dayIndex) => (
                  <td key={dayIndex} className="shift-cell">
                    {employee.shifts[dayIndex] && employee.shifts[dayIndex].length > 0 ? (
                      <div className="shifts-container">
                        {employee.shifts[dayIndex].map((shift, idx) => (
                          <div
                            key={idx}
                            className="shift-block"
                            style={{ backgroundColor: employee.color }}
                          >
                            {shift.type} {shift.start}-{shift.end}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-shift">+</div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="planning-footer">
        <div className="summary-stats">
          <div className="stat-item">
            <div className="stat-label">Heures de la semaine</div>
            <div className="stat-value">313h</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Heures supplémentaires</div>
            <div className="stat-value">12h</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Coût estimé</div>
            <div className="stat-value">4,890 €</div>
          </div>
        </div>

        <div className="staffing-alerts">
          <h3 className="section-title">Alertes staffing</h3>
          <ul className="alerts-list">
            <li className="alert-item">Samedi midi: 2 personnes manquantes</li>
            <li className="alert-item">Dimanche midi: Aucun employé planifié</li>
            <li className="alert-item">Vendredi soir: 1 personne manquante</li>
          </ul>
        </div>

        <div className="quick-actions">
          <h3 className="section-title">Actions rapides</h3>
          <ul className="actions-list">
            <li className="action-item">Recruter un responsable</li>
            <li className="action-item">Dupliquer planning</li>
            <li className="action-item">Notifier l'équipe</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Planning;

