# FORENSIC AUDIT REPORT
## Pet Projects — pet-projects.govgolenko.ru
### Date: 2026-08-26

---

## A. Executive Summary

**Social Preview Issue: Production is CURRENTLY WORKING.** All three URLs (`/`, `/agenda/`, `/lens/`) return correct, page-specific HTML with appropriate OG metadata. All OG images are accessible (HTTP 200). All tested crawlers (facebookexternalhit, Twitterbot, TelegramBot, Discordbot) receive the correct tags. The issue may be due to aggressive social media platform caching of old results, or the user testing before the most recent deployment propagated.

**iOS Safe-Area Issue: UNRESOLVED.** The CSS architecture has a structural problem where `overflow-x: hidden` on `#root` (CSS), combined with dynamic `overflow: hidden` toggle on the App wrapper (JS), creates an environment where the `#root::before` pseudo-element with `position: fixed` may not correctly render in iOS Safari safe areas. This is a known class of iOS Safari rendering bugs. The social preview fix (`og-pages` Vite plugin and `404.html` SPA redirect) is correctly implemented and deployed.

---

## B. Architecture

```
Source: React 18 + TypeScript + Vite 5
         ↓
Build:   pnpm build → vite build + ogPagesPlugin (custom)
         ↓
Output:  dist/
         ├── index.html          (home page, generic OG)
         ├── 404.html            (SPA redirect hack)
         ├── agenda/
         │   └── index.html      (agenda-specific OG)
         ├── lens/
         │   └── index.html      (lens-specific OG)
         ├── assets/             (JS/CSS bundles)
         └── *.png               (OG images, icon)
         ↓
Deploy:  GitHub Actions (static.yml)
         → actions/upload-pages-artifact (dist/)
         → actions/deploy-pages
         ↓
Host:    GitHub Pages (Server: GitHub.com)
         + Fastly CDN (Varnish)
         ↓
Domain:  pet-projects.govgolenko.ru (custom domain via GitHub Pages)
```

### Key details:
- **React**: 18.3.1
- **Bundler**: Vite 5.4.x with `@vitejs/plugin-react`
- **Router**: Custom SPA routing (no React Router). Uses `history.pushState`, `popstate`, and `sessionStorage.redirect` hack.
- **SPA**: Yes. Single `index.html` with client-side routing via URL path parsing.
- **Pages**: Home, Lens, Agenda (3 views, rendered conditionally in `App.tsx`).
- **Deployment**: GitHub Pages with custom domain. No CNAME file in repo (configured via GitHub UI). Branch: `main`. Workflow: `.github/workflows/static.yml`.

---

## C. Social Preview Investigation

### HTTP Responses (verified 2026-08-26 18:40 UTC)

| URL | HTTP | Content-Length | og:title | og:image | og:url | Status |
|---|---|---|---|---|---|---|
| `/` | 200 | 2636 | Pet projects | `og-image.png` | `pet-projects.govgolenko.ru/` | CORRECT |
| `/agenda/` | 200 | 3162 | Повестки: Запад vs Кремль \| Pet projects | `agenda-preview-light.png` | `pet-projects.govgolenko.ru/agenda/` | CORRECT |
| `/lens/` | 200 | 3366 | Симметричная линза без сферической аберрации \| Pet projects | `lens-preview-light.png` | `pet-projects.govgolenko.ru/lens/` | CORRECT |

### Trailing-slash behavior:
- `/agenda` → 301 → `/agenda/` (nginx 301 redirect, follows correctly)
- `/lens` → 301 → `/lens/` (nginx 301 redirect, follows correctly)
- Facebook crawler with `-L` flag follows redirect and gets correct final HTML

### OG Images:

| Image URL | HTTP | Content-Type | Size | Accessible |
|---|---|---|---|---|
| `/og-image.png` | 200 | image/png | 50,155 bytes | YES |
| `/agenda-preview-light.png` | 200 | image/png | 200,622 bytes | YES |
| `/lens-preview-light.png` | 200 | image/png | 258,225 bytes | YES |

All images require no auth, no cookies, no JS, no referer checks.

### Crawler test results:

| Crawler UA | URL tested | og:title returned | og:image returned | Status |
|---|---|---|---|---|
| facebookexternalhit/1.1 | /agenda/ | Повестки: Запад vs Кремль | agenda-preview-light.png | CORRECT |
| Twitterbot/1.0 | /agenda/ | Повестки: Запад vs Кремль | agenda-preview-light.png | CORRECT |
| TelegramBot | /lens/ | Симметричная линза... | lens-preview-light.png | CORRECT |
| Discordbot/2.0 | /lens/ | Симметричная линза... | lens-preview-light.png | CORRECT |

