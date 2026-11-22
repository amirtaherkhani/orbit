import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
import sys
# Last build step: make every board's canvas height fit its rendered content (scrollHeight at the canvas height),
# then move later canvas rows down so rows keep an 80px gap. Screen boards that show a scrolling page are listed in SCROLLING.
import asyncio,json,os,re,subprocess
from playwright.async_api import async_playwright
G=ROOT+''; P=G+'project/'
SCROLLING={'DockDashboard.dc.html'}   # a 1440x900 screen; the dashboard scrolls under the dock by design
async def measure(names,c):
    out={}
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for f in names:
            r='/tmp/fit_'+f; subprocess.run([sys.executable,G+'tools/dcrender.py',P+f,r,'{}'],check=True,capture_output=True)
            pg=await b.new_page(viewport={"width":1440,"height":c[f]['h']})
            await pg.route("**/*", lambda q: q.abort() if not q.request.url.startswith("file:") else q.continue_())
            await pg.goto("file://"+r); await pg.wait_for_timeout(250)
            out[f]=await pg.evaluate("document.documentElement.scrollHeight"); await pg.close()
        await b.close()
    return out
cj=json.load(open(P+'canvas.json')); c=cj['boards']
sh=asyncio.run(measure([f for f in c if f not in SCROLLING],c))
grow={}
for f,h in sh.items():
    old=c[f]['h']
    if h<=old: continue
    new=-(-h//10)*10; s=open(P+f).read()
    s=s.replace(f'"height":{old}',f'"height":{new}').replace(f'min-height:{old}px',f'min-height:{new}px').replace(f'min-height:{old-28}px',f'min-height:{new-28}px')
    open(P+f,'w').write(s); c[f]['h']=new; grow[f]=new-old; print('fit',f,old,'->',new)
# keep files in step with canvas.json (a builder may write its own default height)
for f,v in c.items():
    s=open(P+f).read(); m=re.search(r'"\$preview":\{"width":1440,"height":(\d+)\}',s)
    if m and int(m.group(1))!=v['h']:
        old=int(m.group(1)); new=v['h']
        s=s.replace(f'"height":{old}',f'"height":{new}').replace(f'min-height:{old}px',f'min-height:{new}px').replace(f'min-height:{old-28}px',f'min-height:{new-28}px')
        open(P+f,'w').write(s); print('sync',f,old,'->',new)
# keep an 80px gap between rows, page by page (lc_pages: each page has its own rows)
first=(cj.get('pages') or [{}])[0].get('id')
pg=lambda o: o.get('page') or first
for pid in {pg(v) for v in c.values()}:
    on=[v for v in c.values() if pg(v)==pid]; notes=[n for n in (cj.get('notes') or {}).values() if isinstance(n,dict) and pg(n)==pid]
    rows=sorted({v['y'] for v in on}); i=0
    while i < len(rows)-1:
        y=rows[i]; bottom=max(v['y']+v['h'] for v in on if v['y']==y); ny=rows[i+1]
        if bottom+80>ny:
            d=bottom+80-ny
            for v in on:
                if v['y']>=ny: v['y']+=d
            for n in notes:
                if n.get('y',-1)>=ny-300: n['y']+=d  # the row's title sits 300px above it
            print('row',pid,ny,'moved',d)
            rows=sorted({v['y'] for v in on})
        i+=1
json.dump(cj,open(P+'canvas.json','w'),indent=1)
