namespace KL {
  export const periodicUI={selected:'Na',highlight:'element',query:'',custom:false,oralHint:0,oralCompare:false,oralAnswer:false};
  function ptState():PeriodicState {if(!progress.periodic)progress.periodic=initialPeriodicState();return progress.periodic;}
  function savePT(s:PeriodicState,redraw=true):void {progress.periodic=s;persist();if(redraw)renderApp();}
  function ptColumn(group:number):number{return periodicGroups.indexOf(group)+2+(group>=13?1:0);}
  function resetOralUI():void {periodicUI.oralHint=0;periodicUI.oralCompare=false;periodicUI.oralAnswer=false;}
  function ptElementClass(e:Element):string {return e.category==='metall'?'metal':e.category==='halvmetall'?'metalloid':e.category==='edelgass'?'noble':'nonmetal';}
  function choosePTElement(symbol:string):void {periodicUI.selected=symbol;periodicUI.highlight='element';renderApp();}
  function ptGrid(options:{quiz?:PeriodicAttempt;select?:(position:string)=>void}={}):HTMLElement {
    const a=options.quiz,question=a?periodicById[a.itemId]:null,selected=elementBySymbol[periodicUI.selected];
    const wrap=h('div',{class:'pt-table-scroll','data-scroll-key':a?'pt-quiz-'+a.itemId:'pt-explore',tabIndex:0,'aria-label':a?'Plasser grunnstoffet. Bla vannrett ved behov.':'Utsnitt av periodesystemet. Bla vannrett ved behov.'});
    const grid=h('div',{class:'pt-grid','aria-label':a?'Velg gruppe og periode':'De 20 første grunnstoffene'});
    grid.append(h('span',{class:'pt-axis-corner',style:'grid-column:1;grid-row:1','aria-hidden':true},'P'));
    for(const group of periodicGroups){
      const style=`grid-column:${ptColumn(group)};grid-row:1`;
      if(a)grid.append(h('span',{class:'pt-axis',style},String(group)));
      else grid.append(btn(String(group),()=>{const found=elements.find(e=>e.group===group);if(found)periodicUI.selected=found.symbol;periodicUI.highlight='group';renderApp()},'pt-axis pt-axis-button'+(periodicUI.highlight==='group'&&selected.group===group?' active':''),{style,'aria-label':'Vis gruppe '+group,'aria-pressed':periodicUI.highlight==='group'&&selected.group===group}));
    }
    grid.append(h('span',{class:'pt-omitted',style:'grid-column:4;grid-row:1',title:'Gruppene 3–12 er utelatt i dette utsnittet.'},'3–12'));
    for(let period=1;period<=4;period++){
      const style=`grid-column:1;grid-row:${period+1}`;
      grid.append(a?h('span',{class:'pt-axis',style},String(period)):btn(String(period),()=>{periodicUI.selected=elements.find(e=>e.period===period)!.symbol;periodicUI.highlight='period';renderApp()},'pt-axis pt-axis-button'+(periodicUI.highlight==='period'&&selected.period===period?' active':''),{style,'aria-label':'Vis periode '+period,'aria-pressed':periodicUI.highlight==='period'&&selected.period===period}));
    }
    if(!a)grid.append(h('div',{class:'pt-table-note',style:'grid-column:5 / 10;grid-row:2'},h('strong',{},'Se mønsteret.'),h('span',{},'Klikk på et grunnstoff, et gruppenummer eller et periodenummer.')));
    const query=periodicUI.query.trim().toLocaleLowerCase('nb-NO');
    for(const e of elements){
      const pos=`${e.period}:${e.group}`,target=question?.expected===pos,chosen=a?a.answer===pos:selected.symbol===e.symbol;
      const match=!query||e.name.includes(query)||e.symbol.toLowerCase()===query||String(e.atomicNumber)===query;
      const highlight=!a&&((periodicUI.highlight==='group'&&e.group===selected.group)||(periodicUI.highlight==='period'&&e.period===selected.period));
      const reveal=!!a?.finished&&target;
      const style=`grid-column:${ptColumn(e.group)};grid-row:${e.period+1}`;
      const name=a?`Gruppe ${e.group}, periode ${e.period}`:`${titleCase(e.name)} (${e.symbol}), atomnummer ${e.atomicNumber}`;
      const classes='pt-cell '+(!a?ptElementClass(e):'blind')+(chosen?' selected':'')+(highlight?' highlighted':'')+(!a&&!match?' dimmed':'')+(reveal?' answer-cell':'');
      grid.append(btn(a?(reveal?[h('span',{class:'pt-symbol'},elementBySymbol[question!.symbol!].symbol),icon('check',16)]:[h('span',{class:'pt-empty','aria-hidden':true},chosen?'?':'·')]):[h('span',{class:'pt-number'},e.atomicNumber),h('span',{class:'pt-symbol'},e.symbol),h('span',{class:'pt-element-name'},e.name)],()=>{if(a)options.select?.(pos);else choosePTElement(e.symbol)},classes,{style,'aria-label':name,'aria-pressed':!!chosen,disabled:!!a?.finished,'data-position':pos,'data-focus':'pt-cell-'+pos}));
    }
    if(!a)grid.append(h('div',{class:'pt-bottom-note',style:'grid-column:5 / 11;grid-row:5'},'Periode 4 fortsetter utenfor dette utsnittet.'));
    wrap.append(grid);return h('div',{class:'pt-table-shell'},wrap,h('p',{class:'pt-scroll-hint small muted'},'Sveip tabellen sidelengs for å se alle gruppene. Med tastatur: fokuser tabellen og bruk piltastene.'));
  }
  function ptSelectedDetail():HTMLElement {
    const e=elementBySymbol[periodicUI.selected],v=e.neutralShells[e.neutralShells.length-1];
    const panel=h('aside',{class:'panel pt-element-detail','aria-live':'polite'});
    panel.append(h('div',{class:'pt-detail-heading'},h('div',{},h('span',{class:'pt-detail-category'},titleCase(e.category)),h('h2',{},titleCase(e.name))),h('div',{class:'pt-large-symbol '+ptElementClass(e)},h('small',{},e.atomicNumber),h('span',{},e.symbol))));
    const values=[['Atomnummer',String(e.atomicNumber)],['Gruppe',String(e.group)],['Periode',String(e.period)],['Ytterelektroner',String(v)]];
    panel.append(h('dl',{class:'pt-facts'},values.map(([name,value])=>h('div',{},h('dt',{},name),h('dd',{},value)))));
    panel.append(atomDiagram(e.symbol,e.atomicNumber,false),h('p',{class:'pt-shell-line'},h('span',{class:'muted'},'Elektronfordeling'),h('strong',{},e.neutralShells.join(' · '))));
    let text=`Et nøytralt ${e.name}atom har ${e.atomicNumber} protoner og ${e.atomicNumber} elektroner. `;
    if(periodicUI.highlight==='group')text=`Du følger gruppe ${e.group} nedover. I hovedgruppene har de nøytrale atomene vanligvis like mange ytterelektroner. `;
    if(periodicUI.highlight==='period')text=`Du følger periode ${e.period} bortover. Disse nøytrale atomene har ${e.period} elektronskall. `;
    if(e.symbol==='He')text+='Helium har to ytterelektroner, selv om det står i gruppe 18. Første skall er fullt med to.';
    if(e.symbol==='H')text+='Hydrogen står i gruppe 1, men er ikke et alkalimetall.';
    panel.append(h('p',{class:'small'},text),h('p',{class:'small muted'},'Skalltegningen er en forenklet modell. Den viser ikke nøytroner eller virkelige elektronbaner.'),btn('Øv på '+e.name,()=>{const state=ptState();if(state.active&&!state.active.finished&&!confirm('Bytte øvingsutvalg? Den uferdige runden erstattes. Fullførte svar beholdes.'))return;state.selection=[e.symbol];state.active=null;savePT(state,false);launchPeriodic('mixed')},'button secondary full'),sourceFooter(['F1','N1'],['C01','C03','C04','C14','C15']));
    return panel;
  }
  function ptExplore():HTMLElement {
    const section=h('section',{},h('div',{class:'pt-explore-layout'}));
    const left=h('section',{class:'panel pt-table-panel'},h('div',{class:'section-heading'},h('h2',{},'De 20 første grunnstoffene'),h('span',{class:'small muted'},'Et utsnitt, ikke hele tabellen')));
    left.append(h('div',{class:'pt-search'},labeledInput('Finn et grunnstoff',periodicUI.query,value=>{periodicUI.query=value;const exact=elements.find(e=>[e.symbol.toLowerCase(),e.name,String(e.atomicNumber)].includes(value.trim().toLowerCase()));if(exact)periodicUI.selected=exact.symbol;renderApp()},{id:'pt-search',placeholder:'Navn, symbol eller atomnummer',maxlength:40,'data-focus':'pt-search'}),btn('Nullstill visning',()=>{periodicUI.query='';periodicUI.highlight='element';renderApp()},'quiet-button')));
    left.append(h('p',{class:'pt-axis-help small muted'},'Gruppenummer øverst · Periodenummer til venstre · Gruppe 3–12 er utelatt'),ptGrid(),h('div',{class:'pt-legend'},[['metal','Metall'],['nonmetal','Ikke-metall'],['metalloid','Halvmetall'],['noble','Edelgass']].map(([c,t])=>h('span',{},h('i',{class:c,'aria-hidden':true}),t))));
    if(periodicUI.query&&!elements.some(e=>e.name.includes(periodicUI.query.toLowerCase())||e.symbol.toLowerCase()===periodicUI.query.toLowerCase()||String(e.atomicNumber)===periodicUI.query))left.append(feedback('Ingen treff i de 20 første grunnstoffene. Resten av periodesystemet er ikke med i dette utsnittet.'));
    left.append(h('p',{class:'small muted pt-scope'},'De 20 første er valgt som et håndterlig øvingsutvalg, slik som i NDLAs skallmodell. Prosjektarket sier ikke at disse 20 eller alle 118 må læres utenat.'));
    section.firstElementChild!.append(left,ptSelectedDetail());
    section.append(h('section',{class:'pt-rule-strip'},h('div',{},h('h3',{},'Gruppe'),h('p',{},'En loddrett kolonne. Se etter mønsteret i ytterelektronene.')),h('div',{},h('h3',{},'Periode'),h('p',{},'En vannrett rad. Perioden forteller hvor mange elektronskall et nøytralt atom har.')),h('div',{},h('h3',{},'Atomnummer'),h('p',{},'Antall protoner i kjernen. Dette bestemmer hvilket grunnstoff det er.'))));
    section.append(h('section',{class:'panel pt-project-strip'},h('div',{},h('h2',{},'Kan dere forklare hvorfor?'),h('p',{class:'muted'},'Øv på å koble plasseringen til elektroner, bindinger og egenskaper. Det er også forberedelse til samtalen om plakaten.')),link(['Forklar sammen',icon('arrow',17)],'periodic/oral','button primary')));
    return section;
  }
  function ptScopeControl():HTMLElement {
    const s=ptState(),wrap=h('section',{class:'pt-selection'}),preset=s.selection.length===20?'20':s.selection.length===10&&elements.slice(0,10).every(e=>s.selection.includes(e.symbol))?'10':'custom';
    wrap.append(h('div',{class:'pt-setup-controls'},makeSelect('Grunnstoffer i runden',preset,[{id:'20',text:'De 20 første'},{id:'10',text:'De 10 første'},{id:'custom',text:'Eget utvalg'}],v=>{if(v==='custom')periodicUI.custom=true;else {s.selection=elements.slice(0,Number(v)).map(e=>e.symbol);periodicUI.custom=false;}savePT(s)}),makeSelect('Lengde på runden',String(s.roundSize),[{id:'10',text:'10 oppgaver'},{id:'20',text:'20 oppgaver'}],v=>{s.roundSize=Number(v) as 10|20;savePT(s)}),btn((periodicUI.custom?'Skjul':'Velg')+' grunnstoffer',()=>{periodicUI.custom=!periodicUI.custom;renderApp()},'quiet-button')));
    if(periodicUI.custom){
      wrap.append(h('p',{class:'small muted'},s.selection.length+' grunnstoffer valgt. Velg minst ett. Generelle begrepsoppgaver følger med.'),h('div',{class:'pt-selection-grid'},elements.map(e=>h('label',{class:'pt-select-element'+(s.selection.includes(e.symbol)?' chosen':'')},h('input',{type:'checkbox',checked:s.selection.includes(e.symbol),'aria-label':'Ta med '+e.name+' ('+e.symbol+')',onchange:(event:Event)=>{const checked=(event.target as HTMLInputElement).checked;if(!checked&&s.selection.length===1){(event.target as HTMLInputElement).checked=true;openDialog('Velg minst ett grunnstoff',h('p',{},'Behold ett grunnstoff, eller velg et annet før du fjerner dette.'));return;}s.selection=checked?[...s.selection,e.symbol]:s.selection.filter(x=>x!==e.symbol);savePT(s)}}),h('strong',{},e.symbol),h('span',{},e.name)))));
    }
    return wrap;
  }
  function ptSetup():HTMLElement {
    const s=ptState(),stats=periodicStats(s,'mixed'),root=h('section',{class:'pt-practice-setup'});
    if(s.active&&!s.active.finished)root.append(h('div',{class:'resume-strip panel'},h('div',{},h('strong',{},'En runde venter på deg'),h('p',{class:'small muted'},s.active.results.length+' av '+s.active.queue.length+' oppgaver fullført. Svaret ditt er bevart.')),link('Fortsett runden','periodic/drill','button primary')));
    root.append(h('section',{class:'panel pt-start-panel'},h('div',{class:'pt-start-copy'},h('h2',{},'Hent det frem uten å se.'),h('p',{class:'muted'},'Korte oppgaver med ulike måter å svare på. Feil og hint gir ny øving, ikke tapte liv eller tidspress.'),ptScopeControl()),h('div',{class:'pt-start-action'},btn(['Start blandet runde',icon('arrow',18)],()=>launchPeriodic('mixed'),'button primary'),h('p',{class:'small muted'},'Inntil 6 ekstra repetisjonsoppgaver ved behov.'))));
    const trackSymbols:Record<PeriodicTrack,string>={names:'Na',positions:'17',electrons:'e⁻',ions:'2+',trends:'EN'};
    root.append(h('div',{class:'section-heading'},h('h2',{},'Eller velg hva dere vil pugge'),h('span',{class:'small muted'},'Forstå sammenhengene også')));
    const cards=h('div',{class:'pt-track-grid'});
    const descriptions:Record<PeriodicTrack,string>={names:'Skriv navnet eller symbolet selv.',positions:'Finn riktig rute. Skill kolonne fra rad.',electrons:'Finn protonantall, elektronskall og ytterelektroner.',ions:'Følg elektronene og begrunn fortegnet.',trends:'Sammenlign størrelse og evnen til å trekke på elektroner.'};
    for(const track of Object.keys(trackSymbols) as PeriodicTrack[]){const n=periodicPool(s,track).length;cards.append(btn([h('span',{class:'pt-track-mark'},trackSymbols[track]),h('span',{class:'pt-track-copy'},h('strong',{},periodicTracks[track]),h('span',{},descriptions[track]),h('small',{},n?n+' oppgaver i utvalget':'Velg flere grunnstoffer')),icon('chevron',18)],()=>launchPeriodic(track),'pt-track panel',{disabled:n===0}));}
    root.append(cards,h('div',{class:'pt-stats'},h('div',{},h('strong',{},stats.seen),h('span',{},'ulike oppgaver prøvd')),h('div',{},h('strong',{},stats.due),h('span',{},'klare for repetisjon')),h('div',{},h('strong',{},stats.retained),h('span',{},'husket etter minst ett døgn'))));
    root.append(h('div',{class:'pt-setup-foot'},h('p',{class:'small muted'},'Fremgangen gjelder denne nettleseren. Deler dere enheten, blir den felles. «Husket senere» er ikke det samme som å kunne hele temaet.'),link('Tren på muntlige forklaringer','periodic/oral','text-link')));
    if(stats.weak)root.append(btn('Ta en runde med det som trenger mer øving',()=>{const ids=periodicPool(s,'mixed').filter(q=>s.records[q.id]&&s.records[q.id].lastOutcome!=='independent').map(q=>q.id);launchPeriodic('mixed',ids)},'button secondary'));
    return root;
  }
  function launchPeriodic(track:PeriodicTrack|'mixed',ids?:string[]):void {
    const s=ptState();
    if(s.active&&!s.active.finished&&!confirm('Starte en ny runde? Den uferdige runden erstattes, men fullførte svar beholdes.'))return;
    if(!requestHelp())return;
    const next=startPeriodicRound(ptState(),{track,count:ptState().roundSize,ids});
    if(!next.active){openDialog('Ingen oppgaver i dette utvalget',h('p',{},'Velg flere grunnstoffer eller en annen oppgavetype.'));return;}
    savePT(next,false);navigate('periodic/drill',true);
  }
  function ptAnswerInput(q:PeriodicQuestion,a:PeriodicAttempt):HTMLElement {
    if(q.format==='position'){
      const root=h('div',{class:'pt-position-question'},ptGrid({quiz:a,select:pos=>{ptState().active!.current.answer=pos;persist();renderApp()}}));
      root.append(h('p',{class:'small muted pt-picked'},a.answer?'Valgt: gruppe '+a.answer.split(':')[1]+', periode '+a.answer.split(':')[0]+'.':'Velg en rute. Ingen navn eller symboler vises før du har svart.'));return root;
    }
    if(q.format==='choice'){
      const options=shuffle(q.options!,ptState().active!.seed+hash(q.id));
      return h('div',{class:'choice-controls'},options.map((o,i)=>btn([h('span',{class:'choice-letter'},String.fromCharCode(65+i)),h('span',{},o.text),a.answer===o.id?icon('check',17):null],()=>{ptState().active!.current.answer=o.id;persist();renderApp()},'choice'+(a.answer===o.id?' selected':''),{'aria-pressed':a.answer===o.id,disabled:a.finished,'data-focus':'pt-option-'+o.id})));
    }
    const label=q.format==='symbol'?'Grunnstoffsymbolet':q.format==='name'?'Navnet på grunnstoffet':q.format==='shells'?'Elektroner fra innerste til ytterste skall':q.format==='charge'?'Ionets ladning':'Svaret ditt';
    const input=h('div',{class:'pt-recall'},labeledInput(label,a.answer,value=>{ptState().active!.current.answer=value;persist()},{id:'pt-answer',maxlength:120,placeholder:q.format==='shells'?'Antall i hvert skall':'Skriv svaret ditt',inputmode:q.format==='number'?'numeric':'text',autocapitalize:'off',spellcheck:'false',disabled:a.finished,'data-focus':'pt-answer'}));
    input.append(h('p',{class:'small muted'},q.format==='symbol'?'Husk stor førstebokstav og eventuell liten bokstav etterpå.':q.format==='charge'?'Ta med + eller −. Begge skrivemåtene 2+ og +2 godtas.':q.format==='shells'?'Skill skallene med komma, mellomrom eller bindestrek.':q.format==='number'?'Skriv et helt tall uten enhet.':'Store og små bokstaver i navnet spiller ingen rolle.'));
    return input;
  }
  function ptDrill():HTMLElement {
    const s=ptState(),r=s.active;if(!r)return h('section',{},feedback('Du har ingen pågående puggerunde.'),link('Velg en runde','periodic/pugg','button primary'));
    if(r.finished)return ptSummary();
    const a=r.current,q=periodicById[a.itemId],section=h('section',{class:'pt-drill'});
    section.append(h('div',{class:'session-header'},link([icon('back',16),'Pause runden'],'periodic/pugg','quiet-button'),h('span',{class:'session-count'},'Oppgave '+(r.index+1)+' av '+r.queue.length),h('span',{class:'small muted'},periodicTracks[q.track])),h('progress',{class:'pt-progress',max:r.queue.length,value:r.results.length,'aria-label':'Fullførte oppgaver'}));
    const exercise=h('form',{class:'panel pt-exercise',onsubmit:(event:Event)=>{event.preventDefault();if(a.finished)return;savePT(submitPeriodic(ptState(),ptState().active!.current.answer));if(ptState().active?.current.finished){playSound();document.querySelector<HTMLButtonElement>('[data-focus="pt-next"]')?.focus();}}});
    exercise.append(h('div',{class:'exercise-meta'},h('span',{},q.format==='position'?'Finn ruten':q.format==='choice'?'Velg og begrunn for deg selv':'Skriv fra hukommelsen'),h('span',{},a.assisted&&!a.finished?'Hjelp registrert':'')),h('h2',{class:'question-heading'},q.prompt),ptAnswerInput(q,a));
    for(let i=0;i<a.hints;i++)exercise.append(feedback(q.hints[i],'hint'));
    if(a.message)exercise.append(feedback(a.message,a.finished&&!a.revealed?'success':a.invalid?'info':'hint'));
    const actions=h('div',{class:'exercise-actions'});
    if(a.finished){
      exercise.append(h('section',{class:'explanation'},h('h3',{},'Forklaring'),h('p',{class:'keyed-answer'},q.answerLabel),h('p',{},q.explanation)));
      actions.append(btn([r.index+1>=r.queue.length?'Se runden':'Neste oppgave',icon('arrow',17)],()=>{savePT(nextPeriodicQuestion(ptState()));document.querySelector<HTMLInputElement>('#pt-answer')?.focus()},'button primary',{'data-focus':'pt-next'}));
    }else{
      actions.append(h('button',{type:'submit',class:'button primary'},'Sjekk svaret'),btn([icon('hint',17),'Hint'+(a.hints?' '+a.hints+'/2':'')],()=>savePT(usePeriodicHint(ptState())),'button secondary',{disabled:a.hints>=2}));
    }
    exercise.append(actions);
    if(!a.finished)exercise.append(h('div',{class:'exercise-secondary'},btn('Vet ikke, vis forklaringen',()=>savePT(revealPeriodicAnswer(ptState())),'quiet-button'),link('Slå opp i tabellen','periodic','quiet-button')));
    exercise.append(sourceFooter(q.sourceRefs,q.clarificationIds));section.append(exercise,h('p',{class:'small muted pt-drill-note'},'Feil og hint følges opp etter andre oppgaver. Å slå opp eller forlate en ubesvart oppgave registreres som hjelp. Bare riktig svar på første forsøk uten hjelp teller som selvstendig.'));
    return section;
  }
  function ptSummary():HTMLElement {
    const s=ptState(),r=s.active!,independent=r.results.filter(e=>e.outcome==='independent').length,assisted=r.results.filter(e=>e.outcome==='assisted').length,revealed=r.results.filter(e=>e.outcome==='revealed').length;
    const trouble=[...new Set(r.results.filter(e=>e.outcome!=='independent').map(e=>e.itemId))];
    const section=h('section',{class:'pt-summary'},h('div',{class:'panel summary-panel'},h('div',{class:'summary-check'},icon('check',30)),h('h2',{},'Runden er ferdig.'),h('p',{class:'muted'},'Det viktige er hva du klarer å hente frem igjen senere.'),h('div',{class:'summary-numbers'},h('div',{},h('strong',{},independent),h('span',{},'uten hjelp')),h('div',{},h('strong',{},assisted),h('span',{},'med hjelp eller nytt forsøk')),h('div',{},h('strong',{},revealed),h('span',{},'forklaringer åpnet'))),h('p',{class:'small muted'},r.results.length+' besvarte oppgaver, inkludert eventuelle repetisjoner. Fremgangen er ikke en karakter.'),h('div',{class:'exercise-actions'},btn('Ny blandet runde',()=>launchPeriodic('mixed'),'button primary'),trouble.length?btn('Øv på det som var vanskelig',()=>launchPeriodic(r.track,trouble),'button secondary'):null,link('Velg et annet tema','periodic/pugg','quiet-button'))));
    if(trouble.length)section.append(h('section',{class:'pt-revisit'},h('h3',{},'Dette trengte litt støtte'),h('p',{class:'small muted'},'Også oppgaver du fikk til på nytt i denne runden, kan være nyttige å repetere senere.'),trouble.map(id=>h('div',{class:'pt-revisit-row'},h('span',{},periodicById[id].prompt),h('small',{class:'muted'},dueText(s.records[id]?.dueAt||null))))));
    section.append(h('section',{class:'panel pt-project-strip'},h('div',{},h('h3',{},'Gjør kunnskapen muntlig.'),h('p',{class:'small muted'},'Bytt på å stille spørsmål, forklare og følge opp.')),link('Forklar sammen','periodic/oral','button secondary')));return section;
  }
  function ptOral():HTMLElement {
    const s=ptState(),o=s.oral,q=periodicOral[o.index],section=h('section',{class:'pt-oral'});
    section.append(h('div',{class:'panel pt-oral-intro'},h('div',{},h('h2',{},'Bytt på å forklare.'),h('p',{class:'muted'},'Én forklarer uten oppslag. De andre lytter og stiller oppfølgingsspørsmålet. Sammenlign med sjekklisten etterpå.')),makeSelect('Antall deltakere',String(o.players),[1,2,3,4].map(n=>({id:String(n),text:n===1?'Jeg trener alene':n+' deltakere'})),v=>{const live=ptState();live.oral.players=Number(v);savePT(live)})));
    section.append(h('p',{class:'small muted pt-authorship'},'De 12 spørsmålene er laget for Kjemilab ut fra temaet og vurderingskriteriene. De er ikke lærerens konkrete spørsmål eller en offisiell fasit.'));
    const nav=h('nav',{class:'pt-oral-index','aria-label':'Muntlige spørsmål'},periodicOral.map((item,index)=>btn([h('span',{},String(index+1)),h('span',{class:'sr-only'},item.title),o.done.includes(item.id)?icon('check',12):null],()=>{const live=ptState();live.oral.index=index;resetOralUI();savePT(live)},'pt-oral-index-item'+(o.index===index?' active':''),{'aria-label':'Spørsmål '+(index+1)+': '+item.title,'aria-current':o.index===index?'step':undefined})));
    const work=h('section',{class:'panel pt-oral-work'},h('div',{class:'exercise-meta'},h('span',{},'Spørsmål '+(o.index+1)+' av '+periodicOral.length),h('span',{},o.players===1?'Forklar høyt for deg selv':'Deltaker '+(o.index%o.players+1)+' forklarer')),h('h2',{},q.prompt),h('p',{class:'small muted'},'Bruk gjerne en tegning. En begrunnelse er viktigere enn å ramse opp tall.'));
    work.append(h('label',{class:'field',for:'pt-oral-notes'},h('span',{},'Egne stikkord (valgfritt)'),h('textarea',{id:'pt-oral-notes',rows:4,maxlength:6000,value:o.notes[q.id]||'',placeholder:'Skriv det dere selv vil huske, eller forklar bare høyt.','data-focus':'pt-oral-notes',oninput:(event:Event)=>{const live=ptState().oral;live.notes[q.id]=(event.target as HTMLTextAreaElement).value;live.done=live.done.filter(id=>id!==q.id);persist()}})));
    for(let i=0;i<periodicUI.oralHint;i++)work.append(feedback(q.hints[i],'hint'));
    work.append(h('div',{class:'exercise-actions'},btn(o.players===1?'Jeg har forklart. Vis sjekklisten':'Vi har forklart. Vis sjekklisten',()=>{periodicUI.oralCompare=true;renderApp()},'button primary'),btn([icon('hint',17),'Hint'],()=>{periodicUI.oralHint=Math.min(2,periodicUI.oralHint+1);renderApp()},'button secondary',{disabled:periodicUI.oralHint>=2})));
    const follow=h('details',{class:'pt-followup'},h('summary',{},'Oppfølgingsspørsmål'),h('p',{},q.followup));work.append(follow);
    if(periodicUI.oralCompare){
      const checklist=h('section',{class:'rubric-panel'},h('h3',{},'Vurder forklaringen deres'),h('p',{class:'small muted'},'Avkrysningen er egenvurdering. Nettsiden bedømmer ikke det dere sier eller skriver.'),q.rubric.map((text,i)=>h('label',{class:'rubric-item'},h('input',{type:'checkbox',checked:!!o.checked[q.id]?.[i],onchange:(event:Event)=>{savePT(setPeriodicOralCheck(ptState(),q.id,i,(event.target as HTMLInputElement).checked),false)}}),h('span',{},text))));
      checklist.append(periodicUI.oralAnswer?h('section',{class:'teacher-model-answer'},h('h3',{},'Ett mulig eksempelsvar'),h('p',{},q.modelAnswer),h('p',{class:'small muted'},q.authorship)):btn('Vis et mulig eksempelsvar',()=>{periodicUI.oralAnswer=true;renderApp()},'button secondary'));
      checklist.append(h('div',{class:'exercise-actions'},btn(o.done.includes(q.id)?'Egenvurdert':'Marker som egenvurdert',()=>{const live=ptState();live.oral.done=[...new Set([...live.oral.done,q.id])];savePT(live)},'button secondary',{disabled:o.done.includes(q.id)})));work.append(checklist);
    }
    work.append(sourceFooter(q.sourceRefs,q.clarificationIds),h('nav',{class:'lesson-navigation','aria-label':'Bytt muntlig spørsmål'},btn([icon('back',16),'Forrige'],()=>{const live=ptState();live.oral.index=(live.oral.index+periodicOral.length-1)%periodicOral.length;resetOralUI();savePT(live)},'quiet-button'),btn([o.index===11?'Tilbake til første':'Neste spørsmål',icon('arrow',16)],()=>{const live=ptState();live.oral.index=(live.oral.index+1)%periodicOral.length;resetOralUI();savePT(live)},'button secondary')));
    section.append(nav,work,h('p',{class:'small muted pt-oral-foot'},o.done.length+' av 12 spørsmål egenvurdert. Dette lagres separat fra den automatiske puggingen.'),h('section',{class:'pt-rule-strip'},h('div',{},h('h3',{},'Presist innhold'),h('p',{},'Svar på det som blir spurt om, og bruk et relevant eksempel.')),h('div',{},h('h3',{},'Riktige fagbegrep'),h('p',{},'Forklar betydningen av ordene dere bruker.')),h('div',{},h('h3',{},'Begrunn og følg opp'),h('p',{},'Knytt forklaringen til teorien, og øv på oppfølgingsspørsmål.'))));
    return section;
  }
  export function renderPeriodic():HTMLElement {
    ptState();const route=currentRoute(),mode=route==='periodic/oral'?'oral':route==='periodic/pugg'||route==='periodic/drill'?'pugg':'explore';
    const page=h('div',{class:'page pt-page'},pageHead('Periodesystemet','Øv på plasseringen, forstå mønstrene og forklar sammenhengene.',link('Les fagstoffet','lesson/m02','quiet-button')));
    page.append(h('nav',{class:'lab-tabs pt-tabs','aria-label':'Periodesystemet'},link('Utforsk tabellen','periodic','lab-tab'+(mode==='explore'?' active':'')),link('Pugg','periodic/pugg','lab-tab'+(mode==='pugg'?' active':'')),link('Forklar sammen','periodic/oral','lab-tab'+(mode==='oral'?' active':''))));
    page.append(route==='periodic/drill'?ptDrill():mode==='pugg'?ptSetup():mode==='oral'?ptOral():ptExplore());return page;
  }
}
