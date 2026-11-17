# Contributing

Thanks for your interest in PC Digital Twin Lab.

## Reporting bugs and requesting features
Open an issue on GitHub. For a bug, include the commit, the build or parts involved, the steps you took, what you saw and what you expected (a screenshot helps). For a feature, describe the problem before the solution; for larger changes, open an issue first so we can agree on the direction before you spend time on code.

## Setup
```bash
npm install
npm run dev
```
Run `make ci` (install, typecheck, test, build: the same steps as the CI workflow) or at least `npm run typecheck` and `npm test` before opening a pull request. `make check` skips `npm ci`. Architecture notes and gotchas are in [CLAUDE.md](CLAUDE.md) and [README.md](README.md).

## Guidelines
- `src/sim/` is pure logic and the only tested code; add or update a vitest test for any change there.
- three.js is pinned at 0.164.1 (legacy lighting). Do not upgrade it without a lighting retune.
- Power, temperature and fan numbers in `src/data/scenarios.ts` are estimates. If you replace them with measured data, say where it came from.
- Part shapes are built in code from reference photos and product specs. Do not commit photos or 3D models you do not have the right to redistribute. A pre-built `.glb`/`.gltf` is accepted only with a license compatible with GPLv3 redistribution (CC0, CC-BY, MIT, Apache-2.0); record author, source URL and license in the pull request. See `docs/free-models.md`.

## Making a change
1. Fork the repository and create a branch from `main`.
2. Make your change, with tests where it touches `src/sim/`.
3. Run `make ci`.
4. Open a pull request describing what changed and why.

Commit messages and PR titles follow [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, `docs:`, `chore:`, `feat!:` for a breaking change). `npm install` enables a local `commit-msg` hook (commitlint, via husky); CI also checks the PR title.

## Pull requests
Keep them focused, describe what changed and why, and include a screenshot for visual changes. A pull request needs CI to pass. Commit messages and the PR title must follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, `feat!:` for a breaking change); a local `commit-msg` hook and the **Validate conventional commit title** CI job check this.

## License
The project is licensed under `GPL-3.0-or-later`. By contributing you agree that:
- your contribution is licensed under the same GPL terms, and
- you grant the project owner the right to relicense your contribution (for example, to close the project later). Without this, the owner could not change the license once outside code is merged.

Only contribute code you wrote or have the right to submit under these terms.
