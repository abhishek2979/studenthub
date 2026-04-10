import axios from 'axios';

const api = axios.create({
   baseURL: 'https://studenthub-ww5c.onrender.com/api',
    timeout: 15000,
    withCredentials: true
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('sh_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Skip logout dispatch for login/auth endpoints themselves
      const url = err.config?.url || '';
      const isAuthCall = url.includes('/auth/google') ||
                         url.includes('/auth/login')  ||
                         url.includes('/auth/teacher');
      if (!isAuthCall) {
        localStorage.removeItem('sh_token');
        localStorage.removeItem('sh_user');
        // Fire a custom event — AuthContext listens and clears user state
        // without a hard page reload (which was causing the login loop)
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
    return Promise.reject(err);
  }
);

// ── AUTH ──────────────────────────────────────────────────────────────────
export const authAPI = {
  googleAuth:      data => api.post('/auth/google',           data),
  teacherRegister: data => api.post('/auth/teacher/register', data),
  teacherLogin:    data => api.post('/auth/teacher/login',    data),
  login:           data => api.post('/auth/login',            data),
  getMe:           ()   => api.get('/auth/me'),
  updateProfile:   data => api.put('/auth/update-profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword:  data => api.put('/auth/change-password', data),
};

// ── STUDENTS ──────────────────────────────────────────────────────────────
export const studentAPI = {
  getAll:        params     => api.get('/students', { params }),
  getOne:        id         => api.get(`/students/${id}`),
  create:        data       => api.post('/students', data),
  update:        (id, data) => api.put(`/students/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:        id         => api.delete(`/students/${id}`),
  getStats:      ()         => api.get('/students/stats'),
  resetPassword: (id, data) => api.put(`/students/${id}/reset-password`, data),
};

// ── ATTENDANCE ────────────────────────────────────────────────────────────
export const attendanceAPI = {
  mark:          data         => api.post('/attendance', data),
  getByDate:     params       => api.get('/attendance/by-date', { params }),
  getForStudent: (id, params) => api.get(`/attendance/student/${id}`, { params }),
  getClassStats: params       => api.get('/attendance/class-stats', { params }),
};

// ── RESULTS ───────────────────────────────────────────────────────────────
export const resultAPI = {
  add:           data         => api.post('/results', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll:        params       => api.get('/results/all', { params }),
  getForStudent: (id, params) => api.get(`/results/student/${id}`, { params }),
  update:        (id, data)   => api.put(`/results/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:        id           => api.delete(`/results/${id}`),
  getStats:      params       => api.get('/results/performance-stats', { params }),
};

export default api;
