# Security

No accounts, backend, API, analytics, uploaded files or runtime secrets exist. Server authentication, database authorization, server sessions, CSRF tokens and API rate limits are not applicable. Static hosting still needs the headers documented in DEPLOYMENT.md.

FEN, PGN, saved JSON and worker messages cross explicit validation boundaries. Inputs have size/count limits and move histories are replayed through chess.js. User text is rendered as text. There is no arbitrary HTML, eval, string-built command or remote asset loader in application code. Search budgets, cancellation, watchdogs, bounded history and limited request controls reduce local CPU/memory exhaustion.

Only build output should be hosted. Do not expose the repository root, node_modules, dotfiles, logs, private keys or source maps. No environment file is needed. .env files, generated native output, local logs, artifacts, caches and keystores are ignored.

Run pnpm audit:standards, pnpm deps:audit, all tests, coverage and production builds before release. A dependency audit is not a proof of runtime exploitability or absence of vulnerabilities. See SECURITY-REVIEW.md and VALIDATION.md for the actual findings and executed checks. Gitleaks and Semgrep were not installed at preflight; the included scan is a bounded pattern scan, not a replacement claim.

Strix did not run: no external LLM use or provider upload was authorized for this product. No public deployment or store submission has occurred. Review the privacy and terms text and dependency notices before distribution.
