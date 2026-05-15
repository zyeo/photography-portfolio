# Photography Journal & Portfolio

## What This Is

A poetic, minimal photography website for Zach Yeo at `photos.zachyeo.com`: part daily journal, part portfolio, rooted in Tokyo and designed to mature into future freelance work. Visitors should quickly understand the photographer's eye, then stay to follow the practice behind it.

## Core Value

A visitor can encounter Zach's visual voice immediately, then follow the daily discipline that produces it.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Public site feels image-led, authored, responsive, and fast.
- [ ] Daily journal preserves a strict one-photo-per-day publishing model.
- [ ] Admin makes daily publishing and archive curation humane enough to sustain.
- [ ] Data, storage, and permissions keep originals private while public work remains easy to browse.

### Out of Scope

- Full booking system — services are not concrete enough for v1.
- Commerce features — not core to the journal/portfolio promise.
- Places browsing — deferred until the archive justifies it.
- Visual gimmicks — they would compete with the photography and age quickly.

## Context

The product begins from a detailed creative brief and implementation plan rather than an existing app. The intended stack is Next.js, Supabase, and Vercel. The visual language is poetic first with a little urban-editorial sharpness: paper-white surfaces, charcoal text, restrained metadata, quiet controls, and strong editorial rhythm.

## Constraints

- **Tech stack**: Next.js + Supabase + Vercel — chosen in the implementation plan.
- **Content model**: one photo per journal day — this distinction protects the daily practice from future projects/sets.
- **Privacy**: original files remain private — the website is not the sole archive and public delivery assets are separate.
- **Experience**: mobile-first and performance-conscious — browsing should feel effortless.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Separate daily journal entries from broader photo library records | Preserves the one-photo-per-day concept while allowing archive uploads | — Pending |
| Use a small custom admin instead of raw markdown | Daily publishing should be friction-light and visually manageable | — Pending |
| Keep public presentation restrained and metadata secondary | The photographs should lead; interface chrome should recede | — Pending |

---
*Last updated: 2026-05-15 after project initialization*
