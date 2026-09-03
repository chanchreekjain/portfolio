# chanchreek.dev — portfolio

Personal portfolio for **Chanchreek Jain** — AI/ML & Intelligent Automation Engineer.

Static site. No build step, no dependencies, no framework. Three files do the work:

```
index.html     markup + content
styles.css     design tokens, layout, motion
main.js        scroll engine (loader, pinned gallery, expanding panel, cursor)
assets/        certificate preview images
docs/          résumé + certificate PDFs
```

## Local preview

Anything that serves a folder over HTTP works:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Opening `index.html` straight off the filesystem also works, but a server is closer to production.

## Deploy (Vercel)

Vercel detects this as a static site — no framework preset, no build command, output
directory is the repo root. Push to `main` and every commit ships.

```bash
vercel          # preview
vercel --prod   # production
```

## Design notes

- **Palette** — near-black `#08080A`, warm off-white `#EDEAE4`, champagne `#CBB392`.
  A desaturated spectrum is the only colour on the site: it appears in the loader,
  the scroll rail, and as one-pixel accents. Nothing is saturated enough to glare.
- **Type** — Marcellus (display) over Jost (UI), both from Google Fonts.
- **Motion** — every scroll-driven value is lerped in a single `requestAnimationFrame`
  loop. Native scrolling is never hijacked.
- **Fallbacks** — the `js` class on `<html>` gates every hidden-by-default state, so
  the page is fully readable with JavaScript disabled. `prefers-reduced-motion`
  unpins the horizontal gallery and the expanding panel into a plain vertical stack.

## Content source

Everything on the page comes from the résumé in `docs/` and the previous portfolio.
`docs/` holds the verifiable originals:

- `chanchreek-jain-resume.pdf`
- `microsoft-azure-ai-engineer.pdf` — Azure AI Engineer Associate (AI-102)
- `oracle-oci-ai-foundations.pdf` — OCI 2025 AI Foundations Associate
