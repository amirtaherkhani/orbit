import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
# Screens mount the shared components (owner, 2026-11-20): every board that draws its own copy of a component
# gets a <dc-import> of the component board instead, with the props of the state it shows.
# Runs after every builder that writes these boards (lc_r12, tpl_build, lc_s22) and before lc_fit.
# Each swap first checks that the copy is the standard one, so a board that drifts fails the build instead of changing silently.
import re
P=ROOT+'project/'
DOCK_ITEMS={'Home':'home','Dashboards':'dashboards','Bookmarks':'bookmarks','Starred':'starred','Alerting':'alerting','Menu':'menu'}
DOCK_BOARDS=['PageShell','PageDashboard','PageSettings','PageList','PageDetail','RefDock','DockMenu','DockDashboard','DockUser','ExtSheet','ExtAdd',
             'ExtSheetAdmin','AppsPin','AppsAdd','ExtSheetSwitch','AppManage','AppSetup','AddAppFlow','AppUpdate']

def dock_props(nav):
    t=re.sub(r'<svg.*?</svg>','',nav,flags=re.S)
    assert re.findall(r'class="n"[^>]*aria-label="([^"]*)" title=',t)==['Playlists','Library panels','Explore'],'bookmarks'
    assert '<span class="k" style="font-size:12px">App</span>Monitoring' in t,'app'
    ws=re.search(r'<button[^>]*class="n ws[^"]*"[^>]*>',t).group(0)
    on=re.findall(r'class="n on"[^>]*>([^<]*)<',t)
    if 'class="n ws on"' in ws: assert not on; return 'apps'
    assert len(on)<=1,on
    return DOCK_ITEMS[on[0]] if on else 'none'

for f in DOCK_BOARDS:
    s=open(P+f+'.dc.html').read()
    i=s.find('<nav class="dk"')
    # already composed (a board no builder rewrites); R07 keeps its other specimens as drawn states
    if i<0 or 'name="CmpDock"' in s: continue
    j=s.index('</nav>',i)+6
    try: sel=dock_props(s[i:j])
    except AssertionError as e: raise SystemExit(f'lc_compose: {f} draws a Dock that is not the standard one ({e}); update the Dock component or this list')
    s=s[:i]+f'<dc-import name="CmpDock" selected="{sel}" hint-size="760px,58px"></dc-import>'+s[j:]
    open(P+f+'.dc.html','w').write(s)
print('compose ok')
