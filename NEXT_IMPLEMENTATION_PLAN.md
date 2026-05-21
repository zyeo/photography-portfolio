# Phase 1 Handoff — Photography Portfolio

This is the authoritative handoff brief for continuing Phase 1 work in a new Codex chat.

The repo is still in active Phase 1 stabilization. Do **not** treat this as launch-ready. The current branch contains a large, coherent tranche of admin, upload, gallery, journal, and collection work that should continue from here.

## Repository state

- Repo path: `/Users/zyeo/Desktop/photography-portfolio`
- Active branch: `codex/phase-1-foundation`
- Remote: `origin` → `https://github.com/zyeo/photography-portfolio.git`
- Latest pushed checkpoint at handoff: `ac85657 Require eligible collection covers`
- Base branch: `main`
- Compare/PR URL: `https://github.com/zyeo/photography-portfolio/compare/main...codex/phase-1-foundation`

Before continuing, run:

```bash
cd /Users/zyeo/Desktop/photography-portfolio
git checkout codex/phase-1-foundation
git pull origin codex/phase-1-foundation
npm run build
```

`npm run build` currently passes. It still reports known non-blocking warnings about raw `<img>` usage.

## Collaboration / implementation practices

These practices were used during the current phase and should continue:

1. Work on `codex/phase-1-foundation` unless the user explicitly asks for a new branch.
2. Keep changes focused. Do not mix unrelated feature work into a stabilization fix.
3. Before editing, inspect the relevant files and explain the smallest safe plan when the user asks for planning/checkpoint first.
4. Do not redesign public gallery/admin flows unless the user explicitly asks.
5. Preserve existing behavior unless the requested change clearly requires altering it.
6. Server-side validation is authoritative; client-side validation is only UX/preflight.
7. Avoid public states that can make the site lie, especially around journal entries, photo publication, Selected, collection covers, and deletes.
8. Run `npm run build` after meaningful code changes before calling work complete.
9. Commit regularly at stable checkpoints. Prefer one coherent commit per completed task or small task group.
10. Push after each checkpoint commit so GitHub stays current:

```bash
git status --short
git add -A
git commit -m "Clear imperative summary"
git push origin codex/phase-1-foundation
```

11. Do not commit local QA image artifacts. `audit-shots/` is ignored intentionally.
12. If build failure appears related to `.next`, verify with a clean rebuild before changing source:

```bash
rm -rf .next
npm run build
```

## Current architecture notes

### Upload pipeline

Large uploads must not pass through Next route request bodies.

Current durable path:
1. Browser asks `/api/admin/uploads/prepare` for a signed upload path.
2. Browser uploads the original directly to Supabase Storage bucket `originals`.
3. Browser calls `/api/admin/uploads/finalize` with metadata/path info only.
4. Server downloads the stored original, validates it, extracts metadata/dimensions, generates public derivatives, and writes DB rows.

Important files:
- `/src/lib/admin/direct-upload.ts`
- `/src/app/api/admin/uploads/prepare/route.ts`
- `/src/app/api/admin/uploads/finalize/route.ts`
- `/src/lib/photos/validation.ts`
- `/src/lib/photos/finalize.ts`
- `/src/lib/photos/public-images.ts`

Public derivatives:
- `gallery_image_path`: gallery tile derivative, roughly 1200px long edge
- `public_image_path`: lightbox/public larger derivative, roughly 2200px long edge

Originals stay private and untouched in `originals`.

Future architecture consideration:
- Cloudflare object storage may be worth evaluating later if this project grows to many photos and Supabase Free file storage becomes limiting.
- Do **not** implement this during current Phase 1 stabilization unless explicitly requested.

### Journal/photo state rules

Daily Entry creation now follows these rules:

- If `Publish immediately` is checked:
  - `journal_entries.published = true`
  - linked `photos.published = true`
- If unchecked:
  - `journal_entries.published = false`
  - linked `photos.published = false`
