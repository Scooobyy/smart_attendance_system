from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import face_recognition
import numpy as np
import cv2
import logging
import os
import json
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
app.config['SECRET_KEY'] = 'smart-attendance-app-secret-2024'
app.config['JWT_SECRET_KEY'] = 'smart-attendance-jwt-secret-2024'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
app.config['JWT_ALGORITHM'] = 'HS256'

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Pranav6615....@localhost:5432/smart_attendance'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
db = SQLAlchemy(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create debug directory if it doesn't exist
debug_dir = os.path.join(os.path.dirname(__file__), 'debug')
os.makedirs(debug_dir, exist_ok=True)

# Database Models
class User(db.Model):
    __tablename__ = 'user'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default='teacher')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

class Classroom(db.Model):
    __tablename__ = 'classroom'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    subject = db.Column(db.String(100))
    grade_level = db.Column(db.String(50))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('classrooms', lazy=True))

class Student(db.Model):
    __tablename__ = 'students'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120))
    student_id = db.Column(db.String(50))
    face_encoding = db.Column(db.Text)
    classroom_id = db.Column(db.Integer, db.ForeignKey('classroom.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    classroom = db.relationship('Classroom', backref=db.backref('students', lazy=True))
    user = db.relationship('User', backref=db.backref('students', lazy=True))

class Attendance(db.Model):
    __tablename__ = 'attendance'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    classroom_id = db.Column(db.Integer, db.ForeignKey('classroom.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='present')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    student = db.relationship('Student', backref=db.backref('attendance_records', lazy=True))
    classroom = db.relationship('Classroom')
    user = db.relationship('User')

def save_debug_image(image, filename):
    """Helper function to save images for debugging"""
    try:
        debug_path = os.path.join(debug_dir, filename)
        if len(image.shape) == 3 and image.shape[2] == 3:
            image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        else:
            image_bgr = image
        cv2.imwrite(debug_path, image_bgr)
        return debug_path
    except Exception as e:
        logger.error(f"Error saving debug image: {str(e)}")
        return None

def detect_faces_in_image(image):
    """Enhanced face detection function"""
    face_locations = []
    detection_methods = [
        {"name": "hog", "upsample": 1},
        {"name": "hog", "upsample": 2},
        {"name": "cnn", "upsample": 1}
    ]
    
    for method in detection_methods:
        try:
            face_locations = face_recognition.face_locations(
                image,
                number_of_times_to_upsample=method["upsample"],
                model=method["name"]
            )
            if face_locations:
                logger.info(f"Face detected using {method['name']} model with upsample={method['upsample']}")
                break
        except Exception as e:
            logger.warning(f"Error with {method['name']} detection: {str(e)}")
    
    # Fallback to OpenCV if no faces found
    if not face_locations:
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            
            cascade_paths = [
                cv2.data.haarcascades + 'haarcascade_frontalface_default.xml',
                cv2.data.haarcascades + 'haarcascade_frontalface_alt2.xml',
            ]
            
            for cascade_path in cascade_paths:
                try:
                    face_cascade = cv2.CascadeClassifier(cascade_path)
                    faces = face_cascade.detectMultiScale(
                        gray,
                        scaleFactor=1.1,
                        minNeighbors=5,
                        minSize=(30, 30)
                    )
                    if len(faces) > 0:
                        logger.info(f"Face detected using OpenCV with {os.path.basename(cascade_path)}")
                        face_locations = [(y, x + w, y + h, x) for (x, y, w, h) in faces]
                        break
                except Exception as e:
                    logger.warning(f"Error with cascade {cascade_path}: {str(e)}")
            
        except Exception as e:
            logger.error(f"Error in OpenCV face detection: {str(e)}", exc_info=True)
    
    return face_locations

# Helper function to get user ID from JWT token
def get_current_user_id():
    return int(get_jwt_identity())

# Helper function to mark all students as absent
def mark_all_absent(classroom_id, user_id, attendance_date, reason):
    """Mark all students in a classroom as absent"""
    try:
        students = Student.query.filter_by(
            classroom_id=classroom_id, 
            user_id=user_id,
            is_active=True
        ).all()
        
        for student in students:
            existing = Attendance.query.filter_by(
                student_id=student.id,
                date=attendance_date,
                classroom_id=classroom_id
            ).first()
            
            if existing:
                existing.status = 'absent'
                existing.updated_at = datetime.utcnow()
            else:
                new_attendance = Attendance(
                    student_id=student.id,
                    classroom_id=classroom_id,
                    user_id=user_id,
                    date=attendance_date,
                    status='absent'
                )
                db.session.add(new_attendance)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"Attendance marked. All students marked as absent. Reason: {reason}",
            "results": {
                'present': [],
                'absent': [{'student_id': s.id, 'student_name': s.name, 'student_roll': s.student_id} for s in students]
            },
            "attendance_date": attendance_date.strftime('%Y-%m-%d')
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error marking all absent: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error marking attendance: {str(e)}"
        }), 500

# FIXED: Improved face encoding extraction that handles lists directly
def extractEncodingFromDB(storedEncoding):
    """
    Extract face encoding from database storage - handles both JSON strings and Python lists directly
    """
    try:
        # If it's already a proper 1D array (Python list), return it directly
        if isinstance(storedEncoding, list) and len(storedEncoding) == 128 and isinstance(storedEncoding[0], (int, float)):
            return storedEncoding
        
        # Handle 2D array format: [[-0.151, 0.028, ...]] (Node.js format stored as list)
        if (isinstance(storedEncoding, list) and 
            len(storedEncoding) == 1 and 
            isinstance(storedEncoding[0], list) and 
            len(storedEncoding[0]) == 128):
            return storedEncoding[0]
        
        # Parse the string if it's a JSON string
        if isinstance(storedEncoding, str):
            try:
                parsed = json.loads(storedEncoding)
                
                # Handle 2D array format: [[-0.151, 0.028, ...]] (Node.js format)
                if (isinstance(parsed, list) and 
                    len(parsed) == 1 and 
                    isinstance(parsed[0], list) and 
                    len(parsed[0]) == 128):
                    return parsed[0]
                
                # Handle 1D array format: [-0.151, 0.028, ...] (Python format)
                if isinstance(parsed, list) and len(parsed) == 128:
                    return parsed
                    
            except json.JSONDecodeError:
                # If it's not valid JSON, return None
                return None
        
        return None
    except Exception as e:
        logger.error(f"Error extracting encoding: {str(e)}")
        return None

# FIXED: Debug endpoint that handles list encodings directly
@app.route("/api/debug/classroom/<int:classroom_id>/students")
@jwt_required()
def debug_classroom_students(classroom_id):
    try:
        user_id = get_current_user_id()
        
        # Verify classroom belongs to user
        classroom = Classroom.query.filter_by(id=classroom_id, user_id=user_id).first()
        if not classroom:
            return jsonify({"success": False, "message": "Classroom not found"}), 404
        
        students = Student.query.filter_by(classroom_id=classroom_id, user_id=user_id, is_active=True).all()
        
        student_data = []
        for student in students:
            has_encoding = student.face_encoding is not None
            encoding_type = "none"
            encoding_length = 0
            
            if has_encoding:
                # Check the actual type of the encoding
                if isinstance(student.face_encoding, list):
                    encoding_type = "list"
                    encoding_length = len(student.face_encoding)
                elif isinstance(student.face_encoding, str):
                    encoding_type = "string"
                    encoding_length = len(student.face_encoding)
                else:
                    encoding_type = f"other: {type(student.face_encoding).__name__}"
            
            # Test if encoding can be loaded and its format
            encoding_valid = False
            encoding_format = "unknown"
            extraction_error = None
            
            if has_encoding:
                try:
                    # Use our improved extraction function that handles lists directly
                    extracted = extractEncodingFromDB(student.face_encoding)
                    
                    if extracted is not None and len(extracted) == 128:
                        encoding_valid = True
                        if isinstance(student.face_encoding, list):
                            if len(student.face_encoding) == 1 and isinstance(student.face_encoding[0], list):
                                encoding_format = "2D_array (Node.js)"
                            else:
                                encoding_format = "1D_array (Python)"
                        else:
                            encoding_format = "JSON_string"
                    else:
                        encoding_format = f"invalid (length: {len(extracted) if extracted else 0})"
                        
                except Exception as e:
                    encoding_format = "error"
                    extraction_error = str(e)
            
            student_data.append({
                "id": student.id,
                "name": student.name,
                "student_id": student.student_id,
                "has_face_encoding": has_encoding,
                "encoding_type": encoding_type,
                "encoding_length": encoding_length,
                "encoding_valid": encoding_valid,
                "encoding_format": encoding_format,
                "extraction_error": extraction_error,
                "created_at": student.created_at.isoformat() if student.created_at else None
            })
        
        return jsonify({
            "success": True,
            "classroom": {
                "id": classroom.id,
                "name": classroom.name
            },
            "total_students": len(students),
            "students_with_encodings": sum(1 for s in students if s.face_encoding is not None),
            "students_with_valid_encodings": sum(1 for s in student_data if s['encoding_valid']),
            "students": student_data
        })
        
    except Exception as e:
        logger.error(f"Debug classroom error: {str(e)}")
        return jsonify({"success": False, "message": f"Error: {str(e)}"}), 500

# FIXED: Migration endpoint that handles list encodings directly
@app.route("/api/migrate-nodejs-encodings", methods=["POST"])
@jwt_required()
def migrate_nodejs_encodings():
    """
    Migrate encodings from any format to proper Python 1D array format as JSON string
    """
    try:
        user_id = get_current_user_id()
        students = Student.query.filter_by(user_id=user_id).all()
        
        migrated_count = 0
        results = []
        
        for student in students:
            if not student.face_encoding:
                results.append({
                    "student_id": student.id,
                    "name": student.name,
                    "status": "skipped",
                    "reason": "No encoding"
                })
                continue
            
            try:
                current_encoding = student.face_encoding
                original_type = type(current_encoding).__name__
                
                # Extract the encoding using our improved function
                extracted = extractEncodingFromDB(current_encoding)
                
                if extracted is None or len(extracted) != 128:
                    results.append({
                        "student_id": student.id,
                        "name": student.name,
                        "status": "error",
                        "reason": f"Could not extract valid encoding (length: {len(extracted) if extracted else 0})"
                    })
                    continue
                
                # Convert to proper Python 1D array format as JSON string
                student.face_encoding = json.dumps(extracted)
                migrated_count += 1
                
                results.append({
                    "student_id": student.id,
                    "name": student.name,
                    "status": "migrated",
                    "from_format": original_type,
                    "to_format": "JSON_string (1D_array)"
                })
                    
            except Exception as e:
                results.append({
                    "student_id": student.id,
                    "name": student.name,
                    "status": "error",
                    "error": str(e)
                })
        
        if migrated_count > 0:
            db.session.commit()
        
        return jsonify({
            "success": True,
            "message": f"Migrated {migrated_count} students to proper JSON format",
            "total_students": len(students),
            "migrated_count": migrated_count,
            "results": results
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Migration error: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

# Debug endpoints
@app.route("/api/debug/jwt-config")
def debug_jwt_config():
    return jsonify({
        "jwt_secret_set": bool(app.config.get('JWT_SECRET_KEY')),
        "jwt_algorithm": app.config.get('JWT_ALGORITHM'),
        "jwt_access_expires": str(app.config.get('JWT_ACCESS_TOKEN_EXPIRES'))
    })

@app.route("/api/debug/test-db")
def test_db():
    try:
        result = db.session.execute("SELECT version()")
        db_version = result.scalar()
        return jsonify({
            "success": True,
            "message": "Database connected",
            "database_version": db_version
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Database error: {str(e)}"
        }), 500

@app.route("/api/debug/check-token", methods=["GET", "POST"])
@jwt_required()
def debug_check_token():
    try:
        user_id = get_current_user_id()
        user = User.query.get(user_id)
        return jsonify({
            "success": True,
            "message": "Token is valid!",
            "user_id": user_id,
            "user_email": user.email if user else None
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Token error: {str(e)}"
        }), 401

# Authentication Endpoints
@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password') or not data.get('name'):
            return jsonify({"success": False, "message": "Email, password and name are required"}), 400
        
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({"success": False, "message": "User already exists with this email"}), 400
        
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        
        new_user = User(
            email=data['email'],
            password_hash=hashed_password,
            name=data['name'],
            role=data.get('role', 'teacher')
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        access_token = create_access_token(identity=str(new_user.id))
        
        return jsonify({
            "success": True,
            "message": "User created successfully",
            "user": {
                "id": new_user.id,
                "email": new_user.email,
                "name": new_user.name,
                "role": new_user.role
            },
            "access_token": access_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": f"Registration failed: {str(e)}"}), 500

@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({"success": False, "message": "Email and password are required"}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not bcrypt.check_password_hash(user.password_hash, data['password']):
            return jsonify({"success": False, "message": "Invalid email or password"}), 401
        
        if not user.is_active:
            return jsonify({"success": False, "message": "Account is deactivated"}), 401
        
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role
            },
            "access_token": access_token
        })
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": f"Login failed: {str(e)}"}), 500

@app.route("/api/profile", methods=["GET"])
@jwt_required()
def get_profile():
    try:
        user_id = get_current_user_id()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"success": False, "message": "User not found"}), 404
        
        return jsonify({
            "success": True,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "created_at": user.created_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Profile error: {str(e)}")
        return jsonify({"success": False, "message": "Failed to get profile"}), 500

# Classroom Endpoints
@app.route("/api/classrooms", methods=["POST"])
@jwt_required()
def create_classroom():
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        if not data.get('name'):
            return jsonify({"success": False, "message": "Classroom name is required"}), 400
        
        new_classroom = Classroom(
            name=data['name'],
            description=data.get('description'),
            subject=data.get('subject'),
            grade_level=data.get('grade_level'),
            user_id=user_id
        )
        
        db.session.add(new_classroom)
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Classroom created successfully",
            "classroom": {
                "id": new_classroom.id,
                "name": new_classroom.name,
                "description": new_classroom.description,
                "subject": new_classroom.subject,
                "grade_level": new_classroom.grade_level
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Create classroom error: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": f"Failed to create classroom: {str(e)}"}), 500

@app.route("/api/classrooms", methods=["GET"])
@jwt_required()
def get_classrooms():
    try:
        user_id = get_current_user_id()
        classrooms = Classroom.query.filter_by(user_id=user_id).all()
        
        classroom_list = []
        for classroom in classrooms:
            student_count = Student.query.filter_by(
                classroom_id=classroom.id, 
                is_active=True
            ).count()
            
            classroom_list.append({
                "id": classroom.id,
                "name": classroom.name,
                "description": classroom.description,
                "subject": classroom.subject,
                "grade_level": classroom.grade_level,
                "student_count": student_count,
                "created_at": classroom.created_at.isoformat()
            })
        
        return jsonify({
            "success": True,
            "classrooms": classroom_list
        })
        
    except Exception as e:
        logger.error(f"Get classrooms error: {str(e)}")
        return jsonify({"success": False, "message": "Failed to get classrooms"}), 500

@app.route("/api/classrooms/<int:classroom_id>", methods=["GET"])
@jwt_required()
def get_classroom(classroom_id):
    try:
        user_id = get_current_user_id()
        classroom = Classroom.query.filter_by(id=classroom_id, user_id=user_id).first()
        
        if not classroom:
            return jsonify({"success": False, "message": "Classroom not found"}), 404
        
        students = Student.query.filter_by(classroom_id=classroom_id, is_active=True).all()
        student_list = []
        
        for student in students:
            student_list.append({
                "id": student.id,
                "name": student.name,
                "email": student.email,
                "student_id": student.student_id,
                "has_face_encoding": bool(student.face_encoding),
                "created_at": student.created_at.isoformat() if student.created_at else None
            })
        
        return jsonify({
            "success": True,
            "classroom": {
                "id": classroom.id,
                "name": classroom.name,
                "description": classroom.description,
                "subject": classroom.subject,
                "grade_level": classroom.grade_level,
                "created_at": classroom.created_at.isoformat()
            },
            "students": student_list
        })
        
    except Exception as e:
        logger.error(f"Get classroom error: {str(e)}")
        return jsonify({"success": False, "message": "Failed to get classroom"}), 500

# Enhanced Student Endpoints with Face Encoding
@app.route("/api/students", methods=["POST"])
@jwt_required()
def create_student():
    try:
        user_id = get_current_user_id()
        
        # Check if form data contains image
        if 'image' not in request.files:
            return jsonify({"success": False, "message": "Student photo is required"}), 400
        
        image_file = request.files['image']
        name = request.form.get('name')
        email = request.form.get('email')
        student_id = request.form.get('student_id')
        classroom_id = request.form.get('classroom_id')
        
        if not name or not classroom_id:
            return jsonify({"success": False, "message": "Name and classroom are required"}), 400
        
        if image_file.filename == '':
            return jsonify({"success": False, "message": "No image selected"}), 400
        
        # Verify classroom belongs to user
        classroom = Classroom.query.filter_by(id=classroom_id, user_id=user_id).first()
        if not classroom:
            return jsonify({"success": False, "message": "Classroom not found"}), 404
        
        # Process the image and detect face
        try:
            file_bytes = np.frombuffer(image_file.read(), np.uint8)
            image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
            
            if image is None:
                return jsonify({"success": False, "message": "Could not read the image file"}), 400
            
            # Save original image for debugging
            original_path = save_debug_image(image, f'student_original_{user_id}.jpg')
            logger.info(f"Student original image saved to {original_path}")
            
            # Convert to RGB for face recognition
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
        except Exception as e:
            logger.error(f"Error reading student image: {str(e)}", exc_info=True)
            return jsonify({"success": False, "message": f"Error processing image: {str(e)}"}), 400
        
        # Detect faces in the image
        face_locations = detect_faces_in_image(rgb_image)
        
        if not face_locations:
            return jsonify({
                "success": False,
                "message": "No face detected in the image. Please ensure:\n" +
                          "1. The face is clearly visible and well-lit\n" +
                          "2. The image is not too dark or blurry\n" +
                          "3. The face is not at an extreme angle"
            }), 400
        
        # Check for multiple faces
        if len(face_locations) > 1:
            return jsonify({
                "success": False,
                "message": "Multiple faces detected. Please upload an image with only one student's face."
            }), 400
        
        # Generate face encoding
        try:
            encodings = face_recognition.face_encodings(rgb_image, face_locations)
            
            if not encodings:
                return jsonify({
                    "success": False,
                    "message": "Face detected but could not generate encoding. Please try with a clearer image."
                }), 400
            
            # Save face encoding
            face_encoding = encodings[0].tolist()
            
            # Draw rectangles on debug image
            debug_image = rgb_image.copy()
            for (top, right, bottom, left) in face_locations:
                cv2.rectangle(debug_image, (left, top), (right, bottom), (0, 255, 0), 2)
            
            detected_path = save_debug_image(debug_image, f'student_detected_{user_id}.jpg')
            logger.info(f"Student face detected and saved to {detected_path}")
            
        except Exception as e:
            logger.error(f"Error generating face encoding: {str(e)}", exc_info=True)
            return jsonify({
                "success": False,
                "message": f"Error generating face encoding: {str(e)}"
            }), 500
        
        # Create student with face encoding
        new_student = Student(
            name=name,
            email=email,
            student_id=student_id,
            face_encoding=json.dumps(face_encoding),  # Store as JSON string
            classroom_id=classroom_id,
            user_id=user_id
        )
        
        db.session.add(new_student)
        db.session.commit()
        
        logger.info(f"Student created successfully: {new_student.id} with face encoding")
        
        return jsonify({
            "success": True,
            "message": "Student created successfully with face encoding",
            "student": {
                "id": new_student.id,
                "name": new_student.name,
                "email": new_student.email,
                "student_id": new_student.student_id,
                "classroom_id": new_student.classroom_id,
                "has_face_encoding": True
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Create student error: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": f"Failed to create student: {str(e)}"}), 500

@app.route("/api/students/<int:student_id>/face", methods=["PUT"])
@jwt_required()
def update_student_face(student_id):
    try:
        user_id = get_current_user_id()
        
        if 'image' not in request.files:
            return jsonify({"success": False, "message": "Image is required"}), 400
        
        image_file = request.files['image']
        
        # Verify student belongs to user
        student = Student.query.filter_by(id=student_id, user_id=user_id).first()
        if not student:
            return jsonify({"success": False, "message": "Student not found"}), 404
        
        # Process image and detect face (same logic as create_student)
        try:
            file_bytes = np.frombuffer(image_file.read(), np.uint8)
            image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
            
            if image is None:
                return jsonify({"success": False, "message": "Could not read the image file"}), 400
            
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
        except Exception as e:
            logger.error(f"Error reading image: {str(e)}", exc_info=True)
            return jsonify({"success": False, "message": f"Error processing image: {str(e)}"}), 400
        
        face_locations = detect_faces_in_image(rgb_image)
        
        if not face_locations:
            return jsonify({
                "success": False,
                "message": "No face detected in the image"
            }), 400
        
        if len(face_locations) > 1:
            return jsonify({
                "success": False,
                "message": "Multiple faces detected. Please upload an image with only one face."
            }), 400
        
        # Generate new face encoding
        try:
            encodings = face_recognition.face_encodings(rgb_image, face_locations)
            
            if not encodings:
                return jsonify({
                    "success": False,
                    "message": "Face detected but could not generate encoding"
                }), 400
            
            # Update face encoding
            student.face_encoding = json.dumps(encodings[0].tolist())
            student.updated_at = datetime.utcnow()
            db.session.commit()
            
            return jsonify({
                "success": True,
                "message": "Face encoding updated successfully"
            })
            
        except Exception as e:
            logger.error(f"Error generating face encoding: {str(e)}", exc_info=True)
            return jsonify({
                "success": False,
                "message": f"Error updating face encoding: {str(e)}"
            }), 500
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Update student face error: {str(e)}")
        return jsonify({"success": False, "message": "Failed to update face encoding"}), 500

# FIXED: Enhanced Face Recognition for Attendance with cumulative present marking
@app.route("/api/attendance/face", methods=["POST"])
@jwt_required()
def mark_attendance_by_face():
    try:
        user_id = get_current_user_id()
        
        if 'image' not in request.files:
            return jsonify({"success": False, "message": "No image provided"}), 400
        
        classroom_id = request.form.get('classroom_id')
        date_str = request.form.get('date')
        
        if not classroom_id or not date_str:
            return jsonify({"success": False, "message": "Classroom ID and date are required"}), 400
        
        # Verify classroom belongs to user
        classroom = Classroom.query.filter_by(id=classroom_id, user_id=user_id).first()
        if not classroom:
            return jsonify({"success": False, "message": "Classroom not found"}), 404
        
        attendance_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        image_file = request.files['image']
        
        # Process the image
        try:
            file_bytes = np.frombuffer(image_file.read(), np.uint8)
            image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
            
            if image is None:
                return jsonify({"success": False, "message": "Could not read the image file"}), 400
            
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Save debug image
            debug_path = save_debug_image(rgb_image, f'attendance_input_{user_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.jpg')
            logger.info(f"Attendance input image saved to: {debug_path}")
            
        except Exception as e:
            logger.error(f"Error reading attendance image: {str(e)}", exc_info=True)
            return jsonify({"success": False, "message": f"Error processing image: {str(e)}"}), 400
        
        # Detect faces in the image
        face_locations = detect_faces_in_image(rgb_image)
        
        logger.info(f"Detected {len(face_locations)} faces in the image")
        
        if not face_locations:
            # No faces detected - but don't mark anyone absent, just return current status
            return get_current_attendance_status(classroom_id, user_id, attendance_date, "No faces detected in the image")
        
        # Get all students from this classroom with face encodings
        students = Student.query.filter_by(
            classroom_id=classroom_id, 
            user_id=user_id,
            is_active=True
        ).all()
        
        logger.info(f"Found {len(students)} students in classroom {classroom_id}")
        
        # Get existing attendance records for today to preserve previously marked present students
        existing_attendance = Attendance.query.filter_by(
            classroom_id=classroom_id,
            date=attendance_date
        ).all()
        
        # Create a set of student IDs already marked present today
        already_present_students = set()
        for record in existing_attendance:
            if record.status == 'present':
                already_present_students.add(record.student_id)
        
        logger.info(f"Found {len(already_present_students)} students already marked present for today")
        
        # Extract face encodings from students using the improved extraction function
        known_face_encodings = []
        student_info = []
        
        for student in students:
            if student.face_encoding is not None:
                try:
                    # Use our improved extraction function that handles lists directly
                    extracted_encoding = extractEncodingFromDB(student.face_encoding)
                    
                    if extracted_encoding is not None and len(extracted_encoding) == 128:
                        known_face_encodings.append(extracted_encoding)
                        student_info.append({
                            'id': student.id,
                            'name': student.name,
                            'student_id': student.student_id,
                            'encoding': extracted_encoding
                        })
                        logger.info(f"Loaded valid face encoding for student: {student.name}")
                    else:
                        logger.warning(f"Invalid encoding for student {student.name}: extracted length = {len(extracted_encoding) if extracted_encoding else 0}")
                except Exception as e:
                    logger.warning(f"Error loading face encoding for student {student.id}: {str(e)}")
                    continue
        
        if not known_face_encodings:
            return jsonify({
                "success": False,
                "message": "No students with valid face encodings found in this classroom"
            }), 400
        
        logger.info(f"Loaded {len(known_face_encodings)} valid face encodings for comparison")
        
        # Generate encodings for faces in the uploaded image
        try:
            unknown_encodings = face_recognition.face_encodings(rgb_image, face_locations)
            
            if not unknown_encodings:
                logger.warning("Could not generate encodings for detected faces")
                return get_current_attendance_status(classroom_id, user_id, attendance_date, "Could not generate encodings for detected faces")
            
            logger.info(f"Generated {len(unknown_encodings)} encodings from detected faces")
            
            newly_matched_students = []
            newly_matched_student_ids = set()
            
            # Compare each face in the image with known students
            for i, unknown_encoding in enumerate(unknown_encodings):
                # Use face_recognition to compare
                matches = face_recognition.compare_faces(known_face_encodings, unknown_encoding, tolerance=0.6)
                face_distances = face_recognition.face_distance(known_face_encodings, unknown_encoding)
                
                logger.info(f"Face {i} - Matches: {sum(matches)}, Min distance: {min(face_distances) if len(face_distances) > 0 else 'N/A'}")
                
                # Find the best match
                best_match_index = None
                if True in matches:
                    # Get the index of the best match (lowest distance)
                    best_match_index = np.argmin(face_distances)
                    best_distance = face_distances[best_match_index]
                    
                    # Use a reasonable threshold
                    if best_distance < 0.6:  # Good match threshold
                        matched_student = student_info[best_match_index]
                        newly_matched_students.append({
                            'student_id': matched_student['id'],
                            'student_name': matched_student['name'],
                            'student_roll': matched_student['student_id'],
                            'confidence': 1 - best_distance,
                            'face_index': i,
                            'distance': best_distance
                        })
                        newly_matched_student_ids.add(matched_student['id'])
                        logger.info(f"Matched face {i} with student: {matched_student['name']} (distance: {best_distance:.4f})")
                    else:
                        logger.info(f"Face {i} - Match found but distance too high: {best_distance}")
                else:
                    logger.info(f"Face {i} - No matches found (min distance: {min(face_distances) if len(face_distances) > 0 else 'N/A'})")
            
            # Combine previously present students with newly matched students
            all_present_student_ids = already_present_students.union(newly_matched_student_ids)
            
            # Mark attendance for all students in the classroom
            attendance_results = {
                'present': [],
                'absent': [],
                'newly_marked_present': [],
                'previously_present': []
            }
            
            for student in students:
                # Check if student was previously present or newly matched
                if student.id in all_present_student_ids:
                    status = 'present'
                    
                    # Determine if this is a new match or previously present
                    if student.id in newly_matched_student_ids and student.id not in already_present_students:
                        attendance_type = 'newly_marked_present'
                    else:
                        attendance_type = 'previously_present'
                    
                    attendance_results['present'].append({
                        'student_id': student.id,
                        'student_name': student.name,
                        'student_roll': student.student_id,
                        'attendance_type': attendance_type
                    })
                    
                    # Add to specific lists for detailed reporting
                    if attendance_type == 'newly_marked_present':
                        attendance_results['newly_marked_present'].append({
                            'student_id': student.id,
                            'student_name': student.name,
                            'student_roll': student.student_id
                        })
                    else:
                        attendance_results['previously_present'].append({
                            'student_id': student.id,
                            'student_name': student.name,
                            'student_roll': student.student_id
                        })
                else:
                    status = 'absent'
                    attendance_results['absent'].append({
                        'student_id': student.id,
                        'student_name': student.name,
                        'student_roll': student.student_id
                    })
                
                # Update or create attendance record
                existing = Attendance.query.filter_by(
                    student_id=student.id,
                    date=attendance_date,
                    classroom_id=classroom_id
                ).first()
                
                if existing:
                    existing.status = status
                    existing.updated_at = datetime.utcnow()
                else:
                    new_attendance = Attendance(
                        student_id=student.id,
                        classroom_id=classroom_id,
                        user_id=user_id,
                        date=attendance_date,
                        status=status
                    )
                    db.session.add(new_attendance)
            
            db.session.commit()
            
            logger.info(f"Attendance marked - Total Present: {len(attendance_results['present'])}, Newly Marked: {len(attendance_results['newly_marked_present'])}, Previously Present: {len(attendance_results['previously_present'])}, Absent: {len(attendance_results['absent'])}")
            
            return jsonify({
                "success": True,
                "message": f"Attendance marked successfully. Total Present: {len(attendance_results['present'])}, Newly Marked: {len(attendance_results['newly_marked_present'])}, Absent: {len(attendance_results['absent'])}",
                "results": attendance_results,
                "face_detection": {
                    "total_faces_detected": len(face_locations),
                    "faces_matched": len(newly_matched_students)
                },
                "attendance_date": date_str
            })
            
        except Exception as e:
            logger.error(f"Error in face matching: {str(e)}", exc_info=True)
            db.session.rollback()
            return jsonify({
                "success": False,
                "message": f"Error in face matching: {str(e)}"
            }), 500
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Mark attendance by face error: {str(e)}", exc_info=True)
        return jsonify({"success": False, "message": f"Failed to mark attendance: {str(e)}"}), 500

def get_current_attendance_status(classroom_id, user_id, attendance_date, reason):
    """Helper function to return current attendance status without making changes"""
    try:
        students = Student.query.filter_by(
            classroom_id=classroom_id, 
            user_id=user_id,
            is_active=True
        ).all()
        
        attendance_results = {
            'present': [],
            'absent': []
        }
        
        for student in students:
            existing = Attendance.query.filter_by(
                student_id=student.id,
                date=attendance_date,
                classroom_id=classroom_id
            ).first()
            
            if existing and existing.status == 'present':
                attendance_results['present'].append({
                    'student_id': student.id,
                    'student_name': student.name,
                    'student_roll': student.student_id
                })
            else:
                attendance_results['absent'].append({
                    'student_id': student.id,
                    'student_name': student.name,
                    'student_roll': student.student_id
                })
        
        return jsonify({
            "success": True,
            "message": f"No changes made. {reason}",
            "results": attendance_results,
            "attendance_date": attendance_date.strftime('%Y-%m-%d')
        })
        
    except Exception as e:
        logger.error(f"Error getting current attendance status: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Error getting attendance status: {str(e)}"
        }), 500

# Attendance Endpoints
@app.route("/api/attendance", methods=["POST"])
@jwt_required()
def mark_attendance():
    try:
        user_id = get_current_user_id()
        data = request.get_json()
        
        if not data.get('classroom_id') or not data.get('date'):
            return jsonify({"success": False, "message": "Classroom ID and date are required"}), 400
        
        classroom = Classroom.query.filter_by(id=data['classroom_id'], user_id=user_id).first()
        if not classroom:
            return jsonify({"success": False, "message": "Classroom not found"}), 404
        
        attendance_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        
        for record in data.get('records', []):
            if not record.get('student_id') or not record.get('status'):
                continue
            
            student = Student.query.filter_by(
                id=record['student_id'], 
                user_id=user_id,
                classroom_id=data['classroom_id']
            ).first()
            
            if student:
                existing = Attendance.query.filter_by(
                    student_id=student.id,
                    date=attendance_date
                ).first()
                
                if existing:
                    existing.status = record['status']
                else:
                    new_attendance = Attendance(
                        student_id=student.id,
                        classroom_id=data['classroom_id'],
                        user_id=user_id,
                        date=attendance_date,
                        status=record['status']
                    )
                    db.session.add(new_attendance)
        
        db.session.commit()
        
        return jsonify({
            "success": True,
            "message": "Attendance marked successfully"
        })
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Mark attendance error: {str(e)}")
        return jsonify({"success": False, "message": "Failed to mark attendance"}), 500

@app.route("/api/attendance/<int:classroom_id>", methods=["GET"])
@jwt_required()
def get_attendance(classroom_id):
    try:
        user_id = get_current_user_id()
        date_str = request.args.get('date')
        
        if not date_str:
            return jsonify({"success": False, "message": "Date parameter is required"}), 400
        
        classroom = Classroom.query.filter_by(id=classroom_id, user_id=user_id).first()
        if not classroom:
            return jsonify({"success": False, "message": "Classroom not found"}), 404
        
        attendance_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        students = Student.query.filter_by(classroom_id=classroom_id, is_active=True).all()
        
        attendance_data = []
        for student in students:
            attendance = Attendance.query.filter_by(
                student_id=student.id,
                date=attendance_date
            ).first()
            
            attendance_data.append({
                "student_id": student.id,
                "student_name": student.name,
                "student_email": student.email,
                "student_roll": student.student_id,
                "status": attendance.status if attendance else "absent",
                "marked_at": attendance.created_at.isoformat() if attendance else None
            })
        
        return jsonify({
            "success": True,
            "attendance": attendance_data,
            "date": date_str,
            "classroom": classroom.name
        })
        
    except Exception as e:
        logger.error(f"Get attendance error: {str(e)}")
        return jsonify({"success": False, "message": "Failed to get attendance"}), 500

@app.route("/")
def home():
    return "✅ AI Service is running with Authentication!"

# Initialize database
def init_db():
    with app.app_context():
        db.create_all()
        os.makedirs(debug_dir, exist_ok=True)
        print("✅ Database tables created")

if __name__ == "__main__":
    init_db()
    app.run(host='0.0.0.0', port=5001, debug=True)