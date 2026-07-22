import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BuildingLibraryIcon, 
  UserGroupIcon, 
  CalendarIcon,
  PlusIcon,
  CameraIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { classroomAPI } from '../services/api';
import PremiumLoader from '../components/UI/PremiumLoader';
import GlassCard from '../components/UI/GlassCard';
import AnimatedButton from '../components/UI/AnimatedButton';

const ClassroomCard = ({ classroom, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ 
        scale: 1.05, 
        rotateX: 5,
        rotateY: 5,
        z: 50
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
      className="relative"
    >
      {/* Animated gradient border */}
      <motion.div
        animate={isHovered ? { scale: 1.02 } : { scale: 1 }}
        className="absolute inset-0 bg-gradient-to-r from-gray-500 via-gray-600 to-gray-500 rounded-2xl blur-xl opacity-20"
      />
      
      <GlassCard className="relative p-6 h-full group cursor-pointer">
        {/* Header with icon and status */}
        <div className="flex items-start justify-between mb-4">
          <motion.div
            animate={isHovered ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.6 }}
            className="w-14 h-14 bg-gradient-gray-gray rounded-2xl flex items-center justify-center shadow-glow"
          >
            <BuildingLibraryIcon className="w-7 h-7 text-white" />
          </motion.div>
          <motion.span
            animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
            className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium border border-gray-500/30"
          >
            Active
          </motion.span>
        </div>

        {/* Classroom name and subject */}
        <h3 className="font-bold text-xl text-white mb-2 group-hover:text-gray-400 transition-colors">
          {classroom.name}
        </h3>
        
        {classroom.subject && (
          <p className="text-slate-400 mb-3">{classroom.subject}</p>
        )}
        
        {classroom.grade_level && (
          <p className="text-slate-500 text-sm mb-4">Grade: {classroom.grade_level}</p>
        )}

        {/* Stats */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center p-3 bg-dark-card rounded-xl">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-gray-400" />
              <span className="text-slate-400">Students:</span>
            </div>
            <span className="font-bold text-white">{classroom.student_count || 0}</span>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-dark-card rounded-xl">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <span className="text-slate-400">Created:</span>
            </div>
            <span className="text-sm text-slate-300">
              {new Date(classroom.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Animated progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">Attendance Today</span>
            <span className="text-sm font-semibold text-gray-400">
              {classroom.today_attendance || 0}%
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${classroom.today_attendance || 0}%` }}
              transition={{ duration: 1, delay: index * 0.1 }}
              className="h-full bg-gradient-gray-gray rounded-full"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Link
            to={`/classrooms/${classroom.id}`}
            className="flex-1"
          >
            <AnimatedButton variant="primary" size="sm" className="w-full h-10">
              View Details
            </AnimatedButton>
          </Link>
          <Link
            to={`/attendance/mark?classroom=${classroom.id}`}
            className="flex-1"
          >
            <AnimatedButton variant="secondary" size="sm" className="w-full h-10">
              <CameraIcon className="w-4 h-4 mr-2" />
              Mark
            </AnimatedButton>
          </Link>
        </div>

        {/* Hover glow effect */}
        <motion.div
          animate={isHovered ? { opacity: 0.5 } : { opacity: 0 }}
          className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-gray-600/10 rounded-2xl pointer-events-none"
        />
      </GlassCard>
    </motion.div>
  );
};

const Classrooms = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const response = await classroomAPI.getAll();
      setClassrooms(response.data.classrooms || []);
    } catch (error) {
      setError('Failed to load classrooms');
      console.error('Classroom fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <PremiumLoader size="lg" text="Loading classrooms..." />
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
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-3 glass-card rounded-xl hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Classrooms</h1>
              <p className="text-slate-400">Manage your classrooms and students</p>
            </div>
          </div>
          <Link to="/classrooms/create">
            <AnimatedButton variant="primary">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Classroom
            </AnimatedButton>
          </Link>
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

      <AnimatePresence>
        {classrooms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glass-card p-16 text-center"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-600 to-gray-700 rounded-3xl flex items-center justify-center shadow-lg shadow-gray-500/50"
            >
              <BuildingLibraryIcon className="w-12 h-12 text-white" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-3">No classrooms yet</h3>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Create your first classroom to get started with AI-powered attendance tracking
            </p>
            <Link to="/classrooms/create">
              <AnimatedButton variant="primary" size="lg">
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Your First Classroom
              </AnimatedButton>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {classrooms.map((classroom, index) => (
              <ClassroomCard key={classroom.id} classroom={classroom} index={index} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};

export default Classrooms;
