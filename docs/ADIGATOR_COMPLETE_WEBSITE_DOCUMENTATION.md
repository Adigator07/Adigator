# Adigator — Complete Website Documentation

**Document Version:** 1.0  
**Platform Version:** 0.1.0  
**Last Updated:** June 2026  
**Production URL:** https://adigator.in  
**Repository:** github.com/Adigator07/Adigator

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Purpose & Value Proposition](#2-product-purpose--value-proposition)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Complete Site Map — Every Page](#5-complete-site-map--every-page)
6. [Marketing Website](#6-marketing-website)
7. [Authentication & User Roles](#7-authentication--user-roles)
8. [Preview Tool — Complete Workflow](#8-preview-tool--complete-workflow)
9. [Campaign Readiness & Validation](#9-campaign-readiness--validation)
10. [Strategic Analyzer (Step 3)](#10-strategic-analyzer-step-3)
11. [Preview Studio (Step 4)](#11-preview-studio-step-4)
12. [User Dashboard](#12-user-dashboard)
13. [Organization Platform (Multi-Tenant)](#13-organization-platform-multi-tenant)
14. [Super Admin Platform](#14-super-admin-platform)
15. [Communication Platform](#15-communication-platform)
16. [Settings, Downloads & Account](#16-settings-downloads--account)
17. [Guest Demo Access](#17-guest-demo-access)
18. [Complete API Reference](#18-complete-api-reference)
19. [Database Schema (Supabase)](#19-database-schema-supabase)
20. [Data Services & Analytics](#20-data-services--analytics)
21. [Export & Reporting](#21-export--reporting)
22. [Supported Platforms, Goals & Verticals](#22-supported-platforms-goals--verticals)
23. [Environment Variables](#23-environment-variables)
24. [Development & Deployment](#24-development--deployment)
25. [Project Structure](#25-project-structure)
26. [Known Limitations & Roadmap Items](#26-known-limitations--roadmap-items)
27. [Appendix: Key Design Decisions](#27-appendix-key-design-decisions)

---

## 1. Executive Summary

**Adigator** is an AI-powered advertising creative intelligence platform for performance marketers, agencies, and in-house ad teams. It provides an end-to-end workflow to configure campaigns, upload and validate display creatives, run strategic AI analysis, preview ads in realistic placement contexts, export stakeholder reports, and collaborate on creative review.

### Core Capabilities

| Capability | Description |
|------------|-------------|
| Creative Validation | Catch wrong dimensions, file weight, format, and inventory mismatches before launch |
| Strategic Analysis | AI + rule-based scoring for goal/vertical alignment, attention path, and business impact |
| Preview Studio | 26+ platform-native placement templates with safe-zone and crop simulation |
| Campaign Readiness | URL health, UTM checks, duplicate detection, and readiness scoring |
| Multi-Tenant Orgs | Organizations, teams, and role-based member management |
| Collaboration | Chat-based creative review with Brand Owner and Servicing Team roles |
| Reporting | PPTX strategic deck export and PDF analysis reports |
| Enterprise Admin | Super admin console for users, analytics, audit, health, and org provisioning |

### Primary User Entry Points

| Entry | URL | Audience |
|-------|-----|----------|
| Marketing Landing | `/` | Prospects |
| Interactive Demo | `/preview-tool?demo=1&step=1` | Guests (one free session) |
| Preview Tool (Full) | `/preview-tool` | Authenticated users |
| User Dashboard | `/dashboard` | Logged-in users |
| Sign In | `/login` | All users |

---

## 2. Product Purpose & Value Proposition

Adigator solves the gap between creative production and campaign launch. Teams upload display creatives and receive:

1. **Technical validation** against Google Ads, Meta Ads, and Programmatic size/inventory matrices
2. **Strategic intelligence** on whether creatives align with campaign goals and industry verticals
3. **Contextual previews** showing how ads appear in Search, Feed, Stories, publisher sites, and more
4. **Actionable recommendations** prioritized by business impact
5. **Exportable reports** for client presentations and internal QA sign-off

### Target Users

- Performance marketing teams
- Creative strategists and designers
- Ad operations specialists
- Digital agencies
- In-house brand marketing teams
- Enterprise organizations with multiple teams

### Trust & Compliance Messaging

The marketing site displays SOC 2, GDPR, and ISO compliance badges as trust signals for enterprise buyers.

---

## 3. Technology Stack

### Frontend

| Technology | Version | Role |
|------------|---------|------|
| Next.js | 16.2.3 | App Router, SSR/SSG, API routes |
| React | 19.2.4 | UI components |
| TypeScript | 5.9.x | Type-safe API, validation, types |
| Tailwind CSS | 4.2.x | Styling and responsive design |
| Framer Motion | 12.x | Page transitions, card animations |
| GSAP | 3.15.x | Marketing page motion |
| Lucide React | 1.8.x | Icon system |
| Recharts | 3.8.x | Dashboard and admin charts |

### Backend & Services

| Technology | Role |
|------------|------|
| Next.js API Routes | Serverless REST endpoints |
| OpenAI API | Creative extraction, strategic analysis, vision element detection |
| Supabase | Auth, PostgreSQL, Row Level Security, file storage |
| Sharp | Server-side image processing |
| IndexedDB | Client-side creative blob storage |
| Socket.IO + Redis | Optional realtime presence (admin) |

### Export & Media Libraries

| Library | Role |
|---------|------|
| pptxgenjs | PPTX strategic report export |
| html2canvas | Preview PNG download from Preview Studio |
| jspdf | PDF report generation from analysis |

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                             │
│  Marketing │ User Dashboard │ Preview Tool │ Communications │ Admin │
└────────────┬──────────────────────────────┬─────────────────────────┘
             │                              │
             ▼                              ▼
┌────────────────────────────┐   ┌────────────────────────────────────┐
│   Next.js App Router       │   │   Client Storage                    │
│   Pages + API Routes       │   │   localStorage, sessionStorage,     │
└────────────┬───────────────┘   │   IndexedDB (creative blobs)        │
             │                   └────────────────────────────────────┘
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API Layer (app/api/)                          │
│  analyze-creative │ validate │ url-validation │ preview-engine     │
│  creatives │ session │ activity │ admin/v1 │ organization/v1       │
│  communications │ google/meta/programmatic-creative-analysis         │
└────────────┬──────────────────────────────┬─────────────────────────┘
             │                              │
             ▼                              ▼
┌────────────────────────────┐   ┌────────────────────────────────────┐
│   OpenAI API (GPT-4o)      │   │   Supabase                          │
│   Vision + text analysis   │   │   Auth, PostgreSQL + RLS, Storage   │
└────────────────────────────┘   └────────────────────────────────────┘
```

### Analysis Pipeline

1. **Upload** — Read pixel dimensions from file headers (PNG/JPEG/GIF/WebP)
2. **Validate** — Match against platform size matrix; score inventory, IAB, DSP, auction readiness
3. **Analyze** — OpenAI vision extraction + deterministic rule layers → strategic JSON
4. **Preview** — Template-based placement previews + AI element detection for safe zones
5. **Export** — Aggregate results into PPTX deck or PDF report

---

## 5. Complete Site Map — Every Page

### Public / Marketing Pages

| Route | Page Name | Description |
|-------|-----------|-------------|
| `/` | Home / Landing | Hero, live animated cards, pipeline engine, feature grid, workflow modules, partner badges, CTAs |
| `/solutions` | Solutions | Tabbed content: Use Cases, Teams, Industry verticals |
| `/about` | About | Company values, stats, platform pillars, origin timeline |
| `/product` | Product | Extended marketing: Prism (performance), Adroom (creation), testimonials, blog teasers |
| `/demo` | Demo Walkthrough | Product video player, 4-step explanation, CTAs to interactive demo or sign-in |
| `/login` | Login / Register | Email/password auth, role selection on register |
| `/login?mode=register` | Registration | Username, email, password, role (Brand Owner / Servicing Team) |
| `/preview-tool` | Preview Tool (Gated) | Full 4-step Creative Studio with guest demo limits |
| `/preview-tool?demo=1&step=1` | Guest Demo Entry | One free session per browser |
| `/preview-tool?step=1` | Fresh Campaign | Always starts at Step 1 from dashboard links |
| `/preview` | Preview Tool (Direct) | Same tool without demo gate; "Live Preview" nav entry |

### Authenticated Application Pages

| Route | Page Name | Description |
|-------|-----------|-------------|
| `/dashboard` | User Dashboard | Personal workspace stats, quick actions, activity analytics |
| `/dashboard/communications` | Communications | Real-time chat + creative review workflow |
| `/settings` | Account Settings | Profile (read-only), notifications placeholder, security info |
| `/downloads` | Export History | Placeholder for future export history listing |

### Super Admin Console (`/dashboard/admin/*`)

Requires platform admin role (`admin` or `super_admin` in profiles).

| Route | Page Name | Description |
|-------|-----------|-------------|
| `/dashboard/admin` | Platform Overview | Users, online count, DAU/MAU, retention, session metrics, charts |
| `/dashboard/admin/organizations` | Organizations | Create and list organizations (create requires super_admin) |
| `/dashboard/admin/users` | User Management | Paginated user list with search and status badges |
| `/dashboard/admin/users/[id]` | User Detail | Profile, suspend/ban, reset password, permissions |
| `/dashboard/admin/analytics` | Platform Analytics | DAU/WAU/MAU, retention, churn, session charts |
| `/dashboard/admin/activity` | Activity Logs | Platform-wide user activity with search/filter |
| `/dashboard/admin/permissions` | Permissions | Role hierarchy and feature access matrix |
| `/dashboard/admin/audit` | Audit Trail | Immutable admin action log |
| `/dashboard/admin/health` | System Health | Database, Redis, server memory checks |
| `/dashboard/admin/notifications` | Notifications | Admin notification center (placeholder) |
| `/dashboard/admin/settings` | Admin Settings | Environment variable status display |

### Organization Admin Console (`/dashboard/organization/*`)

Requires org admin role (`owner` or `org_admin` in organization_members).

| Route | Page Name | Description |
|-------|-----------|-------------|
| `/dashboard/organization` | Org Overview | Teams, members, analyses, previews, downloads, recent activity |
| `/dashboard/organization/teams` | Teams | Create and list teams within the organization |
| `/dashboard/organization/users` | Members | Member list with roles and team assignment |
| `/dashboard/organization/activity` | Org Activity | Organization-scoped activity feed |

### Sidebar Links Without Pages (Planned)

| Link | Status |
|------|--------|
| `/projects` | Not implemented — linked in sidebar only |
| `/intelligence` | Not implemented — linked in sidebar only |

---

## 6. Marketing Website

### Navigation (`app/lib/siteNavigation.ts`)

**Header links:** Solutions, About  
**CTAs:** Get a Demo → `/preview-tool?demo=1&step=1`; Watch Demo → `/demo`; Sign In → `/login`

**Footer columns:** Products, Solutions, Resources, Company

### Home Page (`/`)

**Positioning:** Creative intelligence platform for analysis, validation, preview, and reporting.

**Sections:**
- Hero with rotating headline and animated `HeroLiveCards` component
- `PipelineCoreEngine` — hub-and-spoke visualization of 7 workflow modules
- Feature grid: AI creative intelligence, cross-platform compliance, preview studio
- Workflow modules: Upload & Validate → Strategic Analysis → Contextual Preview → Export & Report
- Audience insights for agencies, brands, and teams
- Trust badges (SOC 2, GDPR, ISO)
- CTAs to sign in and start demo

### Solutions Page (`/solutions`)

**Tabs:** Use Cases (`#use-case`), Teams (`#team`), Industry (`#industry`)

| Section | Content |
|---------|---------|
| Use Cases | Pre-launch validation, creative QA & approval, multi-platform scaling, strategic reporting |
| Teams | Performance marketing, creative/design, agencies, brand/in-house |
| Industries | Retail, healthcare/pharma, financial services, media/entertainment |

### About Page (`/about`)

- Values: Clarity over chaos, preview in context, built for scale
- Stats: 10 analysis layers, 3 platforms, 4-step workflow, unlimited teams per org
- Pillars: Preview Studio, Validation Engine, AI Orchestrator, Organization Platform
- Timeline: Problem → insight → platform → multi-tenant today

### Product Page (`/product`)

Extended marketing not in main nav:
- Platform overview (`#overview`)
- Ad Performance / Prism (`#prism`)
- Ad Creation / Adroom (`#adroom`)
- Testimonials carousel, blog cards, DSP logo ticker
- Final CTA to preview tool

### Demo Page (`/demo`)

- Embedded product walkthrough video (`/video.mp4`)
- Four demo talking points explaining the workflow
- CTAs to interactive demo or sign-in for unlimited access

---

## 7. Authentication & User Roles

### Login Page (`/login`)

**Sign In:**
- Email and password via Supabase `signInWithPassword`
- Post-auth redirect to `/dashboard`
- Logs `user_login` activity event
- Google OAuth button rendered (placeholder — no handler currently)

**Registration (`?mode=register`):**
- Fields: username, email, password, confirm password
- Role selection stored in `profiles` and auth metadata:

| Role ID | Label | Purpose |
|---------|-------|---------|
| `usa_client` | Brand Owner | Creates conversations, assigns creatives for review |
| `end_client` | Servicing Team | Reviews and approves assigned creatives |

**Password Reset:**
- "Forgot password?" links to `/login?reset=1` — reset UI not yet implemented for users
- Super admins can trigger password reset from user detail page

### Role Systems (Three Layers)

| Layer | Roles | Detection |
|-------|-------|-----------|
| Communications | `admin`, `usa_client`, `end_client` | `profiles.role` |
| Platform Admin | `super_admin`, `admin`, `moderator`, `support` | `profiles.admin_role` + `AdminAuthContext` |
| Organization | `owner`, `org_admin`, `team_lead`, `member` | `organization_members.member_role` |

### Session Protection

- Dashboard layout requires Supabase session; redirects to `/login` if unauthenticated
- Admin routes enforce staff role with denial screens
- Org routes enforce org admin membership

---

## 8. Preview Tool — Complete Workflow

**Main component:** `app/components/PreviewTool.jsx` (~3,000 lines)  
**Entry points:** `/preview-tool` (gated) and `/preview` (direct)  
**URL state:** `?step=1|2|3|4`, optional `?demo=1`

### Step Overview

| Step | Label | Primary Function |
|------|-------|------------------|
| 1 | Setup | Select platform, goal, vertical, campaign name |
| 2 | Upload | Upload creatives, validate, compress, fix issues |
| 3 | Analysis | Run AI strategic analyzer on valid creatives |
| 4 | Preview Studio | Placement previews, safe zones, PPTX export |

### State Persistence

| Data | Storage |
|------|---------|
| Campaign config | localStorage (platform, goal, vertical, audience, URL) |
| Creatives metadata | localStorage via `workflowStorage.js` |
| Creative binary files | IndexedDB via `creativeAssetStore.js` |
| Analysis session | Supabase `analysis_sessions` + localStorage session ID |
| Authenticated saves | Supabase `creatives`, `analyzer_results`, `activity_logs` |

### Navigation Rules

- Dashboard links always open `?step=1` for fresh campaign setup
- Step 1 Back (logged in) → `/dashboard`; guests → landing page `/`
- "Start New Analysis" clears all config and creatives
- Progress bar animates between steps

---

### Step 1: Campaign Setup

**Fields:**

| Field | Options |
|-------|---------|
| Platform | Google Ads, Meta Ads, Programmatic Ads |
| Campaign Goal | Platform-specific objectives (Awareness, Traffic, Conversion, Leads, etc.) |
| Industry Vertical | 17 verticals (Healthcare, Technology, E-commerce, Gaming, etc.) |
| Campaign Name | Optional free text |
| Audience Stage | Cold / Warm / Hot (backend support; defaults to cold) |

**Requirements to advance:** Platform + goal + vertical selected

**Summary cards** display current selections before proceeding.

---

### Step 2: Upload & Validation

**Upload flow:**
1. Drag-and-drop or file picker for JPG, PNG, GIF, WebP
2. `readImageDimensionsFromBlob()` reads true pixel dimensions
3. `validateCreativeAsset()` runs platform size matrix matching
4. Creatives stored in IndexedDB; metadata in localStorage
5. Authenticated users: `saveCreative()` persists to Supabase

**Per-creative validation metrics:**

| Metric | Description |
|--------|-------------|
| Size | Detected dimensions (e.g., 300×250) |
| Placement Type | Display, native, mobile, etc. |
| Device Classification | Desktop, mobile, tablet, multi |
| IAB Compatibility | Standard IAB banner compatibility |
| DSP Compatibility | Count of supported DSPs (0–7) |
| Inventory Availability | Premium, standard, limited, unsupported |
| Auction Readiness | Score 0–100 with band |
| Premium Placement Potential | Eligibility for premium packages |
| Status | PASS, WARNING, or CRITICAL |

**Step 2 features:**

| Feature | Description |
|---------|-------------|
| Platform intelligence matrix | Supported size groups per platform |
| Valid vs Critical lists | Creatives split by validation severity |
| Per-creative edit | `EditCreativeModal` for crop/resize |
| Compression | Per-creative or bulk target KB compression |
| Auto-fix | Convert formats, compress to target size |
| URL validation | Landing page health + AI alignment check |
| Campaign readiness report | Rule-based checks via `/api/validate` |
| Remove creative | Deletes from IndexedDB and Supabase record |

**Requirements to advance:** At least one uploaded creative

---

### Step 3: Strategic Analyzer

**Trigger:** Manual "Start Analysis" button for valid creatives

**API:** Platform-specific analysis via `/api/analyze-creative` (primary orchestrator)

**UI tabs:**
- **Overview** — Campaign health, briefing, technical QA, URL alignment, risk scoring (`AnalyzerOverview`)
- **Creative Analysis** — Per-creative strategic breakdown (`AnalyzerCreativeSection`)

**Actions:**
- Export PDF report from analysis panel
- Navigate to Preview Studio when complete

**Persistence:** Saves to `analyzer_results` and tracks `analyzer_usage` activity for authenticated users

---

### Step 4: Preview Studio

**Component:** `app/components/PreviewStudio/index.jsx`

**Google Ads (8 placements):** Search, Display, YouTube, App, Discover, Gmail, Maps, Shopping

**Meta Ads (10 placements):** Facebook Feed/Stories/Reels, Instagram Feed/Stories/Explore, Messenger, Audience Network, Threads

**Programmatic (8 templates):** Healthcare, Technology, Food, E-commerce, Gaming, News, OTT, Blogs

**Google/Meta additional tabs:**
- Safe Zone Overlay — AI element detection + visualization
- Crop Simulation — Center-crop preview across standard formats

**Step 4 actions:**
- Export PPTX — Strategic report deck
- Download PNG — Per-placement preview capture
- Start New Analysis — Reset entire workflow
- Back to Step 3

---

## 9. Campaign Readiness & Validation

### Architecture

```
app/types/validation.ts           — TypeScript types
app/constants/googleSpecs.ts      — Google Ads requirements
app/constants/metaSpecs.ts        — Meta Ads requirements
app/constants/programmaticSpecs.ts — Programmatic rules
app/lib/validators/reportBuilder.ts — Aggregates module results
app/lib/url/healthCheck.ts        — Landing page HTTP analysis
app/lib/url/utmValidator.ts       — UTM parameter rules
app/lib/image/duplicateDetector.ts — Perceptual duplicate detection
app/api/validate/route.ts         — POST endpoint
app/api/url-validation/route.ts   — Landing page + creative alignment
```

### Readiness Score

- Starts at 100
- −15 per error, −5 per warning
- Levels: Ready (≥85), Review Needed (60–84), Not Ready (<60)

### Validation Layers

1. **Client** (`creativeValidation.js`) — Dimension matching, mime types, file weight, inventory tier
2. **Server `/api/validate`** — Platform validators, duplicates, URL health, UTM, alignment
3. **Server `/api/url-validation`** — Deeper URL + creative visual alignment (OpenAI when configured)

---

## 10. Strategic Analyzer (Step 3)

### Endpoint

`POST /api/analyze-creative` — Accepts multipart form: image + goal, platform, vertical, audience_stage

### Analysis Layers

| Layer | Function |
|-------|----------|
| 1. Extraction | OpenAI vision — headline, CTA, colors, layout, emotional cues |
| 2. Signal Classification | CTA pressure, urgency, funnel stage inference |
| 3. Vertical Intelligence | Product category, advertising behavior |
| 4. Creative Type Detection | Static, carousel-like, hybrid |
| 5. Attention Analysis | First-focus path, friction points |
| 6. Goal Alignment | Detected vs selected campaign goal |
| 7. Vertical Alignment | Keyword fit + AI vertical match |
| 8. Platform Alignment | Google/Meta/Programmatic fit scoring |
| 9. Campaign Alignment | Overall aligned / partially / misaligned |
| 10. Strategic Recommendations | Prioritized HIGH/MEDIUM/LOW fixes |
| 11. Business Impact | Affected metrics, consequence modeling |
| 12. Enterprise QA | Launch readiness, compliance, inventory simulation |

### Output Fields (per creative)

- `main_strategic_problem`, `attention_analysis`, `business_consequence`
- `strategic_recommendations[]`, `expected_improvement`
- `strategic_alignment_score`, `campaign_alignment`
- `goal_alignment`, `vertical_alignment`, `business_impact`
- `adigator_analysis`, `extraction_signals`, `ai_analysis`

---

## 11. Preview Studio (Step 4)

### Safe Zone APIs

| Platform | Endpoint | Purpose |
|----------|----------|---------|
| Google | `/api/google-creative-analysis` | Vision element detection for safe zones |
| Meta | `/api/meta-creative-analysis` | Vision element detection for safe zones |
| Programmatic | `/api/programmatic-creative-analysis` | IAB banner element detection |

### Contextual Preview Engine

`POST /api/preview-engine` — Generates landing-page/environment JSON for programmatic contextual previews using analyzer output.

### Device Modes

Desktop and mobile preview modes where applicable per placement.

---

## 12. User Dashboard

**Route:** `/dashboard`  
**Layout:** Sidebar + topbar shell (admin/org routes use separate shells)

### Overview Section

| Stat Card | Source |
|-----------|--------|
| Total Creatives | Supabase `creatives` + activity upload history + analyzer results |
| Valid Creatives | Cumulative validation passes (DB + activity logs) |
| Invalid Creatives | Cumulative validation failures (DB + activity logs) |
| Platforms Used | Activity log platform usage |

*Note: Valid and invalid counts are cumulative — a creative fixed after initial failure may appear in both totals.*

### Quick Actions

| Action | Destination |
|--------|-------------|
| Open Preview Tool | `/preview-tool?step=1` |
| Resume Analysis | `/preview-tool?step=3` |
| Organization Console | `/dashboard/organization` (org admins only) |
| Super Admin Console | `/dashboard/admin` (platform admins only) |

### Activity Analytics

`UserAnalyticsCharts` component displays:
- Platform usage breakdown
- Analysis activity over time (14-day window)
- Preview studio opens, reports downloaded, analyzer runs

### Data Sources

- `fetchUserCreatives()` — Direct Supabase query
- `fetchUserDashboardAnalytics()` — Merged local + remote activity logs (up to 5,000 events)
- `fetchAnalyzerResultCreativeIds()` — Creatives with saved analysis
- `computeCreativeCountStats()` — Merges all sources for accurate totals

---

## 13. Organization Platform (Multi-Tenant)

### Data Model

```
Organization
  └── Teams (many)
  └── Members (users with roles and optional team assignment)
```

**Tables:** `organizations`, `teams`, `organization_members`

**Member roles:** `owner`, `org_admin`, `team_lead`, `member`  
**Org status:** `active`, `suspended`, `trial`

### Organization Admin Features

| Feature | Description |
|---------|-------------|
| Org dashboard | Member count, team count, activity metrics |
| Team management | Create teams, view team list |
| Member management | View members, assign roles and teams |
| Activity feed | Org-scoped user activity |

### API Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/organization/v1/membership` | Current user's org membership |
| GET | `/api/organization/v1/members` | List org members |
| PATCH | `/api/organization/v1/members/[id]` | Update role, team, status |
| GET | `/api/organization/v1/teams` | List teams |
| POST | `/api/organization/v1/teams` | Create team |
| GET | `/api/organization/v1/dashboard` | Org metrics |

### Setup

Run `supabase/migrations/20260616_organizations_teams.sql` or `supabase/RUN_ORGANIZATIONS_SETUP.sql` in Supabase SQL Editor.

Super admins create organizations via `/dashboard/admin/organizations`.

---

## 14. Super Admin Platform

### RBAC Roles

`super_admin` → `admin` → `moderator` → `support` → `user`

### Permissions

`users:read`, `users:write`, `audit:read`, `analytics:read`, `health:read`, `permissions:write`

### Admin API (`/api/admin/v1/*`)

| Endpoint | Purpose |
|----------|---------|
| GET `/dashboard` | Platform metrics |
| GET `/analytics` | Extended analytics (DAU/WAU/MAU, retention) |
| GET `/health` | DB, Redis, realtime health |
| GET `/users` | Paginated user list (CSV export available) |
| GET `/users/[id]` | User detail |
| POST `/users/[id]/actions` | Suspend, ban, reset password, update, delete |
| GET `/activity` | Cross-user activity logs |
| GET `/audit` | Admin audit trail |
| GET `/permissions` | Role definitions and feature matrix |
| GET/POST `/organizations` | List/create organizations |

### Admin Database Tables

`admin_user_sessions`, `admin_user_activity`, `admin_feature_permissions`, `admin_audit_logs`, `admin_notifications`, `admin_feature_usage`, `admin_error_logs`, `admin_role_definitions`

### Setup

Run `supabase/migrations/20260615_admin_enterprise_platform.sql`  
Grant access: `UPDATE profiles SET role = 'admin', admin_role = 'super_admin' WHERE email = '...'`

See `docs/ADMIN_PLATFORM_SETUP.md` for full setup guide.

---

## 15. Communication Platform

**Route:** `/dashboard/communications`  
**Component:** `CommunicationPlatform.jsx`

### Features

- Real-time chat via Supabase realtime + `useCommunicationRealtime`
- Direct and project conversations
- Message types: text, file, creative attachment, system events
- Creative review workflow with statuses: pending → in_review → approved / revision_requested
- Activity timeline per conversation
- In-app notifications
- User presence tracking

### Review Workflow

1. Brand Owner creates conversation and assigns creatives
2. Servicing Team receives assignment notification
3. Reviewer approves or requests revision with notes
4. Status updates tracked in `creative_reviews` table

### API Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/communications/conversations` | List/create conversations |
| GET/PATCH | `/api/communications/conversations/[id]` | Detail/update |
| GET/POST | `/api/communications/conversations/[id]/messages` | Messages |
| GET/POST | `/api/communications/conversations/[id]/activity` | Activity events |
| POST | `/api/communications/attachments/[id]/review` | Submit review |
| GET/PATCH | `/api/communications/notifications` | Notifications |
| GET/PATCH | `/api/communications/users` | User search/update |

---

## 16. Settings, Downloads & Account

### Settings (`/settings`)

| Section | Status |
|---------|--------|
| Profile | Read-only name and email from Supabase auth |
| Notifications | Placeholder — email alerts coming soon |
| Security | Password/session managed by login; link to re-authenticate |

### Downloads (`/downloads`)

Placeholder page directing users to export from Preview Tool Step 3 (PDF) or Step 4 (PPTX).

### Admin Settings (`/dashboard/admin/settings`)

Displays environment variable configuration status (Supabase URL, keys, Realtime URL).

---

## 17. Guest Demo Access

**Logic file:** `app/lib/demoAccess.js`  
**Gate component:** `PreviewToolGate.jsx`

### Rules

| User Type | Access |
|-----------|--------|
| Authenticated | Unlimited Preview Tool use; data persists to Supabase |
| Guest (first visit) | One demo session via `?demo=1&step=1` |
| Guest (demo used, tab closed) | Blocked — must sign in |

### Storage Keys

| Key | Storage | Purpose |
|-----|---------|---------|
| `adigator_guest_demo_used` | localStorage | Permanent "demo consumed" flag |
| `adigator_guest_demo_active` | sessionStorage | Active tab session flag |
| `adigator_preview_refresh` | sessionStorage | Distinguishes refresh vs navigate-away |

### Blocked User Experience

Shows sign-in CTA and link to watch demo video instead of Preview Tool.

---

## 18. Complete API Reference

### Creative Intelligence

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/analyze-creative` | Full strategic analysis orchestrator |
| POST | `/api/validate` | Campaign readiness report |
| POST | `/api/url-validation` | Landing page + creative alignment |
| POST | `/api/google-creative-analysis` | Google safe zone element detection |
| POST | `/api/meta-creative-analysis` | Meta safe zone element detection |
| POST | `/api/programmatic-creative-analysis` | Programmatic element detection |

### Preview

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/preview-engine` | Contextual preview engine |
| GET | `/api/preview-engine` | Engine metadata |
| POST | `/api/preview-templates` | Legacy template generation |

### Creatives & Sessions

| Method | Route | Purpose |
|--------|-------|---------|
| GET/POST | `/api/creatives` | List/save user creatives |
| POST | `/api/session/create` | Create analysis session |
| POST | `/api/session/update` | Update session |
| GET | `/api/session/[id]` | Fetch session |

### Activity

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/activity/log` | Log user activity |
| GET | `/api/activity/list` | List activity (admin-gated) |

*All routes above require Bearer token from Supabase session unless noted.*

---

## 19. Database Schema (Supabase)

### Core Tables

| Table | Purpose |
|-------|---------|
| `creatives` | Uploaded creative metadata (name, type, size, is_valid, validation_status, file_url) |
| `analyzer_results` | JSON analysis per creative/platform/goal |
| `activity_logs` | User activity audit trail |
| `analysis_sessions` | Persistent analysis session state |
| `user_activity_events` | Structured activity events |

### Communication Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User roles, admin_role, status, company info |
| `conversations` | Chat threads (direct/project) |
| `conversation_participants` | Membership and read state |
| `messages` | Text, file, creative, system messages |
| `attachments` | File/creative attachments |
| `creative_reviews` | Review status and notes |
| `comm_activity_events` | Communication audit trail |
| `comm_notifications` | In-app notifications |

### Organization Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Org name, slug, status, plan, industry |
| `teams` | Teams within an organization |
| `organization_members` | User membership, role, team assignment |

### Admin Tables

| Table | Purpose |
|-------|---------|
| `admin_audit_logs` | Admin actions on users/system |
| `admin_user_sessions` | Login sessions |
| `admin_feature_permissions` | Per-user feature toggles |
| `admin_role_definitions` | RBAC role catalog |

### Storage

**Bucket:** `creative-assets`  
**Path pattern:** `{user_id}/{creative_id}/{filename}`

### Migration Files

| File | Purpose |
|------|---------|
| `20260526_adigator_core_tables_rls.sql` | Core tables + RLS |
| `20260527_communication_platform.sql` | Communications schema |
| `20260615_admin_enterprise_platform.sql` | Admin enterprise tables |
| `20260616_organizations_teams.sql` | Multi-tenant org schema |
| `RUN_PREVIEW_TOOL_TABLES.sql` | Idempotent preview tool setup |
| `RUN_ORGANIZATIONS_SETUP.sql` | Org setup helper |
| `FIX_DATABASE.sql` | Schema repair script |

---

## 20. Data Services & Analytics

### `supabaseDataService.js`

| Function | Purpose |
|----------|---------|
| `saveCreative()` | Upload blob to storage + POST `/api/creatives` |
| `saveAnalyzerResult()` | Insert analyzer_results row |
| `trackUserActivity()` | POST `/api/activity/log` with localStorage fallback |
| `trackValidationOutcome()` | Deduped validation pass/fail events |
| `fetchUserCreatives()` | Query user's creatives from Supabase |
| `deleteCreativeRecord()` | Delete creative row |

### Activity Event Types

`page_visit`, `upload`, `validation_outcome`, `analyzer_usage`, `navigation`, `download`, `generate_action`, `platform_selection`, `button_click`, `user_login`

### Dashboard Analytics (`userDashboardAnalytics.js`)

Merges local + remote activity logs to compute:
- Analysis by day (14-day chart)
- Platform usage counts
- Preview studio opens, reports downloaded, analyzer runs
- Creative validity sets from upload and validation_outcome events

---

## 21. Export & Reporting

### PPTX Export

- **Trigger:** Step 4 "Export PPTX" button
- **File:** `app/lib/exportPptx.js`
- **Library:** pptxgenjs
- **Content:** Campaign summary, per-creative analysis, alignment scores, recommendations
- **Filename:** `Adigator_Advertising_Intelligence_{N}Creatives.pptx`

### PDF Export

- **Trigger:** Step 3 analysis panel download
- **Library:** jspdf
- **Content:** Analysis summary and per-creative findings

### PNG Export

- **Trigger:** Preview Studio download button per placement
- **Library:** html2canvas
- **Content:** Rendered placement template capture

---

## 22. Supported Platforms, Goals & Verticals

### Platforms

| ID | Name | Placements | Safe Zone |
|----|------|------------|-----------|
| `google_ads` | Google Ads | 8 | Yes |
| `meta_ads` | Meta Ads | 10 | Yes |
| `programmatic` | Programmatic Ads | 8 | No |

### Campaign Goals

**Google & Meta:** Awareness, Traffic, Conversion, Lead Generation, Engagement, App Installs, Retargeting, Video Views

**Programmatic:** Awareness, Consideration, Conversion

### Audience Stages

Cold (first-touch), Warm (partially familiar), Hot (retargeting/high-intent)

### Industry Verticals (17)

Healthcare, Technology, Automotive, News/Media, Sports, Fitness, Business/Finance, Luxury, Travel, Hotels, Restaurants/Food, Banking/FinTech, Real Estate, Education/EdTech, Gaming, Entertainment/OTT, E-commerce/Retail, Fashion

### Standard Display Sizes (examples)

300×250, 336×280, 728×90, 970×90, 970×250, 160×600, 300×600, 320×50, 320×100, 468×60, and more per platform registry.

---

## 23. Environment Variables

```env
# Required — Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Required for admin/org APIs
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Required for AI analysis
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o                    # optional, defaults to gpt-4o

# Optional — Realtime presence
NEXT_PUBLIC_REALTIME_URL=http://localhost:4010
REDIS_URL=redis://localhost:6379
REALTIME_PORT=4010

# Optional — Email alerts (admin)
SMTP_HOST=
SMTP_USER=
ADMIN_EMAIL=
```

---

## 24. Development & Deployment

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

- **Platform:** Vercel (Next.js native)
- **Production URL:** adigator.in
- **Database:** Apply Supabase migrations via SQL Editor
- **Realtime server:** Optional separate service at `services/realtime-server/`

### Database Setup Order

1. `RUN_PREVIEW_TOOL_TABLES.sql` or core migrations
2. `RUN_COMMUNICATION_PLATFORM.sql`
3. `20260615_admin_enterprise_platform.sql`
4. `20260616_organizations_teams.sql` or `RUN_ORGANIZATIONS_SETUP.sql`

---

## 25. Project Structure

```
Adigator/
├── app/
│   ├── api/                         # 37+ API route handlers
│   ├── components/
│   │   ├── PreviewTool.jsx          # Main 4-step wizard
│   │   ├── PreviewToolGate.jsx      # Guest demo gate
│   │   ├── PreviewStudio/           # Step 4 previews
│   │   ├── communications/          # Chat/review platform
│   │   ├── admin/                   # Super admin UI shell
│   │   ├── organization/            # Org admin UI shell
│   │   ├── marketing/               # Landing page components
│   │   ├── dashboard/               # User dashboard charts
│   │   └── Validation*.tsx          # Readiness UI
│   ├── dashboard/                   # All dashboard pages
│   ├── login/                       # Auth pages
│   ├── lib/                         # Business logic, services, validators
│   ├── preview-tool/                # Gated preview tool route
│   ├── preview/                     # Direct preview tool route
│   ├── settings/                    # Account settings
│   └── styles/                      # login.css, premium-ui.css
├── docs/                            # Documentation (this file)
├── supabase/                        # SQL migrations and setup scripts
├── services/realtime-server/        # Optional Socket.IO presence server
├── public/                          # Static assets
└── package.json
```

---

## 26. Known Limitations & Roadmap Items

| Item | Status |
|------|--------|
| Google OAuth on login | UI only — no handler |
| User password reset | Link exists; reset flow not implemented |
| `/projects` page | Sidebar link only |
| `/intelligence` page | Sidebar link only |
| User notification settings | Placeholder on `/settings` |
| Admin notifications | Placeholder on admin console |
| Downloads history | Placeholder on `/downloads` |
| Audience stage UI | Backend support; no visible Step 1 selector |
| Guest demo enforcement | Client-side only (no server-side limit) |

---

## 27. Appendix: Key Design Decisions

### Hybrid AI + Rules

OpenAI handles vision extraction and strategic language; deterministic rules enforce platform size matrices and scoring consistency.

### IndexedDB for Creative Blobs

Full-resolution images exceed localStorage limits; IndexedDB enables refresh-safe re-hydration.

### Template-Based Preview Studio

26 hardcoded placement templates for speed and consistency; OpenAI used only for safe-zone detection.

### Cumulative Dashboard Metrics

Valid/invalid creative counts are cumulative across upload history to reflect total testing activity, not just current state.

### Multi-Tenant Architecture

Organizations provide team isolation within a single Supabase instance with RLS policies scoped per org membership.

### Activity Log Privacy

User aggregate reads from `activity_logs` are admin-only; users access their own events via merged local + permitted remote reads for dashboard stats.

---

## Document Information

| Item | Value |
|------|-------|
| File | `docs/ADIGATOR_COMPLETE_WEBSITE_DOCUMENTATION.md` |
| Companion docs | `docs/ADIGATOR_PLATFORM_DOCUMENTATION.md`, `docs/ADMIN_PLATFORM_SETUP.md` |
| Agent rules | `AGENTS.md` |
| Schema reference | `supabase/migrations/` |

*This document covers every page, feature, tool, API endpoint, database table, workflow, and role system in the Adigator platform as of June 2026.*

---

**© Adigator — Creative Intelligence Platform**