- `Add photo to Selected` is independent:
  - checked → `photos.selected = true`, `selected_size = "normal"`, `selected_order = null`
  - unchecked → selected remains false
- Draft + Selected is allowed because public `/selected` filters `published = true`.
- A photo used by a published journal entry cannot be unpublished from Library until the journal entry is unpublished.
- A journal entry cannot be published unless its linked photo is public and has usable public assets.

Important files:
- `/src/app/admin/(workspace)/daily-entry/daily-entry-form.tsx`
- `/src/app/api/admin/uploads/finalize/route.ts`
- `/src/app/api/admin/photos/[id]/route.ts`
- `/src/app/api/admin/journal/[id]/route.ts`

### Admin modules now present

- Library: `/admin/library`
  - thumbnail archive view
  - metadata editing
  - single/bulk safe state actions
  - single/bulk hard delete with journal-linked blockers
  - bulk add to collection
- Journal: `/admin/journal`
  - edit entries
  - publish/unpublish
  - delete journal row only
  - change image to eligible existing Library photo
- Collections: `/admin/collections`
  - edit collection metadata
  - show/remove members
  - bulk remove members
  - set/clear cover
- Daily Entry: `/admin/daily-entry`
  - direct upload
  - duplicate date preflight
  - published/draft choice
  - optional Add photo to Selected

## Completed Phase 1 checkpoints

- Production build blocker was fixed by clearing stale `.next`; no source-code change.
- P1 #1 Journal/photo publication consistency.
- P1 #2 Daily Entry “Add photo to Selected.”
- P1 #3 Collection cover eligibility:
  - Server requires collection covers to be collection members.
  - Cover photos must be `published = true`.
  - Cover photos must have both `gallery_image_path` and `public_image_path`.
  - Admin disables ineligible cover choices and shows short reasons.
  - Existing invalid covers are **not** silently cleared; the UI warns and allows clearing or replacement.
- P1 #4 Selected curator + Homepage hero admin stabilization.
- P2 #5 Library layout density.
- P2 #6 Daily Entry form readability.
- P2 #7 Public Journal detail aspect-ratio layout.
- P2 #8 Public Journal archive/list thumbnails, pagination, contained scroll, and visual polish.
- P2 #9 Contact links.
- P2 #10 Public empty states.
- P2 #11 Journal weather rendering:
  - Verified public journal detail already renders `weather` in the date/location metadata line when present.
  - Entries without weather remain clean with no extra separator.
- P2 #12 Mobile nav pass:
  - Inner page nav and homepage footer nav now avoid horizontal overflow at 320px, 375px, and 430px.
  - Homepage footer nav can still be refined further for preferred one-line behavior and updated nav order.
- P2 #13 Homepage/public visual polish:
  - Hero image rotation works again with preload/decode and no blank frame.
  - Public nav order is now `Selected`, `Journal`, `Collections`, `About`.
  - Homepage text/composition and bottom nav spacing have been tuned.
  - A more obvious hero fade/resolve effect was explored but still did not read visually; defer further transition experiments.
- P2 #14 Selected gallery desktop density:
  - Public Selected now uses a wider page measure on desktop.
  - Gallery shifts to 4 masonry columns on wide screens while preserving natural, non-cropping image rendering.
  - Mobile/tablet remain responsive with no horizontal overflow.

## Remaining Phase 1 backlog

### P1 — must fix before final upload

No open P1 items remain before final upload.

### P2 — should fix before launch

No open P2 items remain before launch.

### P3 — nice to have later

#### 15. Raw `<img>` cleanup

Current issue:
- `npm run build` passes but warns about raw `<img>` usage.

Likely files:
- `/src/components/public/lightbox-gallery.tsx`
- `/src/app/admin/(workspace)/library/library-grid.tsx`
- `/src/app/admin/(workspace)/collections/collection-manager.tsx`
- `/src/app/admin/(workspace)/journal/journal-manager.tsx`

