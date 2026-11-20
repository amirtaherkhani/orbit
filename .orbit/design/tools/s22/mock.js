// Mock data, not design (owner, 2026-11-20): sample apps, pages and bookmarks that show how the components behave.
// lc_s22.py puts these two methods into every board logic that needs them (S22 and C06 MenuSheet), so they never drift.
// A sub tile is [label, icon, description, dock icon]; subs null = sub pages not drawn on these boards.
// A page with groups (Administration, S10) shows them as tabs above its tiles; each group has its own subs.
apps() {
return {
monitoring: { name: 'Monitoring', icon: 'mon', ac: '#58cfec', bg: '#1d353f', sub: 'Grafana · 6 pages', pages: [
{ n: 'Dashboards', ic: 'r0', dk: 'chart', subs: [['Playlists', 't0', 'Rotate dashboards on a TV or kiosk screen', 'pl'], ['Snapshots', 't1', 'Saved copies of a dashboard at one moment', 'list'], ['Library panels', 't2', 'Panels you reuse across several dashboards', 'lp'], ['Shared dashboards', 't3', 'Dashboards open through a public link', 'list'], ['Recently deleted', 't4', 'Bring back dashboards that were removed', 'clock']] },
{ n: 'Explore', ic: 'r1', dk: 'ex', d: 'Query and inspect your data without a dashboard', subs: [] },
{ n: 'Drilldown', ic: 'r2', dk: 'list', count: 4, subs: null },
{ n: 'Alerting', ic: 'r3', dk: 'bell', count: 6, subs: null },
{ n: 'Connections', ic: 'r4', dk: 'list', count: 2, subs: null },
{ n: 'Administration', ic: 'r5', dk: 'list', adm: true, groups: [
{ n: 'General', subs: [['Default preferences', 'a0', 'Theme, home dashboard and timezone'], ['Statistics and licensing', 'a1', 'Usage numbers and license details'], ['Settings', 'a2', 'Server configuration'], ['Organizations', 'a3', 'Create and switch organizations'], ['Migrate to Grafana Cloud', 'a4', 'Move this instance to the cloud'], ['Provisioning', 'a5', 'Resources managed from files or Git']] },
{ n: 'Plugins and data', count: 2, subs: null },
{ n: 'Access', count: 4, subs: null }] }] },
management: { name: 'Management', icon: 'mgmt', ac: '#e0b46a', bg: '#2f2819', sub: 'Production line · 3 pages', pages: [
{ n: 'Overview', ic: 'chart', subs: [['Line status', 'chart', 'Live status of each station on the line'], ['Shifts', 'clock', 'Output and stops per shift'], ['Alarms', 'bell', 'Open alarms on the line']] },
{ n: 'Reports', ic: 'doc', subs: [['Daily', 'doc', 'Yesterday per station'], ['Weekly', 'doc', 'This week against the plan'], ['Monthly', 'doc', 'Month summary for managers'], ['Export', 'list', 'Download reports as CSV or PDF']] },
{ n: '3D view', ic: 'cube', subs: [] }] },
maintenance: { name: 'Maintenance', icon: 'mnt', ac: '#5794f2', bg: '#17233b', sub: 'Work orders · 2 pages', isNew: true, pages: [
{ n: 'Work orders', ic: 'list', subs: [['Open', 'list', 'Work orders not closed yet'], ['Planned', 'clock', 'Planned maintenance by date'], ['Closed', 'doc', 'Closed work orders']] },
{ n: 'Downtime', ic: 'clock', subs: [['By cause', 'chart', 'Downtime minutes by cause'], ['By machine', 'cube', 'Downtime minutes by machine']] }] },
energy: { name: 'Energy', inSelector: false, ac: '#f2cc0c', bg: '#2e2a14', sub: 'No pages yet', pages: [] }
};
}
mockBookmarks() {
return { 'monitoring/Dashboards/Playlists': true, 'monitoring/Dashboards/Library panels': true, 'monitoring/Explore': true, 'management/Overview/Line status': true, 'management/Reports/Weekly': true, 'maintenance/Work orders/Open': true, 'maintenance/Downtime': true };
}
