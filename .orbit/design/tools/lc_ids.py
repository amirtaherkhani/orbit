import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
# ID and tag guide on R03 (owner, 2026-11-18): what R, S, P, SM, RK, OD, T, L and the tag chips mean.
# Run by build_all.sh after lc_r12, before lc_fit. Source: ARCHITECTURE.md "ID conventions" (revision note 80).
import sys
P = ROOT+'project/'
F = 'RefScope.dc.html'
s = open(P + F).read()
if 'id="ids"' in s:
    sys.exit('lc_ids: already applied. Run tools/build_all.sh, which rebuilds the boards first.')

B = lambda t: f'<b style="font-weight:500;color:#eceef1">{t}</b>'
tag = lambda c, t: f'<span class="rtg {c}">{t}</span>'

IDS = [
    ('R', 'Reference board: the spec a screen follows', 'R01–R12', 'R10 · Apps, app lifecycle and bookmarks', 'Design canvas'),
    ('S', 'Screen board: one state of one view', 'S01–S22 (no S05, S09, S17)', 'S16 · AppLifecycleView: setup, validate, enable, migrate', 'Design canvas'),
    ('P', 'Page template board', 'P01–P07', 'P07 · Page template: Detail with info panel', 'Design canvas, last row'),
    ('C', 'Component board: one shared component (R12), mounted by screens with dc-import', 'C01–C04', 'C01 · Dock: component', 'Design canvas, Components'),
    ('SM', 'Seam: a point where the fork touches Grafana', 'SM01–SM14', 'SM01 · the import in RoutesWrapper.tsx', 'ARCHITECTURE.md 6, .orbit/seams.json'),
    ('RK', 'Risk: something not proven yet, with the check that proves it', 'RK01–RK24', 'RK10 · StrictMode on main', 'ARCHITECTURE.md 15'),
    ('OD', 'Decision: open, decided or withdrawn', 'OD1–OD35', 'OD23 · lifecycle state in pkg/orbit', 'ARCHITECTURE.md 20'),
    ('T', 'Trigger: when work must move to the backend', 'T1–T6', 'T6 · lifecycle state the server must keep', 'ARCHITECTURE.md 12'),
    ('L', 'Layer of the frontend architecture', 'L1–L7', 'L5 · ACL, orbit/upstream', 'ARCHITECTURE.md 5.2'),
    ('A–D', 'Case after an app update', 'A, B, C, D, downgrade', 'C · update that needs an admin', 'S21, R10'),
]
TAGS = [
    (tag('tv', 'Verified in v13.3.0'), 'Read in the Grafana v13.3.0 source. The claim names a file and line.'),
    (tag('ti', 'Inferred'), 'Deduced from the source, not run. On R04 also <i>Near, off by n</i> and <i>Differs</i>: how close a token is to Grafana’s value.'),
    (tag('tu', 'Not verified'), 'Unknown. A risk (RK) names the check that settles it.'),
    (tag('tc', 'Custom'), 'Ours: new in the fork. <i>Proposal</i> and <i>In the design</i> use the same colour.'),
    (tag('ts', 'Grafana'), 'Grafana as shipped. <i>Grafana sample</i> marks a board that shows a stock page only to check the shell around it.'),
    (tag('tr', 'Reference page'), 'A reference board (R), not a screen.'),
    (tag('td', 'Decision needed'), 'Open; the decision has an OD number. <i>To define</i>: a detail still to be written.'),
    (tag('tv', 'Decided'), 'The owner’s decision, recorded as an OD with its date.'),
    (tag('tv', 'Passes 4.5:1'), 'Colour contrast checked against WCAG AA for normal text.'),
]
rows_ids = ''.join(f'<tr><td>{B(a)}</td><td>{b}</td><td>{c}</td><td>{d}</td><td>{e}</td></tr>' for a, b, c, d, e in IDS)
rows_tags = ''.join(f'<tr><td>{a}</td><td>{b}</td></tr>' for a, b in TAGS)
SEC = (
    '<h2 id="ids">IDs and tags</h2>'
    '<p class="lead" style="margin:0 0 10px">Every ID is unique across the boards and the docs. The letters say what kind of thing it is; boards, seams and risks use two digits. '
    f'So {B("S11")} is always a board (DockPagesView) and {B("SM11")} is always a seam (userstorage); {B("R10")} is always a board and {B("RK10")} is always a risk. '
    'Board titles read <code>ID · Component: state</code>. Until 2026-11-17 seams were S1–S14 and risks R1–R24.</p>'
    '<table class="mt fx"><colgroup><col style="width:7%"><col style="width:29%"><col style="width:18%"><col style="width:28%"><col style="width:18%"></colgroup>'
    '<thead><tr><th>Prefix</th><th>Means</th><th>Range</th><th>Example</th><th>Defined in</th></tr></thead>'
    f'<tbody>{rows_ids}</tbody></table>'
    '<h3 style="margin:22px 0 6px">Tags on the boards</h3>'
    '<p style="margin:0 0 10px">Small coloured chips next to a claim say how sure it is or who owns it. Lifecycle status chips (13 statuses in 7 colour groups) are explained on R10.</p>'
    '<table class="mt fx"><colgroup><col style="width:22%"><col style="width:78%"></colgroup>'
    '<thead><tr><th>Tag</th><th>Means</th></tr></thead>'
    f'<tbody>{rows_tags}</tbody></table>'
)
a = '<h2>Naming</h2>'
assert s.count(a) == 1
s = s.replace(a, SEC + a)
old = 'Every board has an ID: <b>S</b> = design screen, <b>R</b> = reference spec, <b>P</b> = page template.'
assert s.count(old) == 1
s = s.replace(old, 'Every board has an ID: <b>S</b> = design screen, <b>R</b> = reference spec, <b>P</b> = page template (all IDs: <i>IDs and tags</i> above).')
open(P + F, 'w').write(s)
print('ids ok')
