import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CloudArrowUpIcon, PhotoIcon } from '@heroicons/react/24/outline';

const FileUploadZone = ({ onUpload, accept = "image/*", maxSize = 10, uploadText = "Upload Photo", dropText = "Drop photo", ...props }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file)) {
      onUpload(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && validateFile(file)) {
      onUpload(file);
    }
  };

  const validateFile = (file) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return false;
    }
    
    // Check file size (maxSize in MB)
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert(`File size must be less than ${maxSize}MB`);
      return false;
    }
    
    return true;
  };

  return (
    <motion.div
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      whileHover={{ scale: 1.01 }}
      className={`
        relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300
        ${isDragging 
          ? 'border-purple-500 bg-purple-500/10 scale-[1.02]' 
          : 'border-slate-700 hover:border-purple-500/50 bg-dark-card'
        }
      `}
      {...props}
    >
      <div className="p-12 text-center">
        <motion.div
          animate={isDragging ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
          transition={{ duration: 0.2 }}
          className="mx-auto mb-4 w-16 h-16"
        >
          {isDragging ? (
            <CloudArrowUpIcon className="w-full h-full text-purple-400" />
          ) : (
            <PhotoIcon className="w-full h-full text-slate-500" />
          )}
        </motion.div>
        
        <h3 className="mb-2 text-lg font-semibold text-white">
          {isDragging ? dropText : uploadText}
        </h3>
        
        <p className="mb-4 text-sm text-slate-400">
          {isDragging 
            ? 'Release to upload' 
            : `Drag & drop or click to upload • Supports JPG, PNG up to ${maxSize}MB`
          }
        </p>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => document.getElementById('file-input').click()}
          className="px-6 py-2 bg-gradient-purple-pink text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Choose File
        </motion.button>
        
        <input
          id="file-input"
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          {...props}
        />
      </div>
      
      {/* Animated gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
};

export default FileUploadZone;
