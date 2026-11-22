import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
# Canvas pages (owner's step 6, 2026-11-22): six pages, each with titled rows. The layout is made once, when the boards have no page
# yet; after that the owner may move boards on claude.ai, and this step only gives a page to a new board, at the end of its page.
# Run after lc_proto and before lc_fit (lc_fit keeps the rows of each page apart).
import json,re
P=ROOT+'project/'
PAGES=[('overview','1 · Overview and docs'),('foundations','2 · Foundations'),('components','3 · Components'),
       ('patterns','4 · Patterns and templates'),('screens','5 · Screens by feature'),('prototype','6 · Prototype')]
# rows by board ID, in order; a row of one board gets no title (a frame shows its own name)
ROWS={
 'overview':[('Start here: what changes, what is new, scope and naming (R01–R03; R03 explains every ID and tag)',['R01','R02','R03'])],
 'foundations':[('Tokens and foundations (R04, R05)',['R04','R05'])],
 'components':[('Specs: the component catalog (R12), then the shell, breadcrumb, dock, MenuSheet, overlays and apps specs (R06–R11)',['R12','R06','R11','R07','R08','R09','R10']),
               ('Shell components: Dock, TopBar, UserMenu, AddMenu, AppSwitcher, MenuSheet, DockBookmarkAdd (C01–C07)',['C01','C02','C03','C04','C05','C06','C07']),
               ('Bookmarks components: DockPagesView and its parts (C08–C11)',['C08','C09','C10','C11']),
               ('Apps and lifecycle components: AppsView, AppManageView, AppLifecycleView and their parts (C12–C20)',['C12','C13','C14','C15','C16','C17','C18','C19','C20'])],
 'patterns':[('Page templates: Grafana content inside the custom shell (P01–P07)',['P01','P02','P03','P04','P05','P06','P07'])],
 'screens':[('Shell and top bar: the screens that use the frame and breadcrumb (S01, S03)',['S01','S03']),
            ('Dock and MenuSheet: each sheet state, the selected app\'s pages, the add-bookmark popover, then the whole menu flow (S02, S07, S10, S19, S20, S22)',['S02','S07','S10','S19','S20','S22']),
            ('Overlays: switching apps, adding, user menu (S06, S14, S08, S04). Compare S06 with S14',['S06','S14','S08','S04']),
            ('App lifecycle in flow order: all apps with their status, initialize and review, setup to enable, after an update, manage, manifest (S12, S18, S16, S21, S15, S13)',['S12','S18','S16','S21','S15','S13']),
            ('',['S11'])],
 'prototype':[('',['S23'])]}
def page_of(i):  # a board added later goes to the page of its kind
    k,n=i[0],int(i[1:])
    if k=='R': return 'overview' if n<=3 else 'foundations' if n<=5 else 'components'
    return {'C':'components','P':'patterns'}.get(k,'prototype' if i=='S23' else 'screens')
cj=json.load(open(P+'canvas.json')); B=cj['boards']
ids={}
for f,v in B.items():
    m=re.match(r'([RCSP]\d\d) ',v.get('title','')); assert m,('lc_pages: board without an ID',f); ids[m.group(1)]=f
listed=[i for rows in ROWS.values() for _,r in rows for i in r]
assert len(listed)==len(set(listed)) and not set(listed)-set(ids),('lc_pages: ROWS names a board twice or one that does not exist')
if not cj.get('pages'):
    assert set(ids)==set(listed),('lc_pages: give these boards a row',sorted(set(ids)-set(listed)))
    cj['pages']=[{'id':i,'name':n} for i,n in PAGES]; cj['notes']={}
    for pid,rows in ROWS.items():
        y=0
        for r,(title,row) in enumerate(rows):
            x=0
            for i in row:
                v=B[ids[i]]; v.update(x=x,y=y,page=pid); x+=v['w']+80
            if title: cj['notes'][f'{pid}{r+1}']={'kind':'title1','x':0,'y':y-300,'maxW':max(x-80,1440),'text':title,'page':pid}
            y+=max(B[ids[i]]['h'] for i in row)+420  # 120 between rows plus room for the next row's title
    cj['launch']={'view':'canvas','page':'overview'}
for i,f in ids.items():  # a new board: right of the last board of its page
    v=B[f]
    if v.get('page'): continue
    pid=page_of(i); on=[b for b in B.values() if b.get('page')==pid]
    last=max(on,key=lambda b:(b['y'],b['x'])) if on else {'x':-80,'y':0,'w':0}
    v.update(page=pid,x=last['x']+last['w']+80,y=last['y']); print('page',f,pid)
json.dump(cj,open(P+'canvas.json','w'),indent=1)
print('pages ok')
