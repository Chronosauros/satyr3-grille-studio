# Satyr 3 Grille Studio

Standalone generator of front grilles for Satyr 3 headphones.
One HTML file, runs in any browser: pick a pattern family, choose the air
(keep the design's own open area or set a target), check the minimum wall
and download a print-ready STL or an SVG.

## Development

The app remains a standalone `index.html`; no installation or build is required.
With Node.js 18 or newer, run `npm test` for dependency-free regression tests.
They use VM-based DOM stubs to cover geometry for all presets, state handling,
solver behavior, caching, and the STL export resource lifecycle. They do not
cover real browser rendering or integration with the CDN-hosted WASM library.

## Credit and license

Adapted for Satyr 3 from
[Satyr3 Alternate Fasciae](https://www.printables.com/model/1188658-satyr3-alternate-fasciae)
by [Aplo](https://www.printables.com/@Aplo_2167696) - its files
(Interlocking_Slots_A.stl) were the measured base and starting point for this
generator. Original design:
[Satyr 3 DIY HiFi Headphones](https://www.printables.com/model/1186855-satyr-3-diy-hifi-headphones)
by its original author. Both licensed
[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
Changes: new front patterns and a parametric generator.
Grilles made with this tool are for non-commercial use only.

This is an unofficial fan tool, not affiliated with or endorsed by Aplo or the
Satyr 3 author. "Satyr 3" is used only to describe compatibility.
