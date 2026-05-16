# Next Implementation Plan — Admin + Public Site Stabilization

## Purpose of this handoff
This document is the strict continuation brief for the next implementation pass.

It exists because the project is now past “initial build” territory. The next work is not about adding random polish; it is about making the site and admin reliable enough to use with real photographs.

The next chat should treat this file as the working plan, while still respecting:
- `CREATIVE_BRIEF.md`
- `IMPLEMENTATION_PLAN.md`
- `DESIGN_DRIFT_AUDIT.md`
- `DESIGN_DRIFT_FOLLOWUP.md`

## Current repository state
- Branch: `codex/phase-1-foundation`
- Latest completed commit at handoff: `4fe7820 Render real public photo assets`
- Untracked folder intentionally present: `audit-shots/`

### Recently completed fixes that must not regress
1. **Archive duplicate-submit protection**
   - Upload buttons/fields are disabled during archive submission.
   - Duplicate archive submissions are blocked with `content_hash`.
   - Commit: `d0b4a32 Prevent duplicate archive submissions`

2. **Selected/public mismatch clarified**
   - Admin Selected distinguishes `public` vs `draft`.
   - “Add uploaded photos to public Selected” now publishes new selected archive uploads.
   - Per-file archive failures are reported individually.
   - Commit: `8ff8ba5 Clarify archive failures and selected publishing`

3. **Real public image delivery first pass**
   - New published daily-entry photos and new public Selected archive uploads create a public delivery copy in `public-images`.
   - Public pages now prefer real image URLs when `public_image_path` exists.
   - Existing published photos can be backfilled with `npm run backfill:public-images`.
   - Supabase migration added for `service_role` grants.
   - Commit: `4fe7820 Render real public photo assets`

### Known implementation detail
The current public-image pass is intentionally only a first pass:
- it copies browser-readable source files into `public-images`
- it does **not** yet generate optimized responsive derivatives
- real-image rendering now exists, but layout/interaction bugs remain

---

# Product reality check

The public site is visually much closer to the intended design after the drift-correction work, but the system is not yet comfortable to operate daily.

The next work has two goals:
1. make the public site behave correctly with real mixed photography
2. make the admin function like a humane archive-management tool rather than a scaffold

---

# Full issue inventory

## A. Archive / batch upload issues

### A1. Multi-file archive batch upload fails
Observed by user:
- uploading **one** image works
- uploading a **group** of photos in one archive batch fails

Need to debug:
- whether the failure is client-side, route-side, storage-side, timeout/size-related, or caused by one file aborting the whole response
- whether the new public-image-copy step introduced any multi-file issue
- whether mixed file types / large files / same names / EXIF extraction affect behavior

### A2. Archive upload UX was previously click-racy
Previously observed by user:
- noticeable delay on buttons
- repeated clicks could trigger duplicate uploads

This was fixed, but it needs regression testing during the next pass.

### A3. Filename spaces were suspected
User suspected files with spaces might fail.

Current finding:
- spaces are **not** known to be the root cause
- live rows with names like `_DSF8157 copy.jpg` did upload successfully

Still test filenames containing:
- spaces
- underscores
- duplicate base names
- mixed extensions

---

## B. Selected gallery issues on the public site

### B1. The Selected lightbox behaves incorrectly
Observed by user:
- the lightbox appears to remain on the page like permanent inline content
- it does not feel like a temporary overlay that only appears after selecting a photo

Likely contributing detail:
- the current component uses native `<dialog open>` without a proper modal show/close interaction model
- current screenshot shows the “lightbox” occupying document flow instead of acting like a true overlay

### B2. The Selected gallery crops mixed aspect ratios poorly
Observed by user:
- the current grid cuts off images regardless of whether they are landscape, portrait, or square
- the site needs a better way to present a mixed photographic body of work

Design requirement:
- preserve the intended compact-airy editorial rhythm
- do **not** flatten every image into a generic crop box
- support a convincing mix of:
  - landscape
  - portrait
  - square
  - normal and large selected states

### B3. Selected/public state previously diverged
Previously observed:
- admin Selected showed photos that the public Selected gallery did not show

