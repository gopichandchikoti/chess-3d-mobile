# Feature log

## [2026-10-27] Review standards and document the active application

**Type**: Documentation / Audit

Rewrote README for the actual native 3D implementation, package, engine/storage, build/export distinction, parity and unverified release status. Aligned AGENTS.md Part 1 and supplied missing tool pointers, preserving Part 2. No new device/iOS/build result was claimed.

The owner explicitly requested README updates across all active app folders,
including both Chess pairs. That scope takes precedence over older cross-project
editing restrictions for these documentation changes. Approved designs, runtime
source, configuration, dependencies, databases, media and Git history were not
changed. README links/command names and instruction consistency are checked by
the documentation review; formatting uses an existing local Markdown formatter.
No new browser/device visual or iOS verification is claimed.

## [2026-10-26] Establish independent offline chess foundations

**Type**: Config
**Author**: agent

### What changed

Created the repository, design record and strict build, formatting and test configuration.

### Why

Provide independent web/native applications with matching portable contracts. The owner authorized an original free engine instead of a GPL Stockfish integration.

### Files touched

- `AGENTS.md`
- `system_design.md`
- `package.json`
- `tsconfig.json`
- `biome.json`
- `LICENSE`

### Validation

Git initialization ran successfully. Application checks pending implementation.

### Migration / Setup notes

Use pnpm. No environment variables, credentials or backend are required.

## [2026-10-26] Implement chess, local persistence, original robot and 3D screens

**Type**: Feature
**Author**: agent

### What changed

Added mirrored chess/domain contracts, special-move and draw adapters, bounded local search, storage validation/migration, original assistant copy, procedural animated pieces, all requested screens and accessible legal-move controls. Added web offline caching and native GL gestures.

### Why

Deliver independent offline experiences without paid services, authentication or a GPL engine.

### Files touched

- `src/core/`
- `src/state/`
- `src/rendering/`
- `src/platform/`
- `src/App.tsx`
- Web `src/pages/`, `src/components/`, `src/themes/`, `src/hooks/`
- Native `src/features/`, `src/design/`
- `scripts/` and test configuration

### Validation

The initial 11 chess tests passed on web; 21 core tests passed on native. Web typecheck and a production chunk-budget build passed. Android and iOS Expo bundle exports passed. Browser checks exposed a graphics chunk cycle; dependency-ordered chunking was added and is under browser revalidation. The native production audit initially found two CLI-only advisories; the CLI was moved to explicit build dependencies, with a full follow-up audit still required.

### Migration / Setup notes

Use the documented local schema. Three.js event handlers have narrow Biome annotations because mesh/group elements are not DOM controls; synchronized labelled controls supply keyboard and screen-reader access. The retry effect intentionally depends on its retry command counter. Neither annotation disables unrelated checks.
