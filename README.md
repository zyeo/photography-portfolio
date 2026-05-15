# Photography Portfolio

Poetic photography journal and portfolio for Zach Yeo, built with Next.js and Supabase.

## Local development

1. Copy `.env.example` to `.env.local`.
2. Fill the Supabase environment variables.
3. Install dependencies with `npm install`.
4. Run `npm run dev`.

## Verification

- `npm run lint`
- `npm run build`

## Deployment

- Host the app on Vercel.
- Configure the same environment variables in Vercel.
- Point `photos.zachyeo.com` at the Vercel project.
- Apply Supabase migrations before public launch.

## Operational notes

- Originals remain private in the `originals` bucket.
- Public delivery assets belong in `public-images`.
- The website is not the only archive of master image files; keep independent backups.
- Rotate Supabase secrets after sharing or suspected exposure.
