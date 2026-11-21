// Self-check of the S22 page logic and the C06 MenuSheet logic (decisions N6-N10 and the MenuSheet merge, 2026-11-20).
// Run by tools/lc_s22.py; exits non-zero on the first failure.
const assert = require('assert');
const fs = require('fs');
const timers = []; const focused = [];
global.setTimeout = (f) => { timers.push(f); return timers.length; };
global.clearTimeout = () => {};
global.document = { getElementById: (id) => ({ focus: () => focused.push(id) }), addEventListener: () => {}, removeEventListener: () => {}, querySelectorAll: () => [] };
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
v = new Sheet({ page: 'Drilldown' }).renderVals(); assert.ok(v.tiles.length === 4 && !v.tilesNote, 'a static screen can name the page; every sub page is drawn');
assert.ok(new Sheet({ appsOpen: true }).renderVals().open, 'a static screen can open the app list');

// N10: an app with no pages yet says so; a viewer (mock role) gets no Continue setup and no Administration
v = new Sheet({ app: 'energy' }).renderVals(); assert.ok(v.empty && !v.hasPages && v.canSetup && v.noIcon, 'Energy: no pages yet, letter tile');
v = new Sheet({ app: 'energy', viewer: true }).renderVals(); assert.ok(v.cantSetup && !v.canSetup, 'Viewer: no Continue setup');
v = new Sheet({ viewer: true }).renderVals(); assert.ok(!v.pages.some((x) => x.label === 'Administration'), 'Viewer: Administration is hidden');
// S10: Administration's group tabs; tiles come from the open group, a group not drawn shows the note
s = new Sheet({ page: 'Administration' }); v = s.renderVals();
assert.deepEqual(v.groups.map((g) => g.label + ' ' + g.count), ['General 6', 'Plugins and data 2', 'Access 4']); assert.equal(v.subCount, 12);
assert.equal(v.tiles.length, 6); v.groups[2].pick(); v = s.renderVals(); assert.deepEqual(v.tiles.map((x) => x.label), ['Users', 'Teams', 'Service accounts', 'Authentication']);
v.tabKey(key('ArrowRight')); assert.equal(s.state.group, 0, 'arrows wrap around the tabs');

// C07 DockBookmarkAdd and the '+' overlay (S20): one overlay at a time, toggles write the page's set, a new bookmark lands in the dock
const Bk = load('bookmark.js');
t = page(); t.v().toggleAdd(); assert.equal(t.v().dockOverlay, 'bookmark'); t.v().toggleMenu(); assert.ok(t.v().menuOpen && t.v().dockOverlay === 'menu', 'the menu closes the popover');
t = page(); t.c.pickApp('management'); flush(); t.v().toggleAdd();
const bk = () => { const pv = t.v(); return new Bk({ app: pv.dockApp.id, bm: pv.bm, onToggle: pv.toggleBm, onClose: pv.toggleAdd, anchored: true }); };
v = bk().renderVals(); assert.equal(v.count, 2); assert.deepEqual(v.rows.map((r) => r.label), ['Overview', 'Line status', 'Shifts', 'Alarms', 'Reports', '3D view']);
v.rows[2].toggle(); assert.ok(t.c.state.bm['management/Overview/Shifts']); assert.ok(t.v().dockBms.some((d) => d.label === 'Overview › Shifts' && d.fresh), 'lands in the dock');
flush(); assert.ok(!t.v().dockBms.some((d) => d.fresh), 'the landing mark clears');
v = bk().renderVals(); v.key(key('Escape')); assert.equal(t.v().dockOverlay, 'none', 'Esc closes the popover');
['management/Overview', 'management/Reports', 'management/3D view'].forEach((k) => t.v().toggleBm(k));
v = bk().renderVals(); assert.ok(v.full && v.count === 6); assert.equal(v.rows[3].label, 'Alarms'); v.rows[3].toggle(); assert.ok(!t.c.state.bm['management/Overview/Alarms'], 'a full dock adds nothing');
const b = new Bk({}); b.setState({ q: 'week' }); v = b.renderVals(); assert.deepEqual(v.rows.map((r) => r.ctx + '|' + r.label), ['Reports|Weekly'], 'search is flat with the page name');
// one mock for every board (S11 merged): Settings is bookmarked but kept out of the dock; Quality is outside the selector
t = page(); v = t.v(); assert.ok(t.c.state.bm['monitoring/Administration/Settings'] && !v.dockBms.some((d) => /Settings/.test(d.label)), 'a hidden bookmark stays out of the dock');
assert.equal(new Sheet({}).renderVals().bmCount, 4, 'the menu counts every bookmark of the app');
v = new Bk({ app: 'monitoring' }).renderVals(); assert.equal(v.count, 3, 'the popover counts dock places, not hidden bookmarks');
// S11 bookmarks page: C08 view, C09 card, C10 panel, C11 preview on the shared mock; S11 wires them to the page's bookmark state
global.window = {};
const View = load('dockpages.js'); const Card = load('pagecard.js'); const Panel = load('pagepanel.js'); const Prev = load('dockpreview.js');
v = new View({}).renderVals(); assert.deepEqual(v.segs.map((x) => x.label), ['All 52', 'Bookmarked 8', 'Available 44']);
assert.deepEqual(v.items.filter((x) => x.isHead).map((x) => x.name), ['Monitoring', 'Management', 'Maintenance'], 'apps that are not enabled have no pages (Quality: review required)');
assert.ok(/4 bookmarked · 3 of 6 in the dock$/.test(v.items[0].meta), 'Settings is bookmarked, not in the dock');
v = new Card({}).renderVals().c; assert.ok(v.subsOpen && v.subsList.length === 5 && v.subText === '5 sub pages · 2 bookmarked');
v = new Card({ page: 'monitoring/Administration', expanded: true }).renderVals().c;
assert.deepEqual(v.subsList.filter((x) => x.isGrp).map((x) => x.name), ['General', 'Plugins and data', 'Access'], 'group names head their rows');
const pn = new Panel({ sel: 'monitoring/Administration/Settings' }); v = pn.renderVals().p;
assert.ok(v.bkStr === 'true' && v.dockStr === 'false' && v.menuPath === 'Monitoring › Administration › General › Settings');
v.toggleDock(); assert.equal(pn.renderVals().p.dockStr, 'true', 'Show in the dock works on its own board');
assert.deepEqual(new Prev({}).renderVals().dpGroups.map((g) => g.name + ' ' + g.count), ['Monitoring 3 in the dock', 'Management 2 in the dock', 'Maintenance 2 in the dock']);
t = page(); t.v().toggleHidden('monitoring/Administration/Settings'); assert.ok(t.v().dockBms.some((d) => d.label === 'Administration › Settings'), 'S11: Show in the dock reaches the dock');
// S12 Apps page: C12 view, C13 card, C14 panel, C15 status chip, C16 lifecycle button (the status table as lc_compose.py injects it)
const ST = { notinit: { label: 'Not initialized', icon: 'notinit', tone: 'n', desc: 'd' }, review: { label: 'Review required', icon: 'review', tone: 'a', desc: 'd' },
  setupwip: { label: 'Setup in progress', icon: 'setupwip', tone: 'v', desc: 'd' }, enabled: { label: 'Enabled', icon: 'enabled', tone: 'k', desc: 'The app is available.' } };
