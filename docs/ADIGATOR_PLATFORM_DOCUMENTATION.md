# Adigator Platform — Complete Application Documentation

**Version:** 0.1.0 (as of June 2026)  
**Production URL:** [https://adigator.in](https://adigator.in)  
**Repository:** [github.com/Adigator07/Adigator](https://github.com/Adigator07/Adigator)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Purpose & Value Proposition](#2-product-purpose--value-proposition)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Website Pages & Navigation](#5-website-pages--navigation)
6. [Preview Tool — Core Workflow](#6-preview-tool--core-workflow)
7. [Step 1: Campaign Setup](#7-step-1-campaign-setup)
8. [Step 2: Upload & Validation](#8-step-2-upload--validation)
9. [Step 3: Strategic Analyzer](#9-step-3-strategic-analyzer)
10. [Step 4: Preview Studio](#10-step-4-preview-studio)
11. [Campaign Readiness Validation System](#11-campaign-readiness-validation-system)
12. [API Reference](#12-api-reference)
13. [Data Storage & Backend (Supabase)](#13-data-storage--backend-supabase)
14. [Communication Platform](#14-communication-platform)
15. [Dashboard & Admin](#15-dashboard--admin)
16. [Authentication & Access Control](#16-authentication--access-control)
17. [Environment Variables](#17-environment-variables)
18. [Export & Reporting](#18-export--reporting)
19. [Supported Platforms, Goals & Verticals](#19-supported-platforms-goals--verticals)
20. [Project Structure](#20-project-structure)
21. [Development & Deployment](#21-development--deployment)
22. [Appendix: Key Design Decisions](#22-appendix-key-design-decisions)

---

## 1. Executive Summary

**Adigator** is an AI-powered advertising creative intelligence platform built for performance marketers, agencies, and in-house ad teams. It provides an end-to-end workflow to:

- Configure campaigns by **platform**, **goal**, **industry vertical**, and **audience stage**
- **Upload and validate** display creatives against IAB/platform size matrices
- Run **strategic AI analysis** on each creative (goal alignment, vertical fit, platform readiness)
- **Preview** creatives in realistic Google, Meta, and Programmatic placement contexts
- **Export** strategic findings to PowerPoint (PPTX)
- **Collaborate** via an internal communication platform for creative review

The primary user-facing tool is the **Preview Tool** (also called **Creative Studio**), accessible at `/preview-tool` and `/preview`.

---

## 2. Product Purpose & Value Proposition

| Capability | Purpose |
|------------|---------|
| **Creative Validation** | Catch wrong dimensions, file weight, format, and inventory mismatches before launch |
| **Strategic Analysis** | AI + rule-based scoring for goal/vertical alignment, attention path, and business impact |
| **Preview Studio** | See ads in platform-native templates (26 placements) plus safe-zone and crop simulation |
| **Campaign Readiness** | URL health, UTM checks, duplicate detection, and readiness scoring |
| **Collaboration** | Chat-based creative review with roles (admin, USA client, end client) |
| **Reporting** | PPTX export for stakeholder presentations |

**Target users:** Performance marketing teams, creative strategists, ad ops, and agencies running Google Ads, Meta Ads, or Programmatic display.

---

## 3. Technology Stack

### Frontend
| Technology | Version | Role |
|------------|---------|------|
| **Next.js** | 16.2.3 | App Router, SSR/SSG, API routes |
| **React** | 19.2.4 | UI components |
| **TypeScript** | 5.9.x | Type-safe modules (API, validation, types) |
| **Tailwind CSS** | 4.2.x | Styling |
| **Framer Motion** | 12.x | Page transitions, animations |
| **GSAP** | 3.15.x | Marketing page motion |
| **Lucide React** | 1.8.x | Icons |

### Backend & Services
| Technology | Role |
|------------|------|
| **Next.js API Routes** | Serverless API endpoints |
| **OpenAI API** | Creative extraction, strategic analysis, vision-based element detection |
| **Supabase** | Auth, PostgreSQL database, Row Level Security (RLS) |
| **Sharp** | Server-side image processing |
| **IndexedDB** (client) | Creative blob storage via `creativeAssetStore` |

### Export & Media
| Library | Role |
|---------|------|
| **pptxgenjs** | PPTX strategic report export |
| **html2canvas** | Preview PNG download from Preview Studio |
| **jspdf** | PDF utilities (where used) |

### Development
| Tool | Role |
|------|------|
| **ESLint** | Linting (eslint-config-next) |
| **PostCSS / Autoprefixer** | CSS processing |

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│  Marketing Pages │ Dashboard │ Preview Tool │ Communications   │
└────────────┬───────────────────────────────┬────────────────────┘
             │                               │
             ▼                               ▼
┌────────────────────────────┐   ┌───────────────────────────────┐
│   Next.js App Router       │   │   Client-side Storage         │
│   (app/ pages + API)       │   │   localStorage, IndexedDB     │
└────────────┬───────────────┘   └───────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────────────────────────┐
│                     API Layer (app/api/)                        │
│  analyze-creative │ validate │ google/meta/programmatic analysis│
│  preview-engine │ creatives │ session │ communications │ activity│
└────────────┬───────────────────────────────┬───────────────────┘
             │                               │
             ▼                               ▼
┌────────────────────────────┐   ┌───────────────────────────────┐
│   OpenAI API               │   │   Supabase (PostgreSQL + Auth) │
│   GPT-4o (default model)   │   │   RLS-protected tables         │
└────────────────────────────┘   └───────────────────────────────┘
```

### Analysis Pipeline (High Level)

1. **Upload** → Read pixel dimensions from file headers (PNG/JPEG/GIF/WebP)
2. **Validate** → Match against platform size matrix; score inventory, IAB, DSP, auction readiness
3. **Analyze** → OpenAI vision extraction + deterministic rule layers → strategic JSON contract
4. **Preview** → Template-based placement previews + optional OpenAI element detection for crop/safe zones
5. **Export** → Aggregate results into PPTX deck

---

## 5. Website Pages & Navigation

### Public Marketing Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Marketing landing: features, case studies, blog teasers, CTA to demo |
| `/product` | Product | Platform overview, Ad Performance, Ad Creation sections |
| `/solutions` | Solutions | Use cases by team and industry |
| `/about` | About | Company/product information |
| `/demo` | Demo | Demo video / walkthrough entry |
| `/login` | Login | Supabase authentication (email/password, OAuth if configured) |

### Application Pages (Authenticated or Demo)

| Route | Page | Description |
|-------|------|-------------|
| `/preview-tool` | Preview Tool (gated) | Full 4-step Creative Studio with demo mode (`?demo=1`) |
| `/preview` | Preview Tool (alias) | Same tool, dark theme wrapper |
| `/preview-tool?step=1` | Step 1 entry | Always starts fresh campaign setup from dashboard |
| `/dashboard` | User Dashboard | Stats, quick actions, template categories, recent activity |
| `/dashboard/communications` | Communications | Hybrid chat + creative review platform |
| `/dashboard/admin` | Admin Dashboard | Activity logs (admin role only) |

### Navigation Source
Centralized in `app/lib/siteNavigation.ts` — marketing nav links, footer columns, CTA URLs.

---

## 6. Preview Tool — Core Workflow

The Preview Tool is the heart of Adigator. It is a **4-step wizard**:

| Step | Label | URL Param | Primary Function |
|------|-------|-----------|------------------|
| 1 | Setup | `?step=1` | Select platform, goal, vertical, audience stage, campaign name, landing URL |
| 2 | Upload | `?step=2` | Upload creatives, validate dimensions, compress, auto-fix issues |
| 3 | Analysis | `?step=3` | Run AI strategic analyzer on all valid creatives |
| 4 | Preview Studio | `?step=4` | Placement previews, safe zones, crop simulation, PPTX export |

**Main file:** `app/components/PreviewTool.jsx` (~2,800 lines)

**State persistence:**
- Campaign config → `localStorage` (platform, goal, vertical, audience, campaign name, URL)
- Creatives metadata → `localStorage` via `workflowStorage.js`
- Creative binary files → **IndexedDB** via `creativeAssetStore.js`
- Analysis session → Supabase `analysis_sessions` + localStorage session ID

**Navigation rules:**
- Opening from dashboard always uses `?step=1` (no step restore from localStorage on fresh open)
- Step 1 fields load empty on fresh open; config hydrates only when resuming past Step 1
- "Start New Analysis" clears all config and creatives

---

## 7. Step 1: Campaign Setup

### Fields Collected

| Field | Options / Notes |
|-------|-----------------|
| **Platform** | Google Ads, Meta Ads, Programmatic Ads |
| **Campaign Goal** | Platform-specific (see [Section 19](#19-supported-platforms-goals--verticals)) |
| **Industry Vertical** | 18 verticals including Healthcare, Technology, Fashion, Fitness, etc. |
| **Audience Stage** | Cold, Warm, Hot/Retargeting |
| **Campaign Name** | Free text (used in readiness validation) |
| **Landing Page URL** | Required for readiness check (except Meta-only flows) |

### Purpose
Step 1 context drives **all downstream intelligence**:
- Analyzer prompts are platform/goal/vertical-aware
- Validation matrices differ per platform
- Preview Studio shows platform-specific placements
- Goal alignment compares creative signals to selected objective stage

---

## 8. Step 2: Upload & Validation

### Upload Flow
1. User drops or selects image files (JPG, PNG, GIF, WebP)
2. `readImageDimensionsFromBlob()` reads true pixel dimensions from file headers
3. Filename reconciliation (`300x250`, `300-250`) corrects misread JPEG metadata
4. `validateCreativeAsset()` runs platform size matrix matching
5. Creatives stored in IndexedDB; metadata persisted to localStorage

### Validation Intelligence (per creative)

Each creative receives a **Validation Report** including:

| Metric | Description |
|--------|-------------|
| **Size** | Detected dimensions (e.g., `300x250`) |
| **Placement Type** | Display, native, mobile, etc. |
| **Device Classification** | Desktop, mobile, tablet, multi |
| **IAB Compatibility** | Standard IAB banner compatibility |
| **DSP Compatibility** | Count of supported DSPs (0–7) |
| **Inventory Availability** | Premium, standard, limited, unsupported |
| **Auction Readiness** | Score 0–100 with band (Ready, Review, Not Eligible) |
| **Premium Placement Potential** | Eligibility for premium packages |
| **Status** | PASS, WARNING, or CRITICAL |

**Key file:** `app/lib/creativeValidation.js`

### Step 2 Features

| Feature | Description |
|---------|-------------|
| **Bulk Compression** | Set one target KB and compress all creatives |
| **Per-creative Compression** | Target KB input + "Compress Size" button |
| **One-click Auto-fix** | Convert AVIF→JPG, compress to 150KB, etc. (`creativeFixActions.js`) |
| **Campaign Readiness Report** | URL health, UTM validation, duplicate detection (`/api/validate`) |
| **Valid vs Critical lists** | Creatives split by validation severity |
| **Download** | Download individual processed creatives |

### Campaign Readiness (Step 2 sidebar)

Triggered via **Run Readiness Check** using `useCampaignValidation` hook:

- Landing URL health (SSL, redirects, load time, viewport, CTA detection)
- UTM parameter validation
- Cross-creative duplicate detection (perceptual hash)
- Platform-specific spec checks (`googleSpecs`, `metaSpecs`, `programmaticSpecs`)
- Readiness score: Ready (≥85), Review Needed (60–84), Not Ready (<60)

**Components:** `ValidationReport.tsx`, `ReadinessScore.tsx`, `ValidationIssueRow.jsx`

---

## 9. Step 3: Strategic Analyzer

### Purpose
Analyze each uploaded creative against the Step 1 campaign context and produce **actionable strategic intelligence** for launch decisions.

### UI Structure
- **Overview tab** — Campaign-level summary, health dimensions, cross-creative insights
- **Creative Analysis tab** — Per-creative deep dive with goal/vertical alignment badges

**Components:** `AnalysisPanel.jsx`, `AnalyzerOverview.jsx`, `AnalyzerCreativeSection.jsx`

### Analyzer API
**Endpoint:** `POST /api/analyze-creative`  
**File:** `app/api/analyze-creative/route.ts` (~5,000 lines)

### Analysis Layers (Orchestrator)

The analyze-creative route implements a multi-layer pipeline:

| Layer | Function |
|-------|----------|
| **1. Extraction** | OpenAI vision — headline, CTA, colors, layout, emotional cues, trust markers |
| **2. Signal Classification** | CTA pressure, urgency level, funnel stage inference |
| **3. Vertical Intelligence** | Product category detection, advertising behavior, strategic interpretation |
| **4. Creative Type Detection** | Primary/secondary format (static, carousel-like, hybrid) |
| **5. Attention Analysis** | First-focus path, friction points, scan behavior |
| **6. Goal Alignment** | Compare detected funnel stage vs selected campaign goal |
| **7. Vertical Alignment** | Keyword fit score + AI vertical match reconciliation |
| **8. Platform Alignment** | Google/Meta/Programmatic-specific fit scoring |
| **9. Campaign Alignment** | Overall aligned / partially aligned / misaligned |
| **10. Strategic Recommendations** | Prioritized HIGH/MEDIUM/LOW fixes |
| **11. Business Impact** | Affected metrics, consequence modeling |
| **12. Adigator Analysis Block** | Technical risks, placement compatibility, formatted output |
| **13. Enterprise QA** | Launch readiness, compliance policies, inventory simulation |
| **14. Dynamic Platform Eval** | Google RDA, Meta feed, Programmatic display modules |

### Strategic Output Contract

Each analyzed creative returns a JSON payload with fields including:

- `main_strategic_problem`
- `attention_analysis`
- `business_consequence`
- `strategic_recommendations[]`
- `expected_improvement`
- `strategic_alignment_score`
- `campaign_alignment`
- `goal_alignment` (selected vs detected, `is_aligned`, reason)
- `vertical_alignment` (fit score, evidence, product category)
- `business_impact`
- `adigator_analysis`
- `extraction_signals`
- `ai_analysis` (overall score, goal_match, vertical_match, issues)

**Presentation layer:** `app/lib/strategicPresentation.js`, `app/lib/analyzerInsights.js`

### Alignment Logic (Recent Improvements)
- Goal alignment: signal-based stage match wins over false AI negatives
- Vertical alignment: fit score for selected vertical prioritized over keyword category guess
- UI status: Aligned / Needs Review / Misaligned via `resolveGoalAlignmentStatus()` and `resolveVerticalAlignmentStatus()`

---

## 10. Step 4: Preview Studio

**Component:** `app/components/PreviewStudio/index.jsx`

### Platform: Programmatic
- **Placement Previews only** — 8 vertical templates (Healthcare, Technology, Food, E-commerce, Gaming, News, OTT, Blogs)
- PNG export via html2canvas (`DownloadButton.jsx`)
- Creative picker for source image injection

### Platform: Google Ads & Meta Ads
Three tabs:

| Tab | Description |
|-----|-------------|
| **Placement Previews** | 8 Google + 10 Meta hardcoded placement templates |
| **Safe Zone Overlay** | AI element detection + safe area visualization |
| **Crop Simulation** | Center-crop preview across standard ad formats |

### Placement Templates (26 total)

**Google (8):** Search, Display, YouTube, App Interstitial, Discover, Gmail, Maps, Shopping

**Meta (10):** Facebook Feed/Stories/Reels, Instagram Feed/Stories/Explore, Messenger Inbox, Sponsored Messages, Audience Network, Threads Feed

**Programmatic (8):** Healthcare, Technology, Food & Restaurant, E-commerce, Gaming, News Articles, OTT/Streaming, Blogs

**Registry:** `app/components/PreviewStudio/previewRegistry.js`  
**Dummy content:** `app/components/PreviewStudio/dummy/` (googleDummy, metaDummy, programmaticDummy)

### Safe Zone & Crop (Google/Meta only)

| Component | API Hook | Backend |
|-----------|----------|---------|
| `GoogleSafeZoneOverlay` | `useGoogleCreativeAnalysis` | `/api/google-creative-analysis` |
| `GoogleCropSimulation` | same | OpenAI vision + heuristic element merge |
| `MetaSafeZoneOverlay` | `useMetaCreativeAnalysis` | `/api/meta-creative-analysis` |
| `MetaCropSimulation` | same | |

**UI:** Light-theme simplified panels (`studioAnalysisUi.jsx`) with verdict banner, element checklist, horizontal crop cards.

### Step 4 Actions
- **Export PPTX** — Strategic report deck via `exportPptx.js`
- **Start New Analysis** — Reset workflow
- **Back to Step 3** — Return to analyzer

---

## 11. Campaign Readiness Validation System

Modular rule-based validation integrated into Step 2.

### Architecture

```
app/types/validation.ts          — TypeScript types
app/constants/
  googleSpecs.ts                 — Google Ads objective + RDA requirements
  metaSpecs.ts                   — Meta objective + text rules
  programmaticSpecs.ts           — Programmatic size + category keywords
app/lib/
  validators/reportBuilder.ts      — Aggregates all module results
  url/healthCheck.ts             — Landing page HTTP analysis
  url/utmValidator.ts            — UTM parameter rules
  image/duplicateDetector.ts     — Perceptual duplicate detection
  creativeFixActions.js          — One-click fix action definitions
app/api/validate/route.ts        — POST endpoint
app/hooks/useCampaignValidation.ts
app/components/ValidationReport.tsx
app/components/ReadinessScore.tsx
app/components/ValidationIssueRow.jsx
```

### Readiness Score Calculation
- Start at 100
- −15 per error flag, −5 per warning
- Levels: `ready` (≥85), `review_needed` (60–84), `not_ready` (<60)

---

## 12. API Reference

### Creative Intelligence

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/analyze-creative` | Full strategic analysis orchestrator (OpenAI + rules) |
| POST | `/api/validate` | Campaign readiness report builder |
| POST | `/api/google-creative-analysis` | Vision element detection for Google safe zones |
| POST | `/api/meta-creative-analysis` | Vision element detection for Meta safe zones |
| POST | `/api/programmatic-creative-analysis` | Programmatic placement analysis |

### Preview & Templates

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/preview-engine` | Contextual preview engine (legacy/alternate preview path) |
| GET | `/api/preview-engine` | Preview engine metadata |
| POST | `/api/preview-templates` | OpenAI-generated preview templates (legacy studio) |

### Creatives & Sessions

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/creatives` | Persist/fetch user creatives in Supabase |
| POST | `/api/session/create` | Create analysis session |
| POST | `/api/session/update` | Update session state |
| GET | `/api/session/[id]` | Fetch session by ID |

### Activity & Admin

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/activity/log` | Log user activity events |
| GET | `/api/activity/list` | List user activity |
| GET | `/api/admin/activity` | Admin activity logs (role-gated) |

### Communications

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/communications/conversations` | List/create conversations |
| GET/PATCH | `/api/communications/conversations/[id]` | Conversation detail/update |
| GET/POST | `/api/communications/conversations/[id]/messages` | Messages |
| GET/POST | `/api/communications/conversations/[id]/activity` | Conversation activity |
| POST | `/api/communications/attachments/[id]/review` | Creative attachment review |
| GET/PATCH | `/api/communications/notifications` | User notifications |
| GET/PATCH | `/api/communications/users` | User profiles/roles |

---

## 13. Data Storage & Backend (Supabase)

### Authentication
- Supabase Auth (email/password, session cookies via `@supabase/ssr`)
- Client: `app/lib/supabase.ts`
- Server: `app/lib/supabaseServer.ts`

### Core Tables

| Table | Purpose |
|-------|---------|
| `creatives` | User-uploaded creative metadata |
| `analyzer_results` | JSON analysis results per creative/platform/goal |
| `activity_logs` | User activity audit trail |
| `user_activity_events` | Structured activity events |
| `analysis_sessions` | Persistent analysis session state |

### Communication Platform Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User roles (admin, usa_client, end_client) |
| `conversations` | Direct and project chat threads |
| `conversation_participants` | Membership and roles |
| `messages` | Text, file, creative, system messages |
| `attachments` | File/creative attachments with review status |
| `notifications` | In-app notifications |
| `comm_activity_events` | Communication audit trail |

### Row Level Security (RLS)
All tables use RLS policies — users can only access their own data unless admin/service role. Migration files in `supabase/migrations/`.

### Client-side Storage

| Store | Purpose |
|-------|---------|
| `localStorage` | Campaign config, workflow step metadata, session IDs |
| **IndexedDB** | Full-resolution and preview creative blobs |

---

## 14. Communication Platform

**Route:** `/dashboard/communications`  
**Component:** `app/components/communications/CommunicationPlatform`

### Purpose
Hybrid **chat + email-style creative review** for agency/client collaboration.

### Features
- Direct and project conversations
- Message types: text, file, creative, system events
- Creative attachment review workflow (pending → in_review → approved / revision_requested)
- Real-time updates via `useCommunicationRealtime` hook
- Role-based access (admin, USA client, end client)
- Activity tracking per conversation

### User Roles
| Role | Typical Use |
|------|-------------|
| `admin` | Platform administrator, full visibility |
| `usa_client` | Agency/strategist sending creatives for review |
| `end_client` | Brand client approving or requesting revisions |

---

## 15. Dashboard & Admin

### User Dashboard (`/dashboard`)
- Welcome header with user name
- Stats: total creatives, valid/invalid counts, platforms used
- Quick actions: Open Preview Tool, Resume Analysis
- Template category cards (E-commerce, News, Gaming, etc.)
- Links to communications and preview tool

### Admin Dashboard (`/dashboard/admin`)
- Restricted to admin role (`app/lib/admin/permissions.ts`)
- Activity log viewer (last 100 events)
- Future: platform analytics expansion

---

## 16. Authentication & Access Control

### Preview Tool Access (`PreviewToolGate.jsx`)

| Mode | Access |
|------|--------|
| **Authenticated user** | Full access, data persists to Supabase |
| **Guest demo** | `?demo=1&step=1` — limited session, resets on refresh |
| **Blocked** | Redirect to login if demo expired and not authenticated |

**Demo logic:** `app/lib/demoAccess.js`

### Admin Access
- Checked via Supabase profile role
- Non-admins redirected from `/dashboard/admin` to `/dashboard`

---

## 17. Environment Variables

Required in `.env.local` (never commit):

```env
# Supabase (required for auth + database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: server-side admin operations (bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (required for analyzer + vision analysis)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o          # optional, defaults to gpt-4o
```

---

## 18. Export & Reporting

### PPTX Export
- **Trigger:** Step 4 "Export PPTX" button
- **File:** `app/lib/exportPptx.js`
- **Library:** pptxgenjs
- **Content:** Campaign summary, per-creative analysis slides, alignment scores, recommendations, vertical/goal sections

### PNG Export (Preview Studio)
- **Trigger:** Download button per placement preview
- **File:** `app/components/PreviewStudio/DownloadButton.jsx`
- **Library:** html2canvas
- Captures rendered placement template as PNG

---

## 19. Supported Platforms, Goals & Verticals

### Platforms

| ID | Display Name | Step 4 Previews | Safe Zone / Crop |
|----|--------------|-----------------|------------------|
| `google_ads` | Google Ads | 8 placements | Yes |
| `meta_ads` | Meta Ads | 10 placements | Yes |
| `programmatic` | Programmatic Ads | 8 placements | No |

### Campaign Goals by Platform

**Google Ads & Meta Ads:**  
Awareness, Traffic, Conversion, Lead Generation, Engagement, App Installs, Retargeting

**Programmatic:**  
Awareness, Consideration, Conversion

### Audience Stages
- **Cold** — First-touch users
- **Warm** — Partially familiar users
- **Hot** — High-intent / retargeting users

### Industry Verticals (18)
Healthcare, Technology, Automotive, News/Media, Sports, **Fitness**, Business/Finance, Luxury, Travel, Hotels, Restaurants/Food, Banking/FinTech, Real Estate, Education/EdTech, Gaming, Entertainment/OTT, E-commerce/Retail, Fashion

### Standard Display Sizes (Programmatic examples)
300×250, 336×280, 728×90, 970×90, 970×250, 160×600, 300×600, 320×50, 320×100, 468×60, and more per `creativeSizeRegistry.js`

---

## 20. Project Structure

```
Adigator/
├── app/
│   ├── api/                    # Next.js API routes
│   ├── components/
│   │   ├── PreviewTool.jsx     # Main 4-step wizard
│   │   ├── PreviewStudio/      # Step 4 previews + analysis tabs
│   │   ├── communications/     # Chat/review platform
│   │   ├── environments/       # Contextual preview environments
│   │   ├── Analyzer*.jsx       # Step 3 UI
│   │   ├── Validation*.tsx     # Readiness UI
│   │   └── ...
│   ├── constants/              # Platform spec constants
│   ├── dashboard/              # Dashboard pages + layout
│   ├── hooks/                  # React hooks
│   ├── lib/
│   │   ├── analyzers/          # Platform-specific AI prompt brains
│   │   ├── validators/         # Readiness report builder
│   │   ├── creativeValidation.js
│   │   ├── imageDimensions.js
│   │   ├── exportPptx.js
│   │   └── ...
│   ├── preview/                # /preview route
│   ├── preview-tool/           # /preview-tool route (gated)
│   ├── types/                  # TypeScript types
│   └── globals.css
├── docs/                       # Documentation (this file)
├── public/                     # Static assets, fallback creatives
├── supabase/                   # SQL migrations and fix scripts
├── archive/legacy-docs/        # Historical documentation
├── package.json
├── next.config.ts
├── tsconfig.json
└── AGENTS.md                   # Next.js agent rules
```

---

## 21. Development & Deployment

### Local Development

```bash
npm install
npm run dev        # http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

### Deployment
- Designed for **Vercel** (Next.js native)
- Production site: **adigator.in**
- Environment variables must be set in hosting provider dashboard
- Supabase migrations applied via Supabase SQL editor or CLI

### Database Setup
Run migration files in order from `supabase/migrations/`, or use consolidated scripts:
- `RUN_PREVIEW_TOOL_TABLES.sql`
- `RUN_COMMUNICATION_PLATFORM.sql`
- `FIX_CONVERSATIONS_RLS.sql` (RLS policy fixes)

---

## 22. Appendix: Key Design Decisions

### Why OpenAI + Rules (Hybrid)?
- **OpenAI** handles vision extraction and nuanced strategic language
- **Deterministic rules** enforce platform size matrices, alignment reconciliation, and scoring consistency
- Prevents pure-LLM inconsistency for pass/fail validation decisions

### Why IndexedDB for Creatives?
- Full-resolution images exceed localStorage limits
- Enables offline-capable re-hydration on page refresh
- Preview thumbnails stored separately for fast grid rendering

### Why Template-based Preview Studio?
- Step 4 placement previews use **hardcoded templates** (26 total) for speed and consistency
- OpenAI is used **only** for safe-zone element detection and crop simulation (Google/Meta)
- Avoids latency and cost of generating previews on every request

### Step Navigation Defaults
- Dashboard links always open `?step=1` to prevent stale state confusion
- Step 1 never pre-selects platform/goal/vertical on fresh open
- Config hydrates from localStorage only when user resumes mid-workflow

### Dimension Detection
- Reads pixel dimensions from file headers (not browser decode)
- First JPEG SOF segment used (avoids thumbnail SOF misreads)
- EXIF orientation applied
- Filename patterns (`300x250`, `300-250`) reconcile mismatches

---

## Document Maintenance

| Item | Location |
|------|----------|
| This document | `docs/ADIGATOR_PLATFORM_DOCUMENTATION.md` |
| Agent rules | `AGENTS.md` |
| Legacy docs | `archive/legacy-docs/` |
| Supabase schema | `supabase/migrations/` |

For questions or updates, edit this file alongside code changes to keep documentation in sync.

---

*Generated for Adigator platform review — June 2026*
