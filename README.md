# HubCore Vibes — Cloudflare Pages Package

This is a static Cloudflare Pages site containing the HubCore Vibes site, Reality Switch showcase, local preview videos, artwork, and the `/api/platform` Pages Function.

## Deploy to Cloudflare Pages
The production branch is `main`.

Build settings:
- Framework preset: `None`
- Build command: leave blank
- Build output directory: `.`
- Root directory: `/`
- Production branch: `main`
- Environment variables: none required

The `_redirects` file sends `www.hubcorevibes.com` to the canonical apex domain.

## Founder photo
The production Founder section uses the high-quality portrait at `assets/founder.jpg`. The image is loaded directly from the repository and the Founder layout is optimized for both desktop and mobile so the portrait remains sharp and correctly framed.

The Founder section displays Yutani Pretorius as Founder · Creator · Developer · Owner · Visionary, with South Africa shown beneath the title.

## Notes
- Reality Switch is intentionally described as a separate game project.
- All video files are local assets in `assets/videos/`.
- The package does not require a database or KV namespace. The platform function returns its built-in metrics when those services are not configured.
- `platform-api.js` is the browser-side integration boundary. Its placeholder methods can later be connected to Firebase, Supabase, Cloudflare D1/Workers, or WebSockets without changing the platform UI.
- Community posts and reactions currently use local browser storage and remain available as an offline preview until a service is connected.

## Deployment sync check
This commit is intentionally used to trigger the Cloudflare Pages Git integration so the latest `main` branch—including the current Founder photo and responsive portrait fixes—is published to production.
