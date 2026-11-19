"""Builds the Grafana Architecture Map page (artifact 6c655dd6-...) from ARCHITECTURE.md facts.

Run: python3 build_map.py  ->  writes map.html next to this file.
Source of truth for every claim here: ../../ARCHITECTURE.md (revision note 79 or later).
"""
import html, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import svgkit2 as K
esc = html.escape

EV = {"V": ("ev-v", "Verified"), "I": ("ev-i", "Inferred"), "N": ("ev-n", "Not verified"), "P": ("ev-p", "Proposed")}
def ev(k):
    c, t = EV[k]
    return f'<span class="ev {c}">{t}</span>'

# ------------------------------------------------------------------ CSS (base copied from the first map, plus the parts below)
CSS = r"""
:root{
  /* Palette: paper-cool ground, ink, and three ownership hues. teal = our overlay, amber = a seam, slate = Grafana as shipped. */
  --bg:#F3F5F8; --surface:#FFFFFF; --surface-2:#E8ECF1; --line:#CBD3DD; --fg:#0F1822; --muted:#526070;
  --ours:#0B7A75; --ours-soft:#D8EFEC; --seam:#B4530A; --seam-soft:#FBE7D1; --up:#586474; --up-soft:#E3E8EE;
  --on-seam:#FFFFFF; --code-bg:#101A24; --code-fg:#E5ECF3; --add-bg:#D8EFEC; --del-bg:#E8ECF1;
  /* Type: Bricolage Grotesque for headings, Hanken Grotesk for reading, JetBrains Mono for code and paths. */
  --font-display:'Bricolage Grotesque','Hanken Grotesk',system-ui,sans-serif;
  --font-body:'Hanken Grotesk',system-ui,-apple-system,'Segoe UI',sans-serif;
  --font-mono:'JetBrains Mono',ui-monospace,'SF Mono',Menlo,Consolas,monospace;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --bg:#0C1117; --surface:#141B24; --surface-2:#1B242F; --line:#2A3544; --fg:#E7EDF3; --muted:#9BA7B6;
    --ours:#4CCBC2; --ours-soft:#103130; --seam:#FFA24A; --seam-soft:#3A260F; --up:#A5B0BE; --up-soft:#212B37;
    --on-seam:#1A1000; --code-bg:#0A0F15; --code-fg:#E5ECF3; --add-bg:#103130; --del-bg:#1B242F; color-scheme:dark;
  }
}
:root[data-theme="dark"]{
  --bg:#0C1117; --surface:#141B24; --surface-2:#1B242F; --line:#2A3544; --fg:#E7EDF3; --muted:#9BA7B6;
  --ours:#4CCBC2; --ours-soft:#103130; --seam:#FFA24A; --seam-soft:#3A260F; --up:#A5B0BE; --up-soft:#212B37;
  --on-seam:#1A1000; --code-bg:#0A0F15; --code-fg:#E5ECF3; --add-bg:#103130; --del-bg:#1B242F; color-scheme:dark;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--fg);font:16px/1.6 var(--font-body);
  padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:0 64px;-webkit-text-size-adjust:100%}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:20;background:var(--bg)}
.wrap{max-width:1120px;margin:0 auto}
a{color:inherit}
code,.mono{font-family:var(--font-mono);font-size:.88em}
p{margin:0 0 1em;max-width:68ch}
h1,h2,h3{font-family:var(--font-display);margin:0;text-wrap:balance;letter-spacing:-.015em;line-height:1.12}
h1{font-size:clamp(2.1rem,5.4vw,3.7rem);font-weight:700;max-width:16ch}
h2{font-size:clamp(1.6rem,3.2vw,2.2rem);font-weight:700;margin-bottom:.5rem}
h3{font-size:1.2rem;font-weight:650;margin-bottom:.4rem}
:focus-visible{outline:2px solid var(--ours);outline-offset:2px;border-radius:4px}

/* nav */
.nav{position:sticky;top:env(safe-area-inset-top,0px);z-index:19;background:var(--bg);border-bottom:1px solid var(--line)}
.nav .wrap{display:flex;gap:6px;overflow-x:auto;padding:10px 0;align-items:center}
.nav .brand{font:600 .95rem var(--font-display);margin-right:12px;white-space:nowrap}
.nav a{white-space:nowrap;text-decoration:none;font-weight:600;font-size:.92rem;padding:6px 12px;border-radius:999px;border:1px solid transparent;color:var(--muted)}
.nav a:hover{color:var(--fg);border-color:var(--line)}
section{padding-top:56px;scroll-margin-top:56px}

/* hero */
.hero{padding-top:44px;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:36px;align-items:center}
.hero p.lead{font-size:1.1rem;color:var(--muted);margin-top:1.1rem}
.facts{font-size:.95rem;border-top:1px solid var(--line);padding-top:12px;margin-top:6px;max-width:60ch}
.facts b{font-weight:650}
.codecard{background:var(--code-bg);color:var(--code-fg);border-radius:12px;overflow:hidden;border:1px solid var(--line);min-width:0}
.codecard .path{font:500 .8rem var(--font-mono);padding:10px 14px;border-bottom:1px solid #ffffff22;color:#9fb0c2;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}
.codecard pre{margin:0;padding:14px 0;font:400 .83rem/1.7 var(--font-mono)}
.codecard .ln{display:block;padding:0 14px 0 28px;text-indent:-14px;white-space:pre-wrap;overflow-wrap:anywhere}
.codecard .del{background:#ffffff10;color:#9fb0c2;text-decoration:line-through;text-decoration-color:#9fb0c288}
.codecard .add{background:#4cccc22e;color:#d8fbf7}
.codecard .ctx{color:#9fb0c2}
.codecard .cap{padding:10px 14px 14px;font-size:.84rem;color:#b8c6d4;border-top:1px solid #ffffff22}
.ask3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:34px}
.ask3 a{display:block;text-decoration:none;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:14px 16px}
.ask3 a:hover{border-color:var(--ours)}
.ask3 b{display:block;font:650 1.05rem var(--font-display);margin-bottom:2px}
.ask3 span{font-size:.9rem;color:var(--muted)}

/* legend */
.legend{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px 32px;margin-top:34px;padding:16px 18px;background:var(--surface);border:1px solid var(--line);border-radius:10px;font-size:.88rem}
.legend h3{font-size:.95rem;margin-bottom:8px}
.legend ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.legend li{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
.sw{display:inline-block;width:26px;height:14px;border-radius:4px;border:1.5px solid var(--up);background:var(--up-soft);flex:none;transform:translateY(2px)}
.sw.ours{border-color:var(--ours);background:var(--ours-soft)}
.sw.seam{border-color:var(--seam);background:var(--seam-soft)}
.sw.ext{background:transparent;border-style:dashed}
.ev{display:inline-block;font:600 .72rem/1 var(--font-body);padding:3px 8px 3px 7px;border-radius:999px;border:1.5px solid var(--fg);white-space:nowrap}
.ev::before{content:"";display:inline-block;width:.62rem;height:.62rem;margin-right:6px;vertical-align:-.06rem;box-sizing:border-box;border:1.5px solid currentColor;border-radius:50%}
.ev-v{background:var(--fg);color:var(--bg)}
.ev-v::before{background:currentColor}
.ev-i{color:var(--fg)}
.ev-i::before{background:linear-gradient(90deg,currentColor 50%,transparent 50%)}
.ev-n{border-style:dashed;color:var(--fg)}
.ev-n::before{border-style:dashed}
.ev-p{border-style:dotted;color:var(--fg)}
.ev-p::before{border-radius:1px;transform:rotate(45deg) scale(.85)}

/* layer stack */
.lanes{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:14px;margin:26px 0 10px 28px;font:600 .82rem var(--font-body);color:var(--muted)}
.stack{position:relative;padding-left:28px}
.stack::before{content:"";position:absolute;left:8px;top:6px;bottom:18px;width:2px;background:var(--muted);opacity:.55}
.stack::after{content:"";position:absolute;left:3px;bottom:8px;border-left:6px solid transparent;border-right:6px solid transparent;border-top:10px solid var(--muted);opacity:.8}
.rail{position:absolute;left:-16px;top:50%;transform:translateY(-50%) rotate(180deg);writing-mode:vertical-rl;font:600 .72rem var(--font-body);color:var(--muted);white-space:nowrap;letter-spacing:.04em}
.layer{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:14px;margin-bottom:14px}
.fe{background:var(--surface);border:1px solid var(--line);border-left:5px solid var(--ours);border-radius:10px;padding:14px 16px;min-width:0}
.L-ext .fe{border-left-style:dashed;border-left-color:var(--up)}
.L-seam .fe{border-left-color:var(--seam)}
.L-up .fe{border-left-color:var(--up)}
.lh{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:baseline;margin-bottom:6px}
.lid{font:600 .8rem var(--font-mono);background:var(--fg);color:var(--bg);border-radius:6px;padding:2px 7px}
.lh h3{margin:0;font-size:1.15rem}
.lh code{color:var(--muted);font-size:.8rem}
.resp{margin:0 0 10px;color:var(--muted);font-size:.95rem}
.pats{margin:0 0 10px;padding:0;list-style:none;display:grid;gap:6px}
.pats li{font-size:.92rem}
.pats b{font-weight:650}
.pats .why{color:var(--muted)}
.imp{margin:0;font-size:.88rem;border-top:1px solid var(--line);padding-top:8px}
.k{font:600 .72rem var(--font-body);letter-spacing:.03em;color:var(--muted);margin-right:6px}
.be{align-self:start;border:1px dashed var(--line);border-radius:10px;padding:12px 14px;color:var(--muted);font-size:.9rem;min-width:0}
.be.has{background:var(--surface-2);border-style:solid;color:var(--fg)}
.be.alt{border-color:var(--seam);background:var(--seam-soft);color:var(--fg)}
.be ul{margin:6px 0 0;padding-left:1.1em}
.be li{margin:2px 0}

.matrix{border-collapse:collapse;width:100%;font-size:.9rem;background:var(--surface);border:1px solid var(--line);border-radius:10px;overflow:hidden}
.mwrap{overflow-x:auto;border-radius:10px}
.matrix th,.matrix td{padding:9px 12px;border-bottom:1px solid var(--line);text-align:center}
.matrix th:first-child,.matrix td:first-child{text-align:left;font-weight:600;white-space:nowrap}
.matrix thead th{font-weight:600;color:var(--muted);font-size:.8rem;background:var(--surface-2)}
.matrix tr:last-child td{border-bottom:0}
.yes{color:var(--ours);font-weight:700}
.no{color:var(--muted)}
.cap{font-size:.88rem;color:var(--muted);margin:10px 0 0;max-width:80ch}
.callout{border-left:5px solid var(--seam);background:var(--seam-soft);border-radius:0 10px 10px 0;padding:12px 16px;margin:22px 0 0;max-width:78ch}
.callout p{margin:0}
.seams{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px;margin:12px 0 0;padding:0;list-style:none}
.seams li{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:.88rem;min-width:0}
.seams li b{font:600 .82rem var(--font-mono)}
.seams li.edit{background:var(--seam-soft);border-color:var(--seam)}
.seams li small{display:block;color:var(--muted);font-size:.78rem}
.seams li.edit small{color:var(--fg)}

/* runtime figures */
.run{margin-top:40px}
.runrow{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,1fr);gap:26px;align-items:start;margin-top:14px}
figure{margin:0;min-width:0}
.fig-wrap{overflow-x:auto;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:10px}
.fig-svg{display:block;width:100%;min-width:470px;height:auto;color:var(--muted)}
figcaption{font-size:.85rem;color:var(--muted);margin-top:8px}
.fig-svg text{font-family:var(--font-body)}
.fig-svg .tt{font:600 13px var(--font-body);fill:var(--fg)}
.fig-svg .ts{font:400 11.5px var(--font-body);fill:var(--muted)}
.fig-svg .tm{font:500 11px var(--font-mono);fill:var(--fg)}
.fig-svg .tl{font:500 11px var(--font-mono);fill:var(--muted)}
.node rect{fill:var(--surface);stroke:var(--line);stroke-width:1.3}
.node.up rect{fill:var(--up-soft);stroke:var(--up)}
.node.ours rect{fill:var(--ours-soft);stroke:var(--ours)}
.node.seam rect{fill:var(--seam-soft);stroke:var(--seam);stroke-width:1.7}
.node.ext rect{fill:var(--surface);stroke:var(--up);stroke-dasharray:5 4}
.node.alt rect{fill:var(--surface);stroke:var(--seam);stroke-dasharray:5 4;stroke-width:1.6}
.node.q rect{fill:var(--surface);stroke:var(--fg);stroke-width:1.3}
.node.box.up rect{fill:var(--up-soft)}
.node.box.seam rect{fill:var(--seam-soft)}
.edge{fill:none;stroke:currentColor;stroke-width:1.5}
.lanepath{fill:none;stroke:var(--muted);stroke-width:1.3}
.seamtag rect{fill:var(--seam)}
.seamtag text{font:700 11px var(--font-mono);fill:var(--on-seam)}
.node.now rect{stroke:var(--fg);stroke-width:3}
.edgeg.now .edge{stroke:var(--fg);stroke-width:2.8}
.fig-svg [data-from]{transition:opacity .25s}
.stepping [data-from]{opacity:.14}
.stepping [data-from].on{opacity:1}
.ctrl{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
.ctrl .status{font-size:.88rem;color:var(--muted);margin-left:4px}
.btn{font:600 .9rem var(--font-body);padding:8px 14px;border-radius:8px;border:1px solid var(--line);background:var(--surface);color:var(--fg);cursor:pointer}
.btn:hover:not(:disabled){border-color:var(--fg)}
.btn:disabled{opacity:.45;cursor:default}
.btn.primary{background:var(--fg);color:var(--bg);border-color:var(--fg)}
.steps{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.steps button{width:100%;text-align:left;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:10px 12px;cursor:pointer;display:grid;grid-template-columns:26px minmax(0,1fr);gap:10px;font:inherit;color:inherit}
.steps button:hover{border-color:var(--muted)}
.steps .n{font:600 .78rem var(--font-mono);width:24px;height:24px;border-radius:50%;border:1.5px solid var(--muted);display:grid;place-items:center;color:var(--muted)}
.steps li.active button{border-color:var(--fg);box-shadow:inset 4px 0 0 var(--ours);background:var(--surface-2)}
.steps li.active .n{background:var(--fg);border-color:var(--fg);color:var(--bg)}
.steps .t{font-weight:600;font-size:.95rem;line-height:1.35}
.steps .t .ev{margin-left:6px;vertical-align:1px}
.steps .d{display:block;font-size:.85rem;color:var(--muted);margin-top:3px;line-height:1.45}

/* classifier */
.clf{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:26px;align-items:start;margin-top:16px}
.panel{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:18px}
.panel .q{font:650 1.25rem/1.25 var(--font-display);margin:0 0 6px}
.panel .hint{color:var(--muted);font-size:.92rem;margin:0 0 14px}
.panel .answers{display:flex;gap:8px;flex-wrap:wrap}
.trail{margin:0 0 14px;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:6px;font-size:.8rem}
.trail li{background:var(--surface-2);border-radius:999px;padding:3px 10px;color:var(--muted)}
.trail li b{color:var(--fg)}
.outcome h3{font-size:1.3rem;margin-bottom:10px}
.outcome dl{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:6px 14px;margin:0 0 14px;font-size:.92rem}
.outcome dt{font:600 .78rem var(--font-body);color:var(--muted);padding-top:2px}
.outcome dd{margin:0}
.tmap{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:6px}
.tmap li{border:1px solid var(--line);border-radius:8px;padding:6px 4px;text-align:center;background:var(--surface);min-width:0}
.tmap b{display:block;font:600 .8rem var(--font-mono)}
.tmap span{display:block;font-size:.68rem;color:var(--muted);line-height:1.25;overflow-wrap:anywhere}
.tmap em{display:block;font-style:normal;font-size:.66rem;font-weight:600;margin-top:3px;color:var(--muted)}
.tmap li.lit{border:2px solid var(--ours);background:var(--ours-soft);padding:5px 3px}
.tmap li.lit em{color:var(--fg)}
.tmap li[data-l="L6"].lit,.tmap li[data-l="L7"].lit{border-color:var(--seam);background:var(--seam-soft)}
.tmap li[data-l="BE"].lit{border-color:var(--seam);border-style:dashed;background:var(--seam-soft)}
.proc{counter-reset:p;list-style:none;margin:16px 0 0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 22px}
.proc li{counter-increment:p;position:relative;padding-left:38px;font-size:.95rem}
.proc li::before{content:counter(p);position:absolute;left:0;top:1px;width:26px;height:26px;border-radius:50%;border:1.5px solid var(--fg);display:grid;place-items:center;font:600 .8rem var(--font-mono)}
.proc b{font-weight:650}
.proc span{display:block;color:var(--muted);font-size:.88rem}
.ex{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin-top:16px}
.ex article{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:18px;min-width:0}
.ex h3{margin-bottom:2px}
.ex .sub{color:var(--muted);font-size:.9rem;margin:0 0 12px}
.ex ol{margin:14px 0 0;padding-left:1.2em;font-size:.92rem}
.ex li{margin:4px 0}
.tbl{width:100%;border-collapse:collapse;font-size:.9rem;background:var(--surface);border:1px solid var(--line);border-radius:10px;overflow:hidden}
.tbl th,.tbl td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--line);vertical-align:top}
.tbl thead th{background:var(--surface-2);font-size:.8rem;color:var(--muted);font-weight:600}
.tbl tr:last-child td{border-bottom:0}
.sub2{margin-top:36px}
.foot{margin-top:56px;padding-top:16px;border-top:1px solid var(--line);font-size:.85rem;color:var(--muted)}
.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px;margin-top:16px}
.two ul{margin:0;padding-left:1.15em}
.two li{margin:5px 0;font-size:.95rem}

@media (max-width:900px){
  .hero{grid-template-columns:minmax(0,1fr);gap:24px}
  .runrow,.clf,.ex,.two{grid-template-columns:minmax(0,1fr)}
  .proc{grid-template-columns:minmax(0,1fr)}
  .ask3,.legend{grid-template-columns:minmax(0,1fr)}
  .tmap{grid-template-columns:repeat(4,minmax(0,1fr))}
}
@media (max-width:720px){
  .lanes{display:none}
  .layer{grid-template-columns:minmax(0,1fr);gap:8px}
  .stack{padding-left:20px}
  .rail{display:none}
  section{padding-top:44px}
}
@media (prefers-reduced-motion: reduce){
  *{transition:none!important;animation:none!important;scroll-behavior:auto!important}
}
"""
CSS += r"""
.be.mod{border-style:solid;border-color:var(--ours);background:var(--ours-soft);color:var(--fg)}
.bepair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px}
.ns{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px;margin:12px 0 0;padding:0;list-style:none}
.ns li{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:.88rem;min-width:0}
.ns li code{display:block;color:var(--ours);font-weight:600;overflow-wrap:anywhere}
.ns li span{display:block;color:var(--muted);font-size:.8rem}
.rules{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:12px}
.rules article{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:14px 16px;min-width:0}
.rules h3{font-size:1.02rem}
.rules p{font-size:.92rem;margin:0 0 .5em}
.rules p:last-child{margin-bottom:0}
.rules .ref{font-size:.82rem;color:var(--muted)}
.tw{overflow-x:auto}
.tbl td code{overflow-wrap:anywhere}
.dec td:first-child,.dec th:first-child{white-space:nowrap}
.plain{margin:8px 0 0;padding-left:1.15em}
.plain li{margin:5px 0;font-size:.95rem;max-width:80ch}
@media (max-width:900px){.bepair,.rules{grid-template-columns:minmax(0,1fr)}}
"""

