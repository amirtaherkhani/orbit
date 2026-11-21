import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
# Screens mount the shared components (owner, 2026-11-20): every board that draws its own copy of a component
# gets a <dc-import> of the component board instead, with the props of the state it shows.
# Runs after every builder that writes these boards (lc_r12, tpl_build, lc_s22) and before lc_fit.
# Each swap first checks that the copy is the standard one, so a board that drifts fails the build instead of changing silently.
import re
P=ROOT+'project/'
DOCK_ITEMS={'Home':'home','Dashboards':'dashboards','Bookmarks':'bookmarks','Starred':'starred','Alerting':'alerting','Menu':'menu'}
DOCK_BOARDS=['ExtSwitch','PageShell','PageDashboard','PageSettings','PageList','PageDetail','RefDock','DockMenu','DockDashboard','DockUser','ExtSheet','ExtAdd',
             'ExtSheetAdmin','AppsPin','AppsAdd','ExtSheetSwitch','AppManage','AppSetup','AddAppFlow','AppUpdate']

def dock_props(nav):
    t=re.sub(r'<svg.*?</svg>','',nav,flags=re.S)
    assert re.findall(r'class="n"[^>]*aria-label="([^"]*)" title=',t)==['Playlists','Library panels','Explore'],'bookmarks'
    assert '<span class="k" style="font-size:12px">App</span>Monitoring' in t,'app'
    ws=re.search(r'<button[^>]*class="n ws[^"]*"[^>]*>',t).group(0)
    on=re.findall(r'class="n on"[^>]*>([^<]*)<',t)
    extra=''
    if '<div class="wsm"' in t:  # the AppSwitcher (C05) is open above the workspace button
        assert 'aria-expanded="true" style="background:#262a31"' in ws,'open switcher'; extra=' open-overlay="apps"'
    if 'class="n ws on"' in ws: assert not on; return 'apps'+extra
    assert len(on)<=1,on
    return (DOCK_ITEMS[on[0]] if on else 'none')+extra

for f in DOCK_BOARDS:
    s=open(P+f+'.dc.html').read()
    i=s.find('<nav class="dk"')
    # already composed (a board no builder rewrites); R07 keeps its other specimens as drawn states
    if i<0 or 'name="CmpDock"' in s: continue
    j=s.index('</nav>',i)+6
    try: sel=dock_props(s[i:j])
    except AssertionError as e: raise SystemExit(f'lc_compose: {f} draws a Dock that is not the standard one ({e}); update the Dock component or this list')
    s=s[:i]+f'<dc-import name="CmpDock" selected="{sel.split()[0]}"{sel[len(sel.split()[0]):]} hint-size="760px,58px"></dc-import>'+s[j:]
    open(P+f+'.dc.html','w').write(s)
# TopBar (C02): open overlay (UserMenu C03, AddMenu C04), image avatar and the board link are the props
TOP_BOARDS=['AddAppFlow','AppManage','AppSetup','AppUpdate','AppsAdd','AppsPin','DockAppPages','DockDashboard','DockBookmarkAdd','DockHome','DockMenu',
            'DockUser','DockMenuFlow','ExtAdd','ExtSheet','ExtSheetSwitch','ExtSheetAdmin','ExtSwitch','PageDashboard','PageList','PageDetail',
            'PageSettings','PageShell','RefFrame']
def div_block(s,i):
    d=0
    for m in re.finditer(r'<div\b|</div>',s[i:]):
        d+=1 if m.group(0)=='<div' else -1
        if d==0: return i+m.end()
def top_props(t):
    assert 'Search…' in t and '31 October' in t,'clock or search'
    a=[]
    m=re.search(r'<a data-s22 href="([^"]+)"[^>]*>([^<]+)</a>',t)
    if m: a+=[f'link-href="{m.group(1)}"',f'link-label="{m.group(2)}"']
    if '<div class="um"' in t: a.append('open-overlay="user"')
    elif '<div class="am"' in t: a.append('open-overlay="add"')
    im=re.search(r'<img src="([^"]+)" alt="" width="28"',t)
    if im: a.append(f'avatar="{im.group(1)}"')
    else: assert '>AD</span>' in t,'avatar'
    return ' '.join(a)