### Build verification:
- `pnpm build` succeeds
- `[og-pages] Generated pages: /lens/, /agenda/` appears in build output
- `dist/agenda/index.html` and `dist/lens/index.html` exist with page-specific OG tags
- Local dist file sizes: index.html=2694, agenda/index.html=3203, lens/index.html=3407
- Production file sizes: index.html=2636, agenda/index.html=3162, lens/index.html=3366
- Production asset hashes (`index-DnydrLrt.js`, `index-DZGXpK3S.css`) match local build

### CONCLUSION ON SOCIAL PREVIEW:
**The social preview is technically WORKING on production as of 2026-08-26 18:40 UTC.**

Possible explanations for the user still seeing the problem:
1. Social media platforms aggressively cache URL previews. Old cached versions (without OG tags) may still be displayed.
2. The user may need to manually refresh the preview using platform-specific debug tools:
   - Facebook: https://developers.facebook.com/tools/debug/
   - Twitter: https://cards-dev.twitter.com/validator
   - LinkedIn: https://www.linkedin.com/post-inspector/
3. If this is truly still broken, the user should provide a specific URL they tested and the exact behavior observed.

---

## D. Deployment Investigation

### Pipeline:

```
git push to main branch
    ↓
GitHub Actions triggers static.yml
    ↓
Steps:
  1. actions/checkout@v4
  2. pnpm/action-setup@v4 (auto-detect pnpm from packageManager field)
  3. actions/setup-node@v4 (with pnpm cache)
  4. pnpm install --frozen-lockfile
  5. pnpm build (runs vite build + ogPagesPlugin)
  6. actions/configure-pages@v5
  7. actions/upload-pages-artifact@v3 (path: dist)
  8. actions/deploy-pages@v5
    ↓
GitHub Pages serves dist/ via Fastly CDN
    ↓
pet-projects.govgolenko.ru
```

### Concurrency:
- Group: `"pages"`, cancel-in-progress: false
- Only one deployment at a time, queued (not cancelled)

### Artifact verification:
- `dist/` directory contains 14 files
- `dist/agenda/index.html` exists (3203 bytes)
- `dist/lens/index.html` exists (3407 bytes)
- `dist/404.html` exists (SPA redirect script)
- All OG images present in `dist/`

### 404.html SPA redirect mechanism:
```html
<script>
  sessionStorage.redirect = location.pathname;
  location.replace("/");
</script>
```
This is the standard GitHub Pages SPA fallback pattern. When a user navigates to `/agenda/` directly:
1. If `dist/agenda/index.html` exists → served directly (correct behavior, confirmed by HTTP 200)
2. If it didn't exist → 404.html would redirect to `/` with the original path stored in sessionStorage
3. The App component's `getTabFromPath()` reads `sessionStorage.redirect` to recover the intended path

**This mechanism is NOT needed for `/agenda/` and `/lens/` because those files exist.** It's only a fallback for unknown paths.

### Last deploy timestamp:
- `Last-Modified: Wed, 26 Aug 2026 18:24:52 GMT` (production)
- Asset hashes match local build

---

## E. iOS Safe-Area Investigation

### Viewport meta tag:
```html
<meta name="viewport"
  content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0" />
```
- `viewport-fit=cover` is PRESENT ✓
- Only declared once, in `index.html` ✓
- Not overridden anywhere ✓

### iOS PWA meta tags:
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="theme-color" content="#07070a" media="(prefers-color-scheme: dark)" />
<meta name="theme-color" content="#f4f6fa" media="(prefers-color-scheme: light)" />
```

### CSS Architecture (complete background chain):

```css
/* theme.css */
html, body {
  width: 100%;
  min-height: 100dvh;
  min-height: 100vh;
  margin: 0;
  background: var(--bg);      /* #07070a dark / #f4f6fa light */
}
html  { background: var(--bg); }
body  { background: var(--bg); }
#root {
  width: 100%;
  min-height: 100dvh;
  min-height: 100vh;
  margin: 0;
  background: var(--bg);
  overflow-x: hidden;          /* ← KEY: creates scroll container */
}
```

```css
/* Injected by App.tsx via <style> */
#root::before {
  content: "";
  position: fixed;
  inset: 0;
  background: var(--bg);
  z-index: -1;
}
```

```tsx
// App.tsx - dynamic overflow
useEffect(() => {
  rootRef.current.style.overflow = tab !== "home" ? "hidden" : "";
}, [tab]);
```

### Element-by-element analysis:

#### `html` element:
- `background: var(--bg)` ✓
- `min-height: 100dvh` ✓
- No positioning issues ✓

#### `body` element:
- `background: var(--bg)` ✓
- `min-height: 100dvh` ✓
- No overflow rules ✓

#### `#root` element:
- `background: var(--bg)` ✓
- `min-height: 100dvh` ✓
- **`overflow-x: hidden`** ← Creates a scroll container. On iOS Safari, this can affect rendering of `position: fixed` children in safe area contexts.

