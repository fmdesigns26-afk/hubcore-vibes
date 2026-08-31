# HubCore Vibes

HubCore Vibes keeps the existing futuristic dark/neon landing-page identity and now includes a real, shared early-community layer.

## What works after Cloudflare setup

- Public visitors can add a name and optional country, then post a real community comment.
- Comments are stored in Cloudflare D1 and visible to other visitors.
- Likes are database-backed and limited to one active like per anonymous browser visitor.
- Shares are recorded in D1.
- There are no public profiles or public account creation yet.
- Early Access requests collect private details for the future platform and can email the HubCore inbox without exposing that inbox in the page source.
- Investor enquiries are private and can go to the same hidden destination inbox.
- /admin.html provides a password-protected dashboard for comments, early-access requests and investor enquiries.
- The founder section uses assets/founder.jpg.
- Reality Switch no longer plays the existing videos in the page; the UI now shows a trailer-coming-soon state.

## Architecture

- Cloudflare Pages + Pages Functions
- Cloudflare D1 for shared community and request data
- Cloudflare Analytics Engine is supported by the ANALYTICS binding when configured
- Resend can deliver private contact notifications through RESEND_API_KEY
- Cloudflare Turnstile verification is ready server-side through TURNSTILE_SECRET
- Durable Objects are not required for Phase 1. The community refreshes every 15 seconds; later realtime WebSockets can be added without changing the data model.

## Database migration

Create the database:

    npx wrangler d1 create hubcore-vibes

Apply the production migration:

    npx wrangler d1 execute hubcore-vibes --remote --file=migrations/0001_real_community.sql

## Local development

Copy the example secrets:

    cp .dev.vars.example .dev.vars

Do not commit .dev.vars.

Then run:

    npm install
    npm run check
    npm test
    npm run dev

For Pages Functions, bind the D1 database as DB in Cloudflare Pages project settings before testing the live site.

## Required production secrets

- ADMIN_PASSWORD
- ADMIN_SESSION_SECRET
- RESEND_API_KEY
- CONTACT_TO_EMAIL
- CONTACT_FROM_EMAIL

Optional:

- TURNSTILE_SECRET

CONTACT_TO_EMAIL is only used on the server and is not exposed in the public HTML or JavaScript.

## Admin

Open:

    /admin.html

The page itself contains only the login screen. Dashboard API data requires the private admin password and a signed server-side session cookie.

## Important deployment note

The repository can be connected to Cloudflare Pages through GitHub, but adding D1 and secrets requires Cloudflare account access. Do not claim the community is live until:

1. D1 has been created.
2. The migration has run.
3. DB is bound to the Pages project.
4. Required secrets have been added.
5. The project has been redeployed and tested.
