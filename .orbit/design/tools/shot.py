import asyncio,sys,os,json,subprocess
from playwright.async_api import async_playwright
# usage: shot.py Board.dc.html [state-json] [out.png] ; renders with dcrender, screenshots at canvas h, prints scrollHeight and overflow info
async def main():
    f=sys.argv[1]; st=sys.argv[2] if len(sys.argv)>2 else '{}'; out=sys.argv[3] if len(sys.argv)>3 else 'chk_'+f.replace('.dc.html','')+'.png'
    h=json.load(open('project/canvas.json'))['boards'][f]['h']
    r='pre_lifecycle/_r_'+f.replace('.dc','')
    subprocess.run([sys.executable,'tools/dcrender.py','project/'+f,r,st],check=True)
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={"width":1440,"height":h})
        await pg.route("**/*", lambda r_: r_.abort() if not r_.request.url.startswith("file:") else r_.continue_())
        await pg.goto("file://"+os.path.abspath(r)); await pg.wait_for_timeout(300)
        sh=await pg.evaluate("document.documentElement.scrollHeight")
        info=await pg.evaluate("""()=>{const dk=document.querySelector('nav.dk');const top=dk?dk.getBoundingClientRect().top:null;
          const els=[...document.querySelectorAll('aside,article,section,table')].filter(e=>!e.closest('nav.dk'));
          const bot=Math.max(0,...els.map(e=>e.getBoundingClientRect().bottom));
          const wide=[...document.querySelectorAll('*')].filter(e=>e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflowX==='visible'&&e.clientWidth>0).slice(0,5).map(e=>e.className||e.tagName);
          return {dockTop:top,contentBottom:Math.round(bot),hOverflow:document.documentElement.scrollWidth>1440,wide}}""")
        print(f,'canvas h',h,'scrollH',sh,info)
        await pg.screenshot(path=out,full_page=False); await b.close()
asyncio.run(main())