for f in TOP_BOARDS:
    s=open(P+f+'.dc.html').read()
    i=s.find('<div class="t">')
    if i<0 or 'name="CmpTopBar"' in s: continue
    j=div_block(s,i)
    if '{{' in s[i:j]: continue  # a top bar wired to the board's own logic stays until that logic moves into the component
    try: pr=top_props(s[i:j])
    except AssertionError as e: raise SystemExit(f'lc_compose: {f} draws a TopBar that is not the standard one ({e})')
    s=s[:i]+f'<dc-import name="CmpTopBar" {pr} hint-size="1412px,64px"></dc-import>'.replace('  ',' ')+s[j:]
    open(P+f+'.dc.html','w').write(s)
# MenuSheet (C06): the static sheet states mount the shared sheet with the page or the open app list they show.
# The guard is the header text each board shows; the bookmark count now comes from the shared mock bookmarks.
SHEETS={'DockMenu':('Explore · no sub pages','page="Explore"'),'ExtSheet':('Dashboards · sub pages',''),'ExtSheetSwitch':('<div class="mzdd"','apps-open="true"'),
        'ExtSheetAdmin':(('Administration · sub pages<b>12</b></h3>','<span>General</span><em>6</em>','<span>Plugins and data</span><em>2</em>',
                          '<span>Access</span><em>4</em>','<b>Default preferences</b>','<b>Provisioning</b>'),'page="Administration"')}
for f,(must,props) in SHEETS.items():
    s=open(P+f+'.dc.html').read()
    i=s.find('<div class="sh3"')
    if i<0 or 'name="CmpMenuSheet"' in s: continue
    j=div_block(s,i)
    if any(m not in s[i:j] for m in (must if isinstance(must,tuple) else (must,))+('Monitoring',)): raise SystemExit(f'lc_compose: {f} draws a MenuSheet that is not the expected state ({must})')
    s=s[:i]+f'<dc-import name="CmpMenuSheet" anchored="true" {props} hint-size="1080px,470px"></dc-import>'.replace('  ',' ')+s[j:]
    open(P+f+'.dc.html','w').write(s)
T=ROOT+'tools/s22/'
MOCK=re.sub(r'^//.*$','',open(T+'mock.js').read(),flags=re.M)
def page_logic(board,app,menu=False,adding=False):
    # the S22 page logic (tools/s22/logic.js) with this board's start state
    L=open(T+'logic.js').read().replace('/*MOCK*/',MOCK)
    a="this.state = { viewer: false, menu: false, apps: false, opened: null, app: 'monitoring',"; assert L.count(a)==1,'S22 start state'
    b="adding: false, fresh: null };"; assert L.count(b)==1,'S22 start state'
    L=L.replace(a,a.replace('menu: false',f'menu: {str(menu).lower()}').replace("'monitoring'",f"'{app}'")).replace(b,f"adding: {str(adding).lower()}, fresh: null }};")
    return L.replace('class Component extends DCLogic {\n',f'class Component extends DCLogic {{\n// {board} runs the S22 page logic with its own start state (lc_compose.py).\n',1)
def set_logic(s,js):
    a=s.index('class Component extends DCLogic'); b=s.index('</script>',a); return s[:a]+js+s[b:]
DOCK_BM='bm="{{ bm }}" on-add-bookmark="{{ toggleAdd }}" on-toggle-bookmark="{{ toggleBm }}" '
# S19 (DockAppPages) is swapped last: lc_s22 derives S22 from the uncomposed S19 earlier in the same build (lc_misc rebuilds it each time).
# It keeps its own state with the S22 page logic, started on Management with the menu open. Neither component gets a close
# callback, so the menu stays open on this board; picking apps, pages and bookmarks works as in S22.
f='DockAppPages'; s=open(P+f+'.dc.html').read()
if 'name="CmpMenuSheet"' not in s:
    i=s.find('<div class="sh3"'); j=div_block(s,i) if i>=0 else -1; k=s.find('<nav class="dk"')
    must=["this.state = { app: 'management', page: 0, focus: 0, open: false",'{{ isMon }}','Energy is not enabled yet','{{ dockVars }}','<button type="button" class="n on">']
    if i<0 or k!=j or any(m not in s for m in must): raise SystemExit('lc_compose: S19 DockAppPages is not the expected menu state; update this swap')
    l=s.index('</nav>',k)+6
    s=s[:i]+('<dc-import name="CmpMenuSheet" anchored="true" app="{{ app }}" bm="{{ bm }}" loading="{{ loading }}" viewer="{{ viewer }}" apps-open="{{ appsOpen }}" '
             'on-pick-app="{{ pickApp }}" on-toggle="{{ toggleBm }}" on-toggle-apps="{{ toggleApps }}" hint-size="1080px,470px"></dc-import>'
             '<dc-import name="CmpDock" active-app="{{ dockApp }}" bookmarks="{{ dockBms }}" selected="none" open-overlay="{{ dockOverlay }}" loading="{{ loading }}" '
             +DOCK_BM+'on-apps="{{ toggleApps }}" hint-size="760px,58px"></dc-import>')+s[l:]
    open(P+f+'.dc.html','w').write(set_logic(s,page_logic('S19','management',menu=True)))
