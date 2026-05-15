# Creative Brief — Photography Journal & Portfolio

## Working concept
A beautiful, minimal website for a daily photography practice: part journal, part portfolio, rooted in Tokyo and designed to grow naturally into future freelance work.

## Core promise
A visitor should be able to quickly understand the photographer's eye, then stay to follow the ongoing practice behind it.

## Desired feeling
- Beautiful, calm, and image-led
- Paper-white background with dark charcoal text
- Minimal, but not anonymous
- Personal and authored rather than template-like
- Reflective, observant, and quietly alive
- Smooth, fast, and effortless to browse

## What makes it distinct
The site is not just a gallery of finished work. It reveals the practice behind the work: one photograph a day, what led to it, what the photographer noticed, and what they are learning over time.

## Primary audiences
1. People who enjoy the photography and may return for the daily journal
2. Future potential clients who want to understand taste, consistency, and style
3. The photographer themself, as an archive of growth and attention

## Site structure — first version
### Home
- Strong visual introduction
- Short statement of intent
- Entry points into Selected Work and Latest Journal entries

### Selected Work
- Carefully edited portfolio of strongest photographs
- Meant to represent the photographer at their best

### Journal
- Daily chronological entries
- One image per post, with:
  - date
  - title or short caption
  - location
  - hidden organizational tags later, not visibly foregrounded
  - aperture
  - ISO
  - shutter speed
  - optional camera / lens later
  - a few lines of reflection: what happened, what was noticed, what was attempted, what to improve
  - hero-approved toggle for inclusion in homepage background rotation

### About / Contact
- Short personal introduction
- Simple contact path
- Flexible enough to evolve later into freelance inquiries

## Daily publishing workflow
The publishing flow should be nearly frictionless:
1. Upload image
2. Enter title / reflection
3. Choose date, location, and tags
4. Enter camera metadata: aperture, ISO, shutter speed
5. Publish

The system should handle image optimization, responsive sizes, and presentation automatically.
Homepage hero images should come from a curated subset selected during publishing.

## UX principles
- Images load quickly and gracefully
- Hero imagery should use a subtle dark overlay and contrast-safe text treatment
- Mobile experience is first-class
- Navigation is obvious without being loud
- Reading and browsing both feel natural
- Metadata is easy to find but never competes with the photograph
- Every repeated interaction should feel light enough for daily use

## Visual direction
- Minimal composition with strong rhythm
- Typography should carry personality without overpowering the photographs
- Palette should feel like paper and ink rather than sterile white UI
- Layout should feel editorial rather than generic portfolio-template
- Character should come from proportion, sequencing, typography, and small rituals—not decoration for its own sake

## Future expansion
- Places section for browsing by location / neighborhood when the archive is ready for it
- Tokyo photography essays / blog posts
- Service pages for freelance photography
- Inquiry or booking flow once services become concrete
- Collections by theme, season, or project

## Non-goals for version one
- Full booking system
- Complex commerce features
- Too many categories before the work asks for them
- Visual gimmicks that slow the site down or age quickly

## Current visual decisions
- Overall direction: poetic first, with some urban-editorial sharpness
- Background: paper-white / warm near-white
- Text: dark charcoal rather than pure black
- Visible metadata: restrained; location, date, aperture, shutter speed, ISO
- Tags: hidden for organization/search rather than visibly shown in the interface

## Open design questions
- Should the overall mood lean more cinematic, documentary, poetic, or urban-editorial?
- Should the journal feel like a clean archive, a diary, or a magazine column?
- Should locations be practical filters, or a more central part of the site's identity?

## Page architecture — current decisions
### Selected
- Editorial gallery rather than plain uniform grid
- Purely visual and minimal on first view
- Some images may be intentionally larger to create rhythm
- Clicking an image opens a larger lightbox / detail view
- Detail view may show only quiet supporting metadata such as location and date, kept visually secondary

