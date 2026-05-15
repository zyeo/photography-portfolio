# Design Drift Follow-up — After correction pass

## Executive summary
The correction pass moved the site in the right direction, but it is **not finished**. The homepage is still visibly off, and the interior pages now over-literalize the reference boards in ways that were never intended for production. The goal is not to copy the planning mockups as artifacts; the goal is to recover their visual language.

## Highest-priority homepage corrections

### What improved
- The homepage is now immersive and centered.
- `Tokyo, for now` and the agreed homepage line are present.
- Bottom navigation and social actions are back.

### What is still wrong
1. **The signature font is wrong.**
   - Current `Allura` treatment feels generic and lightweight.
   - It does not resemble the approved reference, whose signature is looser, longer, more handwritten, and more elegant.
   - The homepage mark should visually approximate the approved reference much more closely in stroke style, width, and attitude.

2. **The navigation/social layout is wrong.**
   - Approved reference: centered nav below the identity block, with centered Instagram + email icons beneath it.
   - Current build: nav is left-aligned at the bottom edge, socials are right-aligned at the bottom edge.
   - Correction: center the entire lower cluster on the hero, stacked like:
     - `Selected   Journal   About`
     - Instagram / email icons beneath

3. **Typography scale and spacing are not yet faithful enough.**
   - Current signature is too clean and too dominant in the wrong way.
   - Supporting lines should be closer to the approved reference: small uppercase location line, quiet serif sentence, more delicate proportions.
   - Aim for the same emotional hierarchy as the approved image, not merely the same words.

4. **The hero still reads like a black placeholder, not a photograph-led entrance.**
   - Until real photography is in place, the current nearly-black field makes the homepage look like a knockoff rather than a photographic threshold.
   - The page needs actual imagery or at minimum a more image-like temporary treatment while real assets are being wired.

## Interior-page corrections

### Remove mockup labels from production UI
These were copied too literally from the design board and should not appear on the live site:
- `1 · Selected`
- `2 · Journal`
- `3 · Entry`

The approved references used those only as presentation labels inside a concept board, not as public-facing content.

### Header treatment
- Keep the recurring signature mark in the header; that part is directionally right.
- But remove section numbering from the left side.
- Consider either no left label at all, or a simple quiet page label only when genuinely useful.

### Selected
- Current direction is improved, but still not enough real gallery rhythm is visible to judge the design honestly.
- Keep the compact-airy gallery behavior.
- Ensure the page does not feel like a single-image demo once seeded with real selected work.

### Journal
- Restoring the journal line was correct.
- Remove the numbered header label.
- Keep the current featured-entry structure; it remains close to plan.

### Collections
- The route is better than before because a preview block exists.
- But the preview is still just a blank paper rectangle, not a visual glimpse of the collection.
- It needs actual collection cover imagery, not a placeholder.

### Entry / About
- Both are closer to the intended interior system now.
- Remove numbered mockup label from Entry.
- About remains one of the strongest-aligned pages.

## Concrete next-pass priorities

### P0
1. Replace the homepage signature treatment with a script that visually matches the approved reference much more closely.
2. Center the homepage nav and social icons beneath the identity block, matching the approved composition.
3. Remove board-artifact labels from production pages (`1 · Selected`, `2 · Journal`, `3 · Entry`).

### P1
4. Improve homepage typography proportions to better match the approved reference image.
5. Replace black/blank placeholder hero treatment with real photography or a much more photographic interim state.
6. Replace blank collection preview blocks with real cover images.

### P2
7. Re-check mobile homepage composition after the centered nav/social correction.
8. Seed enough gallery imagery to validate `Selected` rhythm rather than judging a one-image skeleton.

## Final verdict
This version is **closer**, but the homepage still looks like an imitation of the intended design rather than the intended design itself. The implementation should stop copying incidental labels from the mockups and start matching the actual hierarchy, gesture, and composition of the approved references.
