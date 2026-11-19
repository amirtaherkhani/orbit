import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
"""Last step: wording shared across boards, run after the other lc_* scripts."""
import json,re
P=ROOT+'project/'
c=json.load(open(P+'canvas.json')); names=list(c['boards'])
pairs=[('R10 · AppsView and DockPagesView','R10 · Apps, app lifecycle and bookmarks'),('S16 · AppSetupView: set up app','S16 · AppLifecycleView: setup, validate, migrate, enable'),('S16 · AppSetupView','S16 · AppLifecycleView'),('S18 · AddAppFlow: check','S18 · AppLifecycleView: initialize and review'),('S18 · AddAppFlow','S18 · AppLifecycleView'),
 ('<title>Add app view</title>','<title>S12 · Apps</title>'),('<title>S17 · AddAppMenu: open</title>','<title>S17 · AppSwitcher: Apps row</title>'),
 ("count: dis ? 'Needs setup' :","count: dis ? 'Not enabled' :"),("sub: 'Needs setup', pages: []","sub: 'Not enabled yet', pages: []")]
for n in names:
    s=open(P+n).read(); o=s
    for a,b in pairs: s=s.replace(a,b)
    if s!=o: open(P+n,'w').write(s); print('post:',n)
