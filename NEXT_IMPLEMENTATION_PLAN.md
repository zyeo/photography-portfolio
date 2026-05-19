# Phase 1 Handoff — Photography Portfolio

This is the authoritative handoff brief for continuing Phase 1 work in a new Codex chat.

The repo is still in active Phase 1 stabilization. Do **not** treat this as launch-ready. The current branch contains a large, coherent tranche of admin, upload, gallery, journal, and collection work that should continue from here.

## Repository state

- Repo path: `/Users/zyeo/Desktop/photography-portfolio`
- Active branch: `codex/phase-1-foundation`
- Remote: `origin` → `https://github.com/zyeo/photography-portfolio.git`
- Latest pushed checkpoint at handoff: `3812cd4 Stabilize photo publishing workflow`
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

## Remaining Phase 1 backlog

### P1 — must fix before final upload

#### 1. Collection cover eligibility

Current issue:
- Admin can choose any collection member as cover, even if the photo is draft or lacks a usable `gallery_image_path`.
- Public `/collections` can silently show a placeholder even though a cover is set.

Likely files:
- `/src/app/api/admin/collections/[id]/route.ts`
- `/src/app/admin/(workspace)/collections/collection-manager.tsx`

Smallest safe fix:
- Server: when setting `cover_photo_id`, require the photo to:
  - belong to the collection
  - be `published = true`
  - have non-null `gallery_image_path`
- UI: disable or clearly label ineligible cover candidates.

Risks:
- Existing test covers may become invalid and need reselection.

Manual test:
- Set valid published member with gallery derivative as cover → succeeds.
- Try draft member as cover → clear error.
- Try member missing gallery derivative → clear error.
- Public collections page shows real cover when cover is set.

#### 2. Selected curator and Homepage hero admin fragility

Current issue:
- `/admin/selected` and `/admin/homepage` still feel scaffolded compared with Library.
- They are filename-first and have little explicit success/error feedback.

Likely files:
- `/src/app/admin/(workspace)/selected/selected-curator.tsx`
- `/src/app/admin/(workspace)/selected/selected-curator.module.css`
- `/src/app/admin/(workspace)/selected/page.tsx`
- `/src/app/admin/(workspace)/homepage/hero-manager.tsx`
- `/src/app/admin/(workspace)/homepage/hero-manager.module.css`
- `/src/app/admin/(workspace)/homepage/page.tsx`

Smallest safe fix:
- Add thumbnails using `gallery_image_path` where available.
- Add success/error status for reorder, size toggle, remove, pin/unpin, focal updates.
- Preserve existing ordering and hero semantics.
- Do not redesign these pages into Library clones.

Risks:
- Reordering must remain deterministic and persisted only through intended selected order updates.
- Hero pinning must still preserve single pinned hero.

Manual test:
- Reorder Selected and refresh → same order.
- Toggle selected size and refresh → persists.
- Remove from Selected → disappears from curator and public selected after refresh.
- Pin hero → only one pinned hero.
- Resume rotation → no pinned hero.
- Simulated failed request shows error instead of silent drift.

### P2 — should fix before launch

#### 3. Public Journal detail layout: preserve aspect ratio

Current issue:
- Journal detail image is currently a cropped background block.
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

#### 4. Public Journal list/archive UI

Current issue:
- Journal index is mostly text and will not scale to hundreds of entries.
- It needs visual recognition via thumbnails.

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

#### 5. Public contact links

Current issue:
- Homepage Instagram is placeholder.
- Email is outdated.

Correct links:
- Instagram: `https://www.instagram.com/aphoto._aday`
- Email: `zacharyyeo22@gmail.com`

Likely files:
- `/src/app/page.tsx`
- `/src/components/site-footer.tsx`
- maybe `/src/app/about/page.tsx` if adding explicit contact copy there.

Smallest safe fix:
- Replace stale URLs only.
- Keep nav/layout unchanged.

Manual test:
- Homepage Instagram opens correct profile.
- Homepage/footer email use correct address.
- No `hello@zachyeo.com` remains unless intentionally preserved.

#### 6. Public empty states

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

#### 7. Journal weather rendering

Current issue:
- Weather is editable and fetched but not rendered on journal detail.

Likely files:
- `/src/app/journal/[date]/page.tsx`

Smallest safe fix:
- Add weather to the detail metadata line when present.

Manual test:
- Entry with weather shows it.
- Entry without weather remains clean.

#### 8. Mobile nav pass

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

#### 9. Raw `<img>` cleanup

Current issue:
- `npm run build` passes but warns about raw `<img>` usage.

Likely files:
- `/src/components/public/lightbox-gallery.tsx`
- `/src/app/admin/(workspace)/library/library-grid.tsx`
- `/src/app/admin/(workspace)/collections/collection-manager.tsx`
- `/src/app/admin/(workspace)/journal/journal-manager.tsx`

Smallest safe fix:
- Convert selectively to `next/image` only where it helps and remote image config is stable.

#### 10. Larger admin ergonomics

Potential later improvements:
- Search/filter in Journal image picker.
- Search/filter/pagination in Collections add-photo list.
- More visual curation tools after final photos exist.

#### 11. Data model polish

Potential later decisions:
- `title`
- `alt_text`
- separate display date vs capture timestamp

Defer until real content strategy is clearer.

## Suggested next implementation order

1. Collection cover eligibility.
2. Selected curator + Homepage hero admin stabilization.
3. Public Journal detail aspect-ratio layout.
4. Public Journal archive/list thumbnails and pagination/load more.
5. Contact links.
6. Empty states.
7. Weather rendering.
8. Mobile nav pass.

This order keeps public state truthful first, then improves high-touch admin curation, then polishes the public journal experience.

## Hand-off prompt for next Codex chat

Use the prompt at the bottom of this document or copy the one provided by the previous assistant.
