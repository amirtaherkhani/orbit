"""Figures for the architecture map, current version. Reuses the primitives of svgkit."""
import svgkit as K
from svgkit import node, edge, text, svg


def fig_load():
    return K.fig_load().replace("custom/entry", "orbit/entry").replace("custom/upstream", "orbit/upstream")


# --------------------------------------------------------------------------- B: app lifecycle
def fig_life():
    b = []
    W, H, G = 160, 92, 12
    xs = [10 + i * (W + G) for i in range(4)]
    rowA, rowB = 40, 188
    steps = [
        ("up", "1 Install", ["grafana-cli, from the", "catalog or a ZIP URL", "(Server Admin)"]),
        ("up", "2 Restart, discover", ["loader reads plugin.json", "and checks the signature", "status: Not initialized"]),
        ("ours", "3 Initialize", ["version, signature,", "dependencies, manifest,", "requires.orbit"]),
        ("ours", "4 Review", ["an Org Admin accepts;", "acceptance stored in", "orbit_app_lifecycle"]),
        ("ours", "5 Setup, validate", ["org, users, permissions,", "data sources, icon;", "checks before Enable"]),
        ("ours", "6 Enable", ["writes Grafana's own", "enabled setting; first", "health check runs"]),
        ("ours", "7 Migrate, if needed", ["maintenance mode,", "Org Admins only;", "starts by itself"]),
        ("ours", "8 Apps, pages, Manage", ["pages and bookmarks;", "Manage on the card;", "update check (OD31)"]),
    ]
    for i, (k, t, ls) in enumerate(steps):
        x = xs[i % 4]
        y = rowA if i < 4 else rowB
        b.append(node(x, y, W, H, k, t, [(l, "ts") for l in ls], frm=i + 1, at=i + 1, first=42))
        if i % 4 < 3:
            b.append(edge("b", f"M{x + W},{y + H / 2} H{x + W + G}", frm=i + 2, at=i + 2))
    b.append(edge("b", f"M{xs[3] + W / 2},{rowA + H} V{rowA + H + 22} H{xs[0] + W / 2} V{rowB}", frm=5, at=5))

    def lane(x1, x2, y, label, frm):
        return (f'<g class="lane" data-from="{frm}"><path class="lanepath" d="M{x1},{y + 6} v-6 H{x2} v6"/>'
                + text((x1 + x2) / 2, y - 6, label, "tl", "middle") + "</g>")
    b.append(lane(xs[0], xs[1] + W, 24, "Grafana server, as shipped", 1))
    b.append(lane(xs[2], xs[3] + W, 24, "apps module: orbit/apps + pkg/orbit", 3))
    gx = xs[1] - G / 2
    b.append(f'<g data-from="6"><path class="edge" d="M{gx},{rowB - 10} V{rowB + H + 14}" stroke-dasharray="5 4"/>'
             + text(gx + 6, rowB + H + 30, "from here Grafana answers the app backend (checkAppEnabled)", "tl") + "</g>")
    sy = 340
    b.append(text(10, sy - 8, "Where each step keeps its state", "tt"))
    b.append(node(10, sy, 330, 54, "ours", "orbit_app_lifecycle (pkg/orbit)", [("status, review, last accepted version, schema", "ts")], frm=4, at=4, first=38))
    b.append(node(352, sy, 330, 54, "up", "plugin_setting.enabled (Grafana)", [("the only state Grafana itself knows", "ts")], frm=6, at=6, first=38))
    return svg("b", 692, 404, "".join(b),
               "Eight steps of an app's life. Install and discovery belong to the Grafana server. Initialize to Manage belong to the apps module, which keeps its state in orbit_app_lifecycle; Enable writes Grafana's own enabled setting. Health checks and migrations come after Enable, because Grafana answers the app backend only for an enabled app.")


