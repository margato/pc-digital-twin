# AGENTS.md

Notes for people and agents working on this repo, updated when the owner asks. `CLAUDE.md` only imports this file.

True-scale 3D digital twin of a gaming PC (published as the artifact "PC Digital Twin Lab"). See README.md for the modelled build and product context.

## Commands
- `npm run dev` / `npm run build` (`tsc -b && vite build`, output `dist/`) / `npm run preview`
- `npm run typecheck`
- `npm test` (vitest, node env, `src/**/*.test.ts`); single test: `npx vitest run src/sim/compat.test.ts -t "name"`
- `make ci` runs the CI steps locally (`make check` skips `npm ci`).

## Commits and PRs
- **Conventional Commits** are required for commits and PR titles (`feat:`, `fix:`, `docs:`, `chore:`, `feat!:` for a breaking change). Enforced locally by a husky `commit-msg` hook (`commitlint.config.mjs`, `@commitlint/config-conventional`; `npm install` enables it) and in CI by the `pr-title` job in `.github/workflows/pr.yml`.
- **Before every commit, run `make ci`** (install, typecheck, tests, build: what the CI `check` job runs) and fix any failure first.
- **When the user asks for a commit (or a PR):** `git pull --rebase` the default branch, switch to a new branch (never commit on `main`), commit there, push, and open the PR with `gh pr create`. Write the message in English, authored only as the user's own git/GitHub identity: no AI attribution (no `Co-Authored-By` trailer, no "Generated with ..." line), in commits and PR descriptions alike. This overrides any default attribution guidance from the tool or harness.
- A PR carries **one commit**: fold follow-ups into it with `git commit --amend` instead of stacking fixups, and update a pushed branch with `git push --force-with-lease` (feature branch only, never `main`). Body lines are at most 100 characters (commitlint).
- Write inline code in a commit message or PR body with plain backticks, never backslash-escaped: pass the text through a quoted heredoc (`<<'EOF'`) or `--body-file`, and check with `gh pr view` that the body has no literal backslashes.
- After opening a PR, report only its link; do not recap the checks done.
- Use the `gh` CLI for anything on GitHub (PRs, issues, runs, releases) instead of the web UI or raw `curl`.

## Direction
PC Digital Twin Lab started as a twin of the author's own gaming PC. It is becoming a tool where anyone **imports a PC config or builds one by hand** from a catalog of component spec sheets. The author's PC survives as the read-only **Default** build.

## i18n (every edit must update it)
**Any change that adds, removes, renames or rewords user-visible text must update the i18n messages in the same edit**: no hardcoded strings in `ui/`, `sim/` or `builds/` code.
- UI text lives in `src/i18n/messages/<area>.ts` (`panel`, `power`, `whatif`, `checks`, `onboarding`, `menu`, `rows`), written with `defineMessages(en, pt)`. English is the source of truth; Portuguese must have exactly the same keys (a missing key is a compile error) and the same `{name}` placeholders (checked by `i18n.test.ts`).
- Keys are prefixed with the area (`menu.title`). A new area is a new file added to `AREAS` in `messages/index.ts`.
- Use `useT()` in components and `t()` outside React; `localize()` for `LocalizedText` (`string | {en?, pt?}`, used by build JSON such as upgrade suggestions and descriptions); `localeOf()` for number/date formatting.
- Remove keys that no longer have a user (no orphan messages) and update both languages together.
- Language choice is stored in `pcdt.lang.v1` (absent = follow the browser).
- Terminology: in English the UI calls the physical parts "components" (Portuguese: "peças"); the data describing them (and the user's home) is a **spec**.
- Spec sheet data (names, notes) is not translated; only the UI, build JSON `LocalizedText` fields and validation messages are.

## Feature flags
`src/config/features.dev.json` (dev server, tests) and `features.prod.json` (`npm run build`) toggle UI features at build time (`onboarding`, `buildMenu`, `airflow`, `heatmap`, ...). Both files must keep the same keys; a new flag goes in `featureNames.ts`, both JSONs and `FEATURES` in `features.ts`. Check the flag before assuming a feature ships (prod currently has `onboarding` and `buildMenu` off).

## Specs: components and the home
Two kinds of spec describe what the app simulates:
- **Component specs** (`src/catalog`, the "fichas"): CPU, GPU, board, RAM, SSD, PSU, cooler, case. A Build picks specs by id.
- **Home spec** (`HomeSpec`, `catalog/types/home.ts`): the user's wall outlet (`volts`, `amps`, `safeFraction`) and the other `devices` plugged into it (name, `watts` under load, optional `idleWatts`). It belongs to the user, not to a build, so every build is checked against the same home. `catalog/home.ts` has `defaultHome(region)` (regional voltage and outlet rating, a TV and a router as placeholders) and `FALLBACK_HOME` (127 V × 10 A, the author's setup) used by tests and by `evaluate()` when no home is passed. `sim/home.ts` has the pure helpers (`outletW`, `devicesW`, `sanitizeHome`) and `state/home.ts` the zustand store, persisted in `pcdt.home.v1` and edited in Settings > Home. Power tab and compat checks read the home; no outlet, TV or router number is hardcoded anymore.
- Settings defaults (`state/defaults.ts`) are guessed from the browser (currency and kWh price from the language region, FPS cap from touch/cores/memory); anything the user saved wins. Other settings in `pc-twin-settings`: `fpsLimit`, `kwhPrice`, `currency`, `playHours` (hours of play per week, for the monthly cost).

