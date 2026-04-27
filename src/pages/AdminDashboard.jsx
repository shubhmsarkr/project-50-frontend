import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, lessons: 0, projects: 0 });
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pendingReviews, setPendingReviews] = useState([]);
  
  // New Project State
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projDiff, setProjDiff] = useState('Easy');
  const [projImage, setProjImage] = useState('');

  // New Lesson State
  const [lesTitle, setLesTitle] = useState('');
  const [lesCategory, setLesCategory] = useState('');
  const [lesDesc, setLesDesc] = useState('');
  const [lesImage, setLesImage] = useState('');

  // New Module/Quiz State
  const [modLessonId, setModLessonId] = useState('');
  const [modTitle, setModTitle] = useState('');
  const [quizJson, setQuizJson] = useState('[\n  {\n    "question": "Sample Question?",\n    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],\n    "answerIndex": 0\n  }\n]');
  
  const [lessons, setLessons] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, reviewsRes, lessonsRes] = await Promise.all([
        api.get('/api/stats'),
        api.get('/api/users'),
        api.get('/api/submissions/pending'),
        api.get('/api/lessons')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setPendingReviews(reviewsRes.data);
      setLessons(lessonsRes.data);
    } catch (error) {
      toast.error('Failed to load admin data');
    }
  };

  const loadUserDetails = async (user) => {
    try {
      const res = await api.get(`/api/users/${user.id}/details`);
      setSelectedUser({ ...user, details: res.data });
    } catch (error) {
      toast.error('Failed to load user details');
    }
  };

  const handleVerify = async () => {
    if (!selectedUser) return;
    try {
      await api.post(`/api/users/${selectedUser.id}/verify`);
      toast.success('User verified successfully!');
      fetchData(); // reload
      setSelectedUser(null);
    } catch (error) {
      toast.error('Failed to verify user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/api/users/${userId}`);
      toast.success('User deleted.');
      fetchData();
      if (selectedUser && selectedUser.id === userId) setSelectedUser(null);
    } catch (err) {
      toast.error('Failed to delete user.');
    }
  };

  const handleAddExp = async (userId) => {
    try {
      await api.post(`/api/users/${userId}/add-exp`, { exp: 50 });
      toast.success('Added 50 EXP to user!');
      fetchData();
      if (selectedUser) loadUserDetails(selectedUser);
    } catch (err) {
      toast.error('Failed to add EXP.');
    }
  };

  const handleApproveProject = async (subId) => {
    try {
      await api.post(`/api/submissions/${subId}/approve`);
      toast.success('Project Approved! User granted 100 EXP.');
      fetchData();
    } catch (err) {
      toast.error('Failed to approve project.');
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/projects', {
        title: projTitle,
        description: projDesc,
        difficulty: projDiff,
        imageUrl: projImage
      });
      setProjTitle(''); setProjDesc(''); setProjDiff('Easy'); setProjImage('');
      fetchData();
      toast.success('Project Added Successfully!');
    } catch (error) {
      toast.error('Failed to add project');
    }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/lessons', {
        title: lesTitle,
        category: lesCategory,
        description: lesDesc,
        imageUrl: lesImage
      });
      setLesTitle(''); setLesCategory(''); setLesDesc(''); setLesImage('');
      fetchData();
      toast.success('Lesson Added Successfully!');
    } catch (error) {
      toast.error('Failed to add lesson');
    }
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    try {
      // Validate JSON first
      JSON.parse(quizJson);
      
      await api.post('/api/modules/admin-create', {
        lessonId: modLessonId,
        title: modTitle,
        quizJson: quizJson
      });
      setModTitle('');
      fetchData();
      toast.success('Module & Custom Quiz Created!');
    } catch (err) {
      if (err instanceof SyntaxError) {
        toast.error('Invalid Quiz JSON format. Please check syntax.');
      } else {
        toast.error('Failed to create module.');
      }
    }
  };

  return (
    <div className="container animate-fade-in">
      <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '3rem' }}>Admin Gateway 🛡️</h1>
      <div className="grid" style={{ marginBottom: '4rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="glass-panel hoverable" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Users</h3>
          <p className="text-gradient" style={{ fontSize: '4.5rem', fontWeight: '900', margin: '0', lineHeight: '1' }}>{stats.users}</p>
        </div>
        <div className="glass-panel hoverable" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Lessons</h3>
          <p className="text-gradient" style={{ fontSize: '4.5rem', fontWeight: '900', margin: '0', lineHeight: '1' }}>{stats.lessons}</p>
        </div>
        <div className="glass-panel hoverable" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Projects</h3>
          <p className="text-gradient" style={{ fontSize: '4.5rem', fontWeight: '900', margin: '0', lineHeight: '1' }}>{stats.projects}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2.5rem' }}>
        
        {/* PENDING PROJECT REVIEWS */}
        <div className="glass-panel">
          <h3 style={{ borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1.5rem', fontSize: '1.5rem', color: '#f59e0b' }}>⏱️ Pending Reviews</h3>
          {pendingReviews.length === 0 ? <p>No pending reviews.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {pendingReviews.map(r => (
                <li key={r.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{r.username}</strong> submitted <br/>
                    <small>{r.projectTitle}</small>
                  </div>
                  <button className="btn btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => handleApproveProject(r.id)}>Approve</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* CREATE LESSON FORM */}
        <div className="glass-panel">
          <h3 style={{ borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1.5rem', fontSize: '1.5rem', color: 'var(--primary)' }}>📖 Create Lesson Track</h3>
          <form onSubmit={handleAddLesson} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input className="input-field" placeholder="Lesson Title" value={lesTitle} onChange={e=>setLesTitle(e.target.value)} required />
            <input className="input-field" placeholder="Category (e.g., Energy, Lifestyle)" value={lesCategory} onChange={e=>setLesCategory(e.target.value)} required />
            <input className="input-field" placeholder="Image URL (optional)" value={lesImage} onChange={e=>setLesImage(e.target.value)} />
            <textarea className="input-field" placeholder="Description..." rows="3" value={lesDesc} onChange={e=>setLesDesc(e.target.value)} required style={{ resize: 'vertical' }} />
            <button className="btn btn-primary" type="submit" style={{ marginTop: '0.5rem' }}>Publish Lesson</button>
          </form>
        </div>

        {/* CREATE MODULE & QUIZ */}
        <div className="glass-panel" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1.5rem', fontSize: '1.5rem', color: 'var(--secondary)' }}>🧠 Create Module & Custom Quiz</h3>
          <form onSubmit={handleCreateModule} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <select className="input-field" value={modLessonId} onChange={e=>setModLessonId(e.target.value)} required>
                <option value="">Select Parent Lesson...</option>
                {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
              <input className="input-field" placeholder="Module Title" value={modTitle} onChange={e=>setModTitle(e.target.value)} required />
              <button className="btn btn-secondary" type="submit" style={{ marginTop: '1rem', height: 'fit-content' }}>Deploy Module & Quiz</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Quiz Data (JSON Array)</label>
              <textarea className="input-field" value={quizJson} onChange={e=>setQuizJson(e.target.value)} rows="8" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} required />
            </div>
          </form>
        </div>

        {/* ADD PROJECT FORM */}
        <div className="glass-panel">
          <h3 style={{ borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1.5rem', fontSize: '1.5rem' }}>✨ Publish Project</h3>
          <form onSubmit={handleAddProject} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input className="input-field" placeholder="Project Title" value={projTitle} onChange={e=>setProjTitle(e.target.value)} required />
            <select className="input-field" value={projDiff} onChange={e=>setProjDiff(e.target.value)} style={{ appearance: 'none' }}>
              <option value="Easy">🌱 Easy</option>
              <option value="Medium">⚡ Medium</option>
              <option value="Hard">🔥 Hard</option>
            </select>
            <input className="input-field" placeholder="Image URL (optional)" value={projImage} onChange={e=>setProjImage(e.target.value)} />
            <textarea className="input-field" placeholder="Describe the eco-impact..." rows="4" value={projDesc} onChange={e=>setProjDesc(e.target.value)} required style={{ resize: 'vertical' }} />
            <button className="btn btn-primary" type="submit" style={{ marginTop: '0.5rem' }}>Publish Mission</button>
          </form>
        </div>

        {/* STUDENT TRACKING */}
        <div className="glass-panel" style={{ overflowX: 'auto', gridColumn: '1 / -1' }}>
          <h3 style={{ borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1.5rem', fontSize: '1.5rem' }}>👥 Student Management</h3>
          
          {!selectedUser ? (
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
              <thead><tr><th style={{textAlign: 'left'}}>User</th><th style={{textAlign: 'left'}}>Status</th><th style={{textAlign: 'right'}}>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '1rem', borderRadius: '8px 0 0 8px' }}>
                      <b style={{ fontSize: '1.1rem' }}>{u.username}</b> ({u.role}) <br/>
                      <small style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{u.points} pts</small>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`badge ${u.verified ? 'easy' : 'hard'}`}>
                        {u.verified ? '✓ Verified' : 'Pending'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '1rem', borderRadius: '0 8px 8px 0' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }} onClick={() => loadUserDetails(u)}>Inspect</button>
                        <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: '#3b82f6', color: 'white', border: 'none' }} onClick={() => handleAddExp(u.id)}>+50 EXP</button>
                        <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: '#ef4444', color: 'white', border: 'none' }} onClick={() => handleDeleteUser(u.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="animate-fade-in" style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
               <button className="btn btn-secondary" onClick={()=>setSelectedUser(null)} style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem' }}>← Back to Directory</button>
               
               <h4 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Dossier: <span className="text-gradient">{selectedUser.username}</span></h4>
               <p style={{ marginBottom: '2rem' }}>
                 Status: <span className={`badge ${selectedUser.verified ? 'easy' : 'hard'}`}>{selectedUser.verified ? 'Verified' : 'Unverified'}</span>
               </p>
               
               <h5 style={{ color: 'var(--primary)', fontSize: '1.2rem', marginBottom: '0.8rem' }}>📚 Completed Modules ({selectedUser.details.modules.length})</h5>
               <ul style={{ paddingLeft: '1.5rem', marginBottom: '2rem', color: 'var(--text-muted)' }}>
                 {selectedUser.details.modules.length === 0 ? <li>No modules completed yet.</li> : 
                  selectedUser.details.modules.map((m, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{m.title}</li>)}
               </ul>

               <h5 style={{ color: 'var(--secondary)', fontSize: '1.2rem', marginBottom: '0.8rem' }}>🌍 Completed Projects ({selectedUser.details.projects.length})</h5>
               <ul style={{ paddingLeft: '1.5rem', marginBottom: '2rem', color: 'var(--text-muted)' }}>
                 {selectedUser.details.projects.length === 0 ? <li>No projects completed yet.</li> :
                  selectedUser.details.projects.map((p, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{p.title}</li>)}
               </ul>

               {!selectedUser.verified && (
                 <button className="btn btn-primary" onClick={handleVerify} style={{ width: '100%' }}>Mark User as Verified</button>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