# ------------------------------------------------------------------ hero
def codecard():
    return """
<div class="codecard">
  <div class="path"><span>public/app/routes/RoutesWrapper.tsx</span><span>SM01, line 9 of v13.3.0</span></div>
<pre aria-label="One-line change to the import of AppChrome"><span class="ln ctx">import { ModalRoot, Stack } from '@grafana/ui';</span><span class="ln ctx"> </span><span class="ln del">import { AppChrome } from '../core/components/AppChrome/AppChrome';</span><span class="ln add">import { AppChrome } from '../orbit/entry';</span><span class="ln ctx">import { AppChromeExtensionPoint } from '../core/components/AppChrome/AppChromeExtensionPoint';</span></pre>
  <div class="cap">The JSX on lines 35 and 47 stays as it is. <code>orbit/entry</code> exports an <code>AppChrome</code> that renders the new shell or, as the safe default, the stock one.</div>
</div>"""

def becards():
    return f"""
<div class="bepair">
<div class="codecard">
  <div class="path"><span>pkg/server/wire_core.go</span><span>SM13</span></div>
<pre aria-label="Seam SM13: an import and one provider line"><span class="ln ctx">	"github.com/grafana/grafana/pkg/services/queryhistory"</span><span class="ln add">	"github.com/grafana/grafana/pkg/orbit"</span><span class="ln ctx"> </span><span class="ln ctx">	queryhistory.ProvideService,</span><span class="ln add">	orbit.ProvideService,</span></pre>
  <div class="cap">Same pattern as query history (lines 150 and 260). <code>wire_gen.go</code> is regenerated with <code>make gen-go</code>, never edited by hand.</div>
</div>
<div class="codecard">
  <div class="path"><span>pkg/services/sqlstore/migrations/migrations.go</span><span>SM14</span></div>
<pre aria-label="Seam SM14: an import and one migration line"><span class="ln ctx">	"github.com/grafana/grafana/pkg/services/sqlstore/migrations/anonservice"</span><span class="ln add">	orbitmigrations "github.com/grafana/grafana/pkg/orbit/migrations"</span><span class="ln ctx"> </span><span class="ln ctx">	anonservice.AddMigration(mg)</span><span class="ln add">	orbitmigrations.AddMigration(mg)</span></pre>
  <div class="cap">A leaf package that imports only <code>migrator</code>, like <code>anonservice</code>. Anything more would be an import cycle, because <code>sqlstore</code> imports <code>migrations</code>.</div>
</div>
</div>
<p class="cap">Pattern {ev("V")} read in v13.3.0. Our lines {ev("P")}: not built yet (RK24). Where the lines sit in each list is illustrative.</p>"""

