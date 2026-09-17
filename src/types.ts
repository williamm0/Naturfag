namespace KL {
  export type Kind = 'choice'|'recall'|'fields'|'order'|'categorize'|'select_parts';
  export type Answer = string | string[] | Record<string,string|number>;
  export type Grade = 'correct'|'incorrect'|'invalid_format'|'needs_self_check';
  export type Outcome = 'correct'|'revealed'|'unknown'|'self';
  export type Status = 'new'|'practicing'|'ready'|'retained';
  export interface Option {id:string;text:string}
  export interface Question {
    id:string;skillId:string;kind:Kind;prompt:string;
    inputSpec: {options?:Option[];items?:Option[];groups?:Option[];fields?:{id:string;label:string;inputMode?:string}[];placeholder?:string;inputMode?:string;shuffle?:boolean;referenceTable?:string;diagramId?:string;diagramIds?:string[];multiple?:boolean};
    answerSpec:{correctOptionId?:string;accepted?:string[];normalization?:'term'|'number'|'formula'|'group_formula';values?:Record<string,number>;assignments?:Record<string,string>;orderedIds?:string[];selectedPartIds?:string[]};
    hints:string[];explanation:string;sourceRefs:string[];clarificationIds:string[];transfer:boolean;
  }
  export interface Skill {id:string;moduleId:string;title:string;objective:string;lesson:string;defaultHints:string[];sourceRefs:string[];origin:string;clarificationIds:string[]}
  export interface Module {id:string;title:string;goal:string;skillIds:string[];prerequisiteModuleIds:string[]}
  export interface Source {id:string;title:string;kind:string;location:string;purpose:string;checkedOn:string}
  export interface Clarification {id:string;title:string;sourceLocation:string;issue:string;teachingDecision:string;sourceRefs:string[]}
  export interface Atom {id:string;element:string;x?:number;y?:number;hydrogens?:number}
  export interface Bond {id?:string;a:string;b:string;order:number}
  export interface Graph {atoms:Atom[];bonds:Bond[]}
  export interface Molecule {id:string;name:string;aliases:string[];formula:string;condensedFormula:string;geometry:string;buildTarget:boolean;skillIds:string[];sourceRefs:string[];heavyGraph:Graph;expandedGraph:Graph;primarySkillId?:string}
  export interface Element {symbol:string;name:string;atomicNumber:number;group:number;period:number;neutralShells:number[];category:string;classroomElectronegativity:number|null}
  export interface Diagram {id:string;renderer:string;moleculeId?:string;showHydrogens?:boolean;description?:string;accessibleDescription?:string;selectableParts:string|string[]}
  export interface TeacherTask {id:string;section:string;prompt:string;skillIds:string[];sourceRefs:string[];hints:string[];rubric:string[];modelAnswer:string;clarification:string|null;promptSourceRefs:string[];answerSourceRefs:string[]}
  export interface Reflection {id:string;prompt:string;guidance:string;personalReflection:boolean;sourceRefs:string[]}
  export interface Evidence {itemId:string;kind:string;at:number;delayed:boolean}
  export interface SkillState {clean:Evidence[];reviewLevel:number;dueAt:number|null;attempts:number;independent:number;everReady:boolean;everRetained:boolean;lastIndependentAt:number|null}
  export interface Encounter {id:string;sessionId:string;itemId:string;skillId:string;kind:string;at:number;firstCorrect:boolean;incorrectAttempts:number;helpUsed:boolean;revealed:boolean;outcome:Outcome;independent?:boolean;eligible?:boolean;points?:number}
  export interface Attempt {id:string;itemId:string;answer:Answer;order:string[];firstCorrect:boolean|null;incorrectAttempts:number;helpUsed:boolean;revealed:boolean;hints:number;outcome:Outcome|null;message:string;grade:Grade|null;finalized:boolean;showLesson:boolean}
  export interface Session {id:string;mode:'adaptive'|'topic'|'repair'|'exam'|'diagnostic'|'bank';budget:number;index:number;filter:string|null;plannedIds:string[];current:Attempt|null;results:Encounter[];examAnswers:Record<string,Answer>;finished:boolean;startedAt:number;seed:number;seenSkillLessons:string[];endReason:string}
  export interface BuilderDraft {targetId:string;graph:Graph;past:Graph[];future:Graph[];selected:string|null;bondOrder:number;zoom:number;attempt:Attempt;showFormula:boolean;showValences:boolean;showAnswer:boolean}
  export interface AtomDraft {symbol:string;electrons:number;ionTarget:string|null;charge:string;showCounts:boolean;attempt:Attempt}
  export interface TeacherDraft {text:string;checked:boolean[];compared:boolean;showAnswer:boolean;selfDone:boolean}
  export interface Progress {
    schemaVersion:number;savedAt:number;periodic?:PeriodicState;settings:{theme:'dark'|'light'|'system';motion:'system'|'reduced';sound:boolean;questionCount:number};
    skills:Record<string,SkillState>;encounters:Encounter[];items:Record<string,{at:number;afterIds:string[]}>;repairs:Record<string,{at:number;itemId:string;afterIds:string[]}>;
    awarded:Record<string,string[]>;points:number;session:Session|null;collection:Record<string,{at:number;assisted:boolean;independent:boolean}>;
    teacher:Record<string,TeacherDraft>;builder:BuilderDraft;atom:AtomDraft;labSessionId:string;visited:string[];
  }
  export const DAY=86400000;
  export const copy = <T>(v:T):T => JSON.parse(JSON.stringify(v));
}
