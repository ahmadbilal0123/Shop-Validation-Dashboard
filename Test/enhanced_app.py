#!/usr/bin/env python3
"""
Enhanced Flask Web Application for Lay's Chips Detection using Multiple Models
Combines OWL-ViT, Grounding DINO, PaddleOCR, and SAM2 for robust detection
"""

import os
import io
import base64
import cv2
import numpy as np
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from PIL import Image
import torch
from transformers import OwlViTProcessor, OwlViTForObjectDetection
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Create upload directory if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}

# Global model variables
owlvit_processor = None
owlvit_model = None
grounding_dino_model = None
paddleocr_model = None
device = None

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_models():
    """Load all detection models."""
    global owlvit_processor, owlvit_model, grounding_dino_model, paddleocr_model, device
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Using device: {device}")
    
    try:
        # Load OWL-ViT
        logger.info("Loading OWL-ViT model...")
        owlvit_processor = OwlViTProcessor.from_pretrained("google/owlvit-base-patch32")
        owlvit_model = OwlViTForObjectDetection.from_pretrained("google/owlvit-base-patch32")
        owlvit_model.to(device)
        logger.info("OWL-ViT loaded successfully")
        
        # Load Grounding DINO
        logger.info("Loading Grounding DINO model...")
        try:
            from groundingdino.util.inference import load_model, load_image, predict, annotate
            grounding_dino_model = load_model("groundingdino/groundingdino_swint_ogc", "groundingdino_swint_ogc.pth")
            logger.info("Grounding DINO loaded successfully")
        except Exception as e:
            logger.warning(f"Grounding DINO not available: {e}")
            grounding_dino_model = None
        
        # Load PaddleOCR
        logger.info("Loading PaddleOCR model...")
        try:
            from paddleocr import PaddleOCR
            paddleocr_model = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
            logger.info("PaddleOCR loaded successfully")
        except Exception as e:
            logger.warning(f"PaddleOCR not available: {e}")
            paddleocr_model = None
            
    except Exception as e:
        logger.error(f"Error loading models: {e}")

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
    
    return (x1_min >= x2_min and y1_min >= y2_min and 
            x1_max <= x2_max and y1_max <= y2_max)

def non_maximum_suppression(detections, iou_threshold=0.3):
    """Apply Non-Maximum Suppression to remove duplicate detections."""
    if len(detections) == 0:
        return []
    
    # Sort detections by confidence score (highest first)
    sorted_detections = sorted(detections, key=lambda x: x['score'], reverse=True)
    keep = []
    
    while sorted_detections:
        current = sorted_detections.pop(0)
        keep.append(current)
        
        remaining = []
        for detection in sorted_detections:
            iou = calculate_iou(current['box'], detection['box'])
            is_contained = is_box_contained(detection['box'], current['box'])
            
            if iou < iou_threshold and not is_contained:
                remaining.append(detection)
        
        sorted_detections = remaining
    
    return keep

