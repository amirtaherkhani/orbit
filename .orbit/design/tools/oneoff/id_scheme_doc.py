import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
"""One-off: write the ID scheme table into ARCHITECTURE.md (decided 2026-11-17)."""
p = ROOT+'ARCHITECTURE.md'
s = open(p).read()


def one(a, b):
    global s
    assert s.count(a) == 1, (a[:80], s.count(a))
    s = s.replace(a, b)


one("- `SM01`-`SM12` seams (section 6), `T1`-`T6` escalation triggers (section 12), `RK01`-`RK23` risks (section 15), `OD1`-`OD35` open decisions (section 20; some are withdrawn).\n- Design-canvas boards use two digits: `R01`-`R11`, `S01`-`S21` (without `S05`, `S09` and `S17`), `P01`-`P07` (section 21). In the text, `R01` is the board \"Change list\", while `R4` is risk 4, and a board `S11` is not seam S11.",
    "Every ID is unique across the project (decided 2026-11-17). The design boards set the standard: a letter for the kind and two digits. Other kinds use their own prefix, so no ID can mean two things.\n\n"
    "| Kind | IDs | Where |\n| --- | --- | --- |\n"
    "| Design boards | `R01`-`R11` reference, `S01`-`S21` screens (without `S05`, `S09` and `S17`), `P01`-`P07` page templates | design canvas, section 21 |\n"
    "| Seams | `SM01`-`SM14` | section 6, `.orbit/seams.json` |\n"
    "| Risks | `RK01`-`RK24` | section 15 |\n"
    "| Open decisions | `OD1`-`OD35` (some withdrawn) | section 20 |\n"
    "| Escalation triggers | `T1`-`T6` | section 12 |\n"
    "| Layers | `L1`-`L7` | section 5.2 |\n\n"
    "So `S11` is always the board DockPagesView, `SM11` is always the userstorage seam, `R10` is always the lifecycle reference board, and `RK10` is always the StrictMode risk. Until 2026-11-17 seams were `S1`-`S14` and risks `R1`-`R24` (revision note 80).")
one("Board IDs are the canvas's own: board `S11` is not seam S11.",
    "Board IDs are the canvas's own; seams use `SM` and risks `RK` (ID conventions, top of the document).")
open(p, 'w').write(s)
print('ok')
