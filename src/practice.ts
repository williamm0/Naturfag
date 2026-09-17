namespace KL {
  export const studyUI:{mode:Session['mode'];filter:string;libraryOpen:boolean;bankFilter:string;bankSearch:string}={mode:'adaptive',filter:'m01',libraryOpen:false,bankFilter:'',bankSearch:''};
  export function startSession(mode:Session['mode']='adaptive',count=progress.settings.questionCount,filter:string|null=null,ids:string[]=[]):void {
    if(progress.session&&!progress.session.finished&&!confirm('Starte en ny økt? Oppgaver du allerede har fullført, blir beholdt i fremgangen. Den uferdige økten blir erstattet.'))return;
    progress.session=newSession(progress,mode,count,Date.now(),filter,ids);persist();navigate('ov/session',true);
  }
  export function ensureAttempt():Question|null {
    const s=progress.session;if(!s||s.finished)return null;
    if(s.current)return questionById[s.current.itemId]||null;
    const q=selectQuestion(progress,s);if(!q){s.finished=true;s.endReason=s.index<s.budget?'Det er ikke flere oppgaver med nok avstand i dette utvalget. Du kan bytte tema eller fortsette senere.':'';persist();return null;}
    s.current=blankAttempt(q.id,s.id+':'+s.index+':'+q.id);
    if(s.mode==='exam'&&s.examAnswers[q.id]!==undefined)s.current.answer=copy(s.examAnswers[q.id]);
    persist();return q;
  }
  export function finishCurrent():void {
    const s=progress.session,a=s?.current;if(!s||!a||a.finalized)return;
    const q=questionById[a.itemId];a.finalized=true;
    const event=makeEncounter(a,s.id,q.skillId,q.kind);
    progress=recordEncounter(progress,event);
    const stored=progress.encounters.find(e=>e.id===event.id)!;
    if(!progress.session!.results.some(e=>e.id===event.id))progress.session!.results.push(stored);
    persist();if(stored.outcome==='correct')playSound();
  }
  export function submitAnswer():void {
    const s=progress.session,a=s?.current;if(!s||!a||a.finalized)return;
    const q=questionById[a.itemId];
    if(s.mode==='exam'){saveExamAnswer(false);return;}
    const result=grade(q,a.answer);a.grade=result;
    if(result==='invalid_format'){a.message='Fyll ut alle delene. I tallfelt skriver du bare et gyldig tall. Formler må ha riktige store og små bokstaver.';persist();renderApp();return;}
    if(a.firstCorrect===null)a.firstCorrect=result==='correct';
    if(result==='correct'){a.outcome='correct';a.message=a.firstCorrect&&!a.helpUsed&&a.incorrectAttempts===0?'På plass, uten hjelp.':'På plass. Denne fikk du til med hjelp.';finishCurrent();}
    else {a.incorrectAttempts++;a.message=result==='needs_self_check'?'Jeg gjenkjente ikke skrivemåten. Prøv et kort fagbegrep, eller åpne forklaringen og vurder svaret selv.':'Ikke helt ennå. Prøv en gang til, eller bruk et hint.';if(result==='needs_self_check')a.helpUsed=true;persist();}
    renderApp();
    if(progress.session?.current?.finalized)document.querySelector<HTMLElement>('[data-focus="next-question"]')?.focus();
  }
  export function revealAnswer(unknown=false):void {
    const s=progress.session,a=s?.current;if(!s||!a||a.finalized)return;
    if(s.mode==='exam'){saveExamAnswer(true);return;}
    a.outcome=unknown?'unknown':'revealed';a.revealed=true;a.helpUsed=true;if(a.firstCorrect===null)a.firstCorrect=false;
    a.message=unknown?'Denne tar vi frem igjen.':'Forklaring åpnet. Dette teller ikke som selvstendig gjenhenting.';
    finishCurrent();renderApp();
  }
  export function convertExamToPractice():void {
    const s=progress.session;if(!s||s.mode!=='exam')return;
    for(let i=0;i<s.index;i++){
      const id=s.plannedIds[i],q=questionById[id],value=s.examAnswers[id];const a=blankAttempt(id,s.id+':'+i+':'+id);
      a.answer=value??'';const result=grade(q,a.answer);a.firstCorrect=result==='correct';a.outcome=result==='correct'?'correct':'unknown';a.revealed=false;a.incorrectAttempts=result==='correct'?0:1;
      progress=recordEncounter(progress,makeEncounter(a,s.id,q.skillId,q.kind));
      const current=progress.session!;const event=progress.encounters.find(e=>e.id===a.id);if(event&&!current.results.some(e=>e.id===event.id))current.results.push(event);
    }
    progress.session!.mode='bank';persist();
  }
  export function requestHelp():boolean {
    const s=progress.session;
    if(s&&!s.finished&&s.mode==='exam'){
      if(!confirm('Hjelp avslutter miniprøven. Vil du fortsette de samme oppgavene som vanlig øving?'))return false;
      convertExamToPractice();
    }
    if(progress.periodic?.active&&!progress.periodic.active.finished)progress.periodic=markPeriodicHelp(progress.periodic);
    const current=progress.session?.current;
    if(current&&!current.finalized&&!progress.session?.finished)current.helpUsed=true;
    const route=currentRoute();
    if((route==='lab/molecule'||progress.builder.graph.atoms.length>0)&&!progress.builder.attempt.finalized)progress.builder.attempt.helpUsed=true;
    if(progress.atom.ionTarget&&!progress.atom.attempt.finalized)progress.atom.attempt.helpUsed=true;
    persist();return true;
  }
  export function showHint():void {
    if(!requestHelp())return;const a=progress.session?.current;if(!a||a.finalized)return;
    a.hints=Math.min(2,a.hints+1);persist();renderApp();
  }
  export function nextQuestion():void {
    const s=progress.session;if(!s||!s.current?.finalized)return;s.index++;s.current=null;
    if(s.index>=s.budget)s.finished=true;persist();renderApp(true);
  }
  export function setResponse(answer:Answer,redraw=false):void {
    const a=progress.session?.current;if(!a||a.finalized)return;a.answer=answer;persist();if(redraw)renderApp();
  }
  export function saveExamAnswer(unknown:boolean):void {
    const s=progress.session,a=s?.current;if(!s||!a)return;
    const q=questionById[a.itemId];if(!unknown&&grade(q,a.answer)==='invalid_format'){a.message='Fyll ut svaret før du går videre, eller velg «Vet ikke».';a.grade='invalid_format';persist();renderApp();return;}
    s.examAnswers[q.id]=unknown?'':copy(a.answer);s.index++;s.current=null;persist();renderApp(true);
  }
  export function submitExam():void {
    let s=progress.session;if(!s||s.mode!=='exam'||s.finished)return;
    for(let i=0;i<s.plannedIds.length;i++){
      const q=questionById[s.plannedIds[i]],a=blankAttempt(q.id,s.id+':'+i+':'+q.id);a.answer=s.examAnswers[q.id]??'';
      const result=grade(q,a.answer);a.firstCorrect=result==='correct';a.outcome=result==='correct'?'correct':'unknown';a.incorrectAttempts=result==='correct'?0:1;
      progress=recordEncounter(progress,makeEncounter(a,s.id,q.skillId,q.kind));
      const e=progress.encounters.find(e=>e.id===a.id)!;if(!progress.session!.results.some(x=>x.id===e.id))progress.session!.results.push(e);
      s=progress.session!;
    }
    s.finished=true;s.current=null;persist();renderApp(true);
  }
  function responseControls(q:Question,a:Attempt,disabled=false):HTMLElement {
    const wrap=h('div',{class:'response-controls'});
    if(q.inputSpec.referenceTable==='first20')wrap.append(periodicTable(null,undefined,true));
    for(const id of q.inputSpec.diagramIds||[])wrap.append(questionDiagram(id));
    if(q.kind==='choice'){
      wrap.classList.add('choice-controls');a.order.forEach((id,index)=>{const o=q.inputSpec.options!.find(o=>o.id===id)!;
        wrap.append(btn([h('span',{class:'choice-letter'},String.fromCharCode(65+index)),h('span',{},o.text),a.answer===id?icon('check',18):null],()=>setResponse(id,true),'choice'+(a.answer===id?' selected':''),{'aria-pressed':a.answer===id,disabled,'data-focus':'option-'+id}));
      });
    }else if(q.kind==='recall'){
      const numeric=q.answerSpec.normalization==='number';
      wrap.append(labeledInput(numeric?'Svaret ditt':'Fagbegrep eller formel',String(a.answer),v=>setResponse(v),{id:'answer-input',placeholder:q.inputSpec.placeholder||'Skriv svaret ditt',inputmode:numeric?'decimal':'text',disabled,maxlength:500,'data-focus':'answer-input'}));
      if(numeric)wrap.append(h('p',{class:'small muted'},'Skriv bare tallet. Både desimalkomma og desimalpunktum går fint.'));
      else if(q.answerSpec.normalization==='formula'||q.answerSpec.normalization==='group_formula')wrap.append(h('p',{class:'small muted'},'Du kan bruke vanlige tall eller senkede tall. Store og små bokstaver i grunnstoffsymboler er forskjellige.'));
    }else if(q.kind==='fields'){
      wrap.classList.add('fields-grid');
      for(const f of q.inputSpec.fields||[])wrap.append(labeledInput(f.label,String((a.answer as Record<string,string>)[f.id]??''),v=>{const next={...(a.answer as Record<string,string>),[f.id]:v};setResponse(next)},{id:'field-'+f.id,inputmode:'decimal',disabled,maxlength:40,'data-focus':'field-'+f.id,placeholder:'…'}));
    }else if(q.kind==='categorize'){
      const values=a.answer as Record<string,string>;
      for(const id of a.order){const item=q.inputSpec.items!.find(x=>x.id===id)!;
        wrap.append(h('div',{class:'category-row'},h('div',{class:'category-name'},item.text),makeSelect('Kategori for '+item.text,values[id]||'',q.inputSpec.groups!,value=>setResponse({...(a.answer as Record<string,string>),[id]:value}),true,{id:'category-'+id,disabled,'data-focus':'category-'+id,'class':'category-select'})));
      }
    }else if(q.kind==='order'){
      const ordered=a.answer as string[];
      ordered.forEach((id,index)=>{const item=q.inputSpec.items!.find(x=>x.id===id)!;
        const move=(delta:number)=>{const next=ordered.slice();[next[index],next[index+delta]]=[next[index+delta],next[index]];setResponse(next,true)};
        wrap.append(h('div',{class:'order-row'},h('span',{class:'order-number'},index+1),h('span',{class:'order-text'},item.text),h('div',{class:'order-buttons'},btn(icon('up',17),()=>move(-1),'icon-button',{disabled:disabled||index===0,'aria-label':'Flytt '+item.text+' opp','data-focus':'up-'+id}),btn(icon('down',17),()=>move(1),'icon-button',{disabled:disabled||index===ordered.length-1,'aria-label':'Flytt '+item.text+' ned','data-focus':'down-'+id}))));
      });
      wrap.append(h('p',{class:'small muted'},'Bruk knappene for å flytte hvert ledd opp eller ned.'));
    }else if(q.kind==='select_parts'){
      const selected=a.answer as string[],id=q.inputSpec.diagramId!,d=diagramById[id];
      const toggle=(part:string)=>{if(disabled)return;const result=q.inputSpec.multiple?(selected.includes(part)?selected.filter(x=>x!==part):[...selected,part]):[part];setResponse(result,true)};
      wrap.append(questionDiagram(id,selected,disabled?undefined:toggle));
      let parts:Option[]=[];
      if(d.moleculeId)parts=moleculeById[d.moleculeId].expandedGraph.atoms.map(atom=>({id:atom.id,text:atom.element+' · '+atom.id}));
      else parts=id==='fatty-acid-unsaturated'?[{id:'carbonyl-double',text:'Bindingen mellom C og O'},{id:'chain-double',text:'Bindingen mellom C og C'}]:[{id:'heads',text:'Området med COO⁻-hoder'},{id:'tails',text:'Området med hydrokarbonhaler'}];
      wrap.append(h('div',{class:'part-options',role:'group','aria-label':'Velg delene i modellen'},parts.map(part=>btn(part.text,()=>toggle(part.id),'part-option'+(selected.includes(part.id)?' selected':''),{'aria-pressed':selected.includes(part.id),disabled,'data-focus':'part-'+part.id}))),h('p',{class:'small muted'},q.inputSpec.multiple?'Velg alle delene oppgaven ber om, og ingen andre. Du kan klikke i modellen eller bruke knappene.':'Velg én del. Du kan klikke i modellen eller bruke knappene.'));
    }
    return wrap;
  }
  export function renderPracticeSetup():HTMLElement {
    const page=h('div',{class:'page'},pageHead('Få det til å sitte.','Hent frem det du vet. Et hint er alltid tilgjengelig når du trenger det.'));
    if(progress.session&&!progress.session.finished)page.append(h('div',{class:'resume-strip'},h('div',{},h('strong',{},'Du har en økt på pause.'),h('span',{class:'muted small'},` ${progress.session.index} av ${progress.session.budget} oppgaver er fullført.`)),link(['Fortsett',icon('arrow',17)],'ov/session','button secondary')));
    const modes:{id:Session['mode'];title:string;text:string}[]=[{id:'adaptive',title:'Blandet øving',text:'Nytt stoff, repetisjon og det som trenger en ny runde.'},{id:'topic',title:'Ett tema',text:'Hold oppgavene innenfor et tema du velger.'},{id:'repair',title:'Det jeg bommet på',text:'Prøv ferdighetene du har hatt vansker med.'},{id:'exam',title:'Miniprøve',text:'20 oppgaver. To fra hvert tema. Resultat etter innlevering.'}];
    const modeList=h('div',{class:'mode-list'},modes.map(m=>btn([h('span',{class:'radio-indicator'}),h('span',{},h('strong',{},m.title),h('span',{class:'small muted'},m.text))],()=>{studyUI.mode=m.id;renderApp()},'mode-option'+(studyUI.mode===m.id?' selected':''),{'aria-pressed':studyUI.mode===m.id,'data-focus':'mode-'+m.id})));
    const settings=h('div',{class:'practice-settings'},h('h2',{},'Din neste økt'),h('p',{class:'muted small'},'Ingen nedtelling. Ingen liv å miste.'),studyUI.mode==='exam'?h('p',{class:'note'},'Miniprøven gir en oversikt over disse 20 svarene, ikke en skolekarakter. Du kan redigere svarene før du leverer.'):questionCountControl());
    if(studyUI.mode==='topic')settings.append(makeSelect('Tema',studyUI.filter,modules.map(m=>({id:m.id,text:m.title})),v=>{studyUI.filter=v;renderApp()}));
    const canRepair=Object.keys(progress.repairs).length>0||Object.values(progress.skills).some(s=>skillStatus(s)==='practicing');
    if(studyUI.mode==='repair'&&!canRepair)settings.append(h('p',{class:'note'},'Ingen vanskelige oppgaver er registrert ennå. Begynn med blandet øving.'));
    settings.append(btn(['Start en økt',icon('arrow',18)],()=>startSession(studyUI.mode,studyUI.mode==='exam'?20:progress.settings.questionCount,studyUI.mode==='topic'?studyUI.filter:null),'button primary full',{disabled:studyUI.mode==='repair'&&!canRepair}),btn('Ta en startsjekk med 10 oppgaver',()=>startSession('diagnostic',10),'quiet-button'));
    page.append(h('section',{class:'setup-grid panel'},modeList,settings),h('div',{class:'practice-bottom'},link([icon('book'),'Lærerens spørsmål og refleksjoner'],'teacher','button secondary'),link([icon('lab'),'Prøv noe i laboratoriet'],'lab/molecule','button secondary')));
    const library=h('details',{class:'question-library',open:studyUI.libraryOpen,ontoggle:(e:Event)=>{studyUI.libraryOpen=(e.target as HTMLDetailsElement).open}},h('summary',{},'Oppgavebank',h('span',{class:'muted small'},'Alle 120 oppgavene, uten låser')));
    const filters=h('div',{class:'library-filters'},makeSelect('Filtrer tema',studyUI.bankFilter,[{id:'',text:'Alle temaer'},...modules.map(m=>({id:m.id,text:m.title}))],v=>{studyUI.bankFilter=v;renderApp()}),labeledInput('Søk i oppgavene',studyUI.bankSearch,v=>{studyUI.bankSearch=v;renderApp()},{id:'bank-search',type:'search','data-focus':'bank-search',placeholder:'Søk etter et fagbegrep …'}));
    const matching=questions.filter(q=>(!studyUI.bankFilter||skillById[q.skillId].moduleId===studyUI.bankFilter)&&normalizeTerm(q.prompt+' '+q.id).includes(normalizeTerm(studyUI.bankSearch)));
    library.append(filters,h('p',{class:'small muted'},matching.length+' oppgaver'),h('div',{class:'bank-rows'},matching.map(q=>btn([h('span',{class:'bank-id'},q.id.replace('q','')),h('span',{class:'bank-text'},q.prompt),h('span',{class:'small muted'},kindText[q.kind]),icon('chevron',17)],()=>startSession('bank',1,null,[q.id]),'bank-row',{'data-question-id':q.id}))));
    page.append(library);return page;
  }
  export function questionCountControl():HTMLElement {
    return h('div',{class:'count-control'},h('span',{class:'field-title'},'Antall oppgaver'),h('div',{class:'segmented',role:'group','aria-label':'Antall oppgaver'},[8,12,20].map(n=>btn(String(n),()=>{progress.settings.questionCount=n;persist();renderApp()},progress.settings.questionCount===n?'selected':'',{'aria-pressed':progress.settings.questionCount===n,'data-focus':'count-'+n}))),h('p',{class:'small muted'},'Repetisjoner bruker de samme plassene i økten.'));
  }
  export function renderSession():HTMLElement {
    const s=progress.session;if(!s)return renderPracticeSetup();if(s.finished)return sessionSummary();
    if(s.mode==='exam'&&s.index>=s.budget)return examReview();
    const q=ensureAttempt();if(!q)return sessionSummary();const session=progress.session!,a=session.current!,skill=skillById[q.skillId];
    const page=h('div',{class:'page session-page'},h('header',{class:'session-header'},link([icon('back',16),'Sett på pause'],'start','quiet-button'),h('span',{class:'session-count'},`Oppgave ${session.index+1} av ${session.budget}`),h('span',{class:'muted small'},session.mode==='exam'?'Miniprøve':session.mode==='diagnostic'?'Startsjekk':'Øving')),h('div',{class:'session-progress',role:'progressbar','aria-label':'Fullførte oppgaver','aria-valuenow':session.index,'aria-valuemin':0,'aria-valuemax':session.budget},h('div',{style:`width:${session.index/session.budget*100}%`})));
    const needsIntro=!['exam','diagnostic','bank'].includes(session.mode)&&!progress.visited.includes(q.skillId)&&!session.seenSkillLessons.includes(q.skillId)&&a.firstCorrect===null&&!a.helpUsed;
    if(needsIntro){
      page.append(h('section',{class:'intro-panel panel'},h('div',{class:'intro-copy'},h('p',{class:'small muted'},moduleById[skill.moduleId].title),h('h1',{},skill.title),h('p',{class:'lesson-objective'},skill.objective),h('p',{},skill.lesson),originNote(skill),btn(['Prøv selv',icon('arrow',18)],()=>{progress.visited=[...new Set([...progress.visited,skill.id])];session.seenSkillLessons.push(skill.id);session.current=blankAttempt(q.id,a.id+':ready');persist();renderApp(true)},'button primary'),sourceFooter(skill.sourceRefs,skill.clarificationIds)),lessonVisual(skill.id)));return page;
    }
    const body=h('section',{class:'exercise panel'},h('div',{class:'exercise-meta'},h('span',{},skill.title),h('span',{class:'interaction-kind'},kindText[q.kind])),h('h1',{class:'question-heading'},q.prompt));
    const form=h('form',{onsubmit:(e:Event)=>{e.preventDefault();submitAnswer()},novalidate:true},responseControls(q,a,a.finalized));
    if(!a.finalized){
      if(a.message)form.append(feedback(a.message,a.grade==='invalid_format'?'hint':'retry'));
      for(let i=0;i<a.hints;i++)form.append(feedback(q.hints[i],'hint'));
      if(a.showLesson)form.append(h('aside',{class:'inline-lesson'},h('h3',{},skill.title),h('p',{},skill.lesson),lessonVisual(skill.id)));
      form.append(h('div',{class:'exercise-actions'},h('button',{type:'submit',class:'button primary','data-focus':'check-answer'},session.mode==='exam'?'Lagre svar og neste':'Sjekk',icon(session.mode==='exam'?'arrow':'check',18)),btn([icon('hint',18),a.hints?'Et hint til':'Hint'],showHint,'button secondary',{disabled:a.hints>=2,'data-focus':'hint-button'})));
      form.append(h('div',{class:'exercise-secondary'},btn(session.mode==='exam'||session.mode==='diagnostic'?'Vet ikke':a.firstCorrect!==null?'Vis forklaring':'Hopp over og vis forklaring',()=>revealAnswer(session.mode==='diagnostic'),'quiet-button'),btn('Les den korte forklaringen',()=>{if(!requestHelp())return;progress.session!.current!.showLesson=true;persist();renderApp()},'quiet-button')));
    }else{
      const good=a.outcome==='correct';form.append(h('div',{class:'answer-feedback'},feedback(a.message,good?'success':'info'),h('div',{class:'explanation'},q.kind==='select_parts'?questionDiagram(q.inputSpec.diagramId!,q.answerSpec.selectedPartIds):h('p',{class:'keyed-answer'},answerText(q)),h('p',{},q.explanation)),h('div',{class:'exercise-actions'},btn([session.index+1>=session.budget?'Avslutt økten':'Neste oppgave',icon('arrow',18)],nextQuestion,'button primary',{'data-focus':'next-question'}),h('span',{class:'small muted'},good?(progress.encounters.find(e=>e.id===a.id)?.points||0)+' øktpoeng':'Ingen poeng for å åpne svaret'))));
    }
    body.append(form,sourceFooter(q.sourceRefs,q.clarificationIds));page.append(body,h('p',{class:'session-footnote'},session.mode==='exam'?'Svarene vurderes først når du leverer hele miniprøven.':'Det er forskjell på å få til med hjelp og å hente frem selv. Begge deler er en del av øvingen.'));
    return page;
  }
  export function originNote(skill:Skill):Child {
    return skill.origin==='supplement'?h('p',{class:'small source-note'},'Merket tillegg: Dette forklarer såpedelen i lærerens refleksjonsspørsmål.'):skill.origin==='clarification'?h('p',{class:'small source-note'},'Faglig presisering av undervisningsmaterialet. Kildene og forskjellene ligger nedenfor.'):null;
  }
  export function examReview():HTMLElement {
    const s=progress.session!;return h('div',{class:'page session-page'},pageHead('Se over før du leverer.','Ingen svar er vurdert ennå.'),h('div',{class:'panel exam-review'},s.plannedIds.map((id,i)=>h('div',{class:'exam-row'},h('span',{class:'order-number'},i+1),h('span',{},questionById[id].prompt),h('span',{class:'small muted'},s.examAnswers[id]===''?'Vet ikke':'Svar lagret'),btn('Endre',()=>{s.index=i;s.current=null;persist();renderApp(true)},'quiet-button')))),h('div',{class:'exercise-actions'},btn(['Lever miniprøven',icon('check',18)],submitExam,'button primary'),link('Sett på pause','start','quiet-button')));
  }
  export function showCompletedQuestion(e:Encounter):void {
    const q=questionById[e.itemId];if(!q)return;openDialog('Forklaring',h('div',{class:'completed-question'},h('p',{class:'small muted'},skillById[q.skillId].title),h('h3',{},q.prompt),q.kind==='select_parts'?questionDiagram(q.inputSpec.diagramId!,q.answerSpec.selectedPartIds):h('p',{class:'keyed-answer'},answerText(q)),h('p',{},q.explanation),sourceContent(q.sourceRefs)));
  }
  export function sessionSummary():HTMLElement {
    const s=progress.session!;if(!s)return renderPracticeSetup();
    const independent=s.results.filter(e=>e.independent).length,assisted=s.results.filter(e=>e.outcome==='correct'&&!e.independent).length,other=s.results.length-independent-assisted,points=s.results.reduce((n,e)=>n+(e.points||0),0);
    const fragile=[...new Set(s.results.filter(e=>!e.independent).map(e=>e.skillId))].slice(0,3);
    const page=h('div',{class:'page summary-page'},pageHead(s.mode==='exam'?'Miniprøven er levert.':s.mode==='diagnostic'?'Et sted å begynne.':'En runde nærmere.','Se hva du hentet frem selv, og hva du kan vende tilbake til.'));
    page.append(h('section',{class:'summary-panel panel'},h('div',{class:'summary-mark'},icon('check',35)),h('h2',{},s.mode==='exam'?`${independent} av ${s.results.length} riktige`:`${s.results.length} oppgaver fullført`),h('div',{class:'summary-numbers'},h('div',{},h('strong',{},independent),h('span',{},'Uten hjelp')),h('div',{},h('strong',{},assisted),h('span',{},'Med hjelp')),h('div',{},h('strong',{},other),h('span',{},s.mode==='exam'?'Ikke riktig / vet ikke':'Forklaring / vet ikke'))),s.mode!=='exam'?h('p',{class:'small muted'},points+' øktpoeng. Poeng avgjør ikke ferdighetsnivå.'):h('p',{class:'small muted'},'Resultatet gjelder disse oppgavene. Det er ikke en skolekarakter.'),s.endReason?h('p',{class:'note'},s.endReason):null,h('div',{class:'exercise-actions'},btn(['Fortsett å øve',icon('arrow',18)],()=>startSession('adaptive'),'button primary'),link('Se fremgangen','progress','button secondary'))));
    if(fragile.length)page.append(h('section',{class:'revisit-section'},h('h2',{},s.mode==='diagnostic'?'Begynn gjerne her':'Verdt en ny runde'),fragile.map(id=>h('div',{class:'revisit-row'},h('div',{},h('h3',{},skillById[id].title),h('p',{class:'small muted'},skillById[id].objective)),btn('Øv på dette',()=>startSession('topic',4,id),'button secondary')))));
    const pending=Object.keys(progress.repairs).length;if(pending)page.append(h('p',{class:'note'},`${pending} ferdigheter ligger i repetisjonskøen. De dukker opp når du har gjort andre oppgaver imellom, eller ved senere repetisjon.`));
    page.append(h('details',{class:'question-library'},h('summary',{},'Se oppgavene fra økten'),h('div',{class:'bank-rows'},s.results.map(e=>btn([icon(e.outcome==='correct'?'check':'book',17),h('span',{class:'bank-text'},questionById[e.itemId]?.prompt||e.itemId),h('span',{class:'small muted'},e.independent?'Uten hjelp':e.outcome==='correct'?'Med hjelp':'Se forklaring')],()=>showCompletedQuestion(e),'bank-row')))));
    return page;
  }
}
