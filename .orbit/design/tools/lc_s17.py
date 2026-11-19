import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
# S17 removal (owner, 2026-11-16): S17 duplicated S06. lc_refs rebuilds R01-R03 from pre_lifecycle snapshots, so the removal runs after it.
import re
P=ROOT+'project/'
for f in ['RefChanges.dc.html','RefNew.dc.html','RefScope.dc.html']:
    s=open(P+f).read()
    s=re.sub(r'<tr><td>(?:<b[^>]*>)?S17\b.*?</tr>','',s,flags=re.S)
    s=s.replace('S17 · AppSwitcher: Apps row','S06 · AppSwitcher: open')
    s=re.sub(r'S12 · AppsView: all apps, S17(?=<)','S12 · AppsView: all apps, S06 · AppSwitcher: open',s)
    s=re.sub(r'\bS17\b','S06',s)
    open(P+f,'w').write(s)
print('s17 removal applied')
