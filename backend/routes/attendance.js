const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { 
    markAttendance, 
    getTodaysAttendance, 
    getAttendanceByDateRange, 
    getStudentAttendance 
} = require('../controllers/attendanceController');

// Import pool directly here
const pool = require('../config/db');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');kashvfyavfiasvfasvf
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, JPEG, and PNG files are allowed.'));
    }
};

// Initialize multer upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
    if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({
            success: false,
            message: err.message || 'Error uploading file'
        });
    }
    next();
};

// Debug route to check encodings
router.get('/debug-encodings', async (req, res) => {
    try {
        console.log('Checking database encodings...');
        const students = await pool.query('SELECT id, name, face_encoding FROM students');
        
        const encodingInfo = students.rows.map(student => {
            let encoding;
            try {
                encoding = JSON.parse(student.face_encoding);
                return {
                    id: student.id,
                    name: student.name,
                    encodingValid: Array.isArray(encoding) && encoding.length === 128,
                    encodingLength: Array.isArray(encoding) ? encoding.length : 'N/A',
                    sample: Array.isArray(encoding) ? encoding.slice(0, 3) : 'N/A'
                };
            } catch (e) {
                return {
                    id: student.id,
                    name: student.name,
                    encodingValid: false,
                    error: e.message
                };
            }
        });

        console.log('Encoding check completed');
        res.json({ success: true, encodings: encodingInfo });
    } catch (error) {
        console.error('Error in debug-encodings:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Mark attendance route
router.post(
    '/mark',
    upload.single('image'),
    handleUploadError,
    markAttendance
);

// Get today's attendance
router.get('/today', getTodaysAttendance);

// Get attendance by date range
router.get('/range', getAttendanceByDateRange);

// Get attendance history for a specific student
router.get('/student/:id', getStudentAttendance);

// Error handling for routes
router.use((err, req, res, next) => {
    console.error('Route error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

module.exports = router;