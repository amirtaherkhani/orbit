class Component extends DCLogic {
// S22 · Menu flow: the page owns the shared state (active app, bookmarks, loading, open overlay, opened page) and hands it to the
// mounted components: C01 Dock (with C07 DockBookmarkAdd) and C06 MenuSheet. One overlay is open at a time. The sheet keeps only its current page and tile.
constructor(props) {
super(props);
this.state = { viewer: false, menu: false, apps: false, opened: null, app: 'monitoring', loading: false, bm: this.mockBookmarks(), adding: false, fresh: null };
}
componentWillUnmount() { clearTimeout(this.loadTimer); clearTimeout(this.freshTimer); }
/*MOCK*/
// Focus goes back to the Menu button after the menu closes (N8); skipped when there is no document (Node check)
focusEl(id, alt) {
if (typeof document === 'undefined') return;
setTimeout(() => { const el = document.getElementById(id) || (alt && document.getElementById(alt)); if (el) el.focus(); }, 0);
}
openMenu() { this.setState({ menu: true, apps: false, adding: false }); this.focusEl('ms-t0', 'ms-rsw'); }
closeMenu() { this.setState({ menu: false, apps: false }); this.focusEl('s22-menu'); }
openPage(app, page, sub) { this.setState({ menu: false, apps: false, opened: { app, page, sub } }); this.focusEl('s22-menu'); }
toggleApps() { const { menu, apps } = this.state; this.setState({ menu: true, apps: menu ? !apps : true, adding: false }); }
toggleAdd() { this.setState({ adding: !this.state.adding, menu: false, apps: false }); }
// a bookmark just added lands in the dock with a short animation (S20)
toggleBm(k) { const on = !this.state.bm[k]; this.setState({ bm: Object.assign({}, this.state.bm, { [k]: on }), fresh: on ? k : null });
clearTimeout(this.freshTimer); if (on) this.freshTimer = setTimeout(() => this.setState({ fresh: null }), 1300); }
pickApp(id) {
if (id === this.state.app) { this.setState({ apps: false }); return; }
clearTimeout(this.loadTimer);
// Monitoring is Grafana's own app: it never shows the loading state (N6)
this.setState({ app: id, apps: false, loading: id !== 'monitoring' });
if (id !== 'monitoring') this.loadTimer = setTimeout(() => this.setState({ loading: false }), 650);
}
renderVals() {
const A = this.apps(); const { viewer, menu, apps, opened, app, loading, bm, adding, fresh } = this.state; const cur = A[app];
const DK = ['chart', 'doc', 'cube', 'list', 'clock', 'bell', 'pl', 'lp', 'ex'];
const dockBms = [];
cur.pages.filter((x) => !(viewer && x.adm)).forEach((x) => {
if (bm[app + '/' + x.n]) dockBms.push({ label: x.n, icon: x.dk || x.ic, fresh: fresh === app + '/' + x.n });
(x.groups ? [].concat(...x.groups.map((g) => g.subs || [])) : x.subs || []).forEach(([l, ic, d, k]) => { if (bm[app + '/' + x.n + '/' + l]) dockBms.push({ label: x.n + ' › ' + l, icon: k || ic, fresh: fresh === app + '/' + x.n + '/' + l }); });
});
dockBms.forEach((b) => { if (DK.indexOf(b.icon) < 0) b.icon = 'list'; });
const crumb = opened ? { a: A[opened.app].name, p: opened.page, s: opened.sub || '' } : { a: '', p: '', s: '' };
const keyOf = (e) => (e && e.key) || '';
return {
app, bm, loading, viewer, appsOpen: apps, menuOpen: menu,
dockApp: { id: app, name: cur.name, icon: cur.icon, ac: cur.ac, bg: cur.bg }, dockBms, dockOverlay: menu ? 'menu' : adding ? 'bookmark' : 'none',
pickApp: (id) => this.pickApp(id), toggleBm: (k) => this.toggleBm(k), toggleAdd: () => this.toggleAdd(),
openPage: (a, p, s) => this.openPage(a, p, s), closeMenu: () => this.closeMenu(), toggleApps: () => this.toggleApps(),
toggleMenu: () => (menu ? this.closeMenu() : this.openMenu()),
sheetKey: (e) => { if (keyOf(e) !== 'Escape' || !(menu || adding)) return; if (e.preventDefault) e.preventDefault(); if (menu) this.closeMenu(); else this.setState({ adding: false }); },
mnStyle: menu ? 'filter:blur(4px) brightness(.45)' : '',
isHome: !opened, isPage: !!opened, crumbApp: crumb.a, crumbPage: crumb.p, crumbSub: crumb.s, openedTitle: crumb.s || crumb.p,
openedDesc: opened ? crumb.a + ' · ' + crumb.p + (crumb.s ? ' · ' + crumb.s : '') : ''
};
}
}
