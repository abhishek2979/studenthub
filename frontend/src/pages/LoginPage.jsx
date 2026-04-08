import { useState } from 'react';
import { Lock, AtSign, Mail, User, BookOpen, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { C, Btn } from '../components/UI';
import { authAPI } from '../utils/api';

/* ── tiny reusable labelled input ── */
function Field({ label, icon: Icon, type = 'text', value, onChange, placeholder, autoComplete, rightEl, style = {} }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text3, marginBottom: 6, letterSpacing: '0.4px' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.text4, pointerEvents: 'none' }} />}
        <input
          type={type} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: `10px 14px 10px ${Icon ? 38 : 14}px`,
            paddingRight: rightEl ? 44 : 14,
            color: C.text, fontSize: 14, outline: 'none',
            fontFamily: "'DM Sans', sans-serif", transition: 'border-color .15s',
            ...style,
          }}
          onFocus={e => e.target.style.borderColor = C.accent}
          onBlur={e  => e.target.style.borderColor = C.border}
        />
        {rightEl}
      </div>
    </div>
  );
}

/* ── small pill tab switcher ── */
function PillTabs({ options, active, onChange }) {
  return (
    <div style={{ display: 'flex', background: C.card2, borderRadius: 8, padding: 3, marginBottom: 20 }}>
      {options.map(([val, label]) => (
        <button key={val} onClick={() => onChange(val)}
          style={{
            flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: 12, fontFamily: "'DM Sans', sans-serif",
            background: active === val ? C.text : 'transparent',
            color:      active === val ? '#fff'  : C.text3,
            transition: 'all .2s',
          }}>
          {label}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TEACHER EMAIL PANEL  (sign-in + sign-up toggled)
══════════════════════════════════════════════════════════════════════════ */
function TeacherEmailPanel({ onLoginSuccess, showNotif }) {
  const [mode,     setMode]     = useState('signin');   // 'signin' | 'signup'
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  const eyeBtn = (
    <button type="button" onClick={() => setShowPw(p => !p)}
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.text4 }}>
      {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
    </button>
  );

  const handleSubmit = async e => {
    e.preventDefault();
    if (!email || !password) return showNotif('Email and password are required', 'error');
    if (mode === 'signup') {
      if (!name.trim())       return showNotif('Name is required', 'error');
      if (password.length < 6) return showNotif('Password must be at least 6 characters', 'error');
      if (password !== confirm) return showNotif('Passwords do not match', 'error');
    }
    setLoading(true);
    try {
      const fn  = mode === 'signup' ? authAPI.teacherRegister : authAPI.teacherLogin;
      const body = mode === 'signup' ? { name: name.trim(), email, password } : { email, password };
      const res = await fn(body);
      onLoginSuccess(res.data.token, res.data.user);
    } catch (err) {
      showNotif(err.response?.data?.message || (mode === 'signup' ? 'Registration failed' : 'Sign-in failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PillTabs
        options={[['signin', '🔑 Sign In'], ['signup', '✨ Create Account']]}
        active={mode} onChange={setMode}
      />

      <form onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <Field label="FULL NAME" icon={User} value={name} onChange={e => setName(e.target.value)}
            placeholder="Dr. Anita Sharma" autoComplete="name" />
        )}

        <Field label="EMAIL ADDRESS" icon={Mail} type="email" value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="teacher@school.edu" autoComplete="email" />

        <Field label="PASSWORD" icon={Lock} type={showPw ? 'text' : 'password'} value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          rightEl={eyeBtn} />

        {mode === 'signup' && (
          <Field label="CONFIRM PASSWORD" icon={Lock} type={showPw ? 'text' : 'password'} value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="••••••••" autoComplete="new-password"
            rightEl={eyeBtn} />
        )}

        <div style={{ marginBottom: 20 }} />
        <Btn type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? (mode === 'signup' ? 'Creating account…' : 'Signing in…')
                   : (mode === 'signup' ? 'Create Teacher Account' : 'Sign In as Teacher')}
        </Btn>
      </form>

      {mode === 'signin' && (
        <p style={{ fontSize: 12, color: C.text4, textAlign: 'center', marginTop: 14 }}>
          No account?{' '}
          <button onClick={() => setMode('signup')}
            style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
            Create one
          </button>
        </p>
      )}
      {mode === 'signup' && (
        <p style={{ fontSize: 12, color: C.text4, textAlign: 'center', marginTop: 14 }}>
          Already have an account?{' '}
          <button onClick={() => setMode('signin')}
            style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>
            Sign in
          </button>
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN LOGIN PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function LoginPage({ onLoginSuccess, showNotif }) {
  const [role,       setRole]       = useState('teacher');
  const [teacherTab, setTeacherTab] = useState('google');  // 'google' | 'email'
  const [loading,    setLoading]    = useState(false);

  // Student state
  const [username, setUsername] = useState('');
  const [stuPass,  setStuPass]  = useState('');
  const [showPw,   setShowPw]   = useState(false);

  /* ── Google auth ─────────────────────────────────────────── */
  const handleGoogleSuccess = async credentialResponse => {
    setLoading(true);
    try {
      const res = await authAPI.googleAuth({ credential: credentialResponse.credential });
      onLoginSuccess(res.data.token, res.data.user);
    } catch (err) {
      showNotif(err.response?.data?.message || 'Google sign-in failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  /* ── Student login ───────────────────────────────────────── */
  const handleStudentLogin = async e => {
    e.preventDefault();
    if (!username || !stuPass) return showNotif('Enter username and password', 'error');
    setLoading(true);
    try {
      const res = await authAPI.login({ username: username.trim().toLowerCase(), password: stuPass });
      if (res.data.user.role !== 'student') return showNotif('This is not a student account', 'error');
      onLoginSuccess(res.data.token, res.data.user);
    } catch (err) {
      showNotif(err.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pwEye = (
    <button type="button" onClick={() => setShowPw(p => !p)}
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.text4 }}>
      {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 430 }}>

        {/* ── Brand ── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: C.sidebar, display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 4px 16px rgba(0,0,0,.15)'
          }}>
            <BookOpen size={26} color="#F0EDE9" />
          </div>
          <h1 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 30, color: C.text, marginBottom: 4, letterSpacing: '-0.5px' }}>
            StudentHub
          </h1>
          <p style={{ color: C.text4, fontSize: 13 }}>Academic Performance & Attendance Platform</p>
        </div>

        {/* ── Card ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, boxShadow: '0 2px 16px rgba(0,0,0,.06)' }}>

          {/* Role tabs */}
          <div style={{ display: 'flex', background: C.card2, borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {[['teacher', '📚 Teacher'], ['student', '🎓 Student']].map(([r, label]) => (
              <button key={r} onClick={() => setRole(r)}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  background: role === r ? C.text : 'transparent',
                  color:      role === r ? '#fff' : C.text3,
                  transition: 'all .2s',
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* ════════ TEACHER ════════ */}
          {role === 'teacher' && (
            <div>
              {/* Google vs Email switcher */}
              <PillTabs
                options={[['google', '🔐 Google'], ['email', '✉️ Email']]}
                active={teacherTab} onChange={setTeacherTab}
              />

              {/* ── Google sign-in ── */}
              {teacherTab === 'google' && (
                <div>
                  <p style={{ fontSize: 13, color: C.text3, textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
                    Sign in securely with your Google account.<br/>
                    <span style={{ color: C.text4, fontSize: 12 }}>No password needed — your Google account is your key.</span>
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                    {loading ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', border: `1px solid ${C.border}`, borderRadius: 10, color: C.text3, fontSize: 14 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${C.border}`, borderTop: `2px solid ${C.text3}`, animation: 'spin .8s linear infinite' }}/>
                        Signing in…
                      </div>
                    ) : (
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => showNotif('Google sign-in was cancelled or failed', 'error')}
                        theme="outline" size="large" shape="rectangular"
                        text="signin_with_google" logo_alignment="left" width="320"
                      />
                    )}
                  </div>

                  <div style={{ marginTop: 20, padding: 14, background: C.card2, borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: 11, color: C.text4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>How it works</p>
                    {[
                      '🔐  Sign in with your school Google account',
                      '✅  Account created automatically on first login',
                      '🎛️  Access dashboard to manage students & results',
                    ].map((s, i) => (
                      <p key={i} style={{ fontSize: 12, color: C.text3, marginBottom: i < 2 ? 5 : 0 }}>{s}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Email + password ── */}
              {teacherTab === 'email' && (
                <TeacherEmailPanel onLoginSuccess={onLoginSuccess} showNotif={showNotif} />
              )}
            </div>
          )}

          {/* ════════ STUDENT ════════ */}
          {role === 'student' && (
            <form onSubmit={handleStudentLogin}>
              <div style={{ marginBottom: 18, padding: 12, background: `${C.accent}10`, borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12, color: C.text3 }}>
                💡 Use the <strong style={{ color: C.text2 }}>username and password</strong> given to you by your teacher.
              </div>

              <Field label="USERNAME" icon={AtSign} value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="arjun.sharma" autoComplete="username" />

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text3, marginBottom: 6, letterSpacing: '0.4px' }}>PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: C.text4, pointerEvents: 'none' }} />
                  <input
                    type={showPw ? 'text' : 'password'} value={stuPass}
                    onChange={e => setStuPass(e.target.value)}
                    placeholder="••••••••" autoComplete="current-password"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: C.card, border: `1px solid ${C.border}`,
                      borderRadius: 10, padding: '10px 44px 10px 38px',
                      color: C.text, fontSize: 14, outline: 'none',
                      fontFamily: "'DM Sans', sans-serif", transition: 'border-color .15s',
                    }}
                    onFocus={e => e.target.style.borderColor = C.accent}
                    onBlur={e  => e.target.style.borderColor = C.border}
                  />
                  {pwEye}
                </div>
              </div>

              <div style={{ marginBottom: 20 }} />
              <Btn type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Signing in…' : 'Sign in as Student'}
              </Btn>

              {/* Demo accounts */}
              <div style={{ marginTop: 18, padding: 12, background: C.card2, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 11, color: C.text4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>Demo Student Accounts</p>
                {[
                  { u: 'arjun.sharma', p: 'Student@123' },
                  { u: 'priya.patel',  p: 'Student@123' },
                ].map(d => (
                  <div key={d.u} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: C.text3, fontFamily: 'monospace' }}>@{d.u}</span>
                    <button type="button" onClick={() => { setUsername(d.u); setStuPass(d.p); }}
                      style={{ background: 'none', border: `1px solid ${C.border}`, color: C.text3, borderRadius: 6, padding: '2px 9px', fontSize: 11, cursor: 'pointer' }}>
                      Fill
                    </button>
                  </div>
                ))}
              </div>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: C.text4, fontSize: 12 }}>
          StudentHub © {new Date().getFullYear()} — Secure Academic Management
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
