namespace KL {
  export type PeriodicTrack='names'|'positions'|'electrons'|'ions'|'trends';
  export type PeriodicFormat='name'|'symbol'|'number'|'charge'|'shells'|'position'|'choice';
  export interface PeriodicQuestion {
    id:string;track:PeriodicTrack;format:PeriodicFormat;prompt:string;expected:string;
    answerLabel:string;hints:string[];explanation:string;sourceRefs:string[];
    clarificationIds:string[];symbol?:string;relatedSymbols?:string[];options?:Option[];
  }
  export interface PeriodicOral {
    id:string;title:string;prompt:string;followup:string;hints:string[];rubric:string[];
    modelAnswer:string;sourceRefs:string[];clarificationIds:string[];authorship:string;
  }
  export type PeriodicOutcome='independent'|'assisted'|'revealed';
  export interface PeriodicRecord {
    attempts:number;clean:number;lastCleanAt:number|null;retained:boolean;
    lastAt:number;dueAt:number;lastOutcome:PeriodicOutcome;
  }
  export interface PeriodicAttempt {
    itemId:string;answer:string;hints:number;misses:number;assisted:boolean;
    revealed:boolean;finished:boolean;message:string;invalid:boolean;
  }
  export interface PeriodicResult {itemId:string;outcome:PeriodicOutcome;at:number}
  export interface PeriodicRound {
    queue:string[];index:number;current:PeriodicAttempt;results:PeriodicResult[];
    startedAt:number;baseCount:number;finished:boolean;seed:number;
    repairs:Record<string,number>;track:PeriodicTrack|'mixed';
  }
  export interface PeriodicState {
    version:1;selection:string[];track:PeriodicTrack|'mixed';roundSize:10|20;
    records:Record<string,PeriodicRecord>;active:PeriodicRound|null;
    oral:{index:number;players:number;notes:Record<string,string>;checked:Record<string,boolean[]>;done:string[]};
  }
}
