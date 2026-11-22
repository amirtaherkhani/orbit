import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
# S22 · MenuSheet: menu flow (owner's decisions N1-N10, 2026-11-19). One artboard with one shared state: Home, Menu, Apps, Page.
# It is derived from the built S19 (DockAppPages), so run it after lc_misc and lc_r12 and before lc_ids and lc_fit.
# S02, S07 and S19 stay as they are (N1). S04, S06, S08, S11 and S20 only get a link to S22 (N5).
import json,re,subprocess,sys
P=ROOT+'project/'; T=ROOT+'tools/s22/'
SRC='DockAppPages.dc.html'; OUT='DockMenuFlow.dc.html'
s=open(P+SRC).read()

def end_of(s,i):
    # index after the </sc-if> that closes the <sc-if> opened at i
    d=0
    for m in re.finditer(r'<sc-if\b|</sc-if>',s[i:]):
        d+=1 if m.group(0)=='<sc-if' else -1
        if d==0: return i+m.end()
    raise AssertionError('unclosed sc-if')
def one(a,b):
    global s
    assert s.count(a)==1,(a[:90],s.count(a)); s=s.replace(a,b)
def hole(name,hint): return f'<sc-if value="{{{{ {name} }}}}" hint-placeholder-val="{{{{ {hint} }}}}">'

# 1. Monitoring is one more app on the shared data (N7): drop the three hard-coded blocks, keep their icons
mon=[]
while True:
    i=s.find('<sc-if value="{{ isMon }}"')
    if i<0: break
    j=end_of(s,i); mon.append(s[i:j]); s=s[:i]+s[j:]
assert len(mon)==3
while True:
    i=s.find('<sc-if value="{{ notMon }}"')
    if i<0: break
    j=end_of(s,i); k=s.index('>',i)+1; s=s[:i]+s[k:j-len('</sc-if>')]+s[j:]
rail=re.findall(r'<button[^>]*class="rn[^"]*"[^>]*>\s*(<svg.*?</svg>)\s*<span>([^<]+)</span>',mon[0],flags=re.S)
assert [x[1] for x in rail]==['Dashboards','Explore','Drilldown','Alerting','Connections','Administration'],rail
tl=re.findall(r'<span class="tl">(<svg.*?</svg>)</span>\s*<b>([^<]+)</b>',mon[1],flags=re.S)
assert [x[1] for x in tl]==['Playlists','Snapshots','Library panels','Shared dashboards','Recently deleted'],tl
def add_icons(who,prefix,svgs):
    global s
    i=s.index(f'<sc-if value="{{{{ {who}.i_clock }}}}"'); j=end_of(s,i)
    s=s[:j]+''.join(f'{hole(f"{who}.i_{prefix}{n}","false")}{svg}</sc-if>' for n,svg in enumerate(svgs))+s[j:]
add_icons('p','r',[x[0] for x in rail]); add_icons('t','t',[x[0] for x in tl])
# Administration's General tiles (S10) keep their own icons, as a0-a5 in tools/s22/mock.js
adm=open(ROOT+'pre_lifecycle/ExtSheetAdmin.dc.html').read(); adm=adm[adm.index('<div class="mzs"'):]
atl=re.findall(r'<span class="tl">(<svg.*?</svg>)</span>\s*<b>([^<]+)</b>',adm,flags=re.S)[:6]
assert [x[1] for x in atl]==['Default preferences','Statistics and licensing','Settings','Organizations','Migrate to Grafana Cloud','Provisioning'],atl
add_icons('t','a',[x[0] for x in atl])

# 2. Tiles: a click opens the page, arrows move focus (N9); the grid takes the keys
one('onClick="{{ t.focus }}"','id="{{ t.id }}" onFocus="{{ t.focus }}" onClick="{{ t.open }}"')
one('<div class="mzg"><sc-for list="{{ tiles }}"','<div class="mzg" role="group" aria-label="Sub pages" onKeyDown="{{ gridKey }}"><sc-for list="{{ tiles }}"')
s,n=re.subn(r'<button type="button" class="p gh2">(Open \{\{ pageName \}\})',r'<button type="button" class="p gh2" onClick="{{ openPg }}">\1',s); assert n==1,n

