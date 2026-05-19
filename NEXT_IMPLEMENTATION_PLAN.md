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

## Remaining Phase 1 backlog

### P1 — must fix before final upload

#### 4. Selected curator and Homepage hero admin stabilization

Current issue:
- `/admin/selected` and `/admin/homepage` still feel scaffolded compared with Library.
- They are filename-first and have little explicit success/error feedback.
- Hero photo resolution currently looks bad.
- Hero transitions feel choppy.
- Need to investigate whether the hero uses the wrong image path, too-small derivative, bad CSS sizing, or compression issue.

Likely files:
- `/src/app/admin/(workspace)/selected/selected-curator.tsx`
- `/src/app/admin/(workspace)/selected/selected-curator.module.css`
- `/src/app/admin/(workspace)/selected/page.tsx`
- `/src/app/admin/(workspace)/homepage/hero-manager.tsx`
- `/src/app/admin/(workspace)/homepage/hero-manager.module.css`
- `/src/app/admin/(workspace)/homepage/page.tsx`
- `/src/app/page.tsx`
- `/src/app/page.module.css`

Smallest safe fix:
- Add thumbnails using `gallery_image_path` where available.
- Add success/error status for reorder, size toggle, remove, pin/unpin, focal updates.
- Preserve existing ordering and hero semantics.
- Investigate homepage hero image source and rendering quality:
  - confirm whether the hero should use `public_image_path` instead of `gallery_image_path`
  - check CSS sizing/object-fit/focal-position behavior
  - check whether derivative compression or dimensions are the cause
- Smooth homepage hero transitions slightly while keeping them quick and minimal.
- Do not redesign these pages into Library clones.

Risks:
- Reordering must remain deterministic and persisted only through intended selected order updates.
- Hero pinning must still preserve single pinned hero.
- Hero polish should not turn into a broad homepage redesign.

Manual test:
- Reorder Selected and refresh → same order.
- Toggle selected size and refresh → persists.
- Remove from Selected → disappears from curator and public selected after refresh.
- Pin hero → only one pinned hero.
- Resume rotation → no pinned hero.
- Simulated failed request shows error instead of silent drift.
- Homepage hero uses the highest appropriate public derivative and looks sharp.
- Hero transitions feel smooth enough without becoming slow or showy.

### P2 — should fix before launch

#### 5. Library layout density

Current issue:
- Library page currently feels too single-column.
- Admin should be able to browse many photos more efficiently.

Likely files:
- `/src/app/admin/(workspace)/library/library-grid.tsx`
- `/src/app/admin/(workspace)/library/library-grid.module.css`
- `/src/app/admin/(workspace)/library/page.tsx`

Smallest safe fix:
- Make Library cards responsive with best-practice CSS grid, not fixed awkward columns.
- Preferred direction:
  - desktop: 3–4 columns depending on screen size
  - tablet: 2 columns
  - mobile: 1 column
- Keep metadata/action controls usable and not cramped.

Manual test:
- Library shows 3–4 comfortable columns on desktop.
- Library shows 2 columns on tablet.
- Library shows 1 column on mobile.
- Cards remain readable and actions remain usable.

#### 6. Daily Entry form readability

Current issue:
- Daily Entry creation form text and spacing feel too small/tight.

Likely files:
- `/src/app/admin/(workspace)/daily-entry/daily-entry-form.tsx`
- `/src/app/admin/(workspace)/daily-entry/daily-entry-form.module.css`
- `/src/app/admin/(workspace)/daily-entry/page.tsx`

Smallest safe fix:
- Increase text size and spacing in the creation form.
- Keep visual style consistent with the rest of the admin UI.
- Do not change upload/publish/Selected semantics.

Manual test:
- Daily Entry form is easier to scan on desktop and mobile.
- Upload, publish/draft, duplicate-date preflight, and Add photo to Selected still behave as before.

#### 7. Public Journal detail layout: preserve aspect ratio

Current issue:
- Journal detail images are currently cropped into a landscape shape.
- The journal should feel like a minimal daily photo log / photo essay, not a database record.

Likely files:
- `/src/app/journal/[date]/page.tsx`
- `/src/app/journal/[date]/page.module.css`

Smallest safe fix:
- Render the journal image as a real image, not a cropped CSS background.
- Use stored `image_width` / `image_height` metadata to classify orientation.
- Mobile: always stack image above text.
- Desktop:
  - portrait image can sit side-by-side with text
  - landscape image can span wider, with text below or in a balanced adjacent column
  - square image gets balanced treatment
- Do not crop, stretch, or distort.

Risks:
- Mixed orientation CSS can sprawl. Keep it minimal and editorial.

Manual test:
- Portrait, landscape, and square journal entries on mobile and desktop.
- No crop/stretch/distortion.
- Missing dimensions still render gracefully.

#### 8. Public Journal list/archive UI

Current issue:
- Journal index is mostly text and will not scale to hundreds of entries.
- This is a daily photo log and may eventually have hundreds of entries.
- It needs visual recognition via thumbnails without showing hundreds of full-size entries.

Likely files:
- `/src/app/journal/page.tsx`
- `/src/app/journal/page.module.css`
- possibly a small client component for load-more, or a simple paginated server route.

