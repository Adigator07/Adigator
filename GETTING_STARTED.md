# 🚀 OCR & AI System - Getting Started Checklist

Follow these steps in order to get the system up and running.

## ⏱️ Time Required
- Setup: ~15-20 minutes
- Configuration: ~10 minutes
- Testing: ~5 minutes
- **Total: ~30-45 minutes**

---

## ✅ Phase 1: Install Dependencies (5 min)

- [ ] Open terminal in project root
- [ ] Run: `npm install openai googleapis`
- [ ] Verify: `npm list openai googleapis`
- [ ] Check: Both packages should be listed in output

**Command:**
```bash
npm install openai googleapis
```

---

## ✅ Phase 2: Set Up Google Cloud (10 min)

### Step A: Create GCP Project
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com)
- [ ] Create new project named "adigator-ocr"
- [ ] Wait for project creation
- [ ] Select project from dropdown

### Step B: Enable Vision API
- [ ] Search for "Vision API"
- [ ] Click "Cloud Vision API"
- [ ] Click "Enable"
- [ ] Wait for enablement (2-3 minutes)

### Step C: Create Service Account
- [ ] Navigate to "IAM & Admin" → "Service Accounts"
- [ ] Click "+ Create Service Account"
- [ ] Enter name: `adigator-ocr-service`
- [ ] Click "Create and Continue"
- [ ] Select role: "Cloud Vision API User"
- [ ] Click "Continue"
- [ ] Click "Done"

### Step D: Create & Download Key
- [ ] In Service Accounts list, click the account you created
- [ ] Go to "Keys" tab
- [ ] Click "Add Key" → "Create new key"
- [ ] Choose "JSON" format
- [ ] Click "Create"
- [ ] File downloads automatically
- [ ] Save as `google-key.json` in project root
- [ ] Add to `.gitignore` (critical!)

**Verify:**
```bash
ls -la google-key.json  # Should exist
```

---

## ✅ Phase 3: Set Up OpenAI API (5 min)

