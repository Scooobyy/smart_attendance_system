const express = require("express");
const cors = require("cors");
require("dotenv").config();

const studentRoutes = require('./routes/student');
const attendanceRoutes = require('./routes/attendance');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/students', studentRoutes);
app.use('/attendance', attendanceRoutes);

// Test server
app.get("/", (req, res) => res.send("✅ Backend is running!"));

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
