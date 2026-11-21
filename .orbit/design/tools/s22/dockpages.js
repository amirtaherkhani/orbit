class Component extends DCLogic {
// DockPagesView (R10, R12): the bookmarks page (/bookmarks, S11). It mounts C09 PageCard per page, C10 PagePanel and C11 DockPreview.
// Shared state from props: bm, hidden (useBookmarks) with onToggle(key) and onToggleDock(key). The view keeps its own state: app
// filter, All / Bookmarked / Available, the selected item and its tab, open expanders and "Always show the name".
// Without the callbacks (on its own board) it keeps the bookmarks too.
constructor(props) {
super(props);
this.state = { tab: 'details', sel: 'monitoring/Explore', app: 'all', seg: 'all', appOpen: false, open: { 'monitoring/Dashboards': true }, showName: {} };
// a click outside an open card closes its sub page list (PageCard contract)
if (typeof document !== 'undefined') { if (window.__s11off) window.__s11off();
const h = (e) => { const hit = e.target && e.target.closest ? e.target.closest('article[data-cid]') : null; const keep = hit ? hit.getAttribute('data-cid') : null;
const n = Object.assign({}, this.state.open); let ch = false;
document.querySelectorAll('article.opn[data-cid]').forEach((el) => { const k = el.getAttribute('data-cid'); if (k !== keep) { n[k] = false; ch = true; } });
if (ch) this.setState({ open: n }); };
document.addEventListener('click', h, true); window.__s11off = () => document.removeEventListener('click', h, true); }
}
/*MOCK*/
renderVals() {
const p = this.props; const st = this.state; const A = this.apps(); const IT = this.mockItems();
const bm = (p.onToggle ? p.bm : st.bm || p.bm) || this.mockBookmarks();
const hidden = (p.onToggleDock ? p.hidden : st.hidden || p.hidden) || this.mockHidden();
const { tab, sel, app, seg, appOpen, open, showName } = st;
const on = (k) => !!bm[k]; const dockOf = (k) => on(k) && !hidden[k];
const toggleBm = (k) => (p.onToggle ? p.onToggle(k) : this.setState({ bm: Object.assign({}, bm, { [k]: !bm[k] }) }));
const toggleDock = (k) => (p.onToggleDock ? p.onToggleDock(k) : this.setState({ hidden: Object.assign({}, hidden, { [k]: !hidden[k] }) }));
const toggleName = (k) => this.setState({ showName: Object.assign({}, showName, { [k]: !showName[k] }) });
const select = (k, t) => this.setState({ sel: k, tab: t }); const setTab = (t) => this.setState({ tab: t });
const segOk = (k) => seg === 'all' || (seg === 'bm' ? on(k) : !on(k));
const subsOf = (g) => IT.filter((x) => x.app === g.app && x.parent === g.n);
const isOpenOf = (g) => subsOf(g).length > 0 && (g.key in open ? !!open[g.key] : (seg !== 'all' && subsOf(g).some((s) => segOk(s.key))));
const pages = IT.filter((x) => !x.parent && (app === 'all' || x.app === app));
const cards = pages.filter((g) => segOk(g.key) || subsOf(g).some((s) => segOk(s.key))).map((g) => ({ isHead: false, isCard: true, appKey: g.app, key: g.key,
expanded: isOpenOf(g), bm, hidden, sel, tab, seg, toggleBm, select, expand: () => this.setState({ open: Object.assign({}, open, { [g.key]: !isOpenOf(g) }) }) }));
const items = [];
Object.keys(A).forEach((k) => { const cs = cards.filter((c) => c.appKey === k); if (!cs.length) return; const ap = A[k];
const ps = IT.filter((x) => x.app === k && !x.parent); const subsN = IT.filter((x) => x.app === k && x.parent).length;
const bmN = IT.filter((x) => x.app === k && on(x.key)).length; const dockN = IT.filter((x) => x.app === k && dockOf(x.key)).length;
items.push({ isHead: true, isCard: false, name: ap.name, initial: ap.name[0], home: ap.home, vars: '--ac:' + ap.ac + ';--bg:' + ap.bg,
meta: ps.length + (ps.length === 1 ? ' page' : ' pages') + ' · ' + subsN + ' sub pages · ' + bmN + ' bookmarked · ' + dockN + ' of 6 in the dock' });
cs.forEach((c) => items.push(c)); });
const inApp = IT.filter((x) => app === 'all' || x.app === app); const cnt = (f) => inApp.filter(f).length;
const segs = [['all', 'All', cnt(() => true)], ['bm', 'Bookmarked', cnt((x) => on(x.key))], ['av', 'Available', cnt((x) => !on(x.key))]].map(([id, l, n]) => ({
label: l + ' ' + n, cls: seg === id ? 'sgb on' : 'sgb', sel: seg === id ? 'true' : 'false', pick: () => this.setState({ seg: id }) }));
const appOpts = [['all', 'All apps', null]].concat(Object.keys(A).map((k) => [k, A[k].name, A[k].ac])).map(([k, n, c]) => { const dis = k !== 'all' && A[k].enabled === false; const isSel = app === k;
const np = k === 'all' ? IT.filter((x) => !x.parent).length : IT.filter((x) => x.app === k && !x.parent).length;
return { name: n, count: dis ? 'Not enabled' : np + (np === 1 ? ' page' : ' pages'), dot: c ? 'background:' + c : 'background:transparent;box-shadow:inset 0 0 0 1px #8d939c', isSel,
sel: isSel ? 'true' : 'false', dis: dis ? 'true' : 'false', cls: (isSel ? 'sel' : '') + (dis ? ' dis' : ''), pick: () => { if (!dis) this.setState({ app: k, appOpen: false }); } }; });
return { items, cards, noCards: cards.length === 0, noCardsMsg: seg === 'bm' ? 'Nothing in this app is bookmarked yet. Switch to All or Available.' : 'Every page and sub page of this app is bookmarked.',
segs, appOpts, appOpen, appOpenStr: appOpen ? 'true' : 'false', toggleApp: () => this.setState({ appOpen: !appOpen }),
appIsAll: app === 'all', appNotAll: app !== 'all', appLabel: app === 'all' ? 'All apps' : A[app].name, appDot: app === 'all' ? '' : 'background:' + A[app].ac,
bm, hidden, sel, tab, showName, toggleBm, toggleDock, toggleName, setTab,
rootStyle: 'display:flex;flex-direction:column;gap:12px;min-width:0' + (p.embedded ? '' : ';padding:24px;color:#eceef1;font:400 14px/22px \'Inter\',\'Helvetica\',\'Arial\',sans-serif') };
}
}
