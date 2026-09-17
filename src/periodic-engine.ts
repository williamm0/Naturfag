namespace KL {
  export const periodicTracks:Record<PeriodicTrack|'mixed',string>={mixed:'Litt av alt',names:'Navn og symboler',positions:'Grupper og perioder',electrons:'Atomer og elektroner',ions:'Ioner og ladning',trends:'Størrelse og elektronegativitet'};
  export const periodicGroups=[1,2,13,14,15,16,17,18];
  export function initialPeriodicState():PeriodicState {
    return {version:1,selection:elements.map(e=>e.symbol),track:'mixed',roundSize:10,records:{},active:null,oral:{index:0,players:2,notes:{},checked:{},done:[]}};
  }
  export function periodicPool(s:PeriodicState,track=s.track):PeriodicQuestion[] {
    return periodicQuestions.filter(q=>(track==='mixed'||q.track===track)&&(!q.symbol||s.selection.includes(q.symbol))&&(!q.relatedSymbols||q.relatedSymbols.every(symbol=>s.selection.includes(symbol))));
  }
  export function gradePeriodic(q:PeriodicQuestion,answer:string):{outcome:'correct'|'incorrect'|'invalid';message:string} {
    const invalid=(message:string)=>({outcome:'invalid' as const,message});
    let a=answer.trim().normalize('NFKC').replace(/[−–]/g,'-'),expected=q.expected;
    if(!a)return invalid('Skriv eller velg et svar først. Et tomt svar teller ikke som en feil.');
    if(a.length>120)return invalid('Skriv et kort svar i feltet.');
    if(q.format==='name'){a=a.toLocaleLowerCase('nb-NO');expected=expected.toLocaleLowerCase('nb-NO');}
    else if(q.format==='symbol'){if(!/^[a-zA-Z]{1,3}$/.test(a))return invalid('Skriv bare grunnstoffsymbolet, ikke navnet eller atomnummeret.');}
    else if(q.format==='number'){
      if(!/^\d{1,4}$/.test(a))return invalid('Skriv et helt tall uten bokstaver eller enhet.');
      a=String(Number(a));
    }else if(q.format==='charge'){
      a=a.replace(/\s/g,'');
      const before=a.match(/^([+-])(\d{1,2})?$/),after=a.match(/^(\d{1,2})([+-])$/);
      if(before)a=String(Number(before[2]||1))+before[1];
      else if(after)a=String(Number(after[1]))+after[2];
      else return invalid('Ta med fortegn. Du kan skrive for eksempel 1+, +1, 2− eller −2.');
    }else if(q.format==='shells'){
      if(!/^\d+(?:\s*[,;\-\s]\s*\d+)*$/.test(a))return invalid('Skriv elektronantall fra innerste til ytterste skall, atskilt med komma.');
      a=a.split(/[,;\-\s]+/).filter(Boolean).map(x=>String(Number(x))).join(',');
    }else if(q.format==='position'){
      if(!elements.some(e=>`${e.period}:${e.group}`===a))return invalid('Velg en av rutene i utsnittet.');
    }else if(q.format==='choice'&&!q.options?.some(o=>o.id===a))return invalid('Velg ett av alternativene.');
    return a===expected?{outcome:'correct',message:'Riktig.'}:{outcome:'incorrect',message:q.format==='symbol'&&a.toLowerCase()===expected.toLowerCase()?'Sjekk store og små bokstaver i symbolet.':'Ikke helt. Prøv igjen, eller åpne et hint.'};
  }
  function periodicAttempt(id:string):PeriodicAttempt{return {itemId:id,answer:'',hints:0,misses:0,assisted:false,revealed:false,finished:false,message:'',invalid:false};}
  function priority(s:PeriodicState,q:PeriodicQuestion,now:number):number {
    const r=s.records[q.id];if(r&&r.dueAt<=now)return 0;
    if(r&&r.lastOutcome!=='independent')return 1;
    if(!r)return 2;return r.retained?4:3;
  }
  function ranked(s:PeriodicState,pool:PeriodicQuestion[],now:number,seed:number):PeriodicQuestion[] {
    return shuffle(pool,seed).sort((a,b)=>priority(s,a,now)-priority(s,b,now));
  }
  export function startPeriodicRound(previous:PeriodicState,options:{track?:PeriodicTrack|'mixed';count?:number;ids?:string[]},now=Date.now(),seed=hash(String(now))):PeriodicState {
    const s=copy(previous),track=options.track||s.track;
    const pool=periodicPool(s,track),count=options.count===20?20:10;
    let ordered=ranked(s,pool,now,seed),queue:string[]=[];
    if(options.ids)queue=[...new Set(options.ids)].filter(id=>pool.some(q=>q.id===id)).slice(0,count);
    else if(track==='mixed'){
      const kinds=shuffle(Object.keys(periodicTracks).filter(t=>t!=='mixed') as PeriodicTrack[],seed);
      const buckets=kinds.map(kind=>ordered.filter(q=>q.track===kind));
      while(queue.length<Math.min(count,pool.length)){
        let added=false;
        for(const bucket of buckets){const q=bucket.shift();if(q&&queue.length<count){queue.push(q.id);added=true;}}
        if(!added)break;
      }
    }else queue=ordered.slice(0,count).map(q=>q.id);
    s.track=track;s.roundSize=count;
    if(!queue.length){s.active=null;return s;}
    s.active={queue,index:0,current:periodicAttempt(queue[0]),results:[],startedAt:now,baseCount:queue.length,finished:false,seed,repairs:{},track};
    return s;
  }
  function schedulePeriodicRepair(s:PeriodicState,id:string,now:number):void {
    const round=s.active!;
    if((round.repairs[id]||0)>=2||round.queue.length>=round.baseCount+6||round.queue.slice(round.index+1).includes(id))return;
    const seen=new Set<string>();
    for(let at=round.index+1;at<round.queue.length;at++){
      if(round.queue[at]!==id)seen.add(round.queue[at]);
      if(seen.size>=2){round.queue.splice(at+1,0,id);round.repairs[id]=(round.repairs[id]||0)+1;return;}
    }
    // Near the end, add two different bridging cards only if the round's small
    // remediation budget can fit them. Otherwise the item remains due for later.
    if(round.queue.length+3>round.baseCount+6)return;
    const bridges=ranked(s,periodicPool(s,round.track).filter(q=>q.id!==id&&!seen.has(q.id)),now,round.seed+round.index).slice(0,2-seen.size);
    if(bridges.length<2-seen.size)return;
    round.queue.push(...bridges.map(q=>q.id),id);round.repairs[id]=(round.repairs[id]||0)+1;
  }
  function finishPeriodic(s:PeriodicState,outcome:PeriodicOutcome,now:number):PeriodicState {
    const round=s.active!,a=round.current;
    if(a.finished)return s;
    a.finished=true;a.invalid=false;
    const old=s.records[a.itemId],independent=outcome==='independent';
    const retained=independent&&!!old&&(old.retained||(old.lastCleanAt!==null&&now-old.lastCleanAt>=DAY));
    s.records[a.itemId]={attempts:(old?.attempts||0)+1,clean:independent?(old?.clean||0)+1:0,lastCleanAt:independent?now:null,retained,lastAt:now,
      dueAt:independent?(old&&old.dueAt>now?old.dueAt:now+(retained?3:1)*DAY):now+600000,lastOutcome:outcome};
    round.results.push({itemId:a.itemId,outcome,at:now});
    a.message=outcome==='independent'?'Riktig, uten hjelp.':outcome==='assisted'?'Riktig etter hjelp eller et nytt forsøk.':'Forklaringen er åpnet. Denne øver vi mer på.';
    if(!independent)schedulePeriodicRepair(s,a.itemId,now);
    return s;
  }
  export function submitPeriodic(previous:PeriodicState,answer:string,now=Date.now()):PeriodicState {
    if(!previous.active||previous.active.finished||previous.active.current.finished)return previous;
    const s=copy(previous),a=s.active!.current,q=periodicById[a.itemId];
    a.answer=answer;const grade=gradePeriodic(q,answer);a.message=grade.message;a.invalid=grade.outcome==='invalid';
    if(grade.outcome==='invalid')return s;
    if(grade.outcome==='incorrect'){a.misses++;return s;}
    return finishPeriodic(s,a.misses===0&&!a.assisted&&a.hints===0?'independent':'assisted',now);
  }
  export function usePeriodicHint(previous:PeriodicState):PeriodicState {
    const s=copy(previous),a=s.active?.current;
    if(a&&!a.finished&&!s.active!.finished){a.hints=Math.min(2,a.hints+1);a.assisted=true;}return s;
  }
  export function markPeriodicHelp(previous:PeriodicState):PeriodicState {
    const s=copy(previous),a=s.active?.current;if(a&&!a.finished&&!s.active!.finished)a.assisted=true;return s;
  }
  export function revealPeriodicAnswer(previous:PeriodicState,now=Date.now()):PeriodicState {
    if(!previous.active||previous.active.finished||previous.active.current.finished)return previous;
    const s=copy(previous),a=s.active!.current;a.assisted=true;a.revealed=true;return finishPeriodic(s,'revealed',now);
  }
  export function nextPeriodicQuestion(previous:PeriodicState):PeriodicState {
    if(!previous.active||previous.active.finished||!previous.active.current.finished)return previous;
    const s=copy(previous),r=s.active!;
    if(r.index+1>=r.queue.length)r.finished=true;
    else {r.index++;r.current=periodicAttempt(r.queue[r.index]);}return s;
  }
  export function periodicStats(s:PeriodicState,track:PeriodicTrack|'mixed'=s.track):{total:number;seen:number;due:number;retained:number;weak:number} {
    const pool=periodicPool(s,track),now=Date.now();
    return {total:pool.length,seen:pool.filter(q=>s.records[q.id]).length,due:pool.filter(q=>s.records[q.id]?.dueAt<=now).length,retained:pool.filter(q=>s.records[q.id]?.retained).length,weak:pool.filter(q=>s.records[q.id]&&s.records[q.id].lastOutcome!=='independent').length};
  }
  export function setPeriodicOralCheck(previous:PeriodicState,id:string,index:number,checked:boolean):PeriodicState {
    const question=periodicOral.find(q=>q.id===id);
    if(!question||!Number.isInteger(index)||index<0||index>=question.rubric.length)return previous;
    const state=copy(previous);
    // A sparse array serializes holes as null, which is not a valid checkbox value.
    state.oral.checked[id]=question.rubric.map((_,i)=>i===index?checked:!!state.oral.checked[id]?.[i]);
    return state;
  }
  export function validatePeriodicState(input:unknown):boolean {
    const obj=(x:unknown):x is Record<string,any>=>!!x&&typeof x==='object'&&!Array.isArray(x);
    const integer=(x:unknown,max:number,min=0):x is number=>typeof x==='number'&&Number.isFinite(x)&&Number.isInteger(x)&&x>=min&&x<=max;
    const time=(x:unknown)=>integer(x,8640000000000000);
    const qid=(x:unknown):x is string=>typeof x==='string'&&Object.prototype.hasOwnProperty.call(periodicById,x);
    const oralId=(x:unknown):x is string=>typeof x==='string'&&periodicOral.some(q=>q.id===x);
    const track=(x:unknown)=>typeof x==='string'&&Object.prototype.hasOwnProperty.call(periodicTracks,x);
    const ids=(x:unknown,valid:(v:unknown)=>boolean,max:number)=>Array.isArray(x)&&x.length<=max&&x.every(valid);
    const outcome=(x:unknown)=>['independent','assisted','revealed'].includes(String(x));
    if(!obj(input)||input.version!==1||!ids(input.selection,x=>typeof x==='string'&&elements.some(e=>e.symbol===x),20)||!input.selection.length||new Set(input.selection).size!==input.selection.length||!track(input.track)||![10,20].includes(input.roundSize)||!obj(input.records))return false;
    for(const [id,r] of Object.entries(input.records)){
      if(!qid(id)||!obj(r)||!integer(r.attempts,1e7)||!integer(r.clean,1e7)||(r.lastCleanAt!==null&&!time(r.lastCleanAt))||typeof r.retained!=='boolean'||!time(r.lastAt)||!time(r.dueAt)||!outcome(r.lastOutcome))return false;
    }
    const oral=input.oral;
    if(!obj(oral)||!integer(oral.index,periodicOral.length-1)||!integer(oral.players,4,1)||!obj(oral.notes)||!obj(oral.checked)||!ids(oral.done,oralId,periodicOral.length)||new Set(oral.done).size!==oral.done.length)return false;
    if(Object.entries(oral.notes).some(([id,text])=>!oralId(id)||typeof text!=='string'||text.length>6000))return false;
    if(Object.entries(oral.checked).some(([id,c])=>!oralId(id)||!Array.isArray(c)||c.length>10||c.some(v=>typeof v!=='boolean')))return false;
    if(input.active===null)return true;
    const r=input.active;
    if(!obj(r)||!ids(r.queue,qid,26)||!r.queue.length||!integer(r.index,r.queue.length-1)||!integer(r.baseCount,20,1)||r.queue.length<r.baseCount||r.queue.length>r.baseCount+6||!time(r.startedAt)||!integer(r.seed,0xffffffff)||typeof r.finished!=='boolean'||!track(r.track)||!obj(r.repairs)||!Array.isArray(r.results)||r.results.length>26)return false;
    for(const [id,n] of Object.entries(r.repairs))if(!qid(id)||!integer(n,2))return false;
    const a=r.current;
    if(!obj(a)||!qid(a.itemId)||a.itemId!==r.queue[r.index]||typeof a.answer!=='string'||a.answer.length>120||!integer(a.hints,2)||!integer(a.misses,100000)||typeof a.assisted!=='boolean'||typeof a.revealed!=='boolean'||typeof a.finished!=='boolean'||typeof a.invalid!=='boolean'||typeof a.message!=='string'||a.message.length>500)return false;
    if(r.results.length!==r.index+(a.finished?1:0)||r.finished&&(!a.finished||r.index!==r.queue.length-1))return false;
    return r.results.every((e:any,i:number)=>obj(e)&&qid(e.itemId)&&e.itemId===r.queue[i]&&time(e.at)&&outcome(e.outcome));
  }
}
