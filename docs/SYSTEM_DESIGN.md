# COSMOS — System Design

This document describes how COSMOS is put together: the runtime architecture, how data flows from
NASA services to the screen, and the design decisions behind caching, rendering, performance,
accessibility and security.

---

## 1. Goals and constraints

| Goal | Consequence for the design |
| --- | --- |
| Use **real** astronomical data; never fabricate | Live APIs where a reliable public endpoint exists; documented curated catalogs elsewhere; every panel labelled *Live* or *Curated*; missing values render as "Not available". |
| Keep API keys secret | A server-side proxy holds `NASA_API_KEY`; the browser only talks to `/api/*`. |
| Cinematic 3D, but usable on ordinary laptops and phones | Code-split 3D, instanced/point rendering, capped DPR, pause when off-screen, device tiers, reduced-motion mode, WebGL fallback. |
| Accessible | Semantic HTML, keyboard-first search and tabs, text/table alternatives for every 3D scene, visible focus, reduced motion. |
| Simple to deploy | One dependency-free Node server (`server/index.mjs`) or static hosting + one serverless function. |

---

## 2. High-level architecture

```
┌───────────────────────────── Browser ─────────────────────────────┐
│  React 18 SPA (Vite)                                               │
│                                                                    │
│  Pages (lazy) ──► hooks (useAsync, useExoplanetList, …)            │
│     │                    │                                         │
│     │                    ▼                                         │
│     │            services/nasa/*  ──►  http.fetchJson (cache,       │
│     │            (typed parsers)        abort, error mapping)       │
│     │                    │                                         │
│     ▼                    ├──── /api/* ───────────────┐             │
│  components/space/*      └──── images-api.nasa.gov ──┼──► (direct, │
│  (R3F + shaders, lazy)                               │    CORS OK) │
└──────────────────────────────────────────────────────┼─────────────┘
                                                       │
┌────────────── Node: server/apiHandler.mjs ───────────▼─────────────┐
│  route + validate ─► in-memory TTL cache + in-flight de-dupe        │
│                 ─► upstream fetch (30 s timeout) ─► redact api_key  │
│                 ─► relay JSON + x-cosmos-* metadata headers         │
└──────┬────────────────────────┬─────────────────────────┬──────────┘
       ▼                        ▼                         ▼
 api.nasa.gov/planetary/apod   api.nasa.gov/neo/rest/v1   exoplanetarchive.ipac.caltech.edu/TAP/sync
```

The same `createApiHandler()` runs in two hosts:

- **Development** — mounted as Vite middleware in `vite.config.ts` (`configureServer` / `configurePreviewServer`).
- **Production** — `server/index.mjs`, which also serves `dist/` with SPA fallback.

---

## 3. Data sources

| Dataset | Endpoint | Auth | CORS | Path from browser |
| --- | --- | --- | --- | --- |
| APOD | `api.nasa.gov/planetary/apod` | API key | yes | via proxy (`/api/apod`) to hide key |
| NeoWs feed | `api.nasa.gov/neo/rest/v1/feed` | API key | yes | via proxy (`/api/neo/feed`) to hide key |
| Exoplanet Archive | `exoplanetarchive.ipac.caltech.edu/TAP/sync` | none | **no** | via proxy (`/api/exoplanets`) |
| Image & Video Library | `images-api.nasa.gov/search`, asset manifests | none | yes | direct |
| Curated catalogs | `src/data/*.ts` | — | — | bundled in route chunks |

### 3.1 Exoplanet Archive specifics (verified against the live service)

- Table: **`pscomppars`** (Planetary Systems Composite Parameters) — one row per confirmed planet.
- **`TOP n` is applied before `ORDER BY`** in the archive's Oracle translation, so it returns the wrong rows. COSMOS never uses `TOP`; it uses the TAP **`maxrec`** parameter, which limits after ordering.
- **`OFFSET … FETCH` is unsupported**, so pagination is **keyset**: `ORDER BY <col> <dir>, pl_name ASC` and the next page adds `(<col> < v OR (<col> = v AND pl_name > 'last'))`.
- Bad ADQL returns **HTTP 200 with a VOTable error document**; the proxy detects this and turns it into a 502 with the `ORA-…` message.
- A **web firewall returns 403** for some SQL-looking shapes (a quoted literal followed by `is not null`). Rows without a sort value are excluded with `col >= 0` instead (equivalent for the non-negative sortable columns).