# ------------------------------------------------------------------ layers
LAYERS = [
 dict(cls="L-ext", id="L1", name="Plugin contract", where="other repositories",
  resp="Ships an app: plugin.json with includes[], a ui.json sidecar with requires.orbit, a frontend module, and an optional Go backend.",
  pats=[("Manifest sidecar", "keeps UI-only fields out of plugin.json, where Grafana's loader would drop them"),
        ("Data over code", "per-app UI behaviour is a manifest, not code inside the fork")],
  imp="Public @grafana/* packages only.",
  be=("has", "Go plugin SDK in the app's own repository, with the standard version API (OD29) and the app's own schema version (OD25). A static route serves ui.json (SM10). The nav tree is built from includes (SM09).")),
 dict(cls="L-ours", id="L2", name="Pages", where="orbit/pages/, apps/AppsView, apps/DockPagesView",
  resp="Page templates P01 to P07 and the new routes, such as the lifecycle page /apps/:id/setup.",
  pats=[("Composition over copy", "wraps the upstream Page, so upstream fixes still arrive"),
        ("Strangler", "core pages adopt the templates one at a time, never as a big-bang cutover")],
  imp="L4, theme/, upstream/page.ts.", be=("", "None.")),
 dict(cls="L-ours", id="L3", name="Shell", where="orbit/shell/",
  resp="Frame, top bar, dock, menu sheet, switchers.",
  pats=[("Overlay and view-swap behind a stable model", "pages keep writing to AppChromeService; only the view changes"),
        ("Kill switch with a stock default", "a broken shell can always be turned off"),
        ("Observer", "reads chrome.useState(), never calls chrome.update(...)")],
  imp="L4, theme/, upstream/chrome.ts.", be=("", "None.")),
 dict(cls="L-ours", id="L4", name="Apps domain", where="orbit/apps/, apps/manifest/",
  resp="App registry, manifest parsing, bookmark resolution, the active app, and the lifecycle client.",
  pats=[("Resolver", "each rule (user, then org, then computed) lives once, so views cannot disagree"),
        ("Null object, fail soft", "a missing or invalid manifest yields defaults and one warning"),
        ("Parse, do not cast", "lint bans as and any, so inputs are parsed by hand")],
  imp="orbit/upstream/* only.",
  be=("has", "Reads the nav tree (SM09), Preferences (SM08), userstorage (SM11) and plugin files (SM10). Reads and writes the lifecycle through /api/orbit, by way of L5.")),
 dict(cls="L-ours", id="L5", name="ACL", where="orbit/upstream/",
  resp="Small, stable functions named after what we need, not after how Grafana builds it.",
  pats=[("Anti-Corruption Layer", "an upstream rename changes one file here, not many"),
        ("Contract tests", "one per function, run on real upstream modules, so they fail when upstream shifts")],
  imp="Grafana internals. The only layer that may.",
  be=("has", "The API and JSON shapes consumed here, /api/orbit included.")),
 dict(cls="L-seam", id="L6", name="Seams", where="SM01 to SM14, .orbit/seams.json",
  resp="The only points where the overlay meets Grafana.",
  pats=[("Seam registry and drift guard", "CI rejects any upstream edit that is not on the list"),
        ("One line per Grafana release", "our commits are copied onto each new orbit/<version> line; git rerere remembers conflict fixes")],
  imp="n/a",
  be=("has", "SM08 to SM12 are existing server features used as they are. SM13 and SM14 register pkg/orbit.")),
 dict(cls="L-up", id="L7", name="Grafana", where="public/app/**, pkg/**",
  resp="Everything else, as shipped. We follow it and do not edit it.",
  pats=[("Followed, not forked", "every Grafana release gets its own Orbit line; nothing is rebased")],
  imp="n/a",
  be=("has", "Nav tree, Preferences, plugin loader. Unchanged except the SM13 and SM14 lines.")),
]

