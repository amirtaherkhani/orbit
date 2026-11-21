class Component extends DCLogic {
// AppPreviewPanel (R10, R12): read-only panel of the app selected on the Apps page (S12): identity, status, the six-step strip,
// details and the tree of registered pages. Props: app (an app id). The tree keeps its open page itself.
constructor(props) { super(props); this.state = {}; }
/*MOCK*/
renderVals() {
/*STATUS*/
const p = this.props; const A = this.apps(); const id = A[p.app] && A[p.app].lc ? p.app : 'maintenance'; const a = A[id]; const lc = a.lc;
const on = lc.st === 'enabled'; const step = on ? 7 : lc.step; const base = '/a/acme-' + id + '-app';
const subsOf = (g) => (g.groups ? [].concat(...g.groups.map((x) => x.subs)) : g.subs);
const first = a.pages.find((g) => subsOf(g).length); const open = this.state.app === id ? this.state.open : (first ? first.id : null);
const rel = (r) => (r.indexOf(base) === 0 ? r.slice(base.length) : r);
const ic = (k) => ({ i_list: k !== 'clock', i_clock: k === 'clock' });
const rows = [];
a.pages.forEach((g) => { const subs = subsOf(g); const has = subs.length > 0; const isOpen = has && open === g.id;
rows.push(Object.assign({ cls: 'apr', level: 1, isSub: false, isPage: true, canExp: has, noExp: !has, isOpen, isClosed: !isOpen, expStr: has ? String(isOpen) : null,
expLabel: (isOpen ? 'Collapse ' : 'Expand ') + g.n, expand: () => this.setState({ app: id, open: isOpen ? null : g.id }), tcls: 'apt', name: g.n, path: rel(g.route), full: g.route,
desc: g.d, meta: (g.kind || 'Page') + ' · Viewer · ' + (has ? subs.length + ' sub pages' : 'no sub pages'), tip: g.d }, ic(g.ic)));
if (isOpen) subs.forEach((c) => rows.push(Object.assign({ cls: 'apr sub', level: 2, isSub: true, isPage: false, canExp: false, noExp: true, isOpen: false, isClosed: true, expStr: null,
tcls: 'apt sub', name: c.n, path: rel(c.route), full: c.route, desc: c.d, tip: c.d }, ic(c.ic)))); });
const nSubs = a.pages.reduce((n, g) => n + subsOf(g).length, 0);
const v = { name: a.name, idver: 'acme-' + id + '-app · v' + lc.v, desc: lc.d, st: lc.st, isNew: !!a.isNew, rows,
segs: [1, 2, 3, 4, 5, 6].map((i) => ({ cls: i < step ? 'lcd' : i === step ? 'lcc' : '' })), stripLabel: on ? 'Lifecycle: all 6 steps done' : 'Lifecycle: step ' + step + ' of 6',
note: on ? 'All six steps are done. Authorized users can open the app.' + (a.isNew ? ' “New” marks the app enabled most recently.' : '') : 'Step ' + step + ' of 6. ' + S[lc.st].desc,
appId: 'acme-' + id + '-app', ver: lc.v, status: S[lc.st].label, at: lc.at || (on ? 'Earlier' : 'Not yet'), base,
pagesMeta: on ? a.pages.length + ' pages · ' + nSubs + ' sub pages' : lc.n + ' pages in the manifest', hasTree: on, noTree: !on, treeNote: 'Its pages are listed here once the app is enabled.',
rootStyle: p.embedded ? '' : "width:360px;margin:16px;color:#eceef1;font:400 14px/22px 'Inter','Helvetica','Arial',sans-serif",
tile: 'display:grid;place-items:center;flex:none;width:40px;height:40px;border-radius:10px;background:' + a.bg + ';color:' + a.ac };
['management', 'maintenance', 'quality', 'energy', 'safety'].forEach((k) => { v['i_' + k] = k === id; });
return v;
}
}
