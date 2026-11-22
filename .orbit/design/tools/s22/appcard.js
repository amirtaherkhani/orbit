class Component extends DCLogic {
// AppCard (R10, R12): one app on the Apps page (S12): identity, AppStatus icon, description, meta row, the buttons for its status.
// Props: app (an app id with lc data in tools/s22/mock.js), selected, onSelect(id). It mounts C15 StatusChip and C16 LifecycleActionButton.
constructor(props) { super(props); this.state = {}; }
/*MOCK*/
renderVals() {
const p = this.props; const A = this.apps(); const id = A[p.app] && A[p.app].lc ? p.app : 'maintenance'; const a = A[id]; const lc = a.lc;
const sel = p.onSelect ? !!p.selected : (this.state.sel === undefined ? !!p.selected : this.state.sel);
const on = lc.st === 'enabled'; const n = on ? a.pages.length : lc.n;
const v = { id, name: a.name, sub: 'v' + lc.v + (lc.note ? ' · ' + lc.note : ''), desc: lc.d, pages: n + (n === 1 ? ' page' : ' pages'), st: lc.st, step: lc.step,
enabled: on, notEnabled: !on, upd: lc.upd || '', hasUpd: !!lc.upd, places: !!lc.places, cls: sel ? 'ac on' : 'ac',
// in the grid the card fills its cell, so a row of cards ends level
rootStyle: p.embedded ? 'height:100%' : "width:300px;margin:16px;color:#eceef1;font:400 14px/22px 'Inter','Helvetica','Arial',sans-serif",
tile: 'display:grid;place-items:center;flex:none;width:40px;height:40px;border-radius:10px;background:' + a.bg + ';color:' + a.ac,
select: () => { if (p.onSelect) p.onSelect(id); else this.setState({ sel: !sel }); },
// onManage and onStep (the prototype): Manage and the lifecycle button open their views in place
manage: p.onManage ? (e) => { if (e && e.preventDefault) e.preventDefault(); p.onManage(id); } : undefined, stepTo: p.onStep ? () => p.onStep(id) : undefined };
['management', 'maintenance', 'quality', 'energy', 'safety'].forEach((k) => { v['i_' + k] = k === id; });
return v;
}
}
