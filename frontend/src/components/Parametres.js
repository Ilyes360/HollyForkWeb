import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import './Parametres.css';
import './Auth.css';

export default function Parametres() {
  const { deleteAccount } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(true);
  const [mfaSetup, setMfaSetup] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaDisablePassword, setMfaDisablePassword] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/auth/mfa/status/').then(({ data }) => {
      setMfaEnabled(data.mfa_enabled);
    }).catch(() => {}).finally(() => setMfaLoading(false));
  }, []);

  const handleMfaSetup = async () => {
    setMfaError('');
    setMfaSuccess('');
    try {
      const { data } = await axios.post('/api/auth/mfa/setup/');
      setMfaSetup({ secret: data.secret, otpauth_url: data.otpauth_url });
      setMfaCode('');
    } catch (e) {
      setMfaError(e.response?.data?.detail || 'Erreur');
    }
  };

  const handleMfaConfirm = async (e) => {
    e.preventDefault();
    setMfaError('');
    setMfaSuccess('');
    try {
      await axios.post('/api/auth/mfa/confirm/', { code: mfaCode });
      setMfaEnabled(true);
      setMfaSetup(null);
      setMfaCode('');
      setMfaSuccess('MFA activé. Vous devrez entrer un code à chaque connexion.');
    } catch (e) {
      setMfaError(e.response?.data?.detail || 'Code invalide.');
    }
  };

  const handleMfaDisable = async (e) => {
    e.preventDefault();
    setMfaError('');
    setMfaSuccess('');
    try {
      await axios.post('/api/auth/mfa/disable/', { password: mfaDisablePassword });
      setMfaEnabled(false);
      setMfaDisablePassword('');
      setMfaSuccess('MFA désactivé.');
    } catch (e) {
      setMfaError(e.response?.data?.detail || 'Erreur.');
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      setShowDeleteModal(false);
      navigate('/login', { replace: true });
    } catch (e) {
      setDeleting(false);
    }
    setDeleting(false);
  };

  return (
    <div className="parametres-page">
      <h1 className="parametres-title">Paramètres</h1>

      <section className="parametres-section">
        <h2 className="parametres-section-title">Authentification à deux facteurs (MFA)</h2>
        <p className="parametres-section-desc">
          Protégez votre compte avec un code de vérification à 6 chiffres (application type Google Authenticator).
        </p>
        {mfaLoading ? (
          <p className="parametres-mfa-status">Chargement...</p>
        ) : mfaSetup ? (
          <form onSubmit={handleMfaConfirm} className="parametres-mfa-setup">
            <p className="parametres-mfa-qr-label">Scannez ce QR code avec votre application :</p>
            <div className="parametres-mfa-qr-wrap">
              <QRCodeSVG value={mfaSetup.otpauth_url} size={180} level="M" />
            </div>
            <p className="parametres-mfa-secret-label">Ou entrez ce code manuellement :</p>
            <code className="parametres-mfa-secret">{mfaSetup.secret}</code>
            {mfaError && <div className="auth-error">{mfaError}</div>}
            <label>
              Code de vérification
              <input
                type="text"
                inputMode="numeric"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="auth-input-mfa"
              />
            </label>
            <div className="parametres-mfa-actions">
              <button type="button" className="auth-modal-btn auth-modal-btn--secondary" onClick={() => { setMfaSetup(null); setMfaError(''); }}>
                Annuler
              </button>
              <button type="submit" className="auth-modal-btn">Activer MFA</button>
            </div>
          </form>
        ) : mfaEnabled ? (
          <div className="parametres-mfa-disable">
            <p className="parametres-mfa-status parametres-mfa-status--on">MFA activé</p>
            {mfaSuccess && <div className="parametres-mfa-success">{mfaSuccess}</div>}
            {mfaError && <div className="auth-error">{mfaError}</div>}
            <form onSubmit={handleMfaDisable}>
              <label>
                Mot de passe pour désactiver
                <input
                  type="password"
                  value={mfaDisablePassword}
                  onChange={(e) => setMfaDisablePassword(e.target.value)}
                  placeholder="••••••••"
                />
              </label>
              <button type="submit" className="parametres-delete-account-btn parametres-mfa-disable-btn">Désactiver MFA</button>
            </form>
          </div>
        ) : (
          <>
            {mfaSuccess && <div className="parametres-mfa-success">{mfaSuccess}</div>}
            {mfaError && <div className="auth-error">{mfaError}</div>}
            <button type="button" className="parametres-mfa-enable-btn" onClick={handleMfaSetup}>
              Activer l'authentification à deux facteurs
            </button>
          </>
        )}
      </section>

      <section className="parametres-section">
        <h2 className="parametres-section-title">Compte</h2>
        <p className="parametres-section-desc">
          La suppression de votre compte est définitive. Toutes vos données seront effacées.
        </p>
        <button
          type="button"
          className="parametres-delete-account-btn"
          onClick={() => setShowDeleteModal(true)}
        >
          Supprimer le compte
        </button>
      </section>

      {showDeleteModal && (
        <div className="auth-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
          <div className="auth-modal">
            <h3 id="delete-account-title" className="auth-modal-title">Supprimer le compte</h3>
            <p className="auth-modal-text">
              Êtes-vous sûr ? Cette action est irréversible et supprimera définitivement votre compte.
            </p>
            <div className="auth-modal-actions">
              <button
                type="button"
                className="auth-modal-btn auth-modal-btn--secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                type="button"
                className="auth-modal-btn auth-modal-btn--danger"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Suppression...' : 'Supprimer mon compte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
