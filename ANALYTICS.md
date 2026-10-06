# Analytics Guide — HM Portfolio

This site uses **Google Analytics 4 (GA4)**, loaded with no backend, no
server, and no build step — it works entirely as static files on GitHub
Pages.

Analytics only ever runs **after the visitor accepts the on-page consent
bar**. If they decline, or if GA4 is blocked by an ad-blocker, the rest of
the site keeps working normally — nothing depends on analytics loading.

---

## 1. Where the configuration lives

Everything is controlled from one file:

```
assets/js/config.js
```

```js
window.HM_CONFIG = {
  GA_MEASUREMENT_ID: "G-XXXXXXXXXX",   // <-- put your real GA4 ID here
  AVAILABLE_FOR_WORK: true,             // availability badge on/off
  STATS: [ ... ],                       // home page counters
  VIDEO_NAMES: { ... }                  // friendly names for video events
};
```

### How to get a GA4 Measurement ID
1. Go to [analytics.google.com](https://analytics.google.com) and create
   (or open) a GA4 property.
2. **Admin → Data Streams → Web** → create a stream for your GitHub Pages
   URL (e.g. `https://yourusername.github.io/repo-name/`).
3. Copy the **Measurement ID** — it looks like `G-XXXXXXXXXX`.
4. Paste it into `GA_MEASUREMENT_ID` in `assets/js/config.js`.
5. Commit and push. That's it — no other code changes needed.

Until you set a real ID, `analytics.js` detects the placeholder and simply
logs an info message to the console instead of loading GA4 — the site is
never broken by a missing ID.

---

## 2. How loading works (and why it's safe)

1. `consent.js` shows a small bar at the bottom of the page the first time
   a visitor arrives, asking to accept or decline analytics.
2. If **accepted**, it dispatches a `hm-analytics-consent-granted` event
   and remembers the choice in `localStorage` (not a cookie) so the bar
   won't show again.
3. `analytics.js` listens for that event, then dynamically injects the
   official `gtag.js` script tag and configures GA4.
4. If **declined**, GA4 never loads at all. The choice is remembered so the
   bar won't reappear.
5. Every tracking call goes through a `gtagSafe()` wrapper (and the global
   `window.hmTrack()` helper) that silently does nothing if `gtag` isn't
   defined — so a blocked/declined/failed script never throws a console
   error or breaks a button.

---

## 3. Tracked events

| Category | Event name | Fires when | Key parameters |
|---|---|---|---|
| Pageviews & sessions | *(automatic via GA4)* | Every page load | — |
| Section views | `section_view` | A `<section id="...">` scrolls into view (once per section per page load) | `section_id` |
| Scroll depth | `scroll_depth` | Visitor scrolls past 25/50/75/90/100% of the page (once each per page load) | `percent_scrolled` |
| Video start | `video_start` | A project video is played for the first time | `video_id`, `video_name` |
| Video progress | `video_progress` | Video crosses 10/25/50/75/90% (each fires once per video per page load) | `video_id`, `video_name`, `video_percent` |
| Video complete | `video_complete` | Video reaches the end | `video_id`, `video_name`, `video_percent: 100` |
| Portfolio filter | `portfolio_filter` | A filter button (All/Excel/Power BI) is clicked | `filter` |
| Hire Me clicks | `hire_me_click` | The CTA banner's "Hire Me" button, or a project card's "Hire Me" button | `link_label` |
| Contact clicks | `contact_click` | The hero "Contact Me" button | `link_label` |
| Email clicks | `email_click` | Any `mailto:` link (hero icon or Contact section) | `link_label` |
| LinkedIn clicks | `linkedin_click` | Any LinkedIn link | `link_label`, `link_url` |
| GitHub clicks | `github_click` | The GitHub icon in the hero | `link_label`, `link_url` |
| Fiverr clicks | `fiverr_click` | The Fiverr button in Contact | `link_label`, `link_url` |
| CV download | `cv_download` | The "Download CV" button | `link_label` |
| Project clicks | `project_click` | "View Case Study" buttons on the portfolio grid | `link_label` (project name) |
| **Conversion** | `generate_lead` | Automatically fired **in addition to** `hire_me_click`, `contact_click`, or `email_click` — this is the one to mark as a conversion in GA4 | `source_action` |
| Exit feedback | `site_rating` | Visitor picks a star rating in the exit popup | `rating` (1–5), `page` |

There is no separate "WhatsApp click" event because no WhatsApp link
currently exists in the portfolio — add one with
`data-analytics="whatsapp_click"` if you add a WhatsApp link later, and it
will be tracked automatically (see section 5).

### Marking the conversion in GA4
In **Admin → Events**, find `generate_lead` and toggle **Mark as
conversion**. This is GA4's standard recommended event name for lead
generation, so it's recognized by GA4's built-in reporting.

---

## 4. Video tracking details

Each project's `<video>` tag carries two data attributes:

```html
<video ... data-video-id="project1_payroll" data-video-name="Payroll Dashboard Walkthrough">
```

- `data-video-id` — a unique, stable identifier (never changes even if the
  displayed name does).
- `data-video-name` — a human-readable label sent with every event, so GA4
  reports are readable without cross-referencing IDs.

`assets/js/analytics.js` listens to each video's `play`, `timeupdate`, and
`ended` events and tracks milestones (10/25/50/75/90/100%) using a `Set` per
video, so **no milestone or the start event can fire twice**, even if the
visitor rewinds and rewatches.

To add a new tracked video later, just add the same two `data-*`
attributes to any `<video>` tag — no JavaScript changes needed.

---

## 5. Adding new trackable buttons/links

Add `data-analytics="your_event_name"` to any link or button:

```html
<a href="https://wa.me/201034656729" data-analytics="whatsapp_click">WhatsApp</a>
```

Optionally add `data-analytics-label="..."` for a custom label; otherwise
the link's visible text is used automatically. No JavaScript edits needed.

---

## 6. Privacy

This implementation intentionally does **not** collect:

- Names, emails, phone numbers, or any other personal identifiers
- Passwords or form contents
- Written exit-feedback text (see below)
- Anything via browser fingerprinting

What GA4 *does* collect is its own standard, aggregated, anonymous data:
device category, browser, operating system, approximate/general geographic
region, and traffic-source information. This is normal, industry-standard
web analytics — Google's own systems, not this codebase, are responsible
for how that data is aggregated and anonymized. This project does not, and
cannot, use analytics to identify a specific visitor's real-world identity.

**GA4 config used:** `anonymize_ip: true`, `allow_google_signals: false`,
`allow_ad_personalization_signals: false` — these disable Google's
advertising-signal features and request IP anonymization at the analytics
layer.

**Consent bar:** Google Analytics can be considered to set/require cookies
depending on your configuration and your visitors' jurisdiction (e.g. GDPR
in the EU/UK). This project ships a simple accept/decline bar
(`consent.js`) that gates GA4 entirely behind visitor consent, using
`localStorage` (not a cookie) purely to remember the choice. If you have
specific legal requirements for your audience, review them with your own
judgment — this implementation is a reasonable, privacy-conscious default,
not legal advice.

