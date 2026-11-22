// Mock data, not design (owner, 2026-11-20): sample apps, pages and bookmarks that show how the components behave.
// One set for every board (owner, 2026-11-21: S11's data merged in, the menu draws every sub page). lc_s22.py and lc_compose.py put
// these methods into every board logic that needs them, so they never drift.
// A page is { id, n, ic, bi, dk, d, route, iconName, subs } or, with group tabs (S10), { ..., groups: [{ n, subs }] }.
// ic: menu icon (rail and tiles), bi: bookmarks page icon (S11), dk: dock icon, d: description. A sub page has the same keys.
// lc: the app on the Apps page (S12, owner 2026-11-21: S12's data wins): version v, lifecycle status st (lifecycle_kit.py keys), step of 6,
// note, d, manifest page count n, update upd, places shown. Apps that are not enabled have no pages in the menu or bookmarks.
// lc.manage: what the manage page shows (S15): status and health, version history, checks { st: ok | warn | fail, t, d, src, fix }.
// lc.review, lc.setup, lc.update: the check rows of the lifecycle view (S18, S16, S21) with the summary line and run button.
// A page may carry who (Who can open), check (its check result) and checks (the rows of its page check).
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
P('drill', 'Drilldown', 'r2', 'drill', 'drill', 'Metrics, logs, traces and profiles without writing queries', '/drilldown', { subs: [
  P('metrics', 'Metrics', 'r2', 'drill', 'drill', 'Browse metrics without PromQL', '/a/grafana-metricsdrilldown-app/drilldown'),
  P('logs', 'Logs', 'r2', 'drill', 'drill', 'Browse logs without LogQL', '/a/grafana-lokiexplore-app/explore'),
  P('traces', 'Traces', 'r2', 'drill', 'drill', 'Browse traces without TraceQL', '/a/grafana-exploretraces-app/explore'),
  P('profiles', 'Profiles', 'r2', 'drill', 'drill', 'Browse profiles without queries', '/a/grafana-pyroscope-app/explore')] }),
P('alert', 'Alerting', 'r3', 'alert', 'alert', 'Alert rules, contact points and notification history', '/alerting', { iconName: 'Bell', subs: [
  P('rules', 'Alert rules', 'r3', 'list', 'bell', 'Rules that decide when an alert fires', '/alerting/list'),
  P('cp', 'Contact points', 'r3', 'alert', 'alert', 'Where notifications go', '/alerting/notifications'),
  P('pol', 'Notification policies', 'r3', 'alert', 'alert', 'How alerts are routed', '/alerting/routes'),
  P('sil', 'Silences', 'r3', 'alert', 'alert', 'Muted notifications', '/alerting/silences'),
  P('grp', 'Active notifications', 'r3', 'alert', 'alert', 'Alerts that are firing now', '/alerting/groups'),
  P('set', 'Settings', 'r5', 'admin', 'admin', 'Alertmanager settings', '/alerting/admin')] }),
P('conn', 'Connections', 'r4', 'conn', 'conn', 'Data sources and plugins', '/connections', { iconName: 'Plug', subs: [
  P('add', 'Add new connection', 'r4', 'conn', 'conn', 'Connect a new data source', '/connections/add-new-connection'),
  P('ds', 'Data sources', 'r4', 'conn', 'conn', 'Data sources you have connected', '/connections/datasources')] }),
P('admin', 'Administration', 'r5', 'admin', 'admin', 'Users, teams, plugins and server settings', '/admin', { iconName: 'Cog', adm: true, groups: [
  { n: 'General', subs: [P('prefs', 'Default preferences', 'a0', 'admin', 'admin', 'Theme, home dashboard and timezone', '/org'),
    P('stats', 'Statistics and licensing', 'a1', 'admin', 'admin', 'Usage numbers and license details', '/admin/upgrading'),
    P('settings', 'Settings', 'a2', 'admin', 'admin', 'Server configuration', '/admin/settings'),
    P('orgs', 'Organizations', 'a3', 'admin', 'admin', 'Create and switch organizations', '/admin/orgs'),
    P('migrate', 'Migrate to Grafana Cloud', 'a4', 'admin', 'admin', 'Move this instance to the cloud', '/admin/migrate-to-cloud'),
    P('prov', 'Provisioning', 'a5', 'admin', 'admin', 'Resources managed from files or Git', '/admin/provisioning')] },
  { n: 'Plugins and data', subs: [P('plugins', 'Plugins', 'r5', 'admin', 'admin', 'Install and update plugins', '/plugins'),
    P('corr', 'Correlations', 'r5', 'admin', 'admin', 'Links between data sources', '/datasources/correlations')] },
  { n: 'Access', subs: [P('users', 'Users', 'r5', 'admin', 'admin', 'Everyone who can sign in', '/admin/users'),
    P('teams', 'Teams', 'r5', 'admin', 'admin', 'Groups of users', '/org/teams'),
    P('sa', 'Service accounts', 'r5', 'admin', 'admin', 'Accounts for tools and scripts', '/org/serviceaccounts'),
    P('auth', 'Authentication', 'r5', 'admin', 'admin', 'Sign-in providers', '/admin/authentication')] }] })] },
