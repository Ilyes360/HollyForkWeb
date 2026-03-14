import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setSubmitting(true);
    try {
      await register(email, password, passwordConfirm, { skipLogin: true });
      setShowSuccessModal(true);
    } catch (err) {
      const data = err.response?.data || {};
      const msg =
        data.email?.[0] ||
        data.password?.[0] ||
        data.password_confirm?.[0] ||
        (typeof data.detail === 'string' ? data.detail : null) ||
        'Inscription impossible.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessOk = () => {
    setShowSuccessModal(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="auth-page">
      <header className="auth-header">
        <div className="brand">
          <h1 className="brand-name">Holly Fork</h1>
          <p className="brand-subtitle">Gestion restaurant</p>
        </div>
      </header>
      <div className="auth-card">
        <h2 className="auth-title">Créer un compte</h2>
        <p className="auth-subtitle">Inscrivez-vous avec votre email</p>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </label>
          <label>
            Mot de passe (8 caractères min.)
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <label>
            Confirmer le mot de passe
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </label>
          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>
        <p className="auth-footer">
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>

      {showSuccessModal && (
        <div className="auth-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-success-title">
          <div className="auth-modal">
            <h3 id="auth-success-title" className="auth-modal-title">Compte créé</h3>
            <p className="auth-modal-text">Votre compte a bien été créé. Connectez-vous pour continuer.</p>
            <button type="button" className="auth-modal-btn" onClick={handleSuccessOk}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
