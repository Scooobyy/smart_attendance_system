const pool = require('../config/db');
const { getFaceEncoding } = require('../services/aiServices');
const fs = require('fs');
const path = require('path');

/**
 * Calculate face similarity using Euclidean distance
 */
function calculateFaceSimilarity(encoding1, encoding2) {
    if (!Array.isArray(encoding1) || !Array.isArray(encoding2) || encoding1.length !== encoding2.length) {
        return Number.MAX_SAFE_INTEGER;
    }

    let sum = 0;
    for (let i = 0; i < encoding1.length; i++) {
        sum += Math.pow(encoding1[i] - encoding2[i], 2);
    }
    return Math.sqrt(sum);
}

/**
 * Extract encoding from database storage
 */
function extractEncodingFromDB(storedEncoding) {
    try {
        // If it's already a proper 1D array, return it
        if (Array.isArray(storedEncoding) && storedEncoding.length === 128 && typeof storedEncoding[0] === 'number') {
            return storedEncoding;
        }
        
        // Handle 2D array format: [[-0.151, 0.028, ...]]
        if (Array.isArray(storedEncoding) && Array.isArray(storedEncoding[0]) && storedEncoding[0].length === 128) {
            return storedEncoding[0];
        }
        
        // Parse the string if it's a string
        if (typeof storedEncoding === 'string') {
            const parsed = JSON.parse(storedEncoding);
            
            // Handle 2D array format: [[-0.151, 0.028, ...]]
            if (Array.isArray(parsed) && Array.isArray(parsed[0]) && parsed[0].length === 128) {
                return parsed[0];
            }
            
            // Handle 1D array format: [-0.151, 0.028, ...]
            if (Array.isArray(parsed) && parsed.length === 128) {
                return parsed;
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Process face encodings from AI service
 */
function processDetectedEncodings(detectedEncodings) {
    if (!detectedEncodings) return [];

    // If it's already an array of arrays (multiple faces), return as-is
    if (Array.isArray(detectedEncodings) && Array.isArray(detectedEncodings[0])) {
        return detectedEncodings;
    }

    // If it's a single encoding array, wrap it in an array
    if (Array.isArray(detectedEncodings) && detectedEncodings.length === 128) {
        return [detectedEncodings];
    }

    return [];
}

/**
 * Mark attendance by comparing detected faces with registered students
 */
async function markAttendance(req, res) {
    let filePath;
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No image file provided' });
        }

        filePath = req.file.path;
        console.log('Starting attendance processing for file:', filePath);

        // Get face encoding from the uploaded image
        const detectedEncodings = await getFaceEncoding(filePath);
        if (!detectedEncodings) {
            return res.status(400).json({ 
                success: false, 
                message: 'No faces detected in the image' 
            });
        }

        // Process the detected encodings
        const processedEncodings = processDetectedEncodings(detectedEncodings);
        if (processedEncodings.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No valid face encodings found' 
            });
        }

        console.log(`Processed ${processedEncodings.length} face encoding(s)`);

        // Get all registered students
        const studentsRes = await pool.query('SELECT id, name, face_encoding FROM students');
        if (studentsRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No students registered' });
        }

        console.log(`Found ${studentsRes.rows.length} registered students`);

        const attendanceResults = [];
        const similarityThreshold = 0.6;
        const matchedStudentIds = new Set();
        const faceMatches = [];

        console.log('Starting face matching process...');

        // Match faces to students
        for (let faceIndex = 0; faceIndex < processedEncodings.length; faceIndex++) {
            const detectedEncoding = processedEncodings[faceIndex];
            
            if (!Array.isArray(detectedEncoding) || detectedEncoding.length !== 128) continue;
            
            let bestMatch = null;
            let bestScore = similarityThreshold;
            
            for (const student of studentsRes.rows) {
                if (matchedStudentIds.has(student.id)) continue;

                try {
                    const storedEncoding = extractEncodingFromDB(student.face_encoding);
                    
                    if (!storedEncoding) {
                        continue;
                    }

                    const score = calculateFaceSimilarity(storedEncoding, detectedEncoding);
                    
                    if (score < bestScore) {
                        bestScore = score;
                        bestMatch = { 
                            studentId: student.id, 
                            name: student.name, 
                            score: score 
                        };
                    }
                } catch (error) {
                    console.error(`Error processing student ${student.name}:`, error);
                }
            }
            
            if (bestMatch) {
                console.log(`Matched: ${bestMatch.name} (score: ${bestMatch.score.toFixed(4)})`);
                faceMatches.push(bestMatch);
                matchedStudentIds.add(bestMatch.studentId);
            }
        }

        console.log(`Matched ${faceMatches.length} students`);

        // Mark attendance for all students
        for (const student of studentsRes.rows) {
            try {
                const match = faceMatches.find(m => m.studentId === student.id);
                const isPresent = match !== undefined;
                
                console.log(`${student.name}: ${isPresent ? 'PRESENT' : 'ABSENT'}`);

                // Record attendance in database
                await pool.query(`
                    INSERT INTO attendance (student_id, date, status) 
                    VALUES ($1, CURRENT_DATE, $2)
                    ON CONFLICT (student_id, date) 
                    DO UPDATE SET status = EXCLUDED.status, updated_at = CURRENT_TIMESTAMP
                `, [student.id, isPresent ? 'present' : 'absent']);
                
                attendanceResults.push({
                    studentId: student.id,
                    name: student.name,
                    status: isPresent ? 'present' : 'absent',
                    confidence: isPresent ? (1 - Math.min(1, match.score)) : 0,
                    matchScore: isPresent ? match.score : null
                });
                
            } catch (error) {
                console.error(`Error for student ${student.name}:`, error);
                attendanceResults.push({
                    studentId: student.id,
                    name: student.name,
                    status: 'error',
                    error: error.message
                });
            }
        }

        const stats = {
            totalStudents: studentsRes.rows.length,
            present: attendanceResults.filter(r => r.status === 'present').length,
            absent: attendanceResults.filter(r => r.status === 'absent').length,
            facesDetected: processedEncodings.length,
            facesMatched: faceMatches.length
        };

        console.log(`Final Results: ${stats.present} present, ${stats.absent} absent`);

        res.json({ 
            success: true, 
            message: 'Attendance processed successfully',
            attendance: attendanceResults,
            stats: stats
        });

    } catch (error) {
        console.error('Error in markAttendance:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Attendance processing failed: ' + error.message
        });
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log('Temporary file cleaned up');
            } catch (err) {
                console.error('Error deleting temp file:', err);
            }
        }
    }
}

