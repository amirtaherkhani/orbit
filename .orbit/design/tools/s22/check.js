// Self-check of the S22 logic (decisions N6-N10). Run by tools/lc_s22.py; exits non-zero on the first failure.
const assert = require('assert');
const fs = require('fs');
const timers = []; const focused = [];
global.setTimeout = (f) => { timers.push(f); return timers.length; };
global.clearTimeout = () => {};
global.document = { getElementById: (id) => ({ focus: () => focused.push(id) }) };
class DCLogic { constructor(p) { this.props = p || {}; this.state = {}; } setState(x) { Object.assign(this.state, x); } }
const Component = new Function('DCLogic', fs.readFileSync(__dirname + '/logic.js', 'utf8') + '\nreturn Component;')(DCLogic);
const fresh = () => { timers.length = 0; focused.length = 0; const c = new Component({}); return { c, v: () => c.renderVals(), flush: () => { while (timers.length) timers.shift()(); } }; };
const key = (k) => ({ key: k, preventDefault() {} });

// start: Home, menu closed, Monitoring live on the shared bookmark set, no loading (N6, N7)
let t = fresh(); let v = t.v();
assert.ok(v.isHome && !v.menuOpen && !v.loading, 'starts on Home, menu closed');
assert.equal(v.mnStyle, '', 'the page is sharp while the menu is closed');
assert.equal(v.pages.length, 6); assert.equal(v.tiles.length, 5);
assert.deepEqual(v.dockBms.map((d) => d.label), ['Dashboards › Playlists', 'Dashboards › Library panels', 'Explore']);
t.c.pickApp('management'); assert.equal(t.v().loading, true, 'other apps show loading'); t.flush(); assert.equal(t.v().loading, false);
t.c.pickApp('monitoring'); assert.equal(t.v().loading, false, 'Monitoring never loads'); assert.equal(timers.length, 0);
t.c.state.bm['monitoring/Dashboards/Snapshots'] = true; assert.equal(t.v().dockBms.length, 4, 'Monitoring bookmarks use the same bm');

// N8: Esc closes the menu and focus returns to the Menu button; so does a click outside
t = fresh(); t.v().toggleMenu(); assert.ok(t.v().menuOpen); t.flush(); assert.equal(focused.pop(), 's22-t0', 'focus enters the menu');
t.v().sheetKey(key('Escape')); t.flush(); assert.ok(!t.v().menuOpen); assert.equal(focused.pop(), 's22-menu');
t.v().toggleMenu(); t.v().closeMenu(); t.flush(); assert.ok(!t.v().menuOpen); assert.equal(focused.pop(), 's22-menu');
t.v().toggleMenu(); t.v().sheetKey(key('a')); assert.ok(t.v().menuOpen, 'other keys do not close');

// N9: arrows only move the highlight and focus; a tile click opens the page, closes the menu, returns focus (N8)
t = fresh(); t.v().toggleMenu(); focused.length = 0;
t.v().gridKey(key('ArrowRight')); t.flush(); assert.equal(t.c.state.focus, 1); assert.equal(focused.pop(), 's22-t1');
t.v().gridKey(key('ArrowRight')); t.v().gridKey(key('ArrowLeft')); assert.equal(t.c.state.focus, 1);
t.v().gridKey(key('ArrowLeft')); t.v().gridKey(key('ArrowLeft')); assert.equal(t.c.state.focus, 0, 'clamped at the first tile');
assert.equal(t.c.state.opened, null, 'arrows never open a page'); assert.ok(t.v().menuOpen);
t.v().gridKey(key('ArrowRight')); t.flush(); focused.length = 0;
t.v().tiles[1].open(); t.flush(); v = t.v();
assert.ok(!v.menuOpen && v.isPage && !v.isHome, 'opening closes the menu');
assert.equal(v.crumbPage, 'Dashboards'); assert.equal(v.crumbSub, 'Snapshots'); assert.equal(focused.pop(), 's22-menu');
t.v().steps[0].go(); assert.ok(t.v().isHome, 'Home step resets the opened page');

// B bookmarks the highlighted tile; a page with no sub pages bookmarks itself
t = fresh(); t.v().tiles[0].toggleBk(); assert.ok(!t.c.state.bm['monitoring/Dashboards/Playlists']);
t.v().gridKey(key('b')); assert.ok(t.c.state.bm['monitoring/Dashboards/Playlists'], 'B toggles the focused tile');
t.v().pages[1].pick(); assert.equal(t.v().tiles[0].canBk, false); t.v().gridKey(key('B')); assert.ok(!t.c.state.bm['monitoring/Explore']);

// pages whose sub pages are not drawn say so, and keep the page bookmark
t.v().pages[2].pick(); v = t.v(); assert.equal(v.tiles.length, 0); assert.ok(/not drawn/.test(v.tilesNote) && v.hasPages);

// N3 + N10: states switch; Viewer hides Administration and Continue setup; an app with no pages says so
t = fresh(); t.v().states[2].pick(); v = t.v();
assert.ok(v.empty && !v.hasPages && v.canSetup && v.menuOpen, 'No pages yet: empty app, Continue setup shown');
assert.deepEqual(v.states.map((s) => s.on), [false, false, true]);
t.v().states[1].pick(); v = t.v(); assert.ok(v.empty && v.cantSetup && !v.canSetup, 'Viewer: no Continue setup');
assert.deepEqual(v.states.map((s) => s.on), [false, true, false]);
t.v().states[0].pick(); v = t.v(); assert.equal(v.appName, 'Monitoring'); assert.equal(v.pages.length, 6);
t.v().states[1].pick(); v = t.v(); assert.equal(v.pages.length, 5, 'Viewer: Administration is hidden');
assert.ok(!v.pages.some((p) => p.label === 'Administration'));
console.log('s22 logic ok');
