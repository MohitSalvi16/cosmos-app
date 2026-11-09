# COSMOS — Code Guide

A walkthrough of the codebase for developers: where things live, how the pieces connect, and
recipes for common changes. For the *why*, see [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md).

---

## 1. Directory map

```
starry_nights/
├── index.html                 Fonts, meta, root element
├── vite.config.ts             Vite + React plugin; mounts the API proxy as dev/preview middleware
├── vitest.config.ts           Test runner config (jsdom, setup file, coverage)
├── tailwind.config.js         Design tokens: colours (void, abyss, nebula, cyan.cosmic, stellar, gold), fonts
├── .env.example               NASA_API_KEY, PORT
├── server/
│   ├── apiHandler.mjs         The /api/* proxy (validation, cache, redaction) — shared by dev & prod
│   ├── apiHandler.test.mjs    Proxy tests (node environment)
│   └── index.mjs              Production HTTP server (static dist/ + proxy)
├── docs/                      This guide and the system design
└── src/
    ├── main.tsx               React root
    ├── App.tsx                Providers + route table (all pages lazy)
    ├── styles/index.css       Tailwind layers, component classes (.glass, .btn-primary, .chip, …), CSS starfield
    ├── types/index.ts         All shared TypeScript types (raw API shapes + parsed models)
    ├── data/                  Curated catalogs (static, cited)
    │   ├── solarSystem.ts       Sun, 8 planets, Moon/Europa/Titan/Enceladus
    │   ├── galaxyCatalog.ts     8 galaxies
    │   ├── starCatalog.ts       9 stars + starColor()
    │   └── blackHoles.ts        4 black holes + explainer concepts
    ├── services/nasa/         Data access layer (one module per source)
    │   ├── http.ts              fetchJson(), ApiError, client cache, error descriptions
    │   ├── apod.ts              APOD via proxy
    │   ├── neo.ts               NeoWs via proxy + parsers
    │   ├── exoplanets.ts        ADQL builders, keyset pagination, archive links
    │   ├── images.ts            Image Library search + asset manifests
    │   ├── planetaryData.ts     Accessors over data/solarSystem
    │   ├── galaxies.ts          Accessors over data/galaxyCatalog
    │   └── stars.ts             Accessors over data/starCatalog
    ├── hooks/
    │   ├── useAsync.ts          Abortable async state
    │   ├── useDebounce.ts
    │   ├── useExoplanetList.ts  Paginated live exoplanet list
    │   ├── useMotionPreference.tsx  MotionProvider (OS + user reduced motion)
    │   └── useDevice.ts         WebGL detection, device tier, on-screen/page-visible, fine pointer
    ├── utils/
    │   ├── format.ts            Number/date/distance formatting, "Not available"
    │   └── search.ts            Local index, scoring, grouping, opt-in recent searches
    ├── components/
    │   ├── navigation/          NavBar, Footer (reduced-motion toggle), Layout (route transitions)
    │   ├── search/              SearchContext (shortcuts), CommandPalette
    │   ├── hero/                Hero (GSAP + ScrollTrigger), HeroScene (3D)
    │   ├── space/               All WebGL: shaders, PlanetMesh, StarField, Nebula, SceneCanvas,
    │   │                        UniverseScene, BodyScene, GalaxyParticles, BlackHoleScene
    │   ├── planets/             PlanetOrb (CSS illustration for lists)
    │   ├── exoplanets/          ExoplanetFiltersBar
    │   ├── galaxies/            GalaxyScene
    │   ├── stars/               StarSizeChart
    │   ├── blackholes/          BlackHoleCanvas
    │   ├── asteroids/           ApproachChart (SVG)
    │   ├── gallery/             ApodFeature, Lightbox
    │   └── shared/              DataBadge, DataList, States, ErrorBoundary, Tabs, Reveal,
    │                            PageHeader, AnimatedNumber, NasaImageStrip, SourceList, Cursor, ScaleNotice
    ├── pages/                 One file per route (default export, lazy-loaded)
    └── test/                  setup.ts (jsdom polyfills), fixtures.ts (real-response fixtures)
```

Import alias: `@/` → `src/`.

---

## 2. How a page is built

Typical page anatomy (e.g. `pages/GalaxyDetailPage.tsx`):

```tsx
const GalaxyScene = lazy(() => import('@/components/galaxies/GalaxyScene')); // 3D split out

export default function GalaxyDetailPage() {
  const { id } = useParams();
  const g = getGalaxy(id);                          // curated accessor (services/nasa/galaxies.ts)
  if (!g) return <NotFoundPage what="galaxy" />;    // direct URLs to unknown objects
  return (
    <article>
      <Suspense fallback={<div className="css-starfield absolute inset-0" />}>
        <GalaxyScene galaxy={g} … />                 // wrapped in SceneCanvas (fallback, pausing, DPR)
      </Suspense>
      <DataBadge provenance="curated" />             // provenance is always labelled
      <DataList items={[{ label, value, estimate }]} />
      <NasaImageStrip query={g.imageQuery} />        // live imagery, own loading/error state
      <SourceList sources={g.sources} />
    </article>
  );
}
```