def layer_stack():
    out = ['<div class="lanes" aria-hidden="true"><span>Frontend lane: public/app/orbit</span><span>Backend lane: existing APIs plus pkg/orbit</span></div>',
           '<div class="stack" role="list"><span class="rail" aria-hidden="true">imports point down</span>']
    for L in LAYERS:
        pats = "".join(f'<li><b>{esc(a)}</b> <span class="why">{esc(b)}</span></li>' for a, b in L["pats"])
        beclass = {"has": "be has", "": "be"}[L["be"][0]]
        out.append(f'''<article class="layer {L["cls"]}" role="listitem">
 <div class="fe"><div class="lh"><span class="lid">{L["id"]}</span><h3>{esc(L["name"])}</h3><code>{esc(L["where"])}</code></div>
 <p class="resp">{esc(L["resp"])}</p><ul class="pats">{pats}</ul>
 <p class="imp"><span class="k">May import</span>{esc(L["imp"])}</p></div>
 <div class="{beclass}"><span class="k">Backend</span><br>{esc(L["be"][1])}</div></article>''')
    out.append('''<article class="layer" role="listitem"><div></div>
 <div class="be mod"><span class="k">Backend module, in v1</span><br><code>pkg/orbit</code> (OD23, trigger T6): tables <code>orbit_*</code>, API <code>/api/orbit/…</code>, settings <code>[orbit.apps]</code>. It registers its own routes like Grafana's own services, and is wired by SM13 and SM14.</div></article>''')
    out.append('''<article class="layer" role="listitem"><div></div>
 <div class="be alt"><span class="k">Backend, only when triggered</span><br>An in-tree App SDK app under <code>apps/</code>, on triggers T1 to T5. It costs registration edits, a Wire regeneration and a separate pull request.</div></article>''')
    out.append("</div>")
    return "".join(out)

def matrix():
    cols = ["Pages", "Shell", "Apps domain", "ACL", "Grafana internals", "Public packages"]
    rows = [
        ("L2 Pages", ["–", "no", "yes", "yes", "no", "yes"]),
        ("L3 Shell", ["no", "–", "yes", "yes", "no", "yes"]),
        ("L4 Apps domain", ["no", "no", "–", "yes", "no", "yes"]),
        ("L5 ACL", ["no", "no", "no", "–", "yes", "yes"]),
    ]
    h = '<div class="mwrap"><table class="matrix"><caption class="sr" style="position:absolute;left:-9999px">Which layer may import which</caption><thead><tr><th>Importer</th>' + "".join(f"<th>{c}</th>" for c in cols) + "</tr></thead><tbody>"
    for name, vals in rows:
        h += f"<tr><td>{name}</td>"
        for v in vals:
            if v == "yes": h += '<td class="yes" aria-label="allowed">allowed</td>'
            elif v == "no": h += '<td class="no" aria-label="not allowed">not allowed</td>'
            else: h += '<td class="no" aria-label="itself">·</td>'
        h += "</tr>"
    return h + "</tbody></table></div>"

SEAMS = [
 ("SM01", "RoutesWrapper import", "edit, required, one line", True), ("SM02", "AppChromeService state", "existing API", False),
 ("SM03", "extraRoutes", "existing hook", False), ("SM04", "AppWrapper hooks", "existing hook", False),
 ("SM05", "Branding", "existing hook", False), ("SM06", "i18n extraction ignore", "edit, optional, one line", True),
 ("SM07", "Kill-switch input", "config", False), ("SM08", "Preferences bookmarkUrls", "existing API", False),
 ("SM09", "Nav tree and app metas", "read only", False), ("SM10", "Plugin static files, ui.json", "existing route", False),
 ("SM11", "userstorage, orbit-bookmarks", "existing API", False), ("SM12", "AddIndexDataHook", "reserved, unused in v1", False),
 ("SM13", "pkg/orbit provider, wire_core.go", "edit, required, import and one line", True),
 ("SM14", "orbit_* migrations, migrations.go", "edit, required, import and one line", True),
]
def seam_list():
    return '<ul class="seams">' + "".join(
        f'<li class="{"edit" if e else ""}"><b>{i}</b> {esc(n)}<small>{esc(k)}</small></li>' for i, n, k, e in SEAMS) + "</ul>"

# ------------------------------------------------------------------ runtime
def steps_html(items):
    out = ['<ol class="steps">']
    for i, (title, detail, e) in enumerate(items, 1):
        out.append(f'<li data-i="{i}"><button type="button"><span class="n">{i}</span><span><span class="t">{esc(title)} {ev(e)}</span><span class="d">{detail}</span></span></button></li>')
    out.append("</ol>")
    return "".join(out)

def stepper(sid, figure_svg, caption, items, title):
    return f'''<div class="run" id="{sid}"><h3>{esc(title)}</h3>
<div class="runrow" data-stepper>
 <figure><div class="fig-wrap fig">{figure_svg}</div><figcaption>{caption}</figcaption></figure>
 <div><div class="ctrl"><button class="btn" type="button" data-act="prev">Back</button><button class="btn primary" type="button" data-act="next">Next step</button><button class="btn" type="button" data-act="all">Show all</button><span class="status" aria-live="polite"></span></div>
 {steps_html(items)}</div></div></div>'''

