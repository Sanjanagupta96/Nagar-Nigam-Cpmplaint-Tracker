import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { t } from '../i18n/i18n.js';

export default function Login({ ctx }) {
  const { lang, setUser } = ctx;
  const navigate = useNavigate();

  const [mode, setMode] = useState('login'); // login | register (USER)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await api.login(emailOrPhone, password);
        setUser(res.user);
        navigate('/');
      } else {
        // Citizen registration (role will always be USER in backend)
        const res = await api.registerUser({ fullName, email: email || null, phone: phone || null, password });
        setUser(res.user);
        navigate('/');
      }
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="nn-panel" data-reveal>
        <h2>{t('appTitle', lang)}</h2>

        <p className="text-muted" style={{ textAlign: 'center', marginTop: 0 }}>
          Citizen registration yahin se hoga. Admin register nahi hoga — admin sirf login karega aur admin panel se new admin add karega.
        </p>

        <div className="nn-switch">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            {t('navLogin', lang)}
          </button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>
            {t('register', lang)}
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={onSubmit} className="nn-form" noValidate>
          {mode === 'register' ? (
            <>
              <label>Full Name</label>
              <input className="nn-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />

              <label>Email (optional)</label>
              <input className="nn-input" value={email} onChange={(e) => setEmail(e.target.value)} />

              <label>Phone (optional)</label>
              <input className="nn-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </>
          ) : (
            <>
              <label>{t('emailOrPhone', lang)}</label>
              <input
                className="nn-input"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                required
              />
            </>
          )}

          <label>{t('password', lang)}</label>
          <input
            type="password"
            className="nn-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="nn-btn" disabled={loading}>
            {loading ? '...' : mode === 'login' ? t('navLogin', lang) : t('register', lang)}
          </button>
        </form>
      </div>

      <footer className="nn-footer">
        &copy; 2025 <span>{t('footerText', lang)}</span> | Developed by Tech Challengers
      </footer>
    </div>
  );
}