### 3.2 NeoWs specifics

- Feed ranges are limited to 7 days; the proxy validates `start_date ≤ end_date ≤ start + 7`.
- Responses embed `api_key=…` inside `links.*`. The proxy **redacts** every `api_key=` occurrence before caching or relaying.

### 3.3 APOD specifics

- The documented `thumbs=true` option currently produces HTTP 500 upstream, so it is not sent. Video entries without a thumbnail fall back to a link to apod.nasa.gov.

---

## 4. Request lifecycle

Example: the user types "Kepler-452" in the command palette.

1. `CommandPalette` updates local results synchronously from the in-memory index (`utils/search.ts`).
2. `useDebounce` waits 320 ms. The effect creates an `AbortController`; any previous request is aborted.
3. In parallel (`Promise.allSettled`):
   - `searchExoplanetNames()` → `fetchExoplanetPage({name}, 'name_asc', …, 5)` → `fetchJson('/api/exoplanets?query=…&maxrec=5')`
   - `searchNasaMedia({q, pageSize: 3})` → `fetchJson('https://images-api.nasa.gov/search?…')`
4. `fetchJson` checks the **client cache** (URL-keyed, TTL per call). On miss, it fetches with the abort signal.
5. The proxy validates the ADQL (`isAllowedAdql`), checks its **server cache** and **in-flight map**, calls the archive with a 30 s timeout, and relays the JSON with `x-cosmos-cache`, `x-cosmos-fetched-at`, `x-cosmos-source`.
6. `fetchJson` maps the result into `{ data, meta }`; non-2xx responses become `ApiError(status, message, detail)`.
7. Results are grouped by category (`groupResults`): local categories in relevance order, then live categories. A failing source shows a warning without hiding the others.

---

## 5. Caching strategy

| Layer | Where | Key | TTL | Notes |
| --- | --- | --- | --- | --- |
| Server cache | `apiHandler.mjs` | route + params | APOD 60 min, NeoWs 60 min, exoplanets 6 h | Max 400 entries (LRU-ish eviction); only HTTP 200 is cached. |
| In-flight de-dupe | `apiHandler.mjs` | same | request lifetime | Concurrent identical requests share one upstream call. |
| Stale-on-error | `apiHandler.mjs` | same | — | If upstream fails (e.g. 429) and an expired entry exists, it's served with `x-cosmos-cache: STALE`. |
| Client cache | `services/nasa/http.ts` | full URL | 5–60 min per service | Max 200 entries; avoids refetching on navigation back/forth. |
| Static assets | `server/index.mjs` | hashed filename | 1 year, `immutable` | `index.html` is `no-cache`. |

"Last updated" in the UI comes from `x-cosmos-fetched-at`, i.e. when the proxy actually fetched from NASA — not when the browser received a cached copy.

---

## 6. Frontend architecture

### 6.1 Routing and code splitting

`createBrowserRouter` with one layout route. **Every page is `React.lazy`**, and every 3D scene is a
further lazy import inside its page, so the initial bundle (~134 kB gzip) contains React, the router,
Framer Motion, the layout, nav and command palette — **not** Three.js. Three.js + R3F + Drei
(~218 kB gzip) load only when a page with a canvas is shown.

