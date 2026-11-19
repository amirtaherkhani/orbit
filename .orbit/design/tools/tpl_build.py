import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
# Page templates P03-P07 and the button zones on P01 (owner, 2026-11-16).
# Starts from tools/tpl_base/ (the templates as they were before the button zones), so it can run any number of times.
# Grafana v13.3.0 positions used here (verified):
#  - Page header actions, right aligned: PageHeader.tsx actions slot; plugin page passes PluginActions (InstallControls, then Enable/Disable).
#  - Info panel: PluginDetailsPanel.tsx, information and a links box, no state actions.
#  - Settings forms: submit button after the fields, left aligned (OrgProfile.tsx, SharedPreferences.tsx).
#  - Dashboard actions: NavToolbarActions -> AppChromeUpdate -> chrome actions, drawn in the top bar next to the breadcrumbs.
#  - Drawer: Close at top right (Drawer.tsx); form footer primary first (SaveDashboardForm.tsx).
import re,json
G=ROOT+''; B=G+'tools/tpl_base/'; P=G+'project/'
def rd(f): return open(B+f).read()
def wr(f,s): open(P+f,'w').write(s)
def one(s,a,b):
    assert s.count(a)==1,(a[:90],s.count(a)); return s.replace(a,b)
BCSS=('.pgph-btn.dg{color:#ff5286;border-color:rgba(255,82,134,.55);background:transparent}'
      '.pgph-btn.lc{color:#b877d9;border-color:rgba(184,119,217,.55);background:transparent}'
      '.pgph-btn.sm{height:28px;padding:0 10px;font-size:12px}.pgph-ib{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:4px;border:1px solid rgba(204,204,220,.2);color:#c9cdd3;font:500 14px/1 Inter,sans-serif}')
def css(s): k=s.index('</style>'); return s[:k]+BCSS+s[k:]
G_='<span class="rtg ts">Grafana</span>'; C_='<span class="rtg tc">Custom</span>'; V_='<span class="rtg tv">Verified in v13.3.0</span>'
DEC='<span class="rtg tc">Decided</span>'
def row(*c): return '<tr>'+''.join(f'<td>{x}</td>' for x in c)+'</tr>'
def add_rows(s,after_text,rows):
    i=s.index(after_text); j=s.index('</tr>',i)+5; return s[:j]+''.join(rows)+s[j:]
ZREF='Button zones: see <b>P01 · Page contract</b>'

# P03 Standard: header shows the full order of a header action group.
f='PageShell.dc.html'; s=rd(f)
s=one(s,'<div style="display:flex;gap:8px"><span class="pgph-btn">Secondary</span><span class="pgph-btn pr">Primary action</span></div>',
      '<div style="display:flex;gap:8px"><span class="pgph-btn dg">Destructive</span><span class="pgph-btn">Secondary</span><span class="pgph-btn pr">Primary action</span></div>')
s=add_rows(s,'<td>Header: title, subtitle, info, actions</td>',[row('Header action order',G_,
  'Right aligned, gap 8: destructive, secondary, then one primary last. Page and object actions only. '+ZREF,V_)])
wr(f,css(s))

# P04 Dashboard: actions take Grafana's place, the right end of the breadcrumb row (Grafana draws chrome actions in the top bar next to the breadcrumbs).
f='PageDashboard.dc.html'; s=rd(f)
s=one(s,'<div class="rg dc" style="padding:10px 16px"><span class="pgl">Actions · decision</span><span class="pgph-s">Save, Share, Edit</span></div>','')
m=re.search(r'(<div class="bcr"><nav aria-label="Breadcrumb" class="cb">.*?</nav>)(</div>)',s,re.S); assert m
s=s.replace(m.group(0),m.group(1)+'<div class="rg pgph" style="margin-left:auto;padding:6px 10px;display:flex;gap:8px;align-items:center"><span class="pgl">Actions · Grafana position</span><span class="pgph-btn sm">Edit</span><span class="pgph-btn sm">Share</span><span class="pgph-btn sm pr">Save</span></div>'+m.group(2),1)
s=one(s,'<td>Where page actions go</td><td><span class="rtg td">Decision needed</span></td><td>The custom top bar has no slot for <code>actions</code>. Options: a slot in the top bar, a row in the page, or the controls row shown here.</td>',
      '<td>Where page actions go</td><td>'+DEC+'</td><td>Grafana’s place: the chrome <code>actions</code> render at the right end of the breadcrumb row (in Grafana the breadcrumbs and actions share the top bar). Primary last. Decided 2026-11-16.</td>')
