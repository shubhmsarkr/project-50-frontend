import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api.js';
import { toast } from 'react-toastify';

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [lessons, setLessons] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
      fetchLessons();
    }
  }, [navigate]);

  const fetchLessons = async () => {
    try {
      const res = await api.get('/api/lessons');
      setLessons(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load lessons');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return null;

  // Gamification Math
  const points = user.points || 0;
  const level = Math.floor(points / 200) + 1;
  const nextLevelPoints = level * 200;
  const progressPercent = ((points % 200) / 200) * 100;

  const getLessonImage = (title) => {
    switch (title) {
      case 'Water Conservation': return '/water_conservation_bg.png';
      case 'Renewable Energy Basics': return '/renewable_energy_bg.png';
      case 'Sustainable Agriculture': return '/sustainable_agriculture_bg.png';
      case 'Zero Waste Lifestyle': return '/zero_waste_bg.png';
      case 'Sustainable Fashion': return '/sustainable_fashion_bg.png';
      case 'Eco-Friendly Architecture': return '/eco_architecture_bg.png';
      case 'Ocean Conservation': return '/ocean_conservation_bg.png';
      case 'Wildlife Protection': return '/wildlife_protection_bg.png';
      default: return '/water_conservation_bg.png';
    }
  };

  return (
    <div className="container animate-fade-in">
      {/* Hero & Gamification Section */}
      <div className="glass-panel" style={{ marginBottom: '4rem', background: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.15), transparent 400px)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '3rem' }}>
          <div style={{ flex: '1 1 400px' }}>
            <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Welcome back, {user.username}! 🌱</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', lineHeight: '1.6' }}>
              You are making a real difference. Complete lessons and join projects to level up your eco-status.
            </p>
          </div>
          
          <div className="glass-panel hoverable" style={{ padding: '2rem', flex: '1 1 350px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-end' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Current Rank</span>
                <div style={{ fontWeight: '900', fontSize: '1.8rem', color: '#fff' }}>🌟 Level {level}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="text-gradient" style={{ fontWeight: '900', fontSize: '1.4rem' }}>{points} pts</span>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/ {nextLevelPoints} next rank</div>
              </div>
            </div>
            <div className="progress-container" style={{ height: '20px', marginBottom: '0.5rem' }}>
              <div className="progress-bar" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'right', fontWeight: 'bold' }}>
              {200 - (points % 200)} pts to next level
            </p>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: '2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.5rem' }}>📚</span> Recommended Lessons
      </h3>
      <div className="grid">
        {lessons.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>No lessons available right now.</p>
          </div>
        ) : (
          lessons.map(lesson => (
            <div key={lesson.id} className="glass-panel hoverable" style={{ display: 'flex', flexDirection: 'column' }}>
              <img src={getLessonImage(lesson.title)} alt={lesson.title} className="card-image" />
              <div style={{ flexGrow: 1 }}>
                <span className="badge easy" style={{ marginBottom: '1rem' }}>
                  {lesson.category}
                </span>
                <h4 style={{ fontSize: '1.5rem', margin: '0.5rem 0 1.5rem 0', lineHeight: '1.3' }}>{lesson.title}</h4>
              </div>
              <Link to={`/lesson/${lesson.id}`} className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
                Start Learning <span style={{ opacity: 0.8, fontSize: '0.9rem' }}>(+50 pts)</span>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
