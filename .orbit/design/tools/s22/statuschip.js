class Component extends DCLogic {
// StatusChip (R10, R12): the one badge box. With it, AppStatus: the lifecycle status model, 13 statuses in 7 colour groups, which
// lc_compose.py takes from tools/lifecycle_kit.py at build time, so these boards and the Python-built lifecycle boards never differ.
// kind: 'icon' (the AppStatus icon, 28 px, not a button), 'label' (status name), 'chip' (icon and name), 'new', 'update' (label: version).
renderVals() {
/*STATUS*/
// the seven colour groups, spelled out so the board keeps their rules
const TONE = { n: 'g-n', p: 'g-p', a: 'g-a', v: 'g-v', r: 'g-r', k: 'g-k', f: 'g-f' };
const p = this.props; const kind = p.kind || 'chip'; const s = S[p.status] || S.enabled; const ver = p.label || '0.1.1';
const v = { isIcon: kind === 'icon', isLabel: kind === 'label', isChip: kind === 'chip', isNew: kind === 'new', isUpd: kind === 'update',
label: kind === 'update' ? ver : s.label, title: kind === 'update' ? ver + ' is available' : s.label + '. ' + s.desc,
cls: (kind === 'icon' ? 'lst' : kind === 'label' ? 'lsl' : 'lsc') + ' ' + TONE[s.tone] };
Object.keys(S).forEach((k) => { v['i_' + S[k].icon] = S[k].icon === s.icon; });
return v;
}
}
