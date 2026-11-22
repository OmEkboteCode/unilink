# UniLink — Complete Recreation Prompts, Architecture & Build Blueprint

Use this file to recreate an identical version of **UniLink** (*"Lost Things Found. Unused Things Reimagined. Students Connected."*) from scratch in any AI coding environment or manually with a team, plus Phase 2 expansion prompts.

---

## Table of Contents

1. [Master One-Shot Prompt (Copy & Paste)](#1-master-one-shot-prompt-copy--paste)
2. [Step-by-Step Phased Prompts (6 Prompts)](#2-step-by-step-phased-prompts-6-prompts)
3. [Exact Visual Design System & Brand Tokens](#3-exact-visual-design-system--brand-tokens)
4. [System Architecture, File Map & API Contract](#4-system-architecture-file-map--api-contract)
5. [Firestore Schema & Security Rules Specification](#5-firestore-schema--security-rules-specification)
6. [Complete 17-Image Generation Prompt Pack](#6-complete-17-image-generation-prompt-pack)
7. [Seed Data Inventory (20 Realistic Campus Records)](#7-seed-data-inventory-20-realistic-campus-records)
8. [Setup, Testing & Verification Checklist](#8-setup-testing--verification-checklist)
9. [Bonus: Phase 2 Feature Prompts (Take UniLink Further)](#9-bonus-phase-2-feature-prompts-take-unilink-further)

---

## 1. Master One-Shot Prompt (Copy & Paste)

Copy everything inside the block below into a new project prompt to build an identical full-stack UniLink web application in one pass.

```markdown
Build a polished, full-stack, mobile-first campus web application called **UniLink** with the tagline:
**"Lost Things Found. Unused Things Reimagined. Students Connected."**

Do NOT include "AI" in the product name, titles, or UI copy.

### 1. TECH STACK & RUNTIME ARCHITECTURE
- Frontend: React 19, TypeScript, Tailwind CSS v4 (`@import "tailwindcss";`), `lucide-react`, Vite.
- Backend: Node.js + Express (`server.ts`, port 3000) serving Vite middleware in dev (`tsx server.ts`) and static `dist/` in production (`node server.ts`).
- Persistence & Auth: Firebase Authentication (Google Sign-In + Email/Password with email verification) and Cloud Firestore. Do NOT use `localStorage` as a database substitute.
- Image Uploads: Client-side canvas compression (max 1080px, JPEG 0.82 quality) uploading to Firebase Storage first (`unilink/{folder}/{uid}_{timestamp}.jpg`, 4.5s timeout), automatically falling back to `POST /api/upload` (2 MB max, JPEG/PNG/WebP only, stored in `uploads/` and served at `/uploads` with `X-Content-Type-Options: nosniff`).
- Never use `window.alert`, `window.confirm`, or `window.open`. Use inline alerts and 2-step inline delete confirmations.

### 2. VISUAL IDENTITY & UI/UX CONSTITUTION
- Color System (60-30-10 discipline):
  - Canvas: `#F6F8FB`, Cards: `#FFFFFF` with `1px` hairline borders (`border-slate-200`), Body ink: `#0F172A`.
  - Primary Brand Navy: `#0F1A38` (deep `#091128`, hover `#17254D`).
  - FIND accent (Teal): `#0D9488` / `#14B8A6`.
  - REUSE accent (Orange/Amber): `#EA580C` / `#F59E0B`.
  - CONNECT / Events accent (Coral Rose): `#E11D48` / `#F45B7A`.
- Typography (Google Fonts in `index.html`, configured in `@theme` in `src/index.css`):
  - Display / Headings: `Plus Jakarta Sans`
  - Body: `DM Sans`
  - Dates / Codes / Monospace: `JetBrains Mono` with `tabular-nums` on all metrics, prices, and dates.
- Brand Logo (`UniLinkLogo`): Custom 28x28 rounded `#0F1A38` square SVG with 3 connected nodes (Teal `#0D9488`, Amber `#F59E0B`, Coral `#F45B7A`) joined by thin white lines, paired with `UniLink` wordmark.
- Strict Anti-Slop Rules:
  - Zero static pill enclosures around metadata (categories, dates, tags, statuses). Use clean unboxed inline text separated by `·`.
  - Interactive filter tabs use clean segmented controls (`bg-slate-100 rounded-lg p-1` with active `bg-white shadow-xs`).
  - No decorative pulsing dots, no thick left borders (`border-l-4`), no nested cards-within-cards, no fake telemetry bars or invented AI scores.
  - All nav links, buttons, and tabs stay single-line (`whitespace-nowrap shrink-0`).
  - Accessible `focus-visible` outlines (`2px solid #0D9488`) and `@media (prefers-reduced-motion: reduce)`.
  - Zero broken images: `ItemMedia` and `UserAvatar` components must use `referrerPolicy="no-referrer"`, reset error state when URL changes, and fall back gracefully to category-icon gradient tiles or user initials.
- Responsive Navigation (`AppShell`):
  - Desktop (`lg:`): Sticky 256px left dark-navy sidebar (`#0F1A38`) with Workspace nav (`Dashboard`, `Find · Lost & Found`, `Reuse · ReLife Exchange`, `Connect · Campus Events`, `Student Profile`), clickable student summary footer with `UserAvatar` + verification status + `Landing` & `Sign Out` buttons; sticky top bar with breadcrumb (`UniLink / Current Page`) and contextual single primary CTA (`Report Item`, `Create Listing`, or `Create Event`).
  - Mobile (`< lg`): Sticky compact top bar + fixed bottom 5-tab thumb navigation bar (`h-16`, <= 15% mobile viewport height).

### 3. PRODUCT MODULES

#### A. Landing Page (`LandingPage.tsx`)
- 3-Zone Top Bar: `UniLink` logo | 4 single-line links (`Ecosystem`, `Campus Preview`, `Verification`, `Privacy`) | 1 CTA (`Sign In` or `Open Dashboard`).
- Dark-navy (`#0F1A38`) 2-column Hero (`items-stretch`): Tagline headline (`text-balance`), concise intro, primary teal CTA + secondary anchor button, trust strip (`Verified Gmail & campus accounts · No public phone numbers`), and full-height campus hero photograph with bottom contrast scrim.
- Three Outcomes Asymmetric Bento (`#pillars`): 2 equal cards (`01. Smart Lost & Found`, `02. ReLife Exchange`) + full-width horizontal card (`03. Campus Events & Clubs`).
- Interactive Sample Campus Preview (`#preview`): Segmented switcher (`Find: Lost & Found`, `Reuse: ReLife Exchange`, `Connect: Campus Events`) showing 4 Find cards, 4 Reuse cards, or 3 Event cards. Clicking a card when signed in deep-links directly to that item's detail modal inside the workspace; otherwise opens Auth.
- Safe Handover Protocol (`#workflow`): 4-step grid (`01. Report`, `02. Match`, `03. Verify`, `04. Reunite`) alongside dark-navy `Senior → Junior Book Chain` callout card.
- Privacy by Design section (`#trust`) + quiet footer.

#### B. Authentication & Student Profile (`AuthView.tsx`, `ProfileView.tsx`, `AuthContext.tsx`)
- Supports Google Sign-In (`gmail.com` recommended) and Email/Password registration + sign-in.
- Do NOT label email fields as "College Email Address" — use "Email Address" with placeholder `student@gmail.com`.
- Configurable server-side email domain policy via `.env` (`ALLOWED_COLLEGE_DOMAINS="gmail.com,ac.in,edu"`, `STRICT_COLLEGE_DOMAIN_ONLY="false"`). Never falsely claim college verification unless Firebase `emailVerified === true` AND domain matches an institutional allowlist domain (excluding `gmail.com`).
- Surface all client-side and Firebase auth errors visibly in an inline error banner (never swallow errors silently).
- Student Profile fields: `displayName`, private `email` (read-only), `department`, `branch`, `semester`, `photoUrl` (with upload + Remove button + `UserAvatar` fallback), `bio`.
- Profile right column: Verification Status card (Firebase Email Verification + Account Domain Policy) and dark-navy Configurable Email Domain Policy card with an interactive live "Test Email Against Allowed Policy" form calling `POST /api/auth/check-domain` with error handling.

#### C. Find: Smart Lost & Found (`FindModule.tsx`)
- Segmented filter (`All Reports`, `Lost Items`, `Found Items`), search bar with inline `×` clear button, dropdown filters for Category, dynamic Campus Locations (merging presets + custom report locations), Status (`open`, `claim_pending`, `verified`, `reunited`, `closed`), and `Show sample demo items` toggle.
- Empty state displays a `Clear Filters` button whenever filters are active alongside `Post New Report`.
- Create/Edit modal with photo upload, thumbnail preview, Replace/Remove photo controls, campus location, date/time, hidden-detail verification question, and staffed Safe Handover Desk selector.
- Detail modal (`Escape` and backdrop dismiss):
  - Displays reporter name/branch/semester and verification status WITHOUT exposing email or phone number.
  - Shows Safe Handover Desk and Hidden-Detail Verification Question.
  - Shows deterministic **Potential Matches** panel (scoring opposite-type open reports by category +40, location +30, shared keywords up to +30; threshold >= 40, top 3). Explicitly state it uses attribute matching ("AI vision & semantic matching planned for Phase 2") — do not claim real AI matching exists.
  - Owner controls: Edit Details, transition statuses (`Mark Claim Pending`, `Mark Verified`, `Mark Reunited`, `Close Report`), and inline 2-step Delete confirmation (`Delete` -> `Confirm Delete` / `Cancel`).
  - Non-owner claim form: Verification answer, preferred handover desk, message; disabled with inline prompt if user email is not verified.

#### D. Reuse: ReLife Exchange (`ReuseModule.tsx`)
- Senior → Junior Book Chain dark-navy banner with one-click `Filter Book Chain Items` toggle.
- Listing types: `Donate`, `Sell` (₹ price), `Swap` (required `swapFor`), `Borrow` (required `borrowDuration`).
- Categories: `Books & Notes`, `Calculators`, `Lab Kits`, `Electronics`, `Hostel & Gear`, `Other`. Conditions: `Like New`, `Good`, `Fair`, `Well Used`.
- Search bar with inline clear `×`, segmented listing-type filter, category/condition/availability dropdowns, demo toggle, and `Clear Filters` empty-state button.
- Cards highlight Book Chain tags (`targetBranch`, `targetSemester`, `subjectCode`) and note `(Matches your profile)` when aligned with the signed-in student's branch or semester.
- Detail modal: Owner Edit, `Mark Reserved`, `Mark Completed`, inline 2-step `Remove` confirmation. Non-owner `Request This Item` form (pickup desk + message) with email-verification guard.

#### E. Connect: Campus Events (`EventsModule.tsx`)
- Status filter (`All Events`, `Upcoming`, `Happening Now`, `Completed`), search with inline clear `×`, category filter (`Tech & Hackathons`, `Workshops & Seminars`, `Cultural & Fests`, `Clubs & Meetups`, `Sports & Wellness`, `Placement & Career`, `Other`), dynamic venue filter, demo toggle, and `Clear Filters` empty state.
- Event card has sibling action bar (never nested `<button>` inside `<button>`) with `Interested` / `Saved` toggle (`aria-pressed`) persisted to Firestore `/users/{uid}/savedEvents/{eventId}` and `Details →` button.
- Detail modal: Date/Time, Venue, Status grid, description, `Mark Interested` / `Saved · Remove` bar, organizer & host attribution, and creator controls (Edit, `Mark Happening Now`, `Mark Completed`, `Cancel Event`, inline 2-step Delete confirmation).
- Create/Edit modal with poster upload + thumbnail preview + Remove button, venue `<datalist>`, organizer, date/time.

#### F. Student Dashboard (`DashboardView.tsx`)
- Unverified email banner (when `!user.emailVerified`) with `Resend Email` and `Refresh Status` buttons (with busy spinner + inline success/error feedback).
- Dark-navy welcome banner with verification status, branch/semester, and 2x2 quick actions (`Report Lost`, `Report Found`, `Create Listing`, `Create Event`).
- 4-card summary metrics strip (`My Lost & Found`, `My Exchange Listings`, `Pending Requests`, `Live Campus Posts`) using `tabular-nums`.
- Local Upcoming Event Reminder banner: Appears automatically when user has upcoming saved events (`Today`, `Tomorrow`, `In N days`, `Happening now`), with `View Saved Events`, `Notify Me` (uses browser `Notification` API with graceful inline fallback), and dismiss button.
- Tabbed `Your Campus Activity` panel: `My Reports`, `My Listings`, `My Events`, `Saved Events` (with reminder count, `Send Local Reminder`, relative timing badges, `View →`, `Remove`), and `Requests` (incoming Accept/Decline/Mark Handover Completed + outgoing Cancel Request).
- 2-column `Recent Lost & Found` and `Recent ReLife Exchange` lists using compact `w-20 h-16` thumbnails (ensure `ItemMedia` omits `w-full` when an explicit `w-*` class is provided so thumbnails never stretch!) + 3-column `Upcoming Campus Events` grid prioritized by active status (`upcoming`/`ongoing`) and chronological date + `Explore Campus Resource Categories` shortcuts bar.

### 4. SERVER ROUTES (`server.ts`)
Implement Express routes:
- `GET /api/health`
- `GET /api/campus-config`
- `POST /api/auth/check-domain`
- `POST /api/validate/report`
- `POST /api/validate/listing`
- `POST /api/validate/event`
- `POST /api/upload`
Validate all payloads identically on client (`src/lib/validation.ts`), Express server (`server.ts`), and Cloud Firestore security rules (`firestore.rules`).

### 5. FIRESTORE COLLECTIONS & SECURITY RULES
Provision Firebase Auth + Cloud Firestore with strict deny-by-default rules for:
1. `/users/{userId}` — Owner-only `get/create/update`, `list: false`, `delete: false`.
2. `/users/{userId}/savedEvents/{eventId}` — Owner-only `get/list/create/update/delete` (verified user required for writes).
3. `/lostFoundReports/{reportId}` — Signed-in campus read; verified owner create/update/delete; locked after `reunited` or `closed`.
4. `/exchangeListings/{listingId}` — Signed-in campus read; verified owner create/update/delete; price must be `0` unless `listingType == 'sell'`; locked after `completed` or `removed`.
5. `/itemRequests/{requestId}` — Strictly scoped to `requesterId` or `ownerId`; requester cannot request own item; validates target document exists and is open/available; strict status state machine; `delete: false`.
6. `/campusEvents/{eventId}` — Signed-in campus read; verified creator create/update/delete; locked after `completed` or `cancelled`.

### 6. VISUAL ASSETS & SAMPLE DATA
Generate 17 realistic, domain-authentic photographs (1 `16:9` campus hero + 16 `4:3` item & event photos) saved under `/src/assets/images/` and wire them into `src/data/demoData.ts` with 7 Lost & Found reports, 7 ReLife Exchange listings, and 6 Campus Events (zero missing images).
```

---

## 2. Step-by-Step Phased Prompts (6 Prompts)

If you prefer building incrementally (recommended for easier review and debugging), run these 6 prompts in order.

### Prompt 1 — Core Shell, Visual System, Landing Page & Express Server
```text
Create the foundation of UniLink ("Lost Things Found. Unused Things Reimagined. Students Connected.") using React 19, TypeScript, Tailwind CSS v4, lucide-react, and an Express server (server.ts on port 3000 mounting Vite middleware in dev and serving dist/ in production).

Set up:
1. Fonts in index.html: Plus Jakarta Sans (display), DM Sans (body), JetBrains Mono (data/dates), plus synchronized page title and OpenGraph meta tags (branded "UniLink", no "AI").
2. Theme tokens in src/index.css: Navy (#0F1A38, #091128, #17254D), Teal Find (#0D9488, #14B8A6), Orange Reuse (#EA580C, #F59E0B), Coral Connect (#E11D48, #F45B7A), off-white canvas (#F6F8FB), tabular-nums, focus-visible ring, prefers-reduced-motion.
3. Shared UI helpers in src/components/BrandAndMedia.tsx: UniLinkLogo (3-node SVG mark + wordmark), UserAvatar (with onError fallback to initials), ItemMedia (with explicit-width detection so compact w-20 h-16 thumbnails never stretch, plus error reset on URL change and category-icon fallback), and StatusIndicator.
4. AppShell.tsx: Sticky 256px desktop dark-navy sidebar + sticky contextual top bar + compact 64px 5-tab mobile bottom thumb nav (Home, Find, Reuse, Events, Profile).
5. LandingPage.tsx: 3-zone header, dark-navy 2-column hero split, 3-outcome asymmetric bento, tabbed Sample Campus Preview (Find/Reuse/Events) with deep-link callbacks, 4-step Safe Handover Protocol + Senior-to-Junior Book Chain dark card, Privacy by Design section, and footer.
6. Express server endpoints in server.ts: /api/health, /api/campus-config, /api/auth/check-domain, /api/validate/report, /api/validate/listing, /api/validate/event, and /api/upload (base64 JPEG/PNG/WebP up to 2MB saved to uploads/ with X-Content-Type-Options: nosniff).
```

### Prompt 2 — Firebase Auth, Firestore Rules & Student Profile
```text
Integrate Firebase Authentication (Google Sign-In + Email/Password with email verification) and Cloud Firestore.

1. Create firebase-blueprint.json and deny-by-default firestore.rules covering /users/{userId}, /users/{userId}/savedEvents/{eventId}, /lostFoundReports/{reportId}, /exchangeListings/{listingId}, /itemRequests/{requestId}, and /campusEvents/{eventId}. Enforce strict PII isolation (users list=false), verified-email writes, owner-only mutations, immutable creator/createdAt fields, and terminal state locks.
2. Build src/lib/firebase.ts, src/lib/validation.ts (matching all Firestore limits and enums), src/lib/mediaUpload.ts (client-side 1080px JPEG compression -> Firebase Storage with 4.5s timeout -> /api/upload fallback), and src/context/AuthContext.tsx (using a ref for campusConfig so onAuthStateChanged only attaches once).
3. Build AuthView.tsx (Google Sign-In + Sign In/Register email tabs, "Email Address" label with student@gmail.com placeholder, inline localError + authError banner) and ProfileView.tsx (editable profile fields, UserAvatar with Change/Remove photo, Verification Status card, and live Domain Policy Tester calling /api/auth/check-domain with error handling).
4. Add ErrorBoundary.tsx wrapping the app.
```

### Prompt 3 — Find: Smart Lost & Found Module
```text
Build src/components/FindModule.tsx and its Firestore service functions in src/services/firestoreService.ts.

Include:
- Segmented Lost/Found/All filter, search input with inline clear (×) button, Category, dynamic Campus Locations, Status dropdowns, and "Show sample demo items" toggle.
- Empty state with "Clear Filters" recovery button when filters are active.
- Create/Edit Report modal with item photo upload + thumbnail preview + Replace/Remove button, campus location, date, time, hidden-detail verification question, and staffed Safe Handover Desk dropdown.
- Detail modal with keyboard Escape + backdrop close, protected reporter info (no email/phone), Safe Handover & Verification box, deterministic Potential Matches panel (attribute heuristic by category, location, keywords — clearly labeled as non-AI attribute matching), owner status workflow (Claim Pending -> Verified -> Reunited / Close) + inline 2-step Delete confirmation, and non-owner Verification Claim form (disabled with inline hint if user email is unverified).
```

### Prompt 4 — Reuse: ReLife Exchange & Book Chain Module
```text
Build src/components/ReuseModule.tsx and its Firestore service functions in src/services/firestoreService.ts.

Include:
- Dark-navy "Senior → Junior Book Chain" banner with quick toggle to filter items tagged with target branch/semester.
- Listing types: Donate, Sell (with ₹ price validation), Swap (required swapFor), Borrow (required borrowDuration).
- Search input with inline clear (×), type/category/condition/availability filters, demo toggle, and "Clear Filters" empty state.
- Profile-match highlight ("Matches your profile") when a listing's targetBranch or targetSemester matches the signed-in student.
- Create/Edit modal with Book Chain metadata (target branch, target semester, subject code), pickup desk, and photo upload with thumbnail preview + Remove.
- Detail modal with owner Edit, Mark Reserved, Mark Completed, inline 2-step Remove confirmation, and non-owner "Request This Item" form (with email-verification guard).
```

### Prompt 5 — Connect: Campus Events, Saved Events & Student Dashboard
```text
Build src/components/EventsModule.tsx, src/components/DashboardView.tsx, and wire everything together in src/App.tsx.

1. EventsModule:
   - Status segmented tabs (All, Upcoming, Happening Now, Completed), search with clear (×), category & dynamic venue filters, demo toggle, Clear Filters empty state.
   - Event cards with non-nested sibling bottom action row: "Interested" / "Saved" button (persisted to /users/{uid}/savedEvents/{eventId}) and "Details →".
   - Detail modal with Date/Time/Venue/Status bar, Save/Remove interest banner, organizer/host attribution, and creator management (Edit, Mark Happening Now, Mark Completed, Cancel Event, inline 2-step Delete confirmation).
   - Create/Edit modal with poster upload preview + Remove button and venue datalist.
2. DashboardView:
   - Unverified email alert with Resend Email and Refresh Status buttons (guarded with try/catch + inline feedback).
   - Welcome banner with 4 quick actions (Report Lost, Report Found, Create Listing, Create Event) and 4-card metrics strip (tabular-nums).
   - Automatic Local Upcoming Event Reminder banner for upcoming saved events ("Today", "Tomorrow", "In N days", "Happening now") with "Notify Me" (browser Notification API with inline fallback) and dismiss control.
   - Tabbed "Your Campus Activity" section: My Reports, My Listings, My Events, Saved Events (with Send Local Reminder & Remove), and Requests (incoming Accept/Decline/Mark Handover Completed + outgoing Cancel).
   - 2-column Recent Lost & Found and Recent ReLife Exchange lists with compact w-20 h-16 thumbnails + 3-column Upcoming Campus Events sorted by active status & date + Category Shortcuts bar.
```

### Prompt 6 — High-Fidelity Image Assets, Expanded Seed Data & QA Pass
```text
Generate 17 realistic photographs (1 16:9 university campus hero + 16 4:3 product & campus event photos) under /src/assets/images/ and populate src/data/demoData.ts with 7 Lost & Found reports, 7 ReLife Exchange listings, and 6 Campus Events so every demo card has crisp photography.

Then run a full QA audit:
- Verify tsc --noEmit, npm run build, and npx eslint firestore.rules pass cleanly.
- Verify Landing Page preview grids use balanced slices (.slice(0, 4) for Find/Reuse, .slice(0, 3) for Events) and deep-link to detail modals when signed in.
- Smoke-test all /api/* endpoints and image routes on port 3000.
```

---

## 3. Exact Visual Design System & Brand Tokens

### Color Palette (`src/index.css`)
| Role | Token | Hex | Usage |
| :--- | :--- | :--- | :--- |
| App Canvas | — | `#F6F8FB` | Main page background (60% neutral canvas) |
| Surface | — | `#FFFFFF` | Cards, modals, filter toolbars (`border-slate-200`) |
| Primary Ink | — | `#0F172A` | Body text |
| Navy Primary | `--color-navy-900` | `#0F1A38` | Sidebar, hero, headings, primary brand buttons |
| Navy Deep | `--color-navy-950` | `#091128` | Hero image scrim |
| Navy Hover | `--color-navy-800` | `#17254D` | Dark button hover states |
| Find Accent | `--color-find-600` / `500` | `#0D9488` / `#14B8A6` | Lost & Found actions, focus ring, verified badges |
| Reuse Accent | `--color-reuse-600` / `500` | `#EA580C` / `#F59E0B` | ReLife Exchange CTAs, Book Chain accent |
| Connect Accent | `--color-connect-600` / `500` | `#E11D48` / `#F45B7A` | Campus Events CTAs, Saved Events reminders |

### Typography
- **Display (`font-display`)**: `"Plus Jakarta Sans", system-ui, sans-serif` (weights 500–800)
- **Body (`font-sans`)**: `"DM Sans", system-ui, sans-serif` (weights 400–700)
- **Data/Dates (`font-mono`)**: `"JetBrains Mono", ui-monospace, monospace` (weights 400–600) + `font-variant-numeric: tabular-nums`

### Core Layout & Interaction Rules
- **3-Zone Landing Header**: `[UniLinkLogo]` — `[Ecosystem, Campus Preview, Verification, Privacy]` — `[Sign In / Open Dashboard]`
- **Zero-Pill Static Metadata**: Render categories, conditions, dates, and demo markers as unboxed text separated by `·`.
- **Single-Line Controls**: Use `whitespace-nowrap shrink-0` on nav links, segmented tabs, and buttons.
- **No Nested Interactive Elements**: On Event cards, place `Interested`/`Saved` and `Details →` in a sibling footer `<div>` below the card's main clickable `<button>`.
- **Compact Thumbnail Rule (`ItemMedia`)**: Only apply `w-full` when `className` does not contain an explicit `w-*` class (`/\bw-\S+/`), preventing Tailwind v4 utility-order conflicts on `w-20 h-16` dashboard thumbnails.

---

## 4. System Architecture, File Map & API Contract

### Project File Tree
```text
├── .env.example
├── index.html
├── package.json
├── vite.config.ts
├── server.ts                         # Express API + Vite dev middleware / prod static server
├── firebase-blueprint.json           # Canonical entity JSON schemas & collection map
├── firestore.rules                   # Deny-by-default Firestore security rules
├── firebase-applet-config.json       # Auto-provisioned Firebase client config
└── src/
    ├── main.tsx
    ├── index.css                     # Tailwind v4 + @theme tokens + focus/motion rules
    ├── App.tsx                       # Root surface router (landing | auth | workspace) + Firestore subscriptions
    ├── types/
    │   └── unilink.ts                # All domain TypeScript interfaces & union types
    ├── context/
    │   └── AuthContext.tsx           # Firebase Auth, domain check, profile sync
    ├── lib/
    │   ├── firebase.ts               # Firebase app/auth/db/storage init + structured error handler
    │   ├── validation.ts             # Shared limits, enums, validators & deterministic match scorer
    │   └── mediaUpload.ts            # Canvas JPEG compression + Firebase Storage -> /api/upload fallback
    ├── services/
    │   └── firestoreService.ts       # Real-time onSnapshot listeners & validated CRUD mutations
    ├── data/
    │   └── demoData.ts               # 7 Lost/Found reports, 7 Exchange listings, 6 Campus Events
    ├── assets/images/                # 17 generated campus, item, and event photographs
    └── components/
        ├── ErrorBoundary.tsx         # Resilient runtime error boundary
        ├── BrandAndMedia.tsx         # UniLinkLogo, UserAvatar, ItemMedia, StatusIndicator
        ├── AppShell.tsx              # Desktop sidebar + sticky top bar + mobile bottom nav
        ├── LandingPage.tsx           # Marketing & preview landing page
        ├── AuthView.tsx              # Google & Email/Password auth UI
        ├── DashboardView.tsx         # Overview, metrics, reminders, My Activity, Recent & Upcoming
        ├── FindModule.tsx            # Smart Lost & Found board, composer & detail/claim modal
        ├── ReuseModule.tsx           # ReLife Exchange board, Book Chain, composer & request modal
        ├── EventsModule.tsx          # Campus Events board, Interested toggle, composer & detail modal
        └── ProfileView.tsx           # Student profile form, verification card & domain policy tester
```

### Express Backend API Contract (`server.ts`)
| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Returns `{ status: 'ok', service: 'UniLink Server' }` |
| `GET` | `/api/campus-config` | Returns `allowedCollegeDomains`, `strictCollegeDomainOnly`, `campusDropPoints`, `firebaseStorageConfigured` |
| `POST` | `/api/auth/check-domain` | Evaluates `{ email }` against `ALLOWED_COLLEGE_DOMAINS` (supports exact domain & subdomain suffix matching) |
| `POST` | `/api/validate/report` | Validates Lost & Found report payload (`type`, `title`, `description`, `category`, `location`, `eventDate`, `eventTime`, `verificationPrompt`, `handoverLocation`, `imageUrl`) |
| `POST` | `/api/validate/listing` | Validates ReLife Exchange listing (`listingType`, `title`, `description`, `category`, `condition`, `price`, `swapFor`, `borrowDuration`, `pickupLocation`, `imageUrl`) |
| `POST` | `/api/validate/event` | Validates Campus Event (`title`, `description`, `category`, `eventDate`, `eventTime`, `location`, `organizer`, `imageUrl`) |
| `POST` | `/api/upload` | Accepts `{ dataUrl }` (`image/jpeg`, `image/png`, or `image/webp`, <= 2 MB), saves to `uploads/`, returns `{ url: '/uploads/...' }` |

---

## 5. Firestore Schema & Security Rules Specification

### Collections & Key Security Rules
| Path | Read Access | Write Access | Key Constraints |
| :--- | :--- | :--- | :--- |
| `/users/{userId}` | Owner `get` only (`list: false`) | Verified owner `create`/`update` (`delete: false`) | `uid`, `email`, `createdAt` immutable on update |
| `/users/{userId}/savedEvents/{eventId}` | Owner `get`/`list` | Verified owner `create`/`update`/`delete` | Requires parent user doc to exist; `eventId` & `userId` match path |
| `/lostFoundReports/{reportId}` | Signed-in (`visibility == 'campus'` or reporter) | Verified owner `create`/`update`/`delete` | Starts `open`; immutable `reporterId`/`type`/`createdAt`; no edits once `reunited` or `closed` |
| `/exchangeListings/{listingId}` | Signed-in (`visibility == 'campus'` or seller) | Verified owner `create`/`update`/`delete` | Starts `available`; `price == 0` unless `listingType == 'sell'`; no edits once `completed` or `removed` |
| `/itemRequests/{requestId}` | Only `requesterId` or `ownerId` | Verified `create` (cannot target own item; target doc must exist & be active); state-machine `update`; `delete: false` | Owner: `pending -> accepted/declined`, `accepted -> completed/declined`. Requester: `cancelled` |
| `/campusEvents/{eventId}` | Signed-in (`visibility == 'campus'` or creator) | Verified creator `create`/`update`/`delete` | Starts `upcoming`; immutable `creatorId`/`createdAt`; no edits once `completed` or `cancelled` |

### Shared Field Length Limits (`src/lib/validation.ts` & `firestore.rules`)
- `displayName`: 2–80 | `email`: 3–160 | `department` / `branch`: <= 80 | `semester`: <= 30 | `photoUrl` / `imageUrl`: <= 500 | `bio`: <= 300
- `reportTitle`: 3–100 | `listingTitle` / `eventTitle`: 3–120 | `organizer`: 2–100 | `description`: 10–1000
- `location` / `pickupLocation`: 2–120 | `eventDate`: `YYYY-MM-DD` (exact 10 chars) | `eventTime`: 2–20
- `verificationPrompt`: <= 200 | `handoverLocation`: <= 120 | `swapFor`: <= 120 | `borrowDuration`: <= 60 | `subjectCode`: <= 40
- `message`: 5–500 | `verificationAnswer`: <= 300 | `price`: `0` to `100000`

---

## 6. Complete 17-Image Generation Prompt Pack

Generate all images in batches with clean, cohesive editorial lighting (no text overlays, no watermarks, no neon clichés):

### Hero Banner (`16:9`)
1. `campus_hero_ecosystem` — *"Cinematic wide-angle architectural photograph of a modern engineering university campus courtyard and glass study pavilion at golden hour, warm sunlight reflecting across clean concrete walkways and greenery, students walking casually in the distance, crisp editorial photography."*

### Lost & Found + ReLife Exchange Items (`4:3`)
2. `item_campus_essentials` — *"Clean overhead studio product photo on light warm wood desk of a white wireless earbuds case, a navy leather cardholder wallet, and a brushed stainless steel university water bottle, soft natural window light."*
3. `item_scientific_calculator` — *"Clean studio product photograph of a black Casio-style scientific matrix calculator next to an open engineering graph notebook and fine-liner pen on a light oak desk, soft diffused daylight."*
4. `item_student_lanyard` — *"Minimalist product photograph of a woven navy fabric student lanyard with brushed steel clasp and clear vertical ID card sleeve resting on a clean light wood study table, soft natural daylight."*
5. `item_arduino_labkit` — *"Clean top-down studio product photograph of an organized transparent plastic electronics lab kit box containing an Arduino microcontroller, white breadboard, color-coded resistor strips, LEDs, ultrasonic sensor, and jumper wires on a matte light gray workbench."*
6. `item_flask_keys` — *"Minimalist product photo of a matte navy insulated stainless flask beside a brass keychain holding two silver dorm keys on a smooth neutral travertine study counter, soft diffused natural light."*
7. `item_laptop_charger` — *"Clean studio product photograph of a compact white 65W USB-C laptop power adapter with neatly coiled braided cable tied by a brown leather strap beside a navy grid notebook on a light oak desk."*
8. `item_headphones_case` — *"Minimalist studio product photo of matte black over-ear wireless headphones resting beside a structured charcoal woven zip carry case on a clean light slate desk, soft side daylight."*
9. `item_engineering_textbook` — *"Clean studio product photograph of a neat stack of hardcover engineering textbooks (deep teal and dark slate spines) beside a ceramic mug on a calm university library table, soft natural daylight."*
10. `item_dsa_notes` — *"Clean top-down studio photo of a hardcover computer science algorithms textbook next to an open spiral-bound notebook displaying neat binary tree and graph diagrams with a matte black pen on a light wood desk."*
11. `item_multimeter_kit` — *"Clean studio product photo of a compact yellow-and-charcoal digital multimeter with red and black test probe leads, precision wire cutters, and a small solder spool arranged neatly on a light gray lab mat."*
12. `item_drafting_kit` — *"Minimalist studio product photograph of a precision brushed-metal engineering drafting compass set inside an open slate case beside an aluminum triangular scale ruler on a clean architectural drawing board."*
13. `item_study_lamp` — *"Clean interior product photo of a sleek articulated matte white LED study desk lamp casting warm light beside a minimal ceramic pen organizer on a tidy wooden student dorm desk."*

### Campus Events (`4:3`)
14. `event_design_showcase` — *"Documentary editorial photograph of university engineering students presenting hardware prototypes and clean display boards inside a sunlit modern glass atrium during an academic design showcase, natural candid lighting."*
15. `event_study_circle` — *"Warm documentary editorial photograph of a small diverse group of college students collaborating around a sunlit central library oak table with laptops, notebooks, and architecture diagrams, natural window light."*
16. `event_hackathon_sprint` — *"Candid editorial photograph of college developers collaborating in a modern computer science lab during an evening rapid prototyping sprint, warm desk lamps, code editors on laptops, authentic university atmosphere."*
17. `event_cultural_evening` — *"Atmospheric documentary photograph of an outdoor college stone amphitheater courtyard at dusk with warm string lights, a student playing acoustic guitar on a small wooden stage, and peers seated listening on tiered steps."*

---

## 7. Seed Data Inventory (20 Realistic Campus Records)

Populate `src/data/demoData.ts` with `isDemo: true`, `visibility: 'campus'`, and realistic upcoming dates:

- **7 Lost & Found Reports (`DEMO_REPORTS`)**:
  1. Found · `White Wireless Earbuds Case & Navy Lanyard Wallet` (Central Library · Open)
  2. Lost · `Casio FX-991EX ClassWiz Scientific Calculator` (Main Block Atrium · Claim Pending)
  3. Found · `Student ID Card Holder & Woven Navy Lanyard` (Student Canteen · Verified Match)
  4. Lost · `Arduino Uno & Breadboard Sensor Kit Box` (ECE & Robotics Block · Open)
  5. Found · `Matte Navy Insulated Flask & Brass Dorm Keychain` (Central Library · Open)
  6. Lost · `65W USB-C Laptop Charger & Navy Grid Notebook` (CSE & IT Labs · Open)
  7. Found · `Matte Black Over-Ear Wireless Headphones & Zip Case` (CSE & IT Labs · Open)
- **7 ReLife Exchange Listings (`DEMO_LISTINGS`)**:
  1. Donate · `Engineering Mechanics & Structural Analysis Bundle (3 Books)` (Civil · Sem 3 · CV301/CV304)
  2. Sell (₹650) · `Casio FX-991EX ClassWiz Scientific Calculator` (CSE · Sem 1 · MAT101)
  3. Borrow (`1 Semester`) · `Complete Arduino & Breadboard Prototyping Kit` (ECE · Sem 4 · EC402/IDTL)
  4. Swap (`Sem 4 OS or DBMS Textbook`) · `Algorithms Textbook & Solved Data Structures Lab Manual` (CSE · Sem 3 · CS302)
  5. Sell (₹480) · `Compact Digital Multimeter, Probe Leads & Solder Spool` (EEE · Sem 3 · EE303)
  6. Borrow (`Until end of Sem 2 CAED exam`) · `Precision Metal Drafting Compass Set & Scale Ruler` (Mech · Sem 2 · ME104/CAED)
  7. Donate · `Articulated Matte White LED Study Desk Lamp` (All Branches · Sem 1 · Hostel Essential)
- **6 Campus Events (`DEMO_EVENTS`)**:
  1. Ongoing · `IDTL Engineering Design & Prototype Showcase` (Main Block Atrium · Tech & Hackathons)
  2. Upcoming · `Hands-On Embedded Systems & Arduino Sensor Lab` (ECE & Robotics Block · Workshops & Seminars)
  3. Upcoming · `Senior-to-Junior Placement & DSA Study Circle` (Central Library · Placement & Career)
  4. Upcoming · `Campus Open-Source & Rapid Prototyping Sprint` (CSE & IT Labs · Tech & Hackathons)
  5. Upcoming · `Courtyard Acoustic Evening & Student Club Open Mic` (Auditorium Lobby · Cultural & Fests)
  6. Upcoming · `Campus Maker Guild & Electronics Repair Café` (Mechanical Workshop · Clubs & Meetups)

---

## 8. Setup, Testing & Verification Checklist

### Environment Variables (`.env`)
```env
GEMINI_API_KEY="YOUR_SERVER_SIDE_KEY_IF_USING_PHASE_2_AI"
APP_URL="http://localhost:3000"
ALLOWED_COLLEGE_DOMAINS="gmail.com,ac.in,edu"
STRICT_COLLEGE_DOMAIN_ONLY="false"
```

### Build & Lint Commands
```bash
npm install
npm run lint                 # TypeScript check (tsc --noEmit)
npm run build                # Production Vite bundle
npx eslint firestore.rules   # Firestore security rules audit
npm run dev                  # Start Express + Vite dev server on port 3000
```

### Endpoint Smoke Tests
```bash
curl -sf http://localhost:3000/api/health
curl -sf http://localhost:3000/api/campus-config
curl -sf -X POST http://localhost:3000/api/auth/check-domain \
  -H 'Content-Type: application/json' \
  -d '{"email":"student@gmail.com"}'
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/validate/listing \
  -H 'Content-Type: application/json' \
  -d '{"listingType":"swap","title":"Book","description":"Clean textbook copy","category":"Books & Notes","condition":"Good","pickupLocation":"CSE & IT Labs","swapFor":""}'
# Expect 400 because swapFor is empty
```

---

## 9. Bonus: Phase 2 Feature Prompts (Take UniLink Further)

Copy any of these prompts into your existing UniLink project to add next-level capabilities while preserving its exact design system and Firestore security architecture.

### Upgrade A — Scoped In-App Handover Chat (Zero Phone Numbers)
```text
Add a private, scoped handover message thread inside accepted ItemRequests in UniLink.
- Store messages under /itemRequests/{requestId}/messages/{messageId} with fields: senderId, senderName, text (1–400 chars), createdAt.
- Update firebase-blueprint.json and firestore.rules so ONLY the parent request's requesterId and ownerId can read/create messages, and only while the request status is "pending" or "accepted".
- Render a clean collapsible conversation drawer inside the Dashboard "Requests" tab so both students can coordinate an exact campus desk pickup time without sharing personal phone numbers.
```

### Upgrade B — Add to Calendar (`.ics` Export) on Events & Saved Events
```text
Add one-click "Add to Calendar (.ics)" download buttons on every Campus Event detail modal and every Saved Event row in DashboardView.
- Generate a standards-compliant RFC 5545 .ics file client-side (no backend required) with event title, description, campus venue, organizer, date/time, and a 30-minute VALARM reminder.
- Keep button styling minimal and single-line matching the coral Connect palette.
```

### Upgrade C — Real Server-Side Gemini Vision & Semantic Lost-and-Found Matching
```text
Upgrade the Potential Matches panel in FindModule from attribute-only matching to optional server-side AI matching via POST /api/match/report using @google/genai (gemini-2.5-flash) on the Express server.
- Keep GEMINI_API_KEY strictly server-side in server.ts.
- Compare the target report's title, description, category, location, and optional image against open opposite-type reports, returning structured JSON { reportId, confidence, explanation }.
- Fall back gracefully to the deterministic attribute heuristic if GEMINI_API_KEY is missing or rate-limited, and clearly label whether results came from AI matching or attribute matching.
```

### Upgrade D — Campus Security Desk & Admin Verification Console
```text
Add a role-gated "Campus Desk" tab for verified campus desk staff (role: 'desk_admin' stored in a server/admin-managed custom claim or protected /roles/{uid} collection).
- Allow desk staff to log physical drop-offs at Main Block Security Desk or Central Library Help Counter, mark items "Held at Desk", and generate a 6-digit handover confirmation code that the claimant confirms at pickup.
```

### Upgrade E — Pagination, Auto-Archiving & Offline PWA Support
```text
Add cursor-based pagination ("Load more" with Firestore limit(18) + startAfter) to Find, Reuse, and Events boards, plus a "Show archived/completed" filter so older Reunited and Completed items stay out of active feeds. Add a Web App Manifest and service worker so students can install UniLink on their phone home screen.
```
