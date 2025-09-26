#!/usr/bin/env python3
"""
Flask Web Application for Lay's Chips Detection
"""

import os
import io
import base64
from flask import Flask, render_template, request, jsonify, redirect, url_for
from werkzeug.utils import secure_filename
from PIL import Image
import torch
from transformers import OwlViTProcessor, OwlViTForObjectDetection
import numpy as np

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Create upload directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}

# Global model variables
processor = None
model = None
device = None

def calculate_iou(box1, box2):
    """Calculate Intersection over Union (IoU) of two bounding boxes."""
    x1_min, y1_min, x1_max, y1_max = box1
    x2_min, y2_min, x2_max, y2_max = box2
    
    # Calculate intersection area
    intersection_x_min = max(x1_min, x2_min)
    intersection_y_min = max(y1_min, y2_min)
    intersection_x_max = min(x1_max, x2_max)
    intersection_y_max = min(y1_max, y2_max)
    
    if intersection_x_max <= intersection_x_min or intersection_y_max <= intersection_y_min:
        return 0.0
    
    intersection_area = (intersection_x_max - intersection_x_min) * (intersection_y_max - intersection_y_min)
    
    # Calculate union area
    box1_area = (x1_max - x1_min) * (y1_max - y1_min)
    box2_area = (x2_max - x2_min) * (y2_max - y2_min)
    union_area = box1_area + box2_area - intersection_area
    
    return intersection_area / union_area if union_area > 0 else 0.0

def is_box_contained(box1, box2):
    """Check if box1 is contained within box2."""
    x1_min, y1_min, x1_max, y1_max = box1
    x2_min, y2_min, x2_max, y2_max = box2
    
    # Check if box1 is completely inside box2
    return (x1_min >= x2_min and y1_min >= y2_min and 
            x1_max <= x2_max and y1_max <= y2_max)

def non_maximum_suppression(detections, iou_threshold=0.3, containment_threshold=0.8):
    """Apply Non-Maximum Suppression to remove duplicate detections."""
    if len(detections) == 0:
        return []
    
    # Sort detections by confidence score (highest first)
    sorted_detections = sorted(detections, key=lambda x: x['score'], reverse=True)
    
    # Keep track of which detections to keep
    keep = []
    
    while sorted_detections:
        # Take the detection with highest confidence
        current = sorted_detections.pop(0)
        keep.append(current)
        
        # Remove all detections that have high IoU with current detection OR are contained within it
        remaining = []
        for detection in sorted_detections:
            iou = calculate_iou(current['box'], detection['box'])
            
            # Check if the detection is contained within the current box
            is_contained = is_box_contained(detection['box'], current['box'])
            
            # Keep the detection only if it has low IoU AND is not contained
            if iou < iou_threshold and not is_contained:
                remaining.append(detection)
        
        sorted_detections = remaining
    
    return keep

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_model():
    """Load the OWL-ViT model."""
    global processor, model, device
    
    if processor is None or model is None:
        print("Loading OWL-ViT model...")
        processor = OwlViTProcessor.from_pretrained("google/owlvit-base-patch32")
        model = OwlViTForObjectDetection.from_pretrained("google/owlvit-base-patch32")
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)
        print(f"Model loaded on device: {device}")

def detect_lays_in_image(image, confidence_threshold=0.1):
    """Detect Lay's chips in the given image."""
    global processor, model, device
    
    # Load model if not already loaded
    load_model()
    
    # Lay's detection prompts - more specific to avoid duplicate detections
    lays_prompts = [
        "Lay's potato chips bag",
        "Lay's Classic chips bag",
        "Lay's snack bag with red logo"
    ]
    
    # Prepare inputs
    inputs = processor(
        text=lays_prompts, 
        images=image, 
        return_tensors="pt"
    )
    
    # Move inputs to device
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    # Run inference
    with torch.no_grad():
        outputs = model(**inputs)
    
    # Process outputs
    target_sizes = torch.Tensor([image.size[::-1]]).to(device)
    results = processor.post_process_object_detection(
        outputs=outputs, 
        target_sizes=target_sizes, 
        threshold=confidence_threshold
    )
    
    detections = []
    boxes, scores, labels = results[0]["boxes"], results[0]["scores"], results[0]["labels"]
    
    for box, score, label in zip(boxes, scores, labels):
        detection = {
            "box": box.cpu().numpy().tolist(),
            "score": float(score.cpu()),
            "label": lays_prompts[label.cpu().item()],
            "label_id": int(label.cpu().item())
        }
        detections.append(detection)
    
    # Apply Non-Maximum Suppression to remove duplicate detections
    filtered_detections = non_maximum_suppression(detections, iou_threshold=0.3)
    
    return filtered_detections

def create_annotated_image(image, detections):
    """Create an annotated version of the image with bounding boxes."""
    from PIL import ImageDraw, ImageFont
    
    # Create a copy of the image for annotation
    annotated_image = image.copy()
    draw = ImageDraw.Draw(annotated_image)
    
    # Try to load a font, fall back to default if not available
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
    
    # Draw bounding boxes and labels
    for detection in detections:
        box = detection["box"]
        score = detection["score"]
        label = detection["label"]
        
        # Convert box coordinates (x1, y1, x2, y2)
        x1, y1, x2, y2 = box
        
        # Draw rectangle
        draw.rectangle([x1, y1, x2, y2], outline="red", width=3)
        
        # Draw label with confidence score
        label_text = f"{label}: {score:.2f}"
        draw.text((x1, y1 - 25), label_text, fill="red", font=font)
    
    return annotated_image

def image_to_base64(image):
    """Convert PIL Image to base64 string."""
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

@app.route('/')
def index():
    """Main page."""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload and detection."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Please upload an image file.'}), 400
        
        # Get confidence threshold from form
        confidence = float(request.form.get('confidence', 0.1))
        
        # Read and process image
        image = Image.open(file.stream)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Detect Lay's
        detections = detect_lays_in_image(image, confidence_threshold=confidence)
        
        # Prepare response data
        result = {
            'detected': len(detections) > 0,
            'count': len(detections),
            'detections': detections,
            'original_image': image_to_base64(image)
        }
        
        # Add annotated image if detections found
        if detections:
            annotated_image = create_annotated_image(image, detections)
            result['annotated_image'] = image_to_base64(annotated_image)
            
            # Calculate average confidence
            avg_confidence = sum(d['score'] for d in detections) / len(detections)
            result['avg_confidence'] = round(avg_confidence, 2)
            
            # Get unique labels
            unique_labels = list(set(d['label'] for d in detections))
            result['unique_labels'] = unique_labels
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'model_loaded': model is not None})

if __name__ == '__main__':
    print("Starting Lay's Detection Web App...")
    print("Loading model on startup...")
    load_model()
    print("Model loaded successfully!")
    print("Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5000)
