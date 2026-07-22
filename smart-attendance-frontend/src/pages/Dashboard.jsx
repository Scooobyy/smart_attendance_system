import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  BuildingLibraryIcon,
  CameraIcon,
  DocumentChartBarIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PremiumLoader from '../components/UI/PremiumLoader';
import StatsCard from '../components/UI/StatsCard';
import GlassCard from '../components/UI/GlassCard';
import AnimatedButton from '../components/UI/AnimatedButton';
import AttendanceHeatmap from '../components/UI/AttendanceHeatmap';
import AttendifyLogo from '../components/UI/AttendifyLogo';
import ProfileMenu from '../components/UI/ProfileMenu';

const Dashboard = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [stats, setStats] = useState({ totalClassrooms: 0, totalStudents: 0, todayAttendance: 0 });
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getSummary();
      setClassrooms(response.data.classrooms || []);
      setStats(response.data.stats || { totalClassrooms: 0, totalStudents: 0, todayAttendance: 0 });
      setHeatmapData(response.data.heatmap || []);
      
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testBackends = async () => {
    try {
      return null;
      alert('✅ Both backends are working!');
    } catch (error) {
      alert('❌ One or both backends are not responding');
      console.error('Backend test failed:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { to: '/classrooms', label: 'Classrooms', icon: BuildingLibraryIcon },
    { to: '/attendance/mark', label: 'Attendance', icon: CameraIcon },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <PremiumLoader size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg relative overflow-x-hidden">
      {/* Animated background elements */}
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
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.05, 0.1, 0.05]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-gray-500 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Integrated Navigation Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-card relative z-50 overflow-visible rounded-2xl p-4 mb-8 border border-slate-700/50"
        >
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-4">
              <AttendifyLogo size="sm" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-3 px-5 py-3 rounded-xl text-base font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <link.icon className="w-6 h-6" />
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <ProfileMenu user={user} stats={stats} onLogout={handleLogout} onUpdateProfile={updateProfile} />
              </div>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden pt-4 border-t border-slate-700/50 mt-4"
              >
                <div className="space-y-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                    >
                      <link.icon className="w-7 h-7" />
                      {link.label}
                    </Link>
                  ))}
                  <div className="px-4 pt-2 sm:hidden">
                    <ProfileMenu user={user} stats={stats} onLogout={handleLogout} onUpdateProfile={updateProfile} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="relative z-0 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold premium-gradient-text mb-2">
            Analytics Overview
          </h1>
          <p className="text-slate-400 text-lg">
            Real-time insights powered by AI
          </p>
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

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatsCard
            title="Total Classrooms"
            value={stats.totalClassrooms}
            icon={BuildingLibraryIcon}
            gradient="gray-gray"
          />
          <StatsCard
            title="Total Students"
            value={stats.totalStudents}
            icon={UserGroupIcon}
            gradient="gray-gray"
          />
          <StatsCard
            title="Today's Attendance"
            value={`${stats.todayAttendance}%`}
            icon={ChartBarIcon}
            gradient="gray-gray"
          />
          <StatsCard
            title="Your Role"
            value={user?.role || 'Teacher'}
            icon={AcademicCapIcon}
            gradient="gray-gray"
          />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/classrooms"
                    className="block p-6 glass-card hover:border-gray-500/50 transition-all duration-300 text-center group"
                  >
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="w-12 h-12 mx-auto mb-3 bg-gradient-gray-gray rounded-xl flex items-center justify-center"
                    >
                      <BuildingLibraryIcon className="w-6 h-6 text-white" />
                    </motion.div>
                    <p className="font-medium text-white group-hover:text-gray-400 transition-colors">
                      Manage Classrooms
                    </p>
                  </Link>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/attendance/mark"
                    className="block p-6 glass-card hover:border-gray-500/50 transition-all duration-300 text-center group"
                  >
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="w-12 h-12 mx-auto mb-3 bg-gradient-gray-gray rounded-xl flex items-center justify-center"
                    >
                      <CameraIcon className="w-6 h-6 text-white" />
                    </motion.div>
                    <p className="font-medium text-white group-hover:text-gray-400 transition-colors">
                      Mark Attendance
                    </p>
                  </Link>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/attendance/view"
                    className="block p-6 glass-card hover:border-gray-500/50 transition-all duration-300 text-center group"
                  >
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="w-12 h-12 mx-auto mb-3 bg-gradient-gray-gray rounded-xl flex items-center justify-center"
                    >
                      <DocumentChartBarIcon className="w-6 h-6 text-white" />
                    </motion.div>
                    <p className="font-medium text-white group-hover:text-gray-400 transition-colors">
                      View Reports
                    </p>
                  </Link>
                </motion.div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Attendance Heatmap */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <AttendanceHeatmap data={heatmapData} />
          </motion.div>
        </div>

        {/* Recent Classrooms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Your Classrooms</h2>
              <Link to="/classrooms">
                <AnimatedButton variant="primary" size="sm">
                  View All
                </AnimatedButton>
              </Link>
            </div>

            <AnimatePresence>
              {classrooms.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 mx-auto mb-4 bg-gradient-gray-gray rounded-2xl flex items-center justify-center"
                  >
                    <BuildingLibraryIcon className="w-10 h-10 text-white" />
                  </motion.div>
                  <p className="text-slate-400 mb-4 text-lg">No classrooms found</p>
                  <Link to="/classrooms/create">
                    <AnimatedButton variant="primary">
                      Create Your First Classroom
                    </AnimatedButton>
                  </Link>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classrooms.slice(0, 3).map((classroom, index) => (
                    <motion.div
                      key={classroom.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="glass-card p-6 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-gray-gray rounded-xl flex items-center justify-center">
                          <BuildingLibraryIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs font-medium">
                          Active
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-white mb-2 group-hover:text-gray-400 transition-colors">
                        {classroom.name}
                      </h3>
                      {classroom.subject && (
                        <p className="text-slate-400 text-sm mb-3">{classroom.subject}</p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">
                          <span className="font-semibold text-white">{classroom.student_count || 0}</span> students
                        </span>
                        <Link
                          to={`/classrooms/${classroom.id}`}
                          className="text-gray-400 hover:text-gray-300 font-medium"
                        >
                          View Details →
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
