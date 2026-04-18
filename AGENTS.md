# Project Rules — Astro + React + Tailwind + Sanity + Vercel

Generic rulebook for any site on this stack. Every rule here is from a pitfall hit in production. Read it before touching anything — it exists to keep the build green on Vercel every single time.

---

## Stack

- **Framework:** Astro `^6.x` (static output + `@astrojs/vercel` adapter for `/api` routes only)
- **UI:** React 19 + Tailwind 4 (`@tailwindcss/vite`, **not** PostCSS) + shadcn/ui
- **CMS:** Sanity `@sanity/client` v7 — with CSV/JSON fallbacks at build time
- **Hosting:** Vercel — **Pro plan required if `maxDuration > 10`**
- **Package manager:** `pnpm` **only** — never `npm` / `yarn`
- **Node:** `>=22.12.0` (pin in `package.json` `engines`)
- **Path alias:** `@/*` → `./src/*` in `tsconfig.json`

---

## Critical rules — read before every task

### 1. Never use `next/link`, `next/image`, or `'use server'`
This is Astro. Use plain `<a href="">` and `<img>` / `<picture>`. If a shadcn install drags in `next/*` imports, strip them immediately. Keep a `scripts/convert-component.sh` that runs `sed` to remove `import Link from 'next/link'` / `import Image from 'next/image'` and rewrite `<Image …>` → `<img …>`.

### 2. Commit before every `shadcn add`
```sh
git add -A && git commit -m "chore: checkpoint before shadcn install"
pnpm dlx shadcn@latest add <component>
git diff --name-only
git checkout HEAD -- <any hand-tuned file shadcn overwrote>
```
shadcn routinely overwrites `header.tsx`, `footer.tsx`, `logo.tsx`, and anything it thinks is "its own". Checkpoint is non-negotiable.

### 3. Header and Footer always render from the `.astro` page
**Never** put `<Header />` or `<Footer />` inside a React component. They must be rendered from the `.astro` file — e.g. `<Header client:load />`. Nesting them inside React creates `maskImage` / `transform` stacking contexts that silently break `position: fixed`.

### 4. Every file in `src/pages/api/*` needs `export const prerender = false`
Without it, Astro tries to statically render the route at build time and you get `FUNCTION_INVOCATION_FAILED` in production. Put it at the **very top** of the file, before imports.

### 5. Fixed header uses a very high z-index (e.g. `z-[9000]`)
Nothing should exceed it except lightboxes/modals. Shader/background canvases should sit at `z-index: -1` inside an `isolation: isolate` parent.

### 6. Shader/background stacking pattern
Any page with a full-bleed WebGL/canvas background:
```jsx
<div style={{ backgroundColor: BRAND_DARK, isolation: 'isolate' }}>
  {/* Shader — fixed, behind, pointer-events:none, z-index:-1 */}
  <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}>
    <Shader />
  </div>
  <Header client:load />
  {/* content — no z-index needed, stacking context handles it */}
</div>
```
Without `isolation: isolate` on the parent, the shader bleeds above content on Safari.

### 7. Centralise brand tokens
Hard-coded colours (carousel fades, overlays, gradients) drift fast. Keep one source of truth — either CSS variables in `global.css` or a `src/lib/const.ts` export — and reference it everywhere. Dark mode via `<html class="dark">` in the base layout.

### 8. Do not import from Next.js legacy paths
If the project was scaffolded from a next-forge / Relume / Next.js starter, expect orphan code:
- `src/app/` with route groups (`(marketing)`, `(home)`)
- `src/lib/actions.ts` using `'use server'` + `next: { revalidate: N }`
- `src/lib/sanity-client.ts` using `next-sanity`
- Any file importing from `next/link`, `next/image`, `next/navigation`

Nothing in an Astro build imports these, but agents "helpfully" copy their patterns. **Delete them or add a top-of-file `/* UNUSED — DO NOT IMPORT */` banner.** Same goes for `next-sanity` / `next-mdx-remote` in `package.json` — remove them once the orphaned files are gone.

---

## Build pipeline (Vercel)

### `pnpm build` should wipe caches first
```json
"build": "rm -rf node_modules/.vite node_modules/.cache .astro dist && astro build"
```
Vite/Astro caches silently corrupt across dep bumps and produce cryptic `esbuild` / `Cannot find module` failures. The cache wipe is defensive — don't remove it without a concrete reason.

