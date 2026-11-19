class Component extends DCLogic {
constructor(props) {
super(props);
this.state = { viewer: false, menu: false, apps: false, opened: null, app: 'monitoring', page: 0, focus: 0, loading: false,
bm: { 'monitoring/Dashboards/Playlists': true, 'monitoring/Dashboards/Library panels': true, 'monitoring/Explore': true, 'management/Overview/Line status': true, 'management/Reports/Weekly': true, 'maintenance/Work orders/Open': true, 'maintenance/Downtime': true } };
}
componentWillUnmount() { clearTimeout(this.loadTimer); }
// data: one set for every app, Monitoring included (N7). A sub tile is [label, icon, description, dock icon]; subs null = sub pages not drawn on this board
apps() {
return {
monitoring: { name: 'Monitoring', ac: '#58cfec', bg: '#1d353f', sub: 'Grafana · 6 pages', pages: [
{ n: 'Dashboards', ic: 'r0', dk: 'chart', subs: [['Playlists', 't0', 'Rotate dashboards on a TV or kiosk screen', 'pl'], ['Snapshots', 't1', 'Saved copies of a dashboard at one moment', 'list'], ['Library panels', 't2', 'Panels you reuse across several dashboards', 'lp'], ['Shared dashboards', 't3', 'Dashboards open through a public link', 'list'], ['Recently deleted', 't4', 'Bring back dashboards that were removed', 'clock']] },
{ n: 'Explore', ic: 'r1', dk: 'ex', subs: [] },
{ n: 'Drilldown', ic: 'r2', dk: 'list', count: 4, subs: null },
{ n: 'Alerting', ic: 'r3', dk: 'bell', count: 6, subs: null },
{ n: 'Connections', ic: 'r4', dk: 'list', count: 2, subs: null },
{ n: 'Administration', ic: 'r5', dk: 'list', count: 12, subs: null, adm: true }] },
management: { name: 'Management', ac: '#e0b46a', bg: '#2d2618', sub: 'Production line · 3 pages', pages: [
{ n: 'Overview', ic: 'chart', subs: [['Line status', 'chart', 'Live status of each station on the line'], ['Shifts', 'clock', 'Output and stops per shift'], ['Alarms', 'bell', 'Open alarms on the line']] },
{ n: 'Reports', ic: 'doc', subs: [['Daily', 'doc', 'Yesterday per station'], ['Weekly', 'doc', 'This week against the plan'], ['Monthly', 'doc', 'Month summary for managers'], ['Export', 'list', 'Download reports as CSV or PDF']] },
{ n: '3D view', ic: 'cube', subs: [] }] },
maintenance: { name: 'Maintenance', ac: '#5794f2', bg: '#17233b', sub: 'Work orders · 2 pages', isNew: true, pages: [
{ n: 'Work orders', ic: 'list', subs: [['Open', 'list', 'Work orders not closed yet'], ['Planned', 'clock', 'Planned maintenance by date'], ['Closed', 'doc', 'Closed work orders']] },
{ n: 'Downtime', ic: 'clock', subs: [['By cause', 'chart', 'Downtime minutes by cause'], ['By machine', 'cube', 'Downtime minutes by machine']] }] },
energy: { name: 'Energy', ac: '#f2cc0c', bg: '#2e2a14', sub: 'No pages yet', pages: [] }
};
}
// Focus goes back to the Menu button after the menu closes (N8); skipped when there is no document (Node check)
focusEl(id, alt) {
if (typeof document === 'undefined') return;
setTimeout(() => { const el = document.getElementById(id) || (alt && document.getElementById(alt)); if (el) el.focus(); }, 0);
}
openMenu() { this.setState({ menu: true, apps: false }); this.focusEl('s22-t' + this.state.focus, 's22-rsw'); }
closeMenu() { this.setState({ menu: false, apps: false }); this.focusEl('s22-menu'); }
openPage(app, page, sub) { this.setState({ menu: false, apps: false, opened: { app, page, sub } }); this.focusEl('s22-menu'); }
toggleApps() { const { menu, apps } = this.state; this.setState({ menu: true, apps: menu ? !apps : true }); }
pickApp(id) {
const { app } = this.state;
if (id === app) { this.setState({ apps: false }); return; }
clearTimeout(this.loadTimer);
// Monitoring is Grafana's own app: it never shows the loading state (N6)
this.setState({ app: id, page: 0, focus: 0, apps: false, loading: id !== 'monitoring' });
if (id !== 'monitoring') this.loadTimer = setTimeout(() => this.setState({ loading: false }), 650);
}
renderVals() {
const A = this.apps(); const { viewer, menu, apps, opened, app, page, focus, loading, bm } = this.state; const cur = A[app];
const ICONS = ['chart', 'doc', 'cube', 'list', 'clock', 'bell', 'r0', 'r1', 'r2', 'r3', 'r4', 'r5', 't0', 't1', 't2', 't3', 't4'];
const icon = (o, ic) => { ICONS.forEach((k) => { o['i_' + k] = ic === k; }); return o; };
const DK = ['chart', 'doc', 'cube', 'list', 'clock', 'bell', 'pl', 'lp', 'ex'];
const shown = cur.pages.filter((p) => !(viewer && p.adm));
const pg = shown[page];
const vars = '--ac:' + cur.ac + ';--bg:' + cur.bg;
const pages = shown.map((p, i) => icon({ label: p.n, count: p.subs ? p.subs.length : p.count, hasSubs: p.subs === null || p.subs.length > 0, vars,
cur: i === page ? 'true' : 'false', cls: i === page ? 'rn on acx' : 'rn', pick: () => this.setState({ page: i, focus: 0 }) }, p.ic));
const isPage = !!pg && pg.subs !== null && pg.subs.length === 0;
const subs = !pg || pg.subs === null ? [] : (isPage ? [[pg.n, pg.ic, 'This page has no sub pages', pg.dk]] : pg.subs);
const pageKey = pg ? app + '/' + pg.n : ''; const pgOn = !!bm[pageKey];
const subKey = (l) => (isPage ? pageKey : app + '/' + pg.n + '/' + l);
const flip = (k, on) => this.setState({ bm: Object.assign({}, bm, { [k]: !on }) });
const tiles = subs.map(([label, ic, desc], i) => { const on = !!bm[subKey(label)];
return icon({ id: 's22-t' + i, label, desc, vars, canBk: !isPage, cls: i === focus ? 'mzt on acx' : 'mzt', cur: i === focus ? 'page' : 'false',
bk: on, notBk: !on, bkCls: on ? 'mzbk on' : 'mzbk', bkPressed: on ? 'true' : 'false', bkLabel: (on ? 'Remove ' : 'Add ') + label + (on ? ' from bookmarks' : ' to bookmarks'),
focus: () => { if (focus !== i) this.setState({ focus: i }); }, open: () => this.openPage(app, pg.n, isPage ? null : label), toggleBk: () => flip(subKey(label), on) }, ic); });
const bmCount = Object.keys(bm).filter((k) => bm[k] && k.indexOf(app + '/') === 0).length;
let dockBms = [];
shown.forEach((p) => { if (bm[app + '/' + p.n]) dockBms.push([p.n, p.dk || p.ic]); (p.subs || []).forEach(([l, ic, d, k]) => { if (bm[app + '/' + p.n + '/' + l]) dockBms.push([p.n + ' › ' + l, k || ic]); }); });
dockBms = dockBms.map(([label, ic]) => { const o = { label }; DK.forEach((k) => { o['i_' + k] = (DK.indexOf(ic) >= 0 ? ic : 'list') === k; }); return o; });
const appList = Object.keys(A).map((id) => ({ name: A[id].name, sub: A[id].sub, initial: A[id].name[0], isNew: !!A[id].isNew, isSel: id === app,
cls: id === app ? 'mzo cur' : 'mzo', vars: '--bg:' + A[id].bg + ';--ac:' + A[id].ac, tileStyle: 'background:' + A[id].bg + ';color:' + A[id].ac, ckStyle: 'color:' + A[id].ac, pick: () => this.pickApp(id) }));
const ft = subs[focus];
const hasPages = cur.pages.length > 0;
const note = pg && pg.subs === null ? pg.count + ' sub pages. They are not drawn on this board.' : '';
const keyOf = (e) => (e && e.key) || '';
const stop = (e) => { if (e && e.preventDefault) e.preventDefault(); };
const crumb = opened ? { a: A[opened.app].name, p: opened.page, s: opened.sub || '' } : { a: '', p: '', s: '' };
const first = () => { if (opened) return opened; if (pg) return { app, page: pg.n, sub: pg.subs && pg.subs.length ? pg.subs[0][0] : null }; return { app: 'monitoring', page: 'Dashboards', sub: 'Playlists' }; };
const screen = menu && apps ? 'apps' : menu ? 'menu' : opened ? 'page' : 'home';
const go = { home: () => this.setState({ menu: false, apps: false, opened: null }), menu: () => this.setState({ menu: true, apps: false }), apps: () => this.setState({ menu: true, apps: true }),
page: () => { const o = first(); this.setState({ app: o.app, opened: o, menu: false, apps: false }); } };
const steps = [['home', '1', 'Home'], ['menu', '2', 'Menu'], ['apps', '3', 'Apps'], ['page', '4', 'Page']].map(([id, n, label]) => ({ n, label, go: go[id], cur: screen === id ? 'step' : 'false', cls: screen === id ? 's22b on' : 's22b' }));
const mode = (v, a) => ({ viewer: v, page: 0, focus: 0, menu: true, apps: false, loading: false, app: a });
const states = [['Admin', !viewer && hasPages, () => this.setState(mode(false, hasPages ? app : 'monitoring'))], ['Viewer', viewer, () => this.setState(mode(true, app))], ['No pages yet', !viewer && !hasPages, () => this.setState(mode(false, 'energy'))]]
.map(([label, on, pick]) => ({ label, on, pick, cls: on ? 's22b on' : 's22b' }));
return {
apps: appList, pages, tiles, dockBms, dockVars: '--mac:' + cur.ac + ';--mbg:' + cur.ac + '1a;--mbd:' + cur.ac + '47;--mhv:' + cur.ac + '38', loadingStr: loading ? 'true' : 'false', loading, ready: !loading,
open: apps, openStr: apps ? 'true' : 'false', toggle: () => this.toggleApps(),
mnStyle: menu ? 'filter:blur(4px) brightness(.45)' : '', menuOpen: menu, menuCls: menu ? 'n on' : 'n', menuStr: menu ? 'true' : 'false', toggleMenu: () => (menu ? this.closeMenu() : this.openMenu()), closeMenu: () => this.closeMenu(),
sheetKey: (e) => { if (keyOf(e) === 'Escape') { stop(e); this.closeMenu(); } },
// arrows only move the highlight and the focus; opening is a click or Enter on the tile (N9)
gridKey: (e) => { const n = tiles.length; const k = keyOf(e); if (!n) return; let f = focus;
if (k === 'ArrowRight' || k === 'ArrowDown') f = Math.min(n - 1, focus + 1);
else if (k === 'ArrowLeft' || k === 'ArrowUp') f = Math.max(0, focus - 1);
else if (k === 'b' || k === 'B') { stop(e); if (isPage) flip(pageKey, pgOn); else tiles[focus].toggleBk(); return; }
else return;
stop(e); this.setState({ focus: f }); this.focusEl('s22-t' + f); },
isHome: !opened, isPage: !!opened, crumbApp: crumb.a, crumbPage: crumb.p, crumbSub: crumb.s, openedTitle: crumb.s || crumb.p, openedDesc: opened ? crumb.a + ' · ' + crumb.p + (crumb.s ? ' · ' + crumb.s : '') : '',
states, steps, canSetup: !viewer, cantSetup: viewer, tilesNote: note,
empty: !hasPages, hasPages, appName: cur.name, initial: cur.name[0], tileStyle: 'background:' + cur.bg + ';color:' + cur.ac,
pgBk: pgOn, pgNotBk: !pgOn, pgBkCls: pgOn ? 'mzpb on' : 'mzpb', pgBkStr: pgOn ? 'true' : 'false', pgBkText: pgOn ? 'Page bookmarked' : 'Bookmark page',
pgBkAria: pg ? (pgOn ? 'Remove the bookmark of ' + pg.n : 'Bookmark the page ' + pg.n) : '', togglePg: () => { if (pg) flip(pageKey, pgOn); },
openPg: () => { if (pg) this.openPage(app, pg.n, null); },
pageName: pg ? pg.n : cur.name, subLabel: !pg ? 'no pages yet' : pg.subs === null ? 'sub pages' : pg.subs.length ? 'sub pages' : 'no sub pages', subCount: pg ? (pg.subs ? pg.subs.length : pg.count) : 0, bmCount,
footName: ft ? ft[0] : (pg ? pg.n : cur.name), footDesc: ft ? ft[2] : (pg ? note : 'Its pages show here once setup is done'), footHere: ft ? 'You are here' : ''
};
}
}
