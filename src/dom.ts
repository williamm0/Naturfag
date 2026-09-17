namespace KL {
  export type Child=Node|string|number|null|undefined|false;
  export function h<K extends keyof HTMLElementTagNameMap>(tag:K,attrs:Record<string,unknown>={},...children:(Child|Child[])[]):HTMLElementTagNameMap[K]{
    const node=document.createElement(tag);
    for(const [key,value] of Object.entries(attrs)){
      if(value===null||value===undefined||(value===false&&!key.startsWith('aria-')))continue;
      if(key==='class')node.className=String(value);
      else if(key==='text')node.textContent=String(value);
      else if(key.startsWith('on')&&typeof value==='function')node.addEventListener(key.slice(2),value as EventListener);
      else if(['value','checked','disabled','selected','open','tabIndex'].includes(key))(node as any)[key]=value;
      else node.setAttribute(key,key.startsWith('aria-')?String(value):value===true?'':String(value));
    }
    for(const child of children.flat()){if(child!==null&&child!==undefined&&child!==false)node.append(child instanceof Node?child:document.createTextNode(String(child)));}
    return node;
  }
  export function svg<K extends keyof SVGElementTagNameMap>(tag:K,attrs:Record<string,unknown>={},...children:(Child|Child[])[]):SVGElementTagNameMap[K]{
    const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
    for(const [key,val] of Object.entries(attrs)){if(val===undefined||val===null||(val===false&&!key.startsWith('aria-')))continue;if(key.startsWith('on')&&typeof val==='function')node.addEventListener(key.slice(2),val as EventListener);else node.setAttribute(key,String(val));}
    for(const child of children.flat()){if(child!==null&&child!==undefined&&child!==false)node.append(child instanceof Node?child:document.createTextNode(String(child)));}return node;
  }
  const paths:Record<string,string[]>={
    home:['M3 10 12 3l9 7','M5 9v12h5v-7h4v7h5V9'],
    practice:['M5 3h14v18H5z','m9 9 2 2 4-4','M9 16h6'],
    lab:['M9 3h6','M10 3v7L4 20q0 1 2 1h12q2 0 2-1l-6-10V3','M7 15h10'],
    progress:['M4 20V4','M4 20h17','m8 15 4-5 4 2 4-7'],
    book:['M12 5C8 3 4 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1v15'],
    settings:['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8','M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z'],
    arrow:['M5 12h14','m13 6 6 6-6 6'],chevron:['m9 5 7 7-7 7'],back:['M19 12H5','m11 6-6 6 6 6'],
    check:['m5 12 4 4L19 6'],close:['m6 6 12 12','M18 6 6 18'],plus:['M12 5v14','M5 12h14'],minus:['M5 12h14'],
    hint:['M9 18h6','M10 21h4','M8 14c-7-7 1-15 7-11 4 3 3 7 1 10l-1 3H9z'],
    undo:['M5 6v6h6','M5 12C8 2 23 8 19 17'],redo:['M19 6v6h-6','M19 12C16 2 1 8 5 17'],
    up:['m6 14 6-6 6 6'],down:['m6 10 6 6 6-6'],download:['M12 3v12','m7 10 5 5 5-5','M4 16v5h16v-5'],
    reset:['M4 6v6h6','M4 12a8 8 0 1 1 3 6'],external:['M14 3h7v7','m10 14 11-11','M10 3H3v18h18v-7'],
    clock:['M12 8v5l3 2','M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0'],search:['M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14','m15 15 6 6'],
    collection:['M4 4h6v6H4z','M14 4h6v6h-6z','M4 14h6v6H4z','M14 14h6v6h-6z'],trash:['M3 6h18','M8 6V3h8v3','m5 6 1 15h12l1-15','M10 10v7','M14 10v7'],
    atom:['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8','M12 2v3','M12 19v3','M2 12h3','M19 12h3','m5 5 2 2','m17 17 2 2','m5 19 2-2','m17 7 2-2']
  };
  export function icon(name:string,size=20):SVGSVGElement{return svg('svg',{width:size,height:size,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':1.7,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':true,class:'icon'},(paths[name]||paths.atom).map(d=>svg('path',{d})));}
  export function btn(label:Child|Child[],onClick:()=>void,className='button',attrs:Record<string,unknown>={}):HTMLButtonElement{return h('button',{type:'button',class:className,onclick:onClick,...attrs},Array.isArray(label)?label:[label]);}
  export function link(label:Child|Child[],route:string,className='text-link'):HTMLAnchorElement{return h('a',{href:'#'+route,class:className,onclick:(e:Event)=>{e.preventDefault();navigate(route)}},Array.isArray(label)?label:[label]);}
  export function fmtFormula(text:string):string{return text.replace(/[0-9]/g,n=>'₀₁₂₃₄₅₆₇₈₉'[Number(n)]);}
  export function badge(status:Status):HTMLElement{return h('span',{class:'status-badge '+status},h('span',{'aria-hidden':true,class:'status-shape'},status==='retained'?'✓':status==='ready'?'✓':status==='practicing'?'·':''),statusText[status]);}
  export function pageHead(title:string,subtitle:string,action?:Child):HTMLElement{return h('header',{class:'page-heading'},h('div',{},h('h1',{},title),h('p',{class:'muted'},subtitle)),action);}
  export function feedback(text:string,type='info'):HTMLElement{return h('div',{class:'feedback '+type,role:'status'},icon(type==='success'?'check':type==='hint'?'hint':'book',20),h('div',{},text));}
  export function titleCase(s:string):string{return s.charAt(0).toLocaleUpperCase('nb')+s.slice(1);}
  export function dueText(at:number|null):string{
    if(at===null)return 'Ikke planlagt ennå';
    if(at<=Date.now())return 'Klar for repetisjon';
    return new Intl.DateTimeFormat('nb-NO',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(at);
  }
  export function openDialog(title:string,content:Child|Child[]):HTMLDialogElement{
    const dialog=h('dialog',{'aria-label':title,class:'dialog'});const previous=document.activeElement as HTMLElement|null;
    const close=()=>dialog.close();dialog.append(h('div',{class:'dialog-head'},h('h2',{},title),btn(icon('close'),close,'icon-button',{'aria-label':'Lukk'})),h('div',{class:'dialog-content'},content));
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
    dialog.addEventListener('close',()=>{dialog.remove();previous?.focus();});document.body.append(dialog);dialog.showModal();return dialog;
  }
  export function sourceContent(ids:string[]):HTMLElement {
    return h('div',{class:'source-list'},ids.filter(id=>sourceById[id]&&sourceById[id].kind!=='technical').map(id=>{
      const s=sourceById[id],remote=s.location.startsWith('https://');
      return h('div',{class:'source-entry'},h('div',{class:'source-title'},h('span',{class:'source-id'},id),h('strong',{},s.title)),h('p',{class:'muted small'},s.kind==='supplement'?'Tillegg og faglig presisering':s.kind==='ndla'?'NDLA, referanse':'Fra undervisningsmaterialet'),remote?h('a',{href:s.location,target:'_blank',rel:'noopener noreferrer',class:'text-link'},'Åpne kilden',icon('external',15)):h('p',{class:'small filename'},s.location),['N5','N8'].includes(id)?h('p',{class:'small muted'},'Lenke til originaloppgaven. H5P-oppgavebanken er ikke importert eller gjengitt.'):null);
    }),h('p',{class:'small muted'},'Øvingsspørsmålene og eksempelsvarene er skrevet for Kjemilab. Kildene viser det faglige grunnlaget, ikke at kilden inneholdt akkurat denne oppgaven.'));
  }
  export function showSources(ids:string[]):void {if(!requestHelp())return;openDialog('Kilder til dette innholdet',sourceContent(ids));}
  export function sourceButton(ids:string[]):HTMLElement{return btn([icon('book',15),'Kilder'],()=>showSources(ids),'quiet-button');}
  export function clarificationButton(ids:string[]):Child {
    if(!ids.length)return null;
    return btn('Faglig presisering',()=>{if(!requestHelp())return;openDialog('Faglige presiseringer',ids.map(id=>{const c=clarificationById[id];return h('section',{class:'clarification'},h('h3',{},c.title),h('p',{class:'small muted'},c.sourceLocation.replace('slide','lysbilde')),h('p',{},c.issue),h('p',{class:'note'},c.teachingDecision),sourceContent(c.sourceRefs));}));},'quiet-button');
  }
  export function sourceFooter(ids:string[],clarifications:string[]=[]):HTMLElement{return h('div',{class:'source-footer'},sourceButton(ids),clarificationButton(clarifications));}
  export function labeledInput(label:string,value:string,onInput:(value:string)=>void,attrs:Record<string,unknown>={}):HTMLElement {
    const id=String(attrs.id||'input-'+hash(label));return h('label',{class:'field',for:id},h('span',{},label),h('input',{id,value,autocomplete:'off',oninput:(e:Event)=>onInput((e.target as HTMLInputElement).value),...attrs}));
  }
  export function makeSelect(label:string,value:string,options:Option[],onChange:(value:string)=>void,includeEmpty=false,attrs:Record<string,unknown>={}):HTMLElement{
    const id=String(attrs.id||'select-'+hash(label));return h('label',{class:'field',for:id},h('span',{},label),h('select',{id,value,'aria-label':label,'data-focus':id,onchange:(e:Event)=>onChange((e.target as HTMLSelectElement).value),...attrs},includeEmpty?h('option',{value:'',selected:value===''},'Velg …'):null,options.map(o=>h('option',{value:o.id,selected:value===o.id},o.text))));
  }
  export function downloadJson(data:unknown,filename:string):void {
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=h('a',{href:url,download:filename});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
}