## Architecture (data side)
```
catalog/types/*   one type per component (cpu.ts, gpu.ts, ...), base.ts, build.ts   pure types
catalog/parts/*   spec sheets ("fichas"), one file per kind, exported arrays          pure data
catalog/index.ts  CATALOG, findSpec(id), getSpec(kind, id), specsOf(kind)
builds/           a Build = spec ids + quantities (JSON), resolved against the catalog
  default.build.json   the author's PC (read-only seed, never written to storage)
  repository.ts        BuildRepository interface + DEFAULT_ID
  storageRepository.ts StorageBuildRepository (localStorage-shaped store) + MemoryStore
  index.ts             `buildRepository` singleton (localStorage, falls back to memory)
  resolve.ts / validate.ts / swap.ts
sim/              pure logic: compat evaluate(cand, base), scenariosFor(resolved), power, heat, airflow
state/store.ts    zustand: active build, resolved build, scenarios, what-if swap, onboarding flag
```
- **Spec sheet** (`SpecBase`): `id`, `kind`, `name`, `manufacturer`, `brand`, `dims`, `model` (`builder` + optional free `glb`), `image`, `estimated`, `sources`, plus fields per kind (CPU: sockets, clocks, `maxPowerW`; GPU: `lengthMm`, `powerW`, `connector`...).
- **Build** = `{ version: 1, id, name, parts: Record<PartId, {spec, qty}[]>, upgrades? }`. Exactly one cpu/gpu/board/psu/cooler/case; one or more ram modules (qty) and drives.
- **Repository pattern**: the app only uses `BuildRepository`. Synchronous (localStorage is). Keys: `pcdt.builds.v1` (user builds array), `pcdt.active.v1`, `pcdt.onboarded.v1` (plus `pcdt.lang.v1` for the language, `pcdt.home.v1` for the home spec and `pc-twin-settings` for the FPS limit, energy price, currency and play hours). Reads validate every stored build against the catalog and drop broken ones. Storage errors are swallowed (memory fallback). `reset()` deletes user builds and re-activates Default, keeps the onboarding flag.
- **What-if** = the active build plus a `Swap` (`gpu`, `cpu`, `board`, `psu`, `ram: {spec, qty}`, `addSsd`). `evaluate(candidate, baseline)`; "Platform change" and the added-drive check are relative to the baseline, not to the Default.
- **Scenarios**: `SCEN` in `data/scenarios.ts` is the estimate table tuned on the Default build. `scenariosFor(resolved)` scales each subsystem's watts by `rated(build) / rated(Default)`, so Default reproduces `SCEN` exactly. Temperatures and fan speed are not scaled.

## Architecture (3D side)
Tests cover `sim/`, `builds/`, `catalog/`, `config/`, `i18n/`, `state/`, `model/` and `ui/buildmenu`; add or update a test for logic changes there.

`data/` (plain data) -> `sim/` (pure logic: power, compat `evaluate()`, heat, airflow) -> `state/store.ts` (zustand, shared by `ui/` and `scene/`).

