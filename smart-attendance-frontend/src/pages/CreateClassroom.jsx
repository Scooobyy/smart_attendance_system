import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classroomAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const CreateClassroom = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    grade_level: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.name.trim()) {
      setError('Classroom name is required');
      setLoading(false);
      return;
    }

    try {
      const response = await classroomAPI.create(formData);
      
      if (response.data.success) {
        navigate('/classrooms');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create classroom';
      setError(message);
      console.error('Create classroom error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Classroom</h1>
          <p className="mt-2 text-gray-600">Create a new classroom to start managing student attendance</p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Classroom Name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Mathematics 101, Science Class A"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                value={formData.subject}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Mathematics, Science, English"
              />
            </div>

            <div>
              <label htmlFor="grade_level" className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level
              </label>
              <input
                id="grade_level"
                name="grade_level"
                type="text"
                value={formData.grade_level}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Grade 10, Class 12, Year 1"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="input resize-none"
                placeholder="Optional: Add a description for this classroom..."
              />
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/classrooms')}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center items-center btn btn-primary"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Creating...</span>
                  </>
                ) : (
                  'Create Classroom'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateClassroom;