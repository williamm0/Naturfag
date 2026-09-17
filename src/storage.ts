namespace KL {
  export interface StorageLike {getItem(key:string):string|null;setItem(key:string,value:string):void}
  const STORAGE='kjemilab.progress.v1',BACKUP='kjemilab.progress.backup';
  export const MAX_IMPORT=2*1024*1024;
  export function validItem(id:unknown):id is string{return typeof id==='string'&&(!!questionById[id]||(id.startsWith('build:')&&targets.some(m=>m.id===id.slice(6)))||['ion:Na+','ion:Cl-','ion:Mg2+','ion:O2-','ion:Li+','ion:F-'].includes(id));}
  export function validateState(input:unknown):{ok:boolean;message:string} {
    const fail=(message:string)=>({ok:false,message});
    const obj=(x:unknown):x is Record<string,any>=>!!x&&typeof x==='object'&&!Array.isArray(x);
    const finite=(x:unknown):x is number=>typeof x==='number'&&Number.isFinite(x);
    const time=(x:unknown)=>finite(x)&&x>=0&&x<8640000000000000;
    const num=(x:unknown,max=1e9)=>finite(x)&&x>=0&&x<=max&&Number.isInteger(x);
    if(!obj(input)||input.schemaVersion!==1)return fail('Denne filen har ikke en støttet versjon av Kjemilab-fremgang.');
    const p=input;
    if(!time(p.savedAt)||!num(p.points))return fail('Filen inneholder ugyldige tall eller tidspunkter.');
    if(!obj(p.settings)||!['dark','light','system'].includes(p.settings.theme)||!['system','reduced'].includes(p.settings.motion)||typeof p.settings.sound!=='boolean'||![8,12,20].includes(p.settings.questionCount))return fail('Innstillingene i filen er ugyldige.');
    for(const name of ['skills','items','repairs','awarded','collection','teacher'])if(!obj(p[name]))return fail('Filen mangler '+name+'.');
    if(!Array.isArray(p.encounters)||p.encounters.length>500||!Array.isArray(p.visited)||p.visited.length>30||p.visited.some((id:unknown)=>typeof id!=='string'||!skillById[id])||typeof p.labSessionId!=='string'||p.labSessionId.length>120)return fail('Fremgangsloggen er ugyldig.');
    const after=(x:unknown):boolean=>Array.isArray(x)&&x.length<=2&&x.every(validItem);
    for(const [id,s] of Object.entries(p.skills) as [string,any][]){
      if(!skillById[id]||!obj(s)||!Array.isArray(s.clean)||s.clean.length>40||!num(s.reviewLevel,5)||!(s.dueAt===null||time(s.dueAt))||!num(s.attempts)||!num(s.independent)||typeof s.everReady!=='boolean'||typeof s.everRetained!=='boolean'||!(s.lastIndependentAt===null||time(s.lastIndependentAt)))return fail('En ferdighet i filen er ugyldig.');
      for(const e of s.clean)if(!obj(e)||!validItem(e.itemId)||!time(e.at)||typeof e.delayed!=='boolean'||!['choice','recall','fields','order','categorize','select_parts','builder','ion'].includes(e.kind))return fail('Ferdighetsbevisene er ugyldige.');
    }
    const validEvent=(e:any):boolean=>obj(e)&&typeof e.id==='string'&&e.id.length<160&&typeof e.sessionId==='string'&&e.sessionId.length<160&&validItem(e.itemId)&&!!skillById[e.skillId]&&time(e.at)&&typeof e.firstCorrect==='boolean'&&num(e.incorrectAttempts,10000)&&typeof e.helpUsed==='boolean'&&typeof e.revealed==='boolean'&&['correct','revealed','unknown','self'].includes(e.outcome)&&['choice','recall','fields','order','categorize','select_parts','builder','ion'].includes(e.kind)&&(e.independent===undefined||typeof e.independent==='boolean')&&(e.eligible===undefined||typeof e.eligible==='boolean')&&(e.points===undefined||[0,5,10].includes(e.points));
    if(p.encounters.some((e:any)=>!validEvent(e)))return fail('Filen peker til en ukjent eller ugyldig oppgave.');
    for(const [id,x] of Object.entries(p.items) as [string,any][])if(!validItem(id)||!obj(x)||!time(x.at)||!after(x.afterIds))return fail('En oppgavereferanse er ugyldig.');
    for(const [id,x] of Object.entries(p.repairs) as [string,any][])if(!skillById[id]||!obj(x)||!validItem(x.itemId)||!time(x.at)||!after(x.afterIds))return fail('Repetisjonskøen er ugyldig.');
    if(Object.keys(p.awarded).length>60||Object.values(p.awarded).some(x=>!Array.isArray(x)||x.length>160||!x.every(validItem)))return fail('Poengloggen er ugyldig.');
    for(const [id,c] of Object.entries(p.collection) as [string,any][])if(!targets.some(m=>m.id===id)||!obj(c)||!time(c.at)||typeof c.assisted!=='boolean'||typeof c.independent!=='boolean')return fail('Molekylsamlingen er ugyldig.');
    const teacherIds=[...teacherData.tasks,...teacherData.buildingReflections].map(t=>t.id);
    for(const [id,t] of Object.entries(p.teacher) as [string,any][])if(!teacherIds.includes(id)||!obj(t)||typeof t.text!=='string'||t.text.length>12000||!Array.isArray(t.checked)||t.checked.length>30||t.checked.some((x:any)=>typeof x!=='boolean')||typeof t.compared!=='boolean'||typeof t.showAnswer!=='boolean'||typeof t.selfDone!=='boolean')return fail('En egenvurdering er ugyldig.');
    const validAnswer=(a:any):boolean=>typeof a==='string'?a.length<=5000:Array.isArray(a)?a.length<=80&&a.every(x=>typeof x==='string'&&x.length<200):obj(a)&&Object.keys(a).length<=80&&Object.values(a).every(x=>(typeof x==='string'&&x.length<=5000)||finite(x));
    const validAttempt=(a:any):boolean=>obj(a)&&validItem(a.itemId)&&typeof a.id==='string'&&a.id.length<160&&validAnswer(a.answer)&&Array.isArray(a.order)&&a.order.length<=80&&a.order.every((x:any)=>typeof x==='string'&&x.length<160)&&(a.firstCorrect===null||typeof a.firstCorrect==='boolean')&&num(a.incorrectAttempts,10000)&&typeof a.helpUsed==='boolean'&&typeof a.revealed==='boolean'&&num(a.hints,2)&&[null,'correct','revealed','unknown','self'].includes(a.outcome)&&typeof a.message==='string'&&a.message.length<5000&&[null,'correct','incorrect','invalid_format','needs_self_check'].includes(a.grade)&&typeof a.finalized==='boolean'&&typeof a.showLesson==='boolean';
    if(p.session!==null){const s=p.session;
      if(!obj(s)||typeof s.id!=='string'||s.id.length>160||!['adaptive','topic','repair','exam','diagnostic','bank'].includes(s.mode)||!num(s.budget,20)||s.budget<1||!num(s.index,20)||!(s.filter===null||!!skillById[s.filter]||!!moduleById[s.filter])||!Array.isArray(s.plannedIds)||s.plannedIds.length>20||s.plannedIds.some((id:any)=>!questionById[id])||!Array.isArray(s.results)||s.results.length>20||s.results.some((e:any)=>!validEvent(e))||!(s.current===null||validAttempt(s.current))||typeof s.finished!=='boolean'||!time(s.startedAt)||!num(s.seed,0xffffffff)||!Array.isArray(s.seenSkillLessons)||s.seenSkillLessons.length>30||s.seenSkillLessons.some((id:any)=>!skillById[id])||typeof s.endReason!=='string'||!obj(s.examAnswers)||Object.entries(s.examAnswers).some(([id,a])=>!questionById[id]||!validAnswer(a)))return fail('Den lagrede økten er ugyldig.');
    }
    const validGraph=(g:any):boolean=>obj(g)&&Array.isArray(g.atoms)&&g.atoms.length<=80&&Array.isArray(g.bonds)&&g.bonds.length<=100&&g.atoms.every((a:any)=>obj(a)&&typeof a.id==='string'&&a.id.length<100&&['C','H','O','N','Cl','F'].includes(a.element)&&(a.x===undefined||(finite(a.x)&&Math.abs(a.x)<1e5))&&(a.y===undefined||(finite(a.y)&&Math.abs(a.y)<1e5)))&&new Set(g.atoms.map((a:any)=>a.id)).size===g.atoms.length&&g.bonds.every((b:any)=>obj(b)&&typeof b.a==='string'&&typeof b.b==='string'&&b.a!==b.b&&[1,2,3].includes(b.order)&&g.atoms.some((a:any)=>a.id===b.a)&&g.atoms.some((a:any)=>a.id===b.b));
    const b=p.builder;
    if(!obj(b)||!targets.some(m=>m.id===b.targetId)||!validGraph(b.graph)||!Array.isArray(b.past)||b.past.length>30||b.past.some((g:any)=>!validGraph(g))||!Array.isArray(b.future)||b.future.length>30||b.future.some((g:any)=>!validGraph(g))||!(b.selected===null||b.graph.atoms.some((a:any)=>a.id===b.selected))||![1,2,3].includes(b.bondOrder)||!finite(b.zoom)||b.zoom<0.5||b.zoom>2||!validAttempt(b.attempt)||typeof b.showFormula!=='boolean'||typeof b.showValences!=='boolean'||typeof b.showAnswer!=='boolean')return fail('Den lagrede molekylmodellen er ugyldig.');
    const a=p.atom;
    if(!obj(a)||!elementBySymbol[a.symbol]||!num(a.electrons,20)||!(a.ionTarget===null||['Na+','Cl-','Mg2+','O2-','Li+','F-'].includes(a.ionTarget))||typeof a.charge!=='string'||a.charge.length>100||typeof a.showCounts!=='boolean'||!validAttempt(a.attempt))return fail('Det lagrede atomverkstedet er ugyldig.');
    if(p.periodic!==undefined&&!validatePeriodicState(p.periodic))return fail('Puggedelen for periodesystemet inneholder ugyldig fremgang.');
    return {ok:true,message:''};
  }
  export function readStorage(storage:StorageLike|null,at=Date.now()):{state:Progress;warning:string;recovered:boolean} {
    const fresh=()=>({state:initialState(at),warning:'',recovered:false});
    if(!storage)return {...fresh(),warning:'Fremgangen kan ikke lagres i denne nettleseren akkurat nå.'};
    let raw:string|null=null;
    try{
      raw=storage.getItem(STORAGE);if(!raw)return fresh();
      if(raw.length<=MAX_IMPORT){try{const p=JSON.parse(raw);if(validateState(p).ok)return {state:p,warning:'',recovered:false};}catch{}}
      let retained=false;try{storage.setItem('kjemilab.progress.damaged',raw.slice(0,MAX_IMPORT));retained=true;}catch{}
      const backup=storage.getItem(BACKUP);
      if(backup&&backup.length<=MAX_IMPORT){const p=JSON.parse(backup);if(validateState(p).ok){try{storage.setItem('kjemilab.progress.damaged',raw.slice(0,MAX_IMPORT));}catch{}return {state:p,warning:'Fremgangen ble gjenopprettet fra siste gyldige sikkerhetskopi.',recovered:true};}}
      return {...fresh(),warning:'Den lagrede fremgangen kunne ikke leses. Eksporter det du gjør i denne økten.'};
    }catch{return {...fresh(),warning:'Fremgangen kan ikke lagres i denne nettleseren akkurat nå.'};}
  }
  export function writeStorage(storage:StorageLike|null,p:Progress):{ok:boolean;message:string} {
    if(!storage)return {ok:false,message:'Fremgangen kan ikke lagres i denne nettleseren akkurat nå.'};
    try{
      const raw=JSON.stringify(p);if(raw.length>MAX_IMPORT)throw new Error('too large');
      const prev=storage.getItem(STORAGE);
      if(prev&&prev.length<=MAX_IMPORT){try{if(validateState(JSON.parse(prev)).ok)storage.setItem(BACKUP,prev);}catch{}}
      storage.setItem(STORAGE,raw);return {ok:true,message:''};
    }catch{return {ok:false,message:'Fremgangen kan ikke lagres i denne nettleseren akkurat nå.'};}
  }
}
