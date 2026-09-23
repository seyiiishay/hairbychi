# Photography

Every image slot on the site renders an illustrated placeholder until a real
photo exists at the matching path below. Drop in a `.jpg` (ideally 4:5
portrait, at least 1200px tall, consistent lighting) and it fades in
automatically, with no code changes.

| Path | Where it appears |
|---|---|
| `hero/main.jpg`, `hero/detail-1.jpg`, `hero/detail-2.jpg` | Homepage hero composition |
| `services/<service-id>.jpg` (+ `-2`, `-3` for extra angles) | Service cards, service page gallery, booking step 1 |
| `categories/<category-id>.jpg` | "Browse by category" tiles |
| `stylists/<stylist-id>.jpg` | Stylist cards and profiles |
| `gallery/<gallery-id>.jpg` | Lookbook, homepage portfolio, Instagram strip |
| `transformations/1-before.jpg`, `1-after.jpg`, `2-before.jpg`, `2-after.jpg` | Before/after sliders |
| `studio/interior.jpg`, `about/studio.jpg`, `first-visit.jpg`, `auth.jpg` | Editorial images |

IDs are in `src/data/catalog.ts` (e.g. `services/medium-knotless-braids.jpg`,
`stylists/chioma.jpg`, `gallery/g1.jpg`). Photos uploaded from the Studio
dashboard (Services → Edit, Gallery → Upload) override these files.