# 3. N10: "No pages yet" and "Continue setup" (hidden for a Viewer: a button the user may not use is hidden, not disabled)
s,n=re.subn(r'<p class="mempty">.*?</p>','<p class="mempty">No pages yet</p>',s,flags=re.S); assert n==1,n
SETUP=('<a class="p lca a-setup" href="AppSetup.dc.html" style="flex:none;height:30px;min-height:30px;padding:0 12px;gap:6px;white-space:nowrap;text-decoration:none;margin-top:10px">Continue setup</a>')
EMPTY=(hole('empty','false')+'<div class="mempty2"><b style="font-weight:500;color:#eceef1">No pages yet</b><br>{{ appName }} has no pages to show. They appear here once its setup is done.'
 +hole('canSetup','true')+'<br>'+SETUP+'</sc-if>'+hole('cantSetup','false')+'<br>An administrator can finish the setup.</sc-if></div></sc-if>'
 +hole('tilesNote','false')+'<div class="mempty2">{{ tilesNote }}</div></sc-if>')
s,n=re.subn(r'<sc-if value="\{\{ empty \}\}"[^>]*>\s*<div class="mempty2">.*?</div>\s*</sc-if>',lambda m:EMPTY,s,flags=re.S); assert n==1,n

# 3b. MenuSheet merge decisions (owner, 2026-11-20), so S22 draws what S02, S07 and S14 draw:
# app tiles show the app's icon, its first letter when it has none; the app list holds the selector apps only ("3 in selector");
# a page without sub pages shows a notice instead of a tile of itself.
snap=open(ROOT+'pre_lifecycle/ExtSheetSwitch.dc.html').read(); k=snap.index('<div class="mzdd"')
APPIC=re.findall(r'<button type="button" role="menuitem" class="mzo[^"]*" style="[^"]*"><span class="tl" style="[^"]*">(<svg.*?</svg>)</span>',snap[k:k+20000],flags=re.S)[:3]
assert len(APPIC)==3
def appicons(pre): return ''.join(hole(f'{pre}i_{n}','false')+v+'</sc-if>' for n,v in zip(['mon','mgmt','mnt'],APPIC))
TL='display:grid;place-items:center;flex:none;width:{w}px;height:{w}px;border-radius:6px;'
one('<button type="button" class="rsw" aria-haspopup="menu" aria-expanded="{{ openStr }}" aria-label="App: {{ appName }}" onClick="{{ toggle }}"><span class="tl mtl" style="{{ tileStyle }}">{{ initial }}</span>',
    '<button type="button" class="rsw" aria-haspopup="menu" aria-expanded="{{ openStr }}" aria-label="App: {{ appName }}" onClick="{{ toggle }}">'
    +hole('hasIcon','true')+f'<span class="tl" style="{TL.format(w=30)}{{{{ tileStyle }}}}">'+appicons('')+'</span></sc-if>'
    +hole('noIcon','false')+'<span class="tl mtl" style="{{ tileStyle }}">{{ initial }}</span></sc-if>')
one('<span class="tl mtl2" style="{{ ap.tileStyle }}">{{ ap.initial }}</span>',
    hole('ap.hasIcon','true')+f'<span class="tl" style="{TL.format(w=28)}{{{{ ap.tileStyle }}}}">'+appicons('ap.')+'</span></sc-if>'
    +hole('ap.noIcon','false')+'<span class="tl mtl2" style="{{ ap.tileStyle }}">{{ ap.initial }}</span></sc-if>')
