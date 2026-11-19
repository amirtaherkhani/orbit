import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
"""Builds the two lifecycle boards from the S16 shell (pre_lifecycle/AppSetup.dc.html):
  project/AddAppFlow.dc.html  S18  AppLifecycleView at step 2 (Review), app Maintenance
  project/AppSetup.dc.html    S16  AppLifecycleView at step 3 (Setup), app Energy
  project/AppUpdate.dc.html   S21  AppLifecycleView after an update that needs the admin (case C and D), app Maintenance
Steps in the UI: 1 Initialize, 2 Review, 3 Setup, 4 Validate, 5 Enable, 6 Migrate (OD28, 2026-11-17).
CLI install and restart (lifecycle steps 1-2 of the owner's doc) happen before this page."""
import re,sys
sys.path.insert(0,ROOT+'tools')
from lifecycle_kit import *
G=ROOT+''
shell=open(G+'pre_lifecycle/AppSetup.dc.html').read()
s12=open(G+'project/AppsAdd.dc.html').read()
OK='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>'
FAIL='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="M6 6l12 12"></path></svg>'
WARN='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 7v6"></path><path d="M12 17h.01"></path></svg>'
DONE='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>'
CARET='<svg class="i gf" viewBox="0 0 24 24" style="width:16px;height:16px" aria-hidden="true"><path d="M17,9.17a1,1,0,0,0-1.41,0L12,12.71,8.46,9.17a1,1,0,0,0-1.41,0,1,1,0,0,0,0,1.42l4.24,4.24a1,1,0,0,0,1.42,0L17,10.59A1,1,0,0,0,17,9.17Z"></path></svg>'
LOCK='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>'
def ci(kind):
    lab={'ok':'Passed','warn':'Warning','fail':'Failed','idle':'Not run'}[kind]
    svg={'ok':OK,'warn':WARN,'fail':FAIL,'idle':''}[kind]
    return f'<span class="ci {kind}" role="img" aria-label="{lab}">{svg}</span>'
def ck(kind,title,text,small='',action=''):
    return (f'<li class="ck {kind}">{ci(kind)}<div class="ckb"><b>{title}</b><span>{text}</span>'+(f'<small>{small}</small>' if small else '')+'</div>'
            +(f'<div class="cka">{action}</div>' if action else '')+'</li>')
def cs(kind,text): return f'<span class="cs {kind}">{ci(kind)}{text}</span>'
def step(n,state,title,pill,body):
    num={'done':DONE,'lock':str(n),'cur':str(n),'fail':str(n)}[state]
    return f'<li class="sp {state}"><span class="spn" aria-hidden="true">{num}</span><div class="spb"><div class="sph"><h3>{title}</h3>{pill}</div>{body}</div></li>'
def pill(cls,t): return f'<span class="pill {cls}">{t}</span>'
def sec(title,pl,body,sid): return f'<div class="cfg" role="group" aria-labelledby="{sid}"><div class="sph"><h3 id="{sid}" style="font-size:14px">{title}</h3>{pl}</div>{body}</div>'
def sub(t): return f'<p class="mu sub">{t}</p>'
LOCKED=lambda t: pill('sw2',LOCK+'<span style="margin-left:6px">'+t+'</span>')
CSSX=(CSS+'.sp.cur .spn{background:#3d71d9;color:#fff;box-shadow:none}.sp.lock .spn{background:#23262c;color:#8d939c;box-shadow:inset 0 0 0 1px rgba(204,204,220,.2)}.sp.lock .sph h3{color:#aeb4bd}'
 '.ckc .cs{padding:0}.pill.sp2{background:#17233b;color:#6e9fff}.cfg .mt2 td,.cfg .mt2 th{padding:6px 8px}.cfg .fi{max-width:420px}.frr{display:flex;gap:8px;align-items:center;flex-wrap:wrap}'
 '.fer{color:#ff5286;font:400 12px/18px Inter,Helvetica,Arial,sans-serif}.fi.bad{border-color:#ff5286}.swr{display:flex;gap:8px;flex-wrap:wrap}'
 '.swb{width:28px;height:28px;border-radius:6px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18);flex:none}.swb.on{outline:2px solid #fff;outline-offset:2px}'
 '.sdl{list-style:none;margin:8px 0 0;padding:0;display:flex;flex-direction:column;gap:8px}.sdl li{display:flex;align-items:center;gap:8px;font:400 14px/22px Inter,Helvetica,Arial,sans-serif;color:#c9cdd3}'
 '.pre{display:flex;align-items:center;gap:10px;padding:10px 12px;margin-top:8px;border-radius:6px;background:#14161a;border:1px solid rgba(204,204,220,.12);font:400 12px/18px Inter,Helvetica,Arial,sans-serif;color:#aeb4bd}.pre b{color:#eceef1;font-weight:500}')

