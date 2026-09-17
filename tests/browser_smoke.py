"""Offline browser QA. Rendering uses set_content because navigation is restricted
in the build container. Persistence tests explicitly use a Storage-compatible
in-memory adapter, not a claim of testing Chrome's native file-origin storage.
Run: python tests/browser_smoke.py (requires Playwright + Chromium).
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os, shutil, tempfile
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text().replace('<link rel="stylesheet" href="app.css">','<style>'+(ROOT/'app.css').read_text()+'</style>').replace('<script src="app.js" defer></script>','<script>'+(ROOT/'app.js').read_text()+'</script>')
QA=Path(os.environ.get('KJEMILAB_QA_DIR',str(Path(tempfile.gettempdir())/'kjemilab-qa'))); QA.mkdir(exist_ok=True)
STORAGE="""() => { window.qaStorage = {}; Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>qaStorage[k]??null,setItem:(k,v)=>{qaStorage[k]=String(v)},removeItem:k=>{delete qaStorage[k]},clear:()=>{window.qaStorage={}}}}); }"""

def launch_browser(playwright):
    executable=os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium') or shutil.which('chromium-browser')
    return playwright.chromium.launch(executable_path=executable,args=['--no-sandbox'])

def fresh(browser,width=1440,height=980,storage=True):
    page=browser.new_page(viewport={'width':width,'height':height}, device_scale_factor=1)
    page.set_default_timeout(6000)
    if storage: page.evaluate(STORAGE)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    page.set_content(HTML,wait_until='load')
    return page, errors

def route(page,path):
    page.evaluate('(path)=>{location.hash=path;KL.renderApp(true)}',path)
    page.wait_for_timeout(25)
    assert page.locator('.error-panel').count()==0, page.locator('.error-panel').inner_text()

def reset(page):
    page.evaluate('()=>{KL.progress=KL.initialState(); KL.persist();KL.renderApp()}')

def question(page,qid):
    page.evaluate('(id)=>{KL.progress.session=KL.newSession(KL.progress,"bank",1,Date.now(),null,[id]); location.hash="ov/session";KL.renderApp(true)}',qid)
    return page.evaluate('KL.questionById[KL.progress.session.current.itemId]')

def correct_answer(page,q):
    a=q['answerSpec'];k=q['kind']
    if k=='choice': page.locator('[data-focus="option-'+a['correctOptionId']+'"]').click()
    elif k=='recall': page.locator('#answer-input').fill(str(a['accepted'][0]))
    elif k=='fields':
        for key,value in a['values'].items():page.locator('#field-'+key).fill(str(value))
    elif k=='categorize':
        for key,value in a['assignments'].items():page.locator('#category-'+key).select_option(value)
    elif k=='order':
        for i,key in enumerate(a['orderedIds']):
            while page.evaluate('(id)=>KL.progress.session.current.answer.indexOf(id)',key)>i:
                page.locator('[data-focus="up-'+key+'"]').click()
    elif k=='select_parts':
        for key in a['selectedPartIds']:page.locator('[data-focus="part-'+key+'"]').click()

def run():
    results=[]
    with sync_playwright() as playwright:
        browser=launch_browser(playwright)
        page,errors=fresh(browser)
        paths=['start','ov','progress','teacher','collection','sources','settings']+['lesson/m'+str(i).zfill(2) for i in range(1,11)]+['lab/'+x for x in ['molecule','atom','polarity','soap']]
        for width in [1440,768,375]:
            page.set_viewport_size({'width':width,'height':900})
            for path in paths:
                route(page,path)
                size=page.evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})')
                assert size['scroll']<=size['width'],(width,path,size)
                results.append('route '+path+' at '+str(width))
        page.set_viewport_size({'width':1440,'height':980})
        route(page,'start');page.screenshot(path=str(QA/'home-desktop.png'),full_page=True)
        page.set_viewport_size({'width':375,'height':812});page.screenshot(path=str(QA/'home-mobile.png'),full_page=True)
        page.set_viewport_size({'width':1440,'height':980})
        q=question(page,'q003');correct_answer(page,q)
        assert page.evaluate('KL.grade(KL.questionById.q003,KL.progress.session.current.answer)')=='correct','Category selections must persist together'
        results.append('category selects keep previous selections')
        # The complete supplied question bank through actual native controls.
        for qid in page.evaluate('KL.questions.map(q=>q.id)'):
            q=question(page,qid);correct_answer(page,q)
            page.get_by_role('button',name='Sjekk',exact=True).click()
            state=page.evaluate('KL.progress.session.current')
            assert state['finalized'] and state['outcome']=='correct',(qid,state)
            assert page.locator('.explanation').count()==1
            assert page.evaluate('KL.validateState(KL.progress).ok'),qid+' produced invalid progress'
            results.append('question '+qid+' UI answer')
        assert not errors,errors
        (QA/'browser-results.json').write_text(json.dumps({'checks':len(results),'results':results,'errors':errors},ensure_ascii=False,indent=2))
        print('PASS',len(results),'browser checks')
        browser.close()
if __name__=='__main__':run()