management: { name: 'Management', icon: 'mgmt', ac: '#e0b46a', bg: '#2f2819', sub: 'Production line · 3 pages', home: 'Overview', lc: { v: '0.1.0', st: 'enabled', upd: '0.1.1', d: 'Production line overview, reports and 3D view.', places: true, manage: { since: '28 October',
health: 'OK', healthAt: '09:14', init: 'Accepted', initAt: '28 Oct', setup: 'Valid', migr: 'Up to date', needs: '>=13.0.0 <14', orbit: '>=1.0.0 <2',
prev: '0.0.9', updNote: '28 Oct, checks passed by themselves', checked: 'Today 09:14', lastRun: 'Last run today 09:14', checks: [
{ st: 'ok', t: 'Enabled for this organisation', d: 'On since 28 October.', src: 'GET /api/plugins/acme-management-app/settings' },
{ st: 'ok', t: 'App loads without error', d: 'Health check answered in 120 ms.', src: 'GET /api/plugins/acme-management-app/health' },
{ st: 'ok', t: 'Manifest ui block', d: 'accent, show and 3 pages are valid.', src: 'ui.json' },
{ st: 'ok', t: 'Accent is readable', d: '#e0b46a on the tile meets 4.5:1.' },
{ st: 'warn', t: 'Pages', d: '3D view has a warning. See the Pages table.', fix: 'Show' }] } }, pages: [
P('overview', 'Overview', 'chart', 'overview', 'chart', 'Production line overview', '/a/acme-management-app/overview', { iconName: 'Chart', who: 'Viewer', check: 'ok', subs: [
  P('line', 'Line status', 'chart', 'overview', 'chart', 'Live status of each station on the line', '/a/acme-management-app/overview/line-status'),
  P('shifts', 'Shifts', 'clock', 'clock', 'clock', 'Output and stops per shift', '/a/acme-management-app/overview/shifts'),
  P('alarms', 'Alarms', 'bell', 'alert', 'alert', 'Open alarms on the line', '/a/acme-management-app/overview/alarms')] }),
P('reports', 'Reports', 'doc', 'reports', 'doc', 'Shift and production reports', '/a/acme-management-app/reports', { iconName: 'Document', who: 'Viewer', check: 'ok', subs: [
  P('daily', 'Daily', 'doc', 'reports', 'doc', 'Yesterday per station', '/a/acme-management-app/reports/daily'),
  P('weekly', 'Weekly', 'doc', 'reports', 'doc', 'This week against the plan', '/a/acme-management-app/reports/weekly'),
  P('monthly', 'Monthly', 'doc', 'reports', 'doc', 'Month summary for managers', '/a/acme-management-app/reports/monthly'),
  P('export', 'Export', 'list', 'list', 'list', 'Download reports as CSV or PDF', '/a/acme-management-app/reports/export')] }),
P('cube', '3D view', 'cube', 'cube', 'cube', 'Machines in the plant model', '/a/acme-management-app/3d-view', { iconName: 'Cube', who: 'Editor', check: 'warn', subs: [], checks: [
{ st: 'ok', t: 'Route responds', d: 'The app renders a page at this path.', src: '/a/acme-management-app/3d-view' },
{ st: 'ok', t: 'In the nav tree for you', d: 'Listed under plugin-page-acme-management-app.' },
{ st: 'ok', t: 'Who can open', d: 'Editor and above. 2 Viewers in this org cannot see it.' },
{ st: 'warn', t: 'Manifest page entry', d: 'No description, so the card shows the name only.', src: 'ui.pages.3d-view.description', fix: 'Open manifest draft' }] })] },
maintenance: { name: 'Maintenance', icon: 'mnt', ac: '#5794f2', bg: '#17233b', sub: 'Work orders · 2 pages', isNew: true, home: 'Work orders', lc: { v: '0.3.2', st: 'enabled', note: 'enabled 09:10', at: 'Today 09:10', d: 'Work orders, machine downtime and service history.',
update: {"checks": [{"st": "ok", "t": "Grafana version and compatibility", "d": "The app needs >=13.0.0 <14. This Grafana is 13.3.0.", "src": "grafanaDependency"}, {"st": "ok", "t": "Orbit API version", "d": "The app needs Orbit >=1.0.0 <2. This server runs Orbit 1.0.0.", "src": "requires.orbit"}, {"st": "ok", "t": "Plugin loaded", "d": "Grafana loaded acme-maintenance-app v0.4.0 after the restart."}, {"st": "ok", "t": "Signature", "d": "[SIGNATURE STATUS]. Grafana's loader checked it under this server's signature policy."}, {"st": "ok", "t": "Dependencies", "d": "No plugin dependencies are declared in plugin.json."}, {"st": "ok", "t": "Manifest", "d": "Valid. 2 pages and 6 sub pages are registered (1 new)."}], "last": "Rechecked 07:05", "run": "Run again"} }, pages: [
P('orders', 'Work orders', 'list', 'list', 'list', 'Open, planned and closed work orders', '/a/acme-maintenance-app/orders', { iconName: 'List', kind: 'List', subs: [
  P('open', 'Open', 'list', 'list', 'list', 'Work orders not closed yet', '/a/acme-maintenance-app/orders/open'),
  P('planned', 'Planned', 'clock', 'clock', 'clock', 'Planned maintenance by date', '/a/acme-maintenance-app/orders/planned'),
  P('closed', 'Closed', 'doc', 'doc', 'doc', 'Closed work orders', '/a/acme-maintenance-app/orders/closed')] }),
P('downtime', 'Downtime', 'clock', 'clock', 'clock', 'Downtime minutes by cause and machine', '/a/acme-maintenance-app/downtime', { iconName: 'Clock', kind: 'Dashboard', subs: [
  P('cause', 'By cause', 'chart', 'overview', 'chart', 'Downtime minutes by cause', '/a/acme-maintenance-app/downtime/by-cause'),
  P('machine', 'By machine', 'cube', 'cube', 'cube', 'Downtime minutes by machine', '/a/acme-maintenance-app/downtime/by-machine')] })] },
