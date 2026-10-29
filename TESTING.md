# Testing

Use pnpm throughout. Windows PowerShell may block .ps1 launchers; use pnpm.cmd without changing execution policy.

Commands: pnpm typecheck; pnpm lint; pnpm format:check; pnpm test; pnpm coverage; pnpm build; pnpm deps:audit; pnpm audit:standards. Run pnpm test:parity with the other repository path to compare portable sources and fixtures.

Tests cover rules, imports, special moves, king safety, draw claims and automatic boundaries, persistence corruption/migration/failure, bounded engine behavior, cancellation and message validation. Component and renderer checks exercise actual user actions and scene behavior. Coverage thresholds are fixed at 90% statements, branches, functions and lines across src production code. They must not be lowered or untested changed code excluded. A failed threshold remains a failure and is reported in VALIDATION.md.

Web: pnpm test:browser starts the production preview on 4173 using a single Chrome worker. It checks real WebGL, games, all difficulties, local persistence, imports/promotion, reset, offline reload, route handling, keyboard focus, headers and network behavior. Screenshots cover widths 320, 390, 768, 1024, 1440 in both themes with reduced motion. Software WebGL is not representative of a physical GPU.

Native: pnpm build exports Android/iOS Hermes bundles. pnpm android and pnpm ios generate native projects through Expo; generated code must not be edited by hand. pnpm build:android requests a release build. A native export is not device runtime proof. iOS release/runtime validation needs macOS, Xcode and a compatible simulator/physical device. Actual evidence and unavailable tools are recorded in VALIDATION.md.
