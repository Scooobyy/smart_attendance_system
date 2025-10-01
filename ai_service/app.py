from flask import Flask, request, jsonify
from flask_cors import CORS
import face_recognition
import numpy as np
import cv2
import logging
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create debug directory if it doesn't exist
debug_dir = os.path.join(os.path.dirname(__file__), 'debug')
os.makedirs(debug_dir, exist_ok=True)

def save_debug_image(image, filename):
    """Helper function to save images for debugging"""
    try:
        debug_path = os.path.join(debug_dir, filename)
        # Convert from RGB to BGR for OpenCV
        if len(image.shape) == 3 and image.shape[2] == 3:  # RGB image
            image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        else:  # Already BGR or grayscale
            image_bgr = image
        cv2.imwrite(debug_path, image_bgr)
        return debug_path
    except Exception as e:
        logger.error(f"Error saving debug image: {str(e)}")
        return None

@app.route("/")
def home():
    return "✅ AI Service is running!"

@app.route("/encode-face", methods=["POST"])
def encode_face():
    try:
        # Check if the post request has the file part
        if 'image' not in request.files:
            return jsonify({"success": False, "message": "No image provided"}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({"success": False, "message": "No selected file"}), 400

        # Read the image file
        try:
            # Read the file into a numpy array
            file_bytes = np.frombuffer(file.read(), np.uint8)
            image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
            
            if image is None:
                return jsonify({"success": False, "message": "Could not read the image file"}), 400
                
            # Save original image for debugging
            original_path = save_debug_image(image, 'original.jpg')
            logger.info(f"Original image saved to {original_path}")
            
            # Convert to RGB (dlib uses RGB)
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
        except Exception as e:
            logger.error(f"Error reading image: {str(e)}", exc_info=True)
            return jsonify({"success": False, "message": f"Error reading image: {str(e)}"}), 400

        # Try multiple face detection methods
        face_locations = []
        detection_methods = [
            {"name": "hog", "upsample": 1},
            {"name": "hog", "upsample": 2},
            {"name": "cnn", "upsample": 1}
        ]
        
        for method in detection_methods:
            try:
                face_locations = face_recognition.face_locations(
                    rgb_image,
                    number_of_times_to_upsample=method["upsample"],
                    model=method["name"]
                )
                if face_locations:
                    logger.info(f"Face detected using {method['name']} model with upsample={method['upsample']}")
                    break
            except Exception as e:
                logger.warning(f"Error with {method['name']} detection: {str(e)}")
        
        # If no faces found with default methods, try OpenCV
        if not face_locations:
            try:
                # Convert to grayscale for OpenCV
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                
                # Try different cascade classifiers
                cascade_paths = [
                    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml',
                    cv2.data.haarcascades + 'haarcascade_frontalface_alt2.xml',
                    cv2.data.haarcascades + 'haarcascade_profileface.xml'
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
                            # Convert to face_recognition format (top, right, bottom, left)
                            face_locations = [(y, x + w, y + h, x) for (x, y, w, h) in faces]
                            break
                    except Exception as e:
                        logger.warning(f"Error with cascade {cascade_path}: {str(e)}")
                
                # If still no faces, try with different parameters
                if not face_locations and len(faces) > 0:
                    faces = face_cascade.detectMultiScale(
                        gray,
                        scaleFactor=1.05,
                        minNeighbors=3,
                        minSize=(20, 20)
                    )
                    if len(faces) > 0:
                        face_locations = [(y, x + w, y + h, x) for (x, y, w, h) in faces]
                        
            except Exception as e:
                logger.error(f"Error in OpenCV face detection: {str(e)}", exc_info=True)
        
        if not face_locations:
            # Save the processed image for debugging
            processed_path = save_debug_image(rgb_image, 'processed_rgb.jpg')
            logger.warning(f"No faces detected in the image. Debug images saved to {debug_dir}")
            
            # Try one last time with a different approach
            try:
                # Try with histogram equalization
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
                gray = cv2.equalizeHist(gray)
                face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
                faces = face_cascade.detectMultiScale(gray, 1.1, 4)
                if len(faces) > 0:
                    face_locations = [(y, x + w, y + h, x) for (x, y, w, h) in faces]
            except Exception as e:
                logger.error(f"Error in final face detection attempt: {str(e)}")
            
            if not face_locations:
                return jsonify({
                    "success": False,
                    "message": "No faces detected in the image. Please ensure:\n" +
                              "1. The face is clearly visible and well-lit\n" +
                              "2. The image is not too dark or blurry\n" +
                              "3. The face is not at an extreme angle\n" +
                              f"Debug images saved to: {debug_dir}"
                }), 400

        # Get face encodings
        try:
            encodings = face_recognition.face_encodings(rgb_image, face_locations)
            
            if not encodings:
                logger.error("Face detected but could not generate encodings")
                return jsonify({
                    "success": False,
                    "message": "Face detected but could not generate encodings. Please try with a clearer image."
                }), 400
                
            # Draw rectangles on the image for debugging
            debug_image = rgb_image.copy()
            for (top, right, bottom, left) in face_locations:
                cv2.rectangle(debug_image, (left, top), (right, bottom), (0, 255, 0), 2)
            
            # Save the debug image with face rectangles
            detected_path = save_debug_image(debug_image, 'detected_faces.jpg')
            logger.info(f"Detected faces saved to {detected_path}")

            # ✅ FIXED: Return ALL face encodings, not just the first one
            all_encodings = [encoding.tolist() for encoding in encodings]
            
            logger.info(f"Returning {len(all_encodings)} face encodings")
            
            return jsonify({
                "success": True,
                "encoding": all_encodings,  # ✅ Now returns array of all encodings
                "message": f"Successfully detected {len(encodings)} face(s)",
                "faces_detected": len(encodings)
            })
            
        except Exception as e:
            logger.error(f"Error generating face encodings: {str(e)}", exc_info=True)
            return jsonify({
                "success": False,
                "message": f"Error generating face encodings: {str(e)}"
            }), 500

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "message": f"An unexpected error occurred: {str(e)}"
        }), 500

if __name__ == "__main__":
    # Create debug directory if it doesn't exist
    os.makedirs(debug_dir, exist_ok=True)
    app.run(host='0.0.0.0', port=5001, debug=True)