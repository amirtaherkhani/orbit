import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
# OD28 (owner, 2026-11-17): Migrate runs after Enable. Fixes the step order in wording that the reference builders
# take from their snapshots. Runs after lc_s17.
P=ROOT+'project/'
PAIRS=[('Initialize, Review, Setup, Validate, Migrate and Enable','Initialize, Review, Setup, Validate, Enable and Migrate'),
       ('setup, validate, migrate, enable','setup, validate, enable, migrate')]
for f in ['RefChanges.dc.html','RefNew.dc.html','RefScope.dc.html']:
    s=open(P+f).read()
    for a,b in PAIRS: s=s.replace(a,b)
    open(P+f,'w').write(s)
# S21 (OD31, 2026-11-17): add the new board to the R03 scope tables
f='RefScope.dc.html'; t=open(P+f).read()
if 'AppUpdate.dc.html' not in t:
    a='<tr><td>S18 · AppLifecycleView: initialize and review</td>'; i=t.index(a); j=t.index('</tr>',i)+5
    t=t[:j]+'<tr><td>S21 · AppLifecycleView: after an update</td><td><span class="rtg tc">Custom</span></td><td>Lifecycle view after an update that needs an admin: what changed, rechecked steps, maintenance mode</td><td><span style="color:#8d939c">None</span></td></tr>'+t[j:]
    a='<tr><td><b style="font-weight:500;color:#eceef1">S18</b></td>'; i=t.index(a); j=t.index('</tr>',i)+5
    t=t[:j]+'<tr><td><b style="font-weight:500;color:#eceef1">S21</b></td><td>S21 · AppLifecycleView: after an update</td><td><code>AppUpdate.dc.html</code></td></tr>'+t[j:]
    open(P+f,'w').write(t)
print('od28 wording and S21 scope applied')