Smallest safe fix:
- Convert selectively to `next/image` only where it helps and remote image config is stable.

#### 16. Homepage hero transition perceptibility

Current issue:
- The hero rotation no longer blanks, but the fade/crossfade effect is not visually noticeable enough.
- Attempts with longer opacity timing and blur/scale resolve did not produce an obvious effect in practice.

Likely files:
- `/src/components/public/hero-rotator.tsx`
- `/src/components/public/hero-rotator.module.css`
- `/src/app/page.module.css`

Future options:
- Revisit after final hero photos are chosen; image similarity may make crossfades hard to perceive.
- Consider a more explicit two-layer state machine or keyframed incoming layer rather than toggling one active layer.
- Consider a subtle dark/bright overlay pulse only if it still feels editorial.
- Keep no-blank-frame behavior and pinned hero semantics.

#### 17. Larger admin ergonomics

Potential later improvements:
- Search/filter in Journal image picker.
- Search/filter/pagination in Collections add-photo list.
- More visual curation tools after final photos exist.
- Library filters once the archive grows:
  - hero-approved/pinned
  - location
  - aspect ratio/orientation: portrait, landscape, square, panorama
  - selected/published/journal-linked/missing assets if not already easy

#### 18. Data model polish

Potential later decisions:
- `title`
- `alt_text`
- separate display date vs capture timestamp

Defer until real content strategy is clearer.

#### 19. Cloudflare object storage

Potential later decision:
- Evaluate Cloudflare object storage or another object-storage layer if the archive grows beyond what Supabase Free file storage comfortably supports.
- This is an architecture planning item only; do not implement during current stabilization.

## Suggested next implementation order

1. P3 #15 Raw `<img>` cleanup.
2. P3 #16 Homepage hero transition perceptibility.
3. P3 #17 Larger admin ergonomics, including Library filters.
4. P3 #18 Data model polish.
5. P3 #19 Cloudflare object storage evaluation.

The base launch surface is ready; remaining items are lower-priority cleanup, visual polish, admin ergonomics, and future architecture work.

## Hand-off prompt for next Codex chat

Recommended next implementation prompt:

```text
We are continuing Phase 1 of my photography portfolio project.

Repo path:
/Users/zyeo/Desktop/photography-portfolio

Current branch:
codex/phase-1-foundation

Do not merge to main yet.

Please start by:
1. Checking out/pulling the latest `codex/phase-1-foundation` branch.
2. Reading `NEXT_IMPLEMENTATION_PLAN.md` fully.
3. Inspecting current git status and recent commits.
4. Running `npm run build` before making changes.
5. Following the handoff practices in that doc:
   - keep changes focused
   - explain a small plan before edits when appropriate
   - run build after meaningful code changes
   - commit at stable checkpoints
   - push regularly to `origin codex/phase-1-foundation`

Already completed:
- Build blocker fixed
- P1 #1 Journal/photo publication consistency
- P1 #2 Daily Entry “Add photo to Selected”
- P1 #3 Collection cover eligibility
- P1 #4 Selected curator + Homepage hero admin stabilization
- P2 #5 Library layout density
- P2 #6 Daily Entry form readability
- P2 #7 Public Journal detail aspect-ratio layout
- P2 #8 Public Journal archive/list thumbnails, pagination, contained scroll, and visual polish
- P2 #9 Contact links
- P2 #10 Public empty states
- P2 #11 Journal weather rendering
- P2 #12 Mobile nav pass
- P2 #13 Homepage/public visual polish
- P2 #14 Selected gallery desktop density

We are still working on Phase 1, not starting a new phase.

Next recommended implementation item:
Base launch QA and deployment prep.

Goal:
Run final production-readiness checks, confirm public content state, then merge/deploy when explicitly approved.

Before editing:
- inspect git status and recent commits
- run a clean production build
- smoke test public pages and contact links
- do not merge to main until explicitly approved
```
