class Component extends DCLogic {
// ChecksList (R10, R12; R03 calls it ConfigCheck): results of initialization checks, setup validation, health and page checks.
// Props: checks [{ st: ok | warn | fail, t, d, src, fix }], summary (counts, last run, Run check), lastRun, onRun. The defaults are
// Management's health checks from tools/s22/mock.js.
/*MOCK*/
renderVals() {
const p = this.props; const m = this.apps().management.lc.manage;
const list = p.checks || m.checks; const summary = p.summary === undefined ? !p.checks : !!p.summary;
// class names spelled out, so the board keeps their rules
const CLS = { ok: 'ck ok', warn: 'ck warn', fail: 'ck fail' }; const ICLS = { ok: 'ci ok', warn: 'ci warn', fail: 'ci fail' }; const LABEL = { ok: 'Passed', warn: 'Warning', fail: 'Failed' };
const rows = list.map((c) => ({ cls: CLS[c.st], icls: ICLS[c.st], label: LABEL[c.st], t: c.t, d: c.d, src: c.src || '', hasSrc: !!c.src, fix: c.fix || '', hasFix: !!c.fix,
i_ok: c.st === 'ok', i_warn: c.st === 'warn', i_fail: c.st === 'fail' }));
const n = (k) => list.filter((c) => c.st === k).length;
return { rows, summary, nOk: n('ok') + ' passed', nWarn: n('warn') + (n('warn') === 1 ? ' warning' : ' warnings'), nFail: n('fail') + ' failed', lastRun: p.lastRun || m.lastRun,
run: () => { if (p.onRun) p.onRun(); }, rootStyle: p.embedded ? '' : "width:620px;margin:16px;color:#eceef1;font:400 14px/22px 'Inter','Helvetica','Arial',sans-serif" };
}
}