# --------------------------------------------------------------------------- C: after an update
def fig_update():
    b = []
    b.append(node(10, 14, 250, 62, "up", "Server Admin updates the app", [("grafana-cli, then restart", "ts")], frm=1, at=1, first=40))
    b.append(node(300, 14, 382, 62, "ours", "pkg/orbit compares two versions", [("loaded plugin version with the stored one, at start-up and on read", "ts")], frm=2, at=2, first=40))
    b.append(edge("e", "M260,45 H300", frm=2, at=2))
    outs = [
        ("ours", "A Same version", ["nothing changes;", "no Run migration"], 3),
        ("ours", "B Simple update", ["checks re-run by", "themselves; stays", "Enabled if they pass"], 4),
        ("ours", "C Needs an admin", ["maintenance mode;", "opens at the first", "step that needs action"], 5),
        ("ours", "D New schema", ["maintenance mode;", "migrates after", "Validate passes"], 6),
        ("alt", "Downgrade", ["Action required;", "a migration cannot", "go backwards"], 6),
    ]
    W, G = 128, 10
    bus = 118
    b.append(f'<path class="edge" data-from="3" d="M{10 + W / 2},{bus} H{10 + 4 * (W + G) + W / 2}"/>')
    b.append(edge("e", f"M491,76 V{bus}", frm=3, at=3, arrow=False))
    for i, (k, t, ls, step) in enumerate(outs):
        x = 10 + i * (W + G)
        b.append(edge("e", f"M{x + W / 2},{bus} V140", frm=step, at=step))
        b.append(node(x, 140, W, 92, k, t, [(l, "ts") for l in ls], frm=step, at=step, first=42))
    b.append(text(10, 262, "B to D: settings of the old version are kept; Setup asks only for what is new.", "tl"))
    return svg("e", 692, 276, "".join(b),
               "After an update, pkg/orbit compares the loaded version with the stored one and picks one of five outcomes: same version, simple update, update that needs an admin, new schema version, or downgrade.")


# --------------------------------------------------------------------------- D: bookmarks
def fig_bookmark():
    b = []
    b.append(text(10, 20, "Write: the list to Preferences, the details to user storage", "tt"))
    b.append(node(10, 32, 96, 138, "ext", "User", [("bookmarks", "ts"), ("a page", "ts")], frm=1, at=1, first=40))
    b.append(node(128, 32, 160, 138, "ours", "Bookmark toggle", [("MenuSheet header,", "ts"), ("the dock popover,", "ts"), ("DockPagesView", "ts")], frm=1, at=1, first=40))
    b.append(node(310, 32, 140, 138, "ours", "useBookmarks", [("owns the list", "ts"), ("and the rule;", "ts"), ("views never", "ts"), ("call the API", "ts")], frm=2, at=2, first=40))
    b.append(node(472, 32, 160, 64, "up", "Preferences API", [("navbar.bookmarkUrls", "tm")], frm=3, at=3, first=40))
    b.append(node(472, 106, 160, 64, "up", "User storage", [("orbit-bookmarks", "tm")], frm=4, at=4, first=40))
    b.append(edge("f", "M106,101 H128", frm=1, at=1))
    b.append(edge("f", "M288,101 H310", frm=2, at=2))
    b.append(edge("f", "M450,64 H472", frm=3, at=3))
    b.append(edge("f", "M450,138 H472", frm=4, at=4))
    b.append(text(10, 214, "Read on every load: resolve in the client, first match wins", "tt"))
    cards = [
        (226, "Does the user resource have navbar?", "user-<uid> spec.navbar, even when the list is empty"),
        (306, "Otherwise: does the namespace resource?", "the organization default"),
        (386, "Otherwise: compute the default", "every app with ui.show.dock, in app order"),
    ]
    for i, (y, t, s) in enumerate(cards):
        b.append(node(10, y, 392, 58, "ours", t, [(s, "ts")], frm=5 + (1 if i else 0), at=5 if i == 0 else 6, first=40))
    b.append(edge("f", "M206,284 V306", "no", 214, 300, frm=6, at=6, anchor="start"))
    b.append(edge("f", "M206,364 V386", "no", 214, 380, frm=6, at=6, anchor="start"))
    b.append(node(458, 286, 174, 110, "seam", "Dock bookmarks", [("ordered page URLs,", "ts"), ("with label and", "ts"), ("show-name details", "ts")], frm=5, at="5 6", first=40))
    b.append(edge("f", "M402,255 H430 V310 H458", "yes", 408, 249, frm=5, at=5, anchor="start"))
    b.append(edge("f", "M402,335 H458", "yes", 408, 329, frm=6, at=6, anchor="start"))
    b.append(edge("f", "M402,415 H430 V372 H458", "yes", 408, 409, frm=6, at=6, anchor="start"))
    return svg("f", 642, 460, "".join(b),
               "Bookmarking writes the ordered list to the user's preferences and the details to user storage. Reading resolves in the client: the user's list first, then the organization list, then a default computed from each app's manifest.")


