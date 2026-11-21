class Component extends DCLogic {
// ChecksList (R10, R12; R03 calls it ConfigCheck): results of initialization checks, setup validation, health and page checks.
// Props: checks [{ st: ok | warn | fail | idle (not run or not available), t, d, src, fix }], summary (counts, last run, run button),
// gap (px, the parent column's gap), top (px above the summary bar, S21), showFail (count failures even when there are none, S15), lastRun (the whole line, e.g. 'Finished 09:12'), runLabel, onRun.
// The defaults are Management's health checks from tools/s22/mock.js.
/*MOCK*/
renderVals() {
const p = this.props; const m = this.apps().management.lc.manage;
const list = p.checks || m.checks; const summary = p.summary === undefined ? !p.checks : !!p.summary;
// class names spelled out, so the board keeps their rules
const CLS = { ok: 'ck ok', warn: 'ck warn', fail: 'ck fail', idle: 'ck idle' }; const ICLS = { ok: 'ci ok', warn: 'ci warn', fail: 'ci fail', idle: 'ci idle' };
const SUM = { ok: 'cs ok', warn: 'cs warn', fail: 'cs fail', idle: 'cs idle' }; const LABEL = { ok: 'Passed', warn: 'Warning', fail: 'Failed', idle: 'Not run' };
const icons = (st) => ({ i_ok: st === 'ok', i_warn: st === 'warn', i_fail: st === 'fail' });
const rows = list.map((c) => Object.assign({ cls: CLS[c.st], icls: ICLS[c.st], label: LABEL[c.st], t: c.t, d: c.d, src: c.src || '', hasSrc: !!c.src, fix: c.fix || '', hasFix: !!c.fix }, icons(c.st)));
const n = (k) => list.filter((c) => c.st === k).length;
const text = { ok: (k) => k + ' passed', warn: (k) => k + (k === 1 ? ' warning' : ' warnings'), fail: (k) => k + ' failed', idle: (k) => k + ' not available' };
const showFail = p.showFail === undefined ? !p.checks : !!p.showFail;
const sums = ['ok', 'warn', 'fail', 'idle'].filter((k) => n(k) > 0 || (k === 'fail' && showFail)).map((k) => Object.assign({ cls: SUM[k], icls: ICLS[k], label: LABEL[k], text: text[k](n(k)) }, icons(k)));
return { rows, summary, sums, lastRun: p.lastRun || m.lastRun, runLabel: p.runLabel || 'Run check', runIcon: !p.runLabel, barStyle: p.top ? 'margin-top:' + p.top + 'px' : '',
run: () => { if (p.onRun) p.onRun(); },
// gap: inside a flex column (a lifecycle step) the summary and the rows keep the column's gap between them
rootStyle: p.embedded ? (p.gap ? 'display:flex;flex-direction:column;gap:' + p.gap + 'px' : '') : "width:620px;margin:16px;color:#eceef1;font:400 14px/22px 'Inter','Helvetica','Arial',sans-serif" };
}
}
