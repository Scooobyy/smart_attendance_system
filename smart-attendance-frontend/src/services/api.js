import axios from 'axios';

// API base URLs
const FLASK_BASE_URL = 'http://localhost:5001';
const NODE_BASE_URL = 'http://localhost:5000';

// Create axios instances
export const flaskAPI = axios.create({
  baseURL: FLASK_BASE_URL,
  timeout: 30000,
});

export const nodeAPI = axios.create({
  baseURL: NODE_BASE_URL,
  timeout: 30000,
});

// Request interceptor to add auth token
flaskAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('attendance_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
flaskAPI.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('attendance_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => flaskAPI.post('/api/register', userData),
  login: (credentials) => flaskAPI.post('/api/login', credentials),
  getProfile: () => flaskAPI.get('/api/profile'),
};

// Classroom API
export const classroomAPI = {
  create: (classroomData) => flaskAPI.post('/api/classrooms', classroomData),
  getAll: () => flaskAPI.get('/api/classrooms'),
  getById: (id) => flaskAPI.get(`/api/classrooms/${id}`),
};

// Student API
export const studentAPI = {
  createWithFace: (formData) => flaskAPI.post('/api/students', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateFace: (studentId, formData) => flaskAPI.put(`/api/students/${studentId}/face`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Attendance API
export const attendanceAPI = {
  markByFace: (formData) => flaskAPI.post('/api/attendance/face', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  markManual: (attendanceData) => flaskAPI.post('/api/attendance', attendanceData),
  getByClassroom: (classroomId, date) => flaskAPI.get(`/api/attendance/${classroomId}?date=${date}`),
};

// Debug API
export const debugAPI = {
  testFlask: () => flaskAPI.get('/'),
  testNode: () => nodeAPI.get('/'),
  checkToken: () => flaskAPI.get('/api/debug/check-token'),
};