LOAD = [
 ("The bundle loads and AppWrapper renders RouterWrapper.", "AppWrapper.tsx imports it on line 30 and renders it on line 154.", "V"),
 ("RoutesWrapper imports AppChrome from orbit/entry (SM01).", "Line 9 is the only required frontend edit. Not built yet, so the v0.1 spike has to prove it.", "I"),
 ("The import runs orbit/entry once.", "It pushes routes into <code>extraRoutes</code> (SM03) and registers hooks (SM04, SM05). Routes are read at render (<code>AppWrapper.tsx:108</code>, verified), so they are in place first. An import cycle through <code>routes.tsx</code> is unchecked.", "I"),
 ("RouterWrapper renders <AppChrome>, which is now ShellSwitch.", "The position of the JSX is at <code>RoutesWrapper.tsx:35</code> and <code>47</code>. Which component sits there is what SM01 changes.", "V"),
 ("ShellSwitch reads the kill switch. If it cannot, stock wins.", "Recommended: a build-time default plus a local override, <code>?orbitShell=off</code> (OD1).", "P"),
 ("Switch on: AppShell renders the page as children. Switch off: the stock AppChrome does.", "Both read the same state, so the page does not change.", "I"),
 ("The page calls chrome.update(...) with sectionNav, pageNav and actions.", "<code>Page.tsx:49</code>. Pages never know which shell is active.", "V"),
 ("The shell reads that state through orbit/upstream and re-renders.", "Breadcrumb and top-bar actions update. <code>useChromeState()</code> wraps <code>chrome.useState()</code>.", "I"),
]
LIFE = [
 ("Install with grafana-cli.", "From the catalog or a direct ZIP URL, by a Server Admin (<code>plugins:install</code>). The UI never installs (OD17, OD18 withdrawn).", "V"),
 ("Restart: the loader reads plugin.json and checks the signature.", "Production keeps <code>allow_loading_unsigned_plugins</code> empty, so a modified app does not load. Apps shows the app as Not initialized.", "V"),
 ("Initialize runs the checks that need no app backend.", "Grafana version and compatibility, loading, signature, dependencies, the manifest, and <code>requires.orbit</code> against the Orbit API version.", "P"),
 ("Review: an Org Admin accepts the results.", "The acceptance and the accepted version go to <code>orbit_app_lifecycle</code> in <code>pkg/orbit</code> (OD23), so the gate cannot be skipped from the browser.", "P"),
 ("Setup and validate.", "Organisation, users and permissions, sub page permissions, data sources, app fields, icon and colour (board S16). Problems show and can be fixed before Enable.", "P"),
 ("Enable writes Grafana's own enabled setting.", "<code>plugins:write</code>, Org Admin. Health runs now, because <code>checkAppEnabled</code> answers only for an enabled app (<code>api.go:437</code>).", "V"),
 ("Migrate, if the app has pending migrations.", "After Enable, in maintenance mode: Org Admins only. Starts by itself unless <code>[orbit.apps] auto_migrate</code> is off. A failure disables the app; Retry enables it and runs it again (OD28).", "P"),
 ("Apps, pages and Manage.", "Authorized pages and bookmarks; Manage on the card (board S15). No audit list in v1: Grafana OSS has none (OD27); a global audit comes later (OD30).", "P"),
]
UPDATE = [
 ("A Server Admin updates the app with grafana-cli and restarts.", "Updates stay on the server, like installs.", "V"),
 ("pkg/orbit compares the loaded version with the stored one.", "At start-up and on read. Grafana does the same for app dashboards with <code>plugin_setting.plugin_version</code> (<code>dashboard_updater.go</code>, verified).", "P"),
 ("A: same version. Nothing happens.", "All steps show Done. There is no Run migration button.", "P"),
 ("B: simple update. The Initialize checks run by themselves.", "Passed: the app stays Enabled and the Version block on board S15 shows the last update. Failed: Action required, in maintenance mode.", "P"),
 ("C: an update that needs an admin.", "New permissions, data sources, pages or required fields. Maintenance mode; the lifecycle opens at the first step that needs action, with what changed. Old settings are kept (board S21).", "P"),
 ("D: a new schema version, or a downgrade.", "D: maintenance mode, and the migration starts when Validate passes. Downgrade: Action required, because a migration cannot go backwards.", "P"),
]
BOOK = [
 ("The user bookmarks a page.", "From the MenuSheet header, the add-bookmark popover in the dock (board S20) or the bookmarks page, DockPagesView (board S11). Only nav-item URLs can be bookmarked.", "P"),
 ("useBookmarks builds the new list and its details.", "The write goes through it. Views never call the API.", "P"),
 ("One PATCH stores the ordered list in the user's preferences.", "<code>spec.navbar.bookmarkUrls</code>. The stock menu writes the same field the same way (<code>MegaMenu/hooks.ts:105,121-124</code>), so both shells see the same bookmarks.", "V"),
 ("The details go to user storage.", "Service <code>orbit-bookmarks</code>, key <code>bookmarks.v1</code>: show in the dock, label, show name, added, source. Details of a URL that left the list are dropped on the next write.", "P"),
 ("On load the dock reads the user and the namespace resources.", "Whether a normal user's list call returns the namespace item is unverified (RK17).", "N"),
 ("It resolves in the client: user list, else org list, else computed.", "Client-side resolution lets a user keep a deliberately empty dock. Team-level values are ignored in v1 (OD2).", "P"),
]

# ------------------------------------------------------------------ add a concept
TOUCH = [("L1", "Plugin"), ("L2", "Pages"), ("L3", "Shell"), ("L4", "Apps domain"), ("L5", "ACL"), ("L6", "Seams"), ("L7", "Grafana"), ("BE", "Backend")]
def touchmap(lit=()):
    h = '<ol class="tmap" aria-label="Layers a change touches">'
    for k, n in TOUCH:
        c = " lit" if k in lit else ""
        h += f'<li data-l="{k}" class="{c.strip()}"><b>{k}</b><span>{n}</span><em>{"changes" if k in lit else "none"}</em></li>'
    return h + "</ol>"

PROC = [
 ("Classify", "Use the tree. Write five lines in the pull request: the concept, the layer, where its data lives, which seams it touches, how it is deleted."),
 ("Name the contract first", "If it reads Grafana state, add a function in orbit/upstream and its contract test before any view code."),
 ("Define the data shape", "Types plus a hand-written parser. No as, no any. Invalid input gives defaults and one warning."),
 ("Build bottom-up", "Hook in L4, then the view in L2 or L3, from @grafana/ui and theme tokens, checked against the Grafana UI Storybook. Strings through t(). Effects safe under StrictMode."),
 ("Register through an existing seam", "Only if none fits, add a seam, list it in .orbit/seams.json with maxChangedLines, and justify it. This is the only step that adds conflict surface."),
 ("Test", "Contract test for the ACL function, unit test for the parser and resolver, a component test in StrictMode; Go tests for anything in pkg/orbit."),
 ("Run the guards", "Seam allow-list, import boundaries, namespace and AI-file checks, the deletable check, lint, typecheck, Jest."),
 ("Update the docs", "The traceability table, the seam table if it changed, .orbit/CHANGELOG.md, and the Orbit API version if apps see the change."),
]
def proc_html():
    return '<ol class="proc">' + "".join(f"<li><b>{esc(a)}</b><span>{esc(b)}</span></li>" for a, b in PROC) + "</ol>"

OUTCOMES = {
 "r1": dict(title="App plugin in its own repository", lit=["L1"],
   rows=[("Lives in", "Its own plugin repository (L1)"), ("Data", "plugin.json includes[]; ui.json with requires.orbit"), ("Upstream edits", "None"),
         ("Backend change", "None in the fork. An optional Go backend stays in the plugin repository, with the standard version API (OD29)."), ("Example", "A maintenance app, or its work-orders page")]),
 "r2": dict(title="New seam, as a last resort", lit=["L6", "L7"],
   rows=[("Lives in", "A small edit of an upstream file (L6)"), ("Data", "n/a"),
         ("Upstream edits", "As few lines as possible, listed in .orbit/seams.json with maxChangedLines and a justification; commit prefix orbit(seam):"),
         ("Backend change", "None"), ("Before you do it", "Try the existing hooks first: SM03 extraRoutes, SM04 AppWrapper hooks, SM05 Branding")]),
 "r3": dict(title="Additive field in ui.json", lit=["L1", "L4", "L3"],
   rows=[("Lives in", "Manifest parser (L4) plus a view (L2 or L3)"), ("Data", "A new optional key in ui.json. Older loaders ignore it, so schemaVersion stays 1."),
         ("Upstream edits", "None"), ("Backend change", "None"), ("Example", "shortcuts for the Add menu (example A below)")]),
 "r4": dict(title="Overlay module", lit=["L4", "L3"],
   rows=[("Lives in", "A hook in L4 and a view in L3 or L2"), ("Data", "Memory, userstorage (SM11), or a Preferences key"),
         ("Upstream edits", "None"), ("Backend change", "None"), ("Example", "Dock position, a keyboard-hint overlay")]),
 "r6": dict(title="Table or route in pkg/orbit", lit=["BE", "L5", "L4"],
   rows=[("Lives in", "The pkg/orbit module, read through a function in orbit/upstream"), ("Data", "An orbit_* table with a Grafana-style migration; a route under /api/orbit/"),
         ("Upstream edits", "None. SM13 and SM14 already wire the module."),
         ("Backend change", "Yes, in our module, in a separate pull request"), ("Example", "The review acceptance and the last accepted version of an app")]),
 "r5": dict(title="In-tree App SDK app", lit=["BE", "L5", "L4", "L3"],
   rows=[("Lives in", "A new apps/&lt;name&gt; backend app, read through an ACL adapter"), ("Data", "A new resource"),
         ("Upstream edits", "Registration files (wireset.go, apps.go), then make gen-go"),
         ("Backend change", "Yes, in a separate pull request"), ("Triggers", "T1 server-side validation, T2 authorization, T3 org-wide control, T4 aggregation, T5 audit or watch")]),
}
QUESTIONS = {
 "q1": dict(t="Is it a whole app, or a page inside an app?", h="Apps and pages are Grafana app plugins in their own repositories.", yes="r1", no="q2"),
 "q2": dict(t="Must it change what an upstream Grafana page does?", h="Changing behaviour inside an upstream page needs a seam.", yes="r2", no="q3"),
 "q3": dict(t="Does it need data that no existing API holds?", h="Existing stores: the nav tree, Preferences, userstorage, plugin files.", yes="q5", no="q4"),
 "q4": dict(t="Is the data per app?", h="Per-app data belongs in the manifest. Everything else lives in an overlay module.", yes="r3", no="r4"),
 "q5": dict(t="Can Preferences or userstorage hold it?", h="Preferences holds the bookmark list. userstorage is a per-user store; orbit-bookmarks lives there.", yes="r4", no="q6"),
 "q6": dict(t="Is it app lifecycle state, or other state that Orbit owns?", h="pkg/orbit already owns orbit_* tables and /api/orbit. Adding to it needs no new seam.", yes="r6", no="r5"),
}

