import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { t } from '../i18n/i18n.js';

const ISSUE_OPTIONS = [
  { value: 'garbage', label: 'Garbage Collection' },
  { value: 'sewage', label: 'Sewage Problem' },
  { value: 'streetlight', label: 'Street Light Not Working' },
  { value: 'road', label: 'Road Damage' },
  { value: 'water', label: 'Water Supply Issue' }
];

export default function RegisterComplaint({ ctx }) {
  const { lang, user } = ctx;
  const navigate = useNavigate();

  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [files, setFiles] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Requirement: if ADMIN logged in, don't allow complaint registration UI
    if (user?.role === 'ADMIN') navigate('/admin');
  }, [user, navigate]);

  function useLocation() {
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setTrackingCode('');
    setSubmitting(true);

    try {
      const fd = new FormData();
      fd.append('category', category);
      fd.append('description', description);
      fd.append('address', address);
      fd.append('ward', ward);
      fd.append('latitude', latitude);
      fd.append('longitude', longitude);
      for (const f of files) fd.append('files', f);

      const res = await api.createComplaint(fd);
      setTrackingCode(res.trackingCode);
      setCategory('');
      setDescription('');
      setAddress('');
      setWard('');
      setFiles([]);
    } catch (e2) {
      setError(e2.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="nn-form-container" data-reveal>
        <h2>{t('registerHeading', lang)}</h2>

        {error && <div className="alert alert-danger">{error}</div>}
        {trackingCode && (
          <div className="nn-success">
            ✅ {t('trackingCode', lang)}: <strong>{trackingCode}</strong>
          </div>
        )}

        <form onSubmit={onSubmit} className="nn-form" noValidate>
          <label>{t('category', lang)}</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="">Select</option>
            {ISSUE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <label>{t('description', lang)}</label>
          <textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)} required />

          <label>{t('address', lang)}</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} />

          <label>{t('ward', lang)}</label>
          <input value={ward} onChange={(e) => setWard(e.target.value)} />

          <label>{t('latitude', lang)}</label>
          <input value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="e.g., 28.6139" />

          <label>{t('longitude', lang)}</label>
          <input value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="e.g., 77.2090" />

          <button type="button" className="nn-geo-btn" onClick={useLocation}>
            {t('useLocation', lang)}
          </button>
          {(latitude || longitude) && (
            <div className="nn-geo-hint">
              Latitude: {latitude || '-'} &nbsp; Longitude: {longitude || '-'}
            </div>
          )}

          <label>{t('attachments', lang)}</label>
          <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
          {files.length > 0 && (
            <div className="nn-geo-hint" style={{ fontWeight: 500 }}>
              Selected: {files.map((f) => f.name).join(', ')}
            </div>
          )}

          <button className="nn-btn" disabled={submitting}>
            {submitting ? 'Submitting...' : t('submit', lang)}
          </button>
        </form>
      </div>

      <footer className="nn-footer">
        &copy; 2025 <span>{t('footerText', lang)}</span> | Developed by Tech Challengers
      </footer>
    </div>
  );
}
