class Component extends DCLogic {
// MenuSheet (R08, R09, R12). The shared state comes from props: app (useActiveApp), bm (useBookmarks), loading, appsOpen, viewer.
// The sheet itself keeps only the current page and the highlighted tile. Without the callbacks (on its own board or on a static
// screen) it keeps the shared state too, so every board works on its own.
constructor(props) { super(props); this.state = {}; }
/*MOCK*/
focusEl(id) {
if (typeof document === 'undefined') return;
setTimeout(() => { const el = document.getElementById(id); if (el) el.focus(); }, 0);
}
renderVals() {
const p = this.props; const A = this.apps();
const app = (p.onPickApp ? p.app : this.state.app || p.app) || 'monitoring';
const bm = (p.onToggle ? p.bm : this.state.bm || p.bm) || this.mockBookmarks();
const appsOpen = p.onToggleApps ? !!p.appsOpen : (this.state.apps === undefined ? !!p.appsOpen : this.state.apps);
const viewer = !!p.viewer; const loading = !!p.loading; const cur = A[app];
const shown = cur.pages.filter((x) => !(viewer && x.adm));
if (this.seenApp !== app) {  // a new app starts on its first page, or on the page a static screen names
this.seenApp = app; const ix = shown.findIndex((x) => x.n === p.page);
this.state.page = ix < 0 ? 0 : ix; this.state.focus = p.focus ? +p.focus : 0;
}
const { page, focus } = this.state;
const ICONS = ['chart', 'doc', 'cube', 'list', 'clock', 'bell', 'r0', 'r1', 'r2', 'r3', 'r4', 'r5', 't0', 't1', 't2', 't3', 't4'];
const icon = (o, ic) => { ICONS.forEach((k) => { o['i_' + k] = ic === k; }); return o; };
const withIcon = (o, a) => { o.hasIcon = !!a.icon; o.noIcon = !a.icon; ['mon', 'mgmt', 'mnt'].forEach((k) => { o['i_' + k] = a.icon === k; }); return o; };
const pg = shown[page];
const vars = '--ac:' + cur.ac + ';--bg:' + cur.bg;
const flip = (k) => { if (p.onToggle) p.onToggle(k); else this.setState({ bm: Object.assign({}, bm, { [k]: !bm[k] }) }); };
const pickApp = (id) => { if (p.onPickApp) p.onPickApp(id); else this.setState({ app: id, apps: false }); };
const open = (sub) => { if (pg && p.onOpen) p.onOpen(app, pg.n, sub); };
const pages = shown.map((x, i) => icon({ label: x.n, count: x.subs ? x.subs.length : x.count, hasSubs: x.subs === null || x.subs.length > 0, vars,
cur: i === page ? 'true' : 'false', cls: i === page ? 'rn on acx' : 'rn', pick: () => this.setState({ page: i, focus: 0 }) }, x.ic));
const isPage = !!pg && pg.subs !== null && pg.subs.length === 0;
const subs = !pg || pg.subs === null || isPage ? [] : pg.subs;
const pageKey = pg ? app + '/' + pg.n : ''; const pgOn = !!bm[pageKey];
const tiles = subs.map(([label, ic, desc], i) => { const k = pageKey + '/' + label; const on = !!bm[k];
return icon({ id: 'ms-t' + i, label, desc, vars, canBk: true, cls: i === focus ? 'mzt on acx' : 'mzt', cur: i === focus ? 'page' : 'false',
bk: on, notBk: !on, bkCls: on ? 'mzbk on' : 'mzbk', bkPressed: on ? 'true' : 'false', bkLabel: (on ? 'Remove ' : 'Add ') + label + (on ? ' from bookmarks' : ' to bookmarks'),
focus: () => { if (focus !== i) this.setState({ focus: i }); }, open: () => open(label), toggleBk: () => flip(k) }, ic); });
const piFlags = {}; if (pg) ICONS.forEach((k) => { piFlags['pi_' + k] = pg.ic === k; });
const appList = Object.keys(A).filter((id) => A[id].inSelector !== false).map((id) => withIcon({ name: A[id].name, sub: A[id].sub, initial: A[id].name[0], isNew: !!A[id].isNew, isSel: id === app,
cls: id === app ? 'mzo cur' : 'mzo', vars: '--bg:' + A[id].bg + ';--ac:' + A[id].ac, tileStyle: 'background:' + A[id].bg + ';color:' + A[id].ac, ckStyle: 'color:' + A[id].ac, pick: () => pickApp(id) }, A[id]));
const ft = subs[focus];
const hasPages = cur.pages.length > 0;
const note = pg && pg.subs === null ? pg.count + ' sub pages. They are not drawn on this board.' : '';
const keyOf = (e) => (e && e.key) || '';
const stop = (e) => { if (e && e.preventDefault) e.preventDefault(); };
return Object.assign(withIcon(piFlags, cur), {
pos: p.anchored ? '' : 'position:relative;left:auto;bottom:auto;transform:none;margin:16px',
selCount: appList.length, noticePage: isPage, apps: appList, pages, tiles, loading, ready: !loading,
open: appsOpen, openStr: appsOpen ? 'true' : 'false', toggle: () => { if (p.onToggleApps) p.onToggleApps(); else this.setState({ apps: !appsOpen }); },
sheetKey: (e) => { if (keyOf(e) === 'Escape' && p.onClose) { stop(e); p.onClose(); } },
// arrows only move the highlight and the focus; opening is a click or Enter on the tile (N9)
gridKey: (e) => { const n = tiles.length; const k = keyOf(e); if (!n) return; let f = focus;
if (k === 'ArrowRight' || k === 'ArrowDown') f = Math.min(n - 1, focus + 1);
else if (k === 'ArrowLeft' || k === 'ArrowUp') f = Math.max(0, focus - 1);
else if (k === 'b' || k === 'B') { stop(e); tiles[focus].toggleBk(); return; }
else return;
stop(e); this.setState({ focus: f }); this.focusEl('ms-t' + f); },
canSetup: !viewer, cantSetup: viewer, tilesNote: note,
empty: !hasPages, hasPages, appName: cur.name, initial: cur.name[0], tileStyle: 'background:' + cur.bg + ';color:' + cur.ac,
pgBk: pgOn, pgNotBk: !pgOn, pgBkCls: pgOn ? 'mzpb on' : 'mzpb', pgBkStr: pgOn ? 'true' : 'false', pgBkText: pgOn ? 'Page bookmarked' : 'Bookmark page',
pgBkAria: pg ? (pgOn ? 'Remove the bookmark of ' + pg.n : 'Bookmark the page ' + pg.n) : '', togglePg: () => { if (pg) flip(pageKey); },
openPg: () => open(null),
pageName: pg ? pg.n : cur.name, subLabel: !pg ? 'no pages yet' : pg.subs === null ? 'sub pages' : pg.subs.length ? 'sub pages' : 'no sub pages', subCount: pg ? (pg.subs ? (pg.subs.length || '') : pg.count) : '',
bmCount: Object.keys(bm).filter((k) => bm[k] && k.indexOf(app + '/') === 0).length,
footName: ft ? ft[0] : (pg ? pg.n : cur.name), footDesc: ft ? ft[2] : (pg ? (isPage ? (pg.d || 'It opens straight away') : note) : 'Its pages show here once setup is done'), footHere: ft ? 'You are here' : ''
});
}
}