Live-data pages follow the same shape but fetch through a hook:

```tsx
const { data, error, loading, reload } = useAsync((signal) => fetchNeoFeed(start, end, signal), [start, end]);
if (error) return <ErrorState error={error} onRetry={reload} />;
<DataBadge provenance="live" meta={data?.meta} />   // shows source + "updated N min ago"
```

---

## 3. Key modules in detail

### `server/apiHandler.mjs`

`createApiHandler({ apiKey, fetchImpl?, now?, log? })` returns `async (req, res)`. Routes:

| Route | Params | Upstream |
| --- | --- | --- |
| `GET /api/health` | — | — (reports whether a key is configured, never the key) |
| `GET /api/apod` | `date?` (YYYY-MM-DD) | APOD |
| `GET /api/neo/feed` | `start_date`, `end_date` (≤ 7 days) | NeoWs feed |
| `GET /api/exoplanets` | `query` (ADQL), `maxrec` (1–500) | Exoplanet Archive TAP sync, `format=json` |

Internals: `cachedFetch(key, url, ttl)` (cache → in-flight map → upstream → `redactApiKey` → store 200s),
`relay()` (maps statuses, adds `x-cosmos-*` headers). Exported helpers `isValidDate`, `isAllowedAdql`,
`redactApiKey`, `TTL` are unit-tested. `fetchImpl` and `now` are injectable for tests.

### `services/nasa/http.ts`

`fetchJson<T>(url, { signal, ttl, source })` → `Promise<Fetched<T>>` where
`Fetched<T> = { data: T; meta: { fetchedAt, cache, source } }`.
Throws `ApiError(message, status, detail)`; network failures use status `0`; aborts are rethrown
untouched (check with `isAbortError`). `describeError(err)` produces user-facing text.

### `services/nasa/exoplanets.ts`

| Function | Purpose |
| --- | --- |
| `buildWhere(filters, sort?)` | Filter clauses; adds `col >= 0` when sorting by a nullable numeric column |
| `buildListQuery(filters, sort, cursor?)` | Full ADQL with keyset condition and stable `pl_name` tiebreak |
| `buildCountQuery`, `buildDetailQuery` | Count and single-planet queries |
| `cursorFromRow(row, sort)` | Next-page cursor from the last row |
| `fetchExoplanetPage / Count / Detail` | Proxy calls; `nextCursor` only when the page is full |
| `searchExoplanetNames(term)` | Palette search (≥ 2 chars) |
| `adqlString`, `sanitizeNameTerm` | Escaping / sanitisation |

Columns are listed in `LIST_COLUMNS` / `DETAIL_COLUMNS` (verified against the live table).

### `utils/search.ts`

- `buildLocalIndex()` — flattens all curated catalogs + site sections into `IndexEntry { terms[] }`.
  Moons get "<parent> moons" terms so "Jupiter moons" works.
- `scoreEntry(entry, q)` — exact 100, prefix 80, word-prefix 60, substring 40, all-words 30, +5 for title hits **only when matched**.
- `groupResults(local, remote)` — preserves relevance across category groups.
- Recent searches: `setRecentConsent`, `addRecentSearch`, `getRecentSearches` — no-ops without consent.

### `components/space/SceneCanvas.tsx`

Wrap every R3F scene in it. Props: `label` (required, becomes `aria-label`), `fallback`, `className`
(defaults to `relative`; pass `absolute inset-0` for full-bleed), `staticFrame`, plus any `Canvas` prop.

### `components/space/PlanetMesh.tsx`

`<PlanetMesh visual={body.visual} radius={2} lightDir? opacityRef? quality? spin? />`.
`visual.style` selects a shader branch via `STYLE_ID` (keep in sync with `PLANET_FRAGMENT` in
`shaders.ts`). Without `lightDir`, light comes from the world origin (the Sun in the explorer).
`opacityRef` lets GSAP fade it without re-rendering.

### `components/hero/Hero.tsx`

Builds the GSAP timeline in `useLayoutEffect` inside `gsap.context()` (auto-reverted on unmount).
The timeline animates the `IntroState` object that `HeroScene` reads in `useFrame`. ScrollTrigger
writes `intro.scroll`. `skip()` calls `timeline.progress(1)`.

---

## 4. Conventions