quality: { name: 'Quality', inSelector: false, enabled: false, ac: '#73bf69', bg: '#1b2a1d', sub: 'Review required', home: 'Inspections', pages: [],
lc: { v: '1.0.1', st: 'review', step: 2, n: 4, d: 'Inspection results and defect tracking.',
review: {"checks": [{"st": "ok", "t": "Grafana version and compatibility", "d": "The app needs >=13.0.0 <14. This Grafana is 13.3.0.", "src": "grafanaDependency"}, {"st": "ok", "t": "Orbit API version", "d": "The app needs Orbit >=1.0.0 <2. This server runs Orbit 1.0.0.", "src": "requires.orbit"}, {"st": "ok", "t": "Plugin loaded", "d": "Grafana discovered and loaded acme-quality-app v1.0.1 after the restart.", "src": "GET /api/plugins/acme-quality-app/settings"}, {"st": "ok", "t": "Signature", "d": "[SIGNATURE STATUS]. Grafana's loader checked it under this server's signature policy."}, {"st": "ok", "t": "Dependencies", "d": "No plugin dependencies are declared in plugin.json."}, {"st": "idle", "t": "App health", "d": "Runs after Enable. Grafana answers the health check only for an enabled app; this app has no backend, so nothing will run."}, {"st": "ok", "t": "Self-test: manifest and routes", "d": "The ui block is valid. 4 pages are registered."}, {"st": "warn", "t": "Self-test: sample query", "d": "Skipped with a warning: no data source is connected yet. It runs again in Validate."}], "last": "Finished 09:12", "run": "Run again"} } },
energy: { name: 'Energy', inSelector: false, enabled: false, ac: '#f2cc0c', bg: '#2e2a14', sub: 'No pages yet', home: 'Setup', pages: [],
lc: { v: '0.2.0', st: 'setupwip', step: 3, n: 2, note: 'discovered 08:52', d: 'Power use per machine and per shift.',
setup: {"checks": [{"st": "idle", "t": "Required fields", "d": "Not run yet."}, {"st": "idle", "t": "Permissions", "d": "Not run yet."}, {"st": "idle", "t": "Connections", "d": "Not run yet."}, {"st": "idle", "t": "App prerequisites", "d": "Not run yet."}]} } },
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
