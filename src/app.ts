namespace KL {
  export let progress:Progress;
  export let storageWarning='';
  let browserStorage:StorageLike|null=null;
  let renderedRoute='';
  let savedSuccessfully=false;
  export function currentRoute():string{return typeof location==='undefined'?'start':(location.hash.replace(/^#\/?/,'')||'start');}
  export function persist():void {
    progress.savedAt=Date.now();const result=writeStorage(browserStorage,progress);savedSuccessfully=result.ok;
    storageWarning=result.ok?'':result.message;
    const status=document.querySelector<HTMLElement>('[data-save-status]');if(status)status.textContent=result.ok?'Lagret lokalt':'Lagring utilgjengelig';
  }
  export function navigate(route:string,skipGuard=false):void {
    if(!skipGuard&&/^(lesson\/|sources|teacher|collection|lab\/|periodic)/.test(route)&&route!==currentRoute())if(!requestHelp())return;
    if(currentRoute()===route){renderApp(true);return;}location.hash=route;
  }
  function navItem(name:string,title:string,path:string,active:boolean,mobile=false):HTMLElement {
    const item=link([icon(name,mobile?21:19),h('span',{class:'nav-text'},title)],path,(mobile?'bottom-nav-link':'nav-link')+(active?' active':''));if(active)item.setAttribute('aria-current','page');return item;
  }
  export function playSound():void {
    if(!progress.settings.sound)return;
    try{const Ctx=window.AudioContext;if(!Ctx)return;const context=new Ctx(),osc=context.createOscillator(),gain=context.createGain();osc.connect(gain);gain.connect(context.destination);osc.type='sine';osc.frequency.setValueAtTime(660,context.currentTime);gain.gain.setValueAtTime(.035,context.currentTime);gain.gain.exponentialRampToValueAtTime(.0001,context.currentTime+.12);osc.start();osc.stop(context.currentTime+.13);osc.onended=()=>{void context.close()};}catch{}
  }
  export function renderApp(focusMain=false):void {
    const app=document.getElementById('app');if(!app)return;
    const active=document.activeElement as HTMLInputElement|null,focusKey=active?.getAttribute('data-focus'),selection=active&&('selectionStart' in active)?{start:active.selectionStart,end:active.selectionEnd}:null;
    const scrollY=window.scrollY,scrollX=window.scrollX,route=currentRoute(),routeChanged=renderedRoute!==route;
    const panelScrolls=Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-key]')).map(el=>({key:el.dataset.scrollKey!,left:el.scrollLeft,top:el.scrollTop}));
    if(renderedRoute==='periodic/drill'&&route!==renderedRoute&&progress.periodic?.active&&!progress.periodic.active.finished&&!progress.periodic.active.current.finished){progress.periodic=markPeriodicHelp(progress.periodic);persist();}
    const dark=progress.settings.theme==='dark'||(progress.settings.theme==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.dataset.motion=progress.settings.motion;
    const isHome=route==='start',isStudy=route.startsWith('ov')||route.startsWith('lesson'),isLab=route.startsWith('lab')||route==='collection',isProgress=route==='progress';
    const primary=(mobile=false)=>[navItem('home','Start','start',isHome,mobile),navItem('practice','Øv','ov',isStudy,mobile),navItem('collection',mobile?'Pugg':'Periodesystemet','periodic',route.startsWith('periodic'),mobile),navItem('lab','Laboratorium','lab/molecule',isLab,mobile),navItem('progress','Fremgang','progress',isProgress,mobile)];
    const brand=link([h('span',{class:'brand-symbol'},icon('lab',22)),h('span',{},'Kjemilab')],'start','brand');
    const rail=h('aside',{class:'rail'},brand,h('nav',{'aria-label':'Hovedmeny'},primary()),h('div',{class:'rail-secondary'},navItem('book','Lærerens spørsmål','teacher',route==='teacher'),navItem('book','Kilder','sources',route==='sources'),navItem('settings','Innstillinger','settings',route==='settings')),h('div',{class:'rail-foot'},h('span',{class:'little-orbit'},icon('atom',18)),h('div',{},h('span',{},'Naturfag Vg1'),h('small',{},'Ett lite steg av gangen.'))));
    const header=h('header',{class:'topbar'},h('div',{class:'topbar-course'},h('span',{class:'course-kicker'},'Naturfag Vg1'),h('span',{},'Atomer, bindinger og karbonforbindelser')),h('div',{class:'mobile-brand'},'Kjemilab'),h('div',{class:'topbar-actions'},btn([h('i',{class:'save-dot'+(storageWarning?' warning':'')}),h('span',{'data-save-status':''},storageWarning?'Lagring utilgjengelig':savedSuccessfully?'Lagret lokalt':'Lokal fremgang')],()=>navigate('settings'),'storage-indicator',{'aria-label':'Lagring og innstillinger'}),link(icon('settings',19),'settings','icon-button mobile-settings')));
    const main=h('main',{id:'main-content',class:'main-content',tabIndex:-1});
    try{
      let content:HTMLElement;
      if(route==='ov')content=renderPracticeSetup();
      else if(route==='ov/session')content=renderSession();
      else if(route.startsWith('lesson/'))content=renderLesson(route.split('/')[1]);
      else if(route.startsWith('lab'))content=renderLab(route.split('/')[1]||'molecule');
      else if(route.startsWith('periodic'))content=renderPeriodic();
      else if(route==='teacher')content=renderTeacher();
      else if(route==='progress')content=renderProgress();
      else if(route==='collection')content=renderCollection();
      else if(route==='sources')content=renderSources();
      else if(route==='settings')content=renderSettings();
      else content=renderHome();
      if(storageWarning)main.append(h('aside',{class:'storage-notice',role:'status'},h('span',{},storageWarning),btn('Eksporter fremgang',()=>downloadJson(progress,'kjemilab-fremgang.json'),'quiet-button')));
      main.append(content);
    }catch(error){console.error(error);main.append(h('section',{class:'panel error-panel'},h('h1',{},'Noe stoppet på denne siden.'),h('p',{},'Fremgangen er fortsatt i minnet. Eksporter en kopi før du laster siden på nytt.'),btn('Eksporter fremgang',()=>downloadJson(progress,'kjemilab-fremgang.json'),'button primary'),link('Til start','start','button secondary')));}
    app.replaceChildren(h('a',{href:'#main-content',class:'skip-link',onclick:(e:Event)=>{e.preventDefault();document.getElementById('main-content')?.focus()}},'Hopp til innhold'),rail,h('div',{class:'workspace'},header,main),h('nav',{class:'bottom-nav','aria-label':'Mobilmeny'},primary(true)));
    document.title=(main.querySelector('h1')?.textContent||'Laboratorium')+' · Kjemilab';
    if(!routeChanged&&!focusMain)for(const scroll of panelScrolls){const el=document.querySelector<HTMLElement>('[data-scroll-key="'+CSS.escape(scroll.key)+'"]');if(el){el.scrollLeft=scroll.left;el.scrollTop=scroll.top;}}
    if(focusMain||routeChanged){window.scrollTo(0,0);main.focus({preventScroll:true});}
    else {
      if(focusKey){const next=document.querySelector<HTMLElement>('[data-focus="'+CSS.escape(focusKey)+'"]');next?.focus({preventScroll:true});if(selection&&next instanceof HTMLInputElement&&selection.start!==null){try{next.setSelectionRange(selection.start,selection.end)}catch{}}}
      window.scrollTo(scrollX,scrollY);
    }
    renderedRoute=route;
  }
  export function boot():void {
    try{browserStorage=window.localStorage}catch{browserStorage=null;}
    const loaded=readStorage(browserStorage);progress=loaded.state;storageWarning=loaded.warning;
    window.addEventListener('hashchange',()=>renderApp(true));window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(progress.settings.theme==='system')renderApp()});
    // Escape and Tab work natively in dialogs; shortcut keys never replace keyboard controls.
    renderApp();
  }
}
declare const module: {exports:unknown};
if (typeof module !== 'undefined') module.exports=KL;
if (typeof document !== 'undefined') {if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',KL.boot);else KL.boot();}
