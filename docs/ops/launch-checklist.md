# Launch checklist

## Before deployment
- [ ] Supabase migrations applied
- [ ] Admin password rotated from bootstrap credential
- [ ] Supabase secret/PAT rotated after setup
- [ ] Environment variables configured in Vercel
- [ ] `photos.zachyeo.com` connected
- [ ] Independent backup of master originals exists

## Content readiness
- [ ] Hero-approved public images available
- [ ] Selected gallery curated and saved in the snap-grid editor
- [ ] Selected captions reviewed on desktop and mobile
- [ ] About copy reviewed
- [ ] At least one published journal entry visible
- [ ] Published collections reviewed

## QA
- [ ] Desktop browser pass
- [ ] Mobile browser pass
- [ ] `/selected` renders authored desktop layout and stacked mobile layout
- [ ] `/admin/selected` drag, resize, caption edit, save, reload
- [ ] Library and upload add/remove-to-Selected flows create usable layout defaults
- [ ] Collection galleries still use masonry layout
- [ ] Keyboard navigation pass
- [ ] Empty/error state pass
- [ ] Sitemap and robots verified
