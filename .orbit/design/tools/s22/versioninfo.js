class Component extends DCLogic {
// AppVersionInfo (R10, R12; R03 calls it AppUpdates): Installed, Latest, Needs Grafana, This Grafana, Needs Orbit, Last update,
// Last checked, and one line of help. Information only. Props: app (an app id with lc.manage in tools/s22/mock.js).
/*MOCK*/
renderVals() {
const p = this.props; const A = this.apps(); const a = A[p.app] && A[p.app].lc && A[p.app].lc.manage ? A[p.app] : A.management; const lc = a.lc; const m = lc.manage;
return { inst: lc.v, hasUpd: !!lc.upd, noUpd: !lc.upd, upd: lc.upd || '', needs: m.needs, orbit: m.orbit, hasPrev: !!m.prev, prev: (m.prev || '') + ' → ' + lc.v,
updNote: m.updNote || '', checked: m.checked, rootStyle: p.embedded ? '' : "width:360px;margin:16px;color:#eceef1;font:400 14px/22px 'Inter','Helvetica','Arial',sans-serif" };
}
}