### Install: `pnpm install`
For native-dep-heavy projects (Sharp, esbuild, shader libs), `.npmrc` should contain:
```
enable-pre-post-scripts=true
```
and `package.json` should allow postinstall builds:
```json
"pnpm": {
  "onlyBuiltDependencies": ["esbuild", "sharp", "msw"]
}
```
Both are required for Vercel to compile native binaries on install. Mirror them in Vercel's install command if you override it.

### Output: `dist/` (static) + Vercel Functions for `/api/*`
- Static output deploys to Vercel's edge
- Any file in `src/pages/api/` becomes a Node serverless function
- `maxDuration` in `astro.config.mjs` applies to **all** SSR/API routes
- Hobby plan caps at 10s → anything >10s needs Vercel **Pro**

### `vercel.json` with BotID/other proxies
If you use Vercel BotID, keep the opaque UUID rewrites — client scripts hardcode those paths. Don't rename.

### Never commit `.vercel/`
It's in `.gitignore` for a reason. If it sneaks in, Vercel detects prebuilt output and skips a fresh build, producing stale deploys.

---

## Environment variables

### Read via a dual-source helper — never `process.env` directly
Astro populates `import.meta.env` in dev (including non-`PUBLIC_` vars for SSR code), but Vite does **not** populate `process.env` for non-public keys locally. Vercel exposes everything on `process.env` at runtime. Result: read both.

```ts
// src/lib/env.ts
export function env(key: string): string | undefined {
  const meta = (import.meta as any).env
  return meta?.[key] ?? process.env[key]
}
```
Always import from `@/lib/env` inside API routes. `process.env.FOO` works in Vercel prod and silently returns `undefined` in `astro dev`.

### Naming
- `PUBLIC_*` — exposed to the client bundle (Sanity project IDs, public flags)
- Anything else — server-only (API keys, secrets)

### Document every var in README or here
Missing env docs = inevitable "works locally, 500s in prod". Every new var should land with a one-line description of what it's for and whether it's required.

---

## Architecture

### Recommended directory map
```
your-site/
├── astro.config.mjs        # Vercel adapter, redirects, integrations
├── vercel.json             # Any platform-level rewrites/headers
├── components.json         # shadcn config
├── src/
│   ├── pages/              # Routes (.astro files)
│   │   ├── api/            # Node serverless fns (prerender = false)
│   │   └── [dynamic]/
│   ├── layouts/Base.astro  # <html>, meta, JSON-LD, analytics, smooth scroll
│   ├── components/
│   │   ├── header.tsx, footer.tsx, logo.tsx   # DO NOT let shadcn overwrite
│   │   ├── blocks/         # Heroes, carousels, shaders, section blocks
│   │   ├── pages/          # Page-shell React components per route
│   │   └── ui/             # shadcn primitives
│   ├── lib/
│   │   ├── queries.ts      # Sanity GROQ + fallbacks
│   │   ├── sanity.ts       # Lazy Sanity client singleton
│   │   ├── env.ts          # Dual-source env reader
│   │   ├── parse-*-csv.ts  # CSV parsers for offline fallbacks
│   │   └── const.ts        # Brand tokens, enums
│   ├── sanity/schemaTypes/ # Studio schemas
│   ├── data/               # CSV + JSON fallbacks
│   ├── hooks/
│   └── styles/global.css   # Tailwind 4 + shadcn + fonts + theme tokens
├── public/                 # Static assets
└── scripts/convert-component.sh   # Strip next/link + next/image
```

### Page pattern
```astro
---
import Base from '../layouts/Base.astro'
import Header from '../components/header'
import Footer from '../components/footer'
import MyPage from '../components/pages/MyPage'
---
<Base title="…" description="…" faq={optionalFaqArray}>
  <Header client:load />
  <MyPage client:load />
  <Footer />
</Base>
```

### Lazy, singleton Sanity client
Don't create the client at module-load time — it'll crash the build on environments without the env vars set. Lazy-init on first call:
```ts
let _client: SanityClient | null = null
export function getSanityClient() {
  if (!_client) {
    const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID
    if (!projectId) throw new Error('PUBLIC_SANITY_PROJECT_ID not set')
    _client = createClient({ projectId, dataset: …, apiVersion: '…', useCdn: true })
  }
  return _client
}
```

