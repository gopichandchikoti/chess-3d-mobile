# Local engine and assistant

The owner authorized an original free engine on 2026-10-26 after requesting permissive alternatives. js-chess-engine was considered, but its current v2 needs Node 24 and does not expose this product's cancellation/scheduling contract. No Stockfish code, binary, GPL dependency, remote engine, LLM or API key is bundled. Own code is MIT.

Easy samples legal moves with injected weighted randomness, giving captures a modest bias and making ordinary mistakes. Medium runs iterative-deepening alpha-beta to depth 2, up to 1,800 nodes or 700 ms. Hard searches to depth 4, up to 14,000 nodes or 1,800 ms. Easy has a single-ply, 128-node/150-ms configuration and chooses without tree search. These names compare this engine's settings only. No Elo or tournament strength is claimed.

Evaluation includes material, central activity, pawn advancement, checks and a basic king-shelter bonus. Captures, promotions and checking moves are ordered first. Terminal mate scores prefer shorter mates. Search treats available repetition/50-move claims as a draw for evaluation; the game adapter separately requires a human draw claim and automatically ends only at fivefold/75 moves.

The last fully completed iteration wins when a budget expires. A timeout before any complete iteration returns the first legal ordered move with depth 0; this is the same explicitly bounded engine, not a replacement engine. The UI displays engine-unavailable on worker/bridge errors and offers retry. Stale searches are cancelled and cannot overwrite a newer game. Web permits one active worker request; native UI disables repeated hints while one runs.

Rook is a deterministic offline robot. It explains turns, the last SAN move, check, claimable draws and results through original content templates. Hints use local Medium analysis. Illegal move feedback is returned by the legal-rules adapter. No messages leave the device.

Known limits: no quiescence, opening book, tablebases or exhaustive dead-position solver. Material-only dead-position recognition follows chess.js. No guarantee of optimal play, 60 FPS desktop or 30 FPS mobile is made without device measurements.