def example(title, sub, lit, steps, foot):
    li = "".join(f"<li>{s}</li>" for s in steps)
    return f'<article><h3>{esc(title)}</h3><p class="sub">{sub}</p>{touchmap(lit)}<ol>{li}</ol><p class="cap">{foot}</p></article>'

# ------------------------------------------------------------------ fork rules
NS = [
 (".orbit/", "fork tooling, VERSION, COMPAT.md, CHANGELOG.md, docs, CI guards"),
 ("public/app/orbit/", "frontend overlay"),
 ("pkg/orbit/", "backend module"),
 ("orbit/13.3.1", "one branch per Grafana release"),
 ("v13.3.0+orbit.4", "git tag; Docker 13.3.0-orbit.4"),
 ("[orbit] [orbit.apps] [orbit.audit]", "grafana.ini sections; auto_migrate"),
 ("orbit_app_lifecycle", "tables, prefix orbit_"),
 ("/api/orbit/…", "HTTP API of the backend module"),
 ("orbit-bookmarks", "user storage service"),
 ("requires.orbit", "app manifest field in ui.json"),
 (".claude/skills/orbit-*", "our agent skills"),
 ("orbit(seam): …", "commit prefix for upstream edits"),
]
VERS = [
 ("Grafana", "upstream, unchanged", "<code>13.3.0</code>", "Upstream tag. Never changed: Grafana sends it to the plugin catalog to pick compatible plugins (<code>client.go:218-219</code>)."),
 ("Fork release", "<code>v&lt;upstream&gt;+orbit.&lt;n&gt;</code>", "<code>v13.3.0+orbit.4</code>", "Git tag. Docker: <code>13.3.0-orbit.4</code>. <code>n</code> starts at 1 again on each upstream tag."),
 ("Orbit API", "SemVer", "<code>1.4.0</code>", "<code>.orbit/VERSION</code>. Major when apps or users break. Apps declare <code>requires.orbit</code>."),
 ("Each app", "its own SemVer", "<code>0.4.0</code>", "<code>plugin.json</code> <code>info.version</code>, with <code>grafanaDependency</code> checked by Grafana."),
]
GUARDS = [
 ("Seam allow-list", "Upstream changes only on the SM list, within maxChangedLines; wire_gen.go equals make gen-go", "accidental upstream edits"),
 ("Import boundaries", "The layer rules above", "Grafana internals leaking into the overlay"),
 ("Contract tests", "One per upstream/ function", "silent breakage on upgrade"),
 ("Deletable check", "Remove the orbit paths, revert SM01, SM06, SM13, SM14, regenerate Wire: stock Grafana", "hidden coupling"),
 ("Namespace check", "No upstream path, ini section, table, route or skill named orbit", "a future collision with our name"),
 ("AI files check", "Grafana's CLAUDE.md, AGENTS.md, skills, AI_POLICY.md, .gitignore unchanged", "agent configuration conflicts"),
 ("Lint, typecheck, Jest", "The repository's own commands", "regressions"),
]

# ------------------------------------------------------------------ status
DECIDED = [
 ("OD23", "Lifecycle state in our own table, <code>orbit_app_lifecycle</code>, in the isolated module <code>pkg/orbit</code>"),
 ("OD24", "App self-tests: checks without the app backend before Enable, backend self-tests after"),
 ("OD27", "No user audit in v1: Grafana OSS has no audit log"),
 ("OD28", "Migrations run after Enable, in maintenance mode, Org Admins only; <code>auto_migrate</code> on by default"),
 ("OD29", "Check for updates reads a standard version API in each app"),
 ("OD31", "Update detection by version compare; cases A to D and downgrade (board S21)"),
 ("OD32", "Icons: Grafana Unicons plus Tabler, stored as <code>grafana:</code> or <code>tabler:</code> names"),
 ("OD33", "One namespace, <code>orbit</code>"),
 ("OD34", "Grafana's version stays upstream; fork releases <code>+orbit.&lt;n&gt;</code>; Orbit API in SemVer"),
 ("OD35", "Grafana's AI files are never edited; ours are directory-scoped"),
]
OPEN = [
 ("OD1", "Kill switch: build-time default plus local override (A), or a legacy flag (B)", "v0.1"),
 ("OD4", "Version slicing (section 16)", "now"),
 ("OD3", "Fullscreen workspace: delegate to the upstream shell, or support it in AppShell", "v0.2"),
 ("OD5", "Places for the top-bar parts that have none (Help, page actions, scopes selector, extension items)", "v0.2"),
 ("OD6", "Header geometry: 63px top bar plus 36px breadcrumb row, or the 40/48px row", "v0.2"),
 ("OD7", "Who reserves room for the dock and which element scrolls", "v0.2"),
 ("OD8", "Per-bookmark details: userstorage (proposal accepted in review) or Preferences", "v0.3"),
 ("OD9, OD13", "App rules from board S13 (icon, accent contrast) and which Grafana sections form which built-in app", "v0.4"),
 ("OD16", "Which roles may take which lifecycle action", "v0.4"),
 ("OD19, OD22", "Unsigned apps; sub pages of app plugins", "v0.4"),
 ("OD25, OD26", "Contract for app migrations; which transitional states get their own card status", "v0.4"),
 ("OD30", "One global audit log, to files or Loki, after v1", "later"),
]
UNVERIFIED = [
 "Nothing has been built, type-checked, linted or tested (RK01).",
 "The SM01 swap and import-time route registration (RK02).",
 "The pkg/orbit wiring: SM13, the regenerated wire_gen.go, and SM14 on SQLite, MySQL and PostgreSQL (RK24).",
 "Whether the server evaluates a kill-switch key that is not in the registry (RK03).",
 "Whether Jest, tsconfig and rspack pick up public/app/orbit (RK13).",
 "Org-level write of the bookmarks, resetting a user's value, and whether a normal user sees the namespace item (RK04, RK05, RK17).",
 "Whether a signed plugin accepts an extra ui.json file (RK06).",
 "Rollback of an app package and of its database is not designed yet.",
]

