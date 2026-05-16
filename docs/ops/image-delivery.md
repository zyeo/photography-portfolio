# Image delivery guidance

## Current state
Public pages are ready to consume optimized image variants but still fall back gracefully when a photo has no public rendition yet.

## Recommended next image pipeline step
1. Preserve every uploaded original in the private `originals` bucket.
2. Generate responsive web derivatives into `public-images`.
3. Store the public delivery path on `photos.public_image_path`.
4. Prefer modern formats when supported and retain known dimensions for layout stability.
5. Preload only the active homepage hero; lazy-load below-the-fold gallery images.

## Why this separation matters
It keeps archival durability separate from delivery optimization, which lets the site stay fast without treating compressed web files as master assets.

## Current first-pass implementation
- New published daily entries write a public delivery copy into `public-images`.
- New archive uploads added directly to public `Selected` do the same.
- Existing published photos can be repaired with `npm run backfill:public-images`.
- The current copy is the original browser-readable asset; responsive derivatives remain the next optimization step.
