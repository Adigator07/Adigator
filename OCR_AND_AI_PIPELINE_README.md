# OCR & AI Processing Pipeline - Complete System

A production-ready OCR and AI text extraction system built for Adigator analyzer tool. Extract text from images with Google Cloud Vision API, then analyze with OpenAI for structured insights.

## 🎯 Features

✅ **Drag & Drop Upload** - Intuitive image upload interface  
✅ **OCR Text Extraction** - Google Cloud Vision API integration  
✅ **AI-Powered Analysis** - OpenAI GPT-4 Turbo for insights  
✅ **Image Preprocessing** - Automatic validation & optimization  
✅ **Structured Results** - JSON response with metrics & confidence  
✅ **Type-Safe** - Full TypeScript implementation  
✅ **Production Ready** - Error handling & monitoring  

## 📦 What's Included

### Backend Services (`/app/lib/`)

| File | Purpose |
|------|---------|
| `ocr.ts` | Google Cloud Vision API integration |
| `ai.ts` | OpenAI API integration |
| `vision.ts` | Image preprocessing & validation |
| `types.ts` | TypeScript type definitions |

### API Endpoints (`/app/api/`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/process` | POST | Main OCR + AI pipeline |
| `/api/process` | GET | Health check |

### Frontend (`/app/components/`)

| Component | Purpose |
|-----------|---------|
| `OCRAnalyzerUpload.jsx` | Upload interface & results display |

### Pages (`/app/`)

| Route | Purpose |
|-------|---------|
| `/analyzer` | Full analyzer tool page |

### Documentation

| File | Purpose |
|------|---------|
| `OCR_SETUP_GUIDE.md` | Complete setup instructions |
| `DEPENDENCIES.md` | Required packages & versions |
| `OCR_AND_AI_PIPELINE_README.md` | This file |
| `.env.example` | Environment variable template |

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install openai googleapis
```

### 2. Set Environment Variables

```bash
# Copy template
cp .env.example .env.local

# Configure with your API keys
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/google-key.json
# OPENAI_API_KEY=sk-...
```

### 3. Set Up Google Cloud

1. Create GCP project
2. Enable Cloud Vision API
3. Create service account with Vision permissions
4. Download JSON key and save as `google-key.json`

### 4. Set Up OpenAI

1. Create OpenAI account
2. Generate API key
3. Add to `.env.local` as `OPENAI_API_KEY`

### 5. Start Development

```bash
npm run dev
# Visit http://localhost:3000/analyzer
```

## 📊 Processing Pipeline

```
User Upload
    ↓
[Image Validation]
    - Check format (JPEG, PNG, WebP, etc)
    - Verify size (< 20MB)
    - Extract dimensions
    ↓
[Image Preprocessing]
    - Convert to base64
    - Estimate OCR quality
    ↓
[OCR Extraction]
    - Google Vision API
    - Extract text blocks
    - Calculate confidence
    ↓
[AI Analysis]
    - Send to OpenAI GPT-4
    - Classify document
    - Extract entities
    - Generate summary
    ↓
[Results Response]
    - Return structured JSON
    - Include metrics
    - Provide quality scores
```

## 🔧 API Usage

### Upload and Analyze Image

```bash
curl -X POST http://localhost:3000/api/process \
  -F "image=@document.jpg" \
  -F "context=Invoice"
```

### Response Structure

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
      "text": "Extracted text content...",
      "confidence": 0.92,
      "blocksCount": 15,
      "cleanedText": "Normalized text..."
    },
    "analysis": {
      "summary": "Document summary",
      "classification": "invoice",
      "keyPoints": ["key1", "key2"],
      "entities": [
        {
          "name": "John Doe",
          "type": "PERSON",
          "value": "..."
        }
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

## 📝 Supported Formats

**Image Formats:**
- JPEG / JPG
- PNG
- WebP
- GIF
- TIFF

**Constraints:**
- Max size: 20MB
- Recommended: 400-2000px minimum dimension
- Aspect ratio: 0.3 - 3.0

## 🎨 Frontend Component

```tsx
import OCRAnalyzerUpload from "@/app/components/OCRAnalyzerUpload";

