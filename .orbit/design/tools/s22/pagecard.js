class Component extends DCLogic {
// PageCard (R10, R12): one page of the bookmarks page (S11) with its sub page expander. Shared state from props: bm, hidden
// (useBookmarks); the view's state from sel, tab, seg and expanded; callbacks onToggle(key), onSelect(key, tab), onExpand(key).
// Without the callbacks (on its own board) it keeps that state itself, so the board works on its own.
constructor(props) { super(props); this.state = {}; }
/*MOCK*/
renderVals() {
const p = this.props; const st = this.state; const A = this.apps(); const IT = this.mockItems();
const g = IT.find((x) => x.key === p.page && !x.parent) || IT.find((x) => x.key === 'monitoring/Dashboards'); const ap = A[g.app]; const key = g.key;
const bm = (p.onToggle ? p.bm : st.bm || p.bm) || this.mockBookmarks(); const hidden = p.hidden || this.mockHidden();
const sel = p.onSelect ? p.sel : (st.sel || p.sel || ''); const tab = p.onSelect ? p.tab : (st.tab || p.tab || 'details'); const seg = p.seg || 'all';
const expanded = p.onExpand ? !!p.expanded : (st.exp === undefined ? p.expanded !== false : st.exp);
const ICONS = ['dash', 'alert', 'explore', 'admin', 'overview', 'reports', 'cube', 'pl', 'lp', 'list', 'clock', 'check', 'drill', 'conn', 'doc'];
const icon = (o, k) => { ICONS.forEach((x) => { o['i_' + x] = k === x; }); return o; };
const stop = (e) => { if (e && e.stopPropagation) e.stopPropagation(); };
const on = (k) => !!bm[k]; const dockOf = (k) => on(k) && !hidden[k];
const flip = (k) => { if (p.onToggle) p.onToggle(k); else this.setState({ bm: Object.assign({}, bm, { [k]: !bm[k] }) }); };
const pick = (k, t) => { if (p.onSelect) p.onSelect(k, t); else this.setState({ sel: k, tab: t }); };
const segOk = (k) => seg === 'all' || (seg === 'bm' ? on(k) : !on(k));
const tileS = (sz, r) => 'display:grid;place-items:center;flex:none;width:' + sz + 'px;height:' + sz + 'px;border-radius:' + r + 'px;background:' + ap.bg + ';color:' + ap.ac;
const all = IT.filter((x) => x.app === g.app && x.parent === g.n);
const subs = all.map((s) => { const k = s.key; const b = on(k);
return icon({ isRow: true, isGrp: false, grp: s.grp, name: s.n, route: s.route, rel: s.route.indexOf(g.route + '/') === 0 ? '…' + s.route.slice(g.route.length) : s.route,
on: b, off: !b, dock: dockOf(k), cls: 'sbr' + (k === sel ? ' on' : ''), tile: tileS(20, 5), bkCls: b ? 'bd s-ad pt' : 'bd s-av pt', bkStr: b ? 'true' : 'false',
bkLabel: (b ? 'Remove bookmark ' : 'Bookmark ') + s.n, toggle: (e) => { stop(e); flip(k); }, edit: (e) => { stop(e); pick(k, 'edit'); }, openPage: (e) => stop(e),
select: (e) => { stop(e); pick(k, 'details'); }, show: segOk(k) }, s.bi); });
// a group name (Administration: General, Plugins and data, Access) heads its rows
const withGroups = (list) => { const out = []; let last = ''; list.forEach((x) => { if (x.grp && x.grp !== last) { out.push({ isRow: false, isGrp: true, name: x.grp }); last = x.grp; } out.push(x); }); return out; };
const b = on(key); const n = all.length; const subBm = all.filter((s) => on(s.key)).length; const isOpen = n > 0 && expanded;
return { c: icon({ cid: key, name: g.n, route: g.route, desc: g.d, on: b, off: !b, dock: dockOf(key),
style: '--ac:' + ap.ac + ';--bg:' + ap.bg + (p.embedded ? '' : ';width:440px;margin:16px;color:#eceef1;font:400 14px/22px \'Inter\',\'Helvetica\',\'Arial\',sans-serif'), tile: tileS(40, 10),
cls: 'ac' + (key === sel ? ' on' : '') + (key === sel && tab === 'edit' ? ' edt' : '') + (isOpen ? ' opn' : ''), bkCls: b ? 'bd s-ad pt' : 'bd s-av pt', bkStr: b ? 'true' : 'false',
bkLabel: b ? 'Remove bookmark' : 'Bookmark', bkTitle: b ? 'Page bookmarked. Select to remove the bookmark' : 'Page not bookmarked. Select to bookmark',
hasSubs: n > 0, noSubs: !n, subText: n + (n === 1 ? ' sub page' : ' sub pages') + (subBm ? ' · ' + subBm + ' bookmarked' : ''),
subsOpen: isOpen, subsList: withGroups(seg === 'all' ? subs : subs.filter((x) => x.show)), expStr: isOpen ? 'true' : 'false',
toggleSubs: (e) => { stop(e); if (p.onExpand) p.onExpand(key); else this.setState({ exp: !isOpen }); }, toggle: (e) => { stop(e); flip(key); },
edit: (e) => { stop(e); pick(key, 'edit'); }, openPage: (e) => stop(e), select: () => pick(key, 'details') }, g.bi) };
}
}
