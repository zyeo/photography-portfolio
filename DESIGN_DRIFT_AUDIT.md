# Design Drift Audit — Photography Portfolio

Audited against `CREATIVE_BRIEF.md` and `IMPLEMENTATION_PLAN.md` on the live routes:
- `/`
- `/selected`
- `/journal`
- `/journal/2026-05-14`
- `/collections`
- `/collections/digital`
- `/about`

## Executive summary
The current build is coherent and tasteful, but it is **not yet the site we planned**. It currently reads as a restrained literary template with photography placeholders, rather than a photographer's authored world. The largest drift is on the homepage: the agreed immersive, image-led threshold has become a conventional content homepage with explanatory copy. The second-largest drift is typographic: the expressive signature identity we chose has been replaced by a generic serif wordmark. Most interior routes are structurally closer to plan, but they still feel more scaffolded than finished because imagery, collection previews, archive affordances, and several small rituals are missing.

## 1. What matches the intended design

### Overall system
- Warm paper-white background and dark charcoal text match the chosen palette.
- The site is restrained, spacious, and largely free of decorative chrome.
- Navigation is simple and quiet: `Selected`, `Journal`, `Collections`, `About`.
- Square image treatment, no decorative shadows, and subdued metadata are aligned with plan.
- The interior pages use a clear serif/sans hierarchy and generally maintain a calm editorial rhythm.

### Selected
- The route exists as a gallery-first surface.
- Clicking a photograph opens a lightbox.
- The lightbox shows only quiet supporting metadata: location and date.
- The underlying component supports `normal` and `large` selected image sizing, which matches the intended curation model.

### Journal
- The journal index uses the planned latest-entry feature structure: image on the left, date/title/excerpt/CTA on the right.
- The single journal entry page is structurally close to plan: image first, then title, date/location, camera metadata, reflection, and previous/next nav.
- Camera metadata is visually recessive rather than dominant.

### Collections
- There is a collections landing page and shared collection detail template, which matches the chosen architecture.

### About
- The About page is minimal, personal, and includes a quiet availability line for portrait/editorial inquiries.

## 2. What partially matches but feels off

### Mood and emotional tone
- The site is calm and literate, but currently feels more like a tasteful editorial scaffold than a personal photographic world.
- It is poetic in copy, but not yet poetic in presence. The photographs are not doing enough emotional work because actual images are absent from the public experience and the homepage is copy-led.

### Typography
- The serif/sans pairing is competent and refined, but the system lacks the expressive threshold we intentionally chose.
- `Zach Yeo` appears as a plain serif wordmark everywhere; we explicitly decided on a signature-like script on the homepage and a quieter carried-through signature on interior pages.
- Current hierarchy is strong in a conventional editorial sense, but not distinctive enough to make the site feel unmistakably authored.

### Spacing and composition
- Interior spacing is generally aligned with the planned airy system.
- `Selected` does not yet demonstrate the intended compact-airy editorial rhythm because there is only one visible image and the oversized page intro dominates before the gallery begins.
- `Journal` is structurally good, but with only one entry the page currently reads like a demo state rather than a living journal.

### Journal entry page
- The page order is correct, but the title block feels a little too detached from the image, and the overall composition is more generic article layout than intimate photographic note.
- The metadata presentation is clean, though slightly more tabular/clinical than the softer poetic direction we discussed.

### Mobile
- The site mostly collapses responsibly, and important information does not depend on hover.
- However, the header loses elegance on narrow screens: `Zach Yeo` wraps into two lines and the nav becomes a two-row cluster. It works, but it does not feel as composed as the desktop version.

## 3. What clearly diverges from the intended design

### Homepage concept
Planned:
- full-screen / immersive hero photograph
- subtle dark overlay
- expressive script signature for `Zach Yeo`
- `Tokyo, for now`
- `Photographs and notes from an ongoing practice.`
- bottom navigation to `Selected`, `Journal`, `About`
- small Instagram and mail icons
- slow rotation among approved hero photos with optional pinned cover image

Built:
- standard top navigation
- a contained dark rectangle rather than a full-screen photographic threshold
- no real hero photograph, only generated gradient placeholders
- no `Tokyo, for now`
- different headline and body copy
- no slow hero rotation
- no homepage social icons
- extra explanatory sections beneath the hero

This is not a minor styling drift; it is a different homepage concept.

### Homepage copy
- We agreed the homepage should be simple and slightly mysterious.
- The current homepage explains the product architecture back to the visitor: `The portfolio shows the eye. The journal shows the practice behind it.` That was useful planning language, but public-facing it feels self-conscious and too explicit.
- The homepage also re-centers Tokyo with `A living archive of Tokyo walks...`, despite the planning decision that Tokyo should be the current chapter, not the identity of the whole project.