one('<div class="mzcap"><span>Apps</span><span>Pick one to see its pages</span></div>','<div class="mzcap"><span>Apps</span><span>{{ selCount }} in selector</span></div>')
PAGEIC=dict(re.findall(r'<sc-if value="\{\{ p\.i_(\w+) \}\}" hint-placeholder-val="\{\{ false \}\}">(<svg.*?</svg>)</sc-if>',s,flags=re.S))
NOTICE=(hole('noticePage','false')+'<div class="mzem"><span class="tl">'+''.join(hole('pi_'+k,'false')+v+'</sc-if>' for k,v in PAGEIC.items())
        +'</span><span><b>{{ pageName }} has no sub pages</b>It opens straight away. Pages with a number, like Dashboards or Administration, list their sub pages here.</span></div></sc-if>')
i=s.index('<div class="mzg" role="group" aria-label="Sub pages"'); j=s.index('</sc-for>',i)+len('</sc-for>')
s=s[:j]+NOTICE+s[j:]

# 4. The sheet is a dialog that opens and closes: scrim for a click outside, Esc on the sheet and on the dock (N8)
m=re.search(r'<div class="sh3" role="dialog" aria-label="Menu">',s); i=m.start(); j=s.index('<nav class="dk"')
sheet=s[i:j].rstrip(); assert sheet.endswith('</div>')
sheet=sheet.replace(m.group(0),'<div class="sh3" role="dialog" aria-label="Menu" onKeyDown="{{ sheetKey }}">',1)
s=s[:i]+hole('menuOpen','false')+'<div class="s22s" aria-hidden="true" onClick="{{ closeMenu }}"></div>'+sheet+'</sc-if>\n'+s[j:]
one('<nav class="dk" aria-label="Main navigation">','<nav class="dk" aria-label="Main navigation" onKeyDown="{{ sheetKey }}">')
one('class="n ws" onClick="{{ toggle }}" aria-haspopup="menu" aria-expanded="false"','class="n ws" onClick="{{ toggle }}" aria-haspopup="menu" aria-expanded="{{ openStr }}"')
one('<button type="button" class="rsw"','<button type="button" id="s22-rsw" class="rsw"')
s,n=re.subn(r'<button type="button" class="n on">(<svg.*?</svg>)Menu</button>',r'<button type="button" id="s22-menu" class="{{ menuCls }}" aria-haspopup="dialog" aria-expanded="{{ menuStr }}" onClick="{{ toggleMenu }}">\1Menu</button>',s,flags=re.S); assert n==1,n

# 5. Behind the menu: Home, or the page that was opened (screen 4), with its own breadcrumb; the page is blurred only while the menu is open
one('<main class="mn" style="filter:blur(4px) brightness(.45)">','<main class="mn" style="{{ mnStyle }}">')
m=re.search(r'<div class="bcr"[^>]*>',s); i=m.start(); j=s.index('</nav>',i)+6; k=s.index('</div>',j)+6
nav=s[m.end():k-6]; k_main=s.index('</main>')
home=s[k:k_main]; assert home.count('<section')==3
CR=('<nav class="cb" aria-label="Breadcrumb"><button type="button" class="ap">{{ crumbApp }}</button><button type="button">{{ crumbPage }}</button>'
    +hole('crumbSub','false')+'<button type="button">{{ crumbSub }}</button></sc-if></nav>')
PAGE=('<section class="pn" style="grid-column:span 12"><div class="pt">{{ openedTitle }}</div><div class="s22p"><span>Grafana content for {{ openedDesc }}</span></div></section>')
s=s[:i]+m.group(0)+hole('isHome','true')+nav+'</sc-if>'+hole('isPage','false')+CR+'</sc-if></div>'+hole('isHome','true')+home+'</sc-if>'+hole('isPage','false')+PAGE+'</sc-if>'+s[k_main:]

# 7. Title, styles, logic
one('<title>Menu, app dropdown open</title>','<title>Menu flow</title>')
lca=''.join(re.findall(r'\.p\.lca[^{}]*\{[^}]*\}',open(P+'AppsAdd.dc.html').read()))
assert '.a-setup' in lca
CSS=(lca+'\n.s22s{position:absolute;inset:0;z-index:3;border-radius:inherit}'
 '\n.s22p{min-height:320px;display:grid;place-items:center;border-radius:6px;border:1px dashed rgba(204,204,220,.3);background:repeating-linear-gradient(135deg,rgba(204,204,220,.05) 0 10px,transparent 10px 20px);color:#9fa7b3}\n')
