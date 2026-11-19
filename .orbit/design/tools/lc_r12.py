import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
# Panel action rules (owner, 2026-11-16). Run after lc_s12, lc_flow, lc_s15, lc_r10, lc_post.
# Grafana v13.3.0 sources: PageHeader actions (PageHeader.tsx:51,69-75), plugin details right panel
# (PluginDetailsPanel.tsx:104-174), Drawer header Close (Drawer.tsx:155-163), drawer form footer (SaveDashboardForm.tsx:64-70,150-152).
import re,sys
sys.path.insert(0,ROOT+'tools')
from lifecycle_kit import abtn
P=ROOT+'project/'
LCSS=('.lkb{display:flex;flex-direction:column;gap:12px;margin-top:auto;padding:16px;border:1px solid rgba(204,204,220,.2);border-radius:6px}'
      '.lkb h4{margin:0}.lkb .p{justify-content:center;text-decoration:none}')
def rd(f): return open(P+f).read()
if '/*PageTreeRow*/' in open(P+'AppsAdd.dc.html').read():
    sys.exit('lc_r12: already applied. Run tools/build_all.sh, which rebuilds the boards first.')
def wr(f,s): open(P+f,'w').write(s)
def one(s,a,b):
    assert s.count(a)==1,(a[:80],s.count(a)); return s.replace(a,b)
def css(s):
    if '.lkb{' in s: return s
    k=s.index('</style>'); return s[:k]+LCSS+s[k:]
def links(*btns): return '<div class="lkb" aria-label="Links"><h4>Links</h4>'+''.join(btns)+'</div>'

# Grafana rule (owner chose Grafana's layout, 2026-11-16, pass 4). Verified in Grafana v13.3.0:
#  PluginDetailsPage passes PluginActions to the page header (PluginDetailsPage.tsx:87, usePluginPageExtensions.tsx:20).
#  PluginActions = InstallControls (Update / Uninstall, destructive) then GetStartedWithApp (Enable primary / Disable destructive),
#  right aligned (PluginActions.tsx:41-53, GetStartedWithApp.tsx:47-58). The right panel (PluginDetailsPanel) is information and links only.
#  Uninstall needs plugins:install (Maintainer role, granted to Grafana Server Admin only when plugin_admin_enabled; api.go:444-447,
#  accesscontrol.go:77-91). Disable writes the plugin setting (plugins:write, Org Admin) and is hidden for auto-enabled apps.
UNI='<button type="button" class="p gh2 dng">Uninstall</button>'; DIS='<button type="button" class="p gh2 dng">Disable</button>'
WHO=('<div><h4>Who can act</h4><p class="ptx" style="font-size:12px;line-height:18px">Uninstall: Grafana Server Admin, only when plugin admin is on '
     '(<code>plugin_admin_enabled</code>). Disable and Enable: Org Admin (<code>plugins:write</code>); not shown for an auto-enabled app. '
     'A button you are not allowed to use is not shown.</p></div>')
PLUG=re.search(r'<button type="button" class="p gh2" style="gap:6px">.*?Plugin settings</button>',rd('AddAppFlow.dc.html'),re.S).group(0)
f='AppManage.dc.html'; s=rd(f)
m=re.search(r'<div style="display:flex;flex-direction:column;gap:8px;margin-top:auto"><a class="p lca a-setup".*?Uninstall</button><p class="mu".*?</p></div>',s,re.S); assert m
s=s.replace(m.group(0),WHO)
s=one(s,'<button type="button" class="p gh2">Plugin settings</button><button type="button" class="p w">Open app</button>',
      UNI+DIS+abtn('setup','Open setup',href='AppSetup.dc.html',small=False)+PLUG+'<button type="button" class="p w">Open app</button>')