Root cause already found:
- admin was querying `selected=true`
- public gallery required both `selected=true` and `published=true`

This was partially fixed, but it still needs product follow-through:
- draft/public state must remain visible
- the future Library UI should make publish state manageable without confusion
- older selected draft rows still exist and should not be silently promoted without user intent

### B4. Selected images previously did not render real photos
Previously observed:
- public Selected showed placeholders instead of actual uploaded photographs

This was fixed in the first image-delivery pass, but must be regression-tested after the layout rewrite.

Additional current note:
- the seeded `rain-window.jpg` Selected record still points at `seed/public/rain-window.jpg`, which is currently not present in storage
- that means one visible Selected tile can still appear blank even though the new real-image pipeline is working
- fix by either supplying the seeded asset or replacing/removing the placeholder record during gallery stabilization

---

## C. Journal/public image issues

### C1. Uploaded Journal image previously rendered as a blank gradient
Previously observed:
- a user-uploaded daily-entry photo appeared as a blank gradient on the public Journal page

Root cause already fixed:
- no public delivery asset / `public_image_path` existed

Still required:
- regression test Journal index and single-entry page with real uploaded photos
- confirm image fallback remains graceful only when truly needed

---

## D. Library/admin issues

### D1. Library is currently too passive
User expectation:
- Library should be the master list of all photographs

Current problem:
- it is mostly a read-only filename list

Needed capabilities:
- visible thumbnail/preview for each photo
- select / deselect for inclusion in Selected gallery
- modify `hero_approved`
- expose/edit useful metadata
- show publish state clearly
- eventually support deletion / unpublishing decisions

### D2. Filenames alone are not useful enough
Observed by user:
- names like `_DSF9183.jpg` are not enough to identify a photograph

Needed:
- visual previews
- likely richer metadata affordances
- ideally quick recognition without opening a separate page for every item

### D3. No deletion / removal workflow exists
Observed by user:
- currently no way to remove images
- currently no way to remove daily entries

Required product distinction:
- **remove from Selected** is not the same as **unpublish**
- **unpublish** is not the same as **hard delete**
- deleting a Journal entry is not always the same as deleting the underlying photo

The admin must handle these as separate, explicit actions.

---

## E. Daily-entry workflow issues

### E1. Daily-entry upload feels slow
Observed by user:
- publishing a daily entry is slow enough to feel poor

Need to inspect:
- image upload time
- EXIF extraction
- public-image copy
- form/UX feedback during submission

### E2. Form remains filled after successful publish
Observed by user:
- after successful upload, all fields remain populated until page reload

Expected better behavior:
- reset to a fresh blank state after success, or
- redirect to the newly published public entry/admin confirmation view

Do not leave stale “already submitted” state sitting in the form.

---

# Strict implementation sequence

## Pass 0 — Orientation and baseline verification
Before changing code:
1. Read this document and the four planning/design docs listed above.
2. Inspect current git state and recent commits.
3. Run:
   - `npm run lint`
   - `npm run build`
4. Verify the current public/image state manually:
   - `/selected`
   - `/journal`
   - one `/journal/[date]`
5. Record any already-broken baseline behavior before making new edits.

Acceptance:
- the next agent can say exactly what is already fixed, what is still broken, and what it is about to touch

---

## Pass 1 — Stabilize archive batch uploads

### Primary goal
Uploading a realistic multi-image batch should succeed predictably, with clear per-file outcomes.

### Debugging checklist
1. Reproduce with:
   - 1 file
   - 2 files
   - 5+ files
   - filenames with spaces
   - duplicate filenames
   - a mix of landscape / portrait files
2. Capture:
   - browser network request/response
   - server logs
   - exact failed-file details returned to UI
   - whether one failure poisons the whole batch or only that file
3. Inspect:
   - `src/app/api/admin/archive/route.ts`
   - storage uploads to `originals`
   - public image writes to `public-images`
   - EXIF extraction behavior
   - payload size / request duration

### Likely implementation work
- make batch behavior explicitly resilient
- preserve successful files even if one file fails
- improve progress/error messaging if needed
- verify cleanup of partial storage writes