def build(out,app,appid,ver,tile_html,crumb,status,stepno,stepname,steps_html,aside_html,height,title,pre=None,acts=None,hm_extra=''):
    s=shell
    a=s.index('<div class="bcr">'); b=s.index('</main>')
    head=(f'<div class="bcr"><nav aria-label="Breadcrumb" class="cb"><button type="button" class="ap">{APICON}Monitoring</button><a href="AppsAdd.dc.html" style="text-decoration:none"><button type="button">Apps</button></a><button type="button">{app}</button><button type="button" aria-current="page">{crumb}</button></nav></div>'
      f'<section style="grid-column:span 12;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap"><div style="display:flex;gap:14px;align-items:center;min-width:0">{tile_html}<div style="min-width:0"><h2 style="margin:0;font:400 28px/32px \'Inter\',\'Helvetica\',\'Arial\',sans-serif;color:#eceef1">{app}</h2>'
      f'<p class="hm">{appid} · v{ver} · {chip(status)}{hm_extra} · Step {stepno} of 6: {stepname}</p></div></div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">{acts or PLUGBTN}</div></section>'
      '<div style="grid-column:span 12;display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:14px;align-items:start">'
      '<section class="mg" aria-labelledby="su-steps" style="min-width:0"><h3 id="su-steps">App lifecycle</h3><p class="mu sub">Six steps, in order. A step opens when the one before it has passed. You see the actions you are allowed to take.</p>'+
      (pre or f'<div class="pre">{ci("ok")}<span><b>Installed with grafana-cli and discovered after a restart.</b> A successful CLI install does not prove the app loads or works; the steps below check that.</span></div>')+
      f'<ol class="spl" style="margin-top:8px">{steps_html}</ol></section>{aside_html}</div>')
    s=s[:a]+head+s[b:]
    s=s.replace('min-height:1800px',f'min-height:{height}px').replace('min-height:1772px',f'min-height:{height-28}px').replace('"height":1800',f'"height":{height}')
    k=s.index('.spl{'); s=s[:k]+CSSX+s[k:]
    s=re.sub(r'<title>[^<]*</title>',f'<title>{title}</title>',s,count=1)
    assert 'renderVals() { return {}; }' in s or 'renderVals()' in s
    open(G+'project/'+out,'w').write(s)

