# SGL Lab Website — Design Spec (2026-08-31)

Rebuild of https://sites.google.com/view/sgl-lab as a static GitHub Pages site.

## Decisions
- **Design**: Direction A — clean academic minimal. White background, blue accent (#2b53e0),
  ink (#101936), Inter font, card-based sections, UMAP dot motif in hero.
- **Language**: English.
- **Deploy**: test on `suhyeonyoo0514/sgl-lab` → https://suhyeonyoo0514.github.io/sgl-lab/.
  Relative paths only, so the repo can later transfer to a lab org unchanged.
  `noindex` meta during test phase (official Google Site still live).

## Pages (5)
| File | Content |
|---|---|
| `index.html` | Hero + stats (64 pubs / 8 members / est. 2020) + 3 research cards + 3 recent pubs + footer |
| `principal-investigator.html` | Hae-Ock Lee, Ph.D. — education & professional experience timeline |
| `people.html` | 8 current members (2 researchers, 3 Ph.D., 3 M.S.) + 5 alumni; initial avatars, emails |
| `publications.html` | All 64 papers from `data/publications.json`, grouped by year, search filter, PI name bolded, DOI/PMID links |
| `contact.html` | Lab (Rm 8108) & office (Rm 8103) addresses, Google Maps embed, phone, email (merges old Location page) |

## Architecture
- Pure static: no build step, no framework. Hand-written `site.css`; `site.js` injects the
  shared header/footer and renders publications from JSON.
- `data/publications.json` — scraped from Google Sites (64 entries: title, authors, journal,
  year, citation, doi, pmid). Adding a paper = adding one JSON entry.
- `assets/favicon.svg` — SGL monogram.

## Out of scope
Gallery, dark mode, Korean version, contact form, member photos.
