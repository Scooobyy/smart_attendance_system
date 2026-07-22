import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CameraIcon, 
  PhotoIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CheckBadgeIcon,
  XMarkIcon,
  SparklesIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { classroomAPI, attendanceAPI } from '../services/api';
import PremiumLoader from '../components/UI/PremiumLoader';
import GlassCard from '../components/UI/GlassCard';
import AnimatedButton from '../components/UI/AnimatedButton';
import FileUploadZone from '../components/UI/FileUploadZone';

const MarkAttendance = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [attendanceDate, setAttendanceDate] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchClassrooms();
    const today = new Date().toISOString().split('T')[0];
    setAttendanceDate(today);
  }, []);

  const fetchClassrooms = async () => {
    try {
      const response = await classroomAPI.getAll();
      setClassrooms(response.data.classrooms || []);
    } catch (error) {
      setError('Failed to load classrooms');
      console.error('Classroom fetch error:', error);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setUseCamera(true);
      }
    } catch (err) {
      setError('Camera access denied or not available');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
        setImage(file);
        setPreview(canvas.toDataURL('image/jpeg'));
        stopCamera();
      }, 'image/jpeg');
    }
  };

  const handleImageUpload = (file) => {
    if (file) {
      setImage(file);
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
    setProcessing(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('classroom_id', selectedClassroom);
      formData.append('date', attendanceDate);

      const response = await attendanceAPI.markByFace(formData);
      setResult(response.data);
      
      setImage(null);
      setPreview('');
      setProcessing(false);

    } catch (error) {
      const message = error.response?.data?.message || 'Failed to mark attendance';
      setError(message);
      console.error('Attendance error:', error);
      setProcessing(false);
    } finally {
      setLoading(false);
    }
  };

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
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="p-3 glass-card rounded-xl hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              AI-Powered Attendance
            </h1>
            <p className="text-slate-400">
              Capture classroom photo for automatic face recognition attendance
            </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload/Camera Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-gray-400" />
                Capture Classroom
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
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
                  <label className="block text-sm font-medium text-slate-300 mb-2">
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

                {/* Camera/Upload Toggle */}
                <div className="flex gap-3">
                  <AnimatedButton
                    type="button"
                    variant={!useCamera ? "primary" : "secondary"}
                    onClick={() => { setUseCamera(false); stopCamera(); }}
                    className="flex-1"
                  >
                    <PhotoIcon className="w-5 h-5 mr-2" />
                    Upload Photo
                  </AnimatedButton>
                  <AnimatedButton
                    type="button"
                    variant={useCamera ? "primary" : "secondary"}
                    onClick={() => { setUseCamera(true); startCamera(); }}
                    className="flex-1"
                  >
                    <CameraIcon className="w-5 h-5 mr-2" />
                    Live Camera
                  </AnimatedButton>
                </div>

                {/* Upload Zone */}
                {!useCamera && (
                  <FileUploadZone
                    onUpload={handleImageUpload}
                    maxSize={10}
                  />
                )}

                {/* Camera View */}
                {useCamera && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-2xl overflow-hidden bg-dark-card border border-slate-700"
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Face detection overlay effect */}
                    <div className="absolute inset-0 pointer-events-none">
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-2 border-gray-500/50 rounded-lg"
                      />
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                      <AnimatedButton
                        type="button"
                        variant="primary"
                        onClick={capturePhoto}
                        className="px-8"
                      >
                        <CameraIcon className="w-5 h-5 mr-2" />
                        Capture & Recognize
                      </AnimatedButton>
                    </div>
                  </motion.div>
                )}

                {/* Preview */}
                {preview && !useCamera && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-2xl overflow-hidden border border-slate-700"
                  >
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="w-full h-64 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => { setImage(null); setPreview(''); }}
                      className="absolute top-2 right-2 p-2 bg-red-500/80 rounded-full hover:bg-red-500 transition-colors"
                    >
                      <XCircleIcon className="w-5 h-5 text-white" />
                    </button>
                  </motion.div>
                )}

                <AnimatedButton
                  type="submit"
                  variant="primary"
                  loading={loading}
                  disabled={!selectedClassroom || !attendanceDate || !image}
                  className="w-full"
                >
                  {loading ? 'Processing Faces...' : 'Mark Attendance'}
                </AnimatedButton>
              </form>
            </GlassCard>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-gray-400" />
                Recognition Results
              </h2>

              {/* Processing State */}
              {processing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <PremiumLoader size="lg" text="Recognizing Faces..." />
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '65%' }}
                    transition={{ duration: 2 }}
                    className="mt-6 h-2 bg-slate-700 rounded-full overflow-hidden"
                  >
                    <div className="h-full bg-gradient-gray-gray rounded-full" />
                  </motion.div>
                  <p className="mt-2 text-slate-400 text-sm">Processing Faces • 65%</p>
                </motion.div>
              )}

              {/* Results Display */}
              <AnimatePresence>
                {result && !processing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    {/* Success Message */}
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl"
                    >
                      <p className="text-green-400 font-medium flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5" />
                        {result.message}
                      </p>
                    </motion.div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="glass-card p-4 text-center"
                      >
                        <p className="text-3xl font-bold text-gray-400">
                          {result.face_detection?.total_faces_detected || result.stats?.facesDetected || 0}
                        </p>
                        <p className="text-sm text-slate-400">Faces Detected</p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="glass-card p-4 text-center"
                      >
                        <p className="text-3xl font-bold text-gray-400">
                          {result.face_detection?.faces_matched || result.stats?.facesMatched || 0}
                        </p>
                        <p className="text-sm text-slate-400">Faces Matched</p>
                      </motion.div>
                    </div>

                    {/* Attendance Summary */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="glass-card p-6 text-center border-2 border-green-500/30"
                      >
                        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-gray-gray rounded-xl flex items-center justify-center">
                          <CheckBadgeIcon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-4xl font-bold text-gray-400 mb-1">
                          {result.results?.present?.length || result.stats?.present || 0}
                        </p>
                        <p className="text-sm text-slate-400">Present</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {result.results?.present?.length || result.stats?.present || 0} students identified
                        </p>
                      </motion.div>
                      
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="glass-card p-6 text-center border-2 border-red-500/30"
                      >
                        <div className="w-12 h-12 mx-auto mb-3 bg-gradient-gray-gray rounded-xl flex items-center justify-center">
                          <XCircleIcon className="w-6 h-6 text-white" />
                        </div>
                        <p className="text-4xl font-bold text-gray-400 mb-1">
                          {result.results?.absent?.length || result.stats?.absent || 0}
                        </p>
                        <p className="text-sm text-slate-400">Absent</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {result.results?.absent?.length || result.stats?.absent || 0} students not found
                        </p>
                      </motion.div>
                    </div>

                    {/* Attendance Rate */}
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="glass-card p-6 text-center mb-6"
                    >
                      <div className="text-6xl font-bold premium-gradient-text mb-2">
                        {Math.round(((result.results?.present?.length || result.stats?.present || 0) / 
                          ((result.results?.present?.length || result.stats?.present || 0) + 
                           (result.results?.absent?.length || result.stats?.absent || 0))) * 100) || 0}%
                      </div>
                      <p className="text-slate-400">Attendance Rate</p>
                    </motion.div>

                    {/* Present Students List */}
                    {result.results?.present && result.results.present.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <h3 className="font-bold text-white mb-3">Present Students</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {result.results.present.map((student, index) => (
                            <motion.div
                              key={student.id || student.student_id || student.student_name || index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center justify-between p-3 glass-card rounded-xl"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-gray-gray rounded-full flex items-center justify-center">
                                  <CheckBadgeIcon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-medium text-white">
                                    {student.student_name}
                                  </p>
                                  <p className="text-sm text-slate-400">
                                    {student.student_roll}
                                  </p>
                                </div>
                              </div>
                              {student.attendance_type === 'newly_marked_present' && (
                                <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium border border-gray-500/30">
                                  New
                                </span>
                              )}
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Empty State */}
              {!result && !processing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-20 h-20 mx-auto mb-4 bg-gradient-gray-gray rounded-3xl flex items-center justify-center"
                  >
                    <CameraIcon className="w-10 h-10 text-white" />
                  </motion.div>
                  <p className="text-slate-400">
                    Upload or capture a classroom photo to see results
                  </p>
                </motion.div>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;