m=re.search(r'<button type="button" class="ap">(<svg.*?</svg>)Monitoring</button>',shell,flags=re.S); APICON=m.group(1)
m=re.search(r'<button type="button" class="p gh2" style="gap:6px">(<svg.*?</svg>)Plugin settings</button>',shell,flags=re.S); PLUGBTN=m.group(0)
m=re.search(r'<section style="[^"]*"><div style="display:flex;gap:14px;align-items:center;min-width:0">(<span class="tl".*?</span>)<div style="min-width:0">',shell,flags=re.S); ENERGY_TILE=m.group(1)
# Quality tile: from its S12 card, sized like the Energy tile
m=re.search(r'<span class="tl" style="([^"]*)">(<svg(?:(?!</span>).)*?</svg>)</span><div class="act"><b>Quality</b>',s12,flags=re.S)
mcol=dict(x.split(':',1) for x in m.group(1).split(';') if ':' in x)
est=re.search(r'style="([^"]*)"',ENERGY_TILE).group(1)
est2=re.sub(r'background:[^;]*',f"background:{mcol['background']}",est); est2=re.sub(r'(?<![-\w])color:[^;]*',f"color:{mcol['color']}",est2)
esvg=re.search(r'<svg[^>]*>',ENERGY_TILE).group(0); msvg=re.sub(r'<svg[^>]*>',esvg,m.group(2),count=1)
MAINT_TILE=f'<span class="tl" style="{est2}">{msvg}</span>'
BACK='<div style="display:flex;flex-direction:column;gap:8px;margin-top:auto"><a class="p gh2" href="AppsAdd.dc.html" style="justify-content:center;text-decoration:none">Back to apps</a></div>'
BS='flex:none'
# ---------- S18: Maintenance, step 2 Review ----------
checks=(ck('ok','Grafana version and compatibility','The app needs &gt;=13.0.0 &lt;14. This Grafana is 13.3.0.','grafanaDependency')
 +ck('ok','Orbit API version','The app needs Orbit &gt;=1.0.0 &lt;2. This server runs Orbit 1.0.0.','requires.orbit')
 +ck('ok','Plugin loaded','Grafana discovered and loaded acme-quality-app v1.0.1 after the restart.','GET /api/plugins/acme-quality-app/settings')
 +ck('ok','Signature','[SIGNATURE STATUS]. Grafana\'s loader checked it under this server\'s signature policy.')
 +ck('ok','Dependencies','No plugin dependencies are declared in plugin.json.')
 +ck('idle','App health','Runs after Enable. Grafana answers the health check only for an enabled app; this app has no backend, so nothing will run.')
 +ck('ok','Self-test: manifest and routes','The ui block is valid. 4 pages are registered.')
 +ck('warn','Self-test: sample query','Skipped with a warning: no data source is connected yet. It runs again in Validate.'))
review=(sub('Read what initialization checked. Accepting opens Setup. The result covers only the checks that ran.')
 +'<div class="ckh"><div class="ckc">'+cs('ok','6 passed')+cs('warn','1 warning')+cs('idle','1 not available')+'</div><div class="ckm"><span class="mu">Finished 09:12</span><button type="button" class="p gh2 sm">Run again</button></div></div>'
 +f'<ul class="ckl">{checks}</ul>'
 +'<div class="bhv"><b>What this result means</b><ul><li>Required checks: Grafana version, Orbit API version, plugin loaded, signature and dependencies. All required checks passed. App health is checked after Enable, because Grafana answers it only for an enabled app.</li><li>A warning does not block the review. Setup or Validate picks it up.</li><li>Not available: the check could not run for this app. It is not counted as passed.</li><li>Who accepted the review and when is recorded.</li></ul></div>'
 +'<div class="sact">'+abtn('review','Accept and continue to setup',small=False)+'<span class="mu">Needs an organisation admin. You are one.</span></div>')
steps=(step(1,'done','Initialize',pill('sd','Done'),sub('7 checks ran. Started by Admin at 09:11, finished 09:12.'))
 +step(2,'cur','Review',pill('st2','Review required'),review)
 +step(3,'lock','Setup',LOCKED('After review'),sub('Organisation, users and groups, sub page permissions, data sources, app requirements, icon and colour.'))
 +step(4,'lock','Validate setup',LOCKED('After setup'),sub('Checks required fields, permissions, connections and app prerequisites.'))
 +step(5,'lock','Enable',LOCKED('After validation'),sub('Makes the app available to authorized users. With a pending migration the app opens in maintenance mode: only Org Admins can open it until the migration passes.'))
 +step(6,'lock','Migrate',LOCKED('If needed'),sub('Only when the app owns database tables and has pending migrations. Runs after Enable, in maintenance mode. Skipped otherwise.')))
