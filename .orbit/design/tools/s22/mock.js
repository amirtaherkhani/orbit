// Mock data, not design (owner, 2026-11-20): sample apps, pages and bookmarks that show how the components behave.
// One set for every board (owner, 2026-11-21: S11's data merged in, the menu draws every sub page). lc_s22.py and lc_compose.py put
// these methods into every board logic that needs them, so they never drift.
// A page is { id, n, ic, bi, dk, d, route, iconName, subs } or, with group tabs (S10), { ..., groups: [{ n, subs }] }.
// ic: menu icon (rail and tiles), bi: bookmarks page icon (S11), dk: dock icon, d: description. A sub page has the same keys.
// lc: the app on the Apps page (S12, owner 2026-11-21: S12's data wins): version v, lifecycle status st (lifecycle_kit.py keys), step of 6,
// note, d, manifest page count n, update upd, places shown. Apps that are not enabled have no pages in the menu or bookmarks.
apps() {
const P = (id, n, ic, bi, dk, d, route, more) => Object.assign({ id, n, ic, bi, dk, d, route, iconName: n }, more);
return {
monitoring: { name: 'Monitoring', icon: 'mon', ac: '#58cfec', bg: '#1d353f', sub: 'Grafana · 6 pages', home: 'Home', pages: [
P('dash', 'Dashboards', 'r0', 'dash', 'chart', 'Browse, search and organise dashboards', '/dashboards', { iconName: 'Apps', subs: [
  P('pl', 'Playlists', 't0', 'pl', 'pl', 'Rotate dashboards on a TV or kiosk screen', '/playlists'),
  P('snap', 'Snapshots', 't1', 'dash', 'list', 'Saved copies of a dashboard at one moment', '/dashboard/snapshots'),
  P('lp', 'Library panels', 't2', 'lp', 'lp', 'Panels you reuse across several dashboards', '/library-panels'),
  P('pub', 'Shared dashboards', 't3', 'dash', 'list', 'Dashboards open through a public link', '/dashboard/public'),
  P('del', 'Recently deleted', 't4', 'dash', 'clock', 'Bring back dashboards that were removed', '/dashboard/recently-deleted')] }),
P('explore', 'Explore', 'r1', 'explore', 'ex', 'Query and inspect your data without a dashboard', '/explore', { iconName: 'Compass', subs: [] }),
P('drill', 'Drilldown', 'r2', 'drill', 'list', 'Metrics, logs, traces and profiles without writing queries', '/drilldown', { subs: [
  P('metrics', 'Metrics', 'r2', 'drill', 'list', 'Browse metrics without PromQL', '/a/grafana-metricsdrilldown-app/drilldown'),
  P('logs', 'Logs', 'r2', 'drill', 'list', 'Browse logs without LogQL', '/a/grafana-lokiexplore-app/explore'),
  P('traces', 'Traces', 'r2', 'drill', 'list', 'Browse traces without TraceQL', '/a/grafana-exploretraces-app/explore'),
  P('profiles', 'Profiles', 'r2', 'drill', 'list', 'Browse profiles without queries', '/a/grafana-pyroscope-app/explore')] }),
P('alert', 'Alerting', 'r3', 'alert', 'bell', 'Alert rules, contact points and notification history', '/alerting', { iconName: 'Bell', subs: [
  P('rules', 'Alert rules', 'r3', 'list', 'bell', 'Rules that decide when an alert fires', '/alerting/list'),
  P('cp', 'Contact points', 'r3', 'alert', 'bell', 'Where notifications go', '/alerting/notifications'),
  P('pol', 'Notification policies', 'r3', 'alert', 'bell', 'How alerts are routed', '/alerting/routes'),
  P('sil', 'Silences', 'r3', 'alert', 'bell', 'Muted notifications', '/alerting/silences'),
  P('grp', 'Active notifications', 'r3', 'alert', 'bell', 'Alerts that are firing now', '/alerting/groups'),
  P('set', 'Settings', 'r5', 'admin', 'list', 'Alertmanager settings', '/alerting/admin')] }),
P('conn', 'Connections', 'r4', 'conn', 'list', 'Data sources and plugins', '/connections', { iconName: 'Plug', subs: [
  P('add', 'Add new connection', 'r4', 'conn', 'list', 'Connect a new data source', '/connections/add-new-connection'),
  P('ds', 'Data sources', 'r4', 'conn', 'list', 'Data sources you have connected', '/connections/datasources')] }),
P('admin', 'Administration', 'r5', 'admin', 'list', 'Users, teams, plugins and server settings', '/admin', { iconName: 'Cog', adm: true, groups: [
  { n: 'General', subs: [P('prefs', 'Default preferences', 'a0', 'admin', 'list', 'Theme, home dashboard and timezone', '/org'),
    P('stats', 'Statistics and licensing', 'a1', 'admin', 'list', 'Usage numbers and license details', '/admin/upgrading'),
    P('settings', 'Settings', 'a2', 'admin', 'list', 'Server configuration', '/admin/settings'),
    P('orgs', 'Organizations', 'a3', 'admin', 'list', 'Create and switch organizations', '/admin/orgs'),
    P('migrate', 'Migrate to Grafana Cloud', 'a4', 'admin', 'list', 'Move this instance to the cloud', '/admin/migrate-to-cloud'),
    P('prov', 'Provisioning', 'a5', 'admin', 'list', 'Resources managed from files or Git', '/admin/provisioning')] },
  { n: 'Plugins and data', subs: [P('plugins', 'Plugins', 'r5', 'admin', 'list', 'Install and update plugins', '/plugins'),
    P('corr', 'Correlations', 'r5', 'admin', 'list', 'Links between data sources', '/datasources/correlations')] },
  { n: 'Access', subs: [P('users', 'Users', 'r5', 'admin', 'list', 'Everyone who can sign in', '/admin/users'),
    P('teams', 'Teams', 'r5', 'admin', 'list', 'Groups of users', '/org/teams'),
    P('sa', 'Service accounts', 'r5', 'admin', 'list', 'Accounts for tools and scripts', '/org/serviceaccounts'),
    P('auth', 'Authentication', 'r5', 'admin', 'list', 'Sign-in providers', '/admin/authentication')] }] })] },
management: { name: 'Management', icon: 'mgmt', ac: '#e0b46a', bg: '#2f2819', sub: 'Production line · 3 pages', home: 'Overview', lc: { v: '0.1.0', st: 'enabled', upd: '0.1.1', d: 'Production line overview, reports and 3D view.', places: true }, pages: [
P('overview', 'Overview', 'chart', 'overview', 'chart', 'Production line overview', '/a/acme-management-app/overview', { iconName: 'Chart', subs: [
  P('line', 'Line status', 'chart', 'overview', 'chart', 'Live status of each station on the line', '/a/acme-management-app/overview/line-status'),
  P('shifts', 'Shifts', 'clock', 'clock', 'clock', 'Output and stops per shift', '/a/acme-management-app/overview/shifts'),
  P('alarms', 'Alarms', 'bell', 'alert', 'bell', 'Open alarms on the line', '/a/acme-management-app/overview/alarms')] }),
P('reports', 'Reports', 'doc', 'reports', 'doc', 'Shift and production reports', '/a/acme-management-app/reports', { iconName: 'Document', subs: [
  P('daily', 'Daily', 'doc', 'reports', 'doc', 'Yesterday per station', '/a/acme-management-app/reports/daily'),
  P('weekly', 'Weekly', 'doc', 'reports', 'doc', 'This week against the plan', '/a/acme-management-app/reports/weekly'),
  P('monthly', 'Monthly', 'doc', 'reports', 'doc', 'Month summary for managers', '/a/acme-management-app/reports/monthly'),
  P('export', 'Export', 'list', 'list', 'list', 'Download reports as CSV or PDF', '/a/acme-management-app/reports/export')] }),
P('cube', '3D view', 'cube', 'cube', 'cube', 'Machines in the plant model', '/a/acme-management-app/3d-view', { iconName: 'Cube', subs: [] })] },
maintenance: { name: 'Maintenance', icon: 'mnt', ac: '#5794f2', bg: '#17233b', sub: 'Work orders · 2 pages', isNew: true, home: 'Work orders', lc: { v: '0.3.2', st: 'enabled', note: 'enabled 09:10', at: 'Today 09:10', d: 'Work orders, machine downtime and service history.' }, pages: [
P('orders', 'Work orders', 'list', 'list', 'list', 'Open, planned and closed work orders', '/a/acme-maintenance-app/orders', { iconName: 'List', kind: 'List', subs: [
  P('open', 'Open', 'list', 'list', 'list', 'Work orders not closed yet', '/a/acme-maintenance-app/orders/open'),
  P('planned', 'Planned', 'clock', 'clock', 'clock', 'Planned maintenance by date', '/a/acme-maintenance-app/orders/planned'),
  P('closed', 'Closed', 'doc', 'doc', 'doc', 'Closed work orders', '/a/acme-maintenance-app/orders/closed')] }),
P('downtime', 'Downtime', 'clock', 'clock', 'clock', 'Downtime minutes by cause and machine', '/a/acme-maintenance-app/downtime', { iconName: 'Clock', kind: 'Dashboard', subs: [
  P('cause', 'By cause', 'chart', 'overview', 'chart', 'Downtime minutes by cause', '/a/acme-maintenance-app/downtime/by-cause'),
  P('machine', 'By machine', 'cube', 'cube', 'cube', 'Downtime minutes by machine', '/a/acme-maintenance-app/downtime/by-machine')] })] },
quality: { name: 'Quality', inSelector: false, enabled: false, ac: '#73bf69', bg: '#1b2a1d', sub: 'Review required', home: 'Inspections', pages: [],
lc: { v: '1.0.1', st: 'review', step: 2, n: 4, d: 'Inspection results and defect tracking.' } },
energy: { name: 'Energy', inSelector: false, enabled: false, ac: '#f2cc0c', bg: '#2e2a14', sub: 'No pages yet', home: 'Setup', pages: [],
lc: { v: '0.2.0', st: 'setupwip', step: 3, n: 2, note: 'discovered 08:52', d: 'Power use per machine and per shift.' } },
safety: { name: 'Safety', inSelector: false, enabled: false, ac: '#c9cdd3', bg: '#262a31', sub: 'Not initialized', home: 'Home', pages: [],
lc: { v: '0.4.0', st: 'notinit', step: 1, n: 3, note: 'discovered 09:05', d: 'Incident reports and safety walks.' } }
};
}
// Every bookmarkable item, pages and sub pages, with its key "app/Page" or "app/Page/Sub page". The app home is not one.
mockItems() {
const A = this.apps(); const out = [];
Object.keys(A).forEach((a) => A[a].pages.forEach((g) => {
const subs = g.groups ? [].concat(...g.groups.map((x) => x.subs.map((s) => Object.assign({ grp: x.n }, s)))) : g.subs;
out.push(Object.assign({}, g, { key: a + '/' + g.n, app: a, parent: null, nSubs: subs.length }));
subs.forEach((s) => out.push(Object.assign({}, s, { key: a + '/' + g.n + '/' + s.n, app: a, parent: g.n, grp: s.grp || '', nSubs: 0 }))); }));
return out;
}
mockBookmarks() {
return { 'monitoring/Dashboards/Playlists': true, 'monitoring/Dashboards/Library panels': true, 'monitoring/Explore': true, 'monitoring/Administration/Settings': true,
'management/Overview/Line status': true, 'management/Reports/Weekly': true, 'maintenance/Work orders/Open': true, 'maintenance/Downtime': true };
}
// bookmarks kept out of the dock ("Show in the dock" off, S11): they stay in Bookmarks and in the menu
mockHidden() {
return { 'monitoring/Administration/Settings': true };
}