**Exit feedback text:** The exit-rating popup lets visitors optionally type
a short comment. That text is **never sent anywhere** — not to analytics,
not to any server (this site has none) — it is discarded the moment the
popup closes. Only the numeric 1–5 star rating is sent to analytics, as the
`site_rating` event.

---

## 7. How to test analytics locally

1. Set a real `GA_MEASUREMENT_ID` in `assets/js/config.js` (a test/dev GA4
   property works fine).
2. Serve the folder locally, e.g.:
   ```bash
   npx serve .
   ```
   then open `http://localhost:8000`.
3. Accept the consent bar.
4. Open your browser's DevTools → Network tab, filter for `collect` or
   `google-analytics` — you should see requests firing as you scroll,
   click buttons, and play videos.
5. In GA4, use **Admin → DebugView** (you can enable debug mode by adding
   `?debug_mode=true` to your local URL, or by installing the official
   [Google Analytics Debugger](https://chromewebstore.google.com/detail/google-analytics-debugger)
   browser extension) to see events arrive in real time.

---

## 8. Where to view the reports

Once GA4 is receiving data (usually within a few minutes to 24–48 hours for
full reports):

- **Realtime** — Google Analytics → Reports → Realtime — see active
  visitors and events as they happen.
- **Engagement → Events** — every custom event listed above, with counts.
- **Engagement → Pages and screens** — which pages/sections get the most
  traffic.
- **Acquisition → Traffic acquisition** — Direct / Organic / Social /
  Referral / Campaign(UTM) breakdown, automatically detected by GA4 from
  standard referrer and UTM parameters — no extra code needed.
- **Tech → Tech details** — device category, browser, OS, screen
  resolution.
- **Admin → Conversions** — once `generate_lead` is marked as a
  conversion, it appears here and in most acquisition/engagement reports.

---

## 9. Quick checklist after deploying

- [ ] Real `GA_MEASUREMENT_ID` set in `assets/js/config.js`
- [ ] Consent bar tested (accept + decline both work)
- [ ] `generate_lead` marked as a conversion in GA4 Admin
- [ ] Realtime report shows your own test visit
- [ ] Video events appear when playing a project video