aside=('<aside class="pv" aria-label="About the Quality review"><div><h4>Status</h4><div style="margin-top:8px">'+chip('review')+'</div><p class="ptx">Initialization passed its required checks. The results wait for an administrator to accept them.</p></div>'
 '<div><h4>Not covered</h4><p class="ptx" style="font-size:12px;line-height:18px">No checksum is compared. Grafana checks the plugin signature when it loads the plugin; in production keep <code>allow_loading_unsigned_plugins</code> empty so an unsigned app does not load. App health runs after Enable. A passed review covers only the checks listed as run.</p></div>'
 '<div><h4>About</h4><dl class="dl2"><dt>Plugin id</dt><dd><code>acme-quality-app</code></dd><dt>Version</dt><dd>1.0.1</dd><dt>Discovered</dt><dd>Today 08:40</dd><dt>Backend</dt><dd>No</dd><dt>Pages</dt><dd>4 pages</dd></dl></div>'
 '<div><h4>Next</h4><p class="ptx" style="font-size:12px;line-height:18px">After you accept: Setup, then Validate, Enable, and Migrate if needed.</p></div>'+BACK+'</aside>')
build('AddAppFlow.dc.html','Quality','acme-quality-app','1.0.1',MAINT_TILE,'Review','review',2,'Review',steps,aside,1820,'S18 · App lifecycle: review')
# ---------- S16: Energy, step 3 Setup ----------
def tbl(head,rows): return '<div class="tw"><table class="mt2"><thead><tr>'+''.join(f'<th>{h}</th>' for h in head)+'</tr></thead><tbody>'+''.join('<tr>'+''.join(f'<td>{c}</td>' for c in r)+'</tr>' for r in rows)+'</tbody></table></div>'
def selbtn(i,label,val,ph=False,bad=False):
    v=f'<span class="ph">{val}</span>' if ph else f'<span>{val}</span>'
    return f'<button type="button" id="{i}" class="fi sel{" bad" if bad else ""}" aria-haspopup="listbox" aria-expanded="false" aria-label="{label}"{" aria-invalid=\"true\"" if bad else ""}>{v}{CARET}</button>'
def minisel(label,val): return f'<button type="button" class="fi sel" aria-haspopup="listbox" aria-expanded="false" aria-label="{label}" style="min-height:30px;max-width:190px"><span>{val}</span>{CARET}</button>'
sw=['#58cfec','#e0b46a','#5794f2','#b877d9','#f2cc0c','#73bf69','#ff9830']
setup=(sub('Configure the app for this organisation. Save at any time; validation runs when you choose it.')
 +sec('Organisation',pill('sd','Done'),'<div class="fr"><label for="su-org">Applies to</label><input id="su-org" class="fi" type="text" value="Main Org." readonly></div><p class="cfgl">Each organisation is set up on its own.</p>','sc-org')
 +sec('Users, groups and permissions',pill('sd','Done'),tbl(['Who','Kind','Access to the app'],[['Viewer','Role',minisel('Access for Viewer','View')],['Editor','Role',minisel('Access for Editor','View')],['Energy leads','Team',minisel('Access for Energy leads','Edit')],['Admin','Role',minisel('Access for Admin','Admin')]])+'<div class="frr"><button type="button" class="p gh2 sm">Add a team or user</button></div>','sc-acc')
 +sec('Sub page permissions',pill('sd','Done'),tbl(['Page','Path','Who can open it'],[['Usage by site','<code>/usage</code>',minisel('Who can open Usage by site','Viewer and above')],['· By machine','<code>/usage/machines</code>',minisel('Who can open By machine','Viewer and above')],['Shift usage','<code>/shifts</code>',minisel('Who can open Shift usage','Editor and above')],['· Top users','<code>/shifts/top</code>',minisel('Who can open Top users','Energy leads')]])+'<p class="cfgl">Hiding a page in the menu is not access control. These permissions decide who can open a page.</p>','sc-sub')
 +sec('Data sources and connections',pill('sf','1 problem'),'<div class="fr"><label for="su-ds">Meter data source (required)</label>'+selbtn('su-ds','Meter data source','Choose a data source',ph=True,bad=True)+'<span class="fer" role="alert">Choose a data source. The app cannot read meter data without one.</span></div><div class="frr"><button type="button" class="p gh2 sm" disabled>Test connection</button><span class="mu" style="font-size:12px">Available once a data source is chosen.</span></div>','sc-ds')
 +sec('App requirements',pill('sd','Done'),'<p class="cfgl">Fields the app defines.</p><div class="fr"><label for="su-sites">Sites</label><input id="su-sites" class="fi" type="text" value="[SITE NAMES]"></div>','sc-app')
 +sec('Icon and colour',pill('sd','Done'),'<div class="frr">'+ENERGY_TILE.replace('width:48px','width:40px').replace('height:48px','height:40px')+'<button type="button" class="p gh2 sm">Change icon</button></div><div class="fr"><span class="cfgl" id="su-col" style="color:#c9cdd3;font-weight:500">Colour</span><div class="swr" role="radiogroup" aria-labelledby="su-col">'+''.join(f'<button type="button" role="radio" aria-checked="{"true" if c=="#f2cc0c" else "false"}" aria-label="Colour {c}" class="swb{" on" if c=="#f2cc0c" else ""}" style="background:{c}"></button>' for c in sw)+'</div></div><p class="cfgl">Used for the app tile, the selected bar, the bookmarks group and the breadcrumb chip.</p>','sc-look')
 +'<div class="sact"><button type="button" class="p gh2">Save</button>'+abtn('setup','Save and validate',small=False)+'<span class="mu">5 of 6 sections are complete.</span></div>')