### Required tests
Automated where practical:
- route/helper tests for duplicate handling and per-file failure collection if a lightweight test harness is added

Manual:
- successful multi-file upload
- one-bad-file-in-batch scenario
- duplicate attempt after a successful upload
- filename with spaces
- verify no accidental duplicates are created through repeated clicking

### Suggested commit boundary
`Stabilize archive batch uploads`

---

## Pass 2 — Repair Selected interaction + layout

### Primary goal
Selected should feel like a real photographic gallery, not a scaffold.

### Workstream 2A — Lightbox interaction
Requirements:
- closed by default
- only opens after clicking an image
- acts as an actual overlay/modal
- closes cleanly
- does not permanently consume page layout
- remains keyboard/accessibility conscious

Potential implementation direction:
- use a controlled modal pattern rather than static `<dialog open>`
- if retaining `<dialog>`, use proper `showModal()`/`close()` behavior and portal/modal semantics

### Workstream 2B — Mixed-ratio gallery layout
Requirements:
- support portrait, landscape, and square photographs gracefully
- stop indiscriminate image cropping
- preserve the approved compact-airy feel
- continue respecting editorial curation states such as `normal` and `large`

Implementation should evaluate, then deliberately choose, one of:
1. aspect-ratio-aware CSS grid with stored image dimensions
2. a masonry-like layout
3. a justified-row gallery

Important:
- do not choose the fastest visually-generic answer
- choose the system that best matches the approved design language
- if new metadata is required (width/height/aspect ratio), add it deliberately and migrate/backfill carefully

### Required tests
Manual with real photos:
- mixed landscape/portrait/square selection
- normal vs large tiles
- desktop and mobile
- open/close lightbox repeatedly
- keyboard close behavior
- no overlay visible before selection

Regression:
- real public Selected photos still render after layout changes

### Suggested commit boundaries
1. `Fix selected lightbox interaction`
2. `Support mixed-ratio selected gallery layout`

---

## Pass 3 — Upgrade Library into the master archive workspace

### Primary goal
Library should become the practical control center for all uploaded photographs.

### Required capabilities
1. Thumbnail preview per photo
2. Clear visible states:
   - selected / not selected
   - public / draft
   - hero-approved / not hero-approved
3. Inline or obvious quick actions:
   - add/remove from Selected
   - toggle hero approval
   - publish/unpublish where appropriate
4. Metadata editing path:
   - location
   - medium
   - possibly EXIF corrections / title-like admin fields if supported by schema
5. Search/filter remain available and should improve rather than regress

### Important product boundary
- `Library` = master archive management
- `Selected` admin page = ordering, sizing, and gallery rhythm curation

Do not overload the Selected curator with all archive-management duties.

### Required tests
- thumbnail appears for photos with public delivery asset
- sensible fallback exists for photos without one
- toggling Selected updates the correct records and public behavior
- toggling hero approval updates homepage eligibility correctly
- filters/search still work after UI expansion

### Suggested commit boundaries
1. `Add library thumbnails and state badges`
2. `Add library quick-edit controls`
3. `Add library metadata editing flow`

---

## Pass 4 — Add safe removal / deletion flows

### Primary goal
Give the admin enough control to remove content without accidentally destroying the archive.

### Required distinction
1. Remove from Selected
2. Unpublish photo
3. Delete Journal entry
4. Hard-delete photo and associated storage assets

### Requirements
- explicit confirmation for destructive actions
- clear copy that explains what will and will not be deleted
- Journal entry deletion should not silently delete the underlying photo unless explicitly requested
- storage cleanup should match database cleanup

### Required tests
- remove from Selected keeps photo record intact
- unpublish hides public content without deleting it
- deleting a Journal entry leaves the photo when expected
- hard delete removes database record and storage files
- deleting content does not break collections/homepage references silently

### Suggested commit boundaries
1. `Add safe unpublish controls`
2. `Add journal entry removal flow`
3. `Add confirmed photo deletion flow`

---

## Pass 5 — Smooth the Daily Entry workflow

