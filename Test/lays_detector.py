#!/usr/bin/env python3
"""
Lay's Chips Detection Script using Hugging Face OWL-ViT Model

This script detects Lay's chips/snacks in images using zero-shot object detection.
"""

import argparse
import sys
from pathlib import Path
from typing import List, Tuple, Union
import requests
from PIL import Image, ImageDraw, ImageFont
import torch
from transformers import OwlViTProcessor, OwlViTForObjectDetection
import numpy as np


class LaysDetector:
    """Lay's chips detector using OWL-ViT model."""
    
    def __init__(self, model_name: str = "google/owlvit-base-patch32"):
        """Initialize the detector with the specified model."""
        print(f"Loading OWL-ViT model: {model_name}")
        self.processor = OwlViTProcessor.from_pretrained(model_name)
        self.model = OwlViTForObjectDetection.from_pretrained(model_name)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        print(f"Model loaded on device: {self.device}")
        
        # Lay's detection prompts
        self.lays_prompts = [
            "Lay's chips bag",
            "Lays chips packet", 
            "Lay's potato chips",
            "Lay's logo",
            "Lays snack bag",
            "Lay's chip packet",
            "Lays potato chips bag"
        ]
    
    def load_image(self, image_input: str) -> Image.Image:
        """Load image from file path or URL."""
        try:
            if image_input.startswith(('http://', 'https://')):
                # Load from URL
                response = requests.get(image_input, timeout=10)
                response.raise_for_status()
                image = Image.open(requests.get(image_input, stream=True).raw)
            else:
                # Load from local file
                image_path = Path(image_input)
                if not image_path.exists():
                    raise FileNotFoundError(f"Image file not found: {image_input}")
                image = Image.open(image_path)
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            return image
            
        except Exception as e:
            raise Exception(f"Error loading image: {str(e)}")
    
    def detect_lays(self, image: Image.Image, confidence_threshold: float = 0.1) -> List[dict]:
        """Detect Lay's chips in the image."""
        # Prepare inputs
        inputs = self.processor(
            text=self.lays_prompts, 
            images=image, 
            return_tensors="pt"
        )
        
        # Move inputs to device
        inputs = {k: v.to(self.device) for k, v in inputs.items()}
        
        # Run inference
        with torch.no_grad():
            outputs = self.model(**inputs)
        
        # Process outputs
        target_sizes = torch.Tensor([image.size[::-1]]).to(self.device)
        results = self.processor.post_process_object_detection(
            outputs=outputs, 
            target_sizes=target_sizes, 
            threshold=confidence_threshold
        )
        
        detections = []
        boxes, scores, labels = results[0]["boxes"], results[0]["scores"], results[0]["labels"]
        
        for box, score, label in zip(boxes, scores, labels):
            detection = {
                "box": box.cpu().numpy(),
                "score": float(score.cpu()),
                "label": self.lays_prompts[label.cpu().item()],
                "label_id": int(label.cpu().item())
            }
            detections.append(detection)
        
        return detections
    
    def save_annotated_image(self, image: Image.Image, detections: List[dict], output_path: str):
        """Save image with bounding boxes drawn around detections."""
        # Create a copy of the image for annotation
        annotated_image = image.copy()
        draw = ImageDraw.Draw(annotated_image)
        
        # Try to load a font, fall back to default if not available
        try:
            font = ImageFont.truetype("arial.ttf", 20)
        except:
            font = ImageFont.load_default()
        
        # Draw bounding boxes and labels
        for i, detection in enumerate(detections):
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
        
        # Save annotated image
        annotated_image.save(output_path)
        print(f"Annotated image saved to: {output_path}")
    
    def print_results(self, detections: List[dict]):
        """Print detection results to console."""
        if not detections:
            print("❌ No Lay's chips detected in the image.")
            return
        
        print(f"✅ Lay's detected: {len(detections)} items")
        
        # Calculate average confidence
        avg_confidence = sum(d["score"] for d in detections) / len(detections)
        print(f"📊 Average confidence: {avg_confidence:.2f}")
        
        print("\n📋 Detection details:")
        for i, detection in enumerate(detections, 1):
            print(f"  {i}. {detection['label']} (confidence: {detection['score']:.2f})")
        
        # Summary
        unique_labels = set(d["label"] for d in detections)
        print(f"\n🏷️  Unique Lay's items found: {len(unique_labels)}")
        for label in unique_labels:
            count = sum(1 for d in detections if d["label"] == label)
            print(f"   - {label}: {count} detection(s)")


def main():
    """Main function to run the Lay's detector."""
    parser = argparse.ArgumentParser(description="Detect Lay's chips in images using OWL-ViT")
    parser.add_argument("image", help="Path to image file or URL")
    parser.add_argument("--confidence", "-c", type=float, default=0.1, 
                       help="Confidence threshold for detections (default: 0.1)")
    parser.add_argument("--save-annotated", "-s", type=str, 
                       help="Save annotated image to specified path")
    parser.add_argument("--model", "-m", default="google/owlvit-base-patch32",
                       help="Model name to use (default: google/owlvit-base-patch32)")
    
    args = parser.parse_args()
    
    try:
        # Initialize detector
        detector = LaysDetector(model_name=args.model)
        
        # Load image
        print(f"Loading image: {args.image}")
        image = detector.load_image(args.image)
        print(f"Image loaded: {image.size[0]}x{image.size[1]} pixels")
        
        # Detect Lay's
        print("Running detection...")
        detections = detector.detect_lays(image, confidence_threshold=args.confidence)
        
        # Print results
        detector.print_results(detections)
        
        # Save annotated image if requested
        if args.save_annotated:
            detector.save_annotated_image(image, detections, args.save_annotated)
        
        # Return appropriate exit code
        sys.exit(0 if detections else 1)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
