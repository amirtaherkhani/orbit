import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
import re,sys
sys.path.insert(0,ROOT+'tools')
from lifecycle_kit import *
f=ROOT+'project/AppsAdd.dc.html'; s=open(ROOT+'pre_lifecycle/AppsAdd.dc.html').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:70],s.count(a)); s=s.replace(a,b)
BS='flex:none;height:30px;min-height:30px;padding:0 12px;gap:6px;white-space:nowrap'
def btn(lbl,cls='p pri',href=None):
    if href: return f'<a class="{cls}" href="{href}" style="{BS};text-decoration:none">{lbl}</a>'
    return f'<button type="button" class="{cls}" style="{BS}">{lbl}</button>'
def foot(btns,hint=''):
    return '<div class="acf">'+''.join(btns)+(f'<span class="acs"><span class="k">{hint}</span></span>' if hint else '')+'</div>'
# header
rep('All apps installed in this Grafana, for Main Org. Finish setup, or open Manage on an app.','Apps installed in this Grafana, for Main Org. An app is initialized, reviewed, set up, validated and migrated before it is enabled. You see the actions you are allowed to take.')
rep('>All 4</button>','>All 5</button>'); rep('>Added 1</button>','>Enabled 2</button>'); rep('>Available 3</button>','>Needs action 3</button>')
# status tiles (not buttons)
m=re.search(r'<button type="button" class="bd s-ad pt"[^>]*>.*?</button>',s,flags=re.S); s=s.replace(m.group(0),tile('enabled'),1)
ms=list(re.finditer(r'<button type="button" class="bd s-av pt"[^>]*>.*?</button>',s,flags=re.S)); assert len(ms)==2
s=s[:ms[1].start()]+tile('review')+s[ms[1].end():]
s=s[:ms[0].start()]+tile('enabled')+s[ms[0].end():]
rep('<span class="bd s-ns">Needs setup</span>',tile('setupwip',' style="margin-left:auto"'))
rep('<small>v0.2.0 · added 09:22 · New after setup</small>','<small>v0.2.0 · discovered 08:52</small>')
# meta rows + footers, card by card
cards=[m.start() for m in re.finditer(r'<article class="ac',s)]; assert len(cards)==4
rep('<small>v0.3.2</small>','<small>v0.3.2 · enabled 09:10</small>')
cards=[m.start() for m in re.finditer(r'<article class="ac',s)]
def card(i): 
    a=cards[i]; b=s.index('</article>',a); return a,b
# 3: Energy
a,b=card(3); c=s[a:b]
c=c.replace('<span><i class="dt o"></i>Not initialized</span>',label('setupwip'))
c=re.sub(r'<div class="acf">.*?</div>$',foot([abtn('setup','Continue setup',href='AppSetup.dc.html')],'Step 3 of 6'),c,flags=re.S)
s=s[:a]+c+s[b:]
# 2: Quality
a,b=card(2); c=s[a:b]
c=c.replace('<span><i class="dt"></i>Initialized</span>',label('review'))+foot([abtn('review','Review',href='AddAppFlow.dc.html')],'Step 2 of 6')
s=s[:a]+c+s[b:]
# 1: Maintenance (enabled most recently)
a,b=card(1); c=s[a:b]
c=c.replace('<span><i class="dt"></i>Initialized</span>',label('enabled'))+'@@MFOOT@@'
s=s[:a]+c+s[b:]
# 0: Management
a,b=card(0); c=s[a:b]
c=c.replace('<span><i class="dt"></i>Initialized</span>',label('enabled'))
mm=re.search(r'<div class="acf">(<button.*?</button>)</div>$',c,flags=re.S); manage=mm.group(1)
manage=manage.replace('<button type="button" class="p gh2"','<a href="AppManage.dc.html" class="p gh2"').replace('</button>','</a>').replace('white-space:nowrap"','white-space:nowrap;text-decoration:none"')
c=c[:mm.start()]+foot([btn('Open','p gh2'),manage])
s=s[:a]+c+s[b:]
s=s.replace('@@MFOOT@@',foot([btn('Open','p gh2'),manage]))
# 4: Safety, not initialized (neutral tile until icon and colour are set in Setup)
m4=re.search(r'<article class="ac"><div class="ach"><span class="tl" style="([^"]*)">',s)
ts=re.sub(r'background:[^;]*','background:#262a31',m4.group(1)); ts=re.sub(r'(?<![-\w])color:[^;]*','color:#c9cdd3',ts)
safety=('<article class="ac"><div class="ach"><span class="tl" style="'+ts+'"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg></span><div class="act"><b>Safety</b><small>v0.4.0 · discovered 09:05</small></div>'+tile('notinit')+'</div><p>Incident reports and safety walks.</p><div class="mr"><span>3 pages</span>'+label('notinit')+'</div>'+foot([abtn('init','Initialize')],'Step 1 of 6')+'</article>')
i4=s.index('<div class="help">'); s=s[:i4]+safety+s[i4:]
# help card
rep('<b>Not in the list?</b><span>An app shows up here once it ships an app manifest and Grafana has initialized it.</span>',
    '<b>Not in the list?</b><span>Install the app plugin with <code style="font:400 12px/18px \'Roboto Mono\',monospace;color:#c9cdd3">grafana-cli plugins install &lt;app-id&gt;</code>, then restart Grafana. The app appears here as Not initialized.</span>')
# preview panel
rep('<div class="apst"><span class="chp">Available</span><span class="chp ok">Initialized</span></div>',
    '<div class="apst">'+chip('enabled')+'<span class="nw2" style="margin-left:0">New</span></div><div class="lcm" role="img" aria-label="Lifecycle: all 6 steps done"><i class="lcd"></i><i class="lcd"></i><i class="lcd"></i><i class="lcd"></i><i class="lcd"></i><i class="lcd"></i></div><p class="apf" style="margin:-4px 0 0">All six steps are done. Authorized users can open the app. “New” marks the app enabled most recently.</p>')
rep('<dt>In this Grafana</dt><dd>Not added</dd>','<dt>Status</dt><dd>Enabled</dd>')
rep('<dt>Setup</dt><dd>Done</dd>','<dt>Enabled</dt><dd>Today 09:10</dd>')
rep('Pages come from the app. Bookmark them after you add the app.','Pages the app registers. Authorized users can open and bookmark them.')
for a_,b_ in [('min-height:1200px','min-height:1360px'),('min-height:1172px','min-height:1332px'),('"height":1200','"height":1360')]: rep(a_,b_)
k=s.index('.apf{'); s=s[:k]+CSS+'.lcm{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}.lcm i{height:4px;border-radius:2px;background:#2a2e35}.lcm i.lcd{background:#73bf69}.lcm i.lcc{background:#fbad37}.ach>.lst{margin-left:auto}.acf a.p{display:inline-flex;align-items:center}'+s[k:]
open(f,'w').write(s)
import re as _r
print('left:',_r.findall(r'Added|Available|Initialized<|Needs setup|Not added',s))
