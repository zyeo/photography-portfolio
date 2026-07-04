# Selected Layout Agent Brief

Use this brief for future sub-agents working on the curated Selected gallery.

## Product Intent

The Selected page should feel authored, like an editorial photo spread. It should not be an automatically optimized masonry layout.

Mobile should remain stable and simple. Desktop should move toward art-directed placement, first through snap-grid controls and later through freeform controls.

## Existing Behavior To Preserve

- Do not break collection galleries.
- Do not distort, stretch, or unintentionally crop images.
- Preserve lightbox behavior on public galleries.
- Keep unpublished photos out of public pages.
- Keep the current upload/library flows working.
- Keep collection pages on the existing masonry gallery unless explicitly assigned otherwise.

## Important Files

- `src/app/selected/page.tsx`
- `src/components/public/lightbox-gallery.tsx`
- `src/components/public/lightbox-gallery.module.css`
- `src/app/admin/(workspace)/selected/page.tsx`
- `src/app/admin/(workspace)/selected/selected-curator.tsx`
- `src/app/admin/(workspace)/selected/selected-curator.module.css`
- `src/app/api/admin/photos/[id]/route.ts`
- `src/app/api/admin/uploads/finalize/route.ts`
- `src/app/admin/(workspace)/library/library-grid.tsx`
- `src/types/database.ts`
- `supabase/migrations/`
- `supabase/seed.sql`

## Expected Future Files

- `src/components/public/selected-layout-gallery.tsx`
- `src/components/public/selected-layout-gallery.module.css`
- `src/app/api/admin/selected-layout/route.ts`
- A new Supabase migration for `selected_layout_items`.

## Agent Rules

- Work only within the files assigned by the orchestrating agent.
- You are not alone in the codebase; do not revert edits made by others.
- Keep changes focused and commit-ready.
- Prefer existing app patterns over new abstractions.
- Use `rg` for searching.
- Run relevant verification for your slice and report exact commands/results.

## Layout Contract

The first implementation should save future-compatible desktop layout data:

- `photo_id`
- `desktop_x`
- `desktop_y`
- `desktop_width`
- `desktop_z_index`
- `mobile_order`
- `caption`

The admin can start with snap-grid controls, but saved values should support later freeform placement.
