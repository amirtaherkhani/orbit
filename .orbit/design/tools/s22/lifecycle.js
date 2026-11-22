class Component extends DCLogic {
// AppLifecycleView (R10, R12): one page per app (/apps/<id>/setup) from Not initialized to Enabled in six steps. One component in three
// modes (owner, 2026-11-21): 'review' (S18, Quality's review), 'setup' (S16, Energy's setup), 'update' (S21, Maintenance after an update
// to 0.4.0). The step list (LifecycleStepper) is part of it: the current step's content sits inside the list, which a child component
// cannot hold. It mounts C15 StatusChip, C16 LifecycleActionButton and C18 ChecksList; each mode's text is as drawn.
/*MOCK*/
renderVals() {
const p = this.props; const A = this.apps(); const given = ['review', 'setup', 'update'].indexOf(p.mode) >= 0 ? p.mode : 'review';
// Accept moves on to Setup; a new mode from the page starts over
const mode = this.state.from === given ? this.state.mode : given;
return { accept: () => this.setState({ from: given, mode: 'setup' }), isReview: mode === 'review', isSetup: mode === 'setup', isUpdate: mode === 'update',
review: A.quality.lc.review, setup: A.energy.lc.setup, update: A.maintenance.lc.update,
rootStyle: 'display:flex;flex-direction:column;gap:12px;min-width:0' + (p.embedded ? '' : ";padding:24px;color:#eceef1;font:400 14px/22px 'Inter','Helvetica','Arial',sans-serif") };
}
}
