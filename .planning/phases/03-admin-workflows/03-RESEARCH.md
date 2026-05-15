# Research — Phase 3

## Locked product decisions
- Admin should feel humane, not like a generic CMS.
- Daily journal publishing and archive upload remain separate flows.
- Archive metadata is additive and optional; review happens after upload, not before usefulness.
- Removing a photo from Selected never deletes the underlying photo.
- Homepage curation works from hero-approved photos with one optional pinned hero.

## Implementation strategy
- Build a shared admin shell first so every workflow has a common navigation spine.
- Let Daily Entry become the first complete end-to-end workflow because it proves the core ritual.
- Reuse the photo library as the common substrate for archive, selected, collections, and homepage tools.
- Keep v1 interactions intentionally simple where richer drag/drop polish can wait without breaking the workflow.

## Phase decomposition
1. Shared admin shell, dashboard, and daily entry publish flow.
2. Archive upload review plus searchable/editable library.
3. Selected curation, collections management, and homepage hero controls.
