# Local storage

The owned key is chess-3d.library, stored in localStorage on web and AsyncStorage on mobile. It contains schemaVersion 2, settings (theme, reducedMotion, showLegal, autoRotate), the current game or null, up to 50 completed games and up to six unique completed lesson IDs.

A game contains a bounded ID, creation time, initial FEN, strict SAN sequence, local/robot mode, difficulty, human color and an optional explicit outcome. Complete move replay restores repetition and castling rights. A FEN alone cannot encode earlier repetition; use PGN or a saved game. PGN import strips metadata/comments by retaining validated moves and an initial position; it is not a general PGN editor. An imported PGN result tag is not used as a resignation or agreement claim.

Serialized input is limited to 524,288 characters, FEN to 160, PGN to 32,768 and a game to 1,200 plies. Unknown properties are deliberately ignored. Types, enums, IDs, FEN and move histories are validated before use. Future versions, corrupt data and oversized values start a clean in-memory session and show a warning. The damaged saved copy is retained until reset or a deliberate mutation. Nothing stored is trusted for authorization.

The documented v1 migration accepts only schemaVersion 1 plus a valid theme, retaining that theme and supplying v2 defaults. This is a new unreleased schema. There is no supported downgrade that discards v2 game progress. Export PGN before changing schemas.

Writes are serialized to prevent stale AsyncStorage writes replacing a newer game. Failures surface to the user; in-memory play can continue. Reset removes this application's storage key only. Browser offline assets are separate from game data, have a versioned cache, and can be removed in Settings. Web also stores an owned offline-disabled preference. Clearing browser/app storage deletes progress permanently; there is no cloud sync or remote backup.
