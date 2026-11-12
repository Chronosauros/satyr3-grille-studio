# Current state

13.11.2026: the tool moved to https://soundblooms.com/tools/satyr3-grille-studio.
GitHub Pages redirects the old github.io address there (redirect block at the top
of `index.html`, active only on github.io hosts, so opening the file from disk does
not redirect). The soundblooms copy is made by soundblooms' `apps/web/scripts/tools-sync.mjs`
from this repo's `index.html`; edit this repo, not the copy.

Reliability and export improvements; eight regression tests pass.

Reliability fixes cover saved-settings validation, solver invalidation and
debouncing, wall-search coverage for the selected minimum (including 3 mm), cache retries, SVG escaping,
STL export snapshots, concurrency, retries and WASM resource deletion, and
gallery queue cancellation.

Next result: verify rendering in a real browser and WASM-backed STL export
as a follow-up integration check.
