const express = require("express");
const cors = require("cors");
require("dotenv").config();

const studentRoutes = require('./routes/student');
const attendanceRoutes = require('./routes/attendance');

const app = express();

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// Routes
app.use('/students', studentRoutes);
app.use('/attendance', attendanceRoutes);

// Server status
app.get("/", (req, res) => res.json({ 
    message: "Smart Attendance Backend is running!",
    timestamp: new Date().toISOString()
}));

// Health check endpoint
app.get("/health", (req, res) => res.json({ 
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
}));

// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});