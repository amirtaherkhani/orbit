import os as _os; ROOT=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))+'/'  # .orbit/design/
import sys
sys.path.insert(0,ROOT+'tools')
from lc_refs import Doc
# S13 manifest
d=Doc('AppsProtocol.dc.html')
d.rep('<div class="fs"><b><i>1</i>Register</b><span>The app ships a manifest. Today that is its plugin.json.</span></div>','<div class="fs"><b><i>1</i>Install</b><span>grafana-cli installs the app plugin. It ships a manifest; today that is its plugin.json.</span></div>')
d.rep('<div class="fs"><b><i>2</i>Initialize</b><span>Grafana loads the app. Only initialized apps can be listed.</span></div>','<div class="fs"><b><i>2</i>Discover</b><span>After a restart Grafana loads the app. Apps lists it as Not initialized.</span></div>')
d.rep('<div class="fs"><b><i>3</i>List</b><span>The Apps view reads every initialized manifest.</span></div>','<div class="fs"><b><i>3</i>Prepare</b><span>Initialize, review, setup, validation and migration read the manifest.</span></div>')
d.rep('<div class="fs"><b><i>4</i>Choose</b><span>Per app: show in the menu, in the dock selector, or both.</span></div>','<div class="fs"><b><i>4</i>Enable</b><span>Then per app: show in the menu, in the dock selector, or both.</span></div>')
d.rep('What the Apps view, the dock and the menu need to read from each app.','What the Apps view, the app lifecycle, the dock and the menu need to read from each app.')
d.rep('<td>Selected bar, bookmarks group and breadcrumb badge</td></tr>','<td>Default colour of the app: selected bar, bookmarks group and breadcrumb badge. Setup can change icon and colour for the organisation</td></tr>')
i=d.s.index('<tr><td><code>includes[].path</code> nesting</td>'); j=d.s.index('</tr>',i)+5
d.s=d.s[:j]+('<tr><td>backend <code>CheckHealth</code></td><td><span class="tg2 g">Exists</span></td><td>App health right after Enable and in Manage. Only for apps with a backend; Grafana answers the health call only while the app is enabled in its plugin settings</td></tr>'
 '<tr><td><code>ui.selfTests</code></td><td><span class="tg2 n">New</span></td><td>Self-tests the app offers at Initialize and Validate. Contract not designed</td></tr>'
 '<tr><td><code>ui.migrations</code></td><td><span class="tg2 n">New</span></td><td>Whether the app owns database tables, and how it reports and runs pending migrations. Contract not designed</td></tr>')+d.s[j:]
d.rep('<div class="q"><b>What does "initialized" mean?</b><span>Plugin loaded and healthy is the likely rule, but the protocol has to define how it is detected.</span></div>','<div class="q"><b>How does an app offer self-tests and migrations?</b><span>The lifecycle needs both. ui.selfTests and ui.migrations are placeholders; the contract with the app is not designed.</span></div>')
d.rep('min-height:1396px','min-height:1670px'); d.rep('"height":1396','"height":1670')
d.save()
# S19 menu sheet: an app that is not enabled
d=Doc('DockAppPages.dc.html')
d.rep('No pages yet. Finish setup to add its pages.','Not enabled yet. Its pages show here once the app is enabled.')
d.rep('Energy has no pages yet. <a href="AppSetup.dc.html">Finish setup</a> to add them.','Energy is not enabled yet. <a href="AppSetup.dc.html">Continue setup</a> to enable it; its pages show here after that.')
d.save()
d=Doc('RefSheet.dc.html')
d.rep('“Finish setup” when the app needs setup. See S19','“Not enabled yet” with a link to its setup when the app is not enabled (shown to people who may set it up). See S19')
d.rep('min-height:3550px','min-height:3570px'); d.rep('"height":3550','"height":3570')
d.save()
print('misc ok')
