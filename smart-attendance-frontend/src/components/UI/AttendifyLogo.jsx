import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const AttendifyLogo = ({ size = 'md', showText = true, className = '' }) => {
  const sizes = {
    sm: {
      mark: 'w-12 h-12',
      icon: 'w-6 h-6',
      title: 'text-xl',
      subtitle: 'text-xs'
    },
    md: {
      mark: 'w-16 h-16',
      icon: 'w-8 h-8',
      title: 'text-3xl',
      subtitle: 'text-sm'
    },
    lg: {
      mark: 'w-20 h-20',
      icon: 'w-10 h-10',
      title: 'text-4xl',
      subtitle: 'text-base'
    }
  };

  const current = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className={`${current.mark} relative rounded-2xl bg-gradient-to-br from-slate-200 via-slate-400 to-slate-700 shadow-glow flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-2 rounded-xl border border-white/40" />
        <div className="absolute -right-3 -top-3 w-10 h-10 rounded-full bg-white/20" />
        <CheckCircleIcon className={`${current.icon} relative z-10 text-white drop-shadow`} />
      </div>
      {showText && (
        <div>
          <h1 className={`${current.title} font-bold premium-gradient-text leading-tight`}>Attendify</h1>
          <p className={`${current.subtitle} text-slate-400`}>AI attendance intelligence</p>
        </div>
      )}
    </div>
  );
};

export default AttendifyLogo;