# --------------------------------------------------------------------------- E: decision tree
def fig_tree():
    W = 170
    A, B, C = 10, 216, 422
    rows = [10, 92, 174, 256, 338, 420]
    H = 58
    pos = {
        "q1": (A, rows[0]), "r1": (B, rows[0]),
        "q2": (A, rows[1]), "r2": (B, rows[1]),
        "q3": (A, rows[2]), "q4": (B, rows[2]), "r3": (C, rows[2]),
        "q5": (A, rows[3]), "r4": (B, rows[3]),
        "q6": (A, rows[4]), "r6": (B, rows[4]),
        "r5": (A, rows[5]),
    }
    spec = {
        "q1": ("q", "Whole app, or a page", ["inside an app?"]),
        "q2": ("q", "Must it change what an", ["upstream page does?"]),
        "q3": ("q", "Needs data that no", ["existing API holds?"]),
        "q4": ("q", "Is the data", ["per app?"]),
        "q5": ("q", "Can Preferences or", ["userstorage hold it?"]),
        "q6": ("q", "App lifecycle, or other", ["state Orbit owns?"]),
        "r1": ("ext", "App plugin", ["own repo, no fork change"]),
        "r2": ("seam", "New seam, last resort", ["try SM03, SM04, SM05 first"]),
        "r3": ("ours", "Additive ui.json field", ["parser and a view"]),
        "r4": ("ours", "Overlay module (L3, L4)", ["memory, SM11 or a pref key"]),
        "r6": ("ours", "Table or route in pkg/orbit", ["no new seam"]),
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
        x1, y1 = mid(src, sside)
        x2, y2 = mid(dst, dside)
        if sside in "rl":
            lx, ly, an = (x1 + x2) / 2, y1 - 6, "middle"
        else:
            lx, ly, an = x1 + 7, (y1 + y2) / 2 + 4, "start"
        return edge("d", f"M{x1},{y1} L{x2},{y2}", label, lx, ly, eid=f"e-{src}-{dst}", anchor=an)

    for e in [("q1", "r1", "r", "l", "yes"), ("q1", "q2", "b", "t", "no"),
              ("q2", "r2", "r", "l", "yes"), ("q2", "q3", "b", "t", "no"),
              ("q3", "q4", "r", "l", "no"), ("q3", "q5", "b", "t", "yes"),
              ("q4", "r3", "r", "l", "yes"), ("q4", "r4", "b", "t", "no"),
              ("q5", "r4", "r", "l", "yes"), ("q5", "q6", "b", "t", "no"),
              ("q6", "r6", "r", "l", "yes"), ("q6", "r5", "b", "t", "no")]:
        b.append(E(*e))
    return svg("d", 600, 486, "".join(b),
               "Decision tree for a new concept. Six questions lead to six outcomes: an app plugin, a new seam, an additive manifest field, an overlay module, a table or route in pkg/orbit, or an App SDK app.")
