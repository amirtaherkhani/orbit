import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
import asyncio,sys,io,json,subprocess
from playwright.async_api import async_playwright
from PIL import Image
async def main():
    out=sys.argv[1]; boards=sys.argv[2:]
    tiles=[]
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for f in boards:
            h=json.load(open('project/canvas.json'))['boards'][f]['h']; r='pre_lifecycle/_b_'+f.replace('.dc','')
            subprocess.run(['python3','tools/dcrender.py','project/'+f,r,'{}'],check=True)
            pg=await b.new_page(viewport={"width":1440,"height":h},device_scale_factor=3)
            await pg.route("**/*", lambda q: q.abort() if not q.request.url.startswith("file:") else q.continue_())
            await pg.goto("file://"+ROOT+r); await pg.wait_for_timeout(400)
            sel='.lsc,.nw2,.upc,.chp,.pill,.gcnt,.mr,.apst,.acf .k,.rtg,.cs,.ckc,.uvr b,.hm'
            rects=await pg.evaluate(f"""()=>{{const seen=new Set();return [...document.querySelectorAll('{sel}')].map(e=>{{const r=e.getBoundingClientRect();return {{x:r.x,y:r.y,w:r.width,h:r.height,c:String(e.className)+'|'+e.textContent.trim().slice(0,20)}}}}).filter(o=>{{if(seen.has(o.c)||o.w<4||o.w>600)return false;seen.add(o.c);return true}})}}""")
            png=await pg.screenshot(); im=Image.open(io.BytesIO(png))
            for r in rects[:14]:
                tiles.append((f[:8]+' '+r['c'][:40],im.crop((int((r['x']-6)*3),int((r['y']-6)*3),int((r['x']+r['w']+6)*3),int((r['y']+r['h']+6)*3)))))
            await pg.close()
        await b.close()
    W=max(t.width for _,t in tiles); H=sum(t.height+8 for _,t in tiles)
    m=Image.new('RGB',(min(W,1800),H),(40,40,40)); y=0
    for _,t in tiles: m.paste(t,(0,y)); y+=t.height+8
    m.save(out); print('\n'.join(n for n,_ in tiles))
asyncio.run(main())
