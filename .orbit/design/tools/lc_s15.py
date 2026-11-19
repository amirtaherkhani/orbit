import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
import re,sys
sys.path.insert(0,ROOT+'tools')
from lifecycle_kit import *
f=ROOT+'project/AppManage.dc.html'; s=open(ROOT+'pre_lifecycle/AppManage.dc.html').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:70],s.count(a)); s=s.replace(a,b)
OK='<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>'
def ci(kind,lab): return f'<span class="ci {kind}" role="img" aria-label="{lab}">{OK if kind=="ok" else ""}</span>'
def tbl(head,rows): return '<div class="tw"><table class="mt2"><thead><tr>'+''.join(f'<th>{h}</th>' for h in head)+'</tr></thead><tbody>'+''.join('<tr>'+''.join(f'<td>{c}</td>' for c in r)+'</tr>' for r in rows)+'</tbody></table></div>'
SETUP='<a class="p gh2 sm" href="AppSetup.dc.html" style="text-decoration:none">Change in setup</a>'
# header
rep('<p class="hm">acme-management-app · v0.1.0 · <span><i class="dt"></i>Initialized</span></p>','<p class="hm">acme-management-app · v0.1.0 · '+chip('enabled')+' · since 28 October</p>')
# overview: status and health first
status=('<section class="mg" aria-labelledby="mg-stat"><div class="mgh"><div><h3 id="mg-stat">Status and health</h3><p class="mu sub">The lifecycle state of the app in this organisation, and the last results.</p></div><button type="button" class="p gh2 sm">Run checks</button></div>'
 '<div class="uvr">'
 '<div><span class="mu">Status</span><b>'+label('enabled')+'</b></div>'
 '<div><span class="mu">Health</span><b>OK <span class="mu" style="font-weight:400">· 09:14</span></b></div>'
 '<div><span class="mu">Initialization</span><b>Accepted <span class="mu" style="font-weight:400">· 28 Oct</span></b></div>'
 '<div><span class="mu">Setup</span><b>Valid</b></div>'
 '<div><span class="mu">Migrations</span><b>Up to date</b></div></div></section>')
rep('<div class="gtp" role="tabpanel" aria-label="Overview"><section class="mg" aria-labelledby="mg-where">','<div class="gtp" role="tabpanel" aria-label="Overview">'+status+'<section class="mg" aria-labelledby="mg-where">')
rep('<p class="mu sub">Starts from the app manifest (<code>ui.show</code>). Your choice overrides it.</p>','<p class="mu sub">Starts from the app manifest (<code>ui.show</code>). Your choice overrides it. Hiding the app here is not access control.</p>')
rep('<h3 id="mg-look">Appearance</h3><p class="mu sub">Set by the app. Read only here.</p>','<div class="mgh"><div><h3 id="mg-look">Icon and colour</h3><p class="mu sub">Chosen in Setup for this organisation. The app manifest gives the defaults.</p></div>'+SETUP+'</div>')
# pages: visibility is not access control
rep('The active app\'s bookmarks show in the dock.</p>','The active app\'s bookmarks show in the dock. Hiding a page is not access control; “Who can open” is.</p>')
# health tab (was Configuration check)
rep('aria-label="Configuration check"','aria-label="Health and checks"')
rep('<h3 id="mg-check">Configuration check</h3><p class="mu sub">The app and each of its pages. Healthy apps re-check in the background.</p>','<h3 id="mg-check">Health and checks</h3><p class="mu sub">App health, the validation checks from setup, and each page. A result covers only the checks that ran.</p>')
# new tab panels
access=('<sc-if value="{{ show_access }}" hint-placeholder-val="{{ false }}"><div class="gtp" role="tabpanel" aria-label="Access"><section class="mg" aria-labelledby="mg-acc"><div class="mgh"><div><h3 id="mg-acc">Users, groups and permissions</h3><p class="mu sub">Who can use the app in Main Org. Set in Setup; a change runs validation again.</p></div>'+SETUP+'</div>'
 +tbl(['Who','Kind','Access to the app','Pages they can open'],[['Viewer','Role','View','2 of 3'],['Editor','Role','View','3 of 3'],['Line leads','Team','Edit','3 of 3'],['Admin','Role','Admin','3 of 3']])
 +'<div class="rnote" style="margin-top:12px">A button that is hidden never replaces the permission check on the server. Sub page permissions are on the Pages tab.</div></section></div></sc-if>')
data=('<sc-if value="{{ show_data }}" hint-placeholder-val="{{ false }}"><div class="gtp" role="tabpanel" aria-label="Data sources"><section class="mg" aria-labelledby="mg-ds"><div class="mgh"><div><h3 id="mg-ds">Data sources and connections</h3><p class="mu sub">What the app reads from. Set in Setup; a change runs validation again.</p></div>'+SETUP+'</div>'
 +tbl(['Connection','Used for','Data source','Last test'],[['Production data','Line overview, reports','[DATA SOURCE NAME]','<span class="cs ok">'+ci('ok','Passed')+'OK · 09:14</span>'],['3D model store','3D view','[DATA SOURCE NAME]','<span class="cs ok">'+ci('ok','Passed')+'OK · 09:14</span>']])
 +'<div class="sact" style="margin-top:12px"><button type="button" class="p gh2 sm">Test connections</button></div></section></div></sc-if>')
