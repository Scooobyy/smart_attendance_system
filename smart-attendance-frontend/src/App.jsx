import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Layout/Navbar';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Lazy load pages
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Classrooms = React.lazy(() => import('./pages/Classrooms'));
const MarkAttendance = React.lazy(() => import('./pages/MarkAttendance'));
const CreateClassroom = React.lazy(() => import('./pages/CreateClassroom'));
const ClassroomDetails = React.lazy(() => import('./pages/ClassroomDetails'));

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <React.Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/classrooms"
                element={
                  <ProtectedRoute>
                    <Classrooms />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/classrooms/create"
                element={
                  <ProtectedRoute>
                    <CreateClassroom />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/classrooms/:id"
                element={
                  <ProtectedRoute>
                    <ClassroomDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/attendance/mark"
                element={
                  <ProtectedRoute>
                    <MarkAttendance />
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </React.Suspense>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;