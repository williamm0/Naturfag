const test=require('node:test');
const assert=require('node:assert/strict');
const K=require('../app.js');
const T=Date.UTC(2026,8,17,10),DAY=86400000;
function api(){assert.equal(typeof K.initialPeriodicState,'function','periodic practice engine must be implemented');}
function initial(){api();return K.initialPeriodicState();}
function start(track='names',count=10){return K.startPeriodicRound(initial(),{track,count},T,1234);}
function current(s){return K.periodicById[s.active.current.itemId];}
function answer(s,now=T+1000){return K.submitPeriodic(s,current(s).expected,now);}

test('periodic course exposes complete data and stable unique IDs',()=>{
 api();assert.ok(K.periodicQuestions.length>=150);assert.equal(new Set(K.periodicQuestions.map(q=>q.id)).size,K.periodicQuestions.length);
 for(const q of K.periodicQuestions){assert.equal(q.hints.length,2);assert.ok(q.prompt&&q.expected&&q.explanation);assert.ok(q.sourceRefs.length);for(const id of q.sourceRefs)assert.ok(K.sourceById[id],id);}
 assert.equal(K.periodicOral.length,12);
});
test('quiz answer keys all pass their own graders',()=>{api();for(const q of K.periodicQuestions)assert.equal(K.gradePeriodic(q,q.expected).outcome,'correct',q.id);});
test('empty and malformed inputs are not counted as mistakes',()=>{let s=start('electrons');s=K.submitPeriodic(s,'',T+1);assert.equal(s.active.current.misses,0);assert.equal(Object.keys(s.records).length,0);});
test('element names ignore surrounding spaces and case, symbols do not',()=>{api();assert.equal(K.gradePeriodic(K.periodicById['pt-name-Na'],' NATRIUM ').outcome,'correct');assert.equal(K.gradePeriodic(K.periodicById['pt-symbol-Na'],'NA').outcome,'incorrect');assert.equal(K.gradePeriodic(K.periodicById['pt-symbol-Na'],'Na').outcome,'correct');});
test('ionic charges accept correct equivalent notations and reject missing signs',()=>{api();const q=K.periodicById['pt-ion-Mg'];for(const a of ['2+','+2','²⁺'])assert.equal(K.gradePeriodic(q,a).outcome,'correct',a);assert.equal(K.gradePeriodic(q,'2').outcome,'invalid');assert.equal(K.gradePeriodic(q,'2-').outcome,'incorrect');});
test('shell distribution accepts separators but not wrong totals',()=>{api();const q=K.periodicById['pt-shells-Na'];for(const a of ['2,8,1','2-8-1','2 8 1','2; 8; 1'])assert.equal(K.gradePeriodic(q,a).outcome,'correct');assert.equal(K.gradePeriodic(q,'2,8,2').outcome,'incorrect');});
test('helium has two outer electrons and one shell',()=>{api();assert.equal(K.periodicById['pt-valence-He'].expected,'2');assert.equal(K.periodicById['pt-shells-He'].expected,'2');assert.equal(K.periodicById['pt-period-He'].expected,'1');});
test('positions use actual group and period, not compact display column',()=>{api();assert.equal(K.periodicById['pt-place-Cl'].expected,'3:17');assert.equal(K.periodicById['pt-place-Ca'].expected,'4:2');});
test('there are no universal hydrogen or noble-gas ion questions',()=>{api();for(const s of ['H','He','Ne','Ar'])assert.equal(K.periodicById['pt-ion-'+s],undefined);});
test('fresh mixed round has variety and no duplicate base questions',()=>{const s=start('mixed');assert.equal(new Set(s.active.queue).size,s.active.queue.length);assert.ok(new Set(s.active.queue.map(id=>K.periodicById[id].track)).size>=4);});
test('selected elements scope generated questions',()=>{let s=initial();s.selection=['Na','Cl'];const pool=K.periodicPool(s,'names');assert.equal(pool.length,4);assert.ok(pool.every(q=>['Na','Cl'].includes(q.symbol)));});
test('single-element set is a valid short round, not an endless loop',()=>{let s=initial();s.selection=['He'];s=K.startPeriodicRound(s,{track:'names',count:10},T,33);assert.equal(s.active.baseCount,2);});
test('wrong first response cannot become independent by retrying',()=>{let s=start();s=K.submitPeriodic(s,'Xx',T+1);s=answer(s,T+2);assert.equal(s.active.results[0].outcome,'assisted');assert.equal(s.records[current(s).id].clean,0);});
test('hint use prevents independent recall even on a correct first attempt',()=>{let s=start();s=K.usePeriodicHint(s);s=answer(s);assert.equal(s.active.results[0].outcome,'assisted');});
test('reveals are recorded separately and do not award independent evidence',()=>{let s=start();s=K.revealPeriodicAnswer(s,T+1);assert.equal(s.active.results[0].outcome,'revealed');assert.equal(s.records[current(s).id].clean,0);});
test('double submission is idempotent',()=>{const s=answer(start());assert.deepEqual(K.submitPeriodic(s,current(s).expected,T+2),s);});
test('mistakes return after at least two different other cards',()=>{let s=start();const id=current(s).id;s=K.revealPeriodicAnswer(s,T+1);const idx=s.active.queue.indexOf(id,1);assert.ok(idx>=3);assert.ok(new Set(s.active.queue.slice(1,idx)).size>=2);});
test('no answer leak in wrong-answer message',()=>{api();const q=K.periodicById['pt-name-Na'];const result=K.gradePeriodic(q,'ukjent');assert.equal(result.outcome,'incorrect');assert.ok(!result.message.toLowerCase().includes('natrium'));});
test('remembered later requires 24 elapsed hours, not same-day success',()=>{
 let s=start();const id=current(s).id;s=answer(s,T+1);assert.equal(s.records[id].retained,false);
 s.active=null;s=K.startPeriodicRound(s,{track:'names',count:10,ids:[id]},T+5000,3);s=answer(s,T+6000);assert.equal(s.records[id].retained,false);
 s.active=null;s=K.startPeriodicRound(s,{track:'names',count:10,ids:[id]},T+DAY+7000,3);s=answer(s,T+DAY+8000);assert.equal(s.records[id].retained,true);
});
test('old progress imports without requiring new periodic state',()=>{api();const p=K.initialState(T);delete p.periodic;assert.equal(K.validateState(p).ok,true);});
test('new practice and unfinished answers survive export validation',()=>{let s=start('positions');s.active.current.answer='3:1';const p=K.initialState(T);p.periodic=s;assert.equal(K.validateState(JSON.parse(JSON.stringify(p))).ok,true);});
test('malformed periodic progress fails instead of overwriting good progress',()=>{const p=K.initialState(T);p.periodic=initial();p.periodic.selection=['made-up'];assert.equal(K.validateState(p).ok,false);});
test('unknown quiz ID in saved queue is rejected',()=>{const p=K.initialState(T);p.periodic=start();p.periodic.active.queue.push('unknown-id');assert.equal(K.validateState(p).ok,false);});
test('oral self assessment stays separate from automatic recall scores',()=>{const s=initial();s.oral.notes['pt-oral-1']='Min forklaring';s.oral.done=['pt-oral-1'];assert.equal(Object.keys(s.records).length,0);});
test('checking a later oral rubric item first makes a dense exportable array',()=>{
 assert.equal(typeof K.setPeriodicOralCheck,'function');const s=initial();
 const next=K.setPeriodicOralCheck(s,'pt-oral-1',3,true);
 assert.deepEqual(next.oral.checked['pt-oral-1'],[false,false,false,true]);
 assert.equal(s.oral.checked['pt-oral-1'],undefined);
 assert.equal(K.validatePeriodicState(JSON.parse(JSON.stringify(next))),true);
});
test('oral rubric updates preserve existing checks and reject invalid indexes',()=>{
 assert.equal(typeof K.setPeriodicOralCheck,'function');let s=initial();
 s=K.setPeriodicOralCheck(s,'pt-oral-1',3,true);s=K.setPeriodicOralCheck(s,'pt-oral-1',1,true);
 assert.deepEqual(s.oral.checked['pt-oral-1'],[false,true,false,true]);
 assert.deepEqual(K.setPeriodicOralCheck(s,'pt-oral-1',99,true),s);
 assert.deepEqual(K.setPeriodicOralCheck(s,'unknown',0,true),s);
});
