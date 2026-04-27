import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { toast } from 'react-toastify';

export default function LessonViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [lesson, setLesson] = useState(null);
  const [modules, setModules] = useState([]);
  const [pages, setPages] = useState([]);
  const [quiz, setQuiz] = useState(null);
  
  const [viewState, setViewState] = useState('modules'); // 'modules'|'pages'|'quiz'|'success'
  const [currentModule, setCurrentModule] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Multi-question quiz state
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizFeedback, setQuizFeedback] = useState('');
  const [earnedPoints, setEarnedPoints] = useState(0);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user'));
    if (!u) navigate('/login');
    else { setUser(u); fetchData(u.id); }
  }, [id, navigate]);

  const fetchData = async (userId) => {
    try {
      const lesRes = await api.get('/api/lessons');
      const lesData = lesRes.data;
      setLesson(lesData.find(l => l.id.toString() === id));

      const modRes = await api.get(`/api/modules/lesson/${id}`);
      setModules(modRes.data);
    } catch (err) {
      toast.error('Failed to load lesson data');
    }
  };

  const startModule = async (mod) => {
    setCurrentModule(mod);
    setViewState('pages');
    setCurrentPageIndex(0);
    try {
      const res = await api.get(`/api/modules/${mod.id}/pages`);
      setPages(res.data);
    } catch (err) {
      toast.error('Failed to load module pages');
    }
  };

  const nextPage = async () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
    } else {
      try {
        const res = await api.get(`/api/modules/${currentModule.id}/quiz`);
        const quizData = res.data;
        try {
            quizData.parsedQuestions = JSON.parse(quizData.questionsJson);
        } catch (e) {
            quizData.parsedQuestions = [];
        }
        setQuiz(quizData);
        setViewState('quiz');
        setQuizAnswers({});
        setQuizFeedback('');
      } catch (err) {
        toast.error('Failed to load quiz');
      }
    }
  };

  const handleQuizSubmit = async () => {
    let correctCount = 0;
    quiz.parsedQuestions.forEach((q, idx) => {
        if (quizAnswers[idx] === q.answerIndex) correctCount++;
    });

    const pointsEarned = correctCount * 10;
    setEarnedPoints(pointsEarned);

    if (correctCount > 0) {
      try {
        await api.post(`/api/modules/${currentModule.id}/complete`, { userId: user.id, pointsEarned });
        const u = { ...user, points: user.points + pointsEarned };
        localStorage.setItem('user', JSON.stringify(u));
        setUser(u);
        setViewState('success');
        fetchData(user.id);
        toast.success(`You scored ${correctCount}/${quiz.parsedQuestions.length}!`);
      } catch (err) {
        toast.error('Failed to submit quiz results');
      }
    } else {
      setQuizFeedback("You didn't get any correct answers. Please review and try again!");
    }
  };

  if (!lesson) return <div className="container" style={{textAlign: 'center', marginTop: '5rem', fontSize: '1.5rem'}}>Loading...</div>;

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
      {viewState === 'modules' && (
        <>
          <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', marginBottom: '2rem' }}>
            <img src={getLessonImage(lesson.title)} alt="Header" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div style={{ padding: '2rem' }}>
              <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>{lesson.title}</h1>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>{lesson.description}</p>
            </div>
          </div>
          <h3 style={{ marginBottom: '1.5rem' }}>Curriculum Modules</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {modules.map(mod => (
              <div key={mod.id} className="glass-panel hoverable" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.3rem' }}>{mod.title}</h4>
                  {mod.completed === 1 && <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>✓ Completed</span>}
                </div>
                <button className={`btn ${mod.completed ? 'btn-secondary' : 'btn-primary'}`} onClick={() => startModule(mod)}>
                  {mod.completed ? 'Review Module' : 'Start Module'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {viewState === 'pages' && pages.length > 0 && (
        <div className="glass-panel" style={{ minHeight: '50vh', position: 'relative', paddingBottom: '6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem' }}>
            <h2 style={{ color: 'var(--primary)', margin: 0 }}>
              {currentModule.title} (Page {currentPageIndex + 1} of {pages.length})
            </h2>
            <button className="btn btn-secondary" onClick={() => setViewState('modules')}>Exit Module</button>
          </div>
          <div style={{ fontSize: '1.2rem', lineHeight: '1.8', margin: '2rem 0', whiteSpace: 'pre-wrap' }}>
            {pages[currentPageIndex].content}
          </div>
          <div style={{ position: 'absolute', bottom: '2rem', right: '2rem' }}>
             <button className="btn btn-primary" onClick={nextPage}>
               {currentPageIndex === pages.length - 1 ? 'Take Comprehensive Quiz ➜' : 'Next Page ➜'}
             </button>
          </div>
        </div>
      )}

      {viewState === 'quiz' && quiz && (
        <div className="glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--secondary)', margin: 0 }}>Module Knowledge Check</h2>
            <button className="btn btn-secondary" onClick={() => setViewState('modules')}>Exit Quiz</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', marginBottom: '2rem' }}>
            {quiz.parsedQuestions && quiz.parsedQuestions.map((q, qIdx) => (
              <div key={qIdx} style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem' }}>{qIdx + 1}. {q.question}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {q.options.map((opt, optIdx) => (
                    <button 
                      key={optIdx}
                      className={`btn ${quizAnswers[qIdx] === optIdx ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ textAlign: 'left', padding: '1rem', justifyContent: 'flex-start' }}
                      onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {quizFeedback && <p style={{ fontWeight: 'bold', fontSize: '1.2rem', color: quizFeedback.includes('Perfect') ? 'var(--primary)' : '#ef4444', textAlign: 'center', marginBottom: '1rem' }}>{quizFeedback}</p>}
          
          <button className="btn btn-primary" style={{ width: '100%', padding: '1.5rem', fontSize: '1.2rem' }} 
            onClick={handleQuizSubmit} 
            disabled={!quiz.parsedQuestions || Object.keys(quizAnswers).length < quiz.parsedQuestions.length}>
            Submit Final Answers
          </button>
        </div>
      )}

      {viewState === 'success' && (
        <div className="glass-panel" style={{ textAlign: 'center', background: 'rgba(16, 185, 129, 0.1)' }}>
          <h1 style={{ fontSize: '4rem', margin: 0 }}>🎉</h1>
          <h2 style={{ color: 'var(--primary)' }}>Quiz Completed!</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>You earned {earnedPoints} Eco-Points based on your score!</p>
          <button className="btn btn-primary" onClick={() => setViewState('modules')}>Return to Curriculum</button>
        </div>
      )}
    </div>
  );
}
