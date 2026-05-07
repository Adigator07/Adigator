# OCR & AI Processing Pipeline - Setup Guide

Complete guide to setting up the OCR and AI text extraction system for Adigator.

---

## Overview

This system provides an end-to-end pipeline for:
1. **Image Upload** → Drag & drop interface
2. **Preprocessing** → Validation & optimization
3. **OCR** → Google Cloud Vision API
4. **AI Analysis** → OpenAI structured insights

---

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes, TypeScript
- **OCR**: Google Cloud Vision API
- **AI**: OpenAI API (GPT-4 Turbo)
- **Image Processing**: Buffer-based validation & dimensions

---

## Prerequisites

- Node.js 18+
- npm or yarn
- Google Cloud Platform account
- OpenAI account

---

## Installation

### 1. Install Dependencies

```bash
npm install openai googleapis
```

### 2. Set Up Google Cloud Vision API

**Step A: Create a GCP Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable the Cloud Vision API:
   - Search "Vision API" in the search bar
   - Click "Enable"

**Step B: Create Service Account**
1. Navigate to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Enter name: `adigator-ocr-service`
4. Grant role: "Cloud Vision API User"
5. Click "Create and Continue"

**Step C: Create & Download Key**
1. In Service Accounts list, click the account you created
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Download and save to your project root as `google-key.json`

**Step D: Configure Environment**
```bash
# Add to .env.local
GOOGLE_APPLICATION_CREDENTIALS="./google-key.json"
```

⚠️ **Security**: Add `google-key.json` to `.gitignore`

### 3. Set Up OpenAI API

**Step A: Create Account**
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in

**Step B: Generate API Key**
1. Navigate to "API keys" section
2. Click "Create new secret key"
3. Copy the key

**Step C: Configure Environment**
```bash
# Add to .env.local
OPENAI_API_KEY="sk-..."
```

⚠️ **Security**: Never commit API keys. Keep them in `.env.local` only.

### 4. Create Environment File

```bash
# Copy example to local
cp .env.example .env.local

# Edit .env.local with your keys
nano .env.local
```

---

## Project Structure

```
/app
├── /api
│   └── /process
│       └── route.ts          # Main OCR + AI pipeline API
├── /lib
│   ├── ocr.ts               # Google Vision API integration
│   ├── ai.ts                # OpenAI integration
│   └── vision.ts            # Image preprocessing & validation
├── /components
│   └── OCRAnalyzerUpload.jsx # Frontend upload component
└── /analyzer
    └── page.tsx             # Analyzer tool page
```

---

## API Endpoint

### POST `/api/process`

**Request (multipart/form-data)**
```javascript
const formData = new FormData();
formData.append("image", fileObject);
formData.append("context", "Invoice"); // optional

const response = await fetch("/api/process", {
  method: "POST",
  body: formData,
});
```

**Response (200 Success)**
```json
{
  "success": true,
  "data": {
    "image": {
      "width": 1200,
      "height": 800,
      "format": "jpeg",
      "size": 245600
    },
    "ocr": {
      "text": "Full extracted text...",
      "confidence": 0.92,
      "blocksCount": 15,
      "cleanedText": "Cleaned and normalized text..."
    },
    "analysis": {
      "summary": "2-3 sentence summary",
      "classification": "invoice",
      "keyPoints": ["point 1", "point 2"],
      "entities": [
        {"name": "John Doe", "type": "PERSON", "value": "..."}
      ],
      "sentiment": "neutral",
      "confidence": 0.88,
      "structuredData": {}
    },
    "metrics": {
      "processingTime": 2450,
      "ocrConfidence": 0.92,
      "aiConfidence": 0.88,
      "overallQuality": 0.90
    }
  }
}
```

**Response (400 Bad Request)**
```json
{
  "success": false,
  "error": {
    "message": "No text detected in image",
    "stage": "ocr",
    "details": "Optional details in development mode"
  }
}
```

---

## Usage Example

### Frontend Component

```tsx
import OCRAnalyzerUpload from "@/app/components/OCRAnalyzerUpload";

export default function Page() {
  return <OCRAnalyzerUpload />;
}
```

