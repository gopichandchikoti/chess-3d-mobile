# Operations

This is a local-first static/native app with no server or database operations. There are no credentials to rotate in application configuration. Hosts may keep ordinary access logs; the app contains no analytics SDK.

Build/deploy using DEPLOYMENT.md. For a rollback, publish a known verified build under the same origin and let users accept its offline-worker update. Emergency disablement requires unregistering only this app's worker and removing only Chess 3D caches. Keep HTML and worker responses revalidating.

Back up individual games through PGN export. Settings/progress have no cloud backup; browser/app data deletion is permanent. Reset is local and user-confirmed.

Before any release, rerun audits, secret scans, size gates, coverage, browser journeys and physical-device checks. Check SECURITY-REVIEW.md for build-tool advisories. A clean build does not prove chess strength, real-device performance or store readiness.
