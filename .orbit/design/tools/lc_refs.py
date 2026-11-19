import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
import re,sys
G=ROOT+''
def load(n): return open(G+'pre_lifecycle/'+n).read()
def save(n,s): open(G+'project/'+n,'w').write(s)
class Doc:
    def __init__(self,n): self.n=n; self.s=load(n)
    def rep(self,a,b,n=1):
        assert self.s.count(a)==n,(self.n,a[:80],self.s.count(a)); self.s=self.s.replace(a,b)
    def save(self): save(self.n,self.s)
V='<span class="rtg tv">Verified in v13.3.0</span>'; I='<span class="rtg ti">Inferred</span>'; NV='<span class="rtg tu">Not verified</span>'
def card(title,lead,where,gives,build,open_,spec):
    ul=lambda xs:'<ul>'+''.join(f'<li>{x}</li>' for x in xs)+'</ul>'
    return (f'<div class="cd2"><div class="hd2"><h3 style="margin:0">{title}</h3><span class="rtg tc">Custom</span></div><p>{lead}</p>'
     f'<p style="margin-top:8px"><small>Where: </small><small style="color:#c9cdd3">{where}</small></p>'
     '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:12px">'
     f'<div><p class="rf-lab" style="margin:0">Grafana gives us</p>{ul(gives)}</div><div><p class="rf-lab" style="margin:0">To build</p>{ul(build)}</div><div><p class="rf-lab" style="margin:0">Open</p>{ul(open_)}</div></div>'
     f'<p style="margin-top:10px"><small>Spec: {spec}</small></p></div>')
def swap_card(d,title,new):
    i=d.s.index(f'<div class="cd2"><div class="hd2"><h3 style="margin:0">{title}</h3>'); j=d.s.index('<div class="cd2">',i+10) if '<div class="cd2">' in d.s[i+10:] else None
    # a card ends with the Spec paragraph + </div>
    e=d.s.index('</small></p></div>',i)+len('</small></p></div>')
    d.s=d.s[:i]+new+d.s[e:]
# ---------------- R02 ----------------
d=Doc('RefNew.dc.html')
B=lambda t:f'<td><b style="font-weight:500;color:#eceef1">{t}</b></td>'
def swap_row(d,title,cells):
    i=d.s.index('<tr>'+B(title)); j=d.s.index('</tr>',i)+5
    d.s=d.s[:i]+'<tr>'+B(cells[0])+''.join(f'<td>{c}</td>' for c in cells[1:])+'</tr>'+d.s[j:]
swap_row(d,'Add app view',['Apps view','New route (proposal: <code>/apps</code>), opened from the app switcher “Apps” row','R10 · Apps, app lifecycle and bookmarks, S12 · AppsView: all apps, S17'])
swap_row(d,'App manage view',['App manage view','New route (proposal: <code>/apps/&lt;id&gt;</code>), opened from Manage on an Enabled or Disabled app card','R10, S15 · AppManageView: manage app'])
swap_row(d,'App setup view',['App lifecycle view','New route (proposal: <code>/apps/&lt;id&gt;/setup</code>), opened from the card button of an app that is not enabled yet','R10, S18 · initialize and review, S16 · setup, validate, migrate, enable'])
swap_row(d,'Configuration check',['Checks list','Inside the lifecycle view (initialization, validation) and the manage view (Health)','R10 (Checks list), S18, S16, S15'])
swap_row(d,'Add app from a link, app updates',['App lifecycle statuses','On every app card, in the lifecycle view and in the manage view','R10 (Lifecycle statuses and card buttons), S12'])
swap_card(d,'Add app view',card('Apps view','Lists every app plugin installed in this Grafana with its lifecycle status and the buttons for that status.',
 'New route (proposal: <code>/apps</code>), opened from the app switcher “Apps” row',
 [f'Plugin catalog and plugin settings pages exist; app plugins can be enabled per org {V}',f'<code>grafana-cli plugins install</code> from the catalog or a ZIP URL; no checksum comparison in the CLI path {V}'],
 ['Filter All / Enabled / Needs action, search, one card grid','Card: status icon at the top right (not a button), status name in the meta row, buttons per status, “Step n of 6” until the app is enabled','Preview panel: status chip, lifecycle strip, details, tree of registered pages','“Check for updates” only reports whether a newer version exists'],
 ['Where the lifecycle status is stored, and how it relates to Grafana’s own <code>enabled</code> flag (OD23)','Which roles may take each action','Whether every transitional state gets its own card status'],
 'R10, S12 · AppsView: all apps, S17 · AppSwitcher: Apps row'))
