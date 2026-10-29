# Architecture

Two independent repositories install and build separately. No third repository or backend is required. Portable contracts, chess adapter, search, assistant copy, schemas, tokens and fixtures live in src/core and are mirrored byte for byte. Run pnpm test:parity with the other repository path.

Data flows from validated local storage to useLibrary, through immutable GameRecord updates to the chess adapter, then to both the 3D scene and labelled legal-move controls. The adapter owns chess.js and rebuilds its complete move sequence, preserving castling and repetition. An explicit result is archived once by game ID; undo removes that result. The retained history is bounded to 50 games.

The original search implements EnginePort. Web uses a disposable module worker with a 4.5 second watchdog, request IDs, message validation and AbortSignal cancellation. Native uses the same bounded search, yielding to the event loop every eight nodes, with cancellation on backgrounding. Results are rechecked against legal moves before application. No engine failure silently changes difficulty.

Procedural Three.js meshes need no model or texture downloads. Piece identities survive moves so the existing mesh travels; disappearing pieces remain briefly for capture animation. Camera and board interaction are platform adapters. Rendering stops in hidden browser tabs and backgrounded native apps.

Web uses native HTML controls, a History API route table and lazy Vite modules. Native uses React Native views, switches, text inputs, modal promotion, native confirmation alerts, safe areas and hardware Back handling. It never renders the web app in a WebView. Expo SDK may include transitive DOM-support modules, but the application has no WebView import or web rendering path.

Original app and engine code are MIT licensed. The owner authorized a free original engine instead of GPL Stockfish on 2026-10-26. There is no measured Elo, opening book or tablebase.

Native persistence validation is included eagerly in the bundled app; the web loads the identical validator lazily to keep the first script within its size budget. Both use the same parser and stored schema.
