# Files to Add to .gitignore for OCR & AI System

Add these lines to your `./.gitignore` to prevent sensitive files from being committed:

```gitignore
# Environment variables and secrets
.env.local
.env.development.local
.env.test.local
.env.production.local

# Google Cloud service account keys
google-key.json
google-service-account*.json
/keys/**

# Node modules
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Production build
/build
/.next
/out

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Misc
.cache/
.eslintcache
dist/
temp/
tmp/
```

## Why These Files?

### 🔐 CRITICAL - Never Commit!
- **`.env.local`** - Contains `OPENAI_API_KEY` (worth $$)
- **`google-key.json`** - GCP credentials with API access
- **Any `*-key.json`** - All credential files

If accidentally committed:
1. Regenerate all API keys immediately
2. Remove sensitive files from Git history
3. Delete old keys from GCP/OpenAI

### 📦 Standard Node Files
- `node_modules/` - Installed dependencies
- `.next/` - Next.js build output
- `build/` - Build artifacts

### 📝 Logs and Temp Files
- `*.log` - Node/npm logs
- `tmp/` - Temporary files
- `.cache/` - Cache files

### 💻 IDE Files
- `.vscode/` - VS Code settings
- `.idea/` - JetBrains IDE files
- `*.swp` - Vim swap files

## Verify Setup

```bash
# Check what would be committed
git status

# Ensure sensitive files are excluded
git check-ignore .env.local
git check-ignore google-key.json

# Should show full paths if properly ignored
```

## If Accidentally Committed

If you already committed sensitive files:

```bash
# Remove from Git history (dangerous - use with care)
git filter-branch --tree-filter 'rm -f .env.local google-key.json' HEAD

# Or use BFG Repo Cleaner (recommended):
# https://rtyley.github.io/bfg-repo-cleaner/

# After removing, regenerate all API keys!
```

## For Team Members

Share this `.gitignore` but NOT the actual keys:

```bash
# Good - Share template
cp .env.example .env.local
# Team member fills in their own keys

# Bad - Don't share .env.local
# Bad - Don't share google-key.json
```

## Local Development

To develop locally with credentials:

```bash
# 1. Create .env.local
cp .env.example .env.local

# 2. Add your credentials
nano .env.local
# GOOGLE_APPLICATION_CREDENTIALS=./google-key.json
# OPENAI_API_KEY=sk-...

# 3. Place google-key.json in project root
# cp ~/Downloads/google-key.json ./

# 4. Verify it's ignored
git status  # Should NOT show these files
```

## Production Deployment

Instead of `.env.local`, use platform-specific env vars:

**Vercel:**
```bash
# Add in Vercel dashboard:
# Project Settings → Environment Variables
GOOGLE_APPLICATION_CREDENTIALS = <paste JSON contents>
OPENAI_API_KEY = sk-...
```

**Other Platforms:**
- Netlify: Site Settings → Build & Deploy → Environment
- Docker: `docker run -e OPENAI_API_KEY=sk-...`
- Self-hosted: Set OS environment variables

---

**Remember**: Never commit secrets. Keep credentials local and in `.gitignore`.