swap_card(d,'App manage view',card('App manage view','One enabled or disabled app: status and health, where it appears, pages, access, data sources, and the actions on it.',
 'New route (proposal: <code>/apps/&lt;id&gt;</code>), opened from Manage on the app card',
 [f'App plugin pages from <code>includes[]</code> with role and <code>addToNav</code> {V}',f'Plugin settings per org: <code>enabled</code>, <code>pinned</code>, <code>jsonData</code> (<code>POST /api/plugins/&lt;id&gt;/settings</code>) {V}',f'A plugin uninstall API when plugin admin is enabled (<code>POST /api/plugins/&lt;id&gt;/uninstall</code>) {V}'],
 ['Tabs: Overview (Status and health, Where it appears, Icon and colour), Pages, Access, Data sources, Health','Right panel: About, Version (information only), dock preview','Actions: Open setup, Disable or Enable, Uninstall','Hiding the app or a page is not access control; the view says so'],
 ['User audit is not in v1 (Grafana OSS has none); a global audit feature comes later (OD30)','Per user or per organisation for “Where it appears”','Who may disable or uninstall; whether Uninstall uses Grafana’s API or stays with the CLI','Package and database rollback'],
 'R10, S15 · AppManageView: manage app'))
swap_card(d,'App setup view',card('App lifecycle view','Takes an installed app from Not initialized to Enabled in six steps: Initialize, Review, Setup, Validate setup, Enable, Migrate.',
 'New route (proposal: <code>/apps/&lt;id&gt;/setup</code>), opened from the card button (Initialize, Review, Setup, Continue setup, Run migration, Enable)',
 [f'Per-org plugin enable setting {V}',f'App health: <code>GET /api/plugins/&lt;id&gt;/health</code>, only while the app is enabled in Grafana’s plugin settings {V}','Apps can ship their own configuration pages '+I,'Self-tests and migrations of an app: nothing built in '+NV],
 ['Step list with states done, current and locked; a first row says the CLI install alone does not prove the app works','Review: every check with its result, “Accept and continue to setup”; the result covers only checks that ran','Setup: Organisation; Users, groups and permissions; Sub page permissions; Data sources and connections; App requirements; Icon and colour','Validate, Enable and Migrate (only when the app owns tables with pending migrations; after Enable, in maintenance mode), each locked until the step before it has passed'],
 ['A contract for app self-tests and for app migrations','How sub page permissions are enforced on the server','How the fork embeds or links the app’s own configuration page','Non-admin users: hide the view or show it read only'],
 'R10, S18 · AppLifecycleView: initialize and review, S16 · AppLifecycleView: setup, validate, migrate, enable'))
swap_card(d,'Configuration check',card('Checks list','One list component for initialization results, setup validation and health: what ran, the result, and what to fix.',
 'Lifecycle view (steps Review and Validate setup) and manage view (Health tab, Pages table)',
 [f'Plugin settings and health endpoints (<code>/api/plugins/&lt;id&gt;/settings</code>, <code>/health</code>) {V}; health needs a backend plugin and an enabled app',f'Nav tree tells whether a user can see a page {V}'],
 ['Initialization checks: Grafana version and compatibility, plugin loaded, signature, dependencies, manifest; app health runs after Enable','Validation checks: required fields, permissions, connections, app prerequisites','Page checks: route responds, in the nav tree for the user, who can open, manifest page entry','Results Passed, Warning, Failed, Not run or Not available, each with its own mark shape; a failed row names the operation that failed'],
 ['Whether a failed page is hidden from the dock and the menu (proposal)','How “route responds” is tested without running the page','Where results are stored and for how long'],
 'R10 (Checks list), S18, S16, S15'))
swap_card(d,'Add app from a link, app updates',card('App lifecycle statuses','Thirteen statuses of our Apps Manager, each with an icon, a meaning and its card buttons. They are not Grafana states.',
 'App cards (S12), lifecycle view header (S18, S16), manage view header (S15)',
 [f'<code>dependencies.grafanaDependency</code> in plugin.json, a semver range {I}',f'Installed app version in <code>info.version</code> {V}','Signature validation by the plugin loader under the configured policy '+I],
 ['Status icon (28px tile, seven colour groups) and status chip; the name is always written as text too','Buttons per status, shown only to users allowed to act; transitional states show View progress and disable conflicting actions','Gates: Setup only after the review is accepted; Enable only after validation succeeds; a pending migration then runs in maintenance mode','Update: the apps module detects the new version; a simple update keeps the app Enabled, other updates reopen the lifecycle at the first step that needs action, in maintenance mode (S21)'],
 ['Exact labels and recovery actions','Whether every transitional state gets its own card status','Server-side enforcement of the gates'],
 'R10 (App lifecycle; Lifecycle statuses and card buttons), S12'))
