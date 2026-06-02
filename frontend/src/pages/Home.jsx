import React from 'react';
import { t } from '../i18n/i18n.js';
import { Link } from 'react-router-dom';

export default function Home({ ctx }) {
  const { lang } = ctx;
  return (
    <div>
      <section className="nn-hero" data-reveal>
        <div className="nn-hero-text">
          <h2>{t('homeHeroTitle', lang)}</h2>
          <p>{t('homeHeroDesc', lang)}</p>
        </div>
        <div className="nn-hero-img">
          <img
            src="https://img.freepik.com/free-vector/customer-support-flat-illustration_23-2148889374.jpg"
            alt="Tracking Illustration"
          />
        </div>
      </section>

      <section className="nn-section" data-reveal>
        <h2>{t('aboutTitle', lang)}</h2>
        <p style={{ textAlign: 'center', maxWidth: 800, margin: 'auto' }}>{t('aboutDesc', lang)}</p>
      </section>

      <section className="nn-section" data-reveal>
        <h2>{t('featuresTitle', lang)}</h2>
        <div className="nn-cards">
          <div className="nn-card">
            <h3>{t('f1', lang)}</h3>
            <p>{t('f1d', lang)}</p>
          </div>
          <div className="nn-card">
            <h3>{t('f2', lang)}</h3>
            <p>{t('f2d', lang)}</p>
          </div>
          <div className="nn-card">
            <h3>{t('f3', lang)}</h3>
            <p>{t('f3d', lang)}</p>
          </div>
          <div className="nn-card">
            <h3>{t('f4', lang)}</h3>
            <p>{t('f4d', lang)}</p>
          </div>
          <div className="nn-card">
            <h3>{t('f5', lang)}</h3>
            <p>{t('f5d', lang)}</p>
          </div>
          <div className="nn-card">
            <h3>{t('f6', lang)}</h3>
            <p>{t('f6d', lang)}</p>
          </div>
        </div>
      </section>

      <section className="nn-cta" data-reveal>
        <h2>{t('ctaTitle', lang)}</h2>
        <p>{t('ctaDesc', lang)}</p>
        <br />
        <Link to="/register">{t('ctaBtn', lang)}</Link>
      </section>

      <footer className="nn-footer">
        &copy; 2025 <span>{t('footerText', lang)}</span> | Developed by Tech Challengers
      </footer>
    </div>
  );
}
