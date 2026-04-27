import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { toast } from 'react-toastify';

export default function ProjectBoard() {
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user'));
    if (!u) navigate('/login');
    else { setUser(u); fetchProjects(u.id); }
  }, [navigate]);

  const fetchProjects = async (userId) => {
    try {
      const res = await api.get(`/api/projects`);
      setProjects(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load projects');
    }
  };

  const joinProject = async (project) => {
    try {
      await api.post(`/api/submissions/submit`, { userId: user.id, projectId: project.id });
      toast.success('Project submitted for Admin review!');
      // Update local state to reflect pending status
    } catch (err) {
      if (err.response && err.response.status === 400) {
          toast.info('You have already submitted this project for review.');
      } else {
          toast.error('Failed to submit project');
      }
    }
  };

  return (
    <div className="container animate-fade-in">
      <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Global Projects 🌍</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>Complete physical tasks to earn massive Eco-Points!</p>
      {/* Grid handling 20 items smoothly */}
      <div className="grid">
        {projects.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', gridColumn: '1 / -1' }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>No projects available right now. Check back later!</p>
          </div>
        ) : (
          projects.map((project) => {
            const diffLower = project.difficulty.toLowerCase();
            const isHard = diffLower === 'hard';
            const isMedium = diffLower === 'medium';
            const badgeClass = isHard ? 'hard' : (isMedium ? 'medium' : 'easy');
            
            return (
              <div key={project.id} className="glass-panel hoverable" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <span className={`badge ${badgeClass}`} style={{ alignSelf: 'flex-start', marginBottom: '1rem' }}>
                  {project.difficulty}
                </span>
                
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', lineHeight: '1.3' }}>{project.title}</h3>
                
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6', flexGrow: 1, marginBottom: '2rem' }}>
                  {project.description}
                </p>
                
                {project.completed === 1 ? (
                  <button className="btn btn-secondary" style={{ width: '100%', cursor: 'default' }} disabled>
                    ✓ Completed
                  </button>
                ) : (
                  <button className="btn btn-primary" onClick={() => joinProject(project)} style={{ width: '100%' }}>
                    Submit for Review <span style={{ opacity: 0.8, fontSize: '0.9rem' }}>(+100 pts)</span>
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}
