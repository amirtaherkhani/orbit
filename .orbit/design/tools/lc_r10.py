import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
import re,sys
sys.path.insert(0,ROOT+'tools')
from lifecycle_kit import *
G=ROOT+''
s=open(G+'pre_lifecycle/RefApps.dc.html').read(); s12=open(G+'project/AppsAdd.dc.html').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:70],s.count(a)); s=s.replace(a,b)
def row(first):
    i=s.index(f'<tr><td>{first}</td>'); j=s.index('</tr>',i)+5; return i,j
def setrow(first,cells):
    global s
    i,j=row(first); s=s[:i]+'<tr>'+''.join(f'<td>{c}</td>' for c in cells)+'</tr>'+s[j:]
def addafter(first,cells):
    global s
    i,j=row(first); s=s[:j]+'<tr>'+''.join(f'<td>{c}</td>' for c in cells)+'</tr>'+s[j:]
V='<span class="rtg tv">Verified</span> in v13.3.0'; C='<span class="rtg tc">Custom</span> proposal'; D='<span class="rtg td">Decision needed</span>'
# title and lead
rep('<h1>Apps and dock pages</h1>','<h1>Apps, app lifecycle and bookmarks</h1>')
i=s.index('<p class="lead">Two views with one pattern'); j=s.index('</p>',i)+4
s=s[:i]+'<p class="lead">An app plugin is installed with <code>grafana-cli</code> and then goes through our Apps Manager: initialize, review, setup, validation, migration when needed, and enable. The Apps page (S12) shows every installed app with its lifecycle status and the buttons for that status. <b>Bookmarks</b> are separate: pages and sub pages of enabled apps can be bookmarked; an app itself and the tabs inside a page cannot. Steps 2 to 9 are our proposed workflow on top of what Grafana offers; Grafana does not ship it.</p>'+s[j:]
# lifecycle section
STEPS=[('1','Install with Grafana CLI','From the catalog or a direct ZIP URL. The CLI checks safe ZIP extraction and the plugin id and type, and installs declared plugin dependencies. It does not compare a checksum; the plugin signature is checked by Grafana when it loads the plugin.','Server, CLI'),
 ('2','Restart and discover','Grafana loads the plugin and validates its signature under the configured policy. The app shows as Not initialized.','Server, then S12'),
 ('3','Initialize and review','Checks Grafana version and compatibility, plugin loading, signature, dependencies and the manifest. Checks that call the app backend (health, backend self-tests) run after Enable. An administrator accepts the review.','S18'),
 ('4','Setup','Organisation, users and groups, sub page permissions, data sources and connections, app requirements, icon and colour.','S16'),
 ('5','Validate setup','Required fields, permissions, connections, app prerequisites. Problems can be corrected.','S16'),
 ('6','Enable','Available when checks and setup have succeeded. With a pending migration the app opens in maintenance mode: only Org Admins can open it. Right after Enable the first health check runs; its result shows in Manage › Health.','S16, S12'),
 ('7','Migrate, if needed','Only when the app owns database tables and has pending migrations. Starts by itself after Enable (<code>[orbit.apps] auto_migrate</code>, default on, like Grafana’s own start-up migrations); an admin starts it when the setting is off. A failed migration disables the app again; Retry enables it in maintenance mode and runs it again.','S16'),
 ('8','Apps and pages','The app and its authorized, registered pages; page visibility and bookmarks. Hiding a page is not access control.','S12, S11, S19, S20'),
 ('9','Manage','Status and health, setup and permission changes, data sources, pages, update, disable, uninstall. No activity or audit list in v1 (Grafana OSS has no audit log).','S15')]
