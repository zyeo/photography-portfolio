# Implementation Plan — Photography Journal & Portfolio

## Product summary
Build a poetic, minimal photography website for Zach Yeo at `photos.zachyeo.com` with:
- immersive homepage
- curated Selected gallery
- strict one-photo-per-day Journal
- Collections for film, projects, and themes
- lightweight custom admin for daily posting and archive management

The public site should feel fast, image-led, and authored. The admin should make daily publishing easy enough to sustain.

## Product principles
- Metadata is welcome when available, editable when wrong, optional when absent.
- Expressive at the threshold, restrained everywhere else.
- Controls exist, but they should arrive quietly.
- The public site should feel artistic; the admin should feel humane.

## Chosen stack
- Next.js
- Supabase Postgres, Auth, and Storage
- Vercel
- Domain target: `photos.zachyeo.com`

## Milestone 1 — Launchable v1
A complete first release with public pages, admin workflows, image pipeline, auth, deployment readiness, and seeded content support.

### Phase 1 — Project foundation and design system
Goal: establish the application shell and visual language before feature work expands.

Deliverables:
- Next.js app scaffold
- TypeScript, linting, formatting, environment setup
- design tokens for paper-white / charcoal palette
- typography system: signature display, literary serif, utility sans
- responsive layout primitives, header, nav, footer/icon treatment
- homepage shell with hero rotation placeholder and dark overlay behavior
- baseline accessibility and performance conventions

Acceptance:
- app runs locally
- public shell is responsive
- visual foundation reflects the approved poetic/minimal direction

### Phase 2 — Data, auth, storage, and image ingestion
Goal: create the system spine that all content features depend on.

Deliverables:
- Supabase schema for photos, journal_entries, collections, photo_collections
- row-level security / permissions model
- Supabase Auth integration for private admin
- storage bucket setup for private originals and public image delivery
- upload pipeline with EXIF extraction
- nullable metadata handling
- hero focal point / mobile crop data support
- seeded dev data and local setup docs

Acceptance:
- admin user can authenticate
- uploads create photo records
- EXIF auto-fills where available and missing metadata does not block saves
- originals remain private while public renditions can be served efficiently

### Phase 3 — Admin workflows
Goal: make the backstage genuinely usable for daily life and archive curation.

Deliverables:
- admin dashboard
- Daily Entry flow
- Archive Upload flow with optional batch metadata and review grid
- Library search/filter/edit experience
- Selected curation workspace with drag order and normal/large sizing
- Collections management
- Homepage hero management with pin/unpin and crop preview

Acceptance:
- a daily journal entry can be published end to end in a few steps
- a mixed archive batch can be uploaded without mandatory cleanup
- selected gallery can be curated visually
- collections can be created and populated without duplicate photo records

### Phase 4 — Public experience
Goal: build the visitor-facing site around the content system.

Deliverables:
- homepage with rotating approved heroes and optional pinned hero
- `/selected` editorial gallery with lightbox and minimal metadata
- `/journal` reverse-chronological index with featured latest entry and archive controls
- `/journal/[yyyy-mm-dd]` image-first entry pages
- `/collections` landing page
- `/collections/[slug]` shared collection template
- `/about` page with quiet availability line
- mobile-first responsive behavior across all pages

Acceptance:
- all approved routes work with real content
- selected and collections remain gallery-like rather than catalog-like
- journal browsing works well on desktop and mobile
- homepage text remains legible over approved hero imagery

### Phase 5 — Polish, QA, and launch readiness
Goal: make the site trustworthy enough to publish.

Deliverables:
- image loading optimization and responsive sizing verification
- SEO metadata, social sharing basics, sitemap, robots
- empty states, error states, and loading states
- accessibility pass
- browser/device QA
- Vercel deployment config
- custom domain checklist for `photos.zachyeo.com`
- backup/export guidance
- final README and operator docs

Acceptance:
- site is fast, stable, and accessible
- admin workflows survive realistic usage
- deployment is reproducible
- launch checklist is complete

## Future milestone candidates
- Places browsing when the archive earns it
- dedicated photo URLs from lightboxes
- richer project / essay templates
- inquiry / service pages
- booking workflow when services become concrete

## Git and delivery discipline
- `main` stays releasable
- feature branches use `codex/` prefix unless deliberately changed
- one coherent commit per meaningful change; no catch-all commits
- commit style: imperative, specific, scoped
  - `Create Supabase photo schema`
  - `Build daily entry publishing flow`
  - `Add selected gallery lightbox`
- each GSD task should land as an atomic commit where possible
- phase work should be reviewed before merge
- use GitHub as source of truth for progress, with clean commit history and PRs when useful

## Suggested GSD workflow
1. Install GSD for Codex if needed.
2. Initialize from the planning docs:
   - `$gsd-new-project --auto @IMPLEMENTATION_PLAN.md`
3. Review generated project artifacts against `CREATIVE_BRIEF.md`.
4. For each phase:
   - `$gsd-discuss-phase N`
   - `$gsd-plan-phase N`
   - `$gsd-execute-phase N`
   - `$gsd-verify-work N`
5. Ship each verified phase through git with a clean history.

## Source planning documents
- `CREATIVE_BRIEF.md`
- `PROJECT_BRIEF.md`
