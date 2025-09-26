#!/usr/bin/env python3
"""
Installation script for Enhanced Lay's Detection System
"""

import subprocess
import sys
import os

def run_command(command, description):
    """Run a command and handle errors."""
    print(f"\n{description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e}")
        print(f"Error output: {e.stderr}")
        return False

def main():
    print("🚀 Installing Enhanced Lay's Detection System Dependencies")
    print("=" * 60)
    
    # Basic dependencies
    basic_deps = [
        "flask==2.3.3",
        "torch>=1.9.0",
        "torchvision>=0.10.0", 
        "transformers>=4.21.0",
        "pillow>=9.0.0",
        "numpy>=1.21.0",
        "opencv-python>=4.5.0"
    ]
    
    print("\n📦 Installing basic dependencies...")
    for dep in basic_deps:
        if not run_command(f"pip install {dep}", f"Installing {dep}"):
            print(f"⚠️  Warning: Failed to install {dep}")
    
    # PaddleOCR (simpler alternative to Grounding DINO)
    print("\n🔤 Installing PaddleOCR...")
    if not run_command("pip install paddlepaddle paddleocr", "Installing PaddleOCR"):
        print("⚠️  Warning: PaddleOCR installation failed. OCR verification will be disabled.")
    
    # Try to install Grounding DINO (optional)
    print("\n🎯 Installing Grounding DINO (optional)...")
    grounding_dino_commands = [
        "git clone https://github.com/IDEA-Research/GroundingDINO.git grounding_dino",
        "cd grounding_dino && pip install -e .",
        "pip install supervision"
    ]
    
    for cmd in grounding_dino_commands:
        if not run_command(cmd, f"Running: {cmd}"):
            print("⚠️  Warning: Grounding DINO installation failed. Will use OWL-ViT only.")
            break
    
    print("\n" + "=" * 60)
    print("🎉 Installation completed!")
    print("\nTo run the enhanced system:")
    print("python enhanced_app.py")
    print("\nTo run the original system:")
    print("python app.py")
    print("\nNote: The enhanced system runs on port 5001 to avoid conflicts.")

if __name__ == "__main__":
    main()