/**
 * Get today's attendance for all students
 */
async function getTodaysAttendance(req, res) {
    try {
        console.log('Fetching today\'s attendance...');

        const result = await pool.query(`
            SELECT 
                s.id as student_id,
                s.name as student_name,
                s.email as student_email,
                COALESCE(a.status, 'absent') as status,
                a.date,
                a.updated_at
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id AND a.date = CURRENT_DATE
            ORDER BY s.name
        `);

        const presentCount = result.rows.filter(row => row.status === 'present').length;
        const absentCount = result.rows.filter(row => row.status === 'absent').length;

        console.log(`Today's attendance: ${presentCount} present, ${absentCount} absent`);

        res.json({
            success: true,
            message: 'Today\'s attendance retrieved successfully',
            data: result.rows,
            stats: {
                total: result.rows.length,
                present: presentCount,
                absent: absentCount,
                date: new Date().toISOString().split('T')[0]
            }
        });

    } catch (error) {
        console.error('Error in getTodaysAttendance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve today\'s attendance'
        });
    }
}

/**
 * Get attendance for a date range
 */
async function getAttendanceByDateRange(req, res) {
    try {
        const { start_date, end_date } = req.query;

        if (!start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'start_date and end_date query parameters are required'
            });
        }

        console.log(`Fetching attendance from ${start_date} to ${end_date}`);

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
            return res.status(400).json({
                success: false,
                message: 'Date format should be YYYY-MM-DD'
            });
        }

        const result = await pool.query(`
            SELECT 
                s.id as student_id,
                s.name as student_name,
                s.email as student_email,
                a.date,
                a.status,
                a.updated_at
            FROM students s
            LEFT JOIN attendance a ON s.id = a.student_id AND a.date BETWEEN $1 AND $2
            WHERE a.date IS NOT NULL
            ORDER BY a.date DESC, s.name
        `, [start_date, end_date]);

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                message: 'No attendance records found for the specified date range',
                data: [],
                stats: {
                    date_range: { start_date, end_date },
                    total_days: 0,
                    total_records: 0
                }
            });
        }

        // Group by date
        const attendanceByDate = {};
        result.rows.forEach(row => {
            const date = row.date;
            if (!attendanceByDate[date]) {
                attendanceByDate[date] = {
                    date: date,
                    students: []
                };
            }
            attendanceByDate[date].students.push({
                student_id: row.student_id,
                name: row.student_name,
                email: row.student_email,
                status: row.status,
                updated_at: row.updated_at
            });
        });

        // Calculate statistics
        const dates = Object.keys(attendanceByDate).sort().reverse();
        const dateStats = dates.map(date => {
            const students = attendanceByDate[date].students;
            const present = students.filter(s => s.status === 'present').length;
            const total = students.length;
            return {
                date: date,
                total: total,
                present: present,
                absent: total - present,
                attendance_rate: total > 0 ? Math.round((present / total) * 100) : 0
            };
        });

        const totalRecords = result.rows.length;
        const totalPresent = result.rows.filter(row => row.status === 'present').length;

        console.log(`Date range stats: ${dates.length} days, ${totalPresent}/${totalRecords} present`);

        res.json({
            success: true,
            message: `Attendance from ${start_date} to ${end_date} retrieved successfully`,
            data: Object.values(attendanceByDate),
            stats: {
                date_range: { start_date, end_date },
                total_days: dates.length,
                total_records: totalRecords,
                total_present: totalPresent,
                total_absent: totalRecords - totalPresent,
                overall_attendance_rate: totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0,
                date_wise_stats: dateStats
            }
        });

    } catch (error) {
        console.error('Error in getAttendanceByDateRange:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve attendance for date range'
        });
    }
}