strip='<div class="lcs">'+''.join(f'<div class="lcc2"><b><i>{n}</i>{t}</b><span>{d}</span><small>{w}</small></div>' for n,t,d,w in STEPS)+'</div>'
NEXT={'notinit':'S18, step 1','initializing':'S18, step 1','review':'S18, step 2','setup':'S16, step 3','setupwip':'S16, step 3','validating':'S16, step 4','migrate':'S16, step 5','migrating':'S16, step 5','ready':'S16, step 6','enabled':'App home; S15','disabled':'S15','failed':'The step that failed','busy':'S15'}
rows=''.join(f'<tr><td>{tile(k)}</td><td><b style="font-weight:500;color:#eceef1">{lab}</b></td><td>{mean}</td><td>{btns}</td><td>{NEXT[k]}</td></tr>' for k,lab,ic,g,mean,btns in STATUS)
life=('<h2>App lifecycle</h2>'+strip
 +'<h2>After an update</h2><p class="lead" style="margin:0 0 10px">Decided 2026-11-17 (owner). The apps module keeps the last accepted version and schema version of each app per organisation (OD23 table). At start-up, and whenever it reads an app, it compares them with the version Grafana loaded, as Grafana itself does for app dashboards (<code>dashboard_updater.go:69-75</code>). A CLI update needs a restart (<code>install_command.go:71</code>); an update from the plugin catalog loads at once (<code>installer.go:103</code>), so the check also runs on read. Grafana overwrites <code>plugin_setting.plugin_version</code> at start-up, so we keep our own copy.</p>'
 +'<table class="mt fx"><colgroup><col style="width:18%"><col style="width:34%"><col style="width:30%"><col style="width:18%"></colgroup><thead><tr><th>Case</th><th>How it is detected</th><th>What happens</th><th>Board</th></tr></thead><tbody>'
 +'<tr><td><b style="font-weight:500;color:#eceef1">A. Same version</b></td><td>Loaded version equals the accepted version</td><td>Nothing. Every step shows Done; no Run migration button</td><td>S15, S16 (edit mode)</td></tr>'
 +'<tr><td><b style="font-weight:500;color:#eceef1">B. Simple update</b></td><td>New version; the manifest adds no permission, data source, page, required setup field or schema version</td><td>The checks of Initialize run by themselves. Passed: the app stays Enabled; the Version block on S15 shows '+updnote('0.0.9 → 0.1.0')+' with the date. Failed: Action required, maintenance mode</td><td>S15</td></tr>'
 +'<tr><td><b style="font-weight:500;color:#eceef1">C. Update that needs you</b></td><td>New permissions, data sources, pages or required setup fields</td><td>Maintenance mode (Org Admins only). The lifecycle opens at the first step that needs action, with “What changed”; settings from the old version are kept</td><td>S21</td></tr>'
 +'<tr><td><b style="font-weight:500;color:#eceef1">D. New schema</b></td><td>The manifest schema version is higher than the stored one</td><td>Maintenance mode; the migration starts by itself (or with Run migration when <code>[orbit.apps] auto_migrate</code> is off), as in OD28</td><td>S21, S16</td></tr>'
 +'<tr><td><b style="font-weight:500;color:#eceef1">Downgrade</b></td><td>The stored schema version is higher than the app knows</td><td>Action required with a clear message; maintenance mode. A migration cannot go backwards</td><td>S12 card</td></tr>'
 +'</tbody></table>'
 +'<div class="rf-note"><b>Run migration button.</b> Shown only when a migration is pending and <code>[orbit.apps] auto_migrate</code> is off, or as Retry after a failed migration. Never for an app whose migration has passed and whose version has not changed. <b>Setup of an enabled app</b> (Open setup on S15) opens S16 in edit mode: Setup and Validate can be changed; Initialize, Review, Enable and Migrate are closed and show Done with the version and date. Rollback of the package and of the database is not designed yet.</div>'
 +'<h2>Lifecycle statuses and card buttons</h2><p class="lead" style="margin:0 0 10px">Statuses of our Apps Manager, not Grafana states. Buttons show only for users allowed to take the action.</p>'
 +'<table class="mt fx"><colgroup><col style="width:6%"><col style="width:17%"><col style="width:33%"><col style="width:28%"><col style="width:16%"></colgroup><thead><tr><th>Icon</th><th>Status</th><th>Meaning</th><th>App card buttons</th><th>Opens</th></tr></thead><tbody>'+rows+'</tbody></table>'
 +'<div class="rf-note"><b>Gates.</b> Review → Setup is available only after the review is accepted. Enable is available only after required validation succeeds; a pending migration then runs in maintenance mode (OD28). Manage is on the Enabled card; on a Disabled card it lets an authorized administrator recover or change setup. An error names the operation that failed. A hidden button never replaces authorization on the server. <b>Still to finalize:</b> exact labels, recovery actions, and whether every transitional state gets its own card status.</div>')
