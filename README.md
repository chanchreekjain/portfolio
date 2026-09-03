# chanchreek.dev — portfolio

Personal portfolio for **Chanchreek Jain** — AI/ML & Intelligent Automation Engineer.

Static site. No build step, no dependencies, no framework. Three files do the work:

```
index.html     markup + content
styles.css     design tokens, type system, layout, motion
main.js        scroll engine (loader, pinned gallery, expanding panel, ground flip)
visuals.js     the four live project simulations
fabric.js      the ambient loss surface behind the page
assets/fonts/  self-hosted typefaces (+ their licences)
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
- **Type** — three roles, no CDN. **Bodoni Moda** (display) is a didone whose
  hairlines are the same gesture as the spectrum rules; **Archivo** (text and UI)
  is a grotesque with a width axis; **IBM Plex Mono** carries every figure, ID,
  date and readout, so the data reads as a spec sheet. All three are SIL Open
  Font License — the licences ship in `assets/fonts/`.
- **Ground** — the page inverts between ink `#0A0A0D` and bone `#E9E3D5`.
  Profile and Credentials are bone chapters; everything is token-driven, so the
  flip re-tunes the accent, the spectrum and the certificate mounts together.
- **Motion** — every scroll-driven value is lerped in a single `requestAnimationFrame`
  loop. Native scrolling is never hijacked. A spectral band travels through the hero
  letterforms via `background-clip: text`; the project simulations and the ambient
  loss surface each run only while on screen.
- **Fallbacks** — the `js` class on `<html>` gates every hidden-by-default state, so
  the page is fully readable with JavaScript disabled. `prefers-reduced-motion`
  unpins the horizontal gallery and the expanding panel into a plain vertical stack.

## Content source

Everything on the page comes from the résumé in `docs/` and the previous portfolio.
`docs/` holds the verifiable originals:

- `chanchreek-jain-resume.pdf`
- `microsoft-azure-ai-engineer.pdf` — Azure AI Engineer Associate (AI-102)
- `oracle-oci-ai-foundations.pdf` — OCI 2025 AI Foundations Associate