### Selected page
Planned:
- purely visual, artistic, minimal gallery
- compact-airy rhythm
- images lead; text recedes

Built:
- large title block dominates the first viewport
- only one visible image currently
- the route feels more like a portfolio template landing page than a gallery wall

### Collections landing page
Planned:
- cover image per collection
- title
- short description
- quiet CTA
- a table-of-contents feel with visual glimpses of each body of work

Built:
- text-only row for `Digital`
- no cover images
- no visual glimpse of collection character

### Photographer identity
- We chose `Expressive at the threshold, restrained everywhere else.`
- The build is restrained everywhere, including the threshold. The distinctive part was lost.

## 4. Important planned UI/UX ideas missing entirely

### Homepage / identity
- Signature-style homepage wordmark
- `Tokyo, for now`
- Agreed homepage line: `Photographs and notes from an ongoing practice.`
- Full-screen hero photography treatment
- Slow random rotation of approved hero images
- Ability to visually communicate a pinned hero state on the public homepage
- Small Instagram and mail icons on the homepage

### Journal
- Minimal archive controls for reaching older dates without endless scroll
- The agreed journal intro line: `A journal of photographs, places, and the practice of noticing.`

### Collections
- Cover images / previews on the landing page
- Desktop collections dropdown from nav, while keeping the landing page itself
- A `Film` collection visible in the current public information architecture

### Selected
- A convincing multi-image editorial rhythm using `normal` and `large` curation states
- Enough image volume to validate the chosen gallery behavior

### Public experience / craft
- Actual photography in place of placeholder gradients
- Slow, subtle motion beyond static page transitions
- Homepage social/contact ritual
- A stronger sense that the archive belongs to one photographer rather than to a template

## 5. Concrete correction recommendations, prioritized by impact

### P0 — Restore the homepage we actually designed
1. Replace the current homepage with the approved threshold concept:
   - full-viewport photographic hero
   - subtle dark overlay
   - centered expressive signature `Zach Yeo`
   - `Tokyo, for now`
   - `Photographs and notes from an ongoing practice.`
   - simple nav: `Selected`, `Journal`, `About`
   - small Instagram + mail icons near the bottom
2. Implement actual hero-photo rendering instead of placeholder gradients.
3. Implement slow rotation among hero-approved photos, with pinned hero override.
4. Remove or radically reduce the current explanatory homepage sections unless they can be reintroduced later in a much quieter, less self-explanatory form.

### P1 — Restore the chosen typographic identity
1. Introduce a true signature/script display treatment for the homepage wordmark.
2. Carry a smaller signature mark through interior headers, rather than the current generic serif wordmark.
3. Keep the current serif/sans support system if desired, but let the signature create the authored distinction we intentionally chose.
4. Revisit header behavior on mobile so the mark and nav remain composed instead of wrapping awkwardly.

### P1 — Make the public site image-led, not placeholder-led
1. Replace placeholder gradients with actual image components and seeded real photography as soon as possible.
2. Use real hero crops/focal points to validate desktop and mobile art direction.
3. Treat placeholder visuals as development scaffolding, not an acceptable near-launch state.

### P1 — Rebalance `Selected` toward gallery, away from page-intro copy
1. Reduce the amount of text before the first image.
2. Let the gallery appear earlier and occupy the emotional foreground.
3. Populate with enough images to validate the compact-airy rhythm and use of `normal` vs `large` sizing.
4. Keep the lightbox metadata treatment; that part is aligned.

### P2 — Complete the journal experience
1. Add the intended journal intro line or otherwise recover the more reflective journal identity.
2. Add minimal archive controls, likely month/year based.
3. Refine the single-entry composition so the body feels less like a generic article and more like a photographic note.

### P2 — Give Collections the visual preview system we planned
1. Add cover imagery to each collection card on `/collections`.
2. Keep short descriptions and quiet CTAs, but make the page visually invitational rather than list-like.
3. Add the planned desktop dropdown behavior from `Collections` nav if that still fits the implementation direction.
4. Add `Film` once content exists, because `Collections` was chosen partly to hold medium-based groupings as well as projects/themes.

### P3 — Tighten copy drift
1. Replace `A living archive of Tokyo walks...` with language that treats Tokyo as current context, not permanent identity.
2. Consider restoring exact agreed phrases where they were strong:
   - homepage: `Photographs and notes from an ongoing practice.`
   - journal: `A journal of photographs, places, and the practice of noticing.`
3. Avoid turning internal rationale into public copy. The site should imply its philosophy more often than explain it.

## Final verdict
The current build is a **good scaffold** and a **partial implementation**, not yet a faithful realization of the intended design. The interior architecture is mostly sound. The homepage, typographic identity, image treatment, and collections presentation need decisive correction before the site will feel like the poetic, authored photography world we planned.
