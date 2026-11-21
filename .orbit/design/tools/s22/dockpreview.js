class Component extends DCLogic {
// DockPreview (R10, R12): what the dock shows, per app, from the same bookmarks as the page cards (S11). Props: bm, hidden, sel.
/*MOCK*/
renderVals() {
const p = this.props; const A = this.apps(); const IT = this.mockItems();
const bm = p.bm || this.mockBookmarks(); const hidden = p.hidden || this.mockHidden(); const sel = p.sel || '';
const ICONS = ['dash', 'alert', 'explore', 'admin', 'overview', 'reports', 'cube', 'pl', 'lp', 'list', 'clock', 'check', 'drill', 'conn', 'doc'];
const icon = (o, k) => { ICONS.forEach((x) => { o['i_' + x] = k === x; }); return o; };
const dockOf = (k) => !!bm[k] && !hidden[k];
const groups = Object.keys(A).map((k) => { const ap = A[k]; const its = IT.filter((x) => x.app === k && dockOf(x.key));
const tile = 'display:grid;place-items:center;flex:none;width:22px;height:22px;border-radius:6px;background:' + ap.bg + ';color:' + ap.ac;
return { name: ap.name, dot: 'background:' + ap.ac, isThis: k === 'monitoring', count: its.length + ' in the dock', empty: !its.length, notEmpty: its.length > 0,
items: its.map((x) => icon({ isNew: x.key === 'monitoring/Explore', label: x.n, parent: x.parent || '', hasParent: !!x.parent,
path: ap.name + ' › ' + (x.parent ? x.parent + ' › ' : '') + x.n, cls: 'mr2' + (x.key === sel ? ' cur' : ''), tile }, x.bi)) }; }).filter((g) => g.notEmpty);
return { dpGroups: groups, dpSummary: IT.filter((x) => dockOf(x.key)).length + ' in docks', rootStyle: p.embedded ? '' : 'width:400px;margin:16px;color:#eceef1;font:400 14px/22px \'Inter\',\'Helvetica\',\'Arial\',sans-serif' };
}
}
