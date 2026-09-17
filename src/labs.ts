namespace KL {
  export const labUI={preciseOpen:false,bondA:'',bondB:'',polarityId:'water',charges:{} as Record<string,string>,polarityAnswer:'',polarityTried:false,polarityCorrect:false,polarityReveal:false,polarityMessage:'',boiling:false,mixture:'oil',mixAnswer:'',mixShown:false,mixMessage:'',soapFlips:[true,false,true,false,true,false,true,false],soapMessage:'',soapSolved:false};
  export function renderLab(which:string):HTMLElement {
    const page=h('div',{class:'page lab-page'},pageHead('Tenk med hendene.','Flytt elektroner, koble atomer og prøv ideene i en modell.',link([icon('collection',18),'Molekylsamlingen'],'collection','button secondary')));
    page.append(h('nav',{class:'lab-tabs','aria-label':'Velg arbeidsbenk'},[{id:'molecule',text:'Molekyler'},{id:'atom',text:'Atomer'},{id:'polarity',text:'Polaritet og krefter'},{id:'soap',text:'Olje, vann og såpe'}].map(t=>link(t.text,'lab/'+t.id,'lab-tab'+(which===t.id?' active':'')))));
    page.append(which==='atom'?renderAtomLab():which==='polarity'?renderPolarityLab():which==='soap'?renderSoapLab():renderBuilder());return page;
  }
  export function changeBuilderTarget(id:string,force=false):void {
    if(!targets.some(m=>m.id===id))return;
    const b=progress.builder;
    if(!force&&b.graph.atoms.length&&!b.attempt.finalized&&!confirm('Bytte molekyl? Den uferdige modellen på arbeidsbenken blir erstattet.')){renderApp();return;}
    progress.builder={targetId:id,graph:{atoms:[],bonds:[]},past:[],future:[],selected:null,bondOrder:1,zoom:1,attempt:blankAttempt('build:'+id,'build:'+Date.now()+':'+id),showFormula:false,showValences:false,showAnswer:false};
    labUI.bondA='';labUI.bondB='';persist();renderApp();
  }
  export function setBuilderGraph(graph:Graph,remember=true):void {
    const b=progress.builder;if(b.attempt.finalized)return;
    if(remember){b.past.push(copy(b.graph));b.past=b.past.slice(-30);b.future=[];}
    b.graph=graph;if(!graph.atoms.some(a=>a.id===b.selected))b.selected=null;
    if(!graph.atoms.some(a=>a.id===labUI.bondA))labUI.bondA='';if(!graph.atoms.some(a=>a.id===labUI.bondB))labUI.bondB='';persist();renderApp();
  }
  export function addBuilderAtom(element:string):void {
    const b=progress.builder;if(b.attempt.finalized||b.graph.atoms.length>=40)return;
    const g=copy(b.graph);let n=1;while(g.atoms.some(a=>a.id===element.toLowerCase()+n))n++;
    const index=g.atoms.length,id=element.toLowerCase()+n;g.atoms.push({id,element,x:75+(index%5)*95,y:70+Math.floor(index/5)*95});
    setBuilderGraph(g);progress.builder.selected=id;persist();renderApp();
  }
  export function connectBuilder(a:string,b:string):void {
    const draft=progress.builder;if(draft.attempt.finalized)return;
    if(!a||!b||a===b||!draft.graph.atoms.some(atom=>atom.id===a)||!draft.graph.atoms.some(atom=>atom.id===b)){draft.attempt.message='Velg to ulike atomer før du lager en binding.';persist();renderApp();return;}
    const g=copy(draft.graph),edge=g.bonds.find(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a));
    if(edge)edge.order=draft.bondOrder;else g.bonds.push({id:'bond-'+a+'-'+b,a,b,order:draft.bondOrder});
    setBuilderGraph(g);progress.builder.selected=null;persist();renderApp();
  }
  export function builderSelect(id:string):void {
    const b=progress.builder;if(b.attempt.finalized)return;
    if(b.selected&&b.selected!==id){connectBuilder(b.selected,id);return;}
    b.selected=b.selected===id?null:id;persist();renderApp();
  }
  export function useBuilderHelp(type:string):void {
    const b=progress.builder;if(b.attempt.finalized)return;
    if(type==='skeleton'&&b.graph.atoms.length&&!confirm('Bytte ut tegningen med karbonskjelettet?'))return;
    b.attempt.helpUsed=true;
    if(type==='formula')b.showFormula=true;
    if(type==='valence')b.showValences=!b.showValences;
    if(type==='hydrogens'){setBuilderGraph(fillHydrogens(b.graph));return;}
    if(type==='skeleton'){
      const target=moleculeById[b.targetId],carbonIds=target.expandedGraph.atoms.filter(a=>a.element==='C').map(a=>a.id);
      setBuilderGraph(graphLayout({atoms:target.expandedGraph.atoms.filter(a=>a.element==='C'),bonds:target.expandedGraph.bonds.filter(b=>carbonIds.includes(b.a)&&carbonIds.includes(b.b))}));return;
    }
    persist();renderApp();
  }
  export function finishBuilder(reveal=false):void {
    const b=progress.builder,a=b.attempt,m=moleculeById[b.targetId];if(a.finalized)return;
    if(reveal){a.outcome='revealed';a.revealed=true;a.helpUsed=true;a.firstCorrect=a.firstCorrect??false;b.showAnswer=true;a.message='Dette er en modell å sammenligne med. Å vise den teller ikke som et fullført bygg.';}
    else {
      if(!b.graph.atoms.length){a.message='Legg til atomer før du sjekker modellen.';persist();renderApp();return;}
      const result=validateGraph(b.graph,m);a.grade=result.outcome==='correct'?'correct':'incorrect';if(a.firstCorrect===null)a.firstCorrect=result.outcome==='correct';
      a.message=result.message;
      if(result.outcome!=='correct'){a.incorrectAttempts++;persist();renderApp();return;}a.outcome='correct';
    }
    a.finalized=true;progress=recordEncounter(progress,makeEncounter(a,progress.labSessionId,m.primarySkillId!,'builder'));persist();if(!reveal)playSound();renderApp();
  }
  export function renderBuilder():HTMLElement {
    const b=progress.builder,m=moleculeById[b.targetId],finished=b.attempt.finalized;
    const main=h('section',{class:'builder-main panel'},h('div',{class:'workbench-heading'},h('div',{},h('h2',{},'Bygg '+m.name),h('p',{class:'small muted'},m.aliases.length?'Også kalt '+m.aliases.join(', '):'En nøytral struktur med C, H og O.')),h('span',{class:'workbench-mode'},finished?'Avsluttet bygg':'Byggeutfordring')));
    const atomTools=h('div',{class:'atom-palette','aria-label':'Legg til atomer'},['C','H','O'].map(el=>btn([h('span',{class:'palette-atom element-'+el},el),h('span',{},'Legg til')],()=>addBuilderAtom(el),'atom-tool',{disabled:finished,'aria-label':'Legg til '+el,'data-focus':'add-'+el})));
    const bondTools=h('div',{class:'bond-tools',role:'group','aria-label':'Bindingsorden'},[{n:1,t:'Enkel'},{n:2,t:'Dobbel'},{n:3,t:'Trippel'}].map(x=>btn([h('span',{class:'bond-glyph'},Array.from({length:x.n},()=>h('i',{}))),x.t],()=>{b.bondOrder=x.n;persist();renderApp()},'bond-tool'+(b.bondOrder===x.n?' selected':''),{'aria-pressed':b.bondOrder===x.n,disabled:finished,'data-focus':'bond-'+x.n})));
    main.append(h('div',{class:'builder-tools'},atomTools,bondTools));
    const canvas=moleculeDiagram(b.graph,{selected:b.selected?[b.selected]:[],onSelect:finished?undefined:builderSelect,showIds:true,showValences:b.showValences,preserve:true,zoom:b.zoom,label:'Arbeidsbenk. Velg to ulike atomer for å lage en binding. Piltaster kan flytte et atom som har fokus.',onMove:finished?undefined:(id,dx,dy)=>{const g=copy(b.graph),atom=g.atoms.find(a=>a.id===id)!;atom.x=(atom.x||0)+dx;atom.y=(atom.y||0)+dy;setBuilderGraph(g)}});
    canvas.classList.add('builder-canvas');main.append(canvas);
    main.append(h('div',{class:'canvas-toolbar'},h('span',{class:'small muted'},b.graph.atoms.length?'Velg to atomer for å binde dem.':'C har fire, H én og O to bindinger i denne modellen.'),h('div',{class:'toolbar-actions'},btn(icon('undo',17),()=>{if(!b.past.length)return;b.future.push(copy(b.graph));b.graph=b.past.pop()!;b.selected=null;persist();renderApp()},'icon-button',{disabled:finished||!b.past.length,'aria-label':'Angre'}),btn(icon('redo',17),()=>{if(!b.future.length)return;b.past.push(copy(b.graph));b.graph=b.future.pop()!;b.selected=null;persist();renderApp()},'icon-button',{disabled:finished||!b.future.length,'aria-label':'Gjør om'}),btn(icon('minus',17),()=>{b.zoom=Math.max(.5,b.zoom-.15);persist();renderApp()},'icon-button',{'aria-label':'Zoom ut',disabled:b.zoom<=.5}),btn(icon('plus',17),()=>{b.zoom=Math.min(2,b.zoom+.15);persist();renderApp()},'icon-button',{'aria-label':'Zoom inn',disabled:b.zoom>=2}),btn('Tilpass',()=>{b.graph=graphLayout(b.graph);b.zoom=1;persist();renderApp()},'quiet-button'),btn(icon('trash',17),()=>{if(confirm('Tømme modellen? Du kan angre dette etterpå.'))setBuilderGraph({atoms:[],bonds:[]})},'icon-button',{disabled:finished||!b.graph.atoms.length,'aria-label':'Tøm modellen'}))));
    if(b.attempt.message)main.append(feedback(b.attempt.message,b.attempt.outcome==='correct'?'success':b.attempt.revealed?'info':'retry'));
    if(b.showAnswer)main.append(h('div',{class:'model-answer'},h('h3',{},'Modell å sammenligne med'),moleculeDiagram(m.expandedGraph),h('p',{class:'small'},fmtFormula(m.formula))));
    if(!finished)main.append(h('div',{class:'exercise-actions'},btn(['Sjekk molekylet',icon('check',18)],()=>finishBuilder(false),'button primary',{'data-focus':'check-build'}),btn(b.attempt.firstCorrect===null?'Hopp over og vis modell':'Vis en riktig modell',()=>finishBuilder(true),'quiet-button')));
    else main.append(h('div',{class:'exercise-actions'},btn(['Bygg neste molekyl',icon('arrow',18)],()=>{const i=targets.findIndex(x=>x.id===b.targetId);changeBuilderTarget(targets[(i+1)%targets.length].id,true)},'button primary'),btn('Prøv dette på nytt',()=>changeBuilderTarget(b.targetId,true),'button secondary'),b.attempt.outcome==='correct'?h('span',{class:'small muted'},progress.collection[b.targetId]?.independent?'Samlet · Bygd uten hjelp':'Samlet · Bygd med hjelp'):null));
    const side=h('aside',{class:'builder-aside'},h('div',{class:'panel side-panel'},makeSelect('Molekyl å bygge',b.targetId,targets.map(x=>({id:x.id,text:x.id==='isobutane'?'Isobutan (2-metylpropan)':titleCase(x.name)})),id=>changeBuilderTarget(id)),h('p',{class:'small muted'},'Utfordringen starter uten formel eller ferdig skjelett. Byggemodellen sjekker både atomene og hvordan de er bundet sammen.'),b.targetId==='propan-1-ol'?h('p',{class:'note small'},'Arket skriver «propanol». Dette målet er propan-1-ol, med OH på enden av kjeden.'):null),h('div',{class:'panel side-panel'},h('h3',{},'Et lite dytt'),h('p',{class:'small muted'},'Disse hjelpemidlene merker dette forsøket som «med hjelp».'),b.showFormula?h('div',{class:'formula-aid'},fmtFormula(m.formula)):btn('Vis molekylformelen',()=>useBuilderHelp('formula'),'aid-button',{disabled:finished}),btn('Start med karbonskjelettet',()=>useBuilderHelp('skeleton'),'aid-button',{disabled:finished}),btn(b.showValences?'Skjul bindingsteller':'Vis bindingsteller',()=>useBuilderHelp('valence'),'aid-button',{disabled:finished}),btn('Fyll ledige plasser med H',()=>useBuilderHelp('hydrogens'),'aid-button',{disabled:finished||!b.graph.atoms.length}),b.attempt.helpUsed?h('p',{class:'small assistance-label'},'Dette forsøket bruker hjelp.'):null));
    const accessible=h('details',{class:'panel accessible-tools',open:labUI.preciseOpen,ontoggle:(e:Event)=>{labUI.preciseOpen=(e.target as HTMLDetailsElement).open}},h('summary',{},'Presise kontroller'),h('p',{class:'small muted'},'Alle handlinger kan også gjøres med disse kontrollene. Ingen dra-og-slipp er nødvendig.'));
    const atomOptions=b.graph.atoms.map(a=>({id:a.id,text:a.element+' · '+a.id}));
    accessible.append(makeSelect('Atom A',labUI.bondA,atomOptions,v=>{labUI.bondA=v},true),makeSelect('Atom B',labUI.bondB,atomOptions,v=>{labUI.bondB=v},true),btn('Koble de to atomene',()=>connectBuilder(labUI.bondA,labUI.bondB),'button secondary full',{disabled:finished||b.graph.atoms.length<2}),makeSelect('Valgt atom',b.selected||'',atomOptions,v=>{b.selected=v||null;persist();renderApp()},true),btn('Fjern valgt atom',()=>{if(!b.selected)return;setBuilderGraph({atoms:b.graph.atoms.filter(a=>a.id!==b.selected),bonds:b.graph.bonds.filter(edge=>edge.a!==b.selected&&edge.b!==b.selected)})},'button secondary full',{disabled:finished||!b.selected}));
    if(b.graph.bonds.length)accessible.append(h('h4',{},'Fjern en binding'),h('div',{class:'bond-list'},b.graph.bonds.map((edge,i)=>btn(`${edge.a} · ${edge.b} (${edge.order})`,()=>{const g=copy(b.graph);g.bonds.splice(i,1);setBuilderGraph(g)},'quiet-button',{disabled:finished,'aria-label':`Fjern binding ${edge.a} til ${edge.b}`}))));
    side.append(accessible,sourceFooter(m.sourceRefs,m.id==='isobutane'?['C10']:m.id==='propan-1-ol'?['C11']:[]));return h('div',{class:'builder-layout'},main,side);
  }
  export const ionTargets:Record<string,{symbol:string;electrons:number;name:string;hint:string}>={
    'Na+':{symbol:'Na',electrons:10,name:'Positivt natriumion',hint:'Natrium har ett ytterelektron. Hvilken endring gir et fullt ytterste skall i modellen?'},
    'Cl-':{symbol:'Cl',electrons:18,name:'Negativt kloridion',hint:'Klor har sju ytterelektroner. Hva mangler for å få åtte?'},
    'Mg2+':{symbol:'Mg',electrons:10,name:'Positivt magnesiumion',hint:'Magnesium står i gruppe 2. Tenk på hva som skjer med de to ytterelektronene.'},
    'O2-':{symbol:'O',electrons:10,name:'Negativt oksidion',hint:'Oksygen har seks ytterelektroner. Hvor mange mangler det til åtte?'},
    'Li+':{symbol:'Li',electrons:2,name:'Positivt litiumion',hint:'Litium har ett elektron utenfor det fulle første skallet.'},
    'F-':{symbol:'F',electrons:10,name:'Negativt fluoridion',hint:'Fluor har sju ytterelektroner. Se etter en liten endring som fyller skallet.'}
  };
  export function beginIon(id:string|null):void {
    const symbol=id?ionTargets[id].symbol:progress.atom.symbol;progress.atom={symbol,electrons:elementBySymbol[symbol].atomicNumber,ionTarget:id,charge:'',showCounts:false,attempt:blankAttempt('ion:'+(id||'Na+'),'ion:'+Date.now())};persist();renderApp();
  }
  export function checkIon(reveal=false):void {
    const d=progress.atom,id=d.ionTarget;if(!id||d.attempt.finalized)return;const target=ionTargets[id],e=elementBySymbol[d.symbol],a=d.attempt,answer=parseNumber(d.charge);
    if(!reveal&&(answer===null||!Number.isInteger(answer))){a.message='Skriv ladningen som et helt tall med fortegn, for eksempel +1 eller −1.';persist();renderApp();return;}
    const correct=d.electrons===target.electrons&&answer===e.atomicNumber-target.electrons;
    if(a.firstCorrect===null)a.firstCorrect=correct&&!reveal;
    if(reveal){a.revealed=true;a.helpUsed=true;a.outcome='revealed';a.message=`${e.atomicNumber} protoner og ${target.electrons} elektroner gir ladning ${chargeText(e.atomicNumber-target.electrons)}. Protonene er uendret.`;}
    else if(!correct){a.incorrectAttempts++;a.message='Sjekk både antallet elektroner og fortegnet på ladningen. Protonene skal være uendret.';persist();renderApp();return;}
    else {a.outcome='correct';a.message=`Modellen stemmer. ${e.atomicNumber} protoner og ${d.electrons} elektroner gir ladning ${chargeText(e.atomicNumber-d.electrons)}.`;}
    a.finalized=true;progress=recordEncounter(progress,makeEncounter(a,progress.labSessionId,'ion.formation','ion'));persist();renderApp();
  }
  export function chargeText(n:number):string{return n>0?'+'+n:n<0?'−'+Math.abs(n):'0';}
  export function renderAtomLab():HTMLElement {
    const d=progress.atom,e=elementBySymbol[d.symbol],challenge=!!d.ionTarget,done=d.attempt.finalized;
    const page=h('div',{class:'atom-lab'},h('div',{class:'lab-introduction'},h('h2',{},'Elektronene endrer ladningen.'),h('p',{class:'muted'},'Kjernen blir stående. I denne modellen flytter du bare elektroner.')));
    page.append(h('div',{class:'atom-mode-bar'},btn('Fri utforsking',()=>beginIon(null),'button '+(!challenge?'primary':'secondary'),{'aria-pressed':!challenge}),makeSelect('Ion-utfordring',d.ionTarget||'',[{id:'',text:'Velg en utfordring'},...Object.entries(ionTargets).map(([id,t])=>({id,text:t.name}))],id=>beginIon(id||null))));
    const model=h('section',{class:'panel atom-workspace'},h('div',{class:'workbench-heading'},h('div',{},h('h2',{},challenge?ionTargets[d.ionTarget!].name:titleCase(e.name)),h('p',{class:'small muted'},'Atomnummer '+e.atomicNumber+' · Gruppe '+e.group+' · Periode '+e.period)),h('span',{class:'element-large'},e.symbol)),atomDiagram(e.symbol,d.electrons,!challenge||d.showCounts||done),h('div',{class:'electron-controls'},btn([icon('minus'), 'Ta bort elektron'],()=>{d.electrons--;persist();renderApp()},'button secondary',{disabled:(challenge&&done)||d.electrons<=0}),btn([icon('plus'),'Legg til elektron'],()=>{d.electrons++;persist();renderApp()},'button secondary',{disabled:(challenge&&done)||d.electrons>=20})),h('p',{class:'diagram-caption'},'Forenklet skallmodell for grunnstoff 1–20, ikke virkelige elektronbaner.'));
    const info=h('aside',{class:'panel atom-info'},h('h3',{},challenge?'Bygg ionet og finn ladningen':'Hold styr på ladningene'));
    if(!challenge||d.showCounts||done)info.append(h('div',{class:'atom-counts'},h('div',{},h('span',{},'Protoner'),h('strong',{},e.atomicNumber)),h('div',{},h('span',{},'Elektroner'),h('strong',{},d.electrons)),h('div',{},h('span',{},'Nettoladning'),h('strong',{},chargeText(e.atomicNumber-d.electrons)))));
    if(challenge){
      info.append(labeledInput('Ladningen til ionet du har bygd',d.charge,v=>{d.charge=v;persist()},{id:'ion-charge',inputmode:'text',placeholder:'Skriv et helt tall med fortegn',disabled:done,'data-focus':'ion-charge'}));
      if(d.attempt.message)info.append(feedback(d.attempt.message,d.attempt.outcome==='correct'?'success':'hint'));
      if(!done){info.append(btn(['Sjekk ionet',icon('check',17)],()=>checkIon(false),'button primary full'),btn('Hint',()=>{d.attempt.helpUsed=true;d.attempt.message=ionTargets[d.ionTarget!].hint;persist();renderApp()},'aid-button'),btn('Vis antall og beregnet ladning',()=>{d.attempt.helpUsed=true;d.showCounts=true;persist();renderApp()},'aid-button'),btn('Hopp over og vis forklaring',()=>checkIon(true),'quiet-button'));}
      else info.append(btn('Prøv ionet på nytt',()=>beginIon(d.ionTarget),'button primary full'));
    }else info.append(h('p',{},'Et ekstra elektron gjør ladningen mer negativ. Når du tar bort et elektron, blir ladningen mer positiv.'),h('p',{class:'note small'},'Fri utforsking viser ladningsregnskap. Det betyr ikke at alle ionene du kan tegne er kjemisk stabile.'),btn('Tilbake til nøytralt atom',()=>{d.electrons=e.atomicNumber;persist();renderApp()},'button secondary full'));
    info.append(sourceFooter(['F1','F2','N1','N3'],['C03','C04','C14']));page.append(h('div',{class:'atom-layout'},model,info));
    if(!challenge)page.append(h('section',{class:'panel periodic-panel'},h('h3',{},'Velg et grunnstoff'),periodicTable(e.symbol,symbol=>{d.symbol=symbol;d.electrons=elementBySymbol[symbol].atomicNumber;persist();renderApp()})));
    return page;
  }
  const polarityConfig:Record<string,{fields:Option[];charges:Record<string,string>;polarity:string;explanation:string;hint:string}>={
    water:{fields:[{id:'O',text:'Oksygenatomet'},{id:'H',text:'Hydrogenatomene'}],charges:{O:'minus',H:'plus'},polarity:'polar',explanation:'Oksygen trekker sterkere på bindingselektronene. Vannmolekylet er vinklet, så bindingsdipolene opphever ikke hverandre. Vann er polart, men det nøytrale molekylet har nettoladning null.',hint:'Se på trekkraften til oksygen og hydrogen, og legg merke til vinkelen i molekylet.'},
    'carbon-dioxide':{fields:[{id:'C',text:'Karbonatomet'},{id:'O',text:'Oksygenatomene'}],charges:{C:'plus',O:'minus'},polarity:'nonpolar',explanation:'C–O-bindingene er polare, men CO₂ er lineært og symmetrisk. De like store bindingsdipolene trekker i motsatte retninger og opphever hverandre. Hele molekylet er upolart.',hint:'To polare bindinger kan trekke like mye i motsatt retning. Se på formen, ikke bare bindingene.'},
    methane:{fields:[{id:'C',text:'Karbonatomet i kursets EN-modell'},{id:'H',text:'Hydrogenatomene i kursets EN-modell'}],charges:{C:'none',H:'none'},polarity:'nonpolar',explanation:'Med de avrundede kurstallene er EN-forskjellen i C–H under 0,5. Bindingene regnes som upolare i skolemodellen. Metan har tetraederform og er et upolart molekyl.',hint:'Bruk den merkede skolemodellen: C har EN 2,5 og H har EN 2,1. Formen er et tetraeder.'},
    ammonia:{fields:[{id:'N',text:'Nitrogenatomet'},{id:'H',text:'Hydrogenatomene'}],charges:{N:'minus',H:'plus'},polarity:'polar',explanation:'Nitrogen trekker sterkere på bindingselektronene enn hydrogen. Pyramideformen gjør at dipolene ikke opphever hverandre. Ammoniakk er polart.',hint:'Nitrogen trekker sterkere enn hydrogen. Tenk på forskjellen mellom en flat, symmetrisk tegning og den viste pyramideformen.'},
    'hydrogen-chloride':{fields:[{id:'H',text:'Hydrogenatomet'},{id:'Cl',text:'Kloratomet'}],charges:{H:'plus',Cl:'minus'},polarity:'polar',explanation:'Klor trekker sterkere på bindingselektronene enn hydrogen. Den ene bindingsdipolen kan ikke oppheves av en annen i dette toatomige molekylet. HCl er polart.',hint:'Hvilket atom har størst elektronegativitet? Her er det bare én binding.'}
  };
  export function renderPolarityLab():HTMLElement {
    const id=labUI.polarityId,c=polarityConfig[id];
    const page=h('div',{},h('div',{class:'lab-introduction'},h('h2',{},'Formen avgjør helheten.'),h('p',{class:'muted'},'Gi atomene delvise ladninger, vurder hele molekylet og sammenlign dipolene.')));
    const workspace=h('div',{class:'polarity-layout panel'},h('div',{class:'polarity-scene'},makeSelect('Molekyl',id,Object.keys(polarityConfig).map(id=>({id,text:titleCase(moleculeById[id].name)+' · '+fmtFormula(moleculeById[id].formula)})),value=>{labUI.polarityId=value;labUI.charges={};labUI.polarityAnswer='';labUI.polarityTried=false;labUI.polarityCorrect=false;labUI.polarityReveal=false;labUI.polarityMessage='';renderApp()}),geometryDiagram(id,labUI.polarityReveal),id==='methane'?h('p',{class:'note small'},'Her bruker vi kursets EN-modell. C har 2,5 og H har 2,1. Grensene er en skoleforenkling.'):null),h('div',{class:'polarity-inputs'},h('h3',{},'Din vurdering'),c.fields.map(field=>makeSelect(field.text,labUI.charges[field.id]||'',[{id:'plus',text:'δ+ (delvis positiv)'},{id:'minus',text:'δ− (delvis negativ)'},{id:'none',text:'Ingen i denne skolemodellen'}],value=>{labUI.charges[field.id]=value},true)),makeSelect('Hele molekylet',labUI.polarityAnswer,[{id:'polar',text:'Polart'},{id:'nonpolar',text:'Upolart'}],value=>{labUI.polarityAnswer=value},true),btn(['Sjekk vurderingen',icon('check',17)],()=>{labUI.polarityTried=true;if(!labUI.polarityAnswer||c.fields.some(f=>!labUI.charges[f.id])){labUI.polarityMessage='Velg ladninger og en vurdering av hele molekylet.';}else{labUI.polarityCorrect=labUI.polarityAnswer===c.polarity&&c.fields.every(f=>labUI.charges[f.id]===c.charges[f.id]);labUI.polarityMessage=labUI.polarityCorrect?'Ladningene og vurderingen av hele molekylet stemmer. Sammenlign gjerne dipolene.':'Sjekk både trekkraften og formen. Prøv igjen, eller åpne et hint.';}renderApp()},'button primary full'),labUI.polarityMessage?feedback(labUI.polarityMessage,labUI.polarityCorrect?'success':'hint'):null,btn('Hint',()=>{labUI.polarityMessage=c.hint;renderApp()},'aid-button'),labUI.polarityTried||labUI.polarityCorrect?btn('Vis dipoler og forklaring',()=>{labUI.polarityReveal=true;renderApp()},'aid-button'):null));
    page.append(workspace);if(labUI.polarityReveal)page.append(h('div',{class:'explanation panel'},h('h3',{},'Se bindingene samlet'),h('p',{},c.explanation),sourceFooter(['F1','F2','N2','N8','O5'],['C05','C12'])));
    page.append(h('section',{class:'panel boiling-section'},h('div',{class:'workbench-heading'},h('div',{},h('h2',{},'Hva skjer når vann koker?'),h('p',{class:'muted small'},'Sammenlign avstanden mellom hele molekyler.')),btn(labUI.boiling?'Vis væske igjen':'Vis koking',()=>{labUI.boiling=!labUI.boiling;renderApp()},'button secondary')),boilingDiagram(labUI.boiling),sourceFooter(['F2','N6','N7','O4'],['C13'])),h('p',{class:'small muted'},'Disse modellene er utforsking, ikke automatisk bevis på en ferdighet. Bruk Øv for å registrere selvstendige svar.'));
    return page;
  }
  function mixtureModel():HTMLElement {
    const oil=labUI.mixture==='oil',shown=labUI.mixShown;
    const s=svg('svg',{viewBox:'0 0 440 275',role:'img','aria-label':shown?(oil?'En modell viser olje i et øvre lag og vann i et nedre lag.':'En modell viser vann og etanol jevnt blandet.'):'To separate felt viser vann og det valgte stoffet før vurderingen.'});
    s.append(svg('path',{d:'M88 35V233Q88 245 100 245H340Q352 245 352 233V35',class:'beaker'}));
    if(shown&&!oil){s.append(svg('rect',{x:92,y:85,width:256,height:155,rx:5,class:'water-fill'}),svg('text',{x:220,y:163,'text-anchor':'middle',class:'svg-oil'},'Vann og etanol'));}
    else {s.append(svg('rect',{x:92,y:shown?151:160,width:256,height:shown?89:80,rx:4,class:'water-fill'}),svg('rect',{x:92,y:70,width:256,height:shown?81:65,rx:4,class:oil?'oil-fill':'ethanol-fill'}),svg('text',{x:220,y:109,'text-anchor':'middle',class:'svg-oil'},oil?'Matolje':'Etanol'),svg('text',{x:220,y:200,'text-anchor':'middle',class:'svg-oil'},'Vann'));}
    return h('div',{class:'mixture-model'},s,h('p',{class:'diagram-caption'},shown?'Kvalitativ modell, ikke en måling eller et forsøk.':'Forutsi resultatet før modellen viser hva som skjer.'));
  }
  export function renderSoapLab():HTMLElement {
    const page=h('div',{},h('div',{class:'lab-introduction'},h('h2',{},'Hvorfor vil ikke alt blande seg?'),h('p',{class:'muted'},'Prøv «likt løser likt», og finn ut hva såpehodene og halene gjør.')));
    page.append(h('section',{class:'panel mix-layout'},h('div',{},makeSelect('Stoffer i modellen',labUI.mixture,[{id:'oil',text:'Vann og matolje'},{id:'ethanol',text:'Vann og etanol'}],v=>{labUI.mixture=v;labUI.mixAnswer='';labUI.mixShown=false;labUI.mixMessage='';renderApp()}),mixtureModel()),h('div',{class:'mix-prediction'},h('h3',{},'Hva forventer du?'),makeSelect('Hvordan oppfører blandingen seg?',labUI.mixAnswer,[{id:'layers',text:'Stoffene danner separate lag'},{id:'mixed',text:'Stoffene blandes godt'}],v=>{labUI.mixAnswer=v},true),btn(['Sjekk forutsigelsen',icon('check',17)],()=>{if(!labUI.mixAnswer)labUI.mixMessage='Velg en forutsigelse først.';else if(labUI.mixAnswer===(labUI.mixture==='oil'?'layers':'mixed')){labUI.mixShown=true;labUI.mixMessage=labUI.mixture==='oil'?'Vann er polart. Oljen har store upolare deler, og stoffene blandes dårlig.':'Etanol har en OH-gruppe som kan danne hydrogenbindinger med vann. Den korte karbonkjeden hindrer ikke god blandbarhet.';}else labUI.mixMessage='Tenk på hvilke deler av molekylene som kan samvirke med vann. Prøv igjen, eller åpne modellen.';renderApp()},'button primary full'),labUI.mixMessage?feedback(labUI.mixMessage,labUI.mixShown?'success':'hint'):null,btn('Hopp over og vis modellen',()=>{labUI.mixShown=true;labUI.mixMessage=labUI.mixture==='oil'?'Vann og matolje danner separate lag. De store upolare delene i oljen samvirker dårlig med vann.':'Etanol og vann blandes godt. Etanolens OH-gruppe kan danne hydrogenbindinger med vann.';renderApp()},'aid-button'),h('p',{class:'small note'},'Matolje består hovedsakelig av triglyserider, ikke bare hydrokarboner eller frie fettsyrer.'),sourceFooter(['F3','F4','O7','O9'],['C08','C09']))));
    page.append(h('section',{class:'panel soap-layout'},h('div',{},h('h2',{},'Snu såpemolekylene.'),h('p',{class:'muted'},'Hvor skal det ladde hodet vende? Klikk på et såpemolekyl for å snu det.'),soapDiagram([],undefined,labUI.soapFlips,i=>{labUI.soapFlips[i]=!labUI.soapFlips[i];labUI.soapSolved=false;renderApp()}),h('p',{class:'diagram-caption'},'COO⁻ er det ladde såpehodet. Streken er hydrokarbonhalen. Dette er en forenklet micellemodell.')),h('div',{class:'soap-controls'},h('h3',{},'Olje i midten. Vann rundt.'),h('p',{},'Orienter hvert molekyl slik at det passer til omgivelsene på begge sider.'),h('div',{class:'soap-flip-buttons'},labUI.soapFlips.map((correct,i)=>btn('Snu '+(i+1),()=>{labUI.soapFlips[i]=!labUI.soapFlips[i];labUI.soapSolved=false;renderApp()},'button secondary',{'aria-label':`Snu såpemolekyl ${i+1}, hodet peker ${correct?'utover':'innover'}`}))),btn(['Sjekk retningene',icon('check',17)],()=>{labUI.soapSolved=labUI.soapFlips.every(Boolean);labUI.soapMessage=labUI.soapSolved?'Hodene vender mot vannet og halene inn mot oljen. Såpemolekylene kan samle olje i små dråper som holdes spredt i vannet.':'Noen molekyler peker motsatt vei. Hvilken ende passer best mot vannet?';renderApp()},'button primary full'),labUI.soapMessage?feedback(labUI.soapMessage,labUI.soapSolved?'success':'hint'):null,btn('Vis forklaringsmodellen',()=>{labUI.soapFlips=Array(8).fill(true);labUI.soapSolved=true;labUI.soapMessage='De ladde COO⁻-hodene samvirker med vann, særlig ved ion–dipol-krefter. De upolare halene vender inn mot oljen. Vannmolekylene har hydrogenbindinger seg imellom.';renderApp()},'aid-button'),h('p',{class:'small source-note'},'Merket tillegg til lærerens avsluttende såpespørsmål. Et såpehode i denne modellen er COO⁻, ikke den nøytrale syregruppen COOH.'),sourceFooter(['F4','O10','N3','N6'],['C16']))));
    return page;
  }
}
