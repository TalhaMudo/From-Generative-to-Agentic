# QR Event Timeline

Static, mobile-first event timeline page for **From Generative to Agentic**.  
Designed for GitHub Pages + QR code access.

## Files

- `index.html` - page structure
- `styles.css` - styling
- `app.js` - timeline data + live status logic
- `assets/event-poster.png` - poster image
- `assets/logos/*.svg` - logo assets (editable placeholders)

## How live status works

- Event date is fixed in `app.js`:
  - `EVENT.dateISO = "2026-04-08"`
- Timezone is fixed to Istanbul:
  - `EVENT.timezone = "Europe/Istanbul"`
- Every minute, the page recalculates each session as:
  - `ongoing` (current)
  - `upcoming`
  - `completed`

## Edit sessions, speakers, links, logos

Open `app.js` and edit `seedSessionsFromPoster()`.

Each session uses this structure:

```js
{
  id: "panel",
  start: "15:55",
  end: "16:35",
  title: {
    tr: "Panel (2. Oturum): ...",
    en: "Panel (Session 2): ..."
  },
  speakers: [
    { name: "Speaker Name", profileUrl: "https://linkedin.com/in/..." }
  ],
  logos: [
    { fallbackText: "COMPANY", imageSrc: "./assets/logos/company.svg", alt: "Company logo" }
  ]
}
```

Notes:
- `profileUrl` is optional. If empty, speaker name appears as plain text chip.
- `imageSrc` is optional. If empty, `fallbackText` appears as text badge.
- Language toggle button switches all visible labels and session titles.

## Replace logos with official files

1. Put logo files into `assets/logos/` (SVG/PNG).
2. Update `imageSrc` in the related session.
3. Keep `fallbackText` as backup.

## Publish on GitHub Pages

1. Push this repository to GitHub.
2. In GitHub repo settings: **Pages**.
3. Source: `Deploy from a branch`.
4. Branch: `main` and folder: `/ (root)`.
5. Save and wait for publish URL.

## Attach QR code

Generate a QR code that points to your GitHub Pages URL, for example:

`https://<your-username>.github.io/From-Generative-to-Agentic/`

Use that QR in posters/slides so attendees can open the live flow instantly.