### Step A: Create Account
- [ ] Go to [OpenAI Platform](https://platform.openai.com)
- [ ] Sign up or log in

### Step B: Generate API Key
- [ ] Click your profile → "API keys"
- [ ] Click "Create new secret key"
- [ ] Copy the key (starts with `sk-`)
- [ ] Save somewhere safe (you won't see it again!)

**Keep this key safe!** This is like a password to OpenAI.

---

## ✅ Phase 4: Configure Environment (5 min)

- [ ] Copy template: `cp .env.example .env.local`
- [ ] Open `.env.local`: `nano .env.local`
- [ ] Find: `GOOGLE_APPLICATION_CREDENTIALS`
- [ ] Set to: `./google-key.json`
- [ ] Find: `OPENAI_API_KEY`
- [ ] Set to: `sk-...` (paste your key)
- [ ] Save file (Ctrl+X, then Y, then Enter)
- [ ] Verify: `cat .env.local` (check values are set)

**Example .env.local:**
```
GOOGLE_APPLICATION_CREDENTIALS=./google-key.json
OPENAI_API_KEY=sk-proj-abc123xyz...
NODE_ENV=development
```

---

## ✅ Phase 5: Start Development Server (2 min)

- [ ] Run: `npm run dev`
- [ ] Wait for message: "ready - started server on 0.0.0.0:3000"
- [ ] Open browser: `http://localhost:3000/analyzer`

**Command:**
```bash
npm run dev
```

---

## ✅ Phase 6: Test the System (5 min)

### Test 1: Page Loads
- [ ] Visit `http://localhost:3000/analyzer`
- [ ] See "OCR & AI Analyzer" title
- [ ] See upload interface

### Test 2: Upload Interface
- [ ] Click on upload area
- [ ] Select any image from your computer
- [ ] See preview appear
- [ ] See loading spinner

### Test 3: Full Pipeline
- [ ] Wait for processing (2-4 seconds)
- [ ] See results appear
- [ ] Check confidence metrics
- [ ] Review extracted text
- [ ] Verify AI analysis

**If tests pass:** ✅ Everything works!  
**If tests fail:** See troubleshooting below

---

## ✅ Phase 7: Verify Setup (2 min)

Run test suite:
```bash
node test-pipeline.ts
```

Should see:
```
✅ Environment Variables - PASS
✅ Image Validation - PASS  
✅ OCR Text Cleaning - PASS
✅ API Health Check - PASS
```

---

## 🐛 Troubleshooting

### "Cannot find module 'openai'"
```bash
npm install openai --save
npm list openai
```

### "GOOGLE_APPLICATION_CREDENTIALS not set"
```bash
# Check .env.local
cat .env.local | grep GOOGLE

# Should show path to google-key.json
# Verify file exists
ls -la google-key.json
```

### "OPENAI_API_KEY not set"
```bash
# Check .env.local
cat .env.local | grep OPENAI

# Should show sk-...
# Verify key is valid
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

### "No text detected in image"
- Image quality too low
- Text too small or blurry
- Try a clearer image

### "Connection timeout"
- Dev server not running (`npm run dev`)
- Wrong port (should be 3000)
- Check `http://localhost:3000/analyzer`

### "Rate limit exceeded"
- Too many API calls
- Check GCP & OpenAI dashboards
- Wait a few moments
- Upgrade API plan if needed

---

## 📁 What You Should See

### File Structure
```
/Adigator
├── .env.local                  ← Created (has your keys)
├── google-key.json            ← Created (from GCP)
├── app/
│   ├── api/process/route.ts   ← New
│   ├── analyzer/page.tsx      ← New
│   ├── components/
│   │   └── OCRAnalyzerUpload.jsx ← New
│   └── lib/
│       ├── ocr.ts             ← New
│       ├── ai.ts              ← New
│       ├── vision.ts          ← New
│       └── types.ts           ← New
└── [documentation files]      ← Guides & setup
```

### Browser View
- URL: `http://localhost:3000/analyzer`
- Page title: "OCR & AI Analyzer"
- Upload section visible
- Results section ready
- No error messages

---

## 🎯 Success Indicators

✅ All checks below should pass:

- [ ] Dependencies installed (`npm list`)
- [ ] Environment file created (`.env.local`)
- [ ] Google key file exists (`google-key.json`)
- [ ] Server starts without errors (`npm run dev`)
- [ ] Page loads (`http://localhost:3000/analyzer`)
- [ ] Upload interface visible
- [ ] Can select images
- [ ] Processing works (status changes)
- [ ] Results display
- [ ] Metrics show (confidence, time, etc)
- [ ] Test suite passes (`node test-pipeline.ts`)

---

## 📞 Next Steps

1. **Explore the interface**
   - Try uploading different images
   - Test different document types
   - Check confidence scores

2. **Review the code**
   - Read `/app/api/process/route.ts` (main pipeline)
   - Check `/app/lib/ocr.ts` (OCR logic)
   - Review `/app/lib/ai.ts` (AI logic)

3. **Customize as needed**
   - Adjust OCR thresholds
   - Modify AI prompts
   - Change UI styling

4. **Deploy when ready**
   - Push to GitHub
   - Connect to Vercel
   - Add environment variables
   - Deploy branch

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **OCR_SETUP_GUIDE.md** | Detailed setup instructions |
| **OCR_QUICK_REFERENCE.md** | Developer quick lookup |
| **IMPLEMENTATION_SUMMARY.md** | What was built |
| **DEPENDENCIES.md** | Required packages |

---

## ✅ Completion Checklist

After completing all steps, you should be able to:

- [ ] Navigate to `/analyzer` page
- [ ] Upload an image successfully
- [ ] See image preview
- [ ] Get OCR text extraction
- [ ] Get AI analysis results
- [ ] See confidence metrics
- [ ] Process multiple images
- [ ] No error messages

---

## 🎉 You're Ready!

Once all steps are complete:
- System is fully functional
- Ready for production
- Ready to customize
- Ready to deploy

**Enjoy your OCR & AI analyzer!**

---

**Time to Complete**: 30-45 minutes  
**Difficulty**: Beginner-friendly  
**Support**: See OCR_SETUP_GUIDE.md for detailed help

**Last Updated**: May 2026