Smallest safe fix:
- Keep latest entry prominent.
- Show older entries in compact thumbnail archive items:
  - thumbnail
  - date
  - title
  - short excerpt if useful
- Initially show about 6 on desktop and 5 on mobile.
- Add simple pagination or Load more.
- Avoid horizontal carousel as the main archive.

Risks:
- Avoid overfetching hundreds of image entries.
- Avoid making it app-like; keep minimal/editorial.

Manual test:
- Latest entry prominent.
- Archive items recognizable by thumbnail.
- Load more/pagination exposes older entries.
- Mobile remains compact.

#### 9. Public contact links

Current issue:
- Homepage Instagram is placeholder.
- Email is outdated.

Correct links:
- Instagram: `https://www.instagram.com/aphoto._aday`
- Email: `zacharyyeo22@gmail.com`

Likely files:
- `/src/app/page.tsx`
- `/src/components/site-footer.tsx`
- `/src/components/site-header.tsx`
- maybe `/src/app/about/page.tsx` if adding explicit contact copy there.

Smallest safe fix:
- Inspect homepage, About page, footer, and header if applicable.
- Replace stale URLs only.
- Keep nav/layout unchanged.

Manual test:
- Homepage Instagram opens correct profile.
- Homepage/footer email use correct address.
- No `hello@zachyeo.com` remains unless intentionally preserved.

#### 10. Public empty states

Current issue:
- Sparse-content pages can feel blank or unfinished.

Likely files:
- `/src/app/selected/page.tsx`
- `/src/app/collections/page.tsx`
- `/src/app/collections/[slug]/page.tsx`
- `/src/app/journal/page.tsx`

Smallest safe fix:
- Add quiet editorial empty-state copy.
- No mechanics, no large redesign.

Manual test:
- Empty Selected, Collections, collection detail, and Journal all look intentional.
- Empty copy disappears when content exists.

#### 11. Journal weather rendering

Current issue:
- Weather is editable and fetched but not rendered on journal detail.

Likely files:
- `/src/app/journal/[date]/page.tsx`

Smallest safe fix:
- Add weather to the detail metadata line when present.

Manual test:
- Entry with weather shows it.
- Entry without weather remains clean.

#### 12. Mobile nav pass

Current issue:
- Navigation is consistent but may feel cramped on small screens.

Likely files:
- `/src/components/site-header.module.css`
- `/src/app/page.module.css`

Smallest safe fix:
- Tune gaps/letter-spacing/wrapping for 320–430px widths.
- Keep all four links visible.

Manual test:
- Home and inner pages at 320, 375, 430px.
- No horizontal overflow.

### P3 — nice to have later

#### 13. Raw `<img>` cleanup

Current issue:
- `npm run build` passes but warns about raw `<img>` usage.

Likely files:
- `/src/components/public/lightbox-gallery.tsx`
- `/src/app/admin/(workspace)/library/library-grid.tsx`
- `/src/app/admin/(workspace)/collections/collection-manager.tsx`
- `/src/app/admin/(workspace)/journal/journal-manager.tsx`

Smallest safe fix:
- Convert selectively to `next/image` only where it helps and remote image config is stable.

#### 14. Larger admin ergonomics

Potential later improvements:
- Search/filter in Journal image picker.
- Search/filter/pagination in Collections add-photo list.
- More visual curation tools after final photos exist.

#### 15. Data model polish

Potential later decisions:
- `title`
- `alt_text`
- separate display date vs capture timestamp

Defer until real content strategy is clearer.

#### 16. Cloudflare object storage

Potential later decision:
- Evaluate Cloudflare object storage or another object-storage layer if the archive grows beyond what Supabase Free file storage comfortably supports.
- This is an architecture planning item only; do not implement during current stabilization.

## Suggested next implementation order

1. P1 #4 Selected curator + Homepage hero admin stabilization, including hero quality/transition investigation.
2. P2 #5 Library layout density.
3. P2 #6 Daily Entry form readability.
4. P2 #7 Public Journal detail aspect-ratio layout.
5. P2 #8 Public Journal archive/list thumbnails and pagination/load more.
6. P2 #9 Contact links.
7. P2 #10 Public empty states.
8. P2 #11 Journal weather rendering.
9. P2 #12 Mobile nav pass.
10. P3 #13 Raw `<img>` cleanup.
11. P3 #14 Larger admin ergonomics.
12. P3 #15 Data model polish.
13. P3 #16 Cloudflare object storage evaluation.

This order keeps public state truthful first, then improves high-touch admin curation and browsing density, then polishes the public journal experience.

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

We are still working on Phase 1, not starting a new phase.

Next recommended implementation item:
P1 #4 Selected curator + Homepage hero admin stabilization.

Goal:
Make `/admin/selected` and `/admin/homepage` clearer and more reliable by adding thumbnails and explicit success/error feedback for curator actions, while preserving existing Selected ordering and single-pinned-hero semantics. Also investigate homepage hero image quality and choppy transitions: check whether the hero uses the wrong image path, too-small derivative, CSS sizing/focal behavior, or compression issue, then smooth transitions slightly while keeping them quick and minimal.

Before editing:
- inspect relevant Selected, Homepage admin, and public homepage files
- explain the smallest safe implementation plan
- then implement only this item
```
