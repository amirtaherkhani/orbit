class Component extends DCLogic {
// AppsView (R10, R12): the Apps page (/apps, S12): every installed app with its lifecycle status. It mounts C13 AppCard per app and
// C14 AppPreviewPanel for the selected one. The view keeps the filter (All / Enabled / Needs action) and the selection.
constructor(props) { super(props); this.state = { seg: 'all', sel: 'maintenance' }; }
/*MOCK*/
renderVals() {
const p = this.props; const A = this.apps(); const { seg, sel } = this.state;
const ids = Object.keys(A).filter((k) => A[k].lc); const en = (k) => A[k].lc.st === 'enabled';
const ok = (k) => seg === 'all' || (seg === 'on' ? en(k) : !en(k));
const segs = [['all', 'All', ids.length], ['on', 'Enabled', ids.filter(en).length], ['act', 'Needs action', ids.filter((k) => !en(k)).length]].map(([id, l, n]) => ({
label: l + ' ' + n, cls: seg === id ? 'sgb on' : 'sgb', sel: seg === id ? 'true' : 'false', pick: () => this.setState({ seg: id }) }));
const cards = ids.filter(ok).map((k) => ({ id: k, selected: k === sel, select: (x) => this.setState({ sel: x }), manage: p.onManage, step: p.onStep }));
return { segs, cards, sel, rootStyle: 'display:flex;flex-direction:column;gap:12px;min-width:0' + (p.embedded ? '' : ";padding:24px;color:#eceef1;font:400 14px/22px 'Inter','Helvetica','Arial',sans-serif") };
}
}
