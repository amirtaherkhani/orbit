"""One-off: SM/RK rename in the map builder. Board refs are written 'board Sxx' or 'Boards ...'."""
import re, sys
seam = re.compile(r"(?<![\w/.])S([1-9]|1[0-4])(?!\d)(?![\w])")
risk = re.compile(r"(?<![\w/.])R([1-9]|1[2-9]|2[0-4])(?!\d)(?![\w])")
for p in sys.argv[1:]:
    out = []
    for l in open(p).read().split("\n"):
        def fs(m):
            pre = l[max(0, m.start() - 6):m.start()]
            if int(m.group(1)) >= 10 and ("board " in pre.lower() or "Boards" in l[:m.start()][-40:]):
                return m.group(0)
            return f"SM{int(m.group(1)):02d}"
        l = seam.sub(fs, l)
        l = risk.sub(lambda m: f"RK{int(m.group(1)):02d}", l)
        out.append(l)
    open(p, "w").write("\n".join(out))
