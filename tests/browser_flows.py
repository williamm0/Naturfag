"""End-to-end interaction checks; see browser_smoke.py for render/storage limits."""
from browser_smoke import *
import time

def run():
    results=[]
    with sync_playwright() as p:
        browser=launch_browser(p)
        page,errors=fresh(browser)
        page.on('dialog',lambda d:d.accept())
        page.evaluate('KL.progress.settings.motion="reduced";KL.renderApp()')
        # Wrong responses never expose the keyed explanation automatically.
        for qid in ['q001','q002','q003','q004','q022','q088']:
            q=question(page,qid)
            if q['kind']=='choice':page.locator('[data-focus="option-o1"]').click()
            if q['kind']=='recall':page.locator('#answer-input').fill('proton')
            if q['kind']=='categorize':
                for key in q['answerSpec']['assignments']:page.locator('#category-'+key).select_option('kjerne')
            if q['kind']=='fields':
                for key in q['answerSpec']['values']:page.locator('#field-'+key).fill('0')
            if q['kind']=='order':
                correct_answer(page,q);page.locator('[data-focus="up-i2"]').click()
            if q['kind']=='select_parts':page.locator('[data-focus="part-o1"]').click()
            page.get_by_role('button',name='Sjekk',exact=True).click()
            assert page.locator('.explanation').count()==0 and page.locator('.keyed-answer').count()==0
            assert page.evaluate('!KL.progress.session.current.finalized')
            page.get_by_role('button',name='Hint',exact=True).click()
            assert page.evaluate('KL.progress.session.current.helpUsed')
            page.get_by_role('button',name='Vis forklaring',exact=True).click()
            assert page.locator('.explanation').count()==1
            assert page.evaluate('KL.progress.encounters.at(-1).points')==0
            results.append('wrong + hint + explicit reveal '+qid)
        # A real retry remains assisted and first correctness is immutable.
        q=question(page,'q001');page.locator('[data-focus="option-o1"]').click();page.get_by_role('button',name='Sjekk',exact=True).click()
        correct_answer(page,q);page.get_by_role('button',name='Sjekk',exact=True).click()
        assert page.evaluate('KL.progress.encounters.at(-1).independent') is False
        results.append('wrong then correct cannot become independent')
        # Declared periodic table is stimulus, not a hint.
        question(page,'q016');assert page.locator('.periodic-table').count()==1
        assert not page.evaluate('KL.progress.session.current.helpUsed')
        page.get_by_role('button',name='Kilder',exact=True).click()
        assert page.evaluate('KL.progress.session.current.helpUsed')
        page.get_by_role('button',name='Lukk',exact=True).click()
        results.append('declared reference table versus explicit source assistance')
        # Prepared introductory reading is not scored as an answer attempt.
        reset(page);route(page,'start');page.get_by_role('button',name='Start en økt',exact=True).click()
        page.wait_for_selector('.intro-panel')
        assert page.locator('.intro-panel').count()==1
        page.get_by_role('button',name='Kilder',exact=True).click();page.get_by_role('button',name='Lukk',exact=True).click()
        page.get_by_role('button',name='Prøv selv',exact=True).click()
        assert not page.evaluate('KL.progress.session.current.helpUsed')
        results.append('intro is reading, then a fresh challenge')
        # One finite twelve-slot practice session including assisted encounters.
        for i in range(12):
            if page.locator('.intro-panel').count():page.get_by_role('button',name='Prøv selv',exact=True).click()
            q=page.evaluate('KL.questionById[KL.progress.session.current.itemId]')
            if i in [2,7]:page.get_by_role('button',name='Hint',exact=True).click()
            correct_answer(page,q);page.get_by_role('button',name='Sjekk',exact=True).click()
            page.locator('[data-focus="next-question"]').click()
        assert page.evaluate('KL.progress.session.finished && KL.progress.session.results.length===12')
        assert page.locator('.summary-panel').count()==1
        results.append('complete 12-slot adaptive session including repair work')
        # Pause and restart using serialized draft + assistance + shuffle.
        q=question(page,'q002');page.locator('#answer-input').fill('utkast')
        page.get_by_role('button',name='Hint',exact=True).click()
        state=page.evaluate('JSON.stringify(KL.progress.session.current)')
        page.evaluate('KL.progress=KL.readStorage(localStorage).state;KL.renderApp()')
        assert page.locator('#answer-input').input_value()=='utkast'
        assert page.evaluate('JSON.stringify(KL.progress.session.current)')==state
        results.append('serialized draft restores identity, order, hint and input')
        # A full mini-test holds results until the final explicit submission.
        reset(page);route(page,'ov');page.locator('[data-focus="mode-exam"]').click();page.get_by_role('button',name='Start en økt',exact=True).click()
        for i in range(20):
            page.wait_for_function('KL.progress.session.current!==null')
            assert page.locator('.explanation').count()==0
            if i in [3,8,14]:page.get_by_role('button',name='Vet ikke',exact=True).click()
            else:
                q=page.evaluate('KL.questionById[KL.progress.session.current.itemId]');correct_answer(page,q)
                page.get_by_role('button',name='Lagre svar og neste',exact=True).click()
            assert page.evaluate('KL.progress.session.results.length')==0
        assert page.locator('.exam-review').count()==1
        page.get_by_role('button',name='Lever miniprøven',exact=True).click()
        assert page.evaluate('KL.progress.session.results.filter(e=>e.independent).length')==17
        assert page.evaluate('KL.progress.session.results.length')==20
        page.evaluate('window.scrollTo(0,0);document.activeElement?.blur()');page.screenshot(path=str(QA/'mini-test.png'),full_page=True)
        results.append('20-question mini-test, 17/20 exact score after submission only')
        # Hint access offers and performs a switch to practice, no silent grading.
        page.evaluate('KL.progress.session=KL.newSession(KL.progress,"exam",20);KL.renderApp()')
        page.get_by_role('button',name='Hint',exact=True).click()
        assert page.evaluate('KL.progress.session.mode')=='bank'
        assert page.evaluate('KL.progress.session.current.helpUsed')
        results.append('mini-test help switches to assisted practice')
        reset(page);route(page,'lab/molecule')
        # Undo, redo, keyboard coordinate changes and durable graph draft.
        page.get_by_role('button',name='Legg til C',exact=True).click()
        atom=page.locator('[data-focus="atom-c1"]');atom.focus();atom.press('ArrowRight')
        assert page.evaluate('document.activeElement.getAttribute("data-focus")')=='atom-c1'
        assert page.evaluate('KL.progress.builder.graph.atoms[0].x')==90
        page.get_by_role('button',name='Angre',exact=True).click();assert page.evaluate('KL.progress.builder.graph.atoms[0].x')==75
        page.get_by_role('button',name='Gjør om',exact=True).click();assert page.evaluate('KL.progress.builder.graph.atoms[0].x')==90
        page.get_by_role('button',name='Vis molekylformelen',exact=True).click()
        state=page.evaluate('JSON.stringify(KL.progress.builder)');page.evaluate('KL.progress=KL.readStorage(localStorage).state;KL.renderApp()')
        assert page.evaluate('JSON.stringify(KL.progress.builder)')==state
        results.append('builder undo, redo, keyboard move, stable focus and durable hint')
        # Every target assembled from atom controls and explicit bond controls.
        for m in page.evaluate('KL.targets'):
            print('Building',m['id'],flush=True)
            try:page.get_by_label('Molekyl å bygge',exact=True).select_option(m['id'])
            except Exception:
                print('BUILDER ERROR',errors,page.evaluate('location.hash'),page.locator('body').inner_text(),flush=True)
                page.evaluate('window.scrollTo(0,0);document.activeElement?.blur()');page.screenshot(path=str(QA/'failure.png'),full_page=True);raise
            mapping={}
            for a in m['expandedGraph']['atoms']:
                page.get_by_role('button',name='Legg til '+a['element'],exact=True).click()
                mapping[a['id']]=page.evaluate('KL.progress.builder.graph.atoms.at(-1).id')
            if not page.locator('.accessible-tools').evaluate('(e)=>e.open'):page.get_by_text('Presise kontroller',exact=True).click()
            for bond in m['expandedGraph']['bonds']:
                page.locator('[data-focus="bond-'+str(bond['order'])+'"]').click()
                page.get_by_label('Atom A',exact=True).select_option(mapping[bond['a']])
                page.get_by_label('Atom B',exact=True).select_option(mapping[bond['b']])
                page.get_by_role('button',name='Koble de to atomene',exact=True).click()
                # <details> is reconstructed by rendering. Open it again if needed.
                if not page.locator('.accessible-tools').evaluate('(e)=>e.open'):
                    page.get_by_text('Presise kontroller',exact=True).click()
            page.get_by_role('button',name='Tilpass',exact=True).click()
            page.get_by_role('button',name='Sjekk molekylet',exact=True).click()
            assert page.evaluate('KL.progress.builder.attempt.outcome')=='correct',m['id']
            assert page.evaluate('(id)=>KL.progress.collection[id].independent',m['id']),m['id']
            assert page.evaluate('KL.validateState(KL.progress).ok'),m['id']
            if m['id']=='ethanol':page.evaluate('window.scrollTo(0,0);document.activeElement?.blur()');page.screenshot(path=str(QA/'builder-ethanol.png'),full_page=True)
            results.append('build '+m['id']+' via native atom/bond controls')
        assert page.evaluate('Object.keys(KL.progress.collection).length')==12
        route(page,'collection');page.evaluate('window.scrollTo(0,0);document.activeElement?.blur()');page.screenshot(path=str(QA/'collection.png'),full_page=True)
        # Repeating one target does not farm points within the same lab session.
        points=page.evaluate('KL.progress.points');route(page,'lab/molecule')
        page.get_by_label('Molekyl å bygge',exact=True).select_option('methane')
        page.get_by_role('button',name='Legg til C',exact=True).click()
        page.get_by_role('button',name='Fyll ledige plasser med H',exact=True).click()
        page.get_by_role('button',name='Sjekk molekylet',exact=True).click()
        assert page.evaluate('KL.progress.encounters.at(-1).independent') is False
        assert page.evaluate('KL.progress.points')==points
        results.append('auto-H is assisted; duplicate laboratory points prevented')
        # Six explicit ion-building challenges.
        route(page,'lab/atom')
        for id,t in page.evaluate('Object.entries(KL.ionTargets)'):
            page.get_by_label('Ion-utfordring',exact=True).select_option(id)
            assert 'elektroner.' not in page.locator('.atom-diagram').get_attribute('aria-label').split('Prikkene')[0]
            atomic=page.evaluate('KL.elementBySymbol[KL.progress.atom.symbol].atomicNumber')
            for _ in range(abs(atomic-t['electrons'])):
                page.get_by_role('button',name='Ta bort elektron' if atomic>t['electrons'] else 'Legg til elektron',exact=True).click()
            page.get_by_label('Ladningen til ionet du har bygd',exact=True).fill(str(atomic-t['electrons']))
            page.get_by_role('button',name='Sjekk ionet',exact=True).click()
            assert page.evaluate('KL.progress.atom.attempt.outcome')=='correct'
            results.append('ion challenge '+id)
        page.evaluate('window.scrollTo(0,0);document.activeElement?.blur()');page.screenshot(path=str(QA/'atom-lab.png'),full_page=True)
        # True polarity depends on geometry, not just polar bonds.
        route(page,'lab/polarity')
        for id,charges,polar in [('water',['minus','plus'],'polar'),('carbon-dioxide',['plus','minus'],'nonpolar'),('methane',['none','none'],'nonpolar'),('ammonia',['minus','plus'],'polar'),('hydrogen-chloride',['plus','minus'],'polar')]:
            page.get_by_label('Molekyl',exact=True).select_option(id)
            for i,charge in enumerate(charges):page.locator('.polarity-inputs select').nth(i).select_option(charge)
            page.get_by_label('Hele molekylet',exact=True).select_option(polar)
            page.get_by_role('button',name='Sjekk vurderingen',exact=True).click()
            assert page.evaluate('KL.labUI.polarityCorrect')
            page.get_by_role('button',name='Vis dipoler og forklaring',exact=True).click()
            results.append('polarity '+id)
        page.get_by_role('button',name='Vis koking',exact=True).click();assert page.evaluate('KL.labUI.boiling')
        page.get_by_role('button',name='Vis væske igjen',exact=True).click();assert not page.evaluate('KL.labUI.boiling')
        route(page,'lab/soap')
        for mix,answer in [('oil','layers'),('ethanol','mixed')]:
            page.get_by_label('Stoffer i modellen',exact=True).select_option(mix)
            page.get_by_label('Hvordan oppfører blandingen seg?',exact=True).select_option(answer)
            page.get_by_role('button',name='Sjekk forutsigelsen',exact=True).click();assert page.evaluate('KL.labUI.mixShown')
            results.append('mixture '+mix)
        for i,flip in enumerate(page.evaluate('KL.labUI.soapFlips')):
            if not flip:page.locator('.soap-flip-buttons button').nth(i).click()
        page.get_by_role('button',name='Sjekk retningene',exact=True).click();assert page.evaluate('KL.labUI.soapSolved')
        page.evaluate('window.scrollTo(0,0);document.activeElement?.blur()');page.screenshot(path=str(QA/'soap-lab.png'),full_page=True)
        results.append('soap heads and tails orient toward correct substances')
        # Self-evaluation is not fake language grading or mastery evidence.
        reset(page);route(page,'teacher');text='<script>window.injected=true</script> Min forklaring.'
        page.locator('#teacher-answer').fill(text)
        page.get_by_role('button',name='Sammenlign med sjekklisten',exact=True).click()
        page.get_by_role('button',name='Vis et eksempelsvar',exact=True).click()
        page.get_by_role('button',name='Jeg har sammenlignet',exact=True).click()
        assert page.evaluate('KL.progress.points')==0 and page.evaluate('Object.keys(KL.progress.skills).length')==0
        assert page.evaluate('window.injected===undefined')
        page.evaluate('KL.progress=KL.readStorage(localStorage).state;KL.renderApp()')
        assert page.locator('#teacher-answer').input_value()==text
        results.append('teacher rubric persists literal text; no fabricated grading or points')
        route(page,'settings');page.get_by_label('Fargetema',exact=True).select_option('light')
        assert page.locator('html').get_attribute('data-theme')=='light'
        page.get_by_label('Redusert bevegelse',exact=False).check()
        assert page.locator('html').get_attribute('data-motion')=='reduced'
        route(page,'start');page.evaluate('window.scrollTo(0,0);document.activeElement?.blur()');page.screenshot(path=str(QA/'home-light.png'),full_page=True)
        results.append('light theme and reduced motion')
        # Real import controls, exact validation and explicit replacement dialog.
        route(page,'settings');export=page.evaluate('JSON.stringify(KL.progress)');invalid=json.loads(export);invalid['schemaVersion']=99
        page.locator('#progress-import').set_input_files({'name':'invalid.json','mimeType':'application/json','buffer':json.dumps(invalid).encode()})
        assert page.get_by_role('dialog').get_attribute('aria-label')=='Importen ble stoppet'
        page.get_by_role('button',name='Lukk',exact=True).click()
        assert page.evaluate('JSON.stringify(KL.progress)')==export
        valid=json.loads(export);valid['points']=42
        page.locator('#progress-import').set_input_files({'name':'valid.json','mimeType':'application/json','buffer':json.dumps(valid).encode()})
        assert page.evaluate('KL.progress.points')==0
        page.get_by_role('button',name='Importer og erstatt',exact=True).click()
        assert page.evaluate('KL.progress.points')==42
        results.append('invalid import preserves state; valid replacement requires confirmation')
        # Offline execution: no requests at all after content has loaded.
        requests=[];page.on('request',lambda r:requests.append(r.url))
        page.context.set_offline(True)
        route(page,'lab/atom');page.get_by_role('button',name='Legg til elektron',exact=True).click()
        route(page,'lesson/m08');route(page,'start')
        assert not requests,requests
        results.append('loaded app has no network dependency')
        denied,denied_errors=fresh(browser,storage=False)
        question(denied,'q002');denied.locator('#answer-input').fill('nøytron')
        denied.get_by_role('button',name='Sjekk',exact=True).click()
        assert denied.locator('.storage-notice').count()==1
        assert denied.locator('[data-save-status]').inner_text()=='Lagring utilgjengelig'
        assert denied.evaluate('KL.progress.session.current.finalized')
        results.append('denied storage still allows learning with honest save warning')
        assert not errors,errors
        assert not denied_errors,denied_errors
        (QA/'flow-results.json').write_text(json.dumps({'checks':len(results),'results':results,'errors':errors},ensure_ascii=False,indent=2))
        print('PASS',len(results),'interaction flows')
        browser.close()
if __name__=='__main__':run()