### Journal index
- Reverse-chronological feed
- Latest entry receives a larger featured treatment with image, short text, and read-more path
- Older entries continue below in a quieter list / feed
- Minimal archive controls should make older dates reachable without cluttering the interface

### Journal entry
- Image-first article page
- Order: image, title, date/location, camera metadata, reflection, previous/next navigation
- The photograph should arrive before the explanation

### About
- Minimal personal page with short bio, optional portrait, and contact path
- Include a quiet availability line for portrait / editorial inquiries without turning the page into a sales page

## Content model — current decisions
### Daily Journal
- Strictly one photograph per day
- Daily discipline should remain conceptually separate from future multi-image projects / sets
- Fields:
  - photo
  - date (auto-filled from EXIF when available, editable)
  - title
  - reflection
  - location
  - camera (auto from EXIF when available)
  - lens (auto from EXIF when available)
  - aperture (auto from EXIF when available)
  - shutter speed (auto from EXIF when available)
  - ISO (auto from EXIF when available)
  - weather (optional)
  - hero-approved toggle
  - pin-as-homepage-hero toggle
  - hidden organizational tags
  - focal point
  - optional mobile crop
- Metadata fields should be optional, not required

### Selected
- Separate from the daily journal; can include older archive work and images from dedicated shoots
- Minimal public presentation
- Public detail view should show only location and date for now
- Fields:
  - photo
  - location
  - date
  - gallery size: normal / large
  - display order
  - optional hidden metadata retained for future use

### Future Projects / Sets
- Planned future content type for grouped bodies of work such as trips, challenges, or themed series
- Kept separate from Daily Journal to preserve the one-photo-per-day concept

## Publishing system
- Use a small custom admin / CMS-style publishing interface rather than relying on raw markdown files
- Ideal workflow:
  1. Upload image
  2. System extracts EXIF automatically where available
  3. Photographer fills only the human fields: title, reflection, location, optional weather
  4. Photographer optionally curates hero status, selected status, focal point, and crop behavior
  5. Publish

## Archive and batch upload principles
- Two publishing flows:
  1. Daily upload flow creates a Daily Journal entry
  2. Archive upload flow adds individual or batched photos to the broader library
- Archive-uploaded photos are not Daily Journal entries unless explicitly linked later
- On upload, the system should first extract per-photo metadata automatically where available
- Batch metadata is optional and additive, not required
- Batch actions may apply shared collection, project, medium, location, or other metadata when useful
- A review grid should make it easy to adjust individual exceptions after batch upload
- Initial archive import should support bulk upload of years of selected work without requiring every field to be completed manually
- Product principle: metadata is welcome when available, editable when wrong, optional when absent

## Visual rules — current decisions
- Color: almost no accent color; warm paper-white background and dark charcoal text
- Spacing:
  - overall site: airy
  - Selected gallery: compact-airy, with denser editorial rhythm
  - Journal index: moderate
  - Single entries and About: airier and more reflective
- Images: square corners, no decorative shadows
- Motion: subtle only; slow hero crossfades, restrained hover behavior, no gratuitous transitions
- UI chrome: controls exist, but they should arrive quietly
- Responsive behavior: mobile-first clarity, no hover dependence

## Technical blueprint — data model
### `photos`
Single source of truth for every uploaded image.
- id
- image_path
- original_filename
- date_taken
- location_name (free text for now)
- latitude / longitude optional
- camera
- lens
- aperture
- shutter_speed
- iso
- medium: digital | film
- hidden_tags
- hero_approved
- pinned_hero
- focal_point_x / focal_point_y
- mobile_crop optional
- selected
- selected_size: normal | large
- selected_order optional
- created_at

### `journal_entries`
Strict one-photo-per-day journal records.
- id
- photo_id
- entry_date
- title
- reflection
- weather optional
- published
- created_at

### `collections`
Flexible containers for ongoing mediums and bounded projects / themes.
- id
- title
- slug
- type: medium | project | theme
- description optional
- cover_photo_id optional
- start_date optional
- end_date optional
- published
- display_order optional

