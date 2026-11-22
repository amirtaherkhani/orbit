class Component extends DCLogic {
// DockBookmarkAdd (R07, R10, R12): popover of the dock '+' slot. The shared state comes from props: app (an app id, useActiveApp),
// bm (useBookmarks), onToggle, onClose. The popover keeps only its view: filter, search, the open page and the row just added.
// Without onToggle (on its own board) it keeps the bookmarks too, so the board works on its own.
constructor(props) { super(props); this.state = { filter: 'all', q: '', last: null, exp: null }; }
componentWillUnmount() { clearTimeout(this._t); }
/*MOCK*/
renderVals() {
const p = this.props; const CAP = +p.limit || 6; const A = this.apps();
const id = A[p.app] ? p.app : 'management'; const app = A[id]; const pre = id + '/';
const bm = (p.onToggle ? p.bm : this.state.bm || p.bm) || this.mockBookmarks(); const hidden = p.hidden || this.mockHidden();
const ICONS = ['chart', 'doc', 'cube', 'list', 'clock', 'bell'];
const icon = (o, ic) => { const k = ICONS.indexOf(ic) >= 0 ? ic : 'list'; ICONS.forEach((x) => { o['i_' + x] = k === x; }); return o; };
// shortcut: Monitoring's own rail icons (r0-r5, t0-t4, a0-a5) show as the list icon here; draw them when the prototype needs it
const PAGES = app.pages.map((x) => [x.n, x.ic, x.d || '', x.groups ? [].concat(...x.groups.map((g) => g.subs)) : x.subs]);
const { filter, last, q } = this.state; const exp = this.state.exp || (PAGES[0] ? { [PAGES[0][0]]: true } : {});
const qq = (q || '').trim().toLowerCase();
// a bookmark key is "app/Page" or "app/Page/Sub page" (tools/s22/mock.js); the app home is not bookmarkable
const isOn = (k) => !!bm[pre + k]; const count = Object.keys(bm).filter((k) => bm[k] && !hidden[k] && k.indexOf(pre) === 0).length; const full = count >= CAP;
const flip = (k) => { if (p.onToggle) p.onToggle(pre + k); else this.setState({ bm: Object.assign({}, bm, { [pre + k]: !bm[pre + k] }) }); };
const add = (k) => { if (isOn(k) || full) return; flip(k); this.setState({ last: k });
clearTimeout(this._t); this._t = setTimeout(() => this.setState({ last: null }), 1300); };
const remove = (k) => { flip(k); this.setState({ last: null }); };
const match = (k, text) => (filter === 'all' || isOn(k)) && (!qq || text.toLowerCase().indexOf(qq) >= 0);
// Tree like Grafana's NestedFolderList: the chevron expands a page, sub pages are indented one level. While searching or showing
// Bookmarked the list is flat and a sub page carries its page name, like the folder picker's search.
const flat = !!qq || filter === 'bm';
const row = (k, l, ic, d, parent, parentShown, nSubs) => { const on = isOn(k); const dis = !on && full; const at = qq ? l.toLowerCase().indexOf(qq) : -1;
const canExp = !flat && !parent && nSubs > 0; const isOpen = canExp && !!exp[l];
return icon({ label: l, desc: d, pre: at >= 0 ? l.slice(0, at) : l, mid: at >= 0 ? l.slice(at, at + qq.length) : '', post: at >= 0 ? l.slice(at + qq.length) : '', on, notOn: !on,
hasCtx: !!parent && !parentShown, ctx: parent || '', isSub: !!parent && parentShown, level: parent && parentShown ? '2' : '1',
canExp, noExp: !canExp, isOpen, isClosed: !isOpen, expStr: canExp ? (isOpen ? 'true' : 'false') : 'false',
expLabel: (isOpen ? 'Collapse ' : 'Expand ') + l, expand: () => this.setState({ exp: isOpen ? {} : { [l]: true } }),
cls: 'brw' + (parent && parentShown ? ' sub' : '') + (on ? ' on' : '') + (dis ? ' dis' : '') + (k === last ? ' fresh' : ''), pressed: on ? 'true' : 'false', disStr: dis ? 'true' : 'false',
state: on ? (hidden[pre + k] ? 'Bookmarked' : 'In dock') : '', aria: (on ? 'Remove ' : 'Add ') + (parent ? parent + ' › ' : '') + l + (on ? ' from' : ' to') + ' the dock bookmarks',
toggle: () => (on ? remove(k) : add(k)) }, ic); };
const rows = []; let total = 0;
PAGES.forEach(([g, gic, gd, subs]) => { total += 1 + subs.length;
const pageShown = match(g, g + ' ' + gd);
if (pageShown) rows.push(row(g, g, gic, [gd, subs.length ? subs.length + ' sub pages' : ''].filter(Boolean).join(' · '), null, false, subs.length));
if (flat || (pageShown && !!exp[g])) subs.forEach(({ n: l, ic, d }) => { const k = g + '/' + l; if (match(k, g + ' ' + l + ' ' + d)) rows.push(row(k, l, ic, d, g, pageShown && !flat, 0)); }); });
const pips = []; for (let i = 0; i < CAP; i++) pips.push({ cls: i < count ? (last && i === count - 1 ? 'pnw' : 'on') : '' });
const tab = (t) => ({ cls: filter === t ? 'sel' : '', sel: filter === t ? 'true' : 'false', pick: () => this.setState({ filter: t }) });
const vars = '--mac:' + app.ac + ';--mbg:' + app.ac + '1a;--mbd:' + app.ac + '47;--mhv:' + app.ac + '38';
const close = () => { if (p.onClose) p.onClose(); };
return {
// one hole for the whole style: an attribute that starts and ends with a hole is read as a single path by the canvas
popStyle: vars + (p.anchored ? '' : ';position:relative;left:auto;right:auto;bottom:auto;transform:none;margin:16px'),
appName: app.name, initial: app.name[0], tileStyle: 'background:' + app.bg + ';color:' + app.ac,
glyph: !!app.icon, noGlyph: !app.icon, i_mon: app.icon === 'mon', i_mgmt: app.icon === 'mgmt', i_mnt: app.icon === 'mnt',
close, key: (e) => { if (e && e.key === 'Escape') { if (e.preventDefault) e.preventDefault(); close(); } },
rows, total, noneLeft: !qq && filter === 'bm' && count === 0, noMatch: !!qq && rows.length === 0, q: q || '', hasQ: !!q,
onQ: (e) => this.setState({ q: e && e.target ? e.target.value : '' }), clearQ: () => this.setState({ q: '' }),
tabAll: tab('all'), tabBm: tab('bm'), full, cap: CAP, count, pips
};
}
}