| Route | Page | Data |
| --- | --- | --- |
| `/` | Hero + overview + live panels | APOD, NeoWs (today), exoplanet count/latest |
| `/explore?focus=<id>` | 3D Solar System | curated |
| `/planets`, `/planets/:id` | list, detail (Sun/planets/moons) | curated + live imagery |
| `/exoplanets?q&method&from&to&maxly&sort`, `/exoplanets/:name` | search, detail | live |
| `/galaxies`, `/galaxies/:id` | catalog + particle visualizer | curated + live imagery |
| `/stars`, `/stars/:id` | catalog, size chart | curated + live imagery |
| `/black-holes` | simulation, concepts, gallery | curated + live imagery |
| `/asteroids` | chart + table | live |
| `/gallery?q&media` | APOD + library + lightbox | live |

Filter state lives in the URL, so every view is linkable.

### 6.2 State

There is no global store. State is:

- **URL** — filters, focus target, search query (shareable, back-button friendly).
- **Component state** — UI toggles, paginated lists.
- **Two React contexts** — `MotionProvider` (reduced-motion: OS preference OR user toggle) and `SearchProvider` (palette open state + global shortcuts).
- **Mutable refs for animation** — GSAP tweens a plain object (`IntroState`) that `useFrame` reads every frame, so the cinematic intro never triggers React re-renders.

### 6.3 Async data pattern

`useAsync(fn, deps)` runs an abortable function and exposes `{data, error, loading, reload}`. Changing
deps or unmounting aborts the request — this is how "request cancellation when users leave a page" is
implemented. `useExoplanetList` specializes it for keyset pagination (dedupes rows across pages,
fetches the total count in parallel).

---

## 7. 3D rendering design

| Concern | Approach |
| --- | --- |
| Stars | One `THREE.Points` per layer with per-vertex size/colour/phase attributes and a custom shader (twinkle, size attenuation). Thousands of stars = one draw call. Deterministic PRNG so the sky is stable. |
| Parallax depth | Hero uses three layers: far sky (r 260–600), mid stars (60–260) and near dust (3–45). Camera travel produces natural parallax. |
| Nebulae | Camera-facing quads with domain-warped fBm noise and additive blending — reads as volumetric without ray-marching. |
| Planets | One `ShaderMaterial` with 10 procedural surface styles (rocky, Venus clouds, Earth oceans/land/ice, Mars, gas/ice-giant bands, cratered moon, icy moon, Titan haze, Europa lineae), diffuse + specular + fresnel; separate atmosphere shell (back-face, additive), cloud layer and ring shader. |
| Black hole | Full-screen fragment shader integrating light paths with the Schwarzschild photon-bending approximation `a = −1.5 h² r̂ / r⁴`, intersecting the disk plane, with Doppler beaming. Rendered at 0.5–0.75 DPR, 70–120 steps by tier. Labelled as a simulation. |
| Camera travel | Explorer lerps camera + `OrbitControls.target` toward the selected body, then follows it as it orbits while leaving the user free to rotate. GSAP drives detail-page fly-ins. |
| Resource lifecycle | Geometries/materials are created in `useMemo` and **disposed explicitly** in effect cleanups. |
| Scale honesty | Explorer distances and sizes are compressed; a `ScaleNotice` explains this, and every scene's `aria-label` calls it an artistic rendering. |

### Performance controls (`SceneCanvas`)

- `frameloop="never"` when the canvas is off-screen (IntersectionObserver) or the tab is hidden; `"demand"` under reduced motion.
- DPR capped at 1.75 (1.25 on low tier or after `PerformanceMonitor` reports a decline); `AdaptiveDpr`.
- Device tier (`low` for coarse pointers, < 768 px, or ≤ 4 cores) reduces particle counts (e.g. hero stars 7 000 → 2 500), shader octaves and sphere segments, and disables antialiasing.
- WebGL detection → static CSS starfield fallback; `ErrorBoundary` around every canvas.

---

## 8. Animation system

| Layer | Tool | Used for |
| --- | --- | --- |
| Cinematic sequences | GSAP timeline | Hero: stars → dust → nebula → camera dolly → planet → staggered headline → CTAs |
| Scroll | GSAP ScrollTrigger | Hero camera continues forward and copy drifts away; parallax glow layers on Home |
| UI transitions | Framer Motion | Route fade/slide, tabs indicator (`layoutId`), panels, palette, lightbox, list reveals |
| Numbers | Framer `animate` + `useInView` | Count-up stats once in view |

