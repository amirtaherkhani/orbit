import asyncio,sys,os,json,subprocess
from playwright.async_api import async_playwright
async def main():
    c=json.load(open('project/canvas.json'))['boards']
    async with async_playwright() as p:
        b=await p.chromium.launch()
        for f in sys.argv[1:]:
            pg=await b.new_page(viewport={"width":1440,"height":600})
            await pg.route("**/*", lambda r: r.abort() if not r.request.url.startswith("file:") else r.continue_())
            # render first, so <sc-if> blocks that are off (hidden tabs) do not count (fix 2026-11-16)
            r='/tmp/nat_'+f; subprocess.run([sys.executable,'tools/dcrender.py','project/'+f,r,'{}'],check=True,capture_output=True)
            await pg.goto("file://"+r); await pg.wait_for_timeout(250)
            h=await pg.evaluate("(()=>{document.querySelectorAll('.pg,[style*=min-height]').forEach(e=>e.style.minHeight='0');return document.documentElement.scrollHeight})()")
            print(f,'natural',h,'canvas',c[f]['h'],'OK' if h<=c[f]['h'] else 'TOO SHORT'); await pg.close()
        await b.close()
asyncio.run(main())
