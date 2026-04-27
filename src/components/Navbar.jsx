import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <nav className="navbar glass-panel" style={{ borderRadius: '0 0 24px 24px', padding: '1rem 2.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to={isAdmin ? "/admin" : "/dashboard"} className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: '900', textDecoration: 'none' }}>
          {isAdmin ? 'Admin Gateway 🛡️' : 'EcoLearn 🌱'}
        </Link>
        
        {!isAdmin && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
            <Link to="/projects" className={`nav-link ${location.pathname === '/projects' ? 'active' : ''}`}>Projects</Link>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ color: 'var(--text-muted)' }}>{user.username}</span>
        <button className="btn" onClick={handleLogout} style={{ background: 'transparent', color: 'var(--text-muted)', padding: '0.5rem 1rem' }}>Logout</button>
      </div>
    </nav>
  );
}
