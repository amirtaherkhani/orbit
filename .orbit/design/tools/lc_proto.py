import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
# S23 · Prototype (owner's step 5, 2026-11-22): one board where the dock, the menu, the app switcher and the overlays load the views in
# place: Home (S01), Dashboard (S03), Apps (C12), App manage (C17), Lifecycle (C20), Bookmarks (C08) and an opened menu page.
# It is derived from the built S22 (shell, menu, dock and the shared page state) and the built S03 (dashboard sample), so run it after
# lc_compose and before lc_fit. The page logic is tools/s22/logic.js with the shared mock data; its view state routes the views.
import json,re,sys
sys.path.insert(0,ROOT+'tools')
from cmp_css import split
P=ROOT+'project/'; T=ROOT+'tools/s22/'; OUT='Prototype.dc.html'
s=open(P+'DockMenuFlow.dc.html').read(); d3=open(P+'DockDashboard.dc.html').read()
def one(a,b):
    global s; assert s.count(a)==1,('lc_proto',a[:90],s.count(a)); s=s.replace(a,b)
def hole(v,hint): return f'<sc-if value="{{{{ {v} }}}}" hint-placeholder-val="{{{{ {hint} }}}}">'
def mount(name,attrs,h): return f'<div style="grid-column:span 12;min-width:0"><dc-import name="{name}" embedded="true" {attrs} hint-size="100%,{h}px"></dc-import></div>'
# 1. Home and the opened page are S22's own; the other views follow them, one flag each
s=s.replace('<sc-if value="{{ isHome }}"','<sc-if value="{{ vHome }}"').replace('<sc-if value="{{ isPage }}"','<sc-if value="{{ vPage }}"')
assert '{{ isHome }}' not in s and '{{ isPage }}' not in s and s.count('{{ vPage }}')==2
b=s.index('<div class="bcr"'); e=s.index('</div>',s.index('</sc-if>',s.index('{{ vPage }}',b)))
s=s[:e]+hole('viewCrumb','false')+('<nav class="cb" aria-label="Breadcrumb"><button type="button" class="ap">Monitoring</button><button type="button">{{ viewCrumb }}</button>'
       +hole('hasViewSub','false')+'<button type="button" aria-current="page">{{ viewSub }}</button></sc-if></nav></sc-if>')+s[e:]
m3=d3.index('<main class="mn"'); e3=d3.index('>',m3)+1; dash=d3[e3:d3.index('</main>',m3)]  # S03's main has no breadcrumb of its own
assert dash.count('<section')>=2,'S03 dashboard sample'
VIEWS=(hole('vDash','false')+dash+'</sc-if>'
       +hole('vApps','false')+mount('CmpAppsView','on-manage="{{ manage }}" on-step="{{ step }}"',1100)+'</sc-if>'
       +hole('vManage','false')+mount('CmpAppManage','app="{{ viewApp }}" bm="{{ bm }}" on-toggle="{{ toggleBm }}"',1000)+'</sc-if>'
       +hole('vLife','false')+mount('CmpLifecycle','mode="{{ lcMode }}"',1600)+'</sc-if>'
       +hole('vBm','false')+mount('CmpDockPages','bm="{{ bm }}" hidden="{{ hidden }}" on-toggle="{{ toggleBm }}" on-toggle-dock="{{ toggleHidden }}"',560)+'</sc-if>')
k=s.index('</main>'); s=s[:k]+VIEWS+s[k:]
# 2. The dock routes: its items open views, the app button opens C05 AppSwitcher, whose Apps row opens the Apps page
one('selected="none" open-overlay="{{ dockOverlay }}"','selected="{{ dockSel }}" open-overlay="{{ dockOverlay }}"')
one('on-apps="{{ toggleSwitcher }}" on-pick-app="{{ pickApp }}" on-key="{{ sheetKey }}"','on-apps="{{ toggleSwitcher }}" on-apps-page="{{ appsPage }}" on-pick-app="{{ pickApp }}" on-navigate="{{ navigate }}" on-key="{{ sheetKey }}"')
# the dock stays at the bottom centre of the window on every view, also on views taller than the board (owner, 2026-11-22)
i=s.index('<dc-import name="CmpDock"'); j=s.index('</dc-import>',i)+12; s=s[:i]+'<div class="s23dk">'+s[i:j]+'</div>'+s[j:]
# 3. Title, stylesheet (S22's, plus the rules of the screens whose views it shows: S03, S11, S12, S15, S16, S18, S21), logic
s=re.sub(r'<title>[^<]*</title>','<title>Prototype</title>',s,count=1)
css=lambda t: t[t.index('<style>',t.index('<helmet>'))+7:t.index('</style>',t.index('<helmet>'))]
have={r[:r.index('{')].strip() for r in split(css(s))[0] if '{' in r}
add=''
for f in ['DockDashboard','AppsPin','AppsAdd','AppManage','AppSetup','AddAppFlow','AppUpdate']:
    for r in split(css(open(P+f+'.dc.html').read()))[0]:
        sel=r[:r.index('{')].strip() if '{' in r else ''
        if sel and sel not in have: have.add(sel); add+=r  # the first board that has a selector gives its rule
# the canvas does not keep position:fixed in a board, so the shell is a frame of the board's height: main scrolls, the dock stays put
add+=('.a{height:1400px;min-height:0;overflow:hidden;box-sizing:border-box}.a>.s{height:100%;min-height:0;box-sizing:border-box}.s>.r{min-height:0}'
      'main.mn{min-height:0;overflow-y:auto;padding-bottom:96px;scrollbar-width:thin}'
      '.s23dk{position:absolute;left:0;right:0;bottom:18px;display:flex;justify-content:center;z-index:20;pointer-events:none}.s23dk>*{pointer-events:auto}')
i=s.index('</style>',s.index('<helmet>')); s=s[:i]+add+s[i:]
MOCK=re.sub(r'^//.*$','',open(T+'mock.js').read(),flags=re.M)
a=s.index('class Component extends DCLogic'); z=s.index('</script>',a)
s=s[:a]+open(T+'logic.js').read().replace('/*MOCK*/',MOCK).replace('class Component extends DCLogic {\n','class Component extends DCLogic {\n// S23 · Prototype runs the S22 page logic; its view state routes the views (tools/lc_proto.py).\n',1)+s[z:]
bad=re.findall(r'[\w-]+="\{\{[^"]*\}\}[^"]*\{\{[^"]*\}\}"',s)
assert not bad,('lc_proto: one hole per attribute',bad[:3])
open(P+OUT,'w').write(s)
# 4. Canvas: one board, placed once in a free spot right of S22; step 6 puts it on the Prototype page
cj=json.load(open(P+'canvas.json')); B=cj['boards']
if OUT not in B:
    def free(x,y,w,h): return all(x+w+80<=v['x'] or v['x']+v['w']+80<=x or y+h+120<=v['y'] or v['y']+v['h']+120<=y for v in B.values())
    s22=B['DockMenuFlow.dc.html']; x,y=next((x,y) for y in range(s22['y'],80000,40) for x in range(s22['x']+1560,30000,40) if free(x,y,1440,1400))
    B[OUT]={'expand':'fill','h':1400,'title':'S23 · Prototype: the shell with every view','w':1440,'x':x,'y':y,'is_interactive':True}
    o=cj['order']; o.insert(o.index('DockMenuFlow.dc.html')+1,OUT)
    json.dump(cj,open(P+'canvas.json','w'),indent=1)
print('proto ok')
