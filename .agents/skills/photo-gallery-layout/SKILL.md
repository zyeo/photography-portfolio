---
name: photo-gallery-layout
description: Use when building, fixing, or optimizing a photography portfolio gallery with mixed aspect ratio images.
---

# Photo Gallery Layout

## Goal

Build a responsive photography portfolio gallery where mixed aspect ratio photos display beautifully without distortion, cropping, or large awkward gaps.

Prioritize:
1. Preserving original aspect ratios
2. Aesthetic visual composition
3. Minimal awkward gaps
4. Backend/database order only when it does not hurt the visual result

## Core Rules

- Never stretch images.
- Never distort images.
- Do not crop images unless the user explicitly asks for cropped thumbnails.
- Preserve each photo's original aspect ratio.
- Scale photos proportionally to fit the responsive layout.
- Reorder photos when it improves gallery composition.
- Keep implementation simple and maintainable.
- Do not rewrite unrelated parts of the site.

## Layout Preference

Prefer a non-cropping masonry layout for an organic photography portfolio feel.

Use masonry when the goal is:
- preserved aspect ratios
- proportional scaling within columns
- natural visual rhythm
- an organic photography portfolio feel

Photos may scale proportionally to fit columns, but must not crop, stretch, or distort.

Use justified layout only as a fallback if masonry cannot solve the layout cleanly or if the user later asks for tighter Google Photos/Flickr-style rows.

Avoid a basic equal-cell CSS grid unless the user explicitly wants cropped uniform thumbnails.

## Ordering Rules

The gallery does not need to follow backend/database order.

Priority order:
1. Preserve image aspect ratios.
2. Improve aesthetic composition.
3. Reduce large gaps and awkward whitespace.
4. Avoid clustering too many portrait, landscape, square, or panoramic photos together.
5. Keep backend order only when it does not hurt the visual result.

Suggested reordering strategy:
- Categorize photos by aspect ratio:
  - portrait: height > width
  - landscape: width > height
  - square-ish: width and height are close
  - panorama: width is much greater than height
- Mix these categories to create balanced rows or sections.
- Avoid placing many tall portraits consecutively.
- Avoid placing many wide panoramas consecutively.
- Prefer visually balanced rows over strict chronological order.

## Image Data Requirements

Use real image metadata when available:
- src
- width
- height
- alt
- title
- category
- date, only if useful

If width and height are missing, inspect the current project and choose the simplest maintainable way to provide them.

Do not guess dimensions if the project already has a reliable source of image metadata.

## Next.js / React Guidance

If this is a Next.js project:
- Prefer `next/image` when practical.
- Provide width and height when using `next/image`.
- Use lazy loading for gallery images.
- Use `sizes` for responsive loading.
- Avoid layout shift by using known dimensions or calculated aspect ratios.
- Keep the full image view uncropped.

## Acceptance Criteria

The final gallery should satisfy all of these:
- Portrait, landscape, square, and panoramic photos all look natural.
- No photo is distorted.
- No photo is unintentionally cropped.
- Layout has minimal awkward gaps.
- Mobile layout works well.
- Desktop layout feels polished.
- Clicking a photo opens a larger view or keeps the existing lightbox behavior.
- Backend order is not required.
- The code change is focused and does not rewrite unrelated parts of the site.

## Debugging Process

When fixing an existing gallery:
1. Inspect the current gallery component.
2. Inspect the current image data structure.
3. Identify whether image width and height are available.
4. Choose masonry layout unless there is a clear reason not to.
5. Make the smallest clean change.
6. Test with portrait, landscape, square, and panorama images.
7. Explain what changed and why.
