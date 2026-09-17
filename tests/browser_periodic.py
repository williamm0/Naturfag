"""Periodesystemet: all 210 answers, 12 oral questions and responsive checks.
Uses the same documented set_content/storage adapter as browser_smoke.py.
Screenshots and results are written outside the project, to KJEMILAB_QA_DIR
or the operating system temporary directory. Run after npm run build.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
import sys, json, os, tempfile
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tests'))
from browser_smoke import fresh, launch_browser, route
OUT=Path(os.environ.get('KJEMILAB_QA_DIR',str(Path(tempfile.gettempdir())/'kjemilab-periodic-qa'))); OUT.mkdir(exist_ok=True,parents=True)
checks=[]
def check(name,condition=True):
 assert condition,name
 checks.append(name)
with sync_playwright() as p:
 b=launch_browser(p)
 page,errors=fresh(b)
 page.on('dialog',lambda d:d.accept())
 page.locator('.rail').get_by_role('link',name='Periodesystemet',exact=True).click()
 expect(page.locator('h1')).to_have_text('Periodesystemet')
 check('New desktop navigation opens periodic table',page.locator('h1').inner_text()=='Periodesystemet')
 check('Twenty elements in the table',page.locator('.pt-cell').count()==20)
 check('Scope is visibly labelled as an excerpt','utsnitt' in page.locator('.pt-table-panel').inner_text().lower())
 page.get_by_role('button',name='Klor (Cl), atomnummer 17',exact=True).click()
 check('Clicking chlorine updates details',page.locator('.pt-detail-heading h2').inner_text()=='Klor')
 page.get_by_label('Vis gruppe 17',exact=True).click()
 check('Group highlighting includes both first-20 halogens',page.locator('.pt-cell.highlighted').count()==2)
 page.get_by_label('Vis periode 3',exact=True).click()
 check('Period highlighting includes eight elements',page.locator('.pt-cell.highlighted').count()==8)
 page.get_by_label('Finn et grunnstoff',exact=True).fill('helium')
 check('Search selects helium',page.locator('.pt-detail-heading h2').inner_text()=='Helium')
 check('Helium exception is shown','to ytterelektroner' in page.locator('.pt-element-detail').inner_text())
 page.get_by_role('button',name='Nullstill visning',exact=True).click()
 page.get_by_role('button',name='Natrium (Na), atomnummer 11',exact=True).click()
 page.screenshot(path=str(OUT/'periodic-explore-desktop.png'))
 page.locator('.pt-tabs').get_by_role('link',name='Pugg',exact=True).click()
 expect(page.locator('.pt-practice-setup')).to_be_visible()
 page.screenshot(path=str(OUT/'periodic-practice-desktop.png'))
 page.get_by_label('Grunnstoffer i runden',exact=True).select_option('10')
 check('Ten-element practice subset is persisted',page.evaluate('KL.progress.periodic.selection.length')==10)
 page.get_by_label('Grunnstoffer i runden',exact=True).select_option('20')
 page.get_by_role('button',name='Start blandet runde',exact=False).click()
 expect(page.locator('.pt-exercise')).to_be_visible()
 check('Mixed practice begins',page.locator('.pt-exercise').count()==1)
 page.get_by_role('button',name='Hint',exact=True).click()
 check('Hint opens without revealing the answer',page.locator('.pt-exercise .explanation').count()==0)
 check('Hint flags the encounter as assisted',page.evaluate('KL.progress.periodic.active.current.assisted'))
 page.get_by_role('button',name='Vet ikke, vis forklaringen',exact=True).click()
 check('Explicit reveal opens the explanation',page.locator('.pt-exercise .explanation').count()==1)
 check('Reveal schedules spaced repairs',page.evaluate('KL.progress.periodic.active.queue.length>KL.progress.periodic.active.baseCount'))
 page.get_by_role('button',name='Neste oppgave',exact=False).click()
 check('Next card is not the immediately previous card',page.evaluate('KL.progress.periodic.active.current.itemId!==KL.progress.periodic.active.results[0].itemId'))
 # Check all 210 distinct authored/generated answer keys through visible controls.
 items=page.evaluate('KL.periodicQuestions.map(q=>({id:q.id,format:q.format,expected:q.expected}))')
 for n,q in enumerate(items):
  if n%20==0: print('Cards',n,'of',len(items),flush=True)
  page.evaluate('''(id)=>{const s=KL.initialPeriodicState();KL.progress.periodic=KL.startPeriodicRound(s,{track:'mixed',count:10,ids:[id]},Date.now(),112);location.hash='periodic/drill';KL.renderApp(true);}''',q['id'])
  if q['format']=='position':
   check('Position '+q['id']+' has no answer symbol in the cells',page.locator('.pt-cell .pt-symbol').count()==0)
   page.locator(f'.pt-cell[data-position="{q["expected"]}"]').click()
  elif q['format']=='choice':
   option=page.evaluate('(id)=>KL.periodicById[id].options.find(o=>o.id===KL.periodicById[id].expected).text',q['id'])
   page.locator('.pt-exercise .choice').filter(has_text=option).first.click()
  else: page.locator('#pt-answer').fill(q['expected'])
  page.get_by_role('button',name='Sjekk svaret',exact=True).click()
  check('UI answer accepted '+q['id'],page.evaluate("KL.progress.periodic.active.results[0]?.outcome==='independent'"))
  if q['id']=='pt-place-Cl': page.screenshot(path=str(OUT/'periodic-placement-solved.png'))
  # State must remain exportable after every card.
  check('Saved state valid '+q['id'],page.evaluate('KL.validateState(KL.progress).ok'))
 # Blank positions and wrong retries.
 page.evaluate("KL.progress.periodic=KL.startPeriodicRound(KL.initialPeriodicState(),{track:'positions',ids:['pt-place-Cl']},Date.now(),7);KL.renderApp(true)")
 page.screenshot(path=str(OUT/'periodic-placement-blank.png'))
 page.locator('.pt-cell[data-position="2:1"]').click()
 page.get_by_role('button',name='Sjekk svaret',exact=True).click()
 check('Wrong placement leaves answer hidden',page.locator('.answer-cell').count()==0)
 page.locator('.pt-cell[data-position="3:17"]').click()
 page.get_by_role('button',name='Sjekk svaret',exact=True).click()
 check('Correct retry does not count as independent',page.evaluate("KL.progress.periodic.active.results[0].outcome==='assisted'"))
 # One-card round can finish; next correctly labelled.
 page.evaluate("KL.progress.periodic=KL.startPeriodicRound(KL.initialPeriodicState(),{track:'names',ids:['pt-name-Na']},Date.now(),7);KL.renderApp(true)")
 page.locator('#pt-answer').fill('NATRIUM')
 page.get_by_role('button',name='Sjekk svaret',exact=True).click()
 page.get_by_role('button',name='Se runden',exact=False).click()
 check('Round summary is functional',page.locator('.pt-summary h2').first.inner_text()=='Runden er ferdig.')
 # Oral training: no automatic grading, no answer before explicit choice.
 page.locator('.pt-tabs').get_by_role('link',name='Forklar sammen',exact=True).click()
 expect(page.locator('#pt-oral-notes')).to_be_visible()
 page.get_by_label('Antall deltakere',exact=True).select_option('3')
 page.locator('#pt-oral-notes').fill('Et atom har protoner, nøytroner og elektroner.')
 check('Oral note saves immediately',page.evaluate("KL.progress.periodic.oral.notes['pt-oral-1'].startsWith('Et atom')"))
 check('Oral answer is initially hidden',page.locator('.teacher-model-answer').count()==0)
 page.get_by_role('button',name='Vi har forklart. Vis sjekklisten',exact=True).click()
 check('Rubric shown without model answer',page.locator('.rubric-item').count()==4 and page.locator('.teacher-model-answer').count()==0)
 page.locator('.rubric-item input').first.check()
 page.get_by_role('button',name='Vis et mulig eksempelsvar',exact=True).click()
 page.get_by_role('button',name='Marker som egenvurdert',exact=True).click()
 check('Self assessment saved separately',page.evaluate("KL.progress.periodic.oral.done.includes('pt-oral-1')"))
 page.screenshot(path=str(OUT/'periodic-oral-desktop.png'))
 page.get_by_role('button',name='Neste spørsmål',exact=False).click()
 check('Group participants rotate', 'Deltaker 2' in page.locator('.pt-oral-work .exercise-meta').inner_text())
 check('Next oral answer is hidden again',page.locator('.teacher-model-answer').count()==0)
 for i in range(12):
  page.get_by_role('button',name=f'Spørsmål {i+1}: '+page.evaluate('(i)=>KL.periodicOral[i].title',i),exact=True).click()
  page.get_by_role('button',name='Vi har forklart. Vis sjekklisten',exact=True).click()
  page.get_by_role('button',name='Vis et mulig eksempelsvar',exact=True).click()
  check('Oral checklist and model '+str(i+1),page.locator('.rubric-item').count()>=3 and page.locator('.teacher-model-answer').count()==1)
 check('Extended progress export remains valid',page.evaluate('KL.validateState(KL.progress).ok'))
 saved=page.evaluate('JSON.stringify(KL.progress)')
 # Reboot through real app boot, using the storage adapter (file access is blocked).
 page.evaluate('(raw)=>localStorage.setItem("kjemilab.progress.v1",raw)',saved)
 page.evaluate('KL.boot()')
 check('Boot restores periodic notes and results',page.evaluate("KL.progress.periodic.oral.notes['pt-oral-1'].startsWith('Et atom')"))
 check('No JavaScript errors in main flow',not errors)
 page.close()
 # Separate viewports avoid stale scroll positions and draft state.
 for width in [360,390,768,1280,1440]:
  page,errs=fresh(b,width,900 if width>500 else 844)
  for theme in ['dark','light']:
   page.evaluate('(theme)=>{KL.progress.settings.theme=theme}',theme)
   for path in ['periodic','periodic/pugg','periodic/oral']:
    route(page,path)
    check(f'No page-wide horizontal overflow {width} {theme} {path}',page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'))
    check(f'No rendering fallback {width} {theme} {path}',page.locator('.error-panel').count()==0)
    check(f'Correct page identity {width} {theme} {path}',page.locator('h1').inner_text()=='Periodesystemet')
    if width in [390,1440] and theme=='dark': page.screenshot(path=str(OUT/f'{path.replace("/","-")}-{width}.png'),full_page=width==390)
    if width==1440 and theme=='light' and path=='periodic':page.screenshot(path=str(OUT/'periodic-explore-light.png'))
  check(f'No console errors at width {width}',not errs)
  page.close()
 b.close()
(OUT/'periodic-checks.json').write_text(json.dumps({'passed':len(checks),'checks':checks,'method':'Playwright Chromium with set_content and an explicit Storage-compatible adapter. file:// blocked by administrator.'},ensure_ascii=False,indent=2))
print('PASS',len(checks),'browser assertions. Screenshots in',OUT)
