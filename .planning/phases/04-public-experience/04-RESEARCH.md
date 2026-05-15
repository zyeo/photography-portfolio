# Research — Phase 4

## Locked product decisions
- Public browsing is image-led, editorial, and restrained.
- Selected and Collections use lightboxes in v1 rather than dedicated photo pages.
- Journal is reverse chronological, with the latest entry receiving larger treatment.
- Single journal entries are image-first and show metadata after the photograph.
- Public pages only read published content.

## Implementation strategy
1. Add shared public data/image helpers and connect the homepage to hero-approved content.
2. Build gallery-family routes together so Selected and Collections share visual behavior.
3. Build journal-family routes together so index/detail navigation remains coherent.

## Important constraint
The seeded/live project currently stores original paths but does not yet generate delivery derivatives. Public rendering should gracefully degrade to atmospheric placeholders until public image variants exist, while preserving the data shape for real images.
