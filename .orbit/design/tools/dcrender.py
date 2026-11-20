import os,re,sys,json,subprocess
# render a .dc.html template with values produced by running renderVals() in node.
# <dc-import name="X" prop="{{ path }}"> mounts the sibling X.dc.html with those props, as the canvas runtime does.
src=sys.argv[1]; out=sys.argv[2]; state=json.loads(sys.argv[3]) if len(sys.argv)>3 else {}
DIR=os.path.dirname(os.path.abspath(src))
def values(s,props,st):
    logic=s[s.index('class Component extends DCLogic'):s.index('</script>',s.index('class Component extends DCLogic'))]
    js=("class DCLogic{constructor(p){this.props=p||{};this.state={}}setState(x){Object.assign(this.state,x)}}\nglobal.setTimeout=()=>0;\n"+logic+
     "\nconst c=new Component("+json.dumps(props)+");Object.assign(c.state,"+json.dumps(st)+");const v=c.renderVals();"
     "console.log(JSON.stringify(v,(k,x)=>typeof x==='function'?undefined:x));")
    return json.loads(subprocess.run(['node','-e',js],capture_output=True,text=True,check=True).stdout)
def get(ctx,path):
    path=path.strip()
    if path in('true','false'): return path=='true'
    cur=ctx
    for p in path.split('.'):
        if isinstance(cur,dict) and p in cur: cur=cur[p]
        else: return None
    return cur
def hole(ctx,v):
    m=re.fullmatch(r'\{\{(.*?)\}\}',v)
    if m: return get(ctx,m.group(1))
    return re.sub(r'\{\{(.*?)\}\}',lambda mm:'' if get(ctx,mm.group(1)) is None else str(get(ctx,mm.group(1))),v)
def mount(attrs,ctx):
    a=dict(re.findall(r'([\w-]+)="([^"]*)"',attrs)); name=a.pop('name')
    props={re.sub(r'-(\w)',lambda m:m.group(1).upper(),k):hole(ctx,v) for k,v in a.items() if not k.startswith('hint-')}
    s=open(os.path.join(DIR,name+'.dc.html')).read()
    body=re.sub(r'<helmet>.*?</helmet>','',s[s.index('<x-dc>')+6:s.index('</x-dc>')],flags=re.S)
    return render(body,values(s,{k:v for k,v in props.items() if v is not None},{}))
def render(t,ctx):
    out='';i=0
    while True:
        m=re.search(r'<sc-(if|for)\b([^>]*)>',t[i:])
        if not m: out+=t[i:]; break
        st=i+m.start(); out+=t[i:st]
        # find matching close
        tag=m.group(1); depth=1; j=i+m.end()
        while depth:
            n=re.search(r'<sc-(if|for)\b[^>]*>|</sc-(if|for)>',t[j:])
            if n.group(0).startswith('</'): depth-=1
            else: depth+=1
            j+=n.end()
        inner=t[i+m.end():j-len('</sc-%s>'%tag)]
        attrs=m.group(2)
        if tag=='if':
            val=get(ctx,re.search(r'value="\{\{(.*?)\}\}"',attrs).group(1))
            if val: out+=render(inner,ctx)
        else:
            lst=get(ctx,re.search(r'list="\{\{(.*?)\}\}"',attrs).group(1)) or []
            name=re.search(r'as="(\w+)"',attrs).group(1)
            for k,it in enumerate(lst):
                c=dict(ctx); c[name]=it; c['$index']=k; out+=render(inner,c)
        i=j
    out=re.sub(r'<dc-import\b([^>]*)></dc-import>',lambda m:mount(m.group(1),ctx),out)
    return re.sub(r'\{\{(.*?)\}\}',lambda mm: '' if get(ctx,mm.group(1)) is None else str(get(ctx,mm.group(1))),out)
s=open(src).read()
v=values(s,{},state)
a=s.index('<x-dc>'); b=s.index('</x-dc>')
s=s[:a]+render(s[a:b],v)+s[b:]
open(out,'w').write(s)