/**
 * Get attendance history for a specific student
 */
async function getStudentAttendance(req, res) {
    try {
        const { id } = req.params;
        const { start_date, end_date } = req.query;

        console.log(`Fetching attendance history for student ID: ${id}`);

        // Validate student exists
        const studentRes = await pool.query(
            'SELECT id, name, email FROM students WHERE id = $1',
            [id]
        );

        if (studentRes.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const student = studentRes.rows[0];
        let query = `
            SELECT date, status, updated_at
            FROM attendance 
            WHERE student_id = $1
        `;
        let queryParams = [id];

        if (start_date && end_date) {
            query += ' AND date BETWEEN $2 AND $3';
            queryParams.push(start_date, end_date);
        }

        query += ' ORDER BY date DESC';

        const attendanceRes = await pool.query(query, queryParams);

        const totalRecords = attendanceRes.rows.length;
        const presentCount = attendanceRes.rows.filter(row => row.status === 'present').length;
        const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

        const stats = {
            total_records: totalRecords,
            present: presentCount,
            absent: totalRecords - presentCount,
            attendance_rate: Math.round(attendanceRate * 100) / 100
        };

        console.log(`Student ${student.name}: ${presentCount} present out of ${totalRecords} records`);

        res.json({
            success: true,
            message: `Attendance history for ${student.name} retrieved successfully`,
            student: {
                id: student.id,
                name: student.name,
                email: student.email
            },
            attendance: attendanceRes.rows,
            stats: stats
        });

    } catch (error) {
        console.error('Error in getStudentAttendance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve student attendance history'
        });
    }
}

module.exports = { 
    markAttendance,
    getTodaysAttendance,
    getAttendanceByDateRange,
    getStudentAttendance
};