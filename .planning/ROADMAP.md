# Roadmap: Photography Journal & Portfolio

## Overview

Build the site from its foundation outward: first establish the visual language and application shell, then add the content spine, the humane admin workflows, the public browsing experience, and finally the launch hardening needed to trust the system in daily use.

## Phases

- [ ] **Phase 1: Project foundation and design system** - Establish the Next.js shell and approved visual language.
- [ ] **Phase 2: Data, auth, storage, and image ingestion** - Build the content spine and secure upload path.
- [ ] **Phase 3: Admin workflows** - Make daily publishing and curation genuinely usable.
- [ ] **Phase 4: Public experience** - Deliver the visitor-facing routes and browsing flows.
- [ ] **Phase 5: Polish, QA, and launch readiness** - Harden the product for publication.

## Phase Details

### Phase 1: Project foundation and design system
**Goal**: Establish the application shell and visual language before feature work expands.
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03
**Success Criteria** (what must be TRUE):
  1. App runs locally with a responsive public shell.
  2. Palette, typography, spacing, and chrome reflect the poetic/minimal direction.
  3. Homepage hero shell demonstrates contrast-safe overlay behavior.
**Plans**: 3 plans

Plans:
- [ ] 01-01: Scaffold the Next.js application and developer tooling.
- [ ] 01-02: Build design tokens, typography, and responsive layout primitives.
- [ ] 01-03: Assemble the public shell and homepage hero placeholder.

### Phase 2: Data, auth, storage, and image ingestion
**Goal**: Create the system spine that all content features depend on.
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, ADMIN-01
**Success Criteria** (what must be TRUE):
  1. Admin can authenticate privately.
  2. Uploads create photo records with nullable EXIF-driven metadata.
  3. Originals remain private while public image delivery is supported.
**Plans**: TBD

### Phase 3: Admin workflows
**Goal**: Make the backstage usable for daily life and archive curation.
**Depends on**: Phase 2
**Requirements**: ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05
**Success Criteria** (what must be TRUE):
  1. Daily journal entry can be published in a few steps.
  2. Mixed archive batches can be uploaded without mandatory cleanup.
  3. Selected work, collections, and homepage heroes can be curated visually.
**Plans**: TBD

### Phase 4: Public experience
**Goal**: Build the visitor-facing site around the content system.
**Depends on**: Phase 3
**Requirements**: PUBLIC-01, PUBLIC-02, PUBLIC-03, PUBLIC-04, PUBLIC-05
**Success Criteria** (what must be TRUE):
  1. All approved public routes work with real content.
  2. Gallery experiences remain editorial rather than catalog-like.
  3. Journal browsing works gracefully across desktop and mobile.
**Plans**: TBD

### Phase 5: Polish, QA, and launch readiness
**Goal**: Make the site trustworthy enough to publish.
**Depends on**: Phase 4
**Requirements**: LAUNCH-01, LAUNCH-02, LAUNCH-03
**Success Criteria** (what must be TRUE):
  1. Site is fast, stable, accessible, and SEO-ready.
  2. Admin workflows survive realistic usage.
  3. Deployment and operator guidance are reproducible.
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project foundation and design system | 0/3 | In progress | - |
| 2. Data, auth, storage, and image ingestion | 0/TBD | Not started | - |
| 3. Admin workflows | 0/TBD | Not started | - |
| 4. Public experience | 0/TBD | Not started | - |
| 5. Polish, QA, and launch readiness | 0/TBD | Not started | - |