### Primary goal
Publishing a daily entry should feel calm, clear, and complete.

### Required changes
1. Better progress/disabled state while submitting
2. After success:
   - reset the form cleanly, or
   - navigate to a confirmation/result view
3. Avoid stale filled inputs after successful publication
4. Consider showing the published entry link immediately

### Debugging checklist
- measure whether the slowdown is mostly upload, processing, or UI ambiguity
- check whether user-perceived slowness can be reduced with clearer progress even before deeper optimization

### Required tests
- repeated successful submissions do not leave stale state
- duplicate submission is prevented while request is in flight
- form recovers cleanly from a failed submission
- published public Journal page renders the real image afterward

### Suggested commit boundary
`Polish daily entry publishing flow`

---

## Pass 6 — Full regression and visual QA

### Required regression surfaces
Public:
- `/`
- `/selected`
- `/journal`
- one `/journal/[date]`
- `/collections`
- one `/collections/[slug]`
- `/about`

Admin:
- `/admin/archive`
- `/admin/library`
- `/admin/selected`
- `/admin/daily-entry`
- `/admin/homepage`

### Required verification commands
- `npm run lint`
- `npm run build`

### Required manual scenarios
1. Upload one archive photo
2. Upload a multi-photo archive batch
3. Publish a daily entry
4. Add/remove a photo from Selected
5. Verify Selected public page with mixed aspect ratios
6. Open/close lightbox on desktop and mobile
7. Verify homepage still uses real hero imagery where available
8. Verify Journal and Journal entry use real images
9. Verify no regression in approved design corrections from the drift documents

### Suggested final commit boundary
`Complete admin and gallery stabilization pass`

---

# Agent workflow requirements for the next chat

## Lead-agent role
The main agent should act as:
- product manager
- architect
- integrator
- final reviewer

The main agent should:
1. keep the global plan updated
2. own the critical path
3. decide commit boundaries
4. review all delegated work before integrating
5. verify the whole system end to end

## Subagent usage
Use cheaper subagents when work can be cleanly bounded.

Good delegation examples:
- **Explorer**: inspect why multi-file batch upload fails
- **Worker**: implement only Selected lightbox changes
- **Worker**: implement only Library thumbnail card UI
- **Explorer**: map deletion impact across schema/storage

Rules:
- delegate sidecar work, not the immediate blocker on the critical path
- each coding worker must own a disjoint write set
- explicitly tell workers they are not alone in the codebase
- ask workers to edit files directly and report changed file paths
- the lead agent must review worker changes before committing

## Git discipline
- keep commits small, coherent, and named for the user-visible outcome
- no giant catch-all commit
- commit after each verified pass or meaningful sub-pass
- push after stable checkpoints
- do not include `audit-shots/` unless the user explicitly asks

## Testing discipline
For each pass:
1. inspect current behavior
2. reproduce the bug
3. implement the smallest coherent fix
4. run local verification
5. use the in-app browser for frontend behavior when appropriate
6. commit only after verification

If introducing a new architectural mechanism:
- add targeted automated coverage where practical
- document any new operator command or migration

---

# Recommended next action

Start with:

## `Pass 1 — Stabilize archive batch uploads`

Why:
- it is a correctness failure in core ingestion
- the user has now reproduced it clearly
- until uploads work reliably for groups, every later curation/admin improvement rests on unstable ground

After that, proceed directly to:

## `Pass 2 — Repair Selected interaction + layout`

Why:
- the public gallery is now showing real photos, which exposes the next real-world UX problems
- fixing lightbox behavior and mixed-ratio layout together will materially improve the visitor-facing site

---

# Definition of done for the entire stabilization sequence

This round is complete only when:
1. multi-photo archive batches upload reliably
2. Selected lightbox behaves like a true modal
3. Selected gallery handles mixed aspect ratios gracefully
4. Library is genuinely useful for recognizing and managing photographs
5. safe delete/unpublish paths exist
6. daily-entry publishing feels complete rather than awkward
7. public image rendering remains real and correct across Selected + Journal
8. lint/build pass
9. changes are split into clean commits and pushed