const loadS = (f) => new Function('DCLogic', fs.readFileSync(__dirname + '/' + f, 'utf8').replace('/*MOCK*/', mock).replace('/*STATUS*/', 'const S = ' + JSON.stringify(ST) + ';') + '\nreturn Component;')(DCLogic);
const AV = loadS('appsview.js'); const AC = loadS('appcard.js'); const AP = loadS('apppanel.js'); const SC = loadS('statuschip.js'); const LB = loadS('lcbutton.js');
const av = new AV({}); v = av.renderVals(); assert.deepEqual(v.segs.map((x) => x.label), ['All 5', 'Enabled 2', 'Needs action 3']);
assert.deepEqual(v.cards.map((c) => c.id), ['management', 'maintenance', 'quality', 'energy', 'safety']); v.segs[2].pick(); assert.equal(av.renderVals().cards.length, 3, 'Needs action filters');
v.cards[0].select('quality'); assert.equal(av.renderVals().sel, 'quality', 'a card click selects it');
v = new AC({ app: 'energy' }).renderVals(); assert.ok(v.notEnabled && v.st === 'setupwip' && v.step === 3 && v.pages === '2 pages' && v.sub === 'v0.2.0 · discovered 08:52');
v = new AC({ app: 'management' }).renderVals(); assert.ok(v.enabled && v.hasUpd && v.places && v.pages === '3 pages');
v = new AP({}).renderVals(); assert.ok(v.hasTree && v.pagesMeta === '2 pages · 5 sub pages' && v.segs.every((x) => x.cls === 'lcd') && v.isNew);
assert.deepEqual(v.rows.map((r) => r.name), ['Work orders', 'Open', 'Planned', 'Closed', 'Downtime'], 'the first page with sub pages starts open');
v = new AP({ app: 'quality' }).renderVals(); assert.ok(v.noTree && v.segs[1].cls === 'lcc' && v.segs[0].cls === 'lcd' && v.status === 'Review required');
v = new SC({ kind: 'icon', status: 'review' }).renderVals(); assert.ok(v.isIcon && v.cls === 'lst g-a' && v.i_review && !v.i_enabled);
v = new LB({ status: 'setupwip' }).renderVals(); assert.ok(v.isLink && v.href === 'AppSetup.dc.html' && v.cls === 'p lca a-setup' && v.label === 'Continue setup');
v = new LB({ status: 'notinit' }).renderVals(); assert.ok(v.isBtn && v.cls === 'p lca a-init');
console.log('s22 logic ok');
