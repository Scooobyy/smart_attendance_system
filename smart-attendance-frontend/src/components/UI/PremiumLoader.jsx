import React from 'react';
import { motion } from 'framer-motion';

const PremiumLoader = ({ size = 'md', text = 'Processing...' }) => {
  const sizes = {
    sm: { container: 'w-16 h-16', dot: 'w-2 h-2' },
    md: { container: 'w-24 h-24', dot: 'w-3 h-3' },
    lg: { container: 'w-32 h-32', dot: 'w-4 h-4' }
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className={`relative ${currentSize.container} flex items-center justify-center`}>
        {/* Elegant spinning ring */}
        <motion.div
          className={`absolute inset-0 rounded-full border-2 border-slate-700`}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Inner spinning ring */}
        <motion.div
          className={`absolute inset-2 rounded-full border-2 border-slate-600`}
          animate={{
            rotate: [360, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Center dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`${currentSize.dot} rounded-full bg-slate-400`}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
      </div>
      
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-slate-400 font-medium tracking-wide"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
};

export default PremiumLoader;