BODY = f"""
<nav class="nav" aria-label="Sections"><div class="wrap"><span class="brand">Orbit map</span>
<a href="#layers">Layers</a><a href="#runtime">How it runs</a><a href="#new-concept">Add a concept</a><a href="#fork">Fork rules</a><a href="#status">Status</a></div></nav>
<div class="wrap">
<header class="hero">
 <div><h1>One import line decides who draws Grafana's frame</h1>
 <p class="lead">The new UI lives in new files under one name, <code>orbit</code>, and stock Grafana stays as shipped. The fork swaps the shell at a single import, and every page keeps working because pages talk to the shell through the state they already write. On the server, one isolated module keeps the app lifecycle.</p>
 <p class="facts"><b>Required upstream edits:</b> 3, all in the seam list: SM01 (frontend, one line), SM13 and SM14 (backend module, an import and one line each). <b>Optional:</b> SM06, one line. <b>Backend:</b> one module, <code>pkg/orbit</code>. Based on Grafana v13.3.0, read but not yet built.</p></div>
 {codecard()}
</header>
<div class="ask3">
 <a href="#layers"><b>How is it layered?</b><span>Seven layers and one backend module. One layer touches Grafana internals.</span></a>
 <a href="#runtime"><b>How does it work?</b><span>Page load, the life of an app, an update, and bookmarks, step by step.</span></a>
 <a href="#new-concept"><b>How do I add a concept?</b><span>Answer up to six questions, then follow one procedure.</span></a>
</div>
<div class="legend">
 <div><h3>Who owns what</h3><ul>
  <li><span class="sw"></span>Grafana as shipped</li><li><span class="sw ours"></span>Ours: new files, new tables, new routes</li>
  <li><span class="sw seam"></span>A seam: where we touch Grafana</li><li><span class="sw ext"></span>Outside the fork, or only when triggered</li></ul></div>
 <div><h3>How sure the claim is</h3><ul>
  <li>{ev("V")} read in the v13.3.0 source</li><li>{ev("I")} deduced from code, not run</li>
  <li>{ev("N")} unknown, with a named check</li><li>{ev("P")} a rule for code not yet written</li></ul></div>
</div>

<section id="layers"><h2>Seven layers, one direction of dependency</h2>
<p>Each layer has one job and a main pattern, and the pattern names what it protects against. Imports point down. Only L5 may import Grafana internals, so a Grafana rename costs one adapter file and one contract test. The backend lane uses Grafana's existing APIs, plus one module of our own for the app lifecycle.</p>
{layer_stack()}
<div class="sub2"><h3>Who may import whom</h3>{matrix()}
<p class="cap">Checked in CI by <code>.orbit/check-boundaries.mjs</code> {ev("P")}. The repository's <code>eslint.config.js</code> is an upstream file, so the rules are not added there.</p></div>
<div class="sub2"><h3>Seams: three required edits, one optional, ten existing hooks and APIs</h3>{seam_list()}
{becards()}
<div class="callout"><p><b>Deletable.</b> Remove <code>public/app/orbit/</code>, <code>pkg/orbit/</code>, <code>.orbit/</code> and our AI files, revert SM01, SM06, SM13 and SM14, regenerate <code>wire_gen.go</code>, and you have stock Grafana again. CI runs that check on every pull request. Left-over <code>orbit_*</code> tables are ignored: Grafana's migrator only looks up its own migrations ({ev("V")} <code>migrator.go:349-350</code>).</p></div></div>
</section>

<section id="runtime"><h2>How it runs</h2>
<p>Four paths matter. Press Next step to walk through one: the figure lights up what has happened so far, and every step says how sure the claim is.</p>
{stepper("load", K.fig_load(), "The slot highlighted in amber is seam SM01. Pages write to AppChromeService, and whichever shell is active reads it.", LOAD, "From page load to a rendered page")}
{stepper("life", K.fig_life(), "Install and discovery belong to the Grafana server. Everything from Initialize on is the apps module: the lifecycle page <code>/apps/:id/setup</code> in the frontend and <code>pkg/orbit</code> on the server. Boards R10, S12, S15, S16, S18.", LIFE, "The life of an app")}
{stepper("update", K.fig_update(), "Only cases C and D need an admin. Board S21; table on R10.", UPDATE, "After an app update")}
{stepper("bookmark", K.fig_bookmark(), "Only the writes are server calls. The read side resolves in the client. Bookmarks replaced pins on 2026-11-06.", BOOK, "Bookmarking a page")}
</section>

<section id="new-concept"><h2>Adding a new concept</h2>
<p>A concept is anything new the product should have: an app, a page, a shell feature, a metadata field, a setting, a rule. Decide where it lives before writing code. Answer the questions; the tree lights up your path.</p>
<div class="clf">
 <div class="panel" id="clf" aria-live="polite"></div>
 <figure><div class="fig-wrap" id="tree">{K.fig_tree()}</div><figcaption>Six questions, six outcomes. Dashed amber marks the one outcome that needs a new in-tree App SDK app.</figcaption></figure>
</div>
<div class="sub2"><h3>The same procedure for every concept</h3>{proc_html()}</div>
<div class="sub2"><h3>Two worked examples</h3>
<div class="ex">
{example("An app's shortcuts in the Add menu", "Illustrative, not in the design. No upstream edit and no backend change.", ["L1","L4","L3"],
  ["Data: an optional <code>shortcuts</code> list of label and path in <code>ui.json</code>. Additive, so <code>schemaVersion</code> stays 1.",
   "Parser in <code>apps/manifest</code> checks the label and a same-app path, caps the list and drops invalid entries.",
   "<code>useApps()</code> returns the shortcuts for each app.",
   "<code>orbit/shell/add-menu</code> renders one group per app, using <code>TextLink</code>.",
   "Tests: a parser unit test and an Add menu component test."],
  "Seams: none. <code>.orbit/seams.json</code> does not change.")}
{example("An admin locks the organization dock", "Illustrative. This hits trigger T3: Preferences cannot enforce it, and it is not app lifecycle, so it does not belong in pkg/orbit.", ["BE","L5","L4","L3"],
  ["Why not Preferences: the stock write path lets any user patch their own <code>user-&lt;uid&gt;</code> resource.",
   "Backend: a new <code>apps/&lt;name&gt;</code> App SDK app with a dock-policy resource and authorization, registered in <code>wireset.go</code> and <code>apps.go</code>, then <code>make gen-go</code>. Separate pull request.",
   "ACL: <code>upstream/policy.ts</code> reads it, with a contract test.",
   "Domain: <code>useBookmarks</code> consults the policy first. View: the dock hides the bookmark controls when locked.",
   "Docs: record the trigger and its cost in section 12."],
  "Frontend seams: none. The cost is on the backend side, which is why it is a trigger and not a default.")}
</div></div>
</section>

<section id="fork"><h2>One name, three versions, two sets of AI files</h2>
<p>The fork has to survive every upstream upgrade. Three rules keep our files apart from Grafana's: one name for everything we add, version numbers that never touch Grafana's own, and agent files that live only in our folders.</p>
<div class="sub2"><h3>One name: orbit</h3>
<p>One search finds all our code, nothing upstream is called <code>orbit</code> (checked in v13.3.0 and on <code>main</code>), and deleting the <code>orbit</code> paths gives stock Grafana again. The earlier name <code>custom</code> matched 1,899 Grafana files.</p>
<ul class="ns">{''.join(f"<li><code>{esc(a)}</code><span>{esc(b)}</span></li>" for a, b in NS)}</ul></div>
<div class="sub2"><h3>Three version numbers, kept apart</h3>
<div class="tw"><table class="tbl"><thead><tr><th>What</th><th>Format</th><th>Example</th><th>Where and why</th></tr></thead><tbody>
{''.join(f"<tr><td>{a}</td><td>{b}</td><td>{c}</td><td>{d}</td></tr>" for a, b, c, d in VERS)}</tbody></table></div>
<p class="cap">Why <code>+orbit</code> and not <code>-patch</code>: in SemVer, anything after <code>-</code> is a pre-release and sorts before <code>13.3.0</code>; anything after <code>+</code> is build metadata. Docker tags cannot hold <code>+</code>, so images use <code>-orbit</code>. Each release adds a row to <code>.orbit/COMPAT.md</code>.</p></div>
<div class="sub2"><h3>AI agent files</h3>
<div class="two">
 <div><h3>Grafana's, never edited</h3><ul><li>Root <code>CLAUDE.md</code> and <code>AGENTS.md</code>, and the 14 <code>AGENTS.md</code> files in sub-folders</li><li>Its skills in <code>.claude/skills/</code></li><li><code>AI_POLICY.md</code> and <code>.gitignore</code></li></ul></div>
 <div><h3>Ours, in our folders only</h3><ul><li><code>AGENTS.md</code> in <code>public/app/orbit/</code>, <code>pkg/orbit/</code> and <code>.orbit/</code>, each with a <code>CLAUDE.md</code> that holds <code>@AGENTS.md</code></li><li>Skills <code>.claude/skills/orbit-*</code>, added once with <code>git add -f</code></li><li>Docs in <code>.orbit/docs/</code>, versioned with the code</li></ul></div>
</div></div>
<div class="sub2"><h3>CI guards on every pull request</h3>
<div class="tw"><table class="tbl"><thead><tr><th>Guard</th><th>Rule</th><th>Stops</th></tr></thead><tbody>
{''.join(f"<tr><td>{esc(a)}</td><td>{esc(b)}</td><td>{esc(c)}</td></tr>" for a, b, c in GUARDS)}</tbody></table></div>
<p class="cap">All {ev("P")}: scripts in <code>.orbit/</code>, not written yet.</p></div>
<div class="sub2"><h3>UI rules every view follows</h3>
<div class="rules">
 <article><h3>Grafana UI Storybook first</h3><p>Before drawing something new, find the <code>@grafana/ui</code> component that does the job and use it as it is. A variant is composed from Grafana components and theme tokens; a new component names its nearest Grafana base.</p><p class="ref">Section 4.1 · developers.grafana.com/ui</p></article>
 <article><h3>Eleven button zones</h3><p>Object actions sit in the page header, right aligned, primary last. The right info panel holds information and links only. Lifecycle colours only on lifecycle steps; a button the user may not use is hidden, not disabled.</p><p class="ref">Section 10.11 · board P07 draws every zone</p></article>
 <article><h3>Two icon packs</h3><p>Grafana's Unicons (317 names) plus Tabler. Stored as one prefixed string, <code>grafana:apps</code> or <code>tabler:tool</code>. Grafana's own navigation can show only Unicons, so a Tabler choice falls back there.</p><p class="ref">Section 10.12 · OD32</p></article>
 <article><h3>Seven page templates</h3><p>P01 contract and zones, P02 states, P03 standard, P04 dashboard canvas, P05 settings and admin, P06 list, P07 detail with info panel. Pages wrap Grafana's own <code>Page</code>.</p><p class="ref">Boards P01 to P07 · layer L2</p></article>
</div></div>
</section>

<section id="status"><h2>Where things stand</h2>
<p>The design canvas has 36 boards. The architecture is read against Grafana v13.3.0, but nothing has been built yet. Ten decisions were settled on 2026-11-17; the rest wait for the version that needs them.</p>
<div class="two">
 <div><h3>Decided, 2026-11-17</h3>
  <table class="tbl dec"><thead><tr><th>ID</th><th>Decision</th></tr></thead><tbody>
  {''.join(f"<tr><td><code>{i}</code></td><td>{d}</td></tr>" for i, d in DECIDED)}</tbody></table></div>
 <div><h3>Open, by the version that needs them</h3>
  <table class="tbl dec"><thead><tr><th>ID</th><th>Decision</th><th>By</th></tr></thead><tbody>
  {''.join(f"<tr><td><code>{i}</code></td><td>{esc(d)}</td><td>{v}</td></tr>" for i, d, v in OPEN)}</tbody></table>
  <p class="cap">The full list, with the recommended option for each, is section 20 of the document.</p></div>
</div>
<div class="sub2"><h3>Still unverified</h3><ul class="plain">{''.join(f"<li>{esc(u)}</li>" for u in UNVERIFIED)}</ul></div>
</section>
<p class="foot">Source: ARCHITECTURE.md up to revision note 83 (2026-11-19): sections 4 to 6, 10.9 to 10.12, 11 to 13, 15, 19 and 20, and the design canvas. Grafana v13.3.0; file and line references were read from that tag. Nothing here has been built or run.</p>
</div>
"""

