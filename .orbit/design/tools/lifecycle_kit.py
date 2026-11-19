"""Shared definitions for the app lifecycle (owner's lifecycle doc, 2026-11-16).
Statuses, icons, colour groups and the card buttons per status. Used by the S12, S15, S16, S18 and R10 edits."""
SV = '<svg class="i" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>'
ICON = {
 'notinit': '<circle cx="12" cy="12" r="9" stroke-dasharray="3 3.6"/>',
 'progress': '<path d="M21 12a9 9 0 1 1-6.2-8.56"/>',
 'review': '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 'setup': '<path d="M4 6h8M16 6h4M4 12h2M10 12h10M4 18h10M18 18h2"/><circle cx="14" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
 'setupwip': '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
 'migrate': '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
 'ready': '<path d="M12 3v9"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>',
 'enabled': '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
 'disabled': '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
 'failed': '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5"/><path d="M12 17.3v.2"/>',
}
# key, label, icon, colour group, meaning, card buttons
STATUS = [
 ('notinit', 'Not initialized', 'notinit', 'n', 'Installed and discovered, but initialization has not run.', 'Initialize'),
 ('initializing', 'Initializing', 'progress', 'p', 'Checks and available self-tests are running.', 'View progress; conflicting actions disabled'),
 ('review', 'Review required', 'review', 'a', 'Required initialization checks passed and results await approval. Also after an update that brings new permissions, data sources or pages; the app is then in maintenance mode (Org Admins only).', 'Review'),
 ('setup', 'Setup required', 'setup', 'v', 'Review accepted; configuration is needed. After an update: only the new or changed items; the rest of the setup is kept.', 'Setup'),
 ('setupwip', 'Setup in progress', 'setupwip', 'v', 'Setup has started but is incomplete.', 'Continue setup'),
 ('validating', 'Validation in progress', 'progress', 'p', 'Setup checks are running.', 'View progress; conflicting actions disabled'),
 ('migrate', 'Migration required', 'migrate', 'a', 'Enabled, in maintenance mode (Org Admins only). A migration is pending; it starts by itself unless auto_migrate is off.', 'Run migration (when auto_migrate is off)'),
 ('migrating', 'Migration in progress', 'progress', 'p', 'Migration is running; the app is in maintenance mode (Org Admins only).', 'View progress; conflicting actions disabled'),
 ('ready', 'Ready to enable', 'ready', 'r', 'Required checks and setup passed.', 'Enable, or Enable and migrate when a migration is pending'),
 ('enabled', 'Enabled', 'enabled', 'k', 'The app is available to authorized users. After a simple update the app stays Enabled and shows an “Updated” note.', 'Open, Manage'),
 ('disabled', 'Disabled', 'disabled', 'n', 'The app is installed but unavailable for normal use.', 'Enable, Manage; revalidate first if required'),
 ('failed', 'Action required / Failed', 'failed', 'f', 'A check, setup, migration, or another operation failed. A failed migration disables the app again. Also: a version older than the app’s database schema (downgrade).', 'View details, plus the matching Retry (for a migration: enable in maintenance mode and run it again) or Continue setup'),
 ('busy', 'Updating / Uninstalling', 'progress', 'p', 'A management operation is running.', 'View progress; conflicting actions disabled'),
]
BY = {s[0]: s for s in STATUS}
CSS = ('/*lifecycle*/.lst{display:grid;place-items:center;width:28px;height:28px;border-radius:6px;flex:none;line-height:0}'
 '.lst .i{width:16px;height:16px}'
 '.lst.g-n,.lsc.g-n{background:#262a31;color:#c9cdd3}.lst.g-p,.lsc.g-p{background:#17233b;color:#6e9fff}'
 '.lst.g-a,.lsc.g-a{background:#2e2417;color:#fbad37}.lst.g-v,.lsc.g-v{background:#2a1f33;color:#b877d9}.lst.g-r,.lsc.g-r{background:#14313a;color:#58cfec}'
 '.lst.g-k,.lsc.g-k{background:#1c2b20;color:#73bf69}.lst.g-f,.lsc.g-f{background:#3a1c27;color:#ff5286}'
 '.lsl{font-weight:500}.lsl.g-n{color:#c9cdd3}.lsl.g-p{color:#6e9fff}.lsl.g-a{color:#fbad37}.lsl.g-v{color:#b877d9}.lsl.g-r{color:#58cfec}.lsl.g-k{color:#73bf69}.lsl.g-f{color:#ff5286}'
 '.lsc{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 8px;border-radius:4px;font:500 12px/18px Inter,Helvetica,Arial,sans-serif;white-space:nowrap}.lsc .i{width:14px;height:14px}'
 '.p.pri{background:#3d71d9;border-color:#3d71d9;color:#fff}.p.pri:hover{background:#4a7fe6}.p[disabled]{opacity:.45;cursor:not-allowed}')
