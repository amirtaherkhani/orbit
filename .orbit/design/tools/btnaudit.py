import asyncio,sys,os,json,subprocess
from playwright.async_api import async_playwright
JS="""()=>{const out=[];const seen=new Set();
for(const b of document.querySelectorAll('button.p,a.p')){const r=b.getBoundingClientRect(); if(r.width<1)continue;
 const g=b.parentElement; if(seen.has(g))continue; seen.add(g);
 const bs=[...g.children].filter(e=>e.matches('button.p,a.p')&&e.getBoundingClientRect().width>0);
 const cs=getComputedStyle(g); const gr=g.getBoundingClientRect();
 const ctx=b.closest('aside')?'aside':b.closest('header,.hd,section.hdr')?'header':'';
 const box=g.closest('section,article,aside,div.cd,div.crd');
 out.push({ctx, dir:cs.flexDirection, jc:cs.justifyContent, x:Math.round(gr.x), y:Math.round(gr.y), w:Math.round(gr.width),
  bx:box?Math.round(box.getBoundingClientRect().x):0, bw:box?Math.round(box.getBoundingClientRect().width):0,
  btn:bs.map(e=>{const c=String(e.className);const k=c.includes(' w')?'PRI':c.includes('dng')?'DNG':c.includes('lca')?'LC':'sec';return k+':'+e.textContent.trim().slice(0,22)})})}
return out}"""
async def main():
    c=json.load(open('project/canvas.json'))['boards']
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for f in sorted(c):
            r0='pre_lifecycle/_a_'+f; subprocess.run(['python3','tools/dcrender.py','project/'+f,r0,'{}'],check=True,capture_output=True)
            pg=await b.new_page(viewport={"width":1440,"height":c[f]['h']})
            await pg.route("**/*", lambda r: r.abort() if not r.request.url.startswith("file:") else r.continue_())
            await pg.goto("file://"+os.path.abspath(r0)); await pg.wait_for_timeout(200)
            for o in await pg.evaluate(JS):
                print(f"{f[:-8]:16} {o['ctx']:6} {o['dir'][:3]} {o['jc'][:8]:8} x{o['x']:5} y{o['y']:5} w{o['w']:4} | "+' , '.join(o['btn']))
            await pg.close()
        await b.close()
asyncio.run(main())
