import re,sys,json,subprocess
# render a .dc.html template with values produced by running renderVals() in node
src=sys.argv[1]; out=sys.argv[2]; state=json.loads(sys.argv[3]) if len(sys.argv)>3 else {}
s=open(src).read()
logic=s[s.index('class Component extends DCLogic'):s.index('</script>',s.index('class Component extends DCLogic'))]
js=("class DCLogic{constructor(p){this.props=p||{};this.state={}}setState(x){Object.assign(this.state,x)}}\nglobal.setTimeout=()=>0;\n"+logic+
 "\nconst c=new Component({});Object.assign(c.state,"+json.dumps(state)+");const v=c.renderVals();"
 "console.log(JSON.stringify(v,(k,x)=>typeof x==='function'?undefined:x));")
v=json.loads(subprocess.run(['node','-e',js],capture_output=True,text=True,check=True).stdout)
def get(ctx,path):
    path=path.strip()
    if path in('true','false'): return path=='true'
    cur=ctx
    for p in path.split('.'):
        if isinstance(cur,dict) and p in cur: cur=cur[p]
        else: return None
    return cur
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
    return re.sub(r'\{\{(.*?)\}\}',lambda mm: '' if get(ctx,mm.group(1)) is None else str(get(ctx,mm.group(1))),out)
a=s.index('<x-dc>'); b=s.index('</x-dc>')
s=s[:a]+render(s[a:b],v)+s[b:]
open(out,'w').write(s)
