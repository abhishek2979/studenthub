import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GlobalStyle, Notification } from './components/UI';
import { useNotification } from './hooks/useNotification';

import LoginPage        from './pages/LoginPage';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppInner() {
  const { user, loading, saveSession, logout } = useAuth();
  const { notif, show: showNotif } = useNotification();

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EFECEA' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #E2DDD8', borderTop: '2px solid #2C2C27', animation: 'spin .8s linear infinite', margin: '0 auto 16px' }}/>
        <p style={{ fontSize: 13, color: '#A09891', fontFamily: "'DM Sans', sans-serif" }}>Loading StudentHub…</p>
      </div>
    </div>
  );

  return (
    <>
      <Notification notif={notif}/>
      {user
        ? user.role === 'teacher'
          ? <TeacherDashboard user={user} onLogout={logout} showNotif={showNotif}/>
          : <StudentDashboard user={user} onLogout={logout} showNotif={showNotif}/>
        : <LoginPage showNotif={showNotif} onLoginSuccess={(token, userData) => saveSession(token, userData)}/>
      }
    </>
  );
}

export default function App() {
  if (!GOOGLE_CLIENT_ID) {
    console.warn('⚠️  VITE_GOOGLE_CLIENT_ID is not set in .env — teacher Google login will not work.');
  }
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <GlobalStyle/>
        <AppInner/>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