validate=sub('Runs when you choose Save and validate. Problems link back to the section to fix.')+'<ul class="ckl">'+ck('idle','Required fields','Not run yet.')+ck('idle','Permissions','Not run yet.')+ck('idle','Connections','Not run yet.')+ck('idle','App prerequisites','Not run yet.')+'</ul>'
migrate=(sub('Energy owns database tables and reports 1 pending migration. It starts by itself right after Enable, as Grafana runs its own migrations at start-up. With <code>[orbit.apps] auto_migrate = false</code> an admin starts it here. Its result is shown here.')
 +'<div class="bhv"><b>Scope</b><ul><li>Only tables the app owns. Skipped when no migration is pending.</li><li>Migration of an external database is the app\'s or our tooling\'s job. Grafana does not guarantee it.</li><li>If the migration fails, the app is disabled again. Retry enables it in maintenance mode and runs the migration again.</li><li>Rollback of the package and of the database is not designed yet.</li></ul></div>'
 +'<p class="mu" style="margin:10px 0 0">No button here: the migration starts by itself after Enable. <b>Run migration</b> shows only when <code>[orbit.apps] auto_migrate</code> is off, or as Retry after a failed migration.</p>')
enable=sub('Available when the required checks and setup have succeeded. Energy has 1 pending migration, so Enable puts the app in maintenance mode: only Org Admins can open it until the migration passes.')+'<div class="sact">'+abtn('enable','Enable and migrate',small=False,disabled=True)+'</div>'
steps=(step(1,'done','Initialize',pill('sd','Done'),sub('7 checks ran: 6 passed, 1 warning. Finished 08:58.'))
 +step(2,'done','Review',pill('sd','Accepted'),sub('Accepted by Admin at 09:02.'))
 +step(3,'cur','Setup',pill('sp2','In progress'),setup)
 +step(4,'lock','Validate setup',LOCKED('After setup'),validate)
 +step(5,'lock','Enable',LOCKED('After validation'),enable)
 +step(6,'lock','Migrate',LOCKED('1 pending'),migrate))