wr(f,s)
BACK='<div style="display:flex;flex-direction:column;gap:8px;margin-top:auto"><a class="p gh2" href="AppsAdd.dc.html" style="justify-content:center;text-decoration:none">Back to apps</a></div>'
for f in ['AddAppFlow.dc.html','AppSetup.dc.html']:
    s=rd(f)   # header: Uninstall, Plugin settings. Open app and Disable appear only after Enable.
    s=one(s,'<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+PLUG+'</div></section>',
          '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+UNI+PLUG+'</div></section>')
    s=one(s,BACK,WHO)
    wr(f,s)

# S11: edit panel = task panel. Grafana drawer forms: primary first, left-aligned; Reset to default last, after a gap.
f='AppsPin.dc.html'; s=rd(f)
if '<div class="pft"><sc-if value="{{ show_edit }}" hint-placeholder-val="{{ false }}"><button type="button" class="p w"' not in s:
    m=re.search(r'<div class="pft">(<sc-if value="\{\{ show_edit \}\}"[^>]*><button[^>]*class="p gh2 rs".*?</sc-if>)<span style="flex:1"></span><sc-if value="\{\{ show_edit \}\}"[^>]*>(<button type="button" class="p gh2" onClick="\{\{ toDetails \}\}">Cancel</button>)(<button type="button" class="p w" onClick="\{\{ toDetails \}\}">Save</button>)</sc-if>(<sc-if value="\{\{ show_details \}\}".*?</sc-if>)</div>',s,re.S); assert m
    op='<sc-if value="{{ show_edit }}" hint-placeholder-val="{{ false }}">'
    s=s.replace(m.group(0),'<div class="pft">'+op+m.group(3)+m.group(2)+'</sc-if>'+m.group(4)+'<span style="flex:1"></span>'+m.group(1)+'</div>')
    wr(f,s)

# R10 bookmark panel sample: same task-panel footer.
f='RefApps.dc.html'; s=rd(f)
s=one(s,'<div style="display:flex;gap:8px;margin-top:auto;justify-content:flex-end"><button type="button" class="p gh2">Cancel</button><button type="button" class="p w">Bookmark Explore</button></div>',
      '<div style="display:flex;gap:8px;margin-top:auto"><button type="button" class="p w">Bookmark Explore</button><button type="button" class="p gh2">Cancel</button></div>')
wr(f,s)
print('r12 applied')

# ---- Button arrangement pattern, pass 3 (owner, 2026-11-16) ----
# S12: "Check for updates" acts on the whole list -> page header, top right. The toolbar row keeps filters and search only.
f='AppsAdd.dc.html'; s=rd(f)
m=re.search(r'<button type="button" class="p gh2" style="gap:6px"><svg(?:(?!</button>).)*?</svg>Check for updates</button>',s,re.S); assert m
chk=m.group(0); s=s.replace(chk,'',1)
m=re.search(r'(<section style="grid-column:span 12;display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap">)(<div><h2 .*?</p></div>)',s,re.S); assert m
s=s.replace(m.group(0),m.group(1)+'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;width:100%">'+m.group(2)
            +'<div style="display:flex;gap:8px;align-items:center;flex:none">'+chk+'</div></div>',1)
wr(f,s)
# S16: footer of a step = primary first, left aligned.
f='AppSetup.dc.html'; s=rd(f)
s=one(s,'<div class="sact"><button type="button" class="p gh2">Save</button><button type="button" class="p lca a-setup">Save and validate</button>',
        '<div class="sact"><button type="button" class="p lca a-setup">Save and validate</button><button type="button" class="p gh2">Save</button>')
wr(f,s)
print('pass 3 applied')

# ---- PageTreeRow: one component for page trees (S20 bookmark popover, S12 app preview) (owner, 2026-11-16) ----
# Shared: indent 16px per level, chevron 24 (or 24px spacer), icon tile 32 radius 6 with a 16px icon,
# title 13/18 500, second line 12/18 secondary, row padding 6px 8px, gap 12px, radius 6, hover background.
# Page tile = app accent; sub page tile = neutral. Differences per use: S20 second line = description, trailing = state + bookmark toggle;
# S12 second line = path (mono) and, for a page, type · role · sub pages; no trailing control.
f='AppsAdd.dc.html'; s=rd(f)
m=re.search(r'<sc-if value="\{\{ r\.isPage \}\}" hint-placeholder-val="\{\{ true \}\}">(<span class="apt">.*?</span>)</sc-if>(<span class="apn">)',s,re.S); assert m
tile=m.group(1).replace('<span class="apt">','<span class="{{ r.tcls }}">',1)
s=s.replace(m.group(0),tile+m.group(2),1)
s=one(s,"i_list: p[1] === 'list', i_clock: p[1] === 'clock', name: p[2]","tcls: 'apt', i_list: p[1] === 'list', i_clock: p[1] === 'clock', name: p[2]")
s=one(s,"name: c[0], path: c[1], full: base + c[1], desc: c[2], tip: c[2] }));","tcls: 'apt sub', i_list: c[3] === 'list', i_clock: c[3] === 'clock', name: c[0], path: c[1], full: base + c[1], desc: c[2], tip: c[2] }));")
for a,b in [("['Open', '/orders/open', 'Work orders not closed yet.']","['Open', '/orders/open', 'Work orders not closed yet.', 'list']"),
            ("['Planned', '/orders/planned', 'Planned maintenance by date.']","['Planned', '/orders/planned', 'Planned maintenance by date.', 'clock']"),
            ("['Closed', '/orders/closed', 'Closed work orders.']","['Closed', '/orders/closed', 'Closed work orders.', 'list']"),
            ("['By cause', '/downtime/by-cause', 'Downtime minutes by cause.']","['By cause', '/downtime/by-cause', 'Downtime minutes by cause.', 'list']"),
            ("['By machine', '/downtime/by-machine', 'Downtime minutes by machine.']","['By machine', '/downtime/by-machine', 'Downtime minutes by machine.', 'clock']")]:
    s=one(s,a,b)
PT=('/*PageTreeRow*/.atr .apr,.atr .apr.sub{display:flex;align-items:center;gap:12px;padding:6px 8px;border-radius:6px;min-height:44px}'
    '.atr .apr:hover{background:rgba(204,204,220,.08)}'
    '.atr .apt{display:grid;place-items:center;width:32px;height:32px;border-radius:6px;flex:none}.atr .apt .i,.atr .apt svg{width:16px;height:16px}'
    '.atr .apt.sub{background:#2a2e35;color:#c9cdd3}'
    '.atr .apr .apn,.atr .apr.sub .apn{flex:1;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:0;min-width:0}'
    '.atr .apr .apn b,.atr .apr.sub b{font:500 13px/18px Inter,Helvetica,Arial,sans-serif;color:#fff}'
    '.atr .aprp{font:400 12px/18px "Roboto Mono",monospace;color:#9fa7b3}.atr .apds{font-size:12px;line-height:18px;color:#9fa7b3}')
k=s.index('</style>'); s=s[:k]+PT+s[k:]
wr(f,s)
print('PageTreeRow applied')
