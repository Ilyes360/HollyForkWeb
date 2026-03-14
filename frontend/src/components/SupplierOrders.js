import React, { useState } from 'react';
import './SupplierOrders.css';

const SupplierOrders = () => {
  const [activeFilter, setActiveFilter] = useState('Tous');

  const orders = [
    {
      produit: 'Filet de bœuf',
      fournisseur: 'Boucherie Moderne',
      prix: '28.90 €/kg',
      variation: '-2.3%',
      variationType: 'down',
      stock: 'Faible',
      stockType: 'low',
      derniereCmd: '3j',
    },
    {
      produit: 'Saumon frais',
      fournisseur: 'Océan Frais',
      prix: '22.50 €/kg',
      variation: '+5.1%',
      variationType: 'up',
      stock: 'Moyen',
      stockType: 'medium',
      derniereCmd: '1j',
    },
    {
      produit: 'Tomates bio',
      fournisseur: 'Potager Local',
      prix: '3.20 €/kg',
      variation: '-0.8%',
      variationType: 'down',
      stock: 'Bon',
      stockType: 'good',
      derniereCmd: '2j',
    },
    {
      produit: 'Huile d\'olive',
      fournisseur: 'Epicerie Fine',
      prix: '18.90 €/L',
      variation: '+1.2%',
      variationType: 'up',
      stock: 'Bon',
      stockType: 'good',
      derniereCmd: '5j',
    },
    {
      produit: 'Vin rouge AOC',
      fournisseur: 'Cave Sélection',
      prix: '12.40 €/btl',
      variation: '0%',
      variationType: 'neutral',
      stock: 'Faible',
      stockType: 'low',
      derniereCmd: '7j',
    },
  ];

  const getStockClass = (type) => {
    switch (type) {
      case 'low':
        return 'stock-badge low';
      case 'medium':
        return 'stock-badge medium';
      case 'good':
        return 'stock-badge good';
      default:
        return 'stock-badge';
    }
  };

  const getVariationClass = (type) => {
    switch (type) {
      case 'up':
        return 'variation up';
      case 'down':
        return 'variation down';
      default:
        return 'variation neutral';
    }
  };

  return (
    <div className="supplier-orders-widget">
      <div className="widget-header">
        <h2 className="widget-title">Commandes fournisseurs & prix en direct</h2>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${activeFilter === 'Tous' ? 'active' : ''}`}
            onClick={() => setActiveFilter('Tous')}
          >
            <span className="filter-icon">📦</span> Tous
          </button>
          <button
            className={`filter-btn ${activeFilter === 'Tendance baisse' ? 'active' : ''}`}
            onClick={() => setActiveFilter('Tendance baisse')}
          >
            Tendance baisse
          </button>
        </div>
      </div>
      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>PRODUIT</th>
              <th>FOURNISSEUR</th>
              <th>PRIX ACTUEL</th>
              <th>VARIATION</th>
              <th>STOCK</th>
              <th>DERNIÈRE CMD</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={index}>
                <td className="product-name">{order.produit}</td>
                <td>{order.fournisseur}</td>
                <td className="price">{order.prix}</td>
                <td>
                  <span className={getVariationClass(order.variationType)}>
                    {order.variationType === 'up' && '↑'}
                    {order.variationType === 'down' && '↓'}
                    {order.variation}
                  </span>
                </td>
                <td>
                  <span className={getStockClass(order.stockType)}>
                    {order.stock}
                  </span>
                </td>
                <td>{order.derniereCmd}</td>
                <td>
                  <button className="order-btn">Commander</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupplierOrders;

