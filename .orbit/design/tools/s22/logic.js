class Component extends DCLogic {
// S22 · Menu flow: the page owns the shared state (active app, bookmarks, loading, open overlay, opened page) and hands it to the
// mounted components: C01 Dock (with C07 DockBookmarkAdd) and C06 MenuSheet. One overlay is open at a time. The sheet keeps only its current page and tile.
// The prototype (S23) also routes views in place: home, dashboard, apps, manage, lifecycle, bookmarks, page (an opened menu page).
constructor(props) {
super(props);
this.state = { viewer: false, menu: false, apps: false, opened: null, app: 'monitoring', loading: false, bm: this.mockBookmarks(), hidden: this.mockHidden(), adding: false, fresh: null };
Object.assign(this.state, { view: 'home', viewApp: 'management', lcMode: 'review', switcher: false });
}
componentWillUnmount() { clearTimeout(this.loadTimer); clearTimeout(this.freshTimer); }
/*MOCK*/
// Focus goes back to the Menu button after the menu closes (N8); skipped when there is no document (Node check)
focusEl(id, alt) {
if (typeof document === 'undefined') return;
setTimeout(() => { const el = document.getElementById(id) || (alt && document.getElementById(alt)); if (el) el.focus(); }, 0);
}
openMenu() { this.setState({ menu: true, apps: false, adding: false, switcher: false }); this.focusEl('ms-t0', 'ms-rsw'); }
closeMenu() { this.setState({ menu: false, apps: false }); this.focusEl('s22-menu'); }
openPage(app, page, sub) { this.setState({ menu: false, apps: false, switcher: false, opened: { app, page, sub }, view: 'page' }); this.focusEl('s22-menu'); }
toggleApps() { const { menu, apps } = this.state; this.setState({ menu: true, apps: menu ? !apps : true, adding: false }); }
// "Show in the dock" (S11): a hidden bookmark stays in Bookmarks and the menu, not in the dock
toggleHidden(k) { this.setState({ hidden: Object.assign({}, this.state.hidden, { [k]: !this.state.hidden[k] }) }); }
toggleAdd() { this.setState({ adding: !this.state.adding, menu: false, apps: false, switcher: false }); }
// the dock's app button opens C05 AppSwitcher (S06), whose Apps row opens the Apps page
toggleSwitcher() { this.setState({ switcher: !this.state.switcher, menu: false, apps: false, adding: false }); }
// one view at a time; opening a view closes every overlay. A lifecycle view opens on the step the app's status needs.
go(view, id) { const A = this.apps(); const st = id && A[id] && A[id].lc ? A[id].lc.st : '';
this.setState({ view, viewApp: id || this.state.viewApp, lcMode: st === 'setupwip' || st === 'setup' ? 'setup' : 'review', menu: false, apps: false, adding: false, switcher: false, opened: null }); }
// a bookmark just added lands in the dock with a short animation (S20)
toggleBm(k) { const on = !this.state.bm[k]; this.setState({ bm: Object.assign({}, this.state.bm, { [k]: on }), fresh: on ? k : null });
clearTimeout(this.freshTimer); if (on) this.freshTimer = setTimeout(() => this.setState({ fresh: null }), 1300); }
pickApp(id) {
if (id === this.state.app) { this.setState({ apps: false }); return; }
clearTimeout(this.loadTimer);
// Monitoring is Grafana's own app: it never shows the loading state (N6)
this.setState({ app: id, apps: false, switcher: false, loading: id !== 'monitoring' });
if (id !== 'monitoring') this.loadTimer = setTimeout(() => this.setState({ loading: false }), 650);
}
renderVals() {
const A = this.apps(); const { viewer, menu, apps, opened, app, loading, bm, hidden, adding, fresh, view, viewApp, lcMode, switcher } = this.state; const cur = A[app];
const DK = ['chart', 'doc', 'cube', 'list', 'clock', 'bell', 'pl', 'lp', 'ex', 'dash', 'drill', 'alert', 'conn', 'admin'];
const dockBms = [];
cur.pages.filter((x) => !(viewer && x.adm)).forEach((x) => {
const inDock = (k) => bm[k] && !hidden[k];
if (inDock(app + '/' + x.n)) dockBms.push({ label: x.n, icon: x.dk || x.ic, fresh: fresh === app + '/' + x.n, app, page: x.n });
(x.groups ? [].concat(...x.groups.map((g) => g.subs)) : x.subs).forEach((t) => { const k = app + '/' + x.n + '/' + t.n; if (inDock(k)) dockBms.push({ label: x.n + ' › ' + t.n, icon: t.dk || t.ic, fresh: fresh === k, app, page: x.n, sub: t.n }); });
});
dockBms.forEach((b) => { if (DK.indexOf(b.icon) < 0) b.icon = 'list'; });
const crumb = opened ? { a: A[opened.app].name, p: opened.page, s: opened.sub || '' } : { a: '', p: '', s: '' };
const keyOf = (e) => (e && e.key) || '';
return {
app, bm, hidden, loading, viewer, toggleHidden: (k) => this.toggleHidden(k), appsOpen: apps, menuOpen: menu,
dockApp: { id: app, name: cur.name, icon: cur.icon, ac: cur.ac, bg: cur.bg }, dockBms, dockOverlay: menu ? 'menu' : adding ? 'bookmark' : switcher ? 'apps' : 'none',
pickApp: (id) => this.pickApp(id), toggleBm: (k) => this.toggleBm(k), toggleAdd: () => this.toggleAdd(),
openPage: (a, p, s) => this.openPage(a, p, s), closeMenu: () => this.closeMenu(), toggleApps: () => this.toggleApps(),
toggleMenu: () => (menu ? this.closeMenu() : this.openMenu()),
sheetKey: (e) => { if (keyOf(e) !== 'Escape' || !(menu || adding || switcher)) return; if (e.preventDefault) e.preventDefault(); if (menu) this.closeMenu(); else this.setState({ adding: false, switcher: false }); },
mnStyle: menu ? 'filter:blur(4px) brightness(.45)' : '',
isHome: !opened, isPage: !!opened, crumbApp: crumb.a, crumbPage: crumb.p, crumbSub: crumb.s, openedTitle: crumb.s || crumb.p,
openedDesc: opened ? crumb.a + ' · ' + crumb.p + (crumb.s ? ' · ' + crumb.s : '') : '',
// S23 routing: one flag per view, the dock item that shows it, the breadcrumb of the view
vHome: view === 'home', vDash: view === 'dashboard', vApps: view === 'apps', vManage: view === 'manage', vLife: view === 'lifecycle', vBm: view === 'bookmarks', vPage: view === 'page',
viewApp, lcMode, dockSel: { home: 'home', dashboard: 'dashboards', bookmarks: 'bookmarks', apps: 'apps', manage: 'apps', lifecycle: 'apps' }[view] || 'none',
viewCrumb: { dashboard: 'Dashboards', apps: 'Apps', manage: 'Apps', lifecycle: 'Apps', bookmarks: 'Bookmarks' }[view] || '', viewSub: view === 'manage' || view === 'lifecycle' ? A[viewApp].name : '', hasViewSub: view === 'manage' || view === 'lifecycle',
// the dock's bookmarks open their page and Alerting opens Grafana's Alerting page, from every view
navigate: (k, b) => (k === 'bookmark' && b ? this.openPage(b.app, b.page, b.sub) : k === 'alerting' ? this.openPage('monitoring', 'Alerting')
: this.go({ home: 'home', dashboards: 'dashboard', starred: 'dashboard', bookmarks: 'bookmarks' }[k] || 'home')), appsPage: () => this.go('apps'),
manage: (id) => this.go('manage', id), step: (id) => this.go('lifecycle', id), toggleSwitcher: () => this.toggleSwitcher()
};
}
}
