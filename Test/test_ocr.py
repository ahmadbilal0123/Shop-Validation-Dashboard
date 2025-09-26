#!/usr/bin/env python3
"""
Test OCR functionality
"""

import numpy as np
from PIL import Image
from paddleocr import PaddleOCR

def test_ocr():
    """Test PaddleOCR with a simple image."""
    print("Testing PaddleOCR...")
    
    try:
        # Initialize PaddleOCR
        ocr = PaddleOCR(use_textline_orientation=True, lang='en')
        print("✅ PaddleOCR initialized successfully")
        
        # Create a simple test image with text
        # Create a white image with black text
        img = np.ones((100, 300, 3), dtype=np.uint8) * 255  # White background
        
        # Add some text using OpenCV (simulating "Lay's" text)
        import cv2
        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.putText(img, "Lay's Classic", (50, 50), font, 1, (0, 0, 0), 2)
        
        # Convert to PIL Image
        pil_img = Image.fromarray(img)
        
        # Run OCR
        result = ocr.ocr(np.array(pil_img), cls=True)
        
        if result and result[0]:
            print("✅ OCR detected text:")
            for line in result[0]:
                if line and len(line) >= 2:
                    text = line[1][0]
                    confidence = line[1][1]
                    print(f"  Text: '{text}' (confidence: {confidence:.2f})")
        else:
            print("❌ No text detected")
            
        return True
        
    except Exception as e:
        print(f"❌ OCR test failed: {e}")
        return False

if __name__ == "__main__":
    test_ocr()