def sd(kind,t): return f'<li>{ci(kind)}<span>{t}</span></li>'
aside=('<aside class="pv" aria-label="About the Energy setup"><div><h4>Status</h4><div style="margin-top:8px">'+chip('setupwip')+'</div><p class="ptx">Setup has started. One section still needs input before validation can pass.</p></div>'
 '<div><h4>Setup sections</h4><ul class="sdl">'+sd('ok','Organisation')+sd('ok','Users, groups and permissions')+sd('ok','Sub page permissions')+sd('fail','Data sources and connections')+sd('ok','App requirements')+sd('ok','Icon and colour')+'</ul></div>'
 '<div><h4>To fix</h4><div class="err"><b>Meter data source is not set</b><span>Data sources and connections. Choose a data source, then test the connection.</span></div></div>'
 '<div><h4>About</h4><dl class="dl2"><dt>Plugin id</dt><dd><code>acme-energy-app</code></dd><dt>Version</dt><dd>0.2.0</dd><dt>Discovered</dt><dd>Today 08:52</dd><dt>Pages</dt><dd>2 pages, 2 sub pages</dd></dl></div>'+BACK+'</aside>')
build('AppSetup.dc.html','Energy','acme-energy-app','0.2.0',ENERGY_TILE,'Setup','setupwip',3,'Setup',steps,aside,2940,'S16 · App lifecycle: setup')

# ---------- S21: Maintenance after an update to v0.4.0 (cases C and D, owner 2026-11-17) ----------
m=re.search(r'<span class="tl" style="([^"]*)">(<svg(?:(?!</span>).)*?</svg>)</span><div class="act"><b>Maintenance</b>',s12,flags=re.S)
mc=dict(x.split(':',1) for x in m.group(1).split(';') if ':' in x)
t2=re.sub(r'background:[^;]*',f"background:{mc['background']}",est); t2=re.sub(r'(?<![-\w])color:[^;]*',f"color:{mc['color']}",t2)
MNT_TILE=f'<span class="tl" style="{t2}">'+re.sub(r'<svg[^>]*>',esvg,m.group(2),count=1)+'</span>'
UNI='<button type="button" class="p gh2 dng">Uninstall</button>'; DIS='<button type="button" class="p gh2 dng">Disable</button>'
acts21=UNI+DIS+PLUGBTN+'<button type="button" class="p w">Open app</button>'
pre21=(f'<div class="pre">{ci("warn")}<span><b>Updated from v0.3.2 to v0.4.0 with grafana-cli, detected after the restart (today 07:04).</b> '
       'The update adds a page, a data source and a database change, so it needs you. Until it is accepted, set up and migrated, the app is in maintenance mode: only Org Admins can open it.</span></div>')
chg=tbl(['Change in v0.4.0','Kind','Where you handle it'],[
 ['Page <b>Work orders › Calendar</b> <code>/orders/calendar</code>','New sub page','Setup: who can open it'],
 ['Data source <b>Spare parts</b> (PostgreSQL)','New required data source','Setup: choose and test it'],
 ['Database schema 3 → 4','Migration','Migrate: starts by itself when Validate passes'],
 ['Grafana range <code>&gt;=13.0.0 &lt;14</code>','Unchanged','No action']])
checks21=(ck('ok','Grafana version and compatibility','The app needs &gt;=13.0.0 &lt;14. This Grafana is 13.3.0.','grafanaDependency')
 +ck('ok','Orbit API version','The app needs Orbit &gt;=1.0.0 &lt;2. This server runs Orbit 1.0.0.','requires.orbit')
 +ck('ok','Plugin loaded','Grafana loaded acme-maintenance-app v0.4.0 after the restart.')
 +ck('ok','Signature','[SIGNATURE STATUS]. Grafana\'s loader checked it under this server\'s signature policy.')
 +ck('ok','Dependencies','No plugin dependencies are declared in plugin.json.')
 +ck('ok','Manifest','Valid. 2 pages and 6 sub pages are registered (1 new).'))