# C07 DockBookmarkAdd: its markup lives in the board, its logic in tools/s22/bookmark.js with the shared mock data.
# shortcut: the board's stylesheet was trimmed once by cmp_css; a class bookmark.js starts to use later needs its rule copied from S20
f='CmpBookmarkAdd'; s=open(P+f+'.dc.html').read()
open(P+f+'.dc.html','w').write(set_logic(s,open(T+'bookmark.js').read().replace('/*MOCK*/',MOCK)))
# S20 (DockBookmarkAdd) mounts C01, which opens C07 from its '+' slot; the board keeps its own state: Management, popover open.
# Only the dock and the popover are shared; its Management page behind them stays as drawn. The logic is refreshed every build.
f='DockBookmarkAdd'; s=open(P+f+'.dc.html').read()
if 'name="CmpDock"' not in s:
    i=s.find('<nav class="dk"'); j=s.find('</nav>',i)
    must=['<div class="bpo"',"this.state = { open: true, filter: 'all', q: '', bms: ['Overview/Line status', 'Reports/Weekly']",
          "const CAP = 6; const app = { name: 'Management'","['Overview', 'chart', 'Production line overview'","['Reports', 'doc', 'Shift and production reports'","['3D view', 'cube', 'Machines in the plant model'"]
    if i<0 or j<0 or any(m not in s for m in must): raise SystemExit('lc_compose: S20 DockBookmarkAdd is not the expected popover state; update this swap')
    s=s[:i]+('<dc-import name="CmpDock" active-app="{{ dockApp }}" bookmarks="{{ dockBms }}" selected="none" open-overlay="{{ dockOverlay }}" loading="{{ loading }}" '
             +DOCK_BM+'on-key="{{ sheetKey }}" hint-size="760px,58px"></dc-import>')+s[j+6:]
open(P+f+'.dc.html','w').write(set_logic(s,page_logic('S20','management',adding=True)))
# S11 components (C08 DockPagesView, C09 PageCard, C10 PagePanel, C11 DockPreview): markup in their boards, logic in tools/s22/*.js
# with the shared mock data, refreshed every build.
for f,js in [('CmpDockPages','dockpages.js'),('CmpPageCard','pagecard.js'),('CmpPagePanel','pagepanel.js'),('CmpDockPreview','dockpreview.js')]:
    s=open(P+f+'.dc.html').read(); open(P+f+'.dc.html','w').write(set_logic(s,open(T+js).read().replace('/*MOCK*/',MOCK)))
# S11 (AppsPin) mounts C08 and runs the S22 page logic, so its dock shows the bookmarks the page changes. Its breadcrumb stays.
# The wrapper spans the 12 columns of .mn: a dc-import element would otherwise sit in one grid cell.
f='AppsPin'; s=open(P+f+'.dc.html').read()
if 'name="CmpDockPages"' not in s:
    i=s.find('<section style="grid-column:span 12;display:flex;align-items:flex-end'); k=s.find('<div class="s11sc"')
    must=["sel: 'explore', app: 'all', seg: 'all'","'dash/pl': 1",'<aside class="pv pgp"','<section class="pv dpv"','>Bookmarks</h2>',
          '<dc-import name="CmpDock" selected="menu" hint-size="760px,58px"></dc-import>']
    if i<0 or k<0 or any(m not in s for m in must): raise SystemExit('lc_compose: S11 AppsPin is not the expected bookmarks page; update this swap')
    s=s[:i]+('<div style="grid-column:span 12;min-width:0"><dc-import name="CmpDockPages" embedded="true" bm="{{ bm }}" hidden="{{ hidden }}" on-toggle="{{ toggleBm }}" '
             'on-toggle-dock="{{ toggleHidden }}" hint-size="100%,560px"></dc-import></div>')+s[div_block(s,k):]
    s=s.replace('<dc-import name="CmpDock" selected="menu" hint-size="760px,58px"></dc-import>','<dc-import name="CmpDock" active-app="{{ dockApp }}" bookmarks="{{ dockBms }}" '
                'selected="menu" open-overlay="{{ dockOverlay }}" loading="{{ loading }}" '+DOCK_BM+'on-key="{{ sheetKey }}" hint-size="760px,58px"></dc-import>')
