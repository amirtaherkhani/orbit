import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
import asyncio,sys,io,json,subprocess
from playwright.async_api import async_playwright
from PIL import Image
# usage: badgecheck.py Board.dc.html [state] -> for each badge-like element: class, text, top gap, bottom gap (px, at 1x)
async def main():
    f=sys.argv[1]; st=sys.argv[2] if len(sys.argv)>2 else '{}'
    h=json.load(open('project/canvas.json'))['boards'][f]['h']
    r='pre_lifecycle/_b_'+f.replace('.dc','')
    subprocess.run([sys.executable,'tools/dcrender.py','project/'+f,r,st],check=True)
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={"width":1440,"height":h},device_scale_factor=4)
        await pg.route("**/*", lambda q: q.abort() if not q.request.url.startswith("file:") else q.continue_())
        await pg.goto("file://"+ROOT+r); await pg.wait_for_timeout(400)
        els=await pg.evaluate("""()=>{const out=[];const seen=new Set();
          for(const e of document.querySelectorAll('body *')){const cs=getComputedStyle(e);const rc=e.getBoundingClientRect();
            if(rc.height<14||rc.height>30||rc.width<14||rc.width>260)continue;
            const bg=cs.backgroundColor;const hasBg=bg&&bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent';const hasBd=parseFloat(cs.borderTopWidth)>0||cs.boxShadow!=='none';
            if(!(hasBg||hasBd))continue; if(parseFloat(cs.borderRadius)<2)continue;
            const t=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim(); if(!t)continue;
            if(['BUTTON','A','INPUT'].includes(e.tagName)&&rc.height>26)continue;
            const key=e.className+'|'+t; if(seen.has(key))continue; seen.add(key);
            out.push({cls:String(e.className).slice(0,30),t:t.slice(0,22),x:rc.x,y:rc.y,w:rc.width,h:rc.height,bg})}
          return out}""")
        png=await pg.screenshot(full_page=False); im=Image.open(io.BytesIO(png)).convert('RGB')
        S=4
        for e in els:
            x0,y0=int(e['x']*S)+6,int(e['y']*S); x1,y1=int((e['x']+e['w'])*S)-6,int((e['y']+e['h'])*S)
            crop=im.crop((x0,y0,x1,y1)); W,H=crop.size; px=crop.load()
            # background = most common colour in the middle row band edges
            from collections import Counter
            bgc=Counter(px[x,y] for x in range(W) for y in (H//2,) ).most_common(1)[0][0]
            bgc=Counter(px[x,y] for x in range(W) for y in range(H)).most_common(1)[0][0]
            rows=[y for y in range(2,H-2) if any(sum(abs(a-b) for a,b in zip(px[x,y],bgc))>120 for x in range(W))]
            if not rows: continue
            top=(rows[0])/S; bot=(H-1-rows[-1])/S
            flag='OFF' if abs(top-bot)>1.0 else ''
            print(f"{e['cls']:<30} {e['t']:<22} h={e['h']:.0f} top={top:.1f} bottom={bot:.1f} {flag}")
        await b.close()
asyncio.run(main())
