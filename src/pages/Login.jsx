import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';
import { API_BASE } from '../api.js';
import axios from 'axios';

const OTP_SECONDS = 120;

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [roleMode, setRoleMode] = useState(null);
  const [screen, setScreen] = useState('login'); // login, register, otp, forgot-password, reset-password
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    captchaAnswer: '',
    otp: ''
  });
  
  const [captcha, setCaptcha] = useState({ question: '', token: '' });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(OTP_SECONDS);
  const [showPassword, setShowPassword] = useState(false);

  const isRegister = screen === 'register';
  const isOtp = screen === 'otp';
  const isForgot = screen === 'forgot-password';
  const isReset = screen === 'reset-password';

  const title = useMemo(() => {
    if (roleMode === 'admin') return 'Admin Gateway';
    if (isRegister) return 'Create Account';
    if (isOtp) return 'Verify Email';
    if (isForgot) return 'Forgot Password';
    if (isReset) return 'Reset Password';
    return 'Student Login';
  }, [roleMode, screen]);

  useEffect(() => {
    if (isRegister) {
      loadCaptcha();
    }
  }, [isRegister]);

  useEffect(() => {
    if (!isOtp && !isReset) return undefined;
    setOtpSecondsLeft(OTP_SECONDS);
    const timer = window.setInterval(() => {
      setOtpSecondsLeft((s) => Math.max(s - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isOtp, isReset]);

  const updateForm = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const setApiMessage = (type, text) => {
    setMessage({ type, text });
  };

  const loadCaptcha = async () => {
    setForm(cur => ({ ...cur, captchaAnswer: '' }));
    try {
      const { data } = await axios.get(`${API_BASE}/api/captcha`);
      setCaptcha({ question: data.question, token: data.token });
    } catch (err) {
      console.error('CAPTCHA load failed:', err);
      setApiMessage('error', 'Failed to load CAPTCHA');
    }
  };

  const changeScreen = (nextScreen) => {
    setScreen(nextScreen);
    setMessage({ type: '', text: '' });
    if (nextScreen !== 'otp' && nextScreen !== 'reset-password') {
      setForm((current) => ({ ...current, otp: '' }));
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data } = await axios.post(`${API_BASE}/api/users/register`, {
        username: form.username,
        email: form.email,
        password: form.password,
        captchaAnswer: form.captchaAnswer,
        captchaToken: captcha.token,
        role: roleMode
      });
      setOtpSecondsLeft(data.otpExpiresInSeconds || OTP_SECONDS);
      changeScreen('otp');
      setApiMessage('success', data.message);
    } catch (err) {
      setApiMessage('error', err.response?.data?.error || err.message);
      loadCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data } = await axios.post(`${API_BASE}/api/users/resend-otp`, {
        email: form.email
      });
      setOtpSecondsLeft(data.otpExpiresInSeconds || OTP_SECONDS);
      setApiMessage('success', data.message);
    } catch (err) {
      setApiMessage('error', err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data } = await axios.post(`${API_BASE}/api/users/verify-otp`, {
        email: form.email,
        otp: form.otp
      });
      setForm(cur => ({ ...cur, password: '', otp: '' }));
      changeScreen('login');
      setApiMessage('success', data.message);
    } catch (err) {
      setApiMessage('error', err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data } = await axios.post(`${API_BASE}/api/users/forgot-password`, { email: form.email });
      changeScreen('reset-password');
      setApiMessage('success', data.message);
    } catch (err) {
      setApiMessage('error', err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data } = await axios.post(`${API_BASE}/api/users/reset-password`, {
        email: form.email,
        otp: form.otp,
        password: form.password
      });
      setForm(cur => ({ ...cur, password: '', otp: '' }));
      changeScreen('login');
      setApiMessage('success', data.message);
    } catch (err) {
      setApiMessage('error', err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    // Removed strict 'admin' username check.
    // Any user with 'admin' role in DB can log in through the admin portal.

    try {
      const { data } = await axios.post(`${API_BASE}/api/users/login`, {
        username: form.username,
        email: form.email,
        password: form.password
      });
      
      if (roleMode === 'admin' && data.role !== 'admin') {
        setApiMessage('error', 'Access denied. You are not an admin.');
        return;
      }

      dispatch(loginSuccess({
        user: { id: data.id, username: data.username, email: data.email, role: data.role, points: data.points },
        token: data.token
      }));

      if (data.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        changeScreen('otp');
        setOtpSecondsLeft(0);
      }
      setApiMessage('error', err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!roleMode) {
    return (
      <main className="auth-shell">
        <section className="auth-media" aria-hidden="true" />
        <section className="auth-panel-wrap">
          <div className="auth-card auth-card-narrow animate-fade-in">
            <p className="auth-eyebrow">EcoLearn</p>
            <h1>Choose your portal</h1>
            <p className="auth-subtitle">Sign in as a student or open the secure admin gateway.</p>
            <div className="auth-actions">
              <button className="btn btn-primary auth-choice" type="button" onClick={() => setRoleMode('user')}>
                Student portal
              </button>
              <button className="btn btn-danger-outline auth-choice" type="button" onClick={() => setRoleMode('admin')}>
                Admin portal
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={`auth-shell ${roleMode === 'admin' ? 'auth-shell-admin' : ''}`}>
      <section className="auth-media" aria-hidden="true">
        <div className="auth-media-copy">
          <span>{roleMode === 'admin' ? 'Secure Area' : 'Sustainable learning'}</span>
          <strong>{roleMode === 'admin' ? 'Review progress and verification.' : 'Learn, verify, and continue.'}</strong>
        </div>
      </section>

      <section className="auth-panel-wrap">
        <button className="auth-back" type="button" onClick={() => { setRoleMode(null); changeScreen('login'); }}>
          Change portal
        </button>

        <div className="auth-card animate-fade-in">
          <div className="auth-header">
            <p className="auth-eyebrow">{roleMode === 'admin' ? 'Administrator' : 'Student Access'}</p>
            <h1>{title}</h1>
          </div>

          {message.text && (
            <div className={`auth-alert ${message.type === 'success' ? 'auth-alert-success' : 'auth-alert-error'}`} role="status">
              {message.text}
            </div>
          )}

          {isForgot && (
            <form className="auth-form" onSubmit={handleForgotPassword}>
              <label className="auth-field">
                <span>Email Address</span>
                <input className="input-field auth-input" type="email" value={form.email} onChange={updateForm('email')} required />
              </label>
              <button className="btn btn-primary auth-submit" type="submit" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send OTP'}
              </button>
              <div className="auth-switch">
                <button className="auth-link" type="button" onClick={() => changeScreen('login')}>Back to login</button>
              </div>
            </form>
          )}

          {isReset && (
            <form className="auth-form" onSubmit={handleResetPassword}>
              <label className="auth-field">
                <span>Email Address</span>
                <input className="input-field auth-input" type="email" value={form.email} onChange={updateForm('email')} required />
              </label>
              <label className="auth-field">
                <span>6-digit OTP</span>
                <input className="input-field auth-input auth-otp" type="text" maxLength="6" value={form.otp} onChange={updateForm('otp')} required />
              </label>
              <label className="auth-field" style={{ position: 'relative' }}>
                <span>New Password</span>
                <input className="input-field auth-input" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateForm('password')} minLength="6" required style={{ paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '35px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </label>
              <button className="btn btn-primary auth-submit" type="submit" disabled={isLoading}>
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
              <div className="auth-switch">
                <button className="auth-link" type="button" onClick={() => changeScreen('login')}>Back to login</button>
              </div>
            </form>
          )}

          {isOtp && (
            <form className="auth-form" onSubmit={handleVerifyOtp}>
              <label className="auth-field">
                <span>Email Address</span>
                <input className="input-field auth-input" type="email" value={form.email} onChange={updateForm('email')} required />
              </label>
              <label className="auth-field">
                <span>6-digit OTP</span>
                <input className="input-field auth-input auth-otp" type="text" maxLength="6" value={form.otp} onChange={updateForm('otp')} required />
              </label>
              <div className="otp-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Expires in {Math.floor(otpSecondsLeft / 60)}:{String(otpSecondsLeft % 60).padStart(2, '0')}</span>
                {otpSecondsLeft === 0 && (
                  <button className="auth-link" type="button" onClick={handleResendOtp} disabled={isLoading}>
                    Resend OTP
                  </button>
                )}
              </div>
              <button className="btn btn-primary auth-submit" type="submit" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify email'}
              </button>
            </form>
          )}

          {(!isOtp && !isForgot && !isReset) && (
            <form className="auth-form" onSubmit={isRegister ? handleRegister : handleLogin}>
              <label className="auth-field">
                <span>Username</span>
                <input className="input-field auth-input" type="text" value={form.username} onChange={updateForm('username')} required />
              </label>

              {isRegister && (
                <label className="auth-field">
                  <span>Email Address</span>
                  <input className="input-field auth-input" type="email" value={form.email} onChange={updateForm('email')} required />
                </label>
              )}

              <label className="auth-field" style={{ position: 'relative' }}>
                <span>Password</span>
                <input className="input-field auth-input" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateForm('password')} minLength="6" required style={{ paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '35px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </label>

              {isRegister && (
                <div className="captcha-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>CAPTCHA: </span>
                    <strong style={{ letterSpacing: '3px', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {captcha.question ? captcha.question : 'Loading...'}
                    </strong>
                  </div>
                  <button className="auth-link" style={{ alignSelf: 'flex-start' }} type="button" onClick={loadCaptcha}>Refresh</button>
                  <label className="auth-field">
                    <span>Answer</span>
                    <input className="input-field auth-input" type="text" value={form.captchaAnswer} onChange={updateForm('captchaAnswer')} required />
                  </label>
                </div>
              )}

              <button className="btn btn-primary auth-submit" type="submit" disabled={isLoading}>
                {isLoading ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}
              </button>

              {!isRegister && (
                <div style={{marginTop: '1rem', textAlign: 'center'}}>
                  <button className="auth-link" type="button" onClick={() => changeScreen('forgot-password')}>
                    Forgot Password?
                  </button>
                </div>
              )}
            </form>
          )}

          {(!isOtp && !isForgot && !isReset) && (
            <div className="auth-switch">
              <span>{isRegister ? 'Already verified?' : 'New here?'}</span>
              <button className="auth-link" type="button" onClick={() => changeScreen(isRegister ? 'login' : 'register')}>
                {isRegister ? 'Log in' : 'Create an account'}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