s=s.replace('</style>','.bcr{display:flex;align-items:center;gap:12px}</style>',1)
wr(f,css(s))

# P05 Settings: Grafana puts the submit button after the fields, left aligned; not sticky.
f='PageSettings.dc.html'; s=rd(f)
s=one(s,'<div class="rg dc" style="padding:12px 16px"><span class="pgl">Save bar · Decision needed</span><div style="display:flex;justify-content:flex-end;gap:8px"><span class="pgph-btn">Discard</span><span class="pgph-btn pr">Save changes</span></div></div>',
        '<div class="rg pgph" style="padding:12px 16px"><span class="pgl">Save row · Grafana, end of the form</span><div style="display:flex;gap:8px"><span class="pgph-btn pr">Save changes</span><span class="pgph-btn">Discard</span></div></div>')
s=one(s,'<td>Sticky save bar</td><td><span class="rtg td">Decision needed</span></td><td>A bar pinned to the bottom of the page sits under the floating dock. Keep it above the dock, put it in the header, or place it at the end of the form.</td>',
        '<td>Save row</td><td>'+DEC+'</td><td>Grafana’s settings forms put the submit button after the fields, left aligned (<code>OrgProfile.tsx</code>, <code>SharedPreferences.tsx</code>). Not sticky, so it never sits under the dock. Primary first, then Discard. Decided 2026-11-16.</td>')
wr(f,css(s))

# P06 List: name the row action column.
f='PageList.dc.html'; s=rd(f)
s=s.replace('<div class="pgph-s">Actions</div>','<div class="pgph-s">Row actions</div>',1)
s=add_rows(s,'<td>Header and primary action</td>',[row('Button zones',G_,'Header: page actions (New item). Toolbar: search, filter, sort and view only. Row actions: icon buttons at the end of the row. '+ZREF,V_)])
wr(f,css(s))

# P07 Detail page with info panel (new), from the P03 shell.
f='PageDetail.dc.html'; s=rd('PageShell.dc.html')
i=s.index('<div style="grid-column:span 12;display:flex;flex-direction:column;gap:16px;min-height:560px">'); j=s.index('</main>',i)
body=('<div style="grid-column:span 12;display:flex;flex-direction:column;gap:16px;min-height:560px">'
 '<div class="rg pgph"><span class="pgl">Page header · zone 1</span><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap">'
 '<div><h1 style="margin:0;font:400 28px/32px Inter,Helvetica,Arial,sans-serif;color:#eceef1">Object name</h1><div style="margin-top:6px;color:#9fa7b3;font:400 14px/22px Inter,Helvetica,Arial,sans-serif">id · version · status</div></div>'
 '<div style="display:flex;gap:8px;flex-wrap:wrap"><span class="pgph-btn dg">Uninstall</span><span class="pgph-btn dg">Disable</span><span class="pgph-btn lc">Lifecycle step</span><span class="pgph-btn">Settings</span><span class="pgph-btn pr">Open</span></div></div></div>'
 '<div class="rg pgph" style="padding:8px 16px 0"><span class="pgl">Tabs · PageTabs</span><div class="tabs"><span class="tab sel">Overview</span><span class="tab">Pages</span><span class="tab">Health</span></div></div>'
 '<div style="display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:16px;align-items:start">'
 '<div style="display:flex;flex-direction:column;gap:16px">'
 '<div class="rg pgph"><span class="pgl">Card · zone 3 header action, zone 4 footer</span><div style="display:flex;justify-content:space-between;align-items:center"><div class="pgph-t">Card title</div><span class="pgph-btn sm">Card action</span></div>'
 '<div class="pgph-s" style="margin:12px 0">Card content</div><div style="display:flex;gap:8px;align-items:center"><span class="pgph-btn sm lc">Step action</span><span class="pgph-btn sm">Secondary</span><span class="pgph-s" style="margin-left:auto">Status text</span></div></div>'
 '<div class="rg pgph"><span class="pgl">Field · zone 5 inline action</span><div style="display:flex;gap:8px;align-items:center"><div class="pgph-in" style="flex:1"></div><span class="pgph-btn sm">Test connection</span></div></div>'
 '<div class="rg pgph"><span class="pgl">Drawer or task panel · zone 7</span><div style="display:flex;justify-content:space-between;align-items:center"><div class="pgph-t">Panel title</div><span class="pgph-ib">×</span></div>'
 '<div class="pgph-s" style="margin:12px 0">Form fields</div><div style="display:flex;gap:8px"><span class="pgph-btn sm pr">Save</span><span class="pgph-btn sm">Cancel</span><span class="pgph-btn sm dg" style="margin-left:auto">Reset</span></div></div>'
 '</div>'
 '<div class="rg pgph" style="min-height:300px"><span class="pgl">Info panel · zone 6, no state actions</span><div class="pgph-t">About</div><div class="pgph-s" style="margin:6px 0 14px">Details, version, notes, who can act</div>'
 '<div class="rg" style="padding:12px;display:flex;flex-direction:column;gap:8px"><span class="pgl">Links</span><span class="pgph-btn sm" style="justify-content:center">Documentation</span><span class="pgph-btn sm" style="justify-content:center">Repository</span></div></div>'
 '</div>'
 '<div class="rg cu" style="height:80px;margin-top:auto;border-style:dotted"><span class="pgl">Dock clearance · about 80px (proposal)</span></div></div>')
