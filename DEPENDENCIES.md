# OCR & AI System - Required Dependencies

Add these dependencies to your project to enable the OCR and AI processing pipeline.

## Installation

```bash
# Install required packages
npm install openai googleapis

# Or with yarn
yarn add openai googleapis
```

## Dependencies Explained

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `openai` | `^4.0.0` | OpenAI API client for AI-powered analysis |
| `googleapis` | `^130.0.0` | Google Cloud Vision API client for OCR |

### Already Included

The following dependencies are already in your project and support this system:

| Package | Purpose |
|---------|---------|
| `next` | Next.js framework for API routes |
| `typescript` | Type safety for the pipeline |
| `framer-motion` | UI animations in the upload component |
| `react` | UI components |

## Verify Installation

```bash
# Check installed versions
npm list openai googleapis
```

Expected output:
```
adigator@0.1.0
├── googleapis@130.0.0
└── openai@4.x.x
```

## TypeScript Configuration

The system uses TypeScript. Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "target": "ES2020",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

## Post-Installation Setup

After installing dependencies:

1. **Copy environment file**
   ```bash
   cp .env.example .env.local
   ```

2. **Set up Google Cloud credentials**
   - Create service account key
   - Save as `google-key.json` in project root
   - Add to `.gitignore`

3. **Set up OpenAI API key**
   - Generate API key from OpenAI platform
   - Add to `.env.local`

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Test the pipeline**
   - Navigate to `http://localhost:3000/analyzer`
   - Upload an image to test

## Troubleshooting

### "Cannot find module 'openai'"
```bash
npm install openai --save
```

### "Cannot find module 'googleapis'"
```bash
npm install googleapis --save
```

### Dependencies conflict
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Build errors
```bash
# Verify TypeScript types
npm run build

# Check for lint issues
npm run lint
```

## Version Compatibility

- **Node.js**: 18.x or higher
- **Next.js**: 14.x or higher
- **React**: 18.x or higher
- **TypeScript**: 5.x or higher

For updates to dependency versions, check:
- [OpenAI GitHub Releases](https://github.com/openai/node-sdk/releases)
- [Google APIs GitHub](https://github.com/googleapis/google-api-nodejs-client/releases)

---

**Last Updated**: May 2026
