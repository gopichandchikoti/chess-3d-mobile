# Chess 3D design record

Audience: offline casual players learning standard chess and playing locally. The board is the product. The identity uses walnut, warm ivory and forest green, with brass for selected moves. There are no decorative gradients, external assets or marketing statistics.

Palette: light background #f4f0e7, surface #fffaf0, ink #252f2a, muted #506056, primary #285a43, onPrimary #ffffff; dark background #151d19, surface #202c25, ink #f4f0e7, muted #b6c6bb, primary #a2cfb2, onPrimary #14251b. Status errors use #a12c36 light and #ffadb1 dark. The contrast script measures all text pairs.

Typography: web self-hosts DM Sans Variable and Fraunces Variable under OFL-1.1. Native uses the operating system sans and serif families for legibility and offline availability. Sizes: 12,14,16,20,28,40. Spacing: 4,8,12,16,24,32,48. Radii: controls 8, panels 16, dialogs 24. Controls have a 44px minimum target. Borders define surfaces; shadows belong to floating layers and the 3D scene.

Original chess meshes use procedural cylinders, spheres, cones and boxes. Ivory and walnut pieces have distinct silhouettes, selectable squares use brass rings, legal destinations use green and the checked king uses the error material. Camera controls coexist with labelled move controls outside the canvas.

Motion: mass 1, snappy response .32 damping .86; smooth .50/1; bouncy .45/.70. Piece movement follows a damped spring; captures shrink and promotions grow. Reduced motion removes travel and scale. Web screen transitions use generated spring linear() curves with a cubic-bezier fallback. Native screen opacity uses the platform Animated API; geometry uses the same spring equation. Rendering pauses when hidden or backgrounded.

Voice: clear, calm, deterministic and honest. The assistant identifies itself as an offline robot. Difficulty names are relative to the original bounded engine, never a rating or Stockfish comparison. All copy lives in src/core/content.ts.

No backend, accounts, uploads, analytics, remote assets or runtime network APIs. Privacy and terms explain local data, dependency licenses and limitations.
