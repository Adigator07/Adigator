import cv2
import sys
import os
import base64

def preprocess_for_ocr(image_path):
    if not os.path.exists(image_path):
        return {"error": "File not found"}
        
    img = cv2.imread(image_path)
    if img is None:
        return {"error": "Invalid image"}

    # 1. Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 2. Light contrast boost
    gray = cv2.convertScaleAbs(gray, alpha=1.2, beta=10)
    
    # 3. Light blur to reduce noise
    blur = cv2.GaussianBlur(gray, (3,3), 0)
    
    # Use THIS image directly for OCR
    thresh = blur

    # Encode the processed image to Base64
    success, buffer = cv2.imencode('.png', thresh)
    if not success:
        return {"error": "Failed to encode image"}
        
    base64_str = base64.b64encode(buffer).decode('utf-8')
    return {"success": True, "image": f"data:image/png;base64,{base64_str}"}

if __name__ == "__main__":
    import json
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)
        
    image_path = sys.argv[1]
    result = preprocess_for_ocr(image_path)
    print(json.dumps(result))
