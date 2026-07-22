import React from 'react';
import { motion } from 'framer-motion';
import { 
  UsersIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline';

const StatsCard = ({ title, value, icon: Icon, gradient, trend }) => {
  const gradients = {
    'purple-pink': 'bg-gradient-gray-gray',
    'blue-cyan': 'bg-gradient-gray-gray',
    'green-emerald': 'bg-gradient-gray-gray',
    'orange-red': 'bg-gradient-gray-gray',
    'gray-gray': 'bg-gradient-gray-gray',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="glass-card p-6 relative overflow-hidden group"
    >
      {/* Animated gradient background */}
      <div className={`absolute inset-0 ${gradients[gradient] || gradients['purple-pink']} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${gradients[gradient] || gradients['purple-pink']}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <span className="text-sm text-gray-400 font-medium">
              {trend}
            </span>
          )}
        </div>
        
        <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      
      {/* Decorative glow effect */}
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 ${gradients[gradient] || gradients['purple-pink']} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-300`} />
    </motion.div>
  );
};

export default StatsCard;