Rules: CTAs and navigation are interactive from the first frame; "Skip intro" jumps the timeline to
its end; reduced motion sets the final state immediately, stops orbits/twinkle and replaces fly-ins
with cuts; the custom cursor is decorative and never replaces the system cursor.

---

## 9. Security

- **Key isolation**: `NASA_API_KEY` is read server-side only (no `VITE_` prefix) and redacted from response bodies.
- **Proxy hardening**: GET only; strict date validation; NeoWs range ≤ 7 days; ADQL allow-list (must be `SELECT … FROM pscomppars`, no `;`, comments, `UNION`, DDL/DML, `INTO`; string literals stripped before keyword checks; max 2 500 chars); `maxrec` clamped to 1–500; upstream timeout 30 s.
- **Query building**: ADQL literals escape `'` → `''`; name search strips `%`, `_`, `\` and control characters; discovery method must be in a fixed allow-list.
- **Static server**: resolves paths inside `dist/` only (traversal → SPA fallback), `nosniff`, `strict-origin-when-cross-origin`.
- **External links** use `rel="noopener noreferrer"`. No user-generated HTML is rendered.
- **Storage**: only per-device conveniences in `localStorage` (reduced-motion choice; recent searches **only after explicit opt-in**, cleared on opt-out).

---

## 10. Accessibility

- Skip link, landmark structure, one `h1` per page, labelled sections.
- Command palette: `role="dialog"` + `aria-modal`, combobox/listbox pattern with `aria-activedescendant`, arrow/Enter/Escape, focus trap and focus restore.
- Tabs: WAI-ARIA tabs with roving `tabindex`, Arrow/Home/End.
- Scientific values in `<dl>`/`<table>` with captions; estimates flagged with a visible "EST." tag.
- Every 3D canvas has `role="img"` + descriptive `aria-label`; the explorer has a full table alternative with "Focus" buttons.
- Animated numbers expose the final value via `aria-label`.
- Visible `:focus-visible` ring in cosmic cyan; colour palette chosen for contrast on near-black.

---

## 11. Error handling

| Failure | Behaviour |
| --- | --- |
| Upstream 429 | Proxy serves stale cache if any; otherwise 429 with a clear message. UI shows "rate limit reached" and a Retry button. |
| Upstream 5xx / network / timeout | 502/504 with detail; UI `ErrorState` explains, offers retry and notes that no data is substituted. |
| Bad ADQL | VOTable error → 502 with the `ORA-` message. |
| Partial search failure | Other sources still render; a warning lists what failed. |
| WebGL missing / shader crash | CSS starfield fallback, page content unaffected. |
| Unknown object URL | Themed not-found page with search. |
| Render error anywhere in a page | Route-level `ErrorBoundary`. |

---

## 12. Testing strategy

| Level | Tooling | Scope |
| --- | --- | --- |
| Unit | Vitest | formatters, search ranking, ADQL builders, parsers (fixtures captured from real responses), catalog integrity |
| Server | Vitest (node env) | validation, caching/TTL, in-flight de-dupe, stale-on-error, key redaction, error mapping |
| Hooks/components | Vitest + Testing Library (jsdom) | abort/debounce/pagination, palette keyboard + live labelling + opt-in history, tabs, error boundary, charts |
| End-to-end (manual script) | Playwright (not a project dependency) | All routes on desktop/mobile/reduced-motion: no page errors, no horizontal overflow, screenshots; flows for search, explorer focus/reset, filters + keyset "Load more", lightbox |

---

## 13. Future work

- NASA Horizons ephemerides for real planetary positions in the explorer.
- Persistent/shared cache (Redis or KV) for serverless deployments.
- KTX2/Basis compressed textures if photographic texture maps are added.
- Playwright tests promoted into CI with a GPU-less WebGL budget.
