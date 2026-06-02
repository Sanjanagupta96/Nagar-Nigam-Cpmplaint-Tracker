import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { t } from '../i18n/i18n.js';

const STEPS = [
  { key: 'PENDING', label: 'Submitted' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved' }
];

export default function TrackComplaint({ ctx }) {
  const { lang, user } = ctx;
  const [searchParams] = useSearchParams();
  const [trackingCode, setTrackingCode] = useState(searchParams.get('code') || '');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) setTrackingCode(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSearch(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const data = await api.track(trackingCode.trim());
      setResult(data);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div>
        <section className="nn-intro">
          <h2>{t('trackHeading', lang)}</h2>
          <p>{t('loginRequired', lang)}</p>
        </section>
        <div className="nn-track-section">
          <div className="nn-track-header">
            <h2>{t('trackHeading', lang)}</h2>
          </div>
          <div className="nn-track-result">
            <Link to="/login" style={{ color: 'white', fontWeight: 700 }}>
              {t('goToLogin', lang)}
            </Link>
          </div>
        </div>
        <footer className="nn-footer">
          &copy; 2025 <span>{t('footerText', lang)}</span> | Developed by Tech Challengers
        </footer>
      </div>
    );
  }

  return (
    <div>
      <section className="nn-intro" data-reveal>
        <h2>{t('trackHeading', lang)}</h2>
        <p>
          No more standing in long queues or repeated visits to Nagar Nigam offices. Just enter your tracking code and
          track status live.
        </p>
      </section>

      <div className="nn-track-section" data-reveal>
        <div className="nn-track-header">
          <h2>Complaint Progress</h2>
          <form className="nn-track-form" onSubmit={onSearch}>
            <input
              placeholder={t('trackingCode', lang)}
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              required
            />
            <button disabled={loading}>{loading ? '...' : t('search', lang)}</button>
          </form>
        </div>

        {error && <div className="nn-track-result">Error: {error}</div>}

        {result?.complaint && (
          <div className="nn-track-result">
            {(() => {
              const status = result.complaint.status;
              const activeIdx = Math.max(0, STEPS.findIndex((s) => s.key === status));
              const progress = STEPS.length <= 1 ? 0 : (activeIdx / (STEPS.length - 1)) * 100;
              return (
                <div style={{ marginBottom: 10 }}>
                  <div className="nn-timeline">
                    <div className="nn-timeline-progress" style={{ width: `calc((100% - 40px) * ${progress / 100})` }} />
                    {STEPS.map((s, idx) => {
                      const cls = idx < activeIdx ? 'completed' : idx === activeIdx ? 'active' : '';
                      return (
                        <div className={`nn-step ${cls}`} key={s.key}>
                          <div className="nn-step-circle">{idx + 1}</div>
                          <div className="nn-step-label">{s.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div>
              <b>{t('trackingCode', lang)}:</b> {result.complaint.trackingCode}
            </div>
            <div>
              <b>{t('status', lang)}:</b> {result.complaint.status}
            </div>
            <div>
              <b>{t('category', lang)}:</b> {result.complaint.category}
            </div>
            <div style={{ marginTop: 8 }}>{result.complaint.description}</div>

            <div style={{ marginTop: 14, fontWeight: 700 }}>Updates</div>
            <ul style={{ marginTop: 8, paddingLeft: 18 }}>
              {result.updates?.map((u, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>
                  <b>{u.status}</b> — {u.comment || ''}{' '}
                  <span style={{ opacity: 0.9, fontSize: 12 }}>({u.updatedAt})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <footer className="nn-footer">
        &copy; 2025 <span>{t('footerText', lang)}</span> | Developed by Tech Challengers
      </footer>
    </div>
  );
}
