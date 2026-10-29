# Threat model

Assets are local game integrity, learning progress, application availability and build provenance. Game data is non-sensitive; the browser/app sandbox and device owner remain trusted to control their own files. Local storage is not an authority boundary.

| Boundary                       | Attack path / impact                                          | Mitigation                                                                       | Verification                                      |
| ------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------- |
| Static host to browser         | Tampered scripts or missing framing policy                    | HTTPS, CSP, no remote assets, framing restriction                                | Production build and header/browser checks        |
| Local JSON to app              | Corruption, hostile enums or expensive replay                 | Byte/count caps, version validation and replay                                   | Storage corruption/oversize tests                 |
| FEN/PGN to rules               | Invalid kings, illegal moves, hostile markup, oversized input | Controlled parser, bounded input and safe text rendering                         | Chess import tests                                |
| Worker to state                | Stale, forged, illegal or malformed results                   | Request identity, legal-move validation, cancellation, timeout                   | Protocol/worker tests                             |
| Native scheduling to UI        | Long search blocks interaction or continues in background     | Eight-node yields, node/time caps and AppState cancellation                      | Search tests; actual device checks still required |
| Procedural 3D to GPU           | Heavy meshes or persistent hidden rendering                   | Small local geometry, bounded resolution, visibility pause                       | Scene tests and browser/device inspection         |
| Dependencies to build          | Malicious scripts, vulnerable CLI, license gaps               | Exact direct versions, lockfile, explicit script permissions, audits and notices | Dependency audit and lockfile review              |
| Build configuration to runtime | Public environment secrets                                    | No env variables; source/config/output pattern scan                              | Audit scripts and tracked-file review             |

There is no native engine bridge: this release's original portable engine uses local TypeScript. There is no network proxy, file-path input, archive extractor, user account or database. The browser Clipboard action is explicit and exports only the current PGN.

Residual risks: a compromised device or hosting origin can replace game data/code; quota eviction loses local progress; drivers and GL implementations differ; the custom engine has limited strength. Build-tool advisories and unavailable checks are listed in the review. Create a new threat model before adding any backend or cloud sync.