SW=lambda c:f'<span style="display:inline-block;width:14px;height:14px;border-radius:4px;background:{c};vertical-align:-2px;margin-right:8px"></span>'
NB=lambda l,dis=False:f'<button type="button" class="p gh2" style="{SM}"{" disabled" if dis else ""}>{l}</button>'
arow=lambda name,key,btns,when:f'<tr><td><b style="font-weight:500;color:#eceef1">{name}</b></td><td>{SW(ACT[key][0])}<code>{ACT[key][0]}</code></td><td><div style="display:flex;gap:8px;flex-wrap:wrap">{btns}</div></td><td>{when}</td></tr>'
life+=('<h2>Lifecycle action buttons</h2><p class="lead" style="margin:0 0 10px">Same shape as Open and Manage: outline, 30 high on a card, radius 6, label 14/22 500. Each type of lifecycle action has its own colour, so the next step can be told apart across the card grid. The label always names the action; colour is never the only signal.</p>'
 +'<table class="mt fx"><colgroup><col style="width:16%"><col style="width:14%"><col style="width:40%"><col style="width:30%"></colgroup><thead><tr><th>Action type</th><th>Colour</th><th>Buttons</th><th>Shown for</th></tr></thead><tbody>'
 +arow('Initialize','init',abtn('init','Initialize'),'Not initialized')
 +arow('Review','review',abtn('review','Review')+abtn('review','Accept and continue to setup'),'Review required; the Review step')
 +arow('Setup','setup',abtn('setup','Setup')+abtn('setup','Continue setup')+abtn('setup','Save and validate')+abtn('setup','Open setup'),'Setup required, Setup in progress; the Setup step; Manage')
 +arow('Migrate','migrate',abtn('migrate','Run migration')+abtn('migrate','Run migration',disabled=True),'Migration required. Second button: disabled until validation has passed')
 +arow('Enable','enable',abtn('enable','Enable')+abtn('enable','Enable',disabled=True),'Ready to enable, Disabled. Second button: disabled until the gates are met')
 +arow('Recover','fail',abtn('fail','View details')+abtn('fail','Retry'),'Action required / Failed')
 +f'<tr><td><b style="font-weight:500;color:#eceef1">Use and view</b></td><td>{SW("#e2e4e8")}Neutral</td><td><div style="display:flex;gap:8px;flex-wrap:wrap">{NB("Open")}{NB("Manage")}{NB("View progress")}</div></td><td>Enabled, Disabled (Manage); every state that is running (View progress). Not lifecycle steps, so no colour</td></tr>'
 +'</tbody></table>'
 +'<div class="rf-note"><b>Style.</b> Text and border in the action colour (border at 45%), fill at 10%; hover and keyboard focus raise the fill to 20% and the border to 100%. Disabled: no fill, border 25%, text 70%. All six colours pass 4.5:1 as text on the card surface. Destructive actions (Uninstall) keep Grafana’s destructive style and are not part of this set.</div>')
