# HM Portfolio — Static Site

A fully static, GitHub-Pages-ready version of Hussein Mohamed's portfolio.
No backend framework or server-side dependency is required.

## Deploying to GitHub Pages

1. Create a new GitHub repository (or use an existing one).
2. Upload **all files in this folder** to the root of the repository
   (`index.html` must sit at the repo root — not inside a subfolder).
3. Commit and push to the `main` branch.
4. In the repo, go to **Settings → Pages**.
5. Under **Build and deployment → Source**, choose **Deploy from a branch**.
6. Set **Branch** to `main` and folder to `/(root)`, then Save.
7. Wait 1–2 minutes — your site will be live at
   `https://<your-username>.github.io/<repo-name>/`.

That's it — every path in this project is relative, so it works whether
the site is hosted at the domain root or in a subfolder (like the default
`username.github.io/repo-name/` GitHub Pages URL).

## Structure

```
index.html            Home page
project1.html          Payroll Dashboard — full case study
project2.html          Marketing Dashboard — full case study
project3.html          Finance Dashboard — full case study
404.html               Custom "page not found" page
ANALYTICS.md           Full analytics documentation (read this before deploying)
.nojekyll               Tells GitHub Pages to skip Jekyll processing
assets/
  css/style.css         All styles
  js/config.js           Single-file config: GA4 ID, stats, availability, video labels
  js/script.js            Nav, loader, counters, back-to-top, availability badge
  js/particles-config.js  Animated particle background (performance-aware)
  js/music.js             Background music toggle
  js/filter.js             Portfolio project filtering (All/Excel/Power BI)
  js/analytics.js          GA4 event tracking (consent-gated, fails safely)
  js/consent.js            Analytics consent bar
  js/exit-feedback.js      Exit-intent star rating popup
  images/                 Photos & logo
  videos/                 Project demo videos
  music/                   Background music track
  cv/                      Downloadable CV (PDF)
```

## What's new (feature upgrade)

- **Live stats** — home page counters (dashboards showcased, case studies,
  tools used, years with Excel) driven from `assets/js/config.js`, using
  real numbers based on what's actually in this portfolio.
- **Interactive project cards** — hover reveals extra context and a
  "View Case Study" call-to-action; tool tags shown per project.
- **Case studies** — `project1.html` / `project2.html` / `project3.html`
  now include Problem / Objective / Approach / Tools / What I Built / Key
  Insights / Outcome, each clearly labeled "Personal / Portfolio Demo
  Project."
- **Hire Me CTA** — a dedicated banner above Contact, plus tracked buttons
  throughout the site, all linking to the existing contact section/methods.
- **Availability badge** — a small green-dot "Available for freelance
  projects" pill in the hero; toggle it in `config.js`.
- **Skills/tech stack** — expanded with icons and two more tools that were
  missing from the original grid (Power Query, Statistics) — nothing not
  already represented in the portfolio.
- **Download CV** — wired to a real CV file, with a tracked click event.
- **Project filtering** — All / Excel / Power BI, pure JavaScript.
- **Testimonials** — a ready-to-populate section, kept hidden (no fake
  reviews) until real testimonials exist. See the comment above it in
  `index.html`.
- **Easter egg** — a small "Built with data & coffee ☕" line in the footer.
- **Analytics** — a full, privacy-conscious Google Analytics 4 setup.
  **See [ANALYTICS.md](./ANALYTICS.md) for complete details, including how
  to set your GA4 ID.**
- **Exit feedback popup** — a subtle star-rating prompt, shown at most once
  every few days, with no personal data collected.

## What changed from the original Flask version

- All `url_for(...)` / Jinja templating removed — replaced with plain relative paths.
- Flask routes (`/project1`, `/project2`, `/project3`) replaced with real static
  pages (`project1.html`, `project2.html`, `project3.html`).
- Duplicated HTML (two `<body>` tags, duplicate footers, duplicate About/Skills/
  Portfolio sections, duplicate `id="portfolio"`) cleaned up into one coherent page.
- Missing CSS for the particle background, loading screen, and scroll-reveal
  animations was added (`#particles-js`, `#loader`, `.hidden`/`.show` had no
  rules before, so those effects previously did nothing).
- Back-to-top button now actually scrolls smoothly to the top (it only showed/
  hid before — no click handler existed).
- Music button and Back-to-top button no longer overlap on screen.
- Added a mobile hamburger menu (the nav links were simply hidden on phones
  with no way to open them before).
- Added a lightweight animated gradient + reduced-particle-count on mobile so
  the background stays smooth without hurting performance.
- Empty/unused files from the Flask app (`admin.html`, `login.html`, `.env`,
  the unrouted `prooject.html` template) were left out of the static build.

## Notes

- The three project videos are ~15–26 MB each — all comfortably under
  GitHub's 100 MB per-file limit, so a normal `git push` works fine.
- All animations (typing effect, particles, tilt effect, counters, scroll
  reveal) gracefully no-op if their CDN library fails to load, so a network
  hiccup on the CDN never breaks the rest of the page.
- Analytics is fully optional and consent-gated — declining it, or blocking
  it with an ad-blocker, does not affect any other part of the site.
- Before your first real deploy, open `assets/js/config.js` and set your
  real GA4 Measurement ID (see ANALYTICS.md).
