# HeartPop ❤️

Little Surprises, Big Smiles! A frontend-only React application for personal letters, real scratch cards, conversation roulette, custom quizzes, and message cards.

## Run locally

Requires Node.js 22.12+ (tested with Node 24) and npm. No paid keys, database, or account is needed.

```sh
npm ci
npm run dev
```

On Windows PowerShell with script execution disabled, use `npm.cmd` and `npx.cmd`. Open the URL printed by Vite. Localhost links only work on the same computer; deploy the static build to share with another device.

```sh
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm run preview
```

The Playwright configurations automatically select the correct npm executable for Windows or other hosts. Run `npm run test:pwa` after a production build to verify offline caching.

## Features and architecture

- React, TypeScript, Vite, Tailwind CSS, Motion, Lucide, React Router, Zod.
- Original SVG illustrations, self-hosted Nunito, mobile navigation, reduced motion, semantic forms, visible focus, and keyboard reveal alternatives.
- `src/pages/Experience.tsx`: creator, preview, share, recipient, and quiz-result routes. Edit the preview without losing the composed payload. Explicit on-device draft save/restore/delete.
- `src/components/Interactive.tsx`: envelope reveal and pointer-driven Canvas scratch overlay. Alpha coverage is measured on pointer release; 60% clears the rest.
- `src/pages/Roulette.tsx`: cryptographic random selection with rejection sampling, matching wheel landing, replay and completion.
- `src/lib/share.ts`: versioned, strict schemas; UTF-8 URL-safe Base64; 7,500-character token limit; bounded fields; safe text rendering. Legacy v1 links remain supported.
- `src/i18n`: reusable five-language homepage copy and curated message templates in English, Hindi, Gujarati, Hinglish, and Roman Gujarati. The language selector changes templates; creator controls and legal copy currently use English. Hindi and Gujarati use the device’s script fonts.
- Hash routes work on static hosting and preserve the payload across devices. No localStorage dependency for recipients. Answers are included in quiz links: this is a friendly game, not tamper-proof testing.
- A generated Workbox service worker precaches app routes, feature chunks, fonts, and icons for offline access after the first successful online load. New workers wait for old tabs to close before activation to reduce mixed-version problems. Manifest includes 192px and 512px PNG icons. Installation requires HTTPS (or localhost) and browser support.

## Privacy and security

Surprises are encoded, **not encrypted**. Anyone with a URL can decode it; links can be forwarded or recorded in history, clipboard managers, or screenshots. There is no remote revocation. Do not include sensitive information. No account, trackers, uploads, analytics, or message database. Reactions stay on the recipient’s screen and are not delivered to the sender.

Content is rendered as React text; no HTML injection, eval, or dynamic scripts. Malformed/oversized links are rejected before decoding. The document has a restrictive CSP. In production configure response headers too: `Content-Security-Policy` (including `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and HTTPS/HSTS where supported. Development permits local Vite WebSocket connections. Hosting providers and optional sharing services have their own privacy practices.

## Static deployment

Run `npm run build`, then deploy the contents of `dist/` to an HTTPS static host. `base: './'` and hash routing support subdirectories without history rewrites. Do not deploy source files, node_modules, or test artifacts. No server runtime or secrets are needed.

For GitHub Pages, enable Pages with a GitHub Actions deployment that installs dependencies with `npm ci`, runs checks, builds, and uploads `dist` using the official Pages artifact/deployment actions. Other static hosts can use build command `npm run build` and output directory `dist`. Review your chosen provider’s current free-tier terms and quotas; custom domains and hosting may incur costs. Do not promise unlimited free hosting.

## Licenses

Runtime packages: React/React DOM, Motion, React Router, Zod (MIT); Lucide (ISC); Nunito (SIL OFL 1.1). Toolchain packages primarily use MIT, TypeScript and Playwright use Apache-2.0, axe-core uses MPL-2.0, patched glob/minimatch use BlueOak-1.0.0. Licenses were checked in npm before installation; preserve dependency notices when redistributing. Original illustrations use no third-party stock assets. `package-lock.json` pins the verified graph. Run `npm audit` regularly; security overrides patch build-time glob/minimatch vulnerabilities.

## Verification and release checklist

Unit tests cover Unicode payload round trips, malformed and oversized tokens, schema rejection, text safety, quiz scoring, randomness bounds, and envelope replay. Playwright covers desktop/mobile creation, fresh-browser sharing, scratch gestures, accessible reveal, quiz scoring, reduced-motion roulette, custom messages, malformed links, keyboard focus, and horizontal overflow. Axe checks representative pages.

Before a broad public launch, test real iOS/Safari and Android installation, physical-device touch behavior, external WhatsApp delivery, and the chosen host’s response headers. Automated checks do not establish full WCAG compliance. Lighthouse scores must be measured, not assumed. Full interface localization and independent legal/accessibility review remain follow-up work.

### Latest verification — 22 November 2026

- TypeScript production build and ESLint: passed.
- Vitest: 12 tests passed.
- Playwright: 16 desktop/mobile tests passed, including six-page axe scans and automatic scratch completion.
- Production offline PWA test: passed.
- npm audit: zero vulnerabilities in the locked dependency graph at verification time.
- Desktop and mobile homepage screenshots reviewed.
- Hosting upload is pending explicit approval; no deployment has been published.

## Optional AI message ideas (Google Gemini, free tier)

The creator form can suggest 3 messages with AI. The Gemini key lives in a small
Cloudflare Worker (`worker/`), never in the browser. Only the experience type,
occasion, feeling, language and an optional short note are sent — never names.
If the free quota runs out, the site shows ready-made template ideas instead.

1. Get a free API key at [Google AI Studio](https://aistudio.google.com/apikey).
2. Create a free [Cloudflare](https://dash.cloudflare.com/sign-up) account.
3. Deploy the worker:
   ```bash
   cd worker
   npx wrangler login
   npx wrangler secret put GEMINI_API_KEY   # paste the AI Studio key
   npx wrangler deploy                      # prints https://heartpop-ai.<you>.workers.dev
   ```
4. In `worker/wrangler.toml`, add your live site origin to `ALLOWED_ORIGINS`
   (e.g. `https://yourname.github.io`) and run `npx wrangler deploy` again.
5. Copy `.env.example` to `.env.local`, set `VITE_AI_ENDPOINT` to the worker URL,
   then `npm run dev` or `npm run build`. The build adds the worker to the CSP.

Leave `VITE_AI_ENDPOINT` unset to turn the AI box off. Check your model's free
limits in AI Studio; set `GEMINI_MODEL` in `wrangler.toml` to pin a model.