one('</style>\n</helmet>',CSS+'</style>\n</helmet>')
a=s.index('class Component extends DCLogic'); b=s.index('</script>',a)
# 7c. C06 MenuSheet (owner, 2026-11-20): the sheet becomes a shared component. S22 mounts it and the Dock (C01) and keeps only the
# shared state; both logics get the same mock data (tools/s22/mock.js).
MOCK=re.sub(r'^//.*$','',open(T+'mock.js').read(),flags=re.M)
def logic(f): return open(T+f).read().replace('/*MOCK*/',MOCK)
def div_end(t,i):
    d=0
    for m in re.finditer(r'<div\b|</div>',t[i:]):
        d+=1 if m.group(0)=='<div' else -1
        if d==0: return i+m.end()
i=s.index('<div class="sh3"'); j=div_end(s,i); sheet=s[i:j]
FONT="color:#eceef1;font:400 14px/22px 'Inter','Helvetica','Arial',sans-serif"
a='<div class="sh3" role="dialog" aria-label="Menu" onKeyDown="{{ sheetKey }}">'; assert sheet.startswith(a)
sheet=f'<div class="sh3" role="dialog" aria-label="Menu" onKeyDown="{{{{ sheetKey }}}}" style="{FONT};{{{{ pos }}}}">'+sheet[len(a):]
sheet=sheet.replace('id="s22-rsw"','id="ms-rsw"')
# group tabs (S10 Administration: General / Plugins and data / Access) between the header and the tiles; arrows move between tabs
TABS=('<sc-if value="{{ hasGroups }}" hint-placeholder-val="{{ false }}"><div class="mzs" role="tablist" aria-label="{{ pageName }} groups" onKeyDown="{{ tabKey }}">'
      '<sc-for list="{{ groups }}" as="g" hint-placeholder-count="3"><button type="button" id="{{ g.id }}" class="{{ g.cls }}" role="tab" aria-selected="{{ g.sel }}" onClick="{{ g.pick }}">'
      '<span>{{ g.label }}</span><em>{{ g.count }}</em></button></sc-for></div></sc-if>')
x='<sc-if value="{{ loading }}" hint-placeholder-val="{{ false }}"><div class="mzg">'; assert sheet.count(x)==1
sheet=sheet.replace(x,TABS+x)
SPROPS={k:{"editor":None} for k in ['app','bm','loading','viewer','appsOpen','page','focus','anchored','onPickApp','onToggle','onOpen','onClose','onToggleApps']}
SPROPS['$preview']={"width":1112,"height":500}
head=s[:s.index('</helmet>')+9].replace('<title>Menu flow</title>','<title>Menu sheet</title>')
open(P+'CmpMenuSheet.dc.html','w').write(head+'\n'+sheet+"\n</x-dc>\n<script type=\"text/x-dc\" data-dc-script data-props='"+json.dumps(SPROPS,separators=(',',':'))+"'>\n"+logic('sheet.js')+"</script>\n</body>\n</html>\n")
subprocess.run([sys.executable,ROOT+'tools/cmp_css.py','CmpMenuSheet.dc.html'],check=True,capture_output=True)
s=s[:i]+('<dc-import name="CmpMenuSheet" anchored="true" app="{{ app }}" bm="{{ bm }}" loading="{{ loading }}" viewer="{{ viewer }}" apps-open="{{ appsOpen }}" '
         'on-pick-app="{{ pickApp }}" on-toggle="{{ toggleBm }}" on-open="{{ openPage }}" on-close="{{ closeMenu }}" on-toggle-apps="{{ toggleApps }}" hint-size="1080px,470px"></dc-import>')+s[j:]