def icon(key): return SV % ICON[BY[key][2]]
def tile(key, extra=''):
    s = BY[key]
    return '<span class="lst g-%s" role="img" aria-label="Status: %s" title="%s. %s"%s>%s</span>' % (s[3], s[1], s[1], s[4], extra, icon(key))
def chip(key):
    s = BY[key]
    return '<span class="lsc g-%s">%s%s</span>' % (s[3], icon(key), s[1])
def label(key):
    s = BY[key]
    return '<span class="lsl g-%s">%s</span>' % (s[3], s[1])

# ---- lifecycle action buttons (owner, 2026-11-16): same outline shape as Open and Manage, one colour per action type
# key: (colour, labels that use it)
ACT = {
 'init':    ('#6e9fff', 'Initialize'),
 'review':  ('#fbad37', 'Review; Accept and continue to setup'),
 'setup':   ('#b877d9', 'Setup; Continue setup; Save and validate; Open setup'),
 'migrate': ('#58cfec', 'Run migration'),
 'enable':  ('#73bf69', 'Enable'),
 'fail':    ('#ff5286', 'View details; Retry'),
}
def _rgb(h): return ','.join(str(int(h[i:i+2],16)) for i in (1,3,5))
ACSS = ('/*lcbtn*/.p.lca{background:rgba(var(--lc),.10);border-color:rgba(var(--lc),.45);color:rgb(var(--lc))}'
 '.p.lca:hover,.p.lca:focus-visible{background:rgba(var(--lc),.20);border-color:rgb(var(--lc))}'
 '.p.lca[disabled]{background:transparent;border-color:rgba(var(--lc),.25);color:rgba(var(--lc),.7);opacity:1;cursor:not-allowed}'
 + ''.join('.p.lca.a-%s{--lc:%s}' % (k, _rgb(v[0])) for k, v in ACT.items()))
SM = 'flex:none;height:30px;min-height:30px;padding:0 12px;gap:6px;white-space:nowrap'
def abtn(kind, label, href=None, small=True, disabled=False, style=''):
    st = (SM if small else '') + ((';' if small and style else '') + style)
    if href:
        return '<a class="p lca a-%s" href="%s" style="%s;text-decoration:none">%s</a>' % (kind, href, st, label)
    return '<button type="button" class="p lca a-%s"%s%s>%s</button>' % (kind, ' style="%s"' % st if st else '', ' disabled' if disabled else '', label)
CSS = CSS + ACSS

# ---- badges and labels (owner, 2026-11-16): one box model, the same as the "New" label in the app switchers
# (.nw: 500 12/18, padding 2px 6px = 22px high). Text sits on an 18px line box centred in a 22px box.
BCSS = ('/*badges*/html body :is(.lsc,.nw2,.upc,.chp,.pill){display:inline-flex;align-items:center;justify-content:center;align-self:center;'
 'box-sizing:border-box;height:22px;min-height:22px;padding:2px 8px;border-radius:4px;font:500 12px/18px Inter,Helvetica,Arial,sans-serif;'
 'white-space:nowrap;vertical-align:middle;flex:none}'
 'html body .nw2{padding:2px 6px;margin-left:0}html body :is(.lsc,.upc,.pill) svg{flex:none;display:block}')
CSS = CSS + BCSS


# ---- "Updated" note (owner, 2026-11-17): shown after a version change. Information, not a status.
UPD_SVG='<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5"></path><path d="m5 12 7-7 7 7"></path></svg>'
def updnote(text): return f'<span class="lup">{UPD_SVG}{text}</span>'
UCSS=('html body .lup{display:inline-flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;height:22px;padding:2px 8px;border-radius:4px;'
      'background:#1b2433;color:#9fbef7;font:500 12px/18px Inter,Helvetica,Arial,sans-serif;white-space:nowrap;vertical-align:middle;flex:none;align-self:center}'
      'html body .lup svg{flex:none;display:block}')
CSS = CSS + UCSS
