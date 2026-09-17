"""Regression cases for Periodesystemet. Same render/storage limits as browser_smoke.py."""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tests'))
from browser_smoke import fresh,launch_browser,route
with sync_playwright() as p:
 b=launch_browser(p);page,errors=fresh(b);page.on('dialog',lambda d:d.accept())
 route(page,'periodic/oral')
 page.get_by_role('button',name='Vi har forklart. Vis sjekklisten',exact=True).click()
 page.locator('.rubric-item input').last.check()
 print('Rubric persisted array:',page.evaluate('JSON.stringify(KL.progress.periodic.oral.checked)'),flush=True)
 assert page.evaluate('KL.validateState(JSON.parse(JSON.stringify(KL.progress))).ok'),'Checking a later rubric item must create valid exportable progress'
 route(page,'periodic/pugg')
 page.get_by_label('Grunnstoffer i runden',exact=True).select_option('custom')
 page.get_by_label('Ta med hydrogen (H)',exact=True).uncheck()
 page.get_by_role('button',name='Skjul grunnstoffer',exact=True).click()
 assert page.locator('.pt-selection-grid').count()==0,'Hide must hide even with a custom element subset'
 # Source dialogs call requestHelp, which replaces periodic state while an unfinished round is present.
 page.evaluate("KL.progress.periodic=KL.startPeriodicRound(KL.progress.periodic,{track:'names',count:10},Date.now(),12)")
 route(page,'periodic/oral')
 page.locator('.pt-oral-work').get_by_role('button',name='Kilder',exact=True).click()
 page.get_by_role('button',name='Lukk',exact=True).click()
 page.locator('#pt-oral-notes').fill('Etter et kildeoppslag lagres denne teksten.')
 assert page.evaluate("KL.progress.periodic.oral.notes['pt-oral-1']==='Etter et kildeoppslag lagres denne teksten.'"),'Editing notes after a source dialog must not update a stale state object'
 # Native file input, explicit replacement and extended-state validation.
 route(page,'settings')
 saved=page.evaluate('JSON.stringify(KL.progress)')
 import json
 old=json.loads(saved);old.pop('periodic',None)
 page.locator('#progress-import').set_input_files({'name':'old-version.json','mimeType':'application/json','buffer':json.dumps(old).encode()})
 page.get_by_role('button',name='Importer og erstatt',exact=True).click()
 assert not page.evaluate('!!KL.progress.periodic'),'Old progress imports without a periodic field'
 page.locator('#progress-import').set_input_files({'name':'new-version.json','mimeType':'application/json','buffer':saved.encode()})
 assert not page.evaluate('!!KL.progress.periodic'),'Selecting a backup must not replace progress before confirmation'
 page.get_by_role('button',name='Importer og erstatt',exact=True).click()
 assert page.evaluate("KL.progress.periodic.oral.notes['pt-oral-1']==='Etter et kildeoppslag lagres denne teksten.'"),'Periodic notes survive confirmed import'
 assert page.evaluate('KL.validateState(KL.progress).ok')
 # Preserve horizontal scroll, including repeated renders during mobile selection.
 page.set_viewport_size({'width':390,'height':844})
 route(page,'periodic')
 page.locator('.pt-table-scroll').evaluate('(el)=>el.scrollLeft=el.scrollWidth')
 page.get_by_role('button',name='Klor (Cl), atomnummer 17',exact=True).click()
 assert page.locator('.pt-table-scroll').evaluate('(el)=>el.scrollLeft>0'),'Table must not jump left after choosing chlorine'
 assert page.locator('.pt-scroll-hint').is_visible()
 page.locator('.pt-table-scroll').focus()
 before=page.locator('.pt-table-scroll').evaluate('(el)=>el.scrollLeft')
 page.keyboard.press('ArrowLeft');page.wait_for_timeout(200)
 assert page.locator('.pt-table-scroll').evaluate('(el)=>el.scrollLeft<'+str(before)), 'Keyboard scroll remains usable'
 # Data are embedded and the new routes run with the network disabled.
 requests=[];page.on('request',lambda request:requests.append(request.url));page.context.set_offline(True)
 for path in ['periodic','periodic/pugg','periodic/oral']:route(page,path)
 assert not requests,requests
 assert not errors,errors
 b.close()
print('PASS: sparse rubric, custom collapse, source-dialog notes, legacy/new confirmed imports, mobile scroll, keyboard scroll and offline routes')
