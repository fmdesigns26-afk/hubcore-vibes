# HubCore Vibes — Complete Cloudflare Package

This is a single static website package containing the rebuilt HubCore Vibes site, the Reality Switch showcase, local preview videos, artwork, and a founder-photo placeholder.

## Deploy to Cloudflare Pages
1. Open Cloudflare Dashboard → Workers & Pages.
2. Create a Pages application / upload assets (wording can vary by dashboard version).
3. Upload the contents of this ZIP as the site assets.
4. Make sure `index.html` is at the root of the deployed site.
5. Deploy.

## Add the founder photo later
Open the Founder section and use **Add my photo** to preview a photo in your browser. To make the photo permanent for all visitors, replace `assets/founder/founder-photo-placeholder.svg` with the desired image before redeploying.

## Notes
- Reality Switch is intentionally described as a separate game project.
- All video files are local assets in `assets/videos/`.
- The package does not require a backend to display the site.