act=('<sc-if value="{{ show_activity }}" hint-placeholder-val="{{ false }}"><div class="gtp" role="tabpanel" aria-label="Activity"><section class="mg" aria-labelledby="mg-act"><h3 id="mg-act">Activity</h3><p class="mu sub">User audit: who did what on this app. Written by the apps module to its own table and kept for <code>audit_max_age</code> (default 90 days). Org Admins only. The app’s own logs stay in the server logs.</p>'
 +tbl(['When','Who','Action','Result'],[['28 Oct 10:02','Admin','Enabled the app','Done'],['28 Oct 10:01','Admin','Ran validation','4 passed'],['28 Oct 09:48','Admin','Saved setup','Done'],['28 Oct 09:31','Admin','Accepted the review','Done'],['28 Oct 09:30','Admin','Ran initialization','6 passed, 1 warning']])
 +'<div class="rnote" style="margin-top:12px"><b>Application logs: not available here yet.</b> Logs need a source, a retention period and access control before they can be shown. Until that is decided, this tab lists lifecycle actions only.</div></section></div></sc-if>')
i=s.index('<sc-if value="{{ show_check }}"'); s=s[:i]+access+data+s[i:]
# Activity tab removed 2026-11-17 (owner): Grafana OSS has no audit log; a global audit feature comes later (OD30).
# logic
rep("{ id: 'check', label: 'Configuration check', count: 1, kind: 'warn' }","{ id: 'access', label: 'Access', count: null, kind: '' },\n{ id: 'data', label: 'Data sources', count: 2, kind: '' },\n{ id: 'check', label: 'Health', count: 1, kind: 'warn' }")
rep("show_check: cur === 'check' }","show_check: cur === 'check', show_access: cur === 'access', show_data: cur === 'data' }")
rep('hint-placeholder-count="4"><button type="button" role="tab"','hint-placeholder-count="6"><button type="button" role="tab"')
# aside
rep('<dt>Status</dt><dd><span class="st"><i class="dt"></i>Initialized</span></dd>','<dt>Status</dt><dd>'+label('enabled')+'</dd>')
rep('<dt>Last checked</dt><dd>Today 09:14</dd>','<dt>Last update</dt><dd>'+updnote('0.0.9 → 0.1.0')+' <span class="mu">28 Oct, checks passed by themselves</span></dd><dt>Last checked</dt><dd>Today 09:14</dd>')
rep('<dt>Last update</dt>','<dt>Needs Orbit</dt><dd><code>&gt;=1.0.0 &lt;2</code> · this server runs 1.0.0 (v13.3.0+orbit.1)</dd><dt>Last update</dt>')
rep('Information only. Update the app with <code>grafana-cli plugins update</code> or in the plugin catalog; this page does not install updates.','Information only. To update: install the new version with <code>grafana-cli</code> and restart Grafana. After the restart the apps module compares the loaded version with the last accepted one. A simple update keeps the app Enabled with an “Updated” note; an update with new permissions, data sources, setup fields or a new schema opens the lifecycle again at the first step that needs you, in maintenance mode.')
m=re.search(r'<div style="display:flex;flex-direction:column;gap:8px;margin-top:auto"><button type="button" class="p gh2" style="justify-content:center">Reset to app defaults</button><button type="button" class="p gh2 dng" style="justify-content:center">Remove from apps</button></div>',s); assert m
s=s.replace(m.group(0),'<div style="display:flex;flex-direction:column;gap:8px;margin-top:auto">'+abtn('setup','Open setup',href='AppSetup.dc.html',small=False,style='justify-content:center')+'<button type="button" class="p gh2" style="justify-content:center">Disable</button><button type="button" class="p gh2 dng" style="justify-content:center">Uninstall</button><p class="mu" style="margin:0;font-size:12px;line-height:18px">Disable keeps the app installed and its setup, but users cannot use it. Uninstall removes the plugin and needs a server admin.</p></div>')
k=s.index('.dl2{'); s=s[:k]+CSS+'.ckc .cs,.mt2 .cs{padding:0}'+s[k:]
open(f,'w').write(s)
print('uvr css' , '.uvr{' in s, re.findall(r'\.uvr\{[^}]*\}',s)[:1])
rep('Failed: an app that fails is not listed in Apps until fixed (it shows as Needs setup).','Failed: the app shows as Action required in Apps until it is fixed, and the row names the operation that failed.')
open(f,'w').write(s)
s=open(f).read()
for a,b in [('min-height:1230px','min-height:1360px'),('min-height:1202px','min-height:1332px'),('"height":1230','"height":1360')]:
    assert s.count(a)==1,a; s=s.replace(a,b)
open(f,'w').write(s)
