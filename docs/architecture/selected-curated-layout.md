# Selected Curated Layout Architecture

Status: planned
Stage: 1 readiness and architecture
Baseline: `main` at `48af3ff` (`origin/main`, clean and pushed)

## Goal

Turn the public Selected page from an automatically arranged masonry gallery into an authored photographic spread.

The long-term direction is:

- Mobile stays structured and predictable.
- Desktop supports an art-directed layout with intentional scale, spacing, zigzags, and captions.
- The first implementation should use a snap grid so layout is controllable without becoming brittle.
- The data model should leave room for later freeform desktop placement.

## Current State

The public Selected route fetches published selected photos from Supabase and renders them with `LightboxGallery`.

Important files:

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
- `supabase/migrations/202605160001_initial_schema.sql`
- `supabase/seed.sql`

Current storage is photo-centric:

- `photos.selected`
- `photos.selected_order`
- `photos.selected_size`

Current limitations:

- There is no persisted x/y/width/height layout data.
- The public renderer rebalances photos by aspect ratio, so admin order is not an exact visual contract.
- `selected_size` only supports `normal` and `large`.
- Captions for Selected-specific presentation do not exist.
- Upload finalization and library toggles can add photos to Selected, so they must stay compatible with any new layout defaults.

## Product Model

Selected should become a designed page, not just a filtered gallery.

The page should support:

- A large lead image.
- Asymmetric rhythm.
- Alternating left/right placement.
- Varying image sizes.
- Optional captions beneath or near images.
- Existing lightbox behavior when opening a photo.
- Stable mobile rendering.

## Recommended Layout Contract

Use a dedicated layout table rather than adding many layout fields directly to `photos`.

Suggested table:

```sql
create table public.selected_layout_items (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  desktop_x numeric(7,4) not null default 0,
  desktop_y numeric(7,4) not null default 0,
  desktop_width numeric(7,4) not null default 24,
  desktop_z_index integer not null default 0,
  mobile_order integer,
  caption text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Coordinate meaning:

- `desktop_x`: percentage across the desktop artboard, `0` to `100`.
- `desktop_y`: vertical artboard unit or percentage-like unit used to compute page height.
- `desktop_width`: percentage of artboard width.
- Height is derived from image aspect ratio to avoid distortion.
- `desktop_z_index`: reserved for later overlapping/freeform control.
- `mobile_order`: simple fallback order for small screens.

For the first snap-grid iteration, the admin editor can convert grid cells into these percentage values. That keeps the saved shape compatible with later freeform controls.

## Renderer Strategy

Add a Selected-specific public renderer instead of changing `LightboxGallery` globally.

Reason:

- Collections also use `LightboxGallery`.
- Collections should keep the existing masonry behavior unless deliberately changed later.
- Selected needs a different contract: preserve authored placement.

Suggested components:

- `src/components/public/selected-layout-gallery.tsx`
- `src/components/public/selected-layout-gallery.module.css`

Desktop behavior:

- Render an artboard with `position: relative`.
- Each item is positioned with percentage `left`, percentage/derived `top`, and percentage `width`.
- Image height is natural from `width`/`height`.
- Compute or store artboard height so the page scrolls correctly.

Mobile behavior:

- Ignore desktop x/y.
- Render a simple one-column stack, optionally with selected captions.
- Use `mobile_order`, then `selected_order`, then creation/id fallback.

## Admin Strategy

Replace the current order/size-only Selected admin with a layout editor in stages.

First implementation:

- A snap-grid artboard.
- Drag selected photos between grid positions.
- Resize by preset spans or handles.
- Save positions to `selected_layout_items`.
- Show captions in the editor.
- Keep remove-from-Selected controls.

Later implementation:

- Freeform desktop mode using the same saved x/y/width data.
- Optional snap toggle.
- Fine-grained nudge controls.
- Per-breakpoint layout editing if mobile needs more art direction.

## API Strategy

Keep single-photo updates in `/api/admin/photos/[id]` for photo metadata.

Add a dedicated route for Selected layout updates:

- `GET /api/admin/selected-layout`
- `PUT /api/admin/selected-layout`

The `PUT` route should save the whole layout transactionally where possible.

Validation requirements:

- Only authenticated admins can read/write.
- Each item must reference a selected photo.
- Width must be positive and within artboard bounds.
- Captions should have a max length.
- Mobile order should be unique or normalized by the API.

## Migration Strategy

Add new layout storage without removing old fields.

Backfill rules:

- Existing selected photos get layout items.
- Use `selected_order` as initial mobile order.
- Use a simple initial desktop snap-grid layout so the current page can migrate without a blank state.
- Keep `selected_order` during the first pass as a compatibility fallback.
- New photos added to Selected through upload or library flows should receive a default layout item or be visible in the admin editor as unplaced.
- Seed data should be updated if local/demo environments need to show the curated layout.

Rollback:

- Revert public route to `LightboxGallery`.
- Keep the migration if already deployed; unused table is harmless.
- If necessary, drop only the new `selected_layout_items` table in a follow-up migration.

## Testing And Verification

Before shipping implementation:

- Run `npm run lint`.
- Run `npm run build`.
- Verify `/selected` desktop and mobile.
- Verify `/admin/selected` editor save/reload.
- Confirm collections still render with the old masonry gallery.
- Confirm selected photo removal removes or hides its layout item.
- Confirm unselected/unpublished photos do not leak into public layout.
- Confirm upload-finalize and library add/remove-to-Selected flows still work.
- Update `docs/ops/launch-checklist.md` with curated-layout QA notes during implementation.

## Risks

- Freeform desktop layouts can break on different desktop widths if stored as raw pixels.
- Drag/resize UI can become heavy without a clear saved-layout contract.
- Captions need design rules so they enhance the spread rather than clutter it.
- Public page height must be computed carefully to avoid cropped content.
- Supabase type generation may need manual type updates if automated generation is unavailable.
- Existing admin writes use the shared photo PATCH route, so new layout writes should avoid making simple selected/unselected toggles brittle.

## Decision

Build the first version as a snap-grid editor backed by a future-compatible freeform coordinate model.

Do not mutate the shared `LightboxGallery` for this feature. Build a Selected-specific renderer and leave collection galleries on the existing masonry path.
