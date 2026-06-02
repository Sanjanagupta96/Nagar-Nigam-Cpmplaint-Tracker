import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { t } from '../i18n/i18n.js';

export default function MyComplaints({ ctx }) {
  const { lang } = ctx;
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .myComplaints()
      .then((d) => setItems(d.items || []))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div>
      <h3 className="mb-3">{t('navMy', lang)}</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="list-group">
        {items.map((it) => (
          <div key={it.trackingCode} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <div>
                <b>{it.trackingCode}</b> — {it.category}
              </div>
              <div className="text-muted" style={{ fontSize: 12 }}>
                {it.createdAt}
              </div>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <span className="badge bg-secondary">{it.status}</span>
              <Link className="btn btn-sm btn-outline-primary" to={`/track?code=${encodeURIComponent(it.trackingCode)}`}>
                {t('navTrack', lang)}
              </Link>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-muted">No complaints yet.</div>}
      </div>
    </div>
  );
}

