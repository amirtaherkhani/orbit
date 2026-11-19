"""SVG helpers + the four figures for the overlay explainer page."""
import html

def esc(s):
    return html.escape(s, quote=False)

def attrs(**kw):
    out = []
    for k, v in kw.items():
        if v is None:
            continue
        out.append(f'{k.replace("_", "-")}="{v}"')
    return " ".join(out)

def text(x, y, s, cls="ts", anchor="start"):
    return f'<text x="{x}" y="{y}" class="{cls}" text-anchor="{anchor}">{esc(s)}</text>'

def node(x, y, w, h, kind, title, lines=(), frm=None, at=None, nid=None, tcls="tt", lcls="ts", first=38, step=15, rx=7):
    a = attrs(data_from=frm, data_at=at, id=nid)
    g = [f'<g class="node {kind}" {a}>', f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}"/>']
    g.append(text(x + 10, y + 19, title, tcls))
    for i, l in enumerate(lines):
        cls = lcls
        if isinstance(l, tuple):
            l, cls = l
        g.append(text(x + 10, y + first + i * step, l, cls))
    g.append("</g>")
    return "".join(g)

def container(x, y, w, h, kind, title, sub=None, frm=None, at=None):
    a = attrs(data_from=frm, data_at=at)
    g = [f'<g class="node {kind} box" {a}>', f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="9"/>']
    g.append(text(x + 12, y + 18, title, "tt"))
    if sub:
        g.append(text(x + 12, y + 34, sub, "tm"))
    g.append("</g>")
    return "".join(g)

def tag(x, y, label, w=None):
    w = w or (len(label) * 7 + 12)
    return (f'<g class="seamtag"><rect x="{x}" y="{y}" width="{w}" height="18" rx="9"/>'
            f'<text x="{x + w / 2}" y="{y + 13}" text-anchor="middle">{esc(label)}</text></g>')

def defs(uid):
    return (f'<defs><marker id="ah-{uid}" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto-start-reverse">'
            f'<path d="M0,1 L10,5 L0,9 z" fill="currentColor"/></marker></defs>')

def edge(uid, d, label=None, lx=None, ly=None, frm=None, at=None, eid=None, anchor="middle", arrow=True):
    a = attrs(data_from=frm, data_at=at, id=eid)
    me = f' marker-end="url(#ah-{uid})"' if arrow else ""
    g = [f'<g class="edgeg" {a}>', f'<path class="edge" d="{d}"{me}/>']
    if label:
        g.append(text(lx, ly, label, "tl", anchor))
    g.append("</g>")
    return "".join(g)

def svg(uid, w, h, body, label):
    return (f'<svg class="fig-svg" viewBox="0 0 {w} {h}" role="img" aria-label="{esc(label)}" xmlns="http://www.w3.org/2000/svg">'
            f'{defs(uid)}{body}</svg>')

# --------------------------------------------------------------------------- A: page load
def fig_load():
    b = []
    b.append(container(8, 8, 604, 334, "up", "AppWrapper.tsx", "renders <RouterWrapper> (line 154)", frm=1, at=1))
    b.append(container(22, 56, 576, 274, "up", "RoutesWrapper.tsx: RouterWrapper", "renders <AppChrome> around every route (lines 35, 47)", frm=1, at=1))
    b.append(container(36, 102, 548, 214, "seam", "<AppChrome>: the import on line 9 is seam SM01", None, frm=2, at=2))
    b.append(tag(528, 109, "SM01", 44))
    b.append(node(50, 128, 262, 34, "ours", "ShellSwitch: reads the kill switch", frm=4, at=4, nid=None))
    b.append(node(50, 192, 330, 112, "ours", "AppShell (new)", [("TopBar, Dock, MenuSheet, AppBreadcrumb", "ts")], frm=6, at=6, first=36))
    b.append(node(64, 238, 302, 56, "up", "Page (children of the shell)", [("Page.tsx:49 calls chrome.update(...)", "ts")], frm=6, at=6, first=38))
    b.append(node(404, 192, 166, 112, "ext", "AppChrome (stock)", [("renders when the", "ts"), ("switch is off or", "ts"), ("cannot be read", "ts")], frm=6, at=6, first=38, nid=None))
    b.append(edge("a", "M150,162 V192", "on", 158, 182, frm=6, at=6, anchor="start"))
    b.append(edge("a", "M312,145 H487 V192", "off or unreadable", 400, 139, frm=5, at=5))
    b.append(node(36, 372, 304, 66, "ours", "custom/entry", [("imported by the SM01 line, runs once:", "ts"), ("extraRoutes (SM03), hooks (SM04, SM05)", "ts")], frm=2, at="2 3", first=38))
    b.append(edge("a", "M188,372 V316", "imported at line 9", 196, 358, frm=2, at=2, anchor="start"))
    b.append(text(36, 462, "State loop: pages write, the shell reads", "tt"))
    b.append(node(24, 490, 100, 34, "up", "Page", frm=7, at=7))
    b.append(node(248, 490, 160, 34, "up", "AppChromeService", frm=7, at=7))
    b.append(node(528, 490, 84, 34, "ours", "AppShell", frm=7, at=8))
    b.append(edge("a", "M124,507 H248", "chrome.update(...)", 186, 500, frm=7, at=7))
    b.append(edge("a", "M408,507 H528", "useChromeState()", 468, 500, frm=8, at=8))
    b.append(text(468, 542, "via custom/upstream", "tl", "middle"))
    return svg("a", 620, 560, "".join(b),
               "Render tree from AppWrapper down to the page. The AppChrome slot is seam SM01 and holds ShellSwitch, which renders the new AppShell or the stock AppChrome. Below, pages write to AppChromeService and the shell reads it.")

# --------------------------------------------------------------------------- B: life of an app
def fig_app():
    b = []
    stages = [
        ("ext", "Register", ["App installed", "with plugin.json", "(includes[]) and", "optional ui.json"]),
        ("up", "Initialize", ["Loader reads", "plugin.json; nav", "tree builds", "plugin-page-<id>"]),
        ("ours", "List", ["useApps() joins", "four sources", "into one list of", "AppDescriptor"]),
        ("ours", "Choose", ["show.menu and", "show.dock give", "defaults; the", "user's pins win"]),
        ("ours", "Render", ["AppSwitcher,", "MenuSheet, Dock,", "AppBreadcrumb", "read the list"]),
    ]
    for i, (k, t, ls) in enumerate(stages):
        x = 10 + i * 134
        b.append(node(x, 14, 116, 104, k, t, [(l, "ts") for l in ls], frm=i + 1, at=i + 1, first=42, tcls="tt"))
        if i < 4:
            b.append(edge("b", f"M{x + 116},66 H{x + 134}", frm=i + 2, at=i + 2))
    # lanes
    def lane(x1, x2, label, frm):
        return (f'<g class="lane" data-from="{frm}"><path class="lanepath" d="M{x1},128 v6 H{x2} v-6"/>'
                + text((x1 + x2) / 2, 152, label, "tl", "middle") + "</g>")
    b.append(lane(10, 126, "app repo", 1))
    b.append(lane(144, 260, "Grafana backend", 2))
    b.append(lane(278, 662, "overlay frontend (custom/)", 3))
    b.append(text(10, 196, "useApps() joins four sources", "tt"))
    srcs = [
        ("up", "App plugin metas", ["useAppPluginMetas()", "id, name, version"]),
        ("up", "Nav tree section", ["plugin-page-<id>", "pages this user may see"]),
        ("ext", "Manifest", ["GET .../ui.json", "accent, show, page text"]),
        ("ours", "Built-in apps", ["apps/builtin.ts", "Monitoring and others"]),
    ]
    for i, (k, t, ls) in enumerate(srcs):
        x = 10 + i * 170
        b.append(node(x, 226, 150, 70, k, t, [(ls[0], "tm"), (ls[1], "ts")], frm=3, at=3, first=38, step=15))
        b.append(f'<path class="edge" data-from="3" d="M{x + 75},226 V210"/>')
    b.append(f'<path class="edge" data-from="3" d="M85,210 H595"/>')
    b.append(edge("b", "M336,210 V118", frm=3, at=3))
    return svg("b", 672, 312, "".join(b),
               "Five stages: Register, Initialize, List, Choose, Render. Register belongs to the app repository, Initialize to the Grafana backend, and the last three to the overlay frontend. The List stage joins four sources.")

# --------------------------------------------------------------------------- C: pin to dock
def fig_pin():
    b = []
    b.append(text(10, 20, "Write: one PATCH to the user's preferences", "tt"))
    b.append(node(10, 32, 100, 82, "ext", "User", [("Pins a page", "ts"), ("in the dock", "ts")], frm=1, at=1, first=40))
    b.append(node(142, 32, 140, 82, "ours", "DockPagesView", [("pin, unpin,", "ts"), ("reorder", "ts")], frm=1, at=1, first=40))
    b.append(node(314, 32, 130, 82, "ours", "useDockPins", [("owns the", "ts"), ("resolution rule", "ts")], frm=2, at=2, first=40))
    b.append(node(476, 32, 154, 82, "up", "Preferences API", [("PATCH user-<uid>", "tm"), ("spec.navbar.", "tm"), ("bookmarkUrls", "tm")], frm=3, at=3, first=40, step=14))
    b.append(edge("c", "M110,73 H142", frm=1, at=1))
    b.append(edge("c", "M282,73 H314", frm=2, at=2))
    b.append(edge("c", "M444,73 H476", frm=3, at=3))
    b.append(text(10, 152, "Read on every load: resolve in the client, first match wins", "tt"))
    cards = [
        (172, "Does the user resource have navbar?", "user-<uid> spec.navbar, even when the list is empty"),
        (252, "Otherwise: does the namespace resource?", "the organization default"),
        (332, "Otherwise: compute the default", "every app with ui.show.dock, in app order"),
    ]
    for i, (y, t, s) in enumerate(cards):
        b.append(node(10, y, 392, 58, "ours", t, [(s, "ts")], frm=4 + (1 if i else 0), at=4 if i == 0 else 5, first=40))
    b.append(edge("c", "M206,230 V252", "no", 214, 246, frm=5, at=5, anchor="start"))
    b.append(edge("c", "M206,310 V332", "no", 214, 326, frm=5, at=5, anchor="start"))
    b.append(node(458, 232, 172, 110, "seam", "Dock pins", [("ordered list of", "ts"), ("page URLs, drawn", "ts"), ("by the Dock", "ts")], frm=4, at="4 5", first=40))
    b.append(edge("c", "M402,201 H430 V256 H458", "yes", 408, 195, frm=4, at=4, anchor="start"))
    b.append(edge("c", "M402,281 H458", "yes", 408, 275, frm=5, at=5, anchor="start"))
    b.append(edge("c", "M402,361 H430 V318 H458", "yes", 408, 355, frm=5, at=5, anchor="start"))
    return svg("c", 640, 406, "".join(b),
               "Pinning writes one list to the user's preferences. Reading resolves in the client: the user's list first, then the organization list, then a default computed from each app's manifest.")

# --------------------------------------------------------------------------- D: decision tree
def fig_tree():
    W = 170
    A, B, C = 10, 216, 422
    rows = [10, 92, 174, 256, 338]
    H = 58
    pos = {
        "q1": (A, rows[0]), "r1": (B, rows[0]),
        "q2": (A, rows[1]), "r2": (B, rows[1]),
        "q3": (A, rows[2]), "q4": (B, rows[2]), "r3": (C, rows[2]),
        "q5": (A, rows[3]), "r4": (B, rows[3]),
        "r5": (A, rows[4]),
    }
    spec = {
        "q1": ("q", "Whole app, or a page", ["inside an app?"]),
        "q2": ("q", "Must it change what an", ["upstream page does?"]),
        "q3": ("q", "Needs data that no", ["existing API holds?"]),
        "q4": ("q", "Is the data", ["per app?"]),
        "q5": ("q", "Can Preferences or", ["userstorage hold it?"]),
        "r1": ("ext", "App plugin", ["own repo, no fork change"]),
        "r2": ("seam", "New seam, last resort", ["try SM03, SM04, SM05 first"]),
        "r3": ("ours", "Additive ui.json field", ["parser and a view"]),
        "r4": ("ours", "Overlay module (L3, L4)", ["memory, SM11 or a pref key"]),
        "r5": ("alt", "App SDK app (T1 to T5)", ["separate backend PR"]),
    }
    b = []
    for k, (x, y) in pos.items():
        kind, t, ls = spec[k]
        b.append(node(x, y, W, H, kind + (" leaf" if k.startswith("r") else " ask"), t, [(l, "ts") for l in ls],
                      nid=f"n-{k}", first=38, tcls="tt"))
    def mid(k, side):
        x, y = pos[k]
        return {"r": (x + W, y + H / 2), "l": (x, y + H / 2), "b": (x + W / 2, y + H), "t": (x + W / 2, y)}[side]
    def E(src, dst, sside, dside, label):
        x1, y1 = mid(src, sside); x2, y2 = mid(dst, dside)
        if sside in "rl":
            lx, ly, an = (x1 + x2) / 2, y1 - 6, "middle"
        else:
            lx, ly, an = x1 + 7, (y1 + y2) / 2 + 4, "start"
        return edge("d", f"M{x1},{y1} L{x2},{y2}", label, lx, ly, eid=f"e-{src}-{dst}", anchor=an)
    for e in [("q1", "r1", "r", "l", "yes"), ("q1", "q2", "b", "t", "no"),
              ("q2", "r2", "r", "l", "yes"), ("q2", "q3", "b", "t", "no"),
              ("q3", "q4", "r", "l", "no"), ("q3", "q5", "b", "t", "yes"),
              ("q4", "r3", "r", "l", "yes"), ("q4", "r4", "b", "t", "no"),
              ("q5", "r4", "r", "l", "yes"), ("q5", "r5", "b", "t", "no")]:
        b.append(E(*e))
    return svg("d", 600, 404, "".join(b),
               "Decision tree for a new concept. Five questions lead to five outcomes: an app plugin, a new seam, an additive manifest field, an overlay module, or an App SDK app.")
