import cv2
import numpy as np
import sys
import json
import os

def detect_sharpness(gray):
    # Laplacian variance for blur detection
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    # Normalize roughly 0-100 (300+ is very sharp)
    score = min(100, max(0, (laplacian_var / 300.0) * 100))
    return float(score)

def detect_compression_artifacts(gray):
    # Analyze 8x8 DCT block boundaries to detect JPEG artifacts
    H, W = gray.shape
    if H < 16 or W < 16:
        return 100.0
        
    block_grad = 0
    rand_grad = 0
    block_count = 0
    rand_count = 0

    gray = gray.astype(np.float32)
    
    # Check gradients at 8x8 block boundaries vs random locations
    for y in range(8, H - 8, 8):
        for x in range(8, W - 8, 8):
            diff = abs(gray[y, x] - gray[y, x-1]) + abs(gray[y, x] - gray[y-1, x])
            block_grad += diff
            block_count += 1
            
            # Random offset point
            rand_diff = abs(gray[y+4, x+4] - gray[y+4, x+3]) + abs(gray[y+4, x+4] - gray[y+3, x+4])
            rand_grad += rand_diff
            rand_count += 1

    avg_block = block_grad / max(1, block_count)
    avg_rand = rand_grad / max(1, rand_count)
    
    ratio = avg_block / max(1, avg_rand)
    
    # Ratio > 1.4 suggests artifacts. Normalize to 0-100
    if ratio <= 1.1:
        score = 100
    elif ratio <= 1.4:
        score = 80
    elif ratio <= 1.8:
        score = 50
    else:
        score = 20
        
    return float(score)

def detect_brightness_contrast(gray):
    mean_brightness = np.mean(gray)
    
    # RMS contrast
    std = np.std(gray)
    rms_contrast = std / 128.0
    
    brightness_score = 100
    if mean_brightness < 80:
        brightness_score -= (80 - mean_brightness) * 0.8
    elif mean_brightness > 180:
        brightness_score -= (mean_brightness - 180) * 0.8
        
    contrast_score = min(100, max(0, rms_contrast * 100 / 0.3))
    
    return max(0, brightness_score), float(contrast_score)

def detect_clipping(gray):
    total_pixels = gray.size
    white_clip = np.sum(gray >= 252) / total_pixels
    black_clip = np.sum(gray <= 3) / total_pixels
    
    return float(white_clip * 100), float(black_clip * 100)

def wcag_contrast_ratio(lum1, lum2):
    l1 = max(lum1, lum2)
    l2 = min(lum1, lum2)
    return (l1 + 0.05) / (l2 + 0.05)

def extract_colors(image, k=3):
    try:
        # Downsample for speed
        small_img = cv2.resize(image, (100, 100))
        # Convert BGR to RGB
        img_rgb = cv2.cvtColor(small_img, cv2.COLOR_BGR2RGB)
        
        # Reshape to list of pixels
        pixels = img_rgb.reshape((-1, 3)).astype(np.float32)
        
        # K-Means
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
        _, labels, centers = cv2.kmeans(pixels, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)
        
        centers = np.uint8(centers)
        
        # Get palette as hex strings
        palette = [f"#{c[0]:02x}{c[1]:02x}{c[2]:02x}" for c in centers]
        
        # Convert centers to HSV to find dominant hue and warmth
        centers_hsv = cv2.cvtColor(centers.reshape(k, 1, 3), cv2.COLOR_RGB2HSV)
        
        # Calculate warmth: % of pixels that are red/orange/yellow
        # HSV Hue ranges: Red (0-15, 165-180), Orange/Yellow (15-45)
        # Roughly Hue < 45 or Hue > 160 is warm
        img_hsv = cv2.cvtColor(small_img, cv2.COLOR_BGR2HSV)
        hues = img_hsv[:, :, 0]
        warm_pixels = np.sum((hues < 45) | (hues > 160))
        warmth = (warm_pixels / hues.size) * 100
        
        # Find dominant hue
        counts = np.bincount(labels.flatten())
        dominant_idx = np.argmax(counts)
        dominant_hue = int(centers_hsv[dominant_idx, 0, 0] * 2) # multiply by 2 for standard 0-360 deg
        
        # Harmony type (simple heuristic)
        h_vals = centers_hsv[:, 0, 0] * 2
        if len(h_vals) > 1:
            max_diff = max([abs(int(h_vals[i]) - int(h_vals[j])) for i in range(len(h_vals)) for j in range(i+1, len(h_vals))])
            if max_diff > 180:
                max_diff = 360 - max_diff
                
            if max_diff < 40:
                harmony = "analogous"
            elif max_diff > 120 and max_diff < 240:
                harmony = "complementary"
            else:
                harmony = "discordant"
        else:
            harmony = "analogous"
            
        return palette, dominant_hue, harmony, float(warmth)
    except Exception as e:
        return [], 0, "analogous", 50.0

def analyze_image(image_path):
    if not os.path.exists(image_path):
        return {"error": "File not found"}
        
    image = cv2.imread(image_path)
    if image is None:
        return {"error": "Invalid image"}
        
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # 1. Sharpness
    sharpness_score = detect_sharpness(gray)
    
    # 2. Compression Artifacts
    artifacts_score = detect_compression_artifacts(gray)
    
    # 3. Brightness & Contrast
    brightness_score, contrast_score = detect_brightness_contrast(gray)
    
    # 4. Clipping
    white_clip, black_clip = detect_clipping(gray)
    
    # 5. Global Contrast (WCAG estimate)
    min_val, max_val, _, _ = cv2.minMaxLoc(gray)
    lum_max = (max_val / 255.0) ** 2.2
    lum_min = (min_val / 255.0) ** 2.2
    wcag_ratio = wcag_contrast_ratio(lum_max, lum_min)
    
    # Issues compilation
    issues = []
    if sharpness_score < 60:
        issues.append("Image is blurry. Use higher resolution or avoid compression.")
    if artifacts_score < 60:
        issues.append("Compression artifacts detected. Re-export at higher quality.")
    if white_clip > 2.0 or black_clip > 2.0:
        issues.append("Image has blown-out highlights or crushed shadows. Adjust exposure.")
    if wcag_ratio < 3.0:
        issues.append("Overall contrast is low. Important elements may blend into the background.")
        
    # Calculate overall visual score
    # sharpness 30%, contrast 25%, artifacts 25%, brightness 20%
    overall_score = (sharpness_score * 0.30) + (contrast_score * 0.25) + (artifacts_score * 0.25) + (brightness_score * 0.20)
    
    # Deduct points for clipping
    if white_clip > 2.0 or black_clip > 2.0:
        overall_score -= 15
        
    overall_score = max(0, min(100, overall_score))

    # Color analysis
    colorPalette, dominantHue, harmonyType, warmth = extract_colors(image)

    result = {
        "success": True,
        "score": round(overall_score, 1),
        "sharpness": round(sharpness_score, 1),
        "brightness": round(brightness_score, 1),
        "contrast": round(contrast_score, 1),
        "artifacts": round(artifacts_score, 1),
        "wcag_ratio": round(wcag_ratio, 2),
        "white_clip_pct": round(white_clip, 2),
        "black_clip_pct": round(black_clip, 2),
        "issues": issues,
        "color": {
            "colorPalette": colorPalette,
            "dominantHue": dominantHue,
            "harmonyType": harmonyType,
            "warmth": warmth,
            "contrastScore": round(contrast_score, 1)
        }
    }
    
    return result

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)
        
    image_path = sys.argv[1]
    result = analyze_image(image_path)
    print(json.dumps(result))