### Sanity → CSV fallback pattern (mandatory)
All data fetching in `.astro` frontmatter must be wrapped:
```astro
---
let items = []
try {
  items = await getSomething()
} catch (e) {
  console.warn('[Sanity] fallback:', e)
}
---
```
For dynamic routes, also wrap `getStaticPaths` — **a thrown error there fails the entire build**:
```astro
export async function getStaticPaths() {
  try {
    const items = await getSanityThings()
    if (items.length) return items.map(…)
  } catch (e) { console.warn('[Sanity] fallback:', e) }
  return parseCSV().map(…)   // always provide a fallback source
}
```

### Hydration directives — use the right one
- `client:load` — components needing JS on first paint (header, interactive heroes)
- `client:visible` — below-the-fold sections (carousels, testimonials) — big TTI win
- `client:idle` — non-critical background behaviour
- Default (no directive) — server-rendered, zero JS. Prefer this whenever possible.

### Component reuse — check before creating
Keep an inventory of shared building blocks (hero variants, carousels, CTAs, shaders, chip strips, feature cards). Document them at the top of the file and re-export from a single entrypoint when sensible.

---

## SEO & meta

- Base layout should accept `title`, `description`, `ogImage`, `canonicalUrl`, `noIndex`, `faq?`
- Inject `FAQPage` JSON-LD when `faq` is passed
- Inject Organisation / ProfessionalService JSON-LD once, in the base layout
- `@astrojs/sitemap` for `/sitemap-index.xml`; add a `/sitemap.xml` → `/sitemap-index.xml` redirect in `astro.config.mjs`
- Filter private/client pages out of the sitemap (`sitemap({ filter: page => !page.includes('/private/') })`) and mark them `noIndex`
- Analytics: prefer a self-hosted proxy domain (e.g. reverse-proxied Plausible) to survive adblockers

---

## Deployment

- **Auto-deploy:** Push to `main`
- **Branch previews:** Every PR gets a preview URL from Vercel
- **Never commit:** `.vercel/` output directory
- **Install command (Vercel):** `pnpm install`
- **Build command (Vercel):** `pnpm build`
- **Output directory:** `dist`
- **Env vars:** Set in Vercel dashboard → Project → Settings → Environment Variables (Production, Preview, Development)

---

## Common mistakes to avoid

| Mistake | Fix |
|---|---|
| `next/link` / `next/image` after shadcn install | Remove — use `<a>` / `<img>`. Run `scripts/convert-component.sh <file>` |
| Importing from `src/app/*` or a `'use server'` file | Dead Next.js code — ignore or delete. Use your Astro pages + Sanity queries instead |
| Header/Footer inside a React component | Move to the `.astro` page file |
| shadcn overwrote `header.tsx` / `footer.tsx` / `logo.tsx` | `git checkout HEAD -- <file>` |
| `FUNCTION_INVOCATION_FAILED` on API route | Add `export const prerender = false` at top of route |
| Committing `.vercel/` output | In `.gitignore` — don't force-add |
| `fixed` element disappearing behind shader | Parent needs `isolation: isolate`, shader `z-index: -1` |
| Mobile nav not opening | Check for `overflow-hidden` applied when menu should be open |
| Radix dropdown appearing top-left | `NavigationMenuViewport` must be `absolute left-0 top-full` |
| Build fails after dep bump | `rm -rf node_modules .astro dist && pnpm install` (the build script already wipes most of this) |
| `getStaticPaths` throws on Sanity → whole build dies | Wrap in `try/catch` **with a concrete fallback** (CSV or `[]`) |
| Env var works locally, undefined in prod | Read via `env()` helper, not `process.env` directly |
| API route times out at 10s | Vercel plan is Hobby — bump `maxDuration` only works on Pro |
| Missing Sanity env var 500s the build | Lazy-init the client + wrap queries in `try/catch` |
| Sharp / esbuild postinstall skipped on Vercel | Add `pnpm.onlyBuiltDependencies` + `enable-pre-post-scripts=true` in `.npmrc` |
| Stale deploys after merge | `.vercel/` leaked into git — remove it, force a fresh build |
