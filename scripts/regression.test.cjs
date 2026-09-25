const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function app(saved = null) {
  const timers = new Map(), elements = new Map();
  let id = 0;
  const context = vm.createContext({
    console, Blob, performance: { now: () => 0 }, window: {},
    localStorage: { getItem: key => key.endsWith(':state') ? JSON.stringify(saved) : null },
    document: { getElementById: key => {
      if (!elements.has(key)) elements.set(key, { textContent: '', disabled: false });
      return elements.get(key);
    } },
    setTimeout: fn => { timers.set(++id, fn); return id; },
    clearTimeout: key => timers.delete(key), requestAnimationFrame: () => 1,
  });
  vm.runInContext(source.split('/* ---------- boot ---------- */')[0], context);
  vm.runInContext('syncControls=()=>{};renderMain=()=>{}', context);
  return { context, timers, elements, run: code => vm.runInContext(code, context, { timeout: 30000 }) };
}

test('all shipped presets generate finite, bounded geometry', () => {
  const a = app();
  const results = a.run(`[...PRESETS_NEW,...PRESETS_OLD].map(p=>{
    const g=generate(p.type,{...TYPES[p.type].def,...p.par});
    return {name:p.name,count:g.polys.length,open:g.open,valid:g.polys.every(poly=>poly.length>=3&&poly.every(pt=>pt.every(Number.isFinite)&&Math.hypot(...pt)<=REACH+0.021))};
  })`);
  for (const result of results) {
    assert.ok(result.count > 0 && result.valid, result.name);
    assert.ok(result.open > 0 && result.open < 1, result.name);
  }
});

test('saved parameters cannot introduce invalid numbers or unknown fields', () => {
  const a = app({ type: 'breeze', preset: {}, params: { breeze: { cell: 0, wall: 'bad', motif: 2.8, unexpected: 123 } } });
  assert.equal(a.run('S.params.breeze.cell'), 8);
  assert.equal(a.run('S.params.breeze.wall'), 2.2);
  assert.equal(a.run('S.params.breeze.motif'), 3);
  assert.equal(a.run('S.params.breeze.unexpected'), undefined);
  assert.equal(a.run('S.preset'), '');
  assert.equal(app({ type: '__proto__' }).run('S.type'), 'breeze');
});

test('3 mm wall requirement finds gaps outside the old fixed search neighborhood', () => {
  const a = app();
  const wall = a.run(`MIN_WALL=3;measureWall([[[2.59,0],[2.59,1],[2.58,1],[2.58,0]],[[5.3,0],[5.31,0],[5.31,1],[5.3,1]]])`);
  assert.ok(Math.abs(wall - 2.71) < 0.001);
  assert.equal(a.run('wallOk(NaN)'), false);
});

test('a new request invalidates running solver work before the debounce fires', () => {
  const a = app();
  a.run(`S.air.mode='target';solveAir()`);
  const oldStep = [...a.timers.values()][0];
  a.run(`S.solved={type:S.type,over:{}};requestSolve(200)`);
  assert.equal(a.run('S.solved'), null);
  oldStep();
  assert.equal(a.run('S.solved'), null);
  a.run(`S.air.mode='design';requestSolve();solveAir()`);
  assert.equal(a.run('S.solved'), null);
});

test('cache retries failures and includes the minimum wall', () => {
  const a = app();
  a.run(`let calls=0;generate=()=>{if(++calls===1)throw Error('test');return {calls}}`);
  assert.throws(() => a.run('current()'), /test/);
  assert.equal(a.run('current().calls'), 2);
  assert.equal(a.run('current().calls'), 2);
  assert.equal(a.run('MIN_WALL=3;current().calls'), 3);
});

test('SVG title escapes markup and binary STL preserves vertices', async () => {
  const a = app();
  assert.equal(a.run(`escapeXml('<test & "name">')`), '&lt;test &amp; &quot;name&quot;&gt;');
  const blob = a.run(`stlBlob({numProp:3,triVerts:[0,1,2],vertProperties:[0,0,0,1,0,0,0,1,0]})`);
  const data = new DataView(await blob.arrayBuffer());
  assert.equal(data.byteLength, 134);
  assert.equal(data.getUint32(80, true), 1);
  assert.equal(data.getFloat32(92, true), 1);
  assert.equal(data.getFloat32(108, true), 1);
});

test('gallery refresh cancels the previous queue', () => {
  const a = app();
  a.run('let count=0;runJobs([()=>count++]);refreshCards()');
  [...a.timers.values()][0]();
  assert.equal(a.run('count'), 0);
});

test('STL export releases every WASM object on success and failure', async () => {
  for (const fail of [false, true]) {
    const a = app();
    a.context.fail = fail;
    a.run(`
      let allocated=0,deleted=0,downloads=0;
      class Shape {
        constructor(){allocated++}
        static circle(){return new Shape()}
        static revolve(){return new Shape()}
        static cylinder(){return new Shape()}
        subtract(){return new Shape()}
        extrude(){return new Shape()}
        translate(){return new Shape()}
        add(){return new Shape()}
        getMesh(){if(fail)throw Error('mesh failure');return {numProp:3,triVerts:[0,1,2],vertProperties:[0,0,0,1,0,0,0,1,0]}}
        delete(){deleted++}
      }
      ensureManifold=async()=>({Manifold:Shape,CrossSection:Shape});
      dl=()=>downloads++;current=()=>({polys:[]});
      setTimeout=fn=>{fn();return 1};
    `);
    await a.run('exportStl()');
    assert.equal(a.run('allocated'), 12);
    assert.equal(a.run('deleted'), a.run('allocated'));
    assert.equal(a.elements.get('bStl').disabled, false);
    assert.equal(a.run('downloads'), fail ? 0 : 1);
  }
});