### Programmatic Usage

```typescript
// Upload and analyze image
const file = new File([...], "document.jpg", { type: "image/jpeg" });
const formData = new FormData();
formData.append("image", file);
formData.append("context", "Invoice");

const response = await fetch("/api/process", {
  method: "POST",
  body: formData,
});

const result = await response.json();

if (result.success) {
  console.log("Extracted Text:", result.data.ocr.cleanedText);
  console.log("Classification:", result.data.analysis.classification);
  console.log("Summary:", result.data.analysis.summary);
}
```

---

## Supported Image Formats

- ✅ JPEG / JPG
- ✅ PNG
- ✅ WebP
- ✅ GIF
- ✅ TIFF

**Constraints:**
- Max file size: 20MB
- Min dimension: 200px
- Max dimension: 3000px (optimal)
- Aspect ratio: 0.3 - 3.0

---

## Error Handling

### Common Issues

**"GOOGLE_APPLICATION_CREDENTIALS not set"**
- Ensure google-key.json path is correct in .env.local
- Check file permissions

**"OPENAI_API_KEY not set"**
- Verify API key is in .env.local
- Check for typos

**"No text detected in image"**
- Image quality too low
- Text may be too small or blurry
- Try a clearer image

**"Quota exceeded"**
- Check API usage in Google Cloud & OpenAI dashboards
- May need to upgrade plan

---

## Performance Tuning

### OCR Quality

```typescript
// In /lib/vision.ts - estimateOCRQuality
// Adjust thresholds for your use case
- Min dimension: 400px (increase for better quality)
- Max dimension: 3000px (decrease for faster processing)
```

### AI Analysis Speed

```typescript
// In /lib/ai.ts - analyzeTextWithAI
// Reduce max_tokens for faster responses
temperature: 0.3,     // Lower = more deterministic
max_tokens: 1500,     // Reduce for speed
```

---

## Security Considerations

1. **API Keys**
   - Never commit `.env.local`
   - Use `.env.local` for local development
   - Deploy with environment variables

2. **File Upload**
   - Size limit: 20MB
   - MIME type validation
   - Filename sanitization

3. **Rate Limiting**
   - Implement request throttling in production
   - Monitor API quota usage

---

## Monitoring & Debugging

### Enable Debug Logging

```bash
# In .env.local
DEBUG_OCR_PIPELINE="true"
```

### Check Logs

```bash
# API logs will show:
# [PROCESS] Starting image validation...
# [PROCESS] Preprocessing image...
# [PROCESS] Extracting text with OCR...
# [PROCESS] Analyzing text with AI...
# [PROCESS] Pipeline completed in XXXms
```

### API Health Check

```bash
GET /api/process
```

Returns:
```json
{
  "status": "healthy",
  "service": "OCR and AI Processing Pipeline",
  "version": "1.0.0"
}
```

---

## Deployment

### Environment Variables (Production)

Set these in your deployment platform (Vercel, Netlify, etc.):

```
GOOGLE_APPLICATION_CREDENTIALS = "path/to/key.json" or contents
OPENAI_API_KEY = "sk-..."
NODE_ENV = "production"
```

### Vercel Deployment

1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables in project settings
4. Deploy

---

## Troubleshooting

### Test the Pipeline

```bash
# Test with curl
curl -X POST http://localhost:3000/api/process \
  -F "image=@test.jpg" \
  -F "context=Invoice"
```

### Common Fixes

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `npm install` |
| API timeout | Reduce image size |
| Low OCR confidence | Use clearer images |
| Rate limit error | Wait or upgrade API plan |

---

## Next Steps

- [ ] Set up Google Cloud credentials
- [ ] Set up OpenAI API key
- [ ] Test upload component
- [ ] Deploy to production
- [ ] Monitor API usage
- [ ] Scale as needed

---

## Support

For issues:
1. Check error messages and logs
2. Review API documentation
3. Check GitHub issues
4. Contact support

---

**Last Updated**: May 2026
**Version**: 1.0.0