- `model/`: imperative three.js builders (`pc.ts`) that register into a Kit (`createKit()` in `kit.ts`): `pickables`, `pcMats` (per-part materials for isolation and heat tint), `spinners`, `dims`. The built group is mounted in R3F via `<primitive>`.
- `model/registry.ts`: `COMPONENT_MODELS` maps each `PartId` to its model builder, and `BUILD_ORDER` sets the assembly order. The CPU model is self-contained in `model/cpu/cpu.ts`; the other parts are in `model/parts/`.
- `scene/`: R3F components: Stage, Studio, PcModel (plus heat slice and airflow), CameraRig, Picker.
- `ui/`: React panel reading and writing the store; `ui/onboarding/` is the create/import wizard, `BuildMenu.tsx` the "My PCs" menu, `Settings.tsx` the settings dialog. Per-feature CSS lives next to it (`buildmenu.css`, `onboarding/onboarding.css`), the rest in `styles.css`.
- Geometry is built in code: three.js primitives (mostly `BoxGeometry` and `CylinderGeometry`, plus `ExtrudeGeometry`, `TorusGeometry`, `TubeGeometry`, `PlaneGeometry`, `CircleGeometry`) in `model/pc.ts` and `model/parts/*.ts`. Parts may be reconstructed as copies of the real design, following the reference photos. A pre-built `.glb`/`.gltf` asset is allowed when its license permits use in the app; load it through `GLTFLoader` and keep the builder as fallback. Any GLB export still goes through three's `GLTFExporter` at runtime.

## Conventions
- **Spec sheet files are written for humans: one property per line**, nested objects expanded, comments kept. `catalog.test.ts` fails on a line with several properties. Do not paste compact one-liners.
- Real, measured products come first and carry `sources`; anything generic or guessed is `estimated: true`. Never fill a number from memory without marking it.
- Photos: `image` has `license`, `author`, `sourceUrl`; `representative: true` when it shows a similar product, not the exact model. Only free licenses (CC0, public domain, CC-BY, CC-BY-SA). **Images are currently removed from the UI** (data kept in the catalog).
- Free 3D models: see `docs/free-models.md` (only SSD CC0 and a CC-BY GPU were usable; keep the procedural builders as the fallback).
- Verification reports (official-source fact checks): `docs/verify-*.md`. Apply a correction only when the official page was actually opened; otherwise leave the value and say it is unverified.

## Gotchas
- Legacy lighting: `THREE.ColorManagement.enabled = false` (`src/three-setup.ts`, must be imported first in `main.tsx`) and legacy lights. Everything was tuned for that; three is pinned at 0.164.1. Do not upgrade to r165+ without a lighting retune.
- Model units are mm; device groups are scaled by `S = 0.01`. PC local axes: front of case +x, glass side +z, floor y = 0.
- Parts are identified by `userData.part` (`PartTag`); register meshes through the kit's `reg`/helpers or picking and isolation will not see them.
- `inst()` merges repeated geometry into one mesh to cut draw calls. Do not replace with InstancedMesh.
- Power, temperatures and fan assumptions in `data/scenarios.ts` (and the 52 CFM / 28% radiator restriction in `sim/airflow.ts`) are estimates, to be replaced by sensor data.
- Airflow particles share one budget in `PcModel.tsx` (`NP`): main case air, GPU loop, PSU loop (index ranges). PSU particles stay below the shroud (y 125); GPU/PSU flow never feeds case pressure in `airReadout`.
- Part shapes should match the real product's design (NZXT H7 from local reference photos, not committed, ASUS Prime RTX 5080 OC for the GPU test). Measure from the photos and product specs, not from memory.
- Publishing means rebuilding and republishing `dist/` to the existing artifact URL.

## Known limits and open questions
- The 3D scene and the airflow model still draw the author's NZXT H7 and its parts for every build: `model.builder` names exist on the sheets but generic builders (`generic-cpu`, ...) are not implemented. Needs parametric builders or free GLBs.
- `frontFans` / `rearFans` on the H7 sheet mix the maker's default with the author's setup; they belong in the Build, not the sheet.
- XPG, AMD and NZXT official pages returned 403/timeouts, so those sheet fields are unverified. NZXT H7 dimensions, GPU clearance (375 mm), the 5090 length and cooler `powerW` (24 W vs ~17 W) are pending a manual check.
- `src/ui/DebugOverlay.tsx` is not part of this work (another session).

## Log
- Catalog schema and 27 spec sheets created by Haiku agents; types split per component on request.
- Three verification agents compared the sheets with official pages; reports in `docs/`.
- Images: schema field, Commons research, Parts photos added then removed (data kept).
- Refactor started: Default build JSON, repository pattern on localStorage, Swap-based what-if, scenario scaling, store rewritten; compat and store tests migrated.