### `photo_collections`
Many-to-many join table between photos and collections.
- photo_id
- collection_id
- display_order optional

### Integrity rules
- One journal entry per date
- One photo per journal entry
- Collection slugs unique
- Only one pinned hero at a time
- Selected size required only when selected is true
- `location_name` remains free-text in v1; normalize later only if a Places feature justifies it

## Technical blueprint — admin experience
### Admin navigation
- Dashboard
- Daily Entry
- Archive Upload
- Library
- Selected
- Collections
- Homepage

### Dashboard
- Show today's journal status
- Primary shortcut for creating a new Daily Entry
- Keep the page calm and sparse

### Daily Entry
- Single-photo publishing flow
- Upload one image
- Extract EXIF automatically
- Auto-fill date from EXIF when available, editable
- Manually enter title, reflection, location, optional weather
- Optional hero approval, focal point, pinning
- Preview before publish

### Archive Upload
- Upload individual photos or batches / folders
- Extract EXIF per image automatically
- Offer optional batch metadata, never required
- Support shared medium, collection(s), selected status, date, and location when useful
- Review grid for correcting exceptions before save
- Archive uploads never become journal entries unless explicitly linked later

### Library
- Master archive for all photos
- Search and filter by medium, collection, selected state, hero approval, and date
- Open individual photo records to edit metadata and relationships

### Selected
- Dedicated curation workspace
- Show only selected photos
- Drag to reorder
- Toggle normal / large sizing
- Preview actual gallery rhythm
- Removing from Selected should not delete the underlying photo

### Collections
- Create and manage mediums, projects, and themes
- Configure title, slug, type, description, cover image, publish state, and display order
- Add and reorder photos within collections

### Homepage
- See all hero-approved photos
- Pin / unpin a current hero image
- Resume slow rotation when no image is pinned
- Preview desktop and mobile crop behavior

### Admin UX principle
Let the user do the obvious thing in the context where they are already working whenever possible.

## Technical blueprint — public routes
- `/`
- `/selected`
- `/journal`
- `/journal/[yyyy-mm-dd]`
- `/collections`
- `/collections/[slug]`
- `/about`
- `/admin`

### Collections landing page
- Simple landing page with one cover image, title, short description, and quiet CTA per collection
- Designed as a table of contents rather than a giant gallery wall

### Collection pages
- Shared template for all v1 collections
- Distinction comes from title, description, cover image, and ordered photos rather than unique page types

### Photo viewing
- Selected and collection pages use lightboxes in v1
- No dedicated public photo detail pages required initially
- Future option: add a subtle lightbox action to open a photo on its own dedicated URL later

## Technical blueprint — storage, deployment, and security
### Stack
- Next.js for the public site and custom admin
- Supabase for Postgres, Auth, and Storage
- Vercel for hosting and deployment
- Public domain target: `photos.zachyeo.com`

### Storage
- `originals` bucket: private source files
- `public-images` bucket: optimized web delivery assets / transform source
- Preserve originals separately from public delivery concerns

### Image pipeline
- Extract EXIF on upload where available
- Serve responsive image sizes
- Use optimized formats where supported
- Lazy-load below-the-fold imagery
- Preserve layout stability with known dimensions / aspect ratios
- Use focal points and optional mobile crop behavior for hero images
- Preload only the active hero image; do not load the entire rotation pool at once

### Auth and permissions
- Private authenticated `/admin`
- One admin user initially
- Public can read only published public content
- Only admin can create, edit, delete, or manage unpublished content
- Originals remain private
- MFA can be added later if desired

### Public/private split
Public:
- published journal entries
- published collections
- selected photos
- approved hero photos
- public web image variants

Private:
- drafts
- unpublished collections
- hidden tags
- originals
- admin UI

### Durability principle
- The website is not the sole archive of original photographs
- Maintain independent backups of master photo files outside the site infrastructure
