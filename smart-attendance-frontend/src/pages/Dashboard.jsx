import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { classroomAPI, debugAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Dashboard = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [stats, setStats] = useState({ totalClassrooms: 0, totalStudents: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await classroomAPI.getAll();
      const classroomsData = response.data.classrooms;
      
      setClassrooms(classroomsData);
      
      const totalStudents = classroomsData.reduce((sum, classroom) => 
        sum + (classroom.student_count || 0), 0
      );
      
      setStats({
        totalClassrooms: classroomsData.length,
        totalStudents
      });
      
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testBackends = async () => {
    try {
      await debugAPI.testFlask();
      await debugAPI.testNode();
      alert('✅ Both backends are working!');
    } catch (error) {
      alert('❌ One or both backends are not responding');
      console.error('Backend test failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-gray-600">Welcome back, {user?.name}!</p>
          </div>
          <button
            onClick={testBackends}
            className="mt-4 sm:mt-0 btn btn-secondary"
          >
            Test Backends
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-primary-600 text-xl">🏫</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Classrooms</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClassrooms}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-xl">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-xl">👤</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Your Role</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{user?.role || 'Teacher'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/classrooms"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">🏫</div>
              <p className="font-medium text-gray-900">Manage Classrooms</p>
            </Link>
            
            <Link
              to="/attendance/mark"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">📸</div>
              <p className="font-medium text-gray-900">Mark Attendance</p>
            </Link>
            
            <Link
              to="/attendance/view"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">📊</div>
              <p className="font-medium text-gray-900">View Reports</p>
            </Link>
          </div>
        </div>

        {/* Recent Classrooms */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Your Classrooms</h2>
            <Link
              to="/classrooms"
              className="btn btn-primary text-sm"
            >
              View All
            </Link>
          </div>

          {classrooms.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🏫</div>
              <p className="text-gray-600 mb-4">No classrooms found</p>
              <Link
                to="/classrooms/create"
                className="btn btn-primary"
              >
                Create Your First Classroom
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.slice(0, 3).map((classroom) => (
                <div key={classroom.id} className="card p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{classroom.name}</h3>
                  {classroom.subject && (
                    <p className="text-gray-600 text-sm mb-2">{classroom.subject}</p>
                  )}
                  <p className="text-gray-700">
                    <span className="font-semibold">{classroom.student_count || 0}</span> students
                  </p>
                  <Link
                    to={`/classrooms/${classroom.id}`}
                    className="mt-4 btn btn-primary w-full text-sm"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;