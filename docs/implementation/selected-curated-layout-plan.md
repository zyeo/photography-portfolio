# Selected Curated Layout Implementation Plan

Status: implemented on `codex/selected-curated-layout`
Stage: implementation checkpoint

## Safety Baseline

Verified on 2026-07-04:

- Branch `main` was clean.
- `main` matched `origin/main`.
- Ahead/behind count was `0 / 0`.
- Baseline commit was `48af3ff` (`Update site favicon`).

Stage 1 planning work lives on branch:

- `codex/selected-layout-planning`

## Implementation Branching

When implementation begins:

1. Start from updated `origin/main`.
2. Create a feature branch: `codex/selected-curated-layout`.
3. Keep commits atomic by layer.
4. Push after each stable milestone.

Suggested commits:

1. `Add selected layout foundation tests`
2. `Add selected layout persistence API`
3. `Add public selected layout renderer`
4. `Add selected snap grid editor`
5. `Document selected layout QA`

## Phase 1: Persistence

Tasks:

- Add Supabase migration for `selected_layout_items`.
- Add indexes for `photo_id` and `mobile_order`.
- Add RLS/admin policies matching existing admin-owned tables.
- Backfill selected photos into layout rows.
- Update `src/types/database.ts`.
- Update `supabase/seed.sql` if sample data should exercise the new layout.

Acceptance:

- Existing selected photos still have a fallback layout.
- Newly selected photos have a clear initial layout state.
- No existing `photos` columns are removed.
- Public site can still use old renderer until later phases are merged.

## Phase 2: API

Tasks:

- Add `src/app/api/admin/selected-layout/route.ts`.
- Implement authenticated `GET`.
- Implement validated whole-layout `PUT`.
- Normalize mobile order and reject invalid layout dimensions.
- Keep `/api/admin/photos/[id]`, upload finalization, and library selected toggles backward-compatible.

Acceptance:

- API returns selected photos plus layout metadata.
- API does not expose unpublished/unselected photos for public rendering.
- Invalid layout writes fail clearly.

## Phase 3: Public Renderer

Tasks:

- Add `SelectedLayoutGallery`.
- Update `src/app/selected/page.tsx` to fetch layout rows and render the new component.
- Preserve lightbox behavior.
- Preserve image aspect ratios.
- Add mobile stacked fallback.

Acceptance:

- Desktop reflects authored x/y/width layout.
- Mobile remains readable and stable.
- Collections still use `LightboxGallery`.

## Phase 4: Admin Editor

Tasks:

- Replace or extend `SelectedCurator` with a snap-grid artboard.
- Support drag-to-position.
- Support resize by handles or span controls.
- Support caption editing.
- Save layout through the new API.
- Keep remove-from-Selected behavior.

Acceptance:

- Admin can arrange photos visually.
- Reloading admin preserves saved positions.
- Public page matches the saved arrangement.
- Editor remains usable with keyboard/button fallbacks for basic movement.

## Phase 5: Verification

Commands:

```bash
npm run lint
npm run build
```

Manual checks:

- `/selected` desktop.
- `/selected` mobile.
- `/admin/selected` drag, resize, caption, save, reload.
- Existing collection pages.
- Library selected/unselected toggles.
- Upload flow when adding a photo to Selected.
- Launch checklist updated with curated-layout QA.

## Sub-Agent Plan

Use sub-agents only for bounded, non-overlapping work.

Good delegated tasks:

- Migration/API implementation.
- Public renderer implementation.
- Admin editor implementation.
- Verification/audit pass.
- Documentation and launch-checklist update.

Coordination rules:

- Each agent owns a disjoint write set.
- Agents must not revert user changes or other agent changes.
- Main agent reviews, integrates, tests, commits, and pushes.
- Use lightweight agents for narrow coding or verification tasks where possible.

## Stop Points

Pause and ask before implementation if:

- Supabase credentials or migration workflow are unclear.
- The admin editor requires a third-party drag library not already installed.
- The desired caption design needs art direction beyond plain text under images.
- Current production data differs materially from the local schema.

## Implementation Notes

The first implementation keeps the old `photos.selected_order` and `photos.selected_size` fields for compatibility, but the authored layout now lives in `selected_layout_items`.

Public `/selected` uses a Selected-specific renderer so collection pages keep the existing masonry gallery.

Admin `/admin/selected` now supports:

- Snap-grid drag placement.
- Button nudging for position.
- Button resizing.
- Caption editing.
- Mobile order controls.
- Whole-layout save through `/api/admin/selected-layout`.

The next natural enhancement is an optional freeform desktop mode that saves into the same `desktop_x`, `desktop_y`, and `desktop_width` contract.
