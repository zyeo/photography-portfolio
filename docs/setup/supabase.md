# Supabase local setup

## Required environment variables

Copy `.env.example` to `.env.local` and fill:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Local workflow

1. Create or link a Supabase project.
2. Apply `supabase/migrations/202605160001_initial_schema.sql`.
3. Seed optional development content with `supabase/seed.sql`.
4. Create the single v1 admin user through Supabase Auth.
5. Keep original files backed up outside the website infrastructure.

## Storage model

- `originals` is private and intended for authenticated admin access only.
- `public-images` is public for optimized delivery assets, while writes remain restricted.

## Notes

- Metadata columns are intentionally nullable where photographs may not carry EXIF.
- One pinned homepage hero is enforced in the database.
- Journal entries preserve the one-photo-per-day rule with unique constraints on both `photo_id` and `entry_date`.
