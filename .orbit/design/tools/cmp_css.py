import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
# Trim a component board's stylesheet to the rules its own markup uses.
# The canvas re-runs a child board's <helmet> inside every board that imports it, so a component that carried a whole
# screen's stylesheet would override that screen's own layout rules (.a, .s min-heights). Usage: cmp_css.py CmpDock.dc.html ...
import re,sys
def split(css):
    out=[];d=0;cur=''
    for ch in css:
        cur+=ch
        if ch=='{': d+=1
        elif ch=='}':
            d-=1
            if d==0: out.append(cur); cur=''
    return out,cur
def keep(rule,used):
    sel=rule[:rule.index('{')]
    if sel.strip().startswith('@'):  # @keyframes and @media: keep when any class inside is used
        return any(c in used for c in re.findall(r'\.([\w-]+)',rule)) or 'keyframes' in sel
    cls=re.findall(r'\.([\w-]+)',sel)
    if not cls: return True  # element and global rules (html, body, button, *) are the same on every board
    return any(all(c in used for c in re.findall(r'\.([\w-]+)',part)) for part in sel.split(','))
for name in sys.argv[1:]:
    f=ROOT+'project/'+name; s=open(f).read()
    body=s[s.index('</helmet>'):s.index('</x-dc>')]
    used=set(c for m in re.findall(r'class="([^"]*)"',body) for c in re.sub(r'\{\{.*?\}\}',' ',m).split())
    # classes the logic adds through holes ({{ wsCls }} gives 'n ws on'): every word in the script's quoted strings
    used|=set(w for q in re.findall(r"'([\w -]+)'",s[s.index('class Component'):]) for w in q.split())
    a=s.index('<helmet>'); b=s.index('</helmet>')
    h=s[a:b]
    def trim(m):
        rules,rest=split(m.group(2)); kept=[r for r in rules if keep(r,used)]
        return m.group(1)+''.join(kept)+rest+m.group(3)
    h2=re.sub(r'(<style>)(.*?)(</style>)',trim,h,flags=re.S)
    open(f,'w').write(s[:a]+h2+s[b:]); print(name,len(h),'->',len(h2))
