# Hope Community SDA Church — Coming Soon

Temporary landing page for [hopesda.church](https://hopesda.church) while the full site is rebuilt.

- **Framework:** Astro 6 + Tailwind 4
- **Hosting:** Vercel (static output, `@astrojs/vercel` adapter)
- **Package manager:** pnpm (Node ≥ 22.12)

## Scripts

```sh
pnpm install       # install deps
pnpm dev           # local dev server
pnpm build         # wipe caches + production build to dist/
pnpm preview       # preview the built site
```

## Assets

The hero video, poster, and logo are loaded directly from the existing Webflow CDN — see `src/lib/const.ts` (`ASSETS`). No re-upload required.

## Contact

Church email: `info@hopesda.uk` (set in `src/lib/const.ts`).

## Deploy

Push to `main` → Vercel auto-deploys.

- **Install:** `pnpm install`
- **Build:** `pnpm build`
- **Output:** `dist`