export default function Page() {
  return <OCRAnalyzerUpload />;
}
```

## 📚 Documentation

- **Setup Guide**: [OCR_SETUP_GUIDE.md](./OCR_SETUP_GUIDE.md)
- **Dependencies**: [DEPENDENCIES.md](./DEPENDENCIES.md)
- **Environment Config**: [.env.example](./.env.example)
- **Type Definitions**: [lib/types.ts](./app/lib/types.ts)

## ⚙️ Configuration

### OCR Settings

```typescript
// Min confidence threshold
OCR_CONFIDENCE_THRESHOLD = 0.3

// Image dimension constraints
MIN_DIMENSION = 200px
MAX_DIMENSION = 3000px
OPTIMAL_DIMENSION = 400-2000px
```

### AI Settings

```typescript
// Model configuration
MODEL = "gpt-4-turbo-preview"
TEMPERATURE = 0.3
MAX_TOKENS = 1500
```

## 🔐 Security

- API keys stored in `.env.local` (never committed)
- File size validation (20MB limit)
- MIME type checking
- Input sanitization
- Error details hidden in production

## 📊 Monitoring

### Health Check

```bash
GET /api/process
```

### Performance Metrics

Each response includes:
- `processingTime` - Total pipeline duration
- `ocrConfidence` - OCR text extraction confidence
- `aiConfidence` - AI analysis confidence
- `overallQuality` - Combined quality score

### Debug Logging

```bash
# Enable in .env.local
DEBUG_OCR_PIPELINE=true
```

## 🧪 Testing

Run test suite:

```bash
# Verify setup
npm run test:pipeline

# Or with Node directly
node test-pipeline.ts
```

Tests verify:
- Environment variables configured
- Image validation working
- Text cleaning functional
- API endpoint healthy

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "No API key" | Check .env.local configuration |
| "Module not found" | Run `npm install` |
| "No text detected" | Use clearer image |
| "Rate limit" | Upgrade API plan or wait |
| "Timeout" | Reduce image size |

See [OCR_SETUP_GUIDE.md](./OCR_SETUP_GUIDE.md) for detailed troubleshooting.

## 🚢 Deployment

### Vercel / Netlify

1. Set environment variables in project settings
2. Ensure `google-key.json` or contents are configured
3. Deploy branch

### Self-Hosted

```bash
# Build
npm run build

# Start
npm start
```

Ensure environment variables are set:
```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
OPENAI_API_KEY=sk-...
NODE_ENV=production
```

## 📈 Performance

- **Average processing**: 1.5 - 3 seconds
- **OCR accuracy**: 85-95% for clear text
- **Max file size**: 20MB
- **Concurrent requests**: Limited by API quotas

## 🔄 Pipeline Stages

1. **Validation** (< 100ms) - Format & size checks
2. **Preprocessing** (< 100ms) - Image optimization
3. **OCR** (500-2000ms) - Google Vision API call
4. **AI Analysis** (500-1500ms) - OpenAI API call
5. **Response** (< 100ms) - JSON compilation

## 🛣️ Roadmap

- [ ] Batch processing for multiple images
- [ ] Custom model training for specific documents
- [ ] Webhook notifications for long jobs
- [ ] Advanced image enhancement filters
- [ ] Multi-language OCR support
- [ ] Real-time streaming results

## 📞 Support

- Check [OCR_SETUP_GUIDE.md](./OCR_SETUP_GUIDE.md)
- Review error messages and logs
- Test with [test-pipeline.ts](./test-pipeline.ts)
- Check API documentation:
  - [Google Cloud Vision](https://cloud.google.com/vision/docs)
  - [OpenAI API](https://platform.openai.com/docs)

## 📄 License

Proprietary - Adigator

## 🙏 Credits

Built for Adigator analyzer tool with:
- Next.js 14
- Google Cloud Vision
- OpenAI API
- TypeScript

---

**Version**: 1.0.0  
**Last Updated**: May 2026  
**Status**: Production Ready ✅