- **TypeScript strict** with `noUncheckedIndexedAccess`; no `any` in app code.
- **Never invent data**: use `formatNumber`/`formatText`/`NOT_AVAILABLE` for nullable values; label provenance with `DataBadge`; mark estimates with `estimate: true` in `DataList`.
- **Abort everything**: pass the `AbortSignal` from `useAsync` into services.
- **3D resources**: create in `useMemo`, dispose in `useEffect` cleanup.
- **Motion**: read `useMotionPreference().reduced`; give Framer components `initial={reduced ? false : …}`.
- **Styling**: Tailwind utilities + the component classes in `styles/index.css` (`.glass`, `.btn-primary`, `.btn-ghost`, `.chip`, `.eyebrow`, `.display`, `.data-label`, `.data-value`, `.input`, `.container-cosmos`).
- **Links out**: `target="_blank" rel="noopener noreferrer"` plus an sr-only "(opens in a new tab)".

---

## 5. Recipes

### Add a planet/moon to the catalog
1. Add a `CelestialBody` to `SOLAR_SYSTEM` in `src/data/solarSystem.ts` (moons need `parent`).
2. Choose a `visual.style` (or add one: new `SurfaceStyle` in `types`, id in `STYLE_ID`, branch in `PLANET_FRAGMENT`).
3. Set `sceneRadius` / `sceneOrbit` (moons orbit their parent in scene units).
4. Cite sources. `npm test` checks ids, parents, required fields and https links.
It automatically appears in the explorer, lists, search and `/planets/:id`.

### Add a galaxy or star
Append to `GALAXIES` / `STARS`; mark uncertain values in `estimates` (stars) or the `uncertainty` text (galaxies).

### Add a new live NASA source
1. Add a route in `server/apiHandler.mjs` (validate params; choose a TTL; call `cachedFetch` + `relay`).
2. Add raw + parsed types to `src/types/index.ts`.
3. Add `src/services/nasa/<name>.ts` with a parser and a `fetchX(…, signal)` using `fetchJson`.
4. Capture a real response into `src/test/fixtures.ts`; write parser + proxy tests.
5. Use it from a page via `useAsync`, show `DataBadge provenance="live"`, `ErrorState`, loading skeletons.

### Add a new exoplanet column
Verify the column exists (`select <col> from pscomppars where pl_name = 'Kepler-452 b'`), add to
`DETAIL_COLUMNS` (or `LIST_COLUMNS`) and to `ExoplanetDetailRow`, then render it with `formatNumber`.

### Add a route
Create `src/pages/XPage.tsx` (default export), register it lazily in `App.tsx`, add to `NAV_ITEMS`
(`NavBar.tsx`) and `SECTIONS` (`utils/search.ts`) if it should be navigable/searchable.

---

## 6. Testing

```bash
npm test               # 129 tests, ~6 s
npm run test:coverage  # coverage/ (services ~97%, utils ~97%, data 100%, server ~85%)
```

| File | Covers |
| --- | --- |
| `server/apiHandler.test.mjs` | date/ADQL validation, key redaction, DEMO_KEY fallback, TTL cache, in-flight de-dupe, stale-on-429, 429/502/504 mapping, maxrec clamp, VOTable errors |
| `src/services/nasa/*.test.ts` | ADQL escaping, keyset queries, firewall-safe filters, no `TOP`; NeoWs/Image/APOD parsing against real fixtures; fetchJson caching and error mapping |
| `src/utils/*.test.ts` | formatting (incl. "Not available"), search ranking regression, grouping, opt-in recent searches |
| `src/data/catalogs.test.ts` | 8 planets in order, required fields, Kepler-consistent ordering, requested galaxies/stars/black holes, https sources |
| `src/hooks/hooks.test.tsx` | debounce, abort on dep change/unmount, reload, exoplanet pagination de-dupe, reduced-motion persistence |
| `src/components/**/*.test.tsx` | command palette (shortcuts, keyboard, debounced live search, empty/error states, consent), tabs a11y, DataBadge provenance, ErrorBoundary, charts, filters |

Fixtures in `src/test/fixtures.ts` are trimmed copies of real responses (2026-10-25). Tests stub
`fetch` with `vi.stubGlobal`; the setup file clears the client cache and `localStorage` between tests.

3D components are excluded from unit coverage (WebGL isn't available in jsdom); they are exercised
by the Playwright smoke/flow scripts described in the system design.

---

## 7. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| APOD/asteroids show "rate limit reached" | Using `DEMO_KEY`. Set `NASA_API_KEY` in `.env` and restart. |
| Exoplanet queries fail with 403 | Archive firewall pattern; avoid `is not null` after string literals (see `buildWhere`). |
| Exoplanet results look unsorted | Don't use `TOP`; use `maxrec`. |
| Canvas only 150 px tall | Wrapper lost its size — pass `className="absolute inset-0"` (or a sized class) to `SceneCanvas`. |
| Port 5173 busy | `npx vite --port 5199`. |
