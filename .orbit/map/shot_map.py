"""Screenshots of map.html for review: desktop light, phone dark. Usage: python3 shot_map.py"""
import asyncio, os
from playwright.async_api import async_playwright
H = os.path.dirname(os.path.abspath(__file__)); O = os.path.join(H, "shots")
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 1280, "height": 900}, color_scheme="light")
        pg = await ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        await pg.goto("file://" + H + "/map.html"); await pg.wait_for_timeout(400)
        for sel, name in [("header.hero", "hero"), ("#layers", "layers"), ("#life", "life"), ("#update", "update"), ("#bookmark", "bookmark"), ("#new-concept .clf", "tree"), ("#fork", "fork"), ("#status", "status")]:
            await pg.locator(sel).screenshot(path=f"{O}/d-{name}.png")
        for _ in range(6): await pg.click("#life [data-act=next]")
        await pg.locator("#life").screenshot(path=f"{O}/d-life6.png")
        for a in ["yes", "no", "no"]:  # q1 no? walk q1->no, q2->no, q3->yes, q5->no, q6->yes
            pass
        for a in ["no", "no", "yes", "no", "yes"]:
            await pg.click(f"#clf [data-a={a}]")
        await pg.locator("#new-concept .clf").screenshot(path=f"{O}/d-tree-r6.png")
        sw = await pg.evaluate("document.documentElement.scrollWidth")
        await ctx.close()
        ctx = await b.new_context(viewport={"width": 400, "height": 860}, color_scheme="dark")
        pg = await ctx.new_page()
        await pg.goto("file://" + H + "/map.html"); await pg.wait_for_timeout(400)
        msw = await pg.evaluate("document.documentElement.scrollWidth")
        for sel, name in [("header.hero", "hero"), ("#fork", "fork"), ("#status", "status"), ("#life", "life")]:
            await pg.locator(sel).screenshot(path=f"{O}/m-{name}.png")
        print("errors:", errs, "desktop scrollWidth:", sw, "phone scrollWidth:", msw)
        await b.close()
asyncio.run(main())