rep('<h2>Cards</h2>',life+'<h2>Cards</h2>')
# card specimens from S12
cards=re.findall(r'<article class="ac(?: on)?">.*?</article>',s12,flags=re.S); assert len(cards)==5; cards=cards[1:]
labels=['Enabled, selected','Review required','Setup in progress','Not initialized']
i=s.index('<h2>Cards</h2>'); j=s.index('<h2>Filter and preview</h2>')
spec='<h2>Cards</h2><div class="rf-stage " style="padding:20px;align-items:flex-start"><div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;width:100%">'+''.join(f'<div><p class="rf-lab">{l}</p>{c}</div>' for l,c in zip(labels,cards))+'</div></div>'
s=s[:i]+spec+s[j:]
rep('>All 4</button>','>All 5</button>'); rep('>Added 1</button>','>Enabled 2</button>'); rep('>Available 3</button>','>Needs action 3</button>')
# remove the old "Preview, Add app" specimen
i=s.index('<div class="rf-cell" style="width:380px;"><p class="rf-lab">Preview, Add app'); j=s.index('<div class="rf-cell" style="width:380px;"><p class="rf-lab">Preview, bookmark a page')
s=s[:i]+s[j:]
# anatomy
rep('All / Added / Available (apps)','All / Enabled / Needs action (apps)'); rep('apps that need setup are disabled','apps that are not enabled are disabled')
rep('status toggle at the top right. Then description.','the app status icon at the top right (on a page card: the bookmark toggle). Then description.')
rep('actions, only when the card has one (Manage, Setup), go below it','the action row goes below it: the buttons for the app’s status (table above), and “Step n of 6” at the right until the app is enabled. Every button has the outline shape of Open and Manage; a lifecycle action takes the colour of its action type (Lifecycle action buttons, above), Open and Manage stay neutral')
i,j=row('Status toggle'); r=s[i:j]
r=r.replace('<td>Status toggle</td>','<td>Bookmark toggle (page cards)</td>').replace('One button replaces the status badge and the Bookmark / Remove bookmark or Add button, and acts at once. Pages: bookmarked','One button, acts at once. Bookmarked').replace(' Apps: added = check, green, label “Remove from apps”; available = plus, neutral, label “Add app”.',' App cards do not use it: an app has a status icon, not a toggle (owner, 2026-11-15).')
assert 'Remove from apps' not in r; s=s[:i]+r+s[j:]
setrow('Status badge',['App status icon','28×28, radius 6, icon 16, centred; top right of the card header; not a button','One icon per lifecycle status in seven colour groups: neutral, in progress (blue), needs attention (amber), setup (violet, the same colour as the Setup button), ready (cyan), enabled (green), failed (pink). <code>role="img"</code>, <code>aria-label="Status: …"</code> and a tooltip with the meaning. The status name is also written in the meta row, so a state is never shown by icon or colour alone. Owner, 2026-11-15'])
addafter('App status icon',['Status chip','height 22, padding 2 8, radius 4, icon 14 and label 12/18 500, text centred; same box as the “New” label (padding 2 6). All badges on the app boards use it: status chip, New, update chip, step pills','Header of the lifecycle view and of Manage, and the preview panel on S12'])
i,j=row('Configuration check'); r=s[i:j].replace('<td>Configuration check</td>','<td>Checks list</td>').replace('Results: Passed','Used for the initialization results (S18), setup validation (S16) and Health in Manage (S15). A result covers only the checks that ran. Results: Passed').replace('Not run (dashed ring)','Not run or Not available (dashed ring; never counted as passed)')
s=s[:i]+r+s[j:]
setrow('Add-app flow',['App lifecycle view (S18, S16)','One page per app. Vertical step list in Grafana’s wizard stepper pattern (as <code>public/app/features/provisioning/Wizard/Stepper.tsx</code>): step number 28px; done = check in success green, current = number on primary blue, later = grey number with a lock pill. Right panel 360','Six steps: Initialize, Review, Setup, Validate setup, Enable, Migrate. A first row states that the app was installed with the CLI and discovered after a restart, and that this alone does not prove it works. Review lists every check with its result and “Accept and continue to setup”. Setup has six sections (Organisation; Users, groups and permissions; Sub page permissions; Data sources and connections; App requirements; Icon and colour), each with a Done or problem pill, then Save and Save and validate. Enable and Migrate stay disabled until the step before them has passed. @grafana/ui has no stepper component. The “New” label in the switchers is on one app only: the app enabled most recently'])
i,j=row('Version \\(S15, right panel\\)'.replace('\\','')); r=s[i:j].replace('Update chip on the S12 card stays','After an update the apps module classifies the change (section “After an update”); only an update that needs approval, setup or a migration opens the lifecycle again. Update chip on the S12 card stays')
s=s[:i]+r+s[j:]
setrow('Meta',['Meta','12/18, #8d939c','Page count; the status name in its group colour, weight 500; update chip; In dock and In the menu icons at the right end (enabled apps)'])
i,j=row('Preview panel \\(AppsView\\)'.replace('\\','')); 
s=s[:i]+'<tr><td>Preview panel (AppsView)</td><td>360 wide, read only</td><td>Selected app only: identity, description, status chip, a six-segment lifecycle strip with “Step n of 6” and one line on what is waiting, details grid (App ID, Version, Publisher, Requires Grafana, Status, Next step, Backend, Signature, Base route) and the tree of its registered pages. No switches and no buttons: actions are on the card; where an app appears is set in Manage (S15)</td></tr>'+s[j:]
setrow('Help card',['Help card','317×235, dashed border','“Not in the list?”: install the app plugin with <code>grafana-cli plugins install &lt;app-id&gt;</code>, restart Grafana, and the app appears as Not initialized; a link to the manifest draft'])
addafter('Help card',['Manage view (S15)','Grafana TabsBar; right panel 360','Tabs: Overview (Status and health tiles, Where it appears, Icon and colour), Pages, Access, Data sources, Health. Right panel: About, Version and Who can act (information only). No Activity tab in v1: Grafana OSS has no audit log; a global audit feature comes later (OD30)'])
# rules
setrow('Which apps are listed',['Which apps are listed','Every app plugin Grafana has discovered, in any lifecycle status',C,'After a CLI install the app is listed only once Grafana has restarted and loaded it. The lifecycle status is ours; where it is stored is open (OD23)'])
setrow('Needs setup',['Gates','Review → Setup only after acceptance. Enable only after required validation succeeds; a pending migration then runs in maintenance mode (OD28)',C,'Must be enforced on the server. A hidden or disabled button is not the control'])
addafter('Gates',['Who sees a button','Only users allowed to take the action',C,'Grafana has plugin permissions for install and for writing plugin settings (<code>plugins:install</code>, <code>plugins:write</code>); a mapping to each lifecycle action is still to define'])
addafter('Who sees a button',['Install',' <code>grafana-cli</code> only; the UI does not install or update',V,'The CLI downloads with an empty expected checksum, for a catalog install and for <code>--pluginUrl</code> (<code>install_command.go:148,169</code>, <code>repo/service.go:66</code>), extracts with path checks (<code>storage/fs.go</code>) and installs dependencies (<code>install_command.go:180</code>)'])
addafter('Install',['App health after Enable','Grafana default: health is checked only for an enabled app, so it runs right after Enable and in Manage › Health',D,'<span class="rtg tv">Verified</span>: <code>GET /api/plugins/&lt;id&gt;/health</code> and the app resource routes answer only when the app is enabled in Grafana’s plugin settings (<code>checkAppEnabled</code>, <code>api.go:437-439</code>). Our Enabled status is Grafana’s <code>enabled</code> flag. Decided 2026-11-16 (OD23 closed)'])
addafter('App health after Enable',['Visibility is not access','Hiding a page or an app changes menus only',C,'Who can open a page is decided by permissions (setup, “Sub page permissions”), not by Show in menu or Show in dock'])
rep('A failed app is not listed in Apps (Needs setup); a failed page is hidden from the dock and the menu. Used on S15 and S16.','A failed app shows as Action required in Apps and the row names the operation that failed; a failed page is hidden from the dock and the menu.')
rep('The Add app menu with From a repository, From a link and Apps is removed (owner, 2026-11-15)','There is no Add app menu: apps are installed with the CLI (owner, 2026-11-15)')
rep(' The app variant is a proposal that follows the pages decision.','')
# css + height
k=s.index('.rf-note{'); s=s[:k]+CSS+'.lcs{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:8px;margin:0 0 4px}.lcc2{display:flex;flex-direction:column;gap:6px;padding:12px;border-radius:6px;background:#181b1f;border:1px solid rgba(204,204,220,.12);min-width:0}.lcc2 b{font:500 13px/18px Inter,Helvetica,Arial,sans-serif;color:#fff}.lcc2 b i{font-style:normal;color:#58cfec;margin-right:6px}.lcc2 span{font:400 12px/18px Inter,Helvetica,Arial,sans-serif;color:#aeb4bd}.lcc2 small{margin-top:auto;font:500 12px/18px Inter,Helvetica,Arial,sans-serif;color:#8d939c}.ach>.lst{margin-left:auto}.acf a.p{display:inline-flex;align-items:center}.mt td .lst{display:inline-grid}'+s[k:]
rep('min-height:5060px','min-height:7780px'); rep('"height":5060','"height":7780')
open(G+'project/RefApps.dc.html','w').write(s)
print('stale:',re.findall(r'Add app|Needs setup|Added 1|Available 3|Remove from apps|Initialized<|From a link|\.zip',re.sub(r'<style>.*?</style>','',s,flags=re.S))[:12])