s=s[:i]+body+s[j:]
s=re.sub(r'<title>[^<]*</title>','<title>P07 · Page template: Detail with info panel</title>',s,count=1)
s=s.replace('aria-current="page" aria-haspopup="menu" aria-expanded="false">Page title','aria-current="page" aria-haspopup="menu" aria-expanded="false">Object name',1)
k=s.index('class="pg pgdocs">'); e=s.index('</x-dc>')
docs=('class="pg pgdocs"><h2 style="margin:0 0 6px;font:500 16px/22px Inter,sans-serif;color:#fff">Detail page with info panel</h2>'
 '<p class="lead" style="margin:0 0 14px;max-width:900px;color:#aeb4bd">One object (an app, a plugin, a data source) with tabs and a right info panel. Every button zone that a detail page can have is drawn here. Used by S15, S16 and S18.</p>'
 '<table class="mt fx"><colgroup><col style="width:22%"><col style="width:14%"><col style="width:44%"><col style="width:20%"></colgroup><thead><tr><th>Region</th><th>Owner</th><th>Grafana source</th><th>Status</th></tr></thead><tbody>'
 +row('Header actions',G_,'<code>PageHeader</code> <code>actions</code>; the plugin page passes <code>PluginActions</code>: Uninstall, then Enable or Disable (destructive), right aligned. Our order: destructive, lifecycle step, secondary, primary last',V_)
 +row('Tabs',G_,'<code>PageTabs</code>',V_)
 +row('Info panel',G_,'<code>PluginDetailsPanel</code>: information and a links box only, no state actions',V_)
 +row('Card and step actions',C_,'Header right: one action for the card. Footer left: the step action first, status text on the right',C_)
 +row('Drawer',G_,'<code>Drawer</code>: Close at the top right. Footer: primary first, Cancel, then Reset or Remove after a gap (<code>SaveDashboardForm</code>)',V_)
 +row('Permissions',G_,'A button the user may not use is hidden, not disabled (<code>PluginActions</code> hides install controls without <code>plugins:install</code>)',V_)
 +'</tbody></table></div></div>')
s=s[:k]+docs+'\n'+s[e:]
wr(f,css(s))