open(P+f+'.dc.html','w').write(set_logic(s,page_logic('S11','monitoring')))
# S12 components (C12 AppsView, C13 AppCard, C14 AppPreviewPanel, C15 StatusChip, C16 LifecycleActionButton). The status model comes
# from lifecycle_kit.py, the source of the Python-built lifecycle boards (S15-S21), so a status reads the same everywhere.
import json,sys
sys.path.insert(0,ROOT+'tools')
import lifecycle_kit as K
STATUS='const S = '+json.dumps({x[0]:{'label':x[1],'icon':x[2],'tone':x[3],'desc':x[4]} for x in K.STATUS},ensure_ascii=False)+';'
for f,js in [('CmpAppsView','appsview.js'),('CmpAppCard','appcard.js'),('CmpAppPreview','apppanel.js'),('CmpStatusChip','statuschip.js'),('CmpLcButton','lcbutton.js')]:
    s=open(P+f+'.dc.html').read(); open(P+f+'.dc.html','w').write(set_logic(s,open(T+js).read().replace('/*MOCK*/',MOCK).replace('/*STATUS*/',STATUS)))
s=open(P+'CmpStatusChip.dc.html').read()
miss=[x[2] for x in K.STATUS if K.SV % K.ICON[x[2]] not in s]
if miss: raise SystemExit(f'lc_compose: C15 StatusChip does not draw the lifecycle icons {sorted(set(miss))} of lifecycle_kit.py; add them to its board')
# S12 (AppsAdd) is rebuilt by lc_s12.py every build, so it is swapped every build: C12 AppsView replaces its header, cards and panel.
f='AppsAdd'; s=open(P+f+'.dc.html').read()
if 'name="CmpAppsView"' not in s:  # already swapped when lc_compose runs on its own
  i=s.find('<section style="grid-column:span 12;display:flex;align-items:flex-end'); k=s.find('<div style="grid-column:span 12;display:grid;grid-template-columns:minmax(0,1fr) 360px')
  must=['>All 5</button>','Production line overview, reports and 3D view.','aria-label="Status: Review required"','Step 3 of 6','<aside class="pv" aria-label="Maintenance: details and pages">']
  if i<0 or k<0 or any(m not in s for m in must): raise SystemExit('lc_compose: S12 AppsAdd is not the expected Apps page; update this swap')
  s=s[:i]+'<div style="grid-column:span 12;min-width:0"><dc-import name="CmpAppsView" embedded="true" hint-size="100%,1100px"></dc-import></div>'+s[div_block(s,k):]
open(P+f+'.dc.html','w').write(set_logic(s,'class Component extends DCLogic {\n// S12 mounts C12 AppsView, which keeps its own filter and selection (lc_compose.py).\nrenderVals() { return {}; }\n}\n'))
# The canvas reads an attribute that starts and ends with a hole as ONE path ("{{ a }};{{ b }}" -> undefined), while dcrender
# interpolates it, so the local screenshots never show the bug (C07 was blank on the canvas). Fail the build instead.
import glob
bad=[(_os.path.basename(g),m) for g in glob.glob(P+'*.dc.html') for m in re.findall(r'[\w-]+="\{\{[^"]*\}\}[^"]*\{\{[^"]*\}\}"',open(g).read())]
if bad: raise SystemExit(f'lc_compose: attribute with more than one hole that starts and ends with a hole; use one hole: {bad[:3]}')
print('compose ok')
