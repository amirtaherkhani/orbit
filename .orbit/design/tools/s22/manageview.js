class Component extends DCLogic {
// AppManageView (R10, R12): manage one enabled or disabled app (/apps/<id>, S15): tabs Overview, Pages, Access, Data sources, Health,
// and the right panel About, AppVersionInfo (C19), Preview and Who can act. Shared state from props: bm with onToggle (useBookmarks).
// It mounts C15 StatusChip, C16 LifecycleActionButton, C18 ChecksList and C19 AppVersionInfo.
// shortcut: the Pages table has three row slots, because a loop inside a table body is not safe in HTML parsing; Access and Data
// sources show Management's sample rows. Data-driven rows come when an app with more pages needs this view.
constructor(props) { super(props); this.state = { tab: 'overview' }; }
/*MOCK*/
renderVals() {
const p = this.props; const st = this.state; const A = this.apps(); const id = A[p.app] && A[p.app].lc && A[p.app].lc.manage ? p.app : 'management';
const a = A[id]; const lc = a.lc; const m = lc.manage;
const bm = (p.onToggle ? p.bm : st.bm || p.bm) || this.mockBookmarks();
const flip = (k) => (p.onToggle ? p.onToggle(k) : this.setState({ bm: Object.assign({}, bm, { [k]: !bm[k] }) }));
const tile = (sz, r) => 'display:grid;place-items:center;flex:none;width:' + sz + 'px;height:' + sz + 'px;border-radius:' + r + 'px;background:' + a.bg + ';color:' + a.ac;
const slot = (g) => { if (!g) return { rowStyle: 'display:none', drStyle: 'display:none', checks: [] };
const k = id + '/' + g.n; const on = !!bm[k]; const n = (g.subs || []).length; const ok = g.check !== 'warn';
return { rowStyle: '', drStyle: g.checks ? '' : 'display:none', name: g.n, path: g.route, who: g.who || 'Viewer', subs: n || 'None', tile: tile(28, 6),
csCls: ok ? 'cs ok' : 'cs warn', ciCls: ok ? 'ci ok' : 'ci warn', check: ok ? 'Passed' : 'Warning', i_ok: ok, i_warn: !ok, checks: g.checks || [],
on, off: !on, bkCls: on ? 'bd s-ad pt' : 'bd s-av pt', bkStr: on ? 'true' : 'false', bkLabel: on ? 'Remove ' + g.n + ' from bookmarks' : 'Bookmark ' + g.n,
bkTitle: on ? 'Bookmarked. Select to remove the bookmark' : 'Not bookmarked. Select to bookmark', toggle: () => flip(k) }; };
const nBm = a.pages.filter((g) => bm[id + '/' + g.n]).length; const warns = m.checks.filter((c) => c.st === 'warn').length;
const defs = [['overview', 'Overview', null, ''], ['pages', 'Pages', a.pages.length, ''], ['access', 'Access', null, ''], ['data', 'Data sources', 2, ''], ['check', 'Health', warns || null, 'warn']];
const tabs = defs.map(([t, label, count, kind]) => ({ label, count, hasCount: count !== null, sel: t === st.tab ? 'true' : 'false', cls: t === st.tab ? 'gt on' : 'gt',
ccls: kind ? 'gcnt warn' : 'gcnt ', pick: () => this.setState({ tab: t }) }));
const v = { id, name: a.name, appId: 'acme-' + id + '-app', ver: lc.v, st: lc.st, m, ac: a.ac, swatch: 'background:' + a.ac, nPages: a.pages.length,
tile48: tile(48, 12), tile32: tile(32, 8), tile22: tile(22, 6), p0: slot(a.pages[0]), p1: slot(a.pages[1]), p2: slot(a.pages[2]),
bmText: nBm + ' of ' + a.pages.length + ' bookmarked', tabs, show_overview: st.tab === 'overview', show_pages: st.tab === 'pages', show_access: st.tab === 'access',
show_data: st.tab === 'data', show_check: st.tab === 'check', rootStyle: 'display:flex;flex-direction:column;gap:12px;min-width:0' + (p.embedded ? '' : ";padding:24px;color:#eceef1;font:400 14px/22px 'Inter','Helvetica','Arial',sans-serif") };
['management', 'maintenance', 'quality', 'energy', 'safety'].forEach((k) => { v['i_' + k] = k === id; });
return v;
}
}
