import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BuildingLibraryIcon, 
  UserGroupIcon, 
  CameraIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { classroomAPI, studentAPI } from '../services/api';
import PremiumLoader from '../components/UI/PremiumLoader';
import GlassCard from '../components/UI/GlassCard';
import AnimatedButton from '../components/UI/AnimatedButton';
import FileUploadZone from '../components/UI/FileUploadZone';

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
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, studentId: null });
  const [deleteClassroomConfirm, setDeleteClassroomConfirm] = useState(false);
  const navigate = useNavigate();

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

  const handleImageUpload = (file) => {
    setStudentImage(file);
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
        fetchClassroomDetails();
        setStudentForm({ name: '', email: '', student_id: '' });
        setStudentImage(null);
        setShowAddStudent(false);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add student';
      alert(message);
      console.error('Add student error:', error);
    } finally {
      setStudentLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    setDeleteConfirm({ show: true, studentId });
  };

  const confirmDeleteStudent = async () => {
    const { studentId } = deleteConfirm;
    setDeleteConfirm({ show: false, studentId: null });

    try {
      await studentAPI.delete(studentId);
      fetchClassroomDetails();
    } catch (error) {
      alert('Failed to delete student');
      console.error('Delete student error:', error);
    }
  };

  const cancelDeleteStudent = () => {
    setDeleteConfirm({ show: false, studentId: null });
  };

  const confirmDeleteClassroom = async () => {
    setDeleteClassroomConfirm(false);

    try {
      await classroomAPI.delete(id);
      navigate('/classrooms');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete classroom';
      alert(message);
      console.error('Delete classroom error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <PremiumLoader size="lg" text="Loading classroom..." />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen bg-dark-bg py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-white">Classroom not found</h1>
          <Link to="/classrooms">
            <AnimatedButton variant="primary" className="mt-4">
              Back to Classrooms
            </AnimatedButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gray-600 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 15, repeat: Infinity, delay: 5 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-700 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/classrooms')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Classrooms
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-12 h-12 bg-gradient-gray-gray rounded-xl flex items-center justify-center shadow-glow"
                >
                  <BuildingLibraryIcon className="w-6 h-6 text-white" />
                </motion.div>
                <h1 className="text-3xl font-bold premium-gradient-text">{classroom.name}</h1>
              </div>
              <div className="flex flex-wrap gap-4 text-slate-400">
                {classroom.subject && (
                  <span className="flex items-center gap-1">
                    <span className="text-gray-400">Subject:</span> {classroom.subject}
                  </span>
                )}
                {classroom.grade_level && (
                  <span className="flex items-center gap-1">
                    <span className="text-gray-400">Grade:</span> {classroom.grade_level}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <UserGroupIcon className="w-4 h-4 text-gray-400" />
                  {students.length} students
                </span>
              </div>
              {classroom.description && (
                <p className="mt-2 text-slate-400">{classroom.description}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Link to={`/attendance/mark?classroom=${id}`}>
                <AnimatedButton variant="primary">
                  <CameraIcon className="w-5 h-5 mr-2" />
                  Mark Attendance
                </AnimatedButton>
              </Link>
              <AnimatedButton
                variant="secondary"
                onClick={() => setShowAddStudent(true)}
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Student
              </AnimatedButton>
              <AnimatedButton
                variant="secondary"
                onClick={() => setDeleteClassroomConfirm(true)}
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <TrashIcon className="w-5 h-5 mr-2" />
                Delete Classroom
              </AnimatedButton>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Add Student Modal */}
        <AnimatePresence>
          {showAddStudent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowAddStudent(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Add Student</h2>
                  <button
                    onClick={() => setShowAddStudent(false)}
                    className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-slate-300 mb-2">
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
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Student Photo *
                    </label>
                    <FileUploadZone
                      onUpload={handleImageUpload}
                      maxSize={10}
                      uploadText="Upload Student Photo"
                      dropText="Drop student photo"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <AnimatedButton
                      type="button"
                      variant="secondary"
                      onClick={() => setShowAddStudent(false)}
                      className="flex-1"
                    >
                      Cancel
                    </AnimatedButton>
                    <AnimatedButton
                      type="submit"
                      variant="primary"
                      loading={studentLoading}
                      className="flex-1"
                    >
                      {studentLoading ? 'Adding...' : 'Add Student'}
                    </AnimatedButton>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirm.show && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={cancelDeleteStudent}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="glass-card p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-white mb-2">Delete Student</h3>
                <p className="text-slate-400 mb-6">
                  Are you sure you want to delete this student? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <AnimatedButton
                    variant="secondary"
                    onClick={cancelDeleteStudent}
                    className="flex-1"
                  >
                    Cancel
                  </AnimatedButton>
                  <AnimatedButton
                    variant="primary"
                    onClick={confirmDeleteStudent}
                    className="flex-1 bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AnimatedButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Classroom Confirmation Modal */}
        <AnimatePresence>
          {deleteClassroomConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setDeleteClassroomConfirm(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="glass-card p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-white mb-2">Delete Classroom</h3>
                <p className="text-slate-400 mb-6">
                  This will permanently delete this classroom, its students, and related attendance records.
                </p>
                <div className="flex gap-3">
                  <AnimatedButton
                    variant="secondary"
                    onClick={() => setDeleteClassroomConfirm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </AnimatedButton>
                  <AnimatedButton
                    variant="primary"
                    onClick={confirmDeleteClassroom}
                    className="flex-1 bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AnimatedButton>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Students List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserGroupIcon className="w-6 h-6 text-gray-400" />
                Students
              </h2>
              <span className="text-slate-400 text-sm">
                {students.length} registered
              </span>
            </div>
            
            {students.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-20 h-20 mx-auto mb-4 bg-gradient-gray-gray rounded-3xl flex items-center justify-center"
                >
                  <UserGroupIcon className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-lg font-medium text-white mb-2">No students yet</h3>
                <p className="text-slate-400 mb-6">Add students to start marking attendance</p>
                <AnimatedButton
                  variant="primary"
                  onClick={() => setShowAddStudent(true)}
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Add Your First Student
                </AnimatedButton>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="glass-card p-5 cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-gray-800">
                        {student.image_url ? (
                          <img 
                            src={student.image_url} 
                            alt={student.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <UserGroupIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          student.has_face_encoding 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {student.has_face_encoding ? (
                            <>
                              <CheckCircleIcon className="w-3 h-3" />
                              Ready
                            </>
                          ) : (
                            <>
                              <ClockIcon className="w-3 h-3" />
                              Processing
                            </>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                          title="Delete student"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2 group-hover:text-gray-400 transition-colors">
                      {student.name}
                    </h3>
                    {student.student_id && (
                      <p className="text-sm text-slate-400 mb-1">ID: {student.student_id}</p>
                    )}
                    {student.email && (
                      <p className="text-sm text-slate-400 mb-3">{student.email}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-slate-500 pt-3 border-t border-slate-700/50">
                      <ClockIcon className="w-3 h-3" />
                      Added: {new Date(student.created_at).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default ClassroomDetails;
