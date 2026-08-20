# HubCore Vibes — Cloudflare Pages Package

This is a static Cloudflare Pages site containing the HubCore Vibes site, Reality Switch showcase, local preview videos, artwork, and the `/api/platform` Pages Function.

## Deploy to Cloudflare Pages
Use the GitHub Pages deployment described in the project handoff. The production branch is `main`.

Build settings:
- Framework preset: `None`
- Build command: leave blank
- Build output directory: `.`
- Root directory: `/`
- Production branch: `main`
- Environment variables: none required

The `_redirects` file sends `www.hubcorevibes.com` to the canonical apex domain.

## Add the founder photo later
Upload the real image to the repository at `assets/founder.jpg` and commit it to `main`. The Founder section references that path. Until the file is uploaded, the existing placeholder is used as a local fallback so the deployed page does not show a broken image.

The **Add my photo** control only previews an image in the current browser; it does not upload anything to GitHub or Cloudflare.

## Notes
- Reality Switch is intentionally described as a separate game project.
- All video files are local assets in `assets/videos/`.
- The package does not require a database or KV namespace. The platform function returns its built-in metrics when those services are not configured.
- `platform-api.js` is the browser-side integration boundary. Its placeholder methods can later be connected to Firebase, Supabase, Cloudflare D1/Workers, or WebSockets without changing the platform UI.
- Community posts and reactions currently use local browser storage and remain available as an offline preview until a service is connected.
