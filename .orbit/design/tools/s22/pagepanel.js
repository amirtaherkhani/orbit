class Component extends DCLogic {
// PagePanel (R10, R12): Details and Edit bookmark of the item selected on the bookmarks page (S11). Shared state from props:
// bm, hidden (useBookmarks), showName; the view's sel and tab; callbacks onTab, onToggle, onToggleDock, onToggleName (all take the key).
// Without the callbacks (on its own board) it keeps that state itself.
constructor(props) { super(props); this.state = {}; }
/*MOCK*/
renderVals() {
const p = this.props; const st = this.state; const A = this.apps(); const IT = this.mockItems();
const bm = (p.onToggle ? p.bm : st.bm || p.bm) || this.mockBookmarks();
const hidden = (p.onToggleDock ? p.hidden : st.hidden || p.hidden) || this.mockHidden();
const showName = (p.onToggleName ? p.showName : st.showName || p.showName) || {};
const tab = p.onTab ? p.tab : (st.tab || p.tab || 'details');
const ICONS = ['dash', 'alert', 'explore', 'admin', 'overview', 'reports', 'cube', 'pl', 'lp', 'list', 'clock', 'check', 'drill', 'conn', 'doc'];
const icon = (o, k) => { ICONS.forEach((x) => { o['i_' + x] = k === x; }); return o; };
const own = (name, map, k) => this.setState({ [name]: Object.assign({}, map, { [k]: !map[k] }) });
const flip = (k) => (p.onToggle ? p.onToggle(k) : own('bm', bm, k));
const flipDock = (k) => (p.onToggleDock ? p.onToggleDock(k) : own('hidden', hidden, k));
const flipName = (k) => (p.onToggleName ? p.onToggleName(k) : own('showName', showName, k));
const setTab = (t) => (p.onTab ? p.onTab(t) : this.setState({ tab: t }));
const on = (k) => !!bm[k]; const dockOf = (k) => on(k) && !hidden[k];
const it = IT.find((x) => x.key === p.sel) || IT.find((x) => x.key === 'monitoring/Explore'); const ap = A[it.app]; const b = on(it.key); const d = dockOf(it.key);
const dockKeys = IT.filter((x) => x.app === it.app && dockOf(x.key)).map((x) => x.key); const full = !d && dockKeys.length >= 6; const pos = dockKeys.indexOf(it.key);
const tileS = (sz, r) => 'display:grid;place-items:center;flex:none;width:' + sz + 'px;height:' + sz + 'px;border-radius:' + r + 'px;background:' + ap.bg + ';color:' + ap.ac;
const core = it.app === 'monitoring'; const isExplore = it.key === 'monitoring/Explore';
const pp = icon({ name: it.n, app: ap.name, route: it.route, desc: it.d, id: it.id, dot: 'background:' + ap.ac, tile: tileS(40, 10), tileS: tileS(22, 6),
style: '--ac:' + ap.ac + ';--bg:' + ap.bg + (p.embedded ? '' : ';width:400px;margin:16px;color:#eceef1;font:400 14px/22px \'Inter\',\'Helvetica\',\'Arial\',sans-serif'),
isNew: isExplore, bkChip: b ? 'Bookmarked' : 'Not bookmarked', dock: d, bkWhen: b ? (isExplore ? 'Today' : 'Earlier') : 'Not yet',
type: it.parent ? 'Sub page of ' + it.parent + (it.grp ? ', group ' + it.grp : '') : 'Page',
menuPath: ap.name + ' › ' + (it.parent ? it.parent + ' › ' : '') + (it.grp ? it.grp + ' › ' : '') + it.n,
subs: it.parent ? '—' : (it.nSubs ? it.nSubs + (it.nSubs === 1 ? ' sub page' : ' sub pages') : 'None'),
source: core ? 'Grafana core page' : 'App page · acme-' + it.app + '-app', routeNote: core ? 'Fixed by Grafana' : (it.parent ? 'Nested include, under ' + it.parent : 'From the app manifest'),
perm: isExplore ? 'datasources:explore' : 'From the nav tree', permNote: isExplore ? 'Role "Explorer". Change it in Administration › Roles' : 'Pages you cannot open are not listed',
bkStr: b ? 'true' : 'false', dockStr: d ? 'true' : 'false', dockDis: (!b || full) ? 'true' : 'false', nameStr: showName[it.key] ? 'true' : 'false', inDock: dockKeys.length,
dockLabel: it.parent ? it.parent + ' › ' + it.n : it.n, iconName: it.iconName, pos: d ? (pos + 1) + ' of ' + dockKeys.length : 'Not in the dock',
toggle: () => flip(it.key), toggleDock: () => { if (b && !full) flipDock(it.key); }, toggleName: () => flipName(it.key),
reset: () => { if (hidden[it.key]) flipDock(it.key); if (showName[it.key]) flipName(it.key); } }, it.bi);
const tabs = [['details', 'Details'], ['edit', 'Edit bookmark']].map(([id, label]) => ({ label, sel: id === tab ? 'true' : 'false', cls: id === tab ? 'gt on' : 'gt', pick: () => setTab(id) }));
return { p: pp, tabs, show_details: tab === 'details', show_edit: tab === 'edit', toDetails: () => setTab('details'), toEdit: () => setTab('edit') };
}
}
