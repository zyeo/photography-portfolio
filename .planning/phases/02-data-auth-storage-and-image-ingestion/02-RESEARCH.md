# Research — Phase 2

## Locked product decisions
- Photos are the single source of truth; journal entries and collections relate to photos.
- Originals stay private; public delivery assets are separate.
- Metadata is optional and EXIF-derived values must remain editable.
- One admin user is sufficient for v1.

## Implementation notes
- Use Supabase RLS on every exposed public table and keep public reads restricted to published or explicitly public content.
- Use a private `originals` bucket and a public `public-images` bucket; upload permissions remain policy-gated even for public buckets.
- Use cookie-based Supabase SSR clients for Next.js server/client boundaries.
- Parse only the EXIF fields needed for v1 during upload and treat missing values as `null`.

## Phase decomposition
1. Define the database/storage spine and seed data.
2. Add auth-aware Supabase utilities plus guarded admin shell.
3. Add a first server-side ingestion route that uploads originals and stores extracted metadata.
