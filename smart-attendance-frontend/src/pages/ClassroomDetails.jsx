import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { classroomAPI, studentAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const ClassroomDetails = () => {
  const { id } = useParams();
  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    student_id: ''
  });
  const [studentImage, setStudentImage] = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);

  useEffect(() => {
    fetchClassroomDetails();
  }, [id]);

  const fetchClassroomDetails = async () => {
    try {
      const response = await classroomAPI.getById(id);
      setClassroom(response.data.classroom);
      setStudents(response.data.students || []);
    } catch (error) {
      setError('Failed to load classroom details');
      console.error('Classroom details error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentFormChange = (e) => {
    setStudentForm({
      ...studentForm,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setStudentImage(file);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    
    if (!studentForm.name.trim() || !studentImage) {
      alert('Student name and photo are required');
      return;
    }

    setStudentLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', studentImage);
      formData.append('name', studentForm.name);
      formData.append('email', studentForm.email);
      formData.append('student_id', studentForm.student_id);
      formData.append('classroom_id', id);

      const response = await studentAPI.createWithFace(formData);
      
      if (response.data.success) {
        // Refresh student list
        fetchClassroomDetails();
        // Reset form
        setStudentForm({ name: '', email: '', student_id: '' });
        setStudentImage(null);
        setShowAddStudent(false);
        document.getElementById('student-image').value = '';
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add student';
      alert(message);
      console.error('Add student error:', error);
    } finally {
      setStudentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Classroom not found</h1>
          <Link to="/classrooms" className="btn btn-primary mt-4">
            Back to Classrooms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{classroom.name}</h1>
              <div className="mt-2 flex flex-wrap gap-4">
                {classroom.subject && (
                  <span className="text-gray-600">Subject: {classroom.subject}</span>
                )}
                {classroom.grade_level && (
                  <span className="text-gray-600">Grade: {classroom.grade_level}</span>
                )}
                <span className="text-gray-600">{students.length} students</span>
              </div>
              {classroom.description && (
                <p className="mt-2 text-gray-600">{classroom.description}</p>
              )}
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Link
                to={`/attendance/mark?classroom=${id}`}
                className="btn btn-primary"
              >
                Mark Attendance
              </Link>
              <button
                onClick={() => setShowAddStudent(true)}
                className="btn btn-secondary"
              >
                Add Student
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Add Student Modal */}
        {showAddStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add Student</h2>
              
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={studentForm.name}
                    onChange={handleStudentFormChange}
                    className="input"
                    placeholder="Enter student's full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    name="student_id"
                    value={studentForm.student_id}
                    onChange={handleStudentFormChange}
                    className="input"
                    placeholder="Optional: Student roll number or ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={studentForm.email}
                    onChange={handleStudentFormChange}
                    className="input"
                    placeholder="Optional: Student's email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student Photo *
                  </label>
                  <input
                    id="student-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Clear face photo for face recognition
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddStudent(false)}
                    className="flex-1 btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={studentLoading}
                    className="flex-1 flex justify-center items-center btn btn-primary"
                  >
                    {studentLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Adding...</span>
                      </>
                    ) : (
                      'Add Student'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Students List */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Students</h2>
          
          {students.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
              <p className="text-gray-600 mb-4">Add students to start marking attendance</p>
              <button
                onClick={() => setShowAddStudent(true)}
                className="btn btn-primary"
              >
                Add Your First Student
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <div key={student.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{student.name}</h3>
                      {student.student_id && (
                        <p className="text-sm text-gray-600">ID: {student.student_id}</p>
                      )}
                      {student.email && (
                        <p className="text-sm text-gray-600">{student.email}</p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        student.has_face_encoding ? 'bg-green-500' : 'bg-yellow-500'
                      }`} title={
                        student.has_face_encoding ? 'Face encoding ready' : 'No face encoding'
                      }></div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    Added: {new Date(student.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassroomDetails;