import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
# Component catalog (owner, 2026-11-20): components.json is the one source for every shared component's contract.
# It renders R12 · Component catalog, the "Components on this board" section on R06-R11 and the naming table on R03.
# Run after lc_s22 and before lc_ids and lc_fit. Agents read components.json; people read R12.
import json,re
P=ROOT+'project/'
C=json.load(open(ROOT+'components.json'))
BY={c['name']:c for c in C['components']}
TAG={'Specified':'tc','Proposal':'ti','Decided':'tv'}
L6='<p style="margin-top:6px">'
FIELDS=[('parts','Parts'),('props','Props'),('states','States'),('events','Events and keys'),('data','Data'),('uses','Uses'),('open','Open')]
assert sorted(C['order'])==sorted(BY) and all(n in BY for b in C['boards'].values() for n in b)
def chip(c): return f'<span class="rtg {TAG[c["status"]]}">{c["status"]}</span>'

def card(c):
    o=(f'<div class="cd2" id="c-{c["name"]}"><div class="hd2"><h3 style="margin:0">{c["name"]}</h3>{chip(c)}</div><p>{c["summary"]}</p>'
       f'{L6}<small>Code</small> public/app/orbit/{c["code"]} <small>Spec</small> {c["spec"]} <small>Screens</small> {c["screens"]} <small>Replaces</small> {c["replaces"]}</p>')
    for k,lab in FIELDS:
        if k not in c: continue
        o+=f'{L6}<small>Events and keys</small></p><ul>'+''.join(f'<li>{e}</li>' for e in c[k])+'</ul>' if k=='events' else f'{L6}<small>{lab}</small> '+' · '.join(c[k])+'</p>'
    return o+'</div>'

# 1. R12, from its base snapshot (head and styles) and components.json (all content)
s=open(ROOT+'pre_lifecycle/RefComponents.dc.html').read()
a=s.index('<div class="pg"'); b=s.index('</div>\n</x-dc>')+6
mh=re.match(r'<div class="pg" style="min-height:(\d+)px">',s[a:]).group(1)
pg=(f'<div class="pg" style="min-height:{mh}px"><h1>{C["title"]}</h1><p class="lead">{C["intro"]}</p><h2>How they fit together</h2><p class="lead" style="margin:0 0 10px">{C["fit"]}</p>'
    '<table class="mt fx"><colgroup><col style="width:17%"><col style="width:10%"><col style="width:27%"><col style="width:12%"><col style="width:22%"><col style="width:12%"></colgroup>'
    '<thead><tr><th>Component</th><th>Group</th><th>Code (public/app/orbit/)</th><th>Spec</th><th>Screens today</th><th>Status</th></tr></thead><tbody>'
    +''.join(f'<tr><td><a href="#c-{n}" style="color:#6ccfdc">{n}</a></td><td>{BY[n]["group"]}</td><td>{BY[n]["code"]}</td><td>{BY[n]["spec"]}</td><td>{BY[n]["screens"]}</td><td>{chip(BY[n])}</td></tr>' for n in C['order'])
    +'</tbody></table>')
for g in C['groups']:
    pg+=f'<h2>{g["name"]}</h2><p class="lead" style="margin:0 0 12px">{g["lead"]}</p><div class="g2">'+''.join(card(c) for c in C['components'] if c['group']==g['name'])+'</div>'
open(P+'RefComponents.dc.html','w').write(s[:a]+pg+'</div>'+s[b:])

# 2. R06-R11: the components each board specifies, right after the board's first lead paragraph
SEC=('<h2 id="components">Components on this board</h2><p class="lead" style="margin:0 0 10px">Their full contracts (props, states, events, keys, data) are on R12 · Component catalog and in <code>.orbit/design/components.json</code>.</p>'
     '<table class="mt fx"><colgroup><col style="width:16%"><col style="width:50%"><col style="width:22%"><col style="width:12%"></colgroup><thead><tr><th>Component</th><th>What it is</th><th>Code (public/app/orbit/)</th><th>Status</th></tr></thead><tbody>')
for f,bid in [('RefFrame','R06'),('RefDock','R07'),('RefSheet','R08'),('RefOverlays','R09'),('RefApps','R10'),('RefBreadcrumb','R11')]:
    t=open(P+f+'.dc.html').read()
    if '<h2 id="components">' in t:  # boards no builder rewrites keep an older copy: replace it
        i=t.index('<h2 id="components">'); t=t[:i]+t[t.index('</table>',i)+8:]
    i=t.index('</p>',t.index('</h1>'))+4
    rows=''.join(f'<tr><td><b style="font-weight:500;color:#eceef1">{n}</b></td><td>{BY[n]["summary"]}</td><td>{BY[n]["code"]}</td><td>{chip(BY[n])}</td></tr>' for n in C['boards'][bid])
    open(P+f+'.dc.html','w').write(t[:i]+SEC+rows+'</tbody></table>'+t[i:])

# 3. R03: the naming table comes from the catalog, and R12 joins the board list
t=open(P+'RefScope.dc.html').read()
i=t.index('>AppShell<'); a=t.rfind('<table',0,i); b=t.index('</table>',i)+8
NAMES=('<table class="mt fx" id="c-names"><colgroup><col style="width:18%"><col style="width:50%"><col style="width:18%"><col style="width:14%"></colgroup>'
       '<thead><tr><th>Component (code name)</th><th>What it is</th><th>Replaces in Grafana</th><th>Spec</th></tr></thead><tbody>'
       +''.join(f'<tr><td><b style="font-weight:500;color:#eceef1">{n}</b></td><td>{BY[n]["summary"]}</td><td>{BY[n]["replaces"]}</td><td>{BY[n]["spec"]}, R12</td></tr>' for n in C['order'])+'</tbody></table>')
t=t[:a]+NAMES+t[b:]
if '<tr><td>R12</td>' not in t:
    i=t.index('</tr>',t.index('<code>RefBreadcrumb.dc.html</code>'))+5
    t=t[:i]+'<tr><td>R12</td><td>R12 · Component catalog</td><td>RefComponents.dc.html</td></tr>'+t[i:]
open(P+'RefScope.dc.html','w').write(t)
print('components ok')
