import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { t } from '../i18n/i18n.js';

const STATUSES = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

export default function AdminDashboard({ ctx }) {
  const { lang, user } = ctx;
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [updating, setUpdating] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  async function load() {
    if (!user || user.role !== 'ADMIN') return;
    setError('');
    try {
      const res = await api.adminList(statusFilter);
      setItems(res.items || []);
      const u = await api.adminListUsers();
      setUsers(u.items || []);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    // Admin panel lock: if not admin, redirect
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'ADMIN') {
      navigate('/');
    }
  }, [user, navigate]);

  async function updateStatus(trackingCode, newStatus) {
    setUpdating(trackingCode);
    setError('');
    try {
      await api.adminUpdateStatus(trackingCode, newStatus, comment);
      setComment('');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setUpdating('');
    }
  }

  async function createAdmin(e) {
    e.preventDefault();
    setError('');
    setCreatingAdmin(true);
    try {
      await api.adminCreateAdmin(newAdminName, newAdminEmail, newAdminPassword);
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      alert('New admin created!');
    } catch (e2) {
      setError(e2.message);
    } finally {
      setCreatingAdmin(false);
    }
  }

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div>
      <div className="nn-panel" data-reveal>
        <h2>{t('adminHeading', lang)}</h2>
        <p className="text-muted" style={{ textAlign: 'center', marginTop: -8 }}>
          Admin logged in: <b>{user.fullName}</b>
        </p>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="row g-3" style={{ marginBottom: 16 }}>
          <div className="col-md-4">
            <label className="form-label">{t('status', lang)}</label>
            <select className="nn-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-8">
            <label className="form-label">{t('comment', lang)}</label>
            <input className="nn-input" value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="nn-table">
            <thead>
              <tr>
                <th>Tracking</th>
                <th>User</th>
                <th>{t('category', lang)}</th>
                <th>{t('status', lang)}</th>
                <th>Created</th>
                <th>{t('update', lang)}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.trackingCode}>
                  <td style={{ fontWeight: 800 }}>{it.trackingCode}</td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{it.user?.fullName || 'Guest'}</div>
                    <div style={{ fontSize: 12, color: '#555' }}>
                      {it.user?.email || it.user?.phone ? `${it.user?.email || ''} ${it.user?.phone || ''}` : ''}
                    </div>
                  </td>
                  <td>{it.category}</td>
                  <td>
                    <span className={`nn-badge ${it.status}`}>{it.status}</span>
                  </td>
                  <td style={{ fontSize: 12, color: '#444' }}>{it.createdAt}</td>
                  <td>
                    <div className="dropdown">
                      <button className="nn-btn" style={{ marginTop: 0, padding: '8px 14px' }} data-bs-toggle="dropdown">
                        {t('update', lang)}
                      </button>
                      <ul className="dropdown-menu">
                        {STATUSES.map((s) => (
                          <li key={s}>
                            <button
                              className="dropdown-item"
                              disabled={updating === it.trackingCode}
                              onClick={() => updateStatus(it.trackingCode, s)}
                            >
                              {s}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#666' }}>
                    No items.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <hr style={{ margin: '26px 0' }} />

        <h3>Registered Users</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="nn-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700 }}>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>
                    <span className={`nn-badge ${u.role === 'ADMIN' ? 'ASSIGNED' : 'PENDING'}`}>{u.role}</span>
                  </td>
                  <td style={{ fontSize: 12, color: '#444' }}>{u.createdAt}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#666' }}>
                    No users.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <hr style={{ margin: '26px 0' }} />

        <h3>Add New Admin</h3>
        <p className="text-muted" style={{ textAlign: 'center' }}>
          Admin register nahi hoga. Existing admin login karke yahan se naya admin add karega.
        </p>
        <form onSubmit={createAdmin} className="nn-form" noValidate>
          <label>Full Name</label>
          <input className="nn-input" value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} required />

          <label>Email</label>
          <input className="nn-input" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} required />

          <label>Password</label>
          <input
            type="password"
            className="nn-input"
            value={newAdminPassword}
            onChange={(e) => setNewAdminPassword(e.target.value)}
            required
          />

          <button className="nn-btn" disabled={creatingAdmin}>
            {creatingAdmin ? 'Creating...' : 'Create Admin'}
          </button>
        </form>
      </div>

      <footer className="nn-footer">
        &copy; 2025 <span>{t('footerText', lang)}</span> | Developed by Tech Challengers
      </footer>
    </div>
  );
}
