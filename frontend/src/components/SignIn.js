import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mfaStep, setMfaStep] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const { login, verifyMfa } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mfaStep) {
        await verifyMfa(tempToken, code);
        navigate('/', { replace: true });
      } else {
        const data = await login(email, password);
        if (data.requires_mfa) {
          setTempToken(data.temp_token);
          setMfaStep(true);
          setCode('');
        } else {
          navigate('/', { replace: true });
        }
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || (mfaStep ? 'Code invalide.' : 'Connexion impossible.');
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const backToPassword = () => {
    setMfaStep(false);
    setTempToken('');
    setCode('');
    setError('');
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
        <h2 className="auth-title">{mfaStep ? 'Code de vérification' : 'Connexion'}</h2>
        <p className="auth-subtitle">
          {mfaStep
            ? 'Entrez le code à 6 chiffres de votre application d\'authentification'
            : 'Connectez-vous à votre compte'}
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          {!mfaStep ? (
            <>
              <label>
                Email
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                Mot de passe
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </label>
            </>
          ) : (
            <>
              <label>
                Code de vérification (MFA)
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="auth-input-mfa"
                />
              </label>
              <button type="button" className="auth-back" onClick={backToPassword}>
                ← Retour
              </button>
            </>
          )}
          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? (mfaStep ? 'Vérification...' : 'Connexion...') : mfaStep ? 'Valider le code' : 'Se connecter'}
          </button>
        </form>
        {!mfaStep && (
          <p className="auth-footer">
            Pas encore de compte ? <Link to="/signup">Créer un compte</Link>
          </p>
        )}
      </div>
    </div>
  );
}
