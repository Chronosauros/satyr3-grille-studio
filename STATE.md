# Current state

Reliability and export improvements; eight regression tests pass.

Reliability fixes cover saved-settings validation, solver invalidation and
debouncing, wall-search coverage for the selected minimum (including 3 mm), cache retries, SVG escaping,
STL export snapshots, concurrency, retries and WASM resource deletion, and
gallery queue cancellation.

Next result: verify rendering in a real browser and WASM-backed STL export
as a follow-up integration check.
