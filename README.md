# Chess 3D Mobile

A native Expo/React Native chess app with a procedural 3D board rendered through
React Three Fiber Native and Expo GL. It shares portable chess rules, engine,
content, schemas and fixtures with the original Chess 3D web application.
It does not embed the website in a WebView.

This is the **original 3D native implementation**, using package
**`com.chess3d.offline`**. It is separate from `chess-3d-mobile-replica`, whose native
board uses semantic views and whose package/storage are different.

## Status and features

Source includes local pass-and-play and robot games, legal moves and special
moves, a deterministic coach, six lessons, saved games/progress, themes, reduced
motion and reset controls. Portable rules and storage support bounded validated
move histories and FEN/PGN handling; see [STORAGE_SCHEMA.md](STORAGE_SCHEMA.md).

[VALIDATION.md](VALIDATION.md) is currently a work-in-progress record. Source and
build scripts do not establish a completed Android or iOS release. This README
does not claim native visual, performance or signing verification from the
documentation review.

## Requirements and quick start

- Node.js **22.13+** and **pnpm 11.28.3**.
- Android SDK/JDK and an emulator/device for Android.
- macOS, Xcode and signing configuration for native iOS builds.
- A custom native build with Expo GL; the native rendering path is not a browser.

Run commands from this mobile repository:

```sh
pnpm install --frozen-lockfile
pnpm start
```

Metro normally uses **8081**. Build/install a development app with `pnpm android`
or, on a configured Mac, `pnpm ios`. Keep the native device connected to the
development server as required by the Expo workflow. No runtime API key,
backend account or server is needed for chess play.

Choose a local or robot game, configure it and start. The 3D board is accompanied
by native controls and promotion/confirmation surfaces. Lessons and local history
use the same portable data model as the original web project.

## Architecture

```text
src/core/          mirrored rules, search, assistant, contracts, schemas and fixtures
src/platform/      native persistence, engine scheduling and 3D adapters
src/features/      native application screens and controls
plugins/           generated-native configuration, including GL preservation rules
scripts/           Android build workarounds and bundle/config checks
android/, ios/     generated platform projects
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the exact current folder boundaries.
The native engine yields during bounded search and cancels stale/background work.
Results are revalidated before use. Scene lifecycle and persistence are native
adapters; core game rules do not need a remote service.

## Robot and rules

`chess.js` supplies legal move handling. The original local engine uses weighted
Easy selection, Medium search bounded to depth 2 / 1,800 nodes / 700 ms, and Hard
search bounded to depth 4 / 14,000 nodes / 1,800 ms. The named levels describe its
own budgets; no measured Elo or Stockfish equivalence is claimed.

The coach uses deterministic local templates. Failure/cancellation handling is
part of the engine adapter rather than a request to an online model.
Read [AI_ENGINE.md](AI_ENGINE.md) for evaluation and search limitations.

## Data and privacy

AsyncStorage owns **`chess-3d.library`**, schema version **2**: settings, current
game, up to 50 completed games and lesson progress. Saves are validated and
serialised; corrupt/unsupported records produce recovery behaviour described in
[STORAGE_SCHEMA.md](STORAGE_SCHEMA.md). Reset affects this app's owned storage.

There are no personal accounts, analytics or cloud game APIs. Local storage is
not encrypted credential storage and does not sync across devices. Uninstalling
or clearing app data can remove progress. Release network/backup permissions
and signing must be proved from the built artifact before distribution; an
offline product intention is not sufficient evidence.

## Build and verification commands

| Command                                   | Purpose                                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `pnpm check`                              | Strict TypeScript, Biome lint and formatting.                                                   |
| `pnpm test`, `pnpm coverage`              | Unit/component tests and configured coverage thresholds.                                        |
| `pnpm audit:standards`, `pnpm deps:audit` | Project pattern/ignore checks and production dependency advisories.                             |
| `pnpm test:contrast`                      | Configured palette contrast checks.                                                             |
| `pnpm test:parity "../../chess-3d-web"`   | Compare the mirrored core files with Web.                                                       |
| `pnpm build`                              | Android/iOS JavaScript exports plus native-bundle checks; not signed native application builds. |
| `pnpm build:android`                      | Windows Android release builder and bundle/native checks.                                       |

The Android builder accepts the documented ABI argument, defaults to arm64-v8a
and x86_64, and reuses an installed SDK/Hermes toolchain. Read its script and
[DEPLOYMENT.md](DEPLOYMENT.md) for the platform-specific setup. JavaScript export
success is not an Xcode build or an installed-device test.

## Release requirements

Before distribution, inspect the built manifest, network/backup permissions,
exported components and signing certificate; use private signing outside the
repository. Run release-mode games without Metro, including promotion, captures,
rotation/backgrounding, persistence, permission/error paths and accessibility.
Measure rendering on the intended hardware. iOS must be compiled and tested on
the appropriate Apple toolchain separately.

## Troubleshooting

| Symptom                          | Check                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------- |
| Native app cannot find Metro     | Server port, device connectivity and development-build setup.                |
| GL scene fails to initialise     | Native Expo GL build and the surfaced renderer error.                        |
| Windows native compilation fails | SDK/JDK, installed CMake/Hermes and the documented short-path build helpers. |
| Core parity fails                | Sibling path and the exact changed mirrored files.                           |
| Saved data differs from Web      | Each installation has independent local storage; no sync is implemented.     |

## Project documents and contribution rules

Read [AGENTS.md](AGENTS.md), [system_design.md](system_design.md),
[FEATURE_LOG.md](FEATURE_LOG.md), [ARCHITECTURE.md](ARCHITECTURE.md),
[TESTING.md](TESTING.md), [SECURITY.md](SECURITY.md),
[THREAT_MODEL.md](THREAT_MODEL.md) and [OPERATIONS.md](OPERATIONS.md).
Own code uses [MIT](LICENSE); retain [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
Preserve the approved design and keep declared shared core files equivalent.