i=s.index('<nav class="dk"'); j=s.index('</nav>',i)+6
s=s[:i]+('<dc-import name="CmpDock" active-app="{{ dockApp }}" bookmarks="{{ dockBms }}" selected="none" open-overlay="{{ dockOverlay }}" loading="{{ loading }}" '
         'bm="{{ bm }}" on-add-bookmark="{{ toggleAdd }}" on-toggle-bookmark="{{ toggleBm }}" menu-id="s22-menu" on-menu="{{ toggleMenu }}" on-apps="{{ toggleSwitcher }}" on-pick-app="{{ pickApp }}" on-key="{{ sheetKey }}" hint-size="760px,58px"></dc-import>')+s[j:]
a=s.index('class Component extends DCLogic'); b=s.index('</script>',a)
s=s[:a]+logic('logic.js')+s[b:]
open(P+OUT,'w').write(s)
subprocess.run(['node',T+'check.js'],check=True)

# 7b. R03 scope map: one row for S22, after S20
r=open(P+'RefScope.dc.html').read()
if 'S22 · MenuSheet' not in r:
    b=r.index('</tr>',r.index('S20 · DockBookmarkAdd'))+5
    row=('<tr><td>S22 · MenuSheet: menu flow</td><td><span class="rtg tc">Custom</span></td><td>The menu as one flow with one shared state: Home, Menu, Apps, Page. Every state is reached by a real click, for example Energy in the app list shows an app with no pages yet. '
         'Esc and a click outside close the menu, opening a page closes it, and focus returns to the Menu button. A tile click opens the page; the arrow keys only move focus. Monitoring has no loading state and uses the same bookmarks as the other apps. '
         'S02, S07 and S19 stay as static references</td><td><span style="color:#8d939c">None</span></td></tr>')
    open(P+'RefScope.dc.html','w').write(r[:b]+row+r[b:])

# 8. Canvas: one new board in the menu row, after S20; the row title names S22
cj=json.load(open(P+'canvas.json')); c=cj['boards']
if OUT not in c:
    c[OUT]={'expand':'fill','h':900,'title':'S22 · MenuSheet: menu flow','w':1440,'x':10920,'y':11888,'is_interactive':True}
    o=cj['order']; o.insert(o.index('DockBookmarkAdd.dc.html')+1,OUT)
if 'CmpMenuSheet.dc.html' not in c:
    c['CmpMenuSheet.dc.html']={'h':500,'title':'C06 · MenuSheet: component','w':1112,'x':6240,'y':12260,'is_interactive':True}
    o=cj['order']; o.insert(o.index('CmpAppSwitcher.dc.html')+1,'CmpMenuSheet.dc.html')
r3=cj['notes']['r3']
if 'S22' not in r3['text']:
    old='the add-bookmark popover (R07, R08 → S02, S07, S10, S19, S20)'; assert old in r3['text'],r3['text']
    r3['text']=r3['text'].replace(old,'the add-bookmark popover, then the whole menu flow (R07, R08 → S02, S07, S10, S19, S20, S22)'); r3['maxW']=12360
json.dump(cj,open(P+'canvas.json','w'),indent=1)

# 9. N5: S04, S06, S08, S11 and S20 only get a link to S22
# The link sits in the top bar, in the free space left of Search: it adds no height, so lc_fit has nothing to chase
LINK=('<a data-s22 href="DockMenuFlow.dc.html" style="flex:none;white-space:nowrap;color:#6ccfdc;font:500 12px/18px \'Inter\',\'Helvetica\',\'Arial\',sans-serif">Flow: S22 · Menu flow</a>')
for f in ['DockUser','ExtSwitch','ExtAdd','AppsPin','DockBookmarkAdd']:
    t=open(P+f+'.dc.html').read()
    if 'data-s22' in t or 'name="CmpTopBar"' in t: continue  # a composed board carries the link as a TopBar prop (lc_compose)
    x='<span style="flex:1"></span><button type="button" class="p" aria-label="Search"'; assert t.count(x)==1,f
    open(P+f+'.dc.html','w').write(t.replace(x,'<span style="flex:1"></span>'+LINK+'<button type="button" class="p" aria-label="Search"'))
print('s22 ok')
