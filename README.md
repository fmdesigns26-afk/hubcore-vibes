# HubCore Vibes — Live Community Early Access

The existing futuristic HubCore Vibes landing page remains intact. This phase replaces browser-only demo community activity with a real Cloudflare-backed community wall.

## What works after Cloudflare configuration
Visitors can leave a public community comment without creating a profile, like and share comments, and see activity created by other visitors globally. They can also request early access or send an investor enquiry without seeing the destination email address.

Contact requests are stored in D1 and visible to the private /admin dashboard. Optional email delivery uses Cloudflare secrets.

## Required Cloudflare resources
- Cloudflare Pages project connected to main
- D1 database bound as DB
- Analytics Engine dataset bound as ANALYTICS
- ADMIN_PASSWORD secret
- ADMIN_SESSION_SECRET secret

## Optional
- Turnstile: TURNSTILE_SECRET_KEY and TURNSTILE_REQUIRED=true
- Resend: RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL
- R2 for future profile/media uploads
- Queues for future background processing

## Commands
npm install
npx wrangler d1 migrations apply hubcore-vibes --remote
npm test
npm run check

For local development:
npx wrangler pages dev .

Do not expose real email addresses in HTML or JavaScript. Contact requests go through /api/contact.
