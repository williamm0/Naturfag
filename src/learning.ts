namespace KL {
  export function hash(text:string):number {let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  export function shuffle<T>(items:T[],seed:number):T[] {
    const a=items.slice();let x=seed>>>0;
    const random=()=>{x+=0x6D2B79F5;let z=x;z=Math.imul(z^(z>>>15),z|1);z^=z+Math.imul(z^(z>>>7),z|61);return ((z^(z>>>14))>>>0)/4294967296;};
    for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;
  }
  export function emptySkill():SkillState{return {clean:[],reviewLevel:0,dueAt:null,attempts:0,independent:0,everReady:false,everRetained:false,lastIndependentAt:null};}
  export function skillStatus(s?:SkillState):Status {
    if(!s||!s.attempts)return 'new';
    const diverse=s.clean.length>=3&&new Set(s.clean.map(e=>e.itemId)).size>=2&&new Set(s.clean.map(e=>e.kind)).size>=2&&s.clean.some(e=>e.kind!=='choice');
    if(!diverse)return 'practicing';return s.clean.some(e=>e.delayed)?'retained':'ready';
  }
  export function blankAttempt(itemId:string,id:string):Attempt {
    const q=questionById[itemId];const order=shuffle((q?.inputSpec.options||q?.inputSpec.items||[]).map(o=>o.id),hash(id));
    const answer:Answer=q?.kind==='order'?order.slice():q?.kind==='select_parts'?[]:['fields','categorize'].includes(q?.kind||'')?{}:'';
    return {id,itemId,answer,order,firstCorrect:null,incorrectAttempts:0,helpUsed:false,revealed:false,hints:0,outcome:null,message:'',grade:null,finalized:false,showLesson:false};
  }
  export function initialState(at=Date.now()):Progress {
    return {schemaVersion:1,savedAt:at,settings:{theme:'dark',motion:'system',sound:false,questionCount:12},skills:{},encounters:[],items:{},repairs:{},awarded:{},points:0,session:null,collection:{},teacher:{},
      builder:{targetId:'methane',graph:{atoms:[],bonds:[]},past:[],future:[],selected:null,bondOrder:1,zoom:1,attempt:blankAttempt('build:methane','build:'+at),showFormula:false,showValences:false,showAnswer:false},
      atom:{symbol:'Na',electrons:11,ionTarget:null,charge:'',showCounts:false,attempt:blankAttempt('ion:Na+','ion:'+at)},labSessionId:'lab:'+at,visited:[]};
  }
  export function isEligible(p:Progress,itemId:string,at:number):boolean {const prev=p.items[itemId];return !prev||at-prev.at>=DAY||prev.afterIds.length>=2;}
  export function recordEncounter(previous:Progress,event:Encounter):Progress {
    if(event.outcome==='self'||previous.encounters.some(e=>e.id===event.id))return previous;
    const p=copy(previous),e=copy(event);
    e.independent=e.outcome==='correct'&&e.firstCorrect&&e.incorrectAttempts===0&&!e.helpUsed&&!e.revealed;
    e.eligible=isEligible(p,e.itemId,e.at);
    const s=p.skills[e.skillId]||emptySkill();s.attempts++;
    if(e.independent){
      s.independent++;
      if(e.eligible){
        const delayed=s.clean.length>0&&s.lastIndependentAt!==null&&e.at-s.lastIndependentAt>=DAY;
        s.clean.push({itemId:e.itemId,kind:e.kind,at:e.at,delayed});s.clean=s.clean.slice(-40);
        if(s.dueAt===null){s.reviewLevel=1;s.dueAt=e.at+DAY;}
        else if(e.at>=s.dueAt){s.reviewLevel=Math.min(5,s.reviewLevel+1);s.dueAt=e.at+[0,1,3,7,14,30][s.reviewLevel]*DAY;}
        delete p.repairs[e.skillId];
      }
      s.lastIndependentAt=e.at;
    }else{
      s.clean=[];s.lastIndependentAt=null;s.reviewLevel=0;s.dueAt=e.at+600000;
      p.repairs[e.skillId]={at:e.at,itemId:e.itemId,afterIds:[]};
    }
    const status=skillStatus(s);if(status==='ready'||status==='retained')s.everReady=true;if(status==='retained')s.everRetained=true;
    p.skills[e.skillId]=s;
    for(const item of Object.keys(p.items))if(item!==e.itemId&&!p.items[item].afterIds.includes(e.itemId))p.items[item].afterIds=[...p.items[item].afterIds,e.itemId].slice(-2);
    p.items[e.itemId]={at:e.at,afterIds:[]};
    for(const [skill,ticket] of Object.entries(p.repairs))if(skill!==e.skillId&&!ticket.afterIds.includes(e.itemId))ticket.afterIds=[...ticket.afterIds,e.itemId].slice(-2);
    const awarded=p.awarded[e.sessionId]||[];
    e.points=e.outcome==='correct'&&!e.revealed&&!awarded.includes(e.itemId)?(e.independent?10:5):0;
    if(e.points){p.points+=e.points;p.awarded[e.sessionId]=[...awarded,e.itemId];}
    if(e.itemId.startsWith('build:')&&e.outcome==='correct'&&!e.revealed){
      const id=e.itemId.slice(6),old=p.collection[id];
      p.collection[id]={at:old?.at||e.at,assisted:old?.assisted||!e.independent,independent:old?.independent||!!e.independent};
    }
    p.encounters.push(e);p.encounters=p.encounters.slice(-500);
    // Keep the active and recent session award lists; a completed session cannot be reopened.
    const sessionKeys=Object.keys(p.awarded);for(const key of sessionKeys.slice(0,Math.max(0,sessionKeys.length-50)))if(key!==p.labSessionId&&key!==p.session?.id)delete p.awarded[key];
    p.savedAt=e.at;return p;
  }
  export function newSession(p:Progress,mode:Session['mode'],count:number,at=Date.now(),filter:string|null=null,ids:string[]=[]):Session {
    const seed=hash(at+':'+p.encounters.length+':'+mode),id='session:'+at+':'+seed;
    let planned=ids.slice();
    if(mode==='exam'||mode==='diagnostic'){
      planned=[];
      for(const m of modules){
        const pool=shuffle(questions.filter(q=>m.skillIds.includes(q.skillId)),seed+hash(m.id));
        const first=pool[0];planned.push(first.id);
        if(mode==='exam')planned.push((pool.find(q=>q.id!==first.id&&q.kind!==first.kind)||pool[1]).id);
      }
      planned=shuffle(planned,seed);count=planned.length;
    }
    if(mode==='bank')count=planned.length;
    return {id,mode,budget:Math.max(1,Math.min(20,count)),index:0,filter,plannedIds:planned,current:null,results:[],examAnswers:{},finished:false,startedAt:at,seed,seenSkillLessons:[],endReason:''};
  }
  export function selectQuestion(p:Progress,s:Session,at=Date.now()):Question|null {
    if(s.index>=s.budget)return null;
    if(s.plannedIds.length)return questionById[s.plannedIds[s.index]]||null;
    let pool=questions.filter(q=>!s.filter||q.skillId===s.filter||skillById[q.skillId]?.moduleId===s.filter);
    if(s.mode==='repair')pool=pool.filter(q=>!!p.repairs[q.skillId]||skillStatus(p.skills[q.skillId])==='practicing');
    const recent=s.results.slice(-2),last=recent[recent.length-1];
    pool=pool.filter(q=>q.id!==last?.itemId&&isEligible(p,q.id,at));
    if(recent.length===2&&recent[0].skillId===recent[1].skillId){const varied=pool.filter(q=>q.skillId!==last.skillId);if(varied.length)pool=varied;}
    if(!pool.length)return null;
    const repairs=pool.filter(q=>p.repairs[q.skillId]?.afterIds.length>=2&&p.repairs[q.skillId].itemId!==q.id);
    if(repairs.length)pool=repairs;
    else if(s.mode==='adaptive'){
      const bucket=s.index%20;const group=bucket<8?'due':bucket<15?'fragile':'new';
      const due=pool.filter(q=>p.skills[q.skillId]?.dueAt!==null&&p.skills[q.skillId]?.dueAt!==undefined&&p.skills[q.skillId].dueAt!<=at);
      const fragile=pool.filter(q=>skillStatus(p.skills[q.skillId])==='practicing');
      let fresh=pool.filter(q=>!p.skills[q.skillId]?.attempts);
      const readyPrereq=fresh.filter(q=>moduleById[skillById[q.skillId].moduleId].prerequisiteModuleIds.every(id=>moduleById[id].skillIds.every(k=>['ready','retained'].includes(skillStatus(p.skills[k])))));
      if(readyPrereq.length)fresh=readyPrereq;
      else if(fresh.length){const firstModule=modules.find(m=>fresh.some(q=>q.skillId&&m.skillIds.includes(q.skillId)));fresh=fresh.filter(q=>firstModule?.skillIds.includes(q.skillId));}
      const firstFresh=skills.find(skill=>fresh.some(q=>q.skillId===skill.id));
      if(firstFresh)fresh=fresh.filter(q=>q.skillId===firstFresh.id);
      const preferred=group==='due'?due:group==='fragile'?fragile:fresh;
      pool=preferred.length?preferred:due.length?due:fragile.length?fragile:fresh.length?fresh:pool;
    }
    const unused=pool.filter(q=>!s.results.some(e=>e.itemId===q.id));if(unused.length)pool=unused;
    const unseen=pool.filter(q=>!p.items[q.id]);if(unseen.length)pool=unseen;
    // Prefer a different representation, particularly a non-choice response, in a clean run.
    const diverse=pool.filter(q=>!p.skills[q.skillId]?.clean.some(e=>e.kind===q.kind));if(diverse.length)pool=diverse;
    return shuffle(pool,s.seed+s.index*997)[0];
  }
  export function makeEncounter(attempt:Attempt,sessionId:string,skillId:string,kind:string,at=Date.now()):Encounter {
    return {id:attempt.id,sessionId,itemId:attempt.itemId,skillId,kind,at,firstCorrect:attempt.firstCorrect===true,incorrectAttempts:attempt.incorrectAttempts,helpUsed:attempt.helpUsed,revealed:attempt.revealed,outcome:attempt.outcome||'unknown'};
  }
  export function moduleCounts(p:Progress,m:Module):{ready:number;retained:number;started:number}{
    return {ready:m.skillIds.filter(id=>['ready','retained'].includes(skillStatus(p.skills[id]))).length,retained:m.skillIds.filter(id=>skillStatus(p.skills[id])==='retained').length,started:m.skillIds.filter(id=>skillStatus(p.skills[id])!=='new').length};
  }
}
