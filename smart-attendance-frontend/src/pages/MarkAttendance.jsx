import React, { useState, useEffect } from 'react';
import { classroomAPI, attendanceAPI } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const MarkAttendance = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [attendanceDate, setAttendanceDate] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchClassrooms();
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    setAttendanceDate(today);
  }, []);

  const fetchClassrooms = async () => {
    try {
      const response = await classroomAPI.getAll();
      setClassrooms(response.data.classrooms);
    } catch (error) {
      setError('Failed to load classrooms');
      console.error('Classroom fetch error:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setImage(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedClassroom || !attendanceDate || !image) {
      setError('Please fill all fields and select an image');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('classroom_id', selectedClassroom);
      formData.append('date', attendanceDate);

      const response = await attendanceAPI.markByFace(formData);
      setResult(response.data);
      
      // Clear form
      setImage(null);
      setPreview('');
      document.getElementById('image-upload').value = '';

    } catch (error) {
      const message = error.response?.data?.message || 'Failed to mark attendance';
      setError(message);
      console.error('Attendance error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
          <p className="mt-2 text-gray-600">Upload a photo to automatically mark attendance using face recognition</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Form */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Upload Photo</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Classroom
                </label>
                <select 
                  value={selectedClassroom} 
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Choose a classroom...</option>
                  {classrooms.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name} ({classroom.student_count || 0} students)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attendance Date
                </label>
                <input
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Group Photo
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  required
                />
                <p className="mt-2 text-sm text-gray-500">
                  Upload a clear photo of students. Multiple faces will be detected automatically.
                </p>
              </div>

              {preview && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Preview
                  </label>
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-lg border border-gray-300"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center btn btn-primary py-3"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Processing...</span>
                  </>
                ) : (
                  'Mark Attendance'
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {result && (
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Attendance Results</h2>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                  <p className="text-green-800 font-medium">✅ {result.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {result.face_detection?.total_faces_detected || 0}
                    </p>
                    <p className="text-sm text-blue-600">Faces Detected</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {result.face_detection?.faces_matched || 0}
                    </p>
                    <p className="text-sm text-green-600">Faces Matched</p>
                  </div>
                </div>

                {result.results && (
                  <>
                    <div className="mb-6">
                      <h3 className="font-bold text-gray-900 mb-3">Attendance Summary</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-green-100 rounded-lg">
                          <p className="text-lg font-bold text-green-800">
                            {result.results.present?.length || 0}
                          </p>
                          <p className="text-sm text-green-700">Present</p>
                        </div>
                        <div className="text-center p-3 bg-red-100 rounded-lg">
                          <p className="text-lg font-bold text-red-800">
                            {result.results.absent?.length || 0}
                          </p>
                          <p className="text-sm text-red-700">Absent</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">Present Students</h3>
                      {result.results.present && result.results.present.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {result.results.present.map((student, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {student.student_name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {student.student_roll}
                                </p>
                              </div>
                              {student.attendance_type === 'newly_marked_present' && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  New
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No students marked present</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;