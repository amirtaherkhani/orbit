class Component extends DCLogic {
// LifecycleActionButton (R10, R12): outline button for a lifecycle step, in the colour of its action type (lifecycle_kit.py ACT:
// init, review, setup, migrate, enable, fail). Props: status (the step it acts on), or action, label and href; disabled; onClick.
// A step with a view of its own is a link to that board; the others are buttons.
// large: the page-header size (S15), not the 30 px card size.
renderVals() {
const p = this.props;
const BY = { notinit: ['init', 'Initialize', ''], review: ['review', 'Review', 'AddAppFlow.dc.html'], setup: ['setup', 'Setup', 'AppSetup.dc.html'],
setupwip: ['setup', 'Continue setup', 'AppSetup.dc.html'], migrate: ['migrate', 'Run migration', ''], ready: ['enable', 'Enable', ''], failed: ['fail', 'View details', ''] };
// the action colours, spelled out so the board keeps their rules
const ACT = { init: 'a-init', review: 'a-review', setup: 'a-setup', migrate: 'a-migrate', enable: 'a-enable', fail: 'a-fail' };
const d = BY[p.status] || BY.notinit; const href = p.href === undefined ? d[2] : p.href;
const st = 'flex:none;height:30px;min-height:30px;padding:0 12px;gap:6px;white-space:nowrap';
return { isLink: !!href && !p.disabled, isBtn: !href && !p.disabled, isOff: !!p.disabled, href, label: p.label || d[1], cls: 'p lca ' + ACT[p.action || d[0]], linkStyle: (p.large ? '' : st + ';') + 'text-decoration:none', btnStyle: p.large ? '' : st,
click: () => { if (p.onClick) p.onClick(); },
// with onClick a link runs it in place (the prototype) instead of opening its board
linkClick: p.onClick ? (e) => { if (e && e.preventDefault) e.preventDefault(); p.onClick(); } : undefined };
}
}
