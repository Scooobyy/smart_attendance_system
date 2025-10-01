const pool = require('../config/db');
const { getFaceEncoding } = require('../services/aiServices');
const fs = require('fs');

async function registerStudent(req, res) {
    let filePath;
    
    try {
        const { name, email } = req.body;
        
        if (!req.file) {
            console.error('No file uploaded');
            return res.status(400).json({ 
                success: false, 
                message: 'No image file provided' 
            });
        }
        
        filePath = req.file.path;
        console.log('Processing registration for:', { name, email, filePath });

        // Validate inputs
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: 'Name and email are required'
            });
        }

        // Get face encoding from AI service
        console.log('Getting face encoding...');
        const encoding = await getFaceEncoding(filePath);
        
        if (!encoding) {
            return res.status(400).json({
                success: false,
                message: 'Could not detect face in the provided image'
            });
        }

        console.log('Face encoding received successfully');

        // Save student to DB
        console.log('Saving to database...');
        const result = await pool.query(
            'INSERT INTO students (name, email, face_encoding) VALUES ($1, $2, $3) RETURNING id',
            [name, email, JSON.stringify(encoding)]
        );
        
        console.log('Student saved with ID:', result.rows[0].id);

        res.json({ 
            success: true, 
            message: 'Student registered successfully',
            studentId: result.rows[0].id
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
        res.status(500).json({ 
            success: false, 
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    } finally {
        // Clean up temp file in finally block to ensure it runs
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log('Temporary file cleaned up');
            } catch (cleanupError) {
                console.error('Error cleaning up file:', cleanupError);
            }
        }
    }
}

module.exports = { registerStudent };