JS = r"""
(function(){
  /* steppers */
  document.querySelectorAll('[data-stepper]').forEach(function(root){
    var fig=root.querySelector('.fig'), items=[].slice.call(root.querySelectorAll('.steps li'));
    var froms=[].slice.call(fig.querySelectorAll('[data-from]')), ats=[].slice.call(fig.querySelectorAll('[data-at]'));
    var prev=root.querySelector('[data-act=prev]'), next=root.querySelector('[data-act=next]'), all=root.querySelector('[data-act=all]'), status=root.querySelector('.status');
    var max=items.length, cur=0;
    function render(){
      fig.classList.toggle('stepping',cur>0);
      froms.forEach(function(e){e.classList.toggle('on',cur>=+e.getAttribute('data-from'));});
      ats.forEach(function(e){var a=e.getAttribute('data-at').split(' ');e.classList.toggle('now',cur>0&&a.indexOf(String(cur))>-1);});
      items.forEach(function(li,i){var on=cur===i+1;li.classList.toggle('active',on);li.querySelector('button').setAttribute('aria-current',on?'step':'false');});
      status.textContent=cur?('Step '+cur+' of '+max):'All steps shown';
      prev.disabled=cur===0; next.disabled=cur===max;
    }
    prev.addEventListener('click',function(){cur=Math.max(0,cur-1);render();});
    next.addEventListener('click',function(){cur=Math.min(max,cur+1);render();});
    all.addEventListener('click',function(){cur=0;render();});
    items.forEach(function(li,i){li.querySelector('button').addEventListener('click',function(){cur=cur===i+1?0:i+1;render();});});
    render();
  });

  /* classifier */
  var Q=__Q__, R=__R__;
  var TOUCH=__TOUCH__;
  var panel=document.getElementById('clf'), tree=document.getElementById('tree');
  var path=[]; // [{q, a}]
  function clearTree(){
    tree.querySelectorAll('.now').forEach(function(e){e.classList.remove('now');});
  }
  function paint(cur){
    clearTree();
    path.forEach(function(p){
      var n=tree.querySelector('#n-'+p.q); if(n) n.classList.add('now');
      var to=p.a==='yes'?Q[p.q].yes:Q[p.q].no;
      var e=tree.querySelector('#e-'+p.q+'-'+to); if(e) e.classList.add('now');
    });
    if(cur){var c=tree.querySelector('#n-'+cur); if(c) c.classList.add('now');}
  }
  function touchHtml(lit){
    return '<ol class="tmap" aria-label="Layers this change touches">'+TOUCH.map(function(t){
      var on=lit.indexOf(t[0])>-1;
      return '<li data-l="'+t[0]+'" class="'+(on?'lit':'')+'"><b>'+t[0]+'</b><span>'+t[1]+'</span><em>'+(on?'changes':'none')+'</em></li>';}).join('')+'</ol>';
  }
  function trail(){
    if(!path.length) return '';
    return '<ul class="trail" aria-label="Your answers">'+path.map(function(p){return '<li>'+Q[p.q].t.replace(/\?$/,'')+': <b>'+p.a+'</b></li>';}).join('')+'</ul>';
  }
  function view(node){
    var h='';
    if(Q[node]){
      var q=Q[node];
      h=trail()+'<p class="q">'+q.t+'</p><p class="hint">'+q.h+'</p><div class="answers">'+
        '<button class="btn primary" type="button" data-a="yes">Yes</button><button class="btn" type="button" data-a="no">No</button>'+
        (path.length?'<button class="btn" type="button" data-a="back">Back</button>':'')+'</div>';
      paint(node);
    } else {
      var r=R[node];
      h=trail()+'<div class="outcome"><h3>'+r.title+'</h3><dl>'+r.rows.map(function(x){return '<dt>'+x[0]+'</dt><dd>'+x[1]+'</dd>';}).join('')+'</dl>'+
        touchHtml(r.lit)+'<div class="answers" style="margin-top:14px"><button class="btn" type="button" data-a="back">Back</button><button class="btn primary" type="button" data-a="reset">Start over</button></div></div>';
      paint(node);
    }
    panel.innerHTML=h;
    var f=panel.querySelector('button'); 
    panel.querySelectorAll('button').forEach(function(b){
      b.addEventListener('click',function(){
        var a=b.getAttribute('data-a');
        if(a==='reset'){path=[];view('q1');return;}
        if(a==='back'){var last=path.pop();view(last?last.q:'q1');return;}
        path.push({q:node,a:a});
        view(a==='yes'?Q[node].yes:Q[node].no);
      });
    });
  }
  view('q1');
})();
"""
JS = (JS.replace("__Q__", json.dumps(QUESTIONS)).replace("__R__", json.dumps({k: {"title": v["title"], "lit": v["lit"], "rows": v["rows"]} for k, v in OUTCOMES.items()}))
        .replace("__TOUCH__", json.dumps(TOUCH)))

HEAD = """<title>Grafana Architecture Map</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap">
"""
if __name__ == "__main__":
    page = HEAD + "<style>" + CSS + "</style>\n" + BODY + "<script>" + JS + "</script>\n"
    out = os.path.join(HERE, "map.html")
    open(out, "w", encoding="utf-8").write(page)
    print(len(page), "bytes ->", out)
