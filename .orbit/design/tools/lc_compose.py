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
print('compose ok')
