import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const AttendanceHeatmap = ({ data = [] }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const heatmapData = data.map((item) => ({
    ...item,
    date: item.date instanceof Date ? item.date : new Date(item.date)
  }));

  const getAttendanceColor = (attendance) => {
    if (attendance === null || attendance === undefined) return 'bg-slate-800 border border-slate-700';
    if (attendance >= 0.9) return 'bg-slate-200';
    if (attendance >= 0.7) return 'bg-slate-300';
    if (attendance >= 0.5) return 'bg-slate-400';
    if (attendance >= 0.3) return 'bg-slate-500';
    return 'bg-slate-600';
  };

  const getAttendanceLabel = (attendance) => {
    if (attendance === null || attendance === undefined) return 'No attendance data';
    return `${Math.round(attendance * 100)}% attendance`;
  };

  const changeMonth = (offset) => {
    const nextMonth = new Date(selectedMonth);
    nextMonth.setMonth(nextMonth.getMonth() + offset);
    setSelectedMonth(nextMonth);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Attendance Heatmap</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-slate-400 font-medium">
            {format(selectedMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-2">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day) => (
            <div key={day} className="text-center text-xs text-slate-500 font-medium">
              {day}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        {heatmapData.length === 0 ? (
          <div className="h-40 rounded-xl border border-slate-700/50 flex items-center justify-center text-sm text-slate-500">
            No attendance data yet
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {heatmapData.map((item, index) => (
              <motion.div
                key={item.date?.toISOString() || index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className={`
                  aspect-square rounded-lg cursor-pointer transition-all duration-200
                  ${getAttendanceColor(item.attendance)}
                  hover:scale-110 hover:shadow-lg
                `}
                title={getAttendanceLabel(item.attendance)}
              />
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
          <span className="text-xs text-slate-500">Low</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-600" />
            <div className="w-3 h-3 rounded bg-slate-500" />
            <div className="w-3 h-3 rounded bg-slate-400" />
            <div className="w-3 h-3 rounded bg-slate-300" />
            <div className="w-3 h-3 rounded bg-slate-200" />
          </div>
          <span className="text-xs text-slate-500">High</span>
        </div>
      </div>
    </motion.div>
  );
};

export default AttendanceHeatmap;
