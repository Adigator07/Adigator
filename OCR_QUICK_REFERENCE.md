# OCR & AI Pipeline - Developer Quick Reference

Fast lookup guide for the OCR and AI processing system.

## 📂 File Structure

```
/app
├── /api/process
│   └── route.ts              # Main pipeline - orchestrates OCR + AI
├── /lib
│   ├── ocr.ts               # Google Vision API integration
│   ├── ai.ts                # OpenAI API integration
│   ├── vision.ts            # Image preprocessing & validation
│   └── types.ts             # TypeScript type definitions
├── /components
│   └── OCRAnalyzerUpload.jsx # Frontend upload & results UI
└── /analyzer
    └── page.tsx             # Full analyzer tool page

Root Files:
├── .env.example             # Environment variable template
├── .env.local               # Actual credentials (gitignored)
├── google-key.json          # GCP service account key (gitignored)
├── OCR_SETUP_GUIDE.md       # Complete setup instructions
├── OCR_AND_AI_PIPELINE_README.md  # System overview
├── DEPENDENCIES.md          # Required packages
└── test-pipeline.ts         # Test suite
```

## 🔑 Key Functions

### Image Processing (`lib/vision.ts`)

```typescript
validateImage(file)              // Check format & size
preprocessImage(file, quality)   // Convert to base64
estimateOCRQuality(w, h)        // Predict OCR accuracy
```

### OCR (`lib/ocr.ts`)

```typescript
extractTextFromImage(base64)     // Google Vision API call
validateOCRQuality(result)       // Check confidence threshold
cleanOCRText(text)               // Normalize text
```

### AI Analysis (`lib/ai.ts`)

```typescript
analyzeTextWithAI(text, context)     // Full AI analysis
generateSummary(text)                // Create summary
extractEntities(text, types)         // Extract named entities
```

### API Route (`api/process/route.ts`)

```typescript
POST /api/process                // Main processing pipeline
GET /api/process                 // Health check endpoint
```

### Component (`components/OCRAnalyzerUpload.jsx`)

```typescript
<OCRAnalyzerUpload />            // Full upload & results UI
```

## 🚀 Common Tasks

### Add a new processing stage

1. Create function in `lib/*.ts`
2. Update `ProcessingResponse` type in `lib/types.ts`
3. Call from `api/process/route.ts`
4. Update `OCRAnalyzerUpload.jsx` to display results

### Change OCR confidence threshold

**File**: `lib/ocr.ts`
```typescript
// Line ~90, in validateOCRQuality()
return result.confidence >= 0.3  // ← Change this value
```

### Modify AI analysis prompt

**File**: `lib/ai.ts`
```typescript
// Line ~40, in analyzeTextWithAI()
const systemPrompt = `...`      // ← Edit this prompt
```

### Update image size limits

**File**: `lib/vision.ts`
```typescript
// Line ~35
const MAX_SIZE = 20 * 1024 * 1024  // ← Change max size
```

### Add new image format support

**File**: `lib/vision.ts`
```typescript
// Update detectImageFormat() function
// Add new format check with magic bytes
```

### Change OpenAI model

**File**: `lib/ai.ts`
```typescript
// Line ~60
model: "gpt-4-turbo-preview",    // ← Change to different model
```

## 📊 Data Flow

```
Frontend Upload
    ↓
POST /api/process
    ↓
validateImage()     → Check format/size
    ↓
preprocessImage()   → Base64 conversion
    ↓
extractTextFromImage()  → Google Vision API
    ↓
cleanOCRText()      → Text normalization
    ↓
analyzeTextWithAI() → OpenAI API
    ↓
Compile metrics
    ↓
Return JSON response
    ↓
Frontend displays results
```

## 🔌 API Contracts

### Request

```typescript
interface ProcessImageRequest {
  method: "POST"
  url: "/api/process"
  body: FormData {
    image: File           // Required
    context?: string      // Optional
  }
}
```

### Success Response (200)

```typescript
interface SuccessResponse {
  success: true
  data: {
    image: ImageMetadata
    ocr: OCRMetadata
    analysis: AIAnalysisResult
    metrics: ProcessingMetrics
  }
}
```

### Error Response (400/422/500)

```typescript
interface ErrorResponse {
  success: false
  error: {
    message: string
    stage: "validation" | "preprocessing" | "ocr" | "analysis"
    details?: string  // Only in development
  }
}
```

## 🔑 Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GOOGLE_APPLICATION_CREDENTIALS` | ✅ | Path to GCP key |
| `OPENAI_API_KEY` | ✅ | OpenAI API key |
| `NODE_ENV` | ❌ | Environment (dev/prod) |
| `DEBUG_OCR_PIPELINE` | ❌ | Enable logging |

## 🧪 Testing

```bash
# Verify setup
node test-pipeline.ts

# Test API health
curl http://localhost:3000/api/process

# Test with image
curl -X POST http://localhost:3000/api/process \
  -F "image=@test.jpg" \
  -F "context=Invoice"
```

## 🐛 Debugging

### Check logs
```bash
npm run dev  # Watch for [PROCESS] logs
```

### Enable verbose logging
```bash
# In .env.local
DEBUG_OCR_PIPELINE=true
```

### Test individual functions
```typescript
import { cleanOCRText } from "@/app/lib/ocr";
const result = cleanOCRText("messy   text");
console.log(result);
```

## 📦 Dependencies

```json
{
  "openai": "^4.0.0",
  "googleapis": "^130.0.0"
}
```

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Google Cloud credentials set up
- [ ] OpenAI API key active
- [ ] Dependencies installed
- [ ] Tests passing
- [ ] .env.local not committed
- [ ] google-key.json not committed
- [ ] Build succeeds: `npm run build`

## 📝 TypeScript Types

```typescript
// In lib/types.ts
type SupportedImageFormat = "jpeg" | "png" | "gif" | "webp" | "tiff"
type Sentiment = "positive" | "negative" | "neutral"
type ErrorStage = "validation" | "preprocessing" | "ocr" | "analysis"

// Key interfaces
interface ProcessingResponse
interface OCRResult
interface AIAnalysisResult
interface ProcessingMetrics
```

## 🔗 Useful Links

- [Google Cloud Vision Docs](https://cloud.google.com/vision/docs)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 💡 Tips

- **Optimize images** before upload for faster processing
- **Monitor quotas** in Google Cloud & OpenAI dashboards
- **Cache results** for identical images (future enhancement)
- **Batch process** by calling API multiple times (future enhancement)
- **Use context** parameter to improve AI analysis accuracy

## 🚨 Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "No module 'openai'" | Dependency not installed | `npm install openai` |
| "No API key" | Missing .env.local | Copy .env.example and configure |
| "Invalid service account" | GCP key not found/invalid | Regenerate and re-download key |
| "No text extracted" | Image too blurry/small | Use clearer images |
| "Rate limit exceeded" | API quota hit | Wait or upgrade API plan |

---

**Last Updated**: May 2026
**Quick Ref Version**: 1.0
