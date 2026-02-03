import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { classroomAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Classrooms = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const response = await classroomAPI.getAll();
      setClassrooms(response.data.classrooms);
    } catch (error) {
      setError('Failed to load classrooms');
      console.error('Classroom fetch error:', error);
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Classrooms</h1>
            <p className="mt-2 text-gray-600">Manage your classrooms and students</p>
          </div>
          <Link
            to="/classrooms/create"
            className="mt-4 sm:mt-0 btn btn-primary"
          >
            Create Classroom
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {classrooms.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🏫</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No classrooms yet</h3>
            <p className="text-gray-600 mb-6">Create your first classroom to get started with attendance tracking</p>
            <Link
              to="/classrooms/create"
              className="btn btn-primary"
            >
              Create Your First Classroom
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((classroom) => (
              <div key={classroom.id} className="card p-6 hover:shadow-md transition-shadow">
                <h3 className="font-bold text-xl text-gray-900 mb-2">{classroom.name}</h3>
                
                {classroom.subject && (
                  <p className="text-gray-600 mb-2">{classroom.subject}</p>
                )}
                
                {classroom.grade_level && (
                  <p className="text-gray-500 text-sm mb-4">Grade: {classroom.grade_level}</p>
                )}

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Students:</span>
                    <span className="font-bold text-gray-900">{classroom.student_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-sm text-gray-500">
                      {new Date(classroom.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Link
                    to={`/classrooms/${classroom.id}`}
                    className="flex-1 btn btn-primary text-center text-sm"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/attendance/mark?classroom=${classroom.id}`}
                    className="flex-1 btn btn-secondary text-center text-sm"
                  >
                    Mark Attendance
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Classrooms;