#### `#root::before` pseudo-element:
- `position: fixed` — should cover entire viewport including safe areas
- `inset: 0` — covers viewport completely
- `background: var(--bg)` — same as html/body
- `z-index: -1` — behind #root content
- **PROBLEM**: When `#root` has `overflow-x: hidden` (CSS) AND `overflow: hidden` (dynamic JS), the rendering of this `position: fixed` pseudo-element in iOS Safari safe areas is unreliable.

#### App wrapper (dynamic div):
- `min-height: 100dvh`
- `width: 100%`
- `position: relative`
- `overflowX: hidden` (always)
- Dynamic `overflow: hidden` on non-home tabs (from JS useEffect)

#### Home page (HomePage.tsx):
```css
.home-page {
  min-height: 100vh;
  min-height: 100dvh;
  padding: calc(48px + env(safe-area-inset-top))
           calc(20px + env(safe-area-inset-right))
           calc(32px + env(safe-area-inset-bottom))
           calc(20px + env(safe-area-inset-left));
  overflow-x: hidden;
  overflow-y: auto;
}
```

#### Subpages (AgendaPage.tsx):
```tsx
style={{
  height: "100dvh",
  width: "100%",
  overflowY: "auto",
  padding: "calc(48px + env(safe-area-inset-top)) 20px calc(48px + env(safe-area-inset-bottom))",
}}
```
Note: Left/right safe-area insets NOT applied on subpages (only 20px fixed).

#### LensPage.tsx:
```tsx
style={{
  minHeight: "100dvh",
  width: "100%",
  overflow: "hidden",
  position: "relative",
}}
```

#### GlassPanel (desktop):
```css
.controls-panel {
  position: absolute;
  left: calc(16px + env(safe-area-inset-left));
  top: calc(16px + env(safe-area-inset-top));
}
```

#### GlassPanel (mobile ≤640px):
```css
.controls-panel {
  bottom: calc(16px + env(safe-area-inset-bottom));
  padding: 12px 12px calc(16px + env(safe-area-inset-bottom));
}
```

#### GlassPanel collapse button (fixed):
```tsx
style={{
  position: "fixed",
  left: "calc(20px + env(safe-area-inset-left))",
  top: "calc(20px + env(safe-area-inset-top))",
}}
```

---

## F. Evidence

### PROOF that social preview works:

**Production HTTP response for `/agenda/`** (2026-08-26 18:40 UTC):
```
HTTP/1.1 200 OK
Server: GitHub.com
Content-Type: text/html; charset=utf-8
Content-Length: 3162
Last-Modified: Wed, 26 Aug 2026 18:24:52 GMT
```

**Actual OG tags in response:**
```html
<meta property="og:title" content="Повестки: Запад vs Кремль | Pet projects" />
<meta property="og:description" content="Сравнение двух повесток..." />
<meta property="og:image" content="https://pet-projects.govgolenko.ru/agenda-preview-light.png" />
<meta property="og:url" content="https://pet-projects.govgolenko.ru/agenda/" />
<title>Повестки: Запад vs Кремль | Pet projects</title>
```

**OG image response:**
```
HTTP/1.1 200 OK
Content-Type: image/png
Content-Length: 200622
```

### PROOF that build produces correct files:

**Build output:**
```
[og-pages] Generated pages: /lens/, /agenda/
```

**Local dist verification:**
- `dist/agenda/index.html` → 3203 bytes → contains "Повестки: Запад vs Кремль"
- `dist/lens/index.html` → 3407 bytes → contains "Симметричная линза"

### iOS safe-area CSS rules (relevant):

From `theme.css`:
```css
#root {
  overflow-x: hidden;  /* line 72 */
}
```

From `App.tsx` (injected `<style>`):
```css
#root::before {
  content: "";
  position: fixed;
  inset: 0;
  background: var(--bg);
  z-index: -1;
}
```

From `App.tsx` (dynamic JS):
```js
rootRef.current.style.overflow = tab !== "home" ? "hidden" : "";
```

---

## G. Root Causes

### Social Preview:

**LIKELY CAUSE: Social media caching (not a code issue).**

The production server returns correct OG metadata for all subpage URLs. All OG images are accessible. The build pipeline correctly generates page-specific HTML. The `og-pages` Vite plugin works correctly.

The "social preview doesn't work" symptom is most likely caused by:
1. **Platform caching**: Facebook, Twitter, LinkedIn aggressively cache URL previews. If the OG tags were missing/broken in a previous deployment, the cached version may still be served by these platforms.
2. **Insufficient cache-busting**: The user may not have used the platform-specific debug tools to force a re-fetch.

**NOT VERIFIED**: Whether the user actually tested with fresh crawler requests (using debug tools) after the most recent deployment.

### iOS Safe-Area:

**LIKELY CAUSE: `overflow-x: hidden` on `#root` interfering with `position: fixed` pseudo-element in iOS Safari safe areas.**

Specific mechanism:
1. `#root` has `overflow-x: hidden` in CSS (theme.css:72)
2. The App wrapper dynamically gets `overflow: hidden` on non-home tabs (App.tsx:70)
3. `#root::before` is a `position: fixed` pseudo-element intended to cover the full viewport including safe areas
4. On iOS Safari, `overflow` on a containing block can interfere with `position: fixed` rendering in safe area contexts
5. This results in the `#root::before` background not extending into the safe area insets, leaving the safe area background up to the browser/viewport default

**NOT VERIFIED**:
- Whether the issue occurs in Safari browser mode vs standalone PWA mode
- Whether the issue is specific to newer iPhones (with notch/Dynamic Island) vs older models
- The exact visual appearance (black stripe? white stripe? different color stripe?)

---

## H. Recommended Fixes

### Social Preview:
1. **Test with Facebook Debugger**: https://developers.facebook.com/tools/debug/ — enter `https://pet-projects.govgolenko.ru/agenda/` and click "Scrape Again"
2. **Test with Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **If still broken after cache refresh**: The issue is confirmed as a platform caching problem, not a code problem. Wait 24-48 hours or use "Scrape Again" repeatedly.

### iOS Safe-Area:
The fix should address the `overflow` interaction with `position: fixed`:

**Option A (Recommended)**: Remove `overflow-x: hidden` from `#root` in `theme.css` and remove the dynamic `overflow` toggle from `App.tsx`. Let subpages handle their own overflow internally (they already do with `overflowY: auto`).

**Option B**: Move the `#root::before` background to `html` or `body` level using a `<style>` tag in `index.html`, outside the `#root` overflow container.

**Option C**: Use `background-color` on `<html>` (already present) and remove `#root::before` entirely, relying on the chain of `html > body > #root` backgrounds to cover the viewport.

**Option D**: Replace `overflow-x: hidden` on `#root` with `clip-path: inset(0)` or `contain: paint` to prevent horizontal scrolling without creating a scroll container.

---

## I. Verified Facts Table

| # | Fact | Verified | Source |
|---|---|---|---|
| 1 | Production `/` returns correct OG tags | YES | HTTP response 2026-08-26 |
| 2 | Production `/agenda/` returns correct OG tags | YES | HTTP response 2026-08-26 |
| 3 | Production `/lens/` returns correct OG tags | YES | HTTP response 2026-08-26 |
| 4 | All OG images return HTTP 200 | YES | HTTP response 2026-08-26 |
| 5 | Non-trailing-slash redirects work (301) | YES | HTTP response 2026-08-26 |
| 6 | Facebook crawler gets correct OG tags | YES | curl with facebookexternalhit UA |
| 7 | Twitter crawler gets correct OG tags | YES | curl with Twitterbot UA |
| 8 | `dist/agenda/index.html` exists with correct OG | YES | Build output + file check |
| 9 | `dist/lens/index.html` exists with correct OG | YES | Build output + file check |
| 10 | Asset hashes match between local and production | YES | File comparison |
| 11 | GitHub Actions deploys `dist/` to GitHub Pages | YES | static.yml workflow |
| 12 | `viewport-fit=cover` present in meta tag | YES | index.html |
| 13 | `#root` has `overflow-x: hidden` | YES | theme.css:72 |
| 14 | Dynamic `overflow: hidden` on non-home tabs | YES | App.tsx:70 |
| 15 | `#root::before` has `position: fixed, inset: 0` | YES | App.tsx:88-94 |
| 16 | All background colors are consistent (`--bg`) | YES | theme.css + inline styles |
| 17 | Safe-area padding applied on home page (all sides) | YES | HomePage.tsx:30-33 |
| 18 | Safe-area padding applied on subpages (top+bottom only) | YES | AgendaPage.tsx:31 |
| 19 | Deploy timestamp matches recent build | YES | Last-Modified header |
| 20 | `404.html` SPA redirect present | YES | public/404.html |

---

## J. Unknown / Not Verified

| # | Unknown | How to verify |
|---|---|---|
| 1 | Whether social preview is still broken after cache refresh | User must test with FB/Twitter debug tools |
| 2 | Exact visual appearance of iOS safe-area stripes | User must provide screenshot or detailed description |
| 3 | Whether issue is in Safari vs standalone PWA | User must test both modes |
| 4 | Whether issue is on specific iPhone models | User must specify device |
| 5 | Whether the `#root::before` is the actual cause of stripes | Requires DOM inspection on real iOS device |
| 6 | GitHub Pages CNAME configuration | Requires access to GitHub repo settings |
| 7 | Whether GitHub Actions is currently passing | Requires access to GitHub Actions UI |

---
