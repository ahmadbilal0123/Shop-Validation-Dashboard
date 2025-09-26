# Lay's Chips Detection Script

A Python script that detects Lay's chips/snacks in images using Hugging Face's OWL-ViT zero-shot object detection model.

## Features

- ✅ Detects Lay's chips using multiple prompts
- ✅ Works with local image files and URLs
- ✅ Configurable confidence threshold
- ✅ Clear console output with detection statistics
- ✅ Optional annotated image saving with bounding boxes
- ✅ GPU acceleration support (if available)

## Installation

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Basic Usage

```bash
python lays_detector.py path/to/your/image.jpg
```

### With URL

```bash
python lays_detector.py https://example.com/image.jpg
```

### Save Annotated Image

```bash
python lays_detector.py image.jpg --save-annotated output.jpg
```

### Adjust Confidence Threshold

```bash
python lays_detector.py image.jpg --confidence 0.2
```

### Use Different Model

```bash
python lays_detector.py image.jpg --model google/owlvit-large-patch14
```

## Command Line Options

- `image`: Path to image file or URL (required)
- `--confidence, -c`: Confidence threshold for detections (default: 0.1)
- `--save-annotated, -s`: Save annotated image to specified path
- `--model, -m`: Model name to use (default: google/owlvit-base-patch32)

## Example Output

```
Loading OWL-ViT model: google/owlvit-base-patch32
Model loaded on device: cuda
Loading image: test_image.jpg
Image loaded: 1920x1080 pixels
Running detection...
✅ Lay's detected: 3 items
📊 Average confidence: 0.82

📋 Detection details:
  1. Lay's chips bag (confidence: 0.89)
  2. Lays chips packet (confidence: 0.78)
  3. Lay's logo (confidence: 0.79)

🏷️  Unique Lay's items found: 3
   - Lay's chips bag: 1 detection(s)
   - Lays chips packet: 1 detection(s)
   - Lay's logo: 1 detection(s)
```

## Detection Prompts

The script uses the following prompts to detect Lay's products:
- "Lay's chips bag"
- "Lays chips packet"
- "Lay's potato chips"
- "Lay's logo"
- "Lays snack bag"
- "Lay's chip packet"
- "Lays potato chips bag"

## Requirements

- Python 3.7+
- PyTorch
- Transformers
- Pillow
- Requests
- NumPy
- Matplotlib

## Notes

- The script automatically uses GPU if available, otherwise falls back to CPU
- First run will download the model (~1.5GB for base model)
- Confidence threshold of 0.1 is recommended for best results
- The script returns exit code 0 if Lay's is detected, 1 if not detected