d.rep('“New” only on the most recently installed and activated app in the app dropdown','“New” only on the most recently enabled app in the app dropdown')
d.rep('Same pattern as Add app: filter','Same card pattern as Apps: filter')
d.rep('“App needs setup” state is described, not drawn','Lifecycle statuses are drawn on S12; all thirteen are on R10')
d.rep('breadcrumb chip, Add app view','breadcrumb chip, Apps view',2)
d.rep('A rule for “initialized”. Proposal: the org plugin setting is enabled and the plugin loaded without error','The lifecycle status of an app (13 statuses, R10) and where it is stored; it is separate from Grafana’s <code>enabled</code> plugin setting')
d.rep('min-height:6830px','min-height:7020px'); d.rep('"height":6830','"height":7020')
d.save()
# ---------------- R01 ----------------
d=Doc('RefChanges.dc.html')
d.rep('Add app view, bookmark pages view','Apps view, bookmark pages view')
d.rep('Card status toggle and status icons','App status icon, bookmark toggle and status icons')
d.rep('AppsView and DockPagesView cards: one icon button at the top right bookmarks or adds at once; “In dock” and “In the menu” icons in the meta row at the bottom of the card; Manage (sliders icon) and Setup (gear icon) actions','App cards: a lifecycle status icon at the top right (not a button) and the buttons for that status below the meta row. Page cards: one bookmark toggle at the top right that acts at once. “In dock” and “In the menu” icons in the meta row')
d.rep('App manage view, App setup view','App manage view, App lifecycle view')
d.rep('opened from the card Manage and Setup buttons','opened from the app card buttons')
d.rep('S15 · AppManageView, S16 · AppSetupView, R10','S15 · AppManageView, S18 and S16 · AppLifecycleView, R10')
d.rep('<td>Configuration check</td>','<td>Checks list</td>') if '<td>Configuration check</td>' in d.s else d.rep('>Configuration check<','>Checks list<')
d.rep('App setup and app manage views: app checks and page checks, results Passed, Warning, Failed, Not run','Lifecycle and manage views: initialization, validation, health and page checks; results Passed, Warning, Failed, Not run or Not available')
d.rep('R10 · AppsView and DockPagesView (Configuration check)','R10 (Checks list)')
d.rep('Add app menu and add-app flow','Apps row and app lifecycle')
d.rep('The app switcher’s “Apps” row opens the Apps page (/apps) directly; the Add app menu is removed. The flow has four steps: Source, Check, Review, Add','The app switcher’s “Apps” row opens the Apps page (/apps). Apps are installed with grafana-cli; the UI then takes each app through Initialize, Review, Setup, Validate, Migrate and Enable, with 13 lifecycle statuses')
d.rep('S17 · AppSwitcher: Apps row, S18 · AddAppFlow, R10','S17 · AppSwitcher: Apps row, S18, S16, S12, R10')
d.rep('min-height:3081px','min-height:3110px'); d.rep('"height":3081','"height":3110')
d.rep('Manage view, right panel: installed and latest version, Grafana compatibility, last checked (information only, no install); update chip on the app card','Manage view, right panel: installed and latest version, Grafana compatibility, last checked (information only). Updating is a CLI install and restart, after which the app goes through the lifecycle again; update chip on the app card')
d.save()
# ---------------- R03 ----------------
d=Doc('RefScope.dc.html')
d.rep('Add app and bookmark pages views','Apps and bookmark pages views')
d.rep('App manage and App setup views, with the configuration check','App manage and app lifecycle views, with the checks list')
d.rep('Apps row, add-app flow and app updates','Apps row, app lifecycle statuses and version info')
d.rep('S16 · AppSetupView: set up app','S16 · AppLifecycleView: setup, validate, migrate, enable',2)
d.rep('Setup steps and configuration check for an app that needs setup','Lifecycle view at the Setup step, with Validate, Enable and Migrate locked')
d.rep('S18 · AddAppFlow: check','S18 · AppLifecycleView: initialize and review',2)
d.rep('Four-step add-app flow at the check step','Lifecycle view at the Review step: initialization results and acceptance')
d.rep('Add app page','Apps page')
d.rep('Manage one added app','Manage one enabled or disabled app')
d.rep('<code>AppSetupView</code>','<code>AppLifecycleView</code>')
d.rep('Set up an app that is not initialized','Six steps from Not initialized to Enabled: Initialize, Review, Setup, Validate, Enable, Migrate')
d.rep('<td><code>AddAppFlow</code></td>','<td><code>AppStatus</code></td>')
d.rep('Add an app from a link: Source, Check, Review, Add','Status icon, status chip and the buttons for each of the 13 lifecycle statuses')
d.rep('Manage one app: where it appears, pages, appearance, configuration check','Manage one app: status and health, where it appears, pages, access, data sources')
d.rep('min-height:5740px','min-height:5780px'); d.rep('"height":5740','"height":5780')
d.save()
print('refs ok')
