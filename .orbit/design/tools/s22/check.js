// Self-check of the S22 page logic and the C06 MenuSheet logic (decisions N6-N10 and the MenuSheet merge, 2026-11-20).
// Run by tools/lc_s22.py; exits non-zero on the first failure.
const assert = require('assert');
const fs = require('fs');
const timers = []; const focused = [];
global.setTimeout = (f) => { timers.push(f); return timers.length; };
global.clearTimeout = () => {};
global.document = { getElementById: (id) => ({ focus: () => focused.push(id) }) };
class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } setState(x) { Object.assign(this.state, x); } }
const mock = fs.readFileSync(__dirname + '/mock.js', 'utf8').replace(/^\/\/.*$/gm, '');
const load = (f) => new Function('DCLogic', fs.readFileSync(__dirname + '/' + f, 'utf8').replace('/*MOCK*/', mock) + '\nreturn Component;')(DCLogic);
const Page = load('logic.js'); const Sheet = load('sheet.js');
const flush = () => { while (timers.length) timers.shift()(); };
const key = (k) => ({ key: k, preventDefault() {} });
const page = () => { timers.length = 0; focused.length = 0; const c = new Page({}); return { c, v: () => c.renderVals() }; };
// a sheet wired to a page, as S22 mounts it
const wired = (pg) => { const pv = pg.v(); return new Sheet({ app: pv.app, bm: pv.bm, loading: pv.loading, viewer: pv.viewer, appsOpen: pv.appsOpen,
  onPickApp: pv.pickApp, onToggle: pv.toggleBm, onOpen: pv.openPage, onClose: pv.closeMenu, onToggleApps: pv.toggleApps, anchored: true }); };

// page: Home, menu closed; Monitoring live on the shared bookmark set, never loading (N6, N7)
let t = page(); let v = t.v();
assert.ok(v.isHome && !v.menuOpen && !v.loading && v.mnStyle === '', 'starts on Home, menu closed, page sharp');
assert.deepEqual(v.dockBms.map((d) => d.label), ['Dashboards › Playlists', 'Dashboards › Library panels', 'Explore']);
t.c.pickApp('management'); assert.equal(t.v().loading, true, 'other apps show loading'); flush(); assert.equal(t.v().loading, false);
t.c.pickApp('monitoring'); assert.equal(t.v().loading, false, 'Monitoring never loads'); assert.equal(timers.length, 0);
t.v().toggleBm('monitoring/Dashboards/Snapshots'); assert.equal(t.v().dockBms.length, 4, 'one bookmark set for every app');

// N8: Esc (dock or sheet) and a click outside close the menu; focus returns to the Menu button
t = page(); t.v().toggleMenu(); assert.ok(t.v().menuOpen && t.v().dockOverlay === 'menu'); flush(); assert.equal(focused.pop(), 'ms-t0', 'focus enters the menu');
wired(t).renderVals().sheetKey(key('Escape')); flush(); assert.ok(!t.v().menuOpen); assert.equal(focused.pop(), 's22-menu');
t.v().toggleMenu(); t.v().sheetKey(key('Escape')); flush(); assert.ok(!t.v().menuOpen, 'Esc on the dock closes too'); assert.equal(focused.pop(), 's22-menu');
t.v().toggleMenu(); t.v().closeMenu(); flush(); assert.ok(!t.v().menuOpen); assert.equal(focused.pop(), 's22-menu');
t.v().toggleMenu(); wired(t).renderVals().sheetKey(key('a')); assert.ok(t.v().menuOpen, 'other keys do not close');

// N9: in the sheet, arrows only move the highlight and focus; a tile click opens the page, closes the menu, returns focus
t = page(); t.v().toggleMenu(); let s = wired(t); focused.length = 0;
s.renderVals().gridKey(key('ArrowRight')); flush(); assert.equal(s.state.focus, 1); assert.equal(focused.pop(), 'ms-t1');
s.renderVals().gridKey(key('ArrowLeft')); s.renderVals().gridKey(key('ArrowLeft')); assert.equal(s.state.focus, 0, 'clamped at the first tile');
assert.equal(t.c.state.opened, null, 'arrows never open a page');
s.renderVals().tiles[1].open(); flush(); v = t.v();
assert.ok(!v.menuOpen && v.isPage && v.crumbPage === 'Dashboards' && v.crumbSub === 'Snapshots', 'opening closes the menu'); assert.equal(focused.pop(), 's22-menu');

// B and the tile toggle write the page's bookmark set
t = page(); s = wired(t); s.renderVals().tiles[0].toggleBk(); assert.ok(!t.c.state.bm['monitoring/Dashboards/Playlists']);
s = wired(t); s.renderVals().gridKey(key('b')); assert.ok(t.c.state.bm['monitoring/Dashboards/Playlists'], 'B toggles the highlighted tile');

// merge decisions: a page without sub pages shows a notice; the app list holds the selector apps; apps show their icon
s = new Sheet({}); s.renderVals().pages[1].pick(); v = s.renderVals();
assert.ok(v.noticePage && v.tiles.length === 0, 'Explore shows a notice'); assert.equal(v.footDesc, 'Query and inspect your data without a dashboard');
v.togglePg(); assert.ok(!s.state.bm['monitoring/Explore'], 'the page bookmark still works');
assert.deepEqual(v.apps.map((a) => a.name), ['Monitoring', 'Management', 'Maintenance']); assert.equal(v.selCount, 3);
assert.ok(v.hasIcon && v.i_mon && v.apps.every((a) => a.hasIcon), 'apps with a logo show it');
v = new Sheet({ page: 'Drilldown' }).renderVals(); assert.ok(/not drawn/.test(v.tilesNote) && v.hasPages, 'a static screen can name the page');
assert.ok(new Sheet({ appsOpen: true }).renderVals().open, 'a static screen can open the app list');

// N10: an app with no pages yet says so; a viewer (mock role) gets no Continue setup and no Administration
v = new Sheet({ app: 'energy' }).renderVals(); assert.ok(v.empty && !v.hasPages && v.canSetup && v.noIcon, 'Energy: no pages yet, letter tile');
v = new Sheet({ app: 'energy', viewer: true }).renderVals(); assert.ok(v.cantSetup && !v.canSetup, 'Viewer: no Continue setup');
v = new Sheet({ viewer: true }).renderVals(); assert.ok(!v.pages.some((x) => x.label === 'Administration'), 'Viewer: Administration is hidden');
console.log('s22 logic ok');
