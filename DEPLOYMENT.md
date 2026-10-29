# Deployment and local builds

Web: pnpm install --frozen-lockfile; pnpm check; pnpm test; pnpm coverage; pnpm build; pnpm test:browser. Serve dist only with HTTPS. The included _headers/_redirects target hosts that support those files; other hosts must reproduce the same headers and SPA fallback. Never deploy the repository root.

CSP allows only same-origin scripts, styles, fonts, images and workers. Inline style attributes are narrowly allowed for the React Three Fiber canvas sizing; inline script, unsafe-eval, remote scripts and wildcard sources remain forbidden. This engine needs neither WebAssembly nor wasm-unsafe-eval. Framing is denied, unused device permissions are disabled, nosniff and referrer/cross-origin policies are set. HSTS is production-HTTPS only. Validate the deployed origin rather than assuming a host honors these files.

Hashed assets use one-year immutable caching; HTML and sw.js must revalidate. Brotli/gzip twins are generated for JS/CSS. Configure content negotiation at the host to serve them; merely uploading twins does not enable compression. Static-host ETags, conditional requests, HTTP/2 and HTTPS redirects depend on the provider and need deployment verification. Self-hosted fonts are bundled under OFL notices.

Offline strategy: the build generates a cache version from content-hashed asset names, preloads the local shell/engine/3D/fonts, and serves cached local assets. Navigation falls back to the cached shell when offline. No remote responses or game data are cached. The first visit needs connectivity; later play and reload work offline once the cache is ready. A new worker waits for the user to select Load update; activation deletes older Chess 3D caches. Settings removes the cache. The offline=off URL switch disables registration. Unregister and remove existing Chess 3D caches for an emergency kill; do not delete unrelated origin caches.

Native: install dependencies including build-time dev dependencies, run pnpm exec expo prebuild --platform android --no-install, then the generated Gradle assembleRelease using the installed SDK/NDK/JDK. No paid EAS service, backend or API key is required. iOS requires a Mac/Xcode and owner-controlled signing for distribution. A local Android test APK may use the template's development signing identity; do not distribute it as a production-signed release. Do not commit a keystore or signing secret.

Store accounts, production signing, legal review and public hosting are separate owner actions. No remote repository, public deployment, commit or push was authorized or performed.