review21=(sub('Read what changed and what the checks found. Accepting opens Setup with only the new items; your v0.3.2 settings are kept.')
 +'<div class="cfg" role="group" aria-labelledby="up-chg"><div class="sph"><h3 id="up-chg" style="font-size:14px">What changed in v0.4.0</h3>'+pill('st2','3 changes need you')+'</div>'+chg+'</div>'
 +'<div class="ckh" style="margin-top:12px"><div class="ckc">'+cs('ok','6 passed')+'</div><div class="ckm"><span class="mu">Rechecked 07:05</span><button type="button" class="p gh2 sm">Run again</button></div></div>'
 +f'<ul class="ckl">{checks21}</ul>'
 +'<div class="sact">'+abtn('review','Accept update and continue to setup',small=False)+'<span class="mu">Needs an organisation admin. You are one.</span></div>')
steps21=(step(1,'done','Initialize',pill('sd','Rechecked'),sub('Ran again for v0.4.0 after the restart: 6 passed. Finished 07:05.'))
 +step(2,'cur','Review',pill('st2','Review required'),review21)
 +step(3,'lock','Setup',LOCKED('After review'),sub('Only the new items: who can open Calendar, and the Spare parts data source. Everything else is kept from v0.3.2.'))
 +step(4,'lock','Validate setup',LOCKED('After setup'),sub('Checks the new items and the settings they touch.'))
 +step(5,'done','Enable',pill('sd','Enabled · maintenance'),sub('The app stays enabled in Grafana. While this update is open it is in maintenance mode: only Org Admins can open it, and it is hidden from other users in the menu and dock.'))
 +step(6,'lock','Migrate',LOCKED('Schema 3 → 4'),sub('Starts by itself when Validate passes, because the app is already enabled (<code>[orbit.apps] auto_migrate</code>, default on). When it passes, maintenance mode ends. If it fails, the app is disabled; Retry enables it in maintenance mode and runs it again.')))
aside21=('<aside class="pv" aria-label="About the Maintenance update"><div><h4>Status</h4><div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">'+chip('review')+updnote('v0.3.2 → v0.4.0')+'</div><p class="ptx">The update needs an administrator. The app is in maintenance mode until the update is accepted, set up and migrated.</p></div>'
 '<div><h4>Update</h4><dl class="dl2"><dt>From</dt><dd>0.3.2 (accepted 9 Nov)</dd><dt>To</dt><dd>0.4.0</dd><dt>Detected</dt><dd>Today 07:04, after the restart</dd><dt>How</dt><dd><code>grafana-cli</code></dd><dt>Kept</dt><dd>Settings, permissions, data sources, icon and colour</dd></dl></div>'
 '<div><h4>Who sees the app now</h4><p class="ptx" style="font-size:12px;line-height:18px">Org Admins only. Other users do not see it in the menu, the dock or the app switcher until maintenance mode ends.</p></div>'
 '<div><h4>Who can act</h4><p class="ptx" style="font-size:12px;line-height:18px">Review, setup and Disable: Org Admin (<code>plugins:write</code>). Uninstall: Grafana Server Admin, only when plugin admin is on. A button you are not allowed to use is not shown.</p></div></aside>')
build('AppUpdate.dc.html','Maintenance','acme-maintenance-app','0.4.0',MNT_TILE,'Update review','review',2,'Review',steps21,aside21,1900,'S21 · App lifecycle: after an update',
      pre=pre21,acts=acts21,hm_extra=' · '+updnote('from v0.3.2'))
print('built')

# canvas: S21 goes right after S16; boards to its right in that row move one slot (idempotent)
import json
cp=G+'project/canvas.json'; cj=json.load(open(cp)); bd=cj['boards']
bd['AppSetup.dc.html']['title']='S16 · AppLifecycleView: setup, validate, enable, migrate'
if 'AppUpdate.dc.html' not in bd:
    s16=bd['AppSetup.dc.html']; x=s16['x']+1560
    for v in bd.values():
        if v['y']==s16['y'] and v['x']>=x: v['x']+=1560
    bd['AppUpdate.dc.html']={'expand':'fill','h':1900,'title':'S21 · AppLifecycleView: after an update','w':1440,'x':x,'y':s16['y']}
    o=cj['order']; o.insert(o.index('AppSetup.dc.html')+1,'AppUpdate.dc.html')
json.dump(cj,open(cp,'w'),indent=1)
