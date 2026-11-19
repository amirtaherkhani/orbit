"""One-off: seams S1-S14 -> SM01-SM14, risks R1-R24 -> RK01-RK24 (decided 2026-11-17).
Board IDs (R01-R11, S01-S21, P01-P07) are unchanged. Ambiguous S10-S14 / R10-R11 are
renamed only on the lines listed below, which were classified by hand."""
import re, sys
SEAM_AMBIG_LINES = {20,29,31,173,177,179,180,200,205,206,305,319,320,359,374,375,376,377,378,385,940,957,961,1082,1095,1096,1127,1226,1334}
RISK_AMBIG_LINES = {1213,1214}
SKIP_LINES = {21,1431}  # rewritten by hand
seam = re.compile(r"(?<![\w/.])S([1-9]|1[0-4])(?!\d)(?![\w])")
risk = re.compile(r"(?<![\w/.])R([1-9]|1[0-9]|2[0-4])(?!\d)(?![\w])")
def run(path, ambig_ok=True):
    out=[]; inm=False; n=0
    for i,l in enumerate(open(path).read().split("\n"),1):
        if l.startswith("```mermaid"): inm=True; out.append(l); continue
        if inm and l.startswith("```"): inm=False; out.append(l); continue
        if i in SKIP_LINES and ambig_ok: out.append(l); continue
        def fs(m):
            k=int(m.group(1))
            if k>=10 and not inm and not (ambig_ok and i in SEAM_AMBIG_LINES): return m.group(0)
            return f"SM{k:02d}"
        def fr(m):
            k=int(m.group(1))
            if k in (10,11) and not (ambig_ok and i in RISK_AMBIG_LINES): return m.group(0)
            return f"RK{k:02d}"
        nl=seam.sub(fs,l)
        if not inm: nl=risk.sub(fr,nl)
        n+= nl!=l; out.append(nl)
    open(path,"w").write("\n".join(out)); print(path, "lines changed:", n)
if __name__=="__main__":
    run(sys.argv[1], ambig_ok=(len(sys.argv)<3))
