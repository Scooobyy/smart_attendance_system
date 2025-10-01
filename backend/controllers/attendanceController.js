const pool = require('../config/db');
const { getFaceEncoding } = require('../services/aiServices');
const fs = require('fs');
const path = require('path');

/**
 * Enhanced face similarity calculation with detailed logging
 * Returns a value between 0 (identical) and ~1.4 (completely different)
 */
function calculateFaceSimilarity(encoding1, encoding2) {
    if (!Array.isArray(encoding1) || !Array.isArray(encoding2) || 
        encoding1.length !== encoding2.length) {
        console.error('Invalid encoding format:', {
            encoding1_length: encoding1?.length,
            encoding2_length: encoding2?.length,
            encoding1_type: typeof encoding1,
            encoding2_type: typeof encoding2
        });
        return Number.MAX_SAFE_INTEGER;
    }

    let sum = 0;
    for (let i = 0; i < encoding1.length; i++) {
        sum += Math.pow(encoding1[i] - encoding2[i], 2);
    }

    return Math.sqrt(sum);
}

/**
 * Normalize face encoding vector to unit length
 */
function normalizeEncoding(encoding) {
    if (!Array.isArray(encoding)) return encoding;
    
    const norm = Math.sqrt(encoding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
        return encoding.map(val => val / norm);
    }
    return encoding;
}

/**
 * Process face encodings from AI service to handle multiple formats
 */
function processDetectedEncodings(detectedEncodings) {
    console.log('Raw detected encodings:', {
        type: typeof detectedEncodings,
        isArray: Array.isArray(detectedEncodings),
        length: Array.isArray(detectedEncodings) ? detectedEncodings.length : 'N/A'
    });

    if (!detectedEncodings) {
        return [];
    }

    // Case 1: Single encoding (array of 128 numbers)
    if (Array.isArray(detectedEncodings) && detectedEncodings.length === 128 && 
        typeof detectedEncodings[0] === 'number') {
        console.log('Detected: Single face encoding (128 numbers)');
        return [detectedEncodings];
    }

    // Case 2: Array of multiple encodings (each encoding is array of 128 numbers)
    if (Array.isArray(detectedEncodings) && Array.isArray(detectedEncodings[0]) && 
        detectedEncodings[0].length === 128) {
        console.log(`Detected: Multiple face encodings (${detectedEncodings.length} faces)`);
        return detectedEncodings;
    }

    // Case 3: Array with single encoding inside array
    if (Array.isArray(detectedEncodings) && detectedEncodings.length === 1 && 
        Array.isArray(detectedEncodings[0]) && detectedEncodings[0].length === 128) {
        console.log('Detected: Single face encoding wrapped in array');
        return detectedEncodings;
    }

    // Case 4: Object with encodings property
    if (detectedEncodings.encodings && Array.isArray(detectedEncodings.encodings)) {
        console.log(`Detected: Multiple encodings in object (${detectedEncodings.encodings.length} faces)`);
        return detectedEncodings.encodings;
    }

    console.log('Unknown encoding format, returning empty array');
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
        console.log('\n--- Starting attendance processing ---');
        console.log('Processing file:', filePath);

        // Get face encoding from the uploaded image
        const detectedEncodings = await getFaceEncoding(filePath);
        if (!detectedEncodings) {
            return res.status(400).json({ 
                success: false, 
                message: 'No faces detected in the image or face detection failed' 
            });
        }

        // Process the detected encodings to handle multiple formats
        const processedEncodings = processDetectedEncodings(detectedEncodings);
        
        if (processedEncodings.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No valid face encodings found in the image' 
            });
        }

        console.log(`Successfully processed ${processedEncodings.length} face encoding(s)`);
        console.log('Sample encoding length:', processedEncodings[0].length);

        // Get all registered students from DB
        const studentsRes = await pool.query('SELECT id, name, face_encoding FROM students');
        if (studentsRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No students registered' });
        }

        console.log(`Found ${studentsRes.rows.length} registered students`);

        const attendanceResults = [];
        const similarityThreshold = 0.7; // Adjust based on testing (lower is more strict)
        
        // Track which students and faces have been matched
        const matchedStudentIds = new Set();
        const matchedFaceIndices = new Set();
        const faceMatches = [];

        console.log(`\n--- Starting face matching process ---`);
        console.log(`Detected faces: ${processedEncodings.length}`);
        console.log(`Registered students: ${studentsRes.rows.length}`);
        
        // For each detected face, find the best matching student
        for (let faceIndex = 0; faceIndex < processedEncodings.length; faceIndex++) {
            const detectedEncoding = processedEncodings[faceIndex];
            
            if (!Array.isArray(detectedEncoding) || detectedEncoding.length !== 128) {
                console.error(`Skipping invalid detected encoding for face #${faceIndex + 1}`);
                continue;
            }
            
            const normalizedDetected = normalizeEncoding(detectedEncoding);
            let bestMatch = null;
            let bestScore = similarityThreshold;
            
            console.log(`\n🔍 Processing detected face #${faceIndex + 1}`);
            
            // Find the best matching student for this face
            for (const student of studentsRes.rows) {
                // Skip already matched students
                if (matchedStudentIds.has(student.id)) {
                    continue;
                }

                try {
                    // Parse and validate the stored face encoding
                    let storedEncoding;
                    try {
                        storedEncoding = typeof student.face_encoding === 'string' ? 
                            JSON.parse(student.face_encoding) : 
                            student.face_encoding;
                        
                        if (!Array.isArray(storedEncoding) || storedEncoding.length !== 128) {
                            console.error(`Invalid encoding format for student ${student.id}`);
                            continue;
                        }
                        
                        storedEncoding = normalizeEncoding(storedEncoding);
                    } catch (parseError) {
                        console.error(`Error parsing encoding for student ${student.id}:`, parseError);
                        continue;
                    }
                    
                    const score = calculateFaceSimilarity(storedEncoding, normalizedDetected);
                    console.log(`  ${student.name}: score=${score.toFixed(4)}`);
                    
                    // Lower score means better match
                    if (score < bestScore) {
                        bestScore = score;
                        bestMatch = {
                            studentId: student.id,
                            name: student.name,
                            faceIndex: faceIndex,
                            score: score
                        };
                    }
                    
                } catch (error) {
                    console.error(`Error processing student ${student.id}:`, error);
                }
            }
            
            // If we found a good enough match for this face
            if (bestMatch) {
                console.log(`✅ Face #${faceIndex + 1} matched to: ${bestMatch.name} (score: ${bestMatch.score.toFixed(4)})`);
                faceMatches.push(bestMatch);
                matchedStudentIds.add(bestMatch.studentId);
                matchedFaceIndices.add(faceIndex);
            } else {
                console.log(`❌ No good match found for face #${faceIndex + 1}`);
            }
        }

        console.log(`\n--- Marking attendance ---`);
        console.log(`Matched ${faceMatches.length} students out of ${studentsRes.rows.length} registered`);
        console.log(`Used ${matchedFaceIndices.size} out of ${processedEncodings.length} detected faces`);

        // Mark attendance for all students
        for (const student of studentsRes.rows) {
            try {
                // Check if this student was matched with any face
                const match = faceMatches.find(m => m.studentId === student.id);
                const isPresent = match !== undefined;
                
                const statusEmoji = isPresent ? '✅ PRESENT' : '❌ ABSENT';
                console.log(`Student ${student.name}: ${statusEmoji}`);
                
                // Record attendance in database
                await pool.query(`
                    INSERT INTO attendance (student_id, date, status) 
                    VALUES ($1, CURRENT_DATE, $2)
                    ON CONFLICT (student_id, date) 
                    DO UPDATE SET 
                        status = EXCLUDED.status,
                        updated_at = CURRENT_TIMESTAMP
                `, [student.id, isPresent ? 'present' : 'absent']);
                
                // Add to results
                attendanceResults.push({
                    studentId: student.id,
                    name: student.name,
                    status: isPresent ? 'present' : 'absent',
                    confidence: isPresent ? (1 - Math.min(1, match.score)) : 0,
                    matchScore: isPresent ? match.score : null,
                    matchedFaceIndex: isPresent ? match.faceIndex : null
                });
                
            } catch (error) {
                console.error(`Error processing attendance for student ${student.id}:`, error);
                attendanceResults.push({
                    studentId: student.id,
                    name: student.name,
                    status: 'error',
                    error: error.message
                });
            }
        }

        // Generate statistics
        const stats = {
            totalStudents: studentsRes.rows.length,
            present: attendanceResults.filter(r => r.status === 'present').length,
            absent: attendanceResults.filter(r => r.status === 'absent').length,
            errors: attendanceResults.filter(r => r.status === 'error').length,
            facesDetected: processedEncodings.length,
            facesMatched: faceMatches.length,
            unmatchedFaces: processedEncodings.length - faceMatches.length
        };

        console.log('\n--- Final Results ---');
        console.log(`Total students: ${stats.totalStudents}`);
        console.log(`Present: ${stats.present}`);
        console.log(`Absent: ${stats.absent}`);
        console.log(`Faces detected: ${stats.facesDetected}`);
        console.log(`Faces matched: ${stats.facesMatched}`);
        console.log(`Unmatched faces: ${stats.unmatchedFaces}`);

        // Log present students for clarity
        const presentStudents = attendanceResults.filter(r => r.status === 'present');
        if (presentStudents.length > 0) {
            console.log('\n📋 Present Students:');
            presentStudents.forEach(student => {
                console.log(`  - ${student.name} (Face #${student.matchedFaceIndex + 1}, Confidence: ${(student.confidence * 100).toFixed(1)}%)`);
            });
        }

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
            message: 'Attendance processing failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        // Clean up the uploaded file
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log('Cleaned up temporary file');
            } catch (err) {
                console.error('Error deleting temp file:', err);
            }
        }
    }
}

module.exports = { markAttendance };