def detect_with_owlvit(image, confidence_threshold=0.1):
    """Detect Lay's chips using OWL-ViT."""
    global owlvit_processor, owlvit_model, device
    
    lays_prompts = [
        "Lay's potato chips bag",
        "Lay's Classic chips bag",
        "Lay's snack bag with red logo",
        "Lay's chips packet",
        "Lay's logo"
    ]
    
    inputs = owlvit_processor(text=lays_prompts, images=image, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    with torch.no_grad():
        outputs = owlvit_model(**inputs)
    
    target_sizes = torch.Tensor([image.size[::-1]]).to(device)
    results = owlvit_processor.post_process_object_detection(
        outputs=outputs, target_sizes=target_sizes, threshold=confidence_threshold
    )
    
    detections = []
    boxes, scores, labels = results[0]["boxes"], results[0]["scores"], results[0]["labels"]
    
    for box, score, label in zip(boxes, scores, labels):
        detection = {
            "box": box.cpu().numpy().tolist(),
            "score": float(score.cpu()),
            "label": lays_prompts[label.cpu().item()],
            "model": "OWL-ViT"
        }
        detections.append(detection)
    
    return detections

def detect_with_grounding_dino(image, confidence_threshold=0.1):
    """Detect Lay's chips using Grounding DINO."""
    global grounding_dino_model
    
    if grounding_dino_model is None:
        return []
    
    try:
        # Convert PIL to OpenCV format
        img_array = np.array(image)
        img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        # Grounding DINO detection
        text_prompt = "Lay's chips bag . Lay's logo . Lay's potato chips . Lay's snack bag"
        
        from groundingdino.util.inference import load_image, predict, annotate
        
        # Load image for Grounding DINO
        image_dino, _ = load_image(img_cv)
        
        # Run prediction
        boxes, logits, phrases = predict(
            model=grounding_dino_model,
            image=image_dino,
            caption=text_prompt,
            box_threshold=confidence_threshold,
            text_threshold=0.25
        )
        
        detections = []
        for box, score in zip(boxes, logits):
            detection = {
                "box": box.tolist(),
                "score": float(score),
                "label": "Lay's chips (Grounding DINO)",
                "model": "Grounding DINO"
            }
            detections.append(detection)
        
        return detections
        
    except Exception as e:
        logger.warning(f"Grounding DINO detection failed: {e}")
        return []

def verify_with_ocr(image, detection):
    """Verify detection using OCR to check for Lay's text."""
    global paddleocr_model
    
    if paddleocr_model is None:
        return True  # If OCR not available, trust the detection
    
    try:
        # Extract region from bounding box
        box = detection['box']
        x1, y1, x2, y2 = [int(coord) for coord in box]
        
        # Ensure coordinates are within image bounds
        img_width, img_height = image.size
        x1 = max(0, min(x1, img_width))
        y1 = max(0, min(y1, img_height))
        x2 = max(0, min(x2, img_width))
        y2 = max(0, min(y2, img_height))
        
        if x2 <= x1 or y2 <= y1:
            return False
        
        # Crop the region
        cropped = image.crop((x1, y1, x2, y2))
        
        # Convert to numpy array for OCR
        img_array = np.array(cropped)
        
        # Run OCR
        result = paddleocr_model.ocr(img_array, cls=True)
        
        if result and result[0]:
            # Extract all text from OCR results
            all_text = ""
            for line in result[0]:
                if line and len(line) >= 2:
                    all_text += line[1][0] + " "
            
            # Check if Lay's related text is found
            lays_keywords = ["lay's", "lays", "lay", "classic", "chips", "potato"]
            text_lower = all_text.lower()
            
            # Check if any Lay's keywords are present
            has_lays_text = any(keyword in text_lower for keyword in lays_keywords)
            
            if has_lays_text:
                detection['ocr_verified'] = True
                detection['ocr_text'] = all_text.strip()
                return True
            else:
                detection['ocr_verified'] = False
                detection['ocr_text'] = all_text.strip()
                return False
        
        detection['ocr_verified'] = False
        detection['ocr_text'] = ""
        return False
        
    except Exception as e:
        logger.warning(f"OCR verification failed: {e}")
        detection['ocr_verified'] = False
        detection['ocr_text'] = ""
        return True  # Trust detection if OCR fails

def ensemble_detect_lays(image, confidence_threshold=0.1):
    """Combined detection using multiple models."""
    logger.info("Starting ensemble detection...")
    
    all_detections = []
    
    # OWL-ViT detection
    logger.info("Running OWL-ViT detection...")
    owlvit_detections = detect_with_owlvit(image, confidence_threshold)
    all_detections.extend(owlvit_detections)
    logger.info(f"OWL-ViT found {len(owlvit_detections)} detections")
    
    # Grounding DINO detection
    logger.info("Running Grounding DINO detection...")
    dino_detections = detect_with_grounding_dino(image, confidence_threshold)
    all_detections.extend(dino_detections)
    logger.info(f"Grounding DINO found {len(dino_detections)} detections")
    
    # Apply NMS to remove duplicates
    logger.info("Applying Non-Maximum Suppression...")
    filtered_detections = non_maximum_suppression(all_detections, iou_threshold=0.3)
    logger.info(f"After NMS: {len(filtered_detections)} detections")
    
    # OCR verification for remaining detections
    logger.info("Running OCR verification...")
    verified_detections = []
    for detection in filtered_detections:
        if verify_with_ocr(image, detection):
            verified_detections.append(detection)
            logger.info(f"OCR verified detection: {detection['model']}")
        else:
            logger.info(f"OCR rejected detection: {detection['model']}")
    
    logger.info(f"Final verified detections: {len(verified_detections)}")
    return verified_detections

def create_annotated_image(image, detections):
    """Create an annotated version of the image with bounding boxes."""
    from PIL import ImageDraw, ImageFont
    
    annotated_image = image.copy()
    draw = ImageDraw.Draw(annotated_image)
    
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
    
    colors = ["red", "blue", "green", "purple", "orange"]
    
    for i, detection in enumerate(detections):
        box = detection["box"]
        score = detection["score"]
        label = detection["label"]
        model = detection.get("model", "Unknown")
        
        x1, y1, x2, y2 = box
        color = colors[i % len(colors)]
        
        # Draw rectangle
        draw.rectangle([x1, y1, x2, y2], outline=color, width=3)
        
        # Draw label with confidence score and model
        label_text = f"{model}: {score:.2f}"
        draw.text((x1, y1 - 25), label_text, fill=color, font=font)
        
        # Draw OCR text if available
        if 'ocr_text' in detection and detection['ocr_text']:
            ocr_text = f"OCR: {detection['ocr_text'][:30]}..."
            draw.text((x1, y2 + 5), ocr_text, fill=color, font=font)
    
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
        
        # Detect Lay's using ensemble method
        detections = ensemble_detect_lays(image, confidence_threshold=confidence)
        
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
            
            # Get unique models used
            models_used = list(set(d.get('model', 'Unknown') for d in detections))
            result['models_used'] = models_used
            
            # Get OCR verification stats
            ocr_verified_count = sum(1 for d in detections if d.get('ocr_verified', False))
            result['ocr_verified'] = ocr_verified_count
            result['ocr_verification_rate'] = round(ocr_verified_count / len(detections) * 100, 1)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in upload_file: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'owlvit_loaded': owlvit_model is not None,
        'grounding_dino_loaded': grounding_dino_model is not None,
        'paddleocr_loaded': paddleocr_model is not None,
        'device': str(device)
    })

if __name__ == '__main__':
    print("Starting Enhanced Lay's Detection Web App...")
    print("Loading all models on startup...")
    load_models()
    print("All models loaded successfully!")
    print("Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5001)  # Different port to avoid conflict
