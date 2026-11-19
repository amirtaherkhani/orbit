import re, sys
P='/tmp/claude-0/-home-claude/79e7c9b9-9869-5ce4-ad39-155b09a245ac/scratchpad/artifact-files/f1d7d2fc-9095-468d-afaa-961ec6b8a2fd/project/'
f=sys.argv[1]; kw=re.compile(sys.argv[2], re.I)
s=open(P+f).read(); s=s[s.find('<x-dc'):]
s=re.sub(r'<svg.*?</svg>','',s,flags=re.S); s=re.sub(r'<style.*?</style>','',s,flags=re.S); s=re.sub(r'<script.*?</script>','',s,flags=re.S)
# split into blocks at row/section-level closings
blocks=re.split(r'</(?:tr|li|p|div|section|h\d)>', s)
seen=set()
for b in blocks:
    t=re.sub(r'<[^>]+>',' ',b); t=re.sub(r'\s+',' ',t).strip()
    if t and kw.search(t) and t not in seen:
        seen.add(t); print('-', t[:400])
