const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const KL = fs.existsSync(__dirname+'/../app.js') ? require('../app.js') : {};
const course = name => JSON.parse(fs.readFileSync(__dirname+'/../course/'+name+'.json','utf8'));
const cases = course('acceptance-cases');
const questions = course('questions').questions;
const molecules = course('molecules').molecules;
const clone = x => JSON.parse(JSON.stringify(x));
const T = Date.UTC(2026,8,17,10), DAY=86400000;

test('all core graders are implemented', () => assert.equal(typeof KL.grade, 'function'));
for(const c of cases.gradingCases) test(c.id+': '+c.reason,()=>{
  const q=questions.find(q=>q.id===c.questionId);
  assert.equal(KL.grade(q,c.response),c.expectedOutcome);
});
for(const q of questions) test('keyed response passes '+q.id+' '+q.kind,()=>{
 const a=q.answerSpec; const answer=a.correctOptionId??a.accepted?.[0]??a.values??a.orderedIds??a.assignments??a.selectedPartIds;
 assert.equal(KL.grade(q,answer),'correct');
});
for (const m of molecules.filter(m=>m.buildTarget)) test('connected target '+m.id,()=>{
 assert.equal(KL.validateGraph(m.expandedGraph,m).outcome,'correct');
});
test('graph identity survives renaming and drawing position',()=>{
 const m=molecules.find(x=>x.id==='ethanol'), g=clone(m.expandedGraph), map=Object.fromEntries(g.atoms.map((a,i)=>[a.id,'renamed'+i]));
 g.atoms=g.atoms.reverse().map(a=>({...a,id:map[a.id],x:Math.random()*100,y:-50}));g.bonds=g.bonds.reverse().map(b=>({...b,a:map[b.a],b:map[b.b]}));
 assert.equal(KL.validateGraph(g,m).outcome,'correct');
});
test('butane and isobutane are distinct',()=>assert.equal(KL.validateGraph(molecules.find(m=>m.id==='isobutane').expandedGraph,molecules.find(m=>m.id==='butane')).outcome,'wrong_target'));
test('missing hydrogen rejected',()=>{const m=molecules[0],g=clone(m.expandedGraph);g.atoms.pop();g.bonds.pop();assert.notEqual(KL.validateGraph(g,m).outcome,'correct');});
test('self loop rejected',()=>{const m=molecules[0],g=clone(m.expandedGraph);g.bonds.push({id:'loop',a:'c1',b:'c1',order:1});assert.equal(KL.validateGraph(g,m).outcome,'invalid');});
test('duplicate edge rejected',()=>{const m=molecules[0],g=clone(m.expandedGraph);g.bonds.push({...g.bonds[0],id:'duplicate'});assert.equal(KL.validateGraph(g,m).outcome,'invalid');});
test('disconnected complete fragments rejected',()=>{const m=molecules[0],g=clone(m.expandedGraph);g.atoms.push(...m.expandedGraph.atoms.map(a=>({...a,id:'b'+a.id})));g.bonds.push(...m.expandedGraph.bonds.map(b=>({...b,id:'b'+b.id,a:'b'+b.a,b:'b'+b.b})));assert.equal(KL.validateGraph(g,m).outcome,'invalid');});
test('graph valence cannot be exceeded',()=>{const m=molecules[0],g=clone(m.expandedGraph);g.atoms.push({id:'extra',element:'H'});g.bonds.push({id:'extra-bond',a:'c1',b:'extra',order:1});assert.equal(KL.validateGraph(g,m).outcome,'invalid');});
test('formula parser preserves case and charge',()=>{assert.deepEqual(KL.parseFormula('Co'),{Co:1});assert.deepEqual(KL.parseFormula('CO'),{C:1,O:1});assert.equal(KL.parseFormula('H2O+'),null);assert.equal(KL.parseNumber(''),null);});
function event(id,item='q001',kind='choice',at=T,overrides={}) {return {id,sessionId:'test',itemId:item,skillId:'atom.parts',kind,at,firstCorrect:true,incorrectAttempts:0,helpUsed:false,revealed:false,outcome:'correct',...overrides};}
function apply(s,...events){ for(const e of events) s=KL.recordEncounter(s,e);return s; }
test('one success is only practicing; first review in 24h',()=>{const s=apply(KL.initialState(T),event('e1'));assert.equal(KL.skillStatus(s.skills['atom.parts']),'practicing');assert.equal(s.skills['atom.parts'].reviewLevel,1);assert.equal(s.skills['atom.parts'].dueAt,T+DAY);});
test('three diverse clean successes become ready',()=>{const s=apply(KL.initialState(T),event('a'),event('b','q002','recall',T+1000),event('c','q003','categorize',T+2000));assert.equal(KL.skillStatus(s.skills['atom.parts']),'ready');});
test('repeated unspaced question cannot create mastery',()=>{const s=apply(KL.initialState(T),event('a'),event('b'),event('c'));assert.equal(s.skills['atom.parts'].clean.length,1);assert.equal(KL.skillStatus(s.skills['atom.parts']),'practicing');});
test('choice-only successes cannot create mastery',()=>{const s=apply(KL.initialState(T),event('a'),event('b','q002'),event('c','q003'));assert.equal(KL.skillStatus(s.skills['atom.parts']),'practicing');});
test('assisted correct retry resets clean run, due in ten minutes',()=>{const s=apply(KL.initialState(T),event('a'),event('b','q002','recall'),event('c','q003','categorize',T,{firstCorrect:false,incorrectAttempts:1}));assert.equal(s.skills['atom.parts'].clean.length,0);assert.equal(s.skills['atom.parts'].dueAt,T+600000);assert.equal(s.skills['atom.parts'].reviewLevel,0);assert.equal(Object.keys(s.repairs).length,1);});
test('help prevents independent evidence',()=>{const s=apply(KL.initialState(T),event('a','q001','choice',T,{helpUsed:true}));assert.equal(s.skills['atom.parts'].clean.length,0);assert.equal(s.encounters[0].independent,false);});
test('revealing gets no points and resets evidence',()=>{const s=apply(KL.initialState(T),event('a','q001','choice',T,{outcome:'revealed',revealed:true}));assert.equal(s.points,0);assert.equal(s.skills['atom.parts'].clean.length,0);});
test('idempotent events and one award per item per session',()=>{let s=KL.initialState(T);s=apply(s,event('a'));const once=JSON.stringify(s);s=apply(s,event('a'));assert.equal(JSON.stringify(s),once);s=apply(s,event('b'));assert.equal(s.points,10);});
test('two distinct intervening IDs make a repeat eligible',()=>{const s=apply(KL.initialState(T),event('a'),event('b','q002','recall'),event('c','q003','categorize'),event('d'));assert.equal(s.skills['atom.parts'].clean.length,4);});
test('same intervening ID repeated twice is insufficient',()=>{const s=apply(KL.initialState(T),event('a'),event('b','q002','recall'),event('c','q002','recall'),event('d'));assert.equal(s.skills['atom.parts'].clean.length,2);});
test('24 hours is elapsed time, not a calendar transition',()=>{const late=Date.UTC(2026,8,17,23,59);const s=apply(KL.initialState(late),event('a','q001','choice',late),event('b','q002','recall',late+120000),event('c','q003','categorize',late+180000));assert.equal(KL.skillStatus(s.skills['atom.parts']),'ready');});
test('exact delayed recall threshold',()=>{let s=apply(KL.initialState(T),event('a'),event('b','q002','recall',T+1),event('c','q003','categorize',T+2));const early=apply(clone(s),event('d','q004','fields',T+DAY+1));assert.equal(KL.skillStatus(early.skills['atom.parts']),'ready');s=apply(s,event('e','q004','fields',T+DAY+2));assert.equal(KL.skillStatus(s.skills['atom.parts']),'retained');});
test('historical recall cannot restore current retained status after failure',()=>{let s=apply(KL.initialState(T),event('a'),event('b','q002','recall',T+DAY),event('c','q003','categorize',T+DAY+1));assert.equal(KL.skillStatus(s.skills['atom.parts']),'retained');s=apply(s,event('d','q004','fields',T+DAY+2,{firstCorrect:false,outcome:'revealed',revealed:true}),event('e','q001','choice',T+DAY+3),event('f','q002','recall',T+DAY+4),event('g','q003','categorize',T+DAY+5));assert.equal(KL.skillStatus(s.skills['atom.parts']),'ready');assert.equal(s.skills['atom.parts'].everRetained,true);});
test('early practice cannot postpone due date or increase level',()=>{let s=KL.initialState(T);s.skills['atom.parts']=KL.emptySkill();s.skills['atom.parts'].reviewLevel=2;s.skills['atom.parts'].dueAt=T+DAY;s=apply(s,event('a'));assert.equal(s.skills['atom.parts'].reviewLevel,2);assert.equal(s.skills['atom.parts'].dueAt,T+DAY);});
test('due level two advances to seven-day level three',()=>{let s=KL.initialState(T);s.skills['atom.parts']=KL.emptySkill();s.skills['atom.parts'].reviewLevel=2;s.skills['atom.parts'].dueAt=T;s=apply(s,event('a'));assert.equal(s.skills['atom.parts'].reviewLevel,3);assert.equal(s.skills['atom.parts'].dueAt,T+7*DAY);});
test('level five remains capped at thirty days',()=>{let s=KL.initialState(T);s.skills['atom.parts']=KL.emptySkill();s.skills['atom.parts'].reviewLevel=5;s.skills['atom.parts'].dueAt=T;s=apply(s,event('a'));assert.equal(s.skills['atom.parts'].reviewLevel,5);assert.equal(s.skills['atom.parts'].dueAt,T+30*DAY);});
test('early repair preserves ten-minute review date',()=>{let s=apply(KL.initialState(T),event('a','q001','choice',T,{firstCorrect:false,outcome:'unknown'}),event('b','q005','fields',T+1000,{skillId:'atom.identity'}),event('c','q009','recall',T+2000,{skillId:'atom.shells'}),event('d','q002','recall',T+180000));assert.equal(s.skills['atom.parts'].dueAt,T+600000);assert.equal(s.skills['atom.parts'].reviewLevel,0);assert.equal(s.repairs['atom.parts'],undefined);});
test('level zero due review moves to level one',()=>{let s=apply(KL.initialState(T),event('a','q001','choice',T,{firstCorrect:false,outcome:'unknown'}),event('b','q002','recall',T+600000));assert.equal(s.skills['atom.parts'].reviewLevel,1);assert.equal(s.skills['atom.parts'].dueAt,T+600000+DAY);});
test('repair tickets survive sessions and wait two distinct IDs',()=>{let s=apply(KL.initialState(T),event('a','q001','choice',T,{firstCorrect:false,outcome:'unknown'}),event('b','q005','fields',T+1,{skillId:'atom.identity',sessionId:'second'}));assert.equal(s.repairs['atom.parts'].afterIds.length,1);s=apply(s,event('c','q009','recall',T+2,{skillId:'atom.shells',sessionId:'third'}));assert.equal(s.repairs['atom.parts'].afterIds.length,2);assert.equal(KL.selectQuestion(s,KL.newSession(s,'adaptive',8,T+3),T+3).skillId,'atom.parts');});
test('only primary builder skill receives evidence',()=>{const s=apply(KL.initialState(T),event('build1','build:methane','builder',T,{skillId:'carbon.valence'}));assert.equal(s.skills['carbon.valence'].clean.length,1);assert.equal(s.skills['carbon.families'],undefined);});
test('exam has 20 items, two per module',()=>{const s=KL.initialState(T),session=KL.newSession(s,'exam',20,T);assert.equal(session.plannedIds.length,20);for(const m of KL.modules){const n=session.plannedIds.filter(id=>m.skillIds.includes(KL.questionById[id].skillId)).length;assert.equal(n,2);}});
test('deterministic shuffle',()=>{assert.deepEqual(KL.shuffle(['a','b','c','d'],42),KL.shuffle(['a','b','c','d'],42));});
test('valid export round trip',()=>{const s=apply(KL.initialState(T),event('a'));assert.equal(KL.validateState(JSON.parse(JSON.stringify(s))).ok,true);});
test('future schema rejected without mutation',()=>{const s=KL.initialState(T);s.schemaVersion=9000;assert.equal(KL.validateState(s).ok,false);});
test('unknown content ID rejected',()=>{const s=apply(KL.initialState(T),event('a'));s.encounters[0].itemId='unknown';assert.equal(KL.validateState(s).ok,false);});
test('non-finite time rejected',()=>{const s=KL.initialState(T);s.savedAt=Infinity;assert.equal(KL.validateState(s).ok,false);});
test('denied storage does not block in-memory study',()=>{const denied={getItem(){throw new Error('denied')},setItem(){throw new Error('denied')}};const r=KL.readStorage(denied,T);assert.equal(r.warning.length>0,true);assert.equal(KL.writeStorage(denied,r.state).ok,false);});
test('malformed primary recovers valid backup',()=>{const data={'kjemilab.progress.v1':'{bad','kjemilab.progress.backup':JSON.stringify(KL.initialState(T))};const mock={getItem(k){return data[k]??null},setItem(k,v){data[k]=v}};const r=KL.readStorage(mock,T);assert.equal(r.recovered,true);assert.equal(r.state.savedAt,T);});
test('fresh adaptive course begins with first skill, across seeds',()=>{for(let i=0;i<30;i++){const p=KL.initialState(T+i),s=KL.newSession(p,'adaptive',12,T+i);assert.equal(KL.selectQuestion(p,s,T+i).skillId,'atom.parts');}});
test('corrupt primary is preserved even without usable backup',()=>{const data={'kjemilab.progress.v1':'{broken'};const store={getItem:k=>data[k]??null,setItem:(k,v)=>{data[k]=v}};const r=KL.readStorage(store,T);KL.writeStorage(store,r.state);assert.equal(data['kjemilab.progress.damaged'],'{broken');});