# P01 button zones table (replaces the block between the two headings).
f='PageSpec.dc.html'; s=open(P+f).read()
Z=[('1. Page header, top right','Page and object actions, right aligned, gap 8: destructive (Uninstall, Disable, Delete), lifecycle step, secondary (Plugin settings, Check for updates), primary last (Open app, New). On a dashboard the same group sits at the right end of the breadcrumb row.','S12, S15, S16, S18, P03, P04, P07','<code>PageHeader.tsx</code> actions; <code>PluginActions.tsx</code>; chrome <code>actions</code>',G_),
 ('2. Toolbar row','Search, filters, tabs, sort and view toggles. No action buttons.','S11, S12, P06','Grafana list pages',G_),
 ('3. Card or section header, right','One secondary action for that card (Run checks, Change in setup).','S15, P07','Design rule',C_),
 ('4. Card or step footer, left','The card or step action first, other buttons after it, status text on the right.','S12 cards, S16, S18, P07','Design rule',C_),
 ('5. Inline, next to a field','One secondary button for that field (Test connection, Add a team or user).','S16, P07','Grafana forms',G_),
 ('6. Right info panel','Information and a links box only (documentation, repository). No state actions; those are in zone 1.','S12, S15, S16, S18, P07','<code>PluginDetailsPanel.tsx</code>',G_),
 ('7. Drawer or task panel','Close (×) at the top right. Footer left aligned: primary first, Cancel or Edit, then Reset or Remove after a gap.','S11, R10, P07','<code>Drawer.tsx</code>, <code>SaveDashboardForm.tsx</code>',G_),
 ('8. Form end','Save row after the fields, left aligned, primary first. Not sticky.','P05','<code>OrgProfile.tsx</code>, <code>SharedPreferences.tsx</code>',G_),
 ('9. Table row','Icon buttons at the end of the row.','P06','Grafana tables',G_),
 ('10. Empty and error states','Centred, one button.','P02','<code>EmptyState</code>',G_),
 ('11. Modal','Buttons on the right: Cancel, primary last.','None yet','<code>Modal.ButtonRow</code>',G_)]
V=[('Primary (white)','One per zone at most. Always last in a right-aligned group, first in a left-aligned group.'),
 ('Lifecycle colour','Only lifecycle steps (Initialize, Review, Setup, Enable, Migrate, Retry).'),
 ('Secondary (outline)','Everything else.'),
 ('Destructive (red outline)','Uninstall, Disable, Remove, Delete, Disconnect, as in Grafana (Disable is <code>variant="destructive"</code> in <code>GetStartedWithApp.tsx</code>). First in a right-aligned header group, last in a left-aligned footer.'),
 ('Not allowed or not applicable','Hidden, not disabled. A hidden button never replaces backend authorization.')]
tb=('<table class="mt fx"><colgroup><col style="width:17%"><col style="width:43%"><col style="width:14%"><col style="width:16%"><col style="width:10%"></colgroup><thead><tr><th>Zone</th><th>What goes there</th><th>Boards</th><th>Source</th><th>Owner</th></tr></thead><tbody>'
 +''.join(f'<tr><td>{a}</td><td>{b}</td><td>{c}</td><td>{d}</td><td>{e}</td></tr>' for a,b,c,d,e in Z)+'</tbody></table>'
 '<h3 style="margin:16px 0 8px">Button kinds</h3><table class="mt fx"><colgroup><col style="width:22%"><col style="width:78%"></colgroup><thead><tr><th>Kind</th><th>Rule</th></tr></thead><tbody>'
 +''.join(f'<tr><td>{a}</td><td>{b}</td></tr>' for a,b in V)+'</tbody></table>')
i=s.index('<h2>Button zones</h2>'); j=s.index('<h2>Page props</h2>')
s=s[:i]+'<h2>Button zones</h2><p class="lead" style="margin:0 0 10px">Every button sits in one of these zones. Positions follow Grafana v13.3.0; the design rules (zones 3 and 4) only cover places Grafana has no rule for. P07 draws all of them.</p>'+tb+s[j:]
open(P+f,'w').write(s)

# canvas: P07 next to P06
cj=json.load(open(P+'canvas.json')); c=cj['boards']
if 'PageDetail.dc.html' not in c:
    p6=c['PageList.dc.html']; c['PageDetail.dc.html']={'expand':'fill','h':1600,'title':'P07 · Page template: Detail with info panel','w':1440,'x':p6['x']+1560,'y':p6['y']}
    if 'order' in cj and 'PageDetail.dc.html' not in cj['order']: cj['order'].append('PageDetail.dc.html')
    json.dump(cj,open(P+'canvas.json','w'),indent=1)
print('templates built')
