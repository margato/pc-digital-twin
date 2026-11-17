# PC Digital Twin Lab

True-scale 3D digital twin of a gaming PC, in the browser. See the parts at real size, check power, heat and airflow, and test an upgrade in a what-if lab before buying it.

It started as a twin of the author's own PC (kept as the read-only **Default** build). It is becoming a tool where anyone can **import a PC config or build one by hand** from a catalog of component spec sheets.

Live demo: https://claude.ai/artifact/1tvCnW2K7qU8UYiQQjL4tT

> **Status:** work in progress. The data side (catalog, builds, what-if, scenario scaling) is catalog-driven; some panel sections and the 3D scene still draw the Default build for every build. See [Status](#status).

## Features
- **3D model** at true scale (millimetres), orbit camera, tap a part to isolate it.
- **Parts**: specs and real dimensions per component.
- **Power**: Idle / Gaming / Stress scenarios, PC wall draw, PSU load and efficiency curve, outlet use, 12V-2x6 load.
- **Upgrades**: a ranked list of what is worth changing.
- **What if**: swap GPU, CPU, board, RAM, SSD or PSU and check socket, memory type, BIOS, GPU length, PSU size and connector, PSU load and outlet load.
- **Stage**: airflow particles with intake/exhaust and a pressure estimate; heat map tint per part plus an air-temperature slice.
- **Builds**: create a PC with the onboarding wizard, import it from JSON, and switch, export, delete or reset from the "My PCs" menu. Builds are stored in your browser (`localStorage`).
- Light and dark themes.

## Default build (the author's PC)
- CPU: Intel Core i7-12700K (LGA1700)
- GPU: ASUS Prime GeForce RTX 5080 OC 16 GB (304 × 126 × 50 mm, native 12V-2x6)
- Board: ASUS TUF Gaming Z690-Plus D4 (DDR4, 4 × M.2 PCIe 4.0, PCIe 5.0 x16)
- RAM: Kingston Fury Renegade 32 GB (4 × 8 GB) DDR4-4000 CL19
- SSD: Kingston KC3000 1 TB NVMe PCIe 4.0
- PSU: XPG Core Reactor II VE 850 W Gold, ATX 3.1
- Cooler: Cooler Master MasterLiquid PL360 Flux, 360 mm, top mounted
- Case: NZXT H7 (230 × 505 × 480 mm), 3 front intake fans, 3 top radiator fans as intake through a narrow slit, 1 rear exhaust

## Getting started
Requires Node.js 20+.

```bash
npm install
npm run dev        # Vite dev server
npm run build      # tsc -b && vite build -> dist/
npm run preview    # serve dist/
npm run typecheck
npm test           # vitest run (pure logic only)
```

Vite + React 18 + TypeScript. The 3D scene is react-three-fiber 8 on three.js **pinned at 0.164.1**; shared state is zustand; tests are vitest (node environment).

## Structure
- `src/catalog/`: component spec sheets (one file per kind in `parts/`, types in `types/`), with `CATALOG`, `findSpec` and `getSpec`.
- `src/builds/`: a build is a list of spec ids and quantities (JSON), resolved and validated against the catalog; storage goes through a repository (localStorage with a memory fallback). `default.build.json` is the Default build.
- `src/data/`: remaining plain data (scenario estimates, part ids).
- `src/sim/`: pure, tested logic: `power`, `compat` (`evaluate()` for the what-if checks), `heat`, `airflow`, `scenarios`.
- `src/state/store.ts`: the zustand store shared by the panel and the scene.
- `src/model/`: imperative three.js builders registered through a `Kit`, mounted in R3F with `<primitive>`.
- `src/scene/`: R3F components (stage, studio lighting, PC model with heat slice and airflow, camera rig, picker).
- `src/ui/`: the React panel, build menu and onboarding wizard.
- `docs/`: research notes (free 3D models, fact-checks of the spec sheets against official sources).

[AGENTS.md](AGENTS.md) has the data architecture and conventions in more detail, and [CLAUDE.md](CLAUDE.md) the rendering gotchas.

### Rendering notes
- `THREE.ColorManagement.enabled = false` (`src/three-setup.ts`, imported first) and legacy lights: colours and light intensities were tuned under the legacy model. Upgrading to r165+ needs a full lighting retune, which is why three is pinned.
- Model units are millimetres; each device group is scaled by `S = 0.01`. PC local axes: front of case +x, glass side +z, floor y = 0.
- Parts are tagged with `userData.part` for picking and isolation.
- `inst()` bakes repeated geometry into one merged mesh (fewer draw calls; do not switch to InstancedMesh).

## Deploying
The build is host-agnostic: `dist/` uses relative asset paths and there is no client-side router, so the same output works from any domain or sub-path (GitHub Pages, a custom domain, S3, Netlify, a plain static folder). Run `npm run build` and upload `dist/`.

CI lives in `.github/workflows/`, in two workflows:
- `pr.yml` ("CI" on pull requests): **Validate conventional commit title**, **Typecheck, tests and build** and an **Overview** table in the run summary.
- `main.yml` ("Deploy" on pushes to `main`, or by hand): **Pre-deploy checks** (reuses `pr.yml`) and then **Deploy to GitHub Pages** with the site built in that same run.

Locally, `make` runs the same steps as the build job. One-time setup: **Settings → Pages → Build and deployment → Source → GitHub Actions**. If the page is blank and the console shows `GET .../src/main.tsx 404`, Pages is serving the repository source instead of the build: the Source is still "Deploy from a branch".

To force an absolute base (for example a CDN prefix), build with `BASE_PATH=/prefix/ npm run build`.

## Status
Done:
- Catalog of spec sheets (8 component kinds), checked against official sources where the pages were reachable.
- Default build, builds repository, validation, what-if swaps and scenario scaling.
- Onboarding wizard and "My PCs" menu.

Known limits:
- The 3D scene and airflow model still draw the Default case and parts for every build; generic builders per spec are not implemented.
- The home spec (outlet, TV, router) starts as a regional guess and is edited in Settings > Home.
- Several spec fields are unverified (some official pages blocked the check); sheets mark guesses as `estimated`.
- Power, temperature and fan numbers per scenario (`src/data/scenarios.ts`) and the 52 CFM per 120 mm fan / ~28% radiator restriction (`src/sim/airflow.ts`) are estimates, not measurements.

Ideas:
- Import a sensor log (HWiNFO CSV or LibreHardwareMonitor JSON) to replay real temperatures, clocks, power and fan RPM.
- A local copy of the page could read LibreHardwareMonitor's web server live, which a hosted page cannot do.
- More CPUs and GPUs in the catalog (Intel 12th-14th gen and Core Ultra, Ryzen 5000-9000, RTX 30-50, RX 6000-9000, Arc B).

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md).

## License
[GNU GPL v3 or later](LICENSE) (`GPL-3.0-or-later`): you may use, modify and redistribute it, but derivative works must stay open under the same license.

Product names (Intel, NVIDIA, AMD, ASUS, NZXT, Kingston, XPG, Cooler Master and others) are trademarks of their respective owners and are used only to describe hardware. This project is not affiliated with or endorsed by them.
