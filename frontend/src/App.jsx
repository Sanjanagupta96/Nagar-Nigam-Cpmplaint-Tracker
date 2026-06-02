import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { api } from './api.js';
import { getLang, setLang, t } from './i18n/i18n.js';

import Home from './pages/Home.jsx';
import RegisterComplaint from './pages/RegisterComplaint.jsx';
import TrackComplaint from './pages/TrackComplaint.jsx';
import Login from './pages/Login.jsx';
import MyComplaints from './pages/MyComplaints.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

function NavBar({ user, setUser, lang, setLangState }) {
  const navigate = useNavigate();

  async function onLogout() {
    try {
      await api.logout();
    } finally {
      setUser(null);
      navigate('/');
    }
  }

  return (
    <header className="nn-header">
      <h1>{t('appTitle', lang)}</h1>

      <nav className="nn-nav">
        <NavLink to="/">{t('navHome', lang)}</NavLink>
        {/* Requirement: if ADMIN logged in, hide Register Complaint from navbar */}
        {user?.role !== 'ADMIN' && <NavLink to="/register">{t('navRegister', lang)}</NavLink>}
        <NavLink to="/track">{t('navTrack', lang)}</NavLink>
        {user && <NavLink to="/my">{t('navMy', lang)}</NavLink>}
        {user?.role === 'ADMIN' && <NavLink to="/admin">{t('navAdmin', lang)}</NavLink>}
        {!user ? (
          <NavLink to="/login">{t('navLogin', lang)}</NavLink>
        ) : (
          <a
            href="#logout"
            onClick={(e) => {
              e.preventDefault();
              onLogout();
            }}
          >
            {t('logout', lang)}
          </a>
        )}
      </nav>

      <div className="language-switcher">
        <button
          type="button"
          className={lang === 'en' ? 'active' : ''}
          onClick={() => {
            setLang('en');
            setLangState('en');
          }}
        >
          English
        </button>
        <button
          type="button"
          className={lang === 'hi' ? 'active' : ''}
          onClick={() => {
            setLang('hi');
            setLangState('hi');
          }}
        >
          हिन्दी
        </button>
      </div>
    </header>
  );
}

export default function App() {
  const [lang, setLangState] = useState(getLang());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .me()
      .then((u) => mounted && setUser(u))
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const ctx = useMemo(() => ({ user, setUser, lang }), [user, lang]);

  return (
    <BrowserRouter>
      <div className="nn">
        <NavBar user={user} setUser={setUser} lang={lang} setLangState={setLangState} />
        <ScrollRevealObserver />
        <div>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <Routes>
              <Route path="/" element={<Home ctx={ctx} />} />
              <Route path="/register" element={<RegisterComplaint ctx={ctx} />} />
              <Route path="/track" element={<TrackComplaint ctx={ctx} />} />
              <Route path="/login" element={<Login ctx={ctx} />} />
              <Route path="/my" element={<MyComplaints ctx={ctx} />} />
              <Route path="/admin" element={<AdminDashboard ctx={ctx} />} />
            </Routes>
          )}
        </div>
      </div>
    </BrowserRouter>
  );
}

function ScrollRevealObserver() {
  const location = useLocation();

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'));
    nodes.forEach((n) => n.classList.remove('show'));

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('show');
            io.unobserve(entry.target); // one-time reveal
          }
        }
      },
      { threshold: 0.12 }
    );

    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [location.pathname]);

  return null;
}
