namespace KL {
  export interface GraphResult {outcome:'correct'|'wrong_target'|'invalid';message:string}
  export function validateGraph(g:Graph,target?:Molecule):GraphResult {
    const invalid=(message:string):GraphResult=>({outcome:'invalid',message});
    if(!g.atoms.length)return invalid('Legg til atomer før du sjekker modellen.');
    if(g.atoms.length>80||g.bonds.length>100)return invalid('Denne modellen er større enn verkstedet støtter.');
    const byId=Object.fromEntries(g.atoms.map(a=>[a.id,a]));
    if(Object.keys(byId).length!==g.atoms.length)return invalid('To atomer har samme ID. Start modellen på nytt.');
    const totals:Record<string,number>=Object.fromEntries(g.atoms.map(a=>[a.id,0]));
    const neighbors:Record<string,string[]>=Object.fromEntries(g.atoms.map(a=>[a.id,[]]));
    const edges=new Set<string>();
    for(const b of g.bonds){
      if(b.a===b.b||!byId[b.a]||!byId[b.b]||![1,2,3].includes(b.order))return invalid('En binding må koble to ulike atomer, med orden 1, 2 eller 3.');
      const key=[b.a,b.b].sort().join('|');if(edges.has(key))return invalid('Bruk én binding med riktig bindingsorden, ikke to separate bindinger mellom samme atomer.');
      edges.add(key);totals[b.a]+=b.order;totals[b.b]+=b.order;neighbors[b.a].push(b.b);neighbors[b.b].push(b.a);
    }
    const reached=new Set<string>(),stack=[g.atoms[0].id];while(stack.length){const id=stack.pop()!;if(reached.has(id))continue;reached.add(id);stack.push(...neighbors[id]);}
    if(reached.size!==g.atoms.length)return invalid('Alle atomene må henge sammen i ett molekyl. Sjekk løse atomer og fragmenter.');
    for(const a of g.atoms){
      const required=moleculeData.neutralValences[a.element];
      if(required===undefined)return invalid('Denne atomtypen støttes ikke av den nøytrale modellen.');
      if(totals[a.id]!==required)return invalid(`${a.element} (${a.id}) har samlet bindingsorden ${totals[a.id]}. Sjekk bindingsregelen for denne atomtypen.`);
      if(a.element==='H' && neighbors[a.id].length!==1)return invalid('Et hydrogenatom skal ha én enkeltbinding i disse modellene.');
    }
    if(!target)return {outcome:'correct',message:'Modellen er sammenhengende og følger bindingsreglene i dette verkstedet.'};
    const counts=(graph:Graph)=>graph.atoms.reduce<Record<string,number>>((acc,a)=>{acc[a.element]=(acc[a.element]||0)+1;return acc},{});
    const ca=counts(g),cb=counts(target.expandedGraph);
    if(Object.keys(ca).length!==Object.keys(cb).length||Object.keys(ca).some(k=>ca[k]!==cb[k]))return {outcome:'wrong_target',message:'Bindingene følger modellen, men antallet atomer stemmer ikke med molekylet du skal bygge.'};
    const heavy=(graph:Graph):Graph=>({atoms:graph.atoms.filter(a=>a.element!=='H').map(a=>({...a,hydrogens:graph.bonds.filter(b=>b.a===a.id||b.b===a.id).filter(b=>graph.atoms.find(x=>x.id===(b.a===a.id?b.b:b.a))?.element==='H').length})),bonds:graph.bonds.filter(b=>graph.atoms.find(a=>a.id===b.a)?.element!=='H'&&graph.atoms.find(a=>a.id===b.b)?.element!=='H')});
    const x=heavy(g),y=heavy(target.expandedGraph);
    const order=(graph:Graph,a:string,b:string)=>graph.bonds.find(e=>(e.a===a&&e.b===b)||(e.a===b&&e.b===a))?.order||0;
    const mapping:Record<string,string>={},used=new Set<string>();
    function match(i:number):boolean {
      if(i===x.atoms.length)return true;
      const atom=x.atoms[i];
      for(const candidate of y.atoms){
        if(used.has(candidate.id)||candidate.element!==atom.element||candidate.hydrogens!==atom.hydrogens)continue;
        if(Object.entries(mapping).some(([a,b])=>order(x,atom.id,a)!==order(y,candidate.id,b)))continue;
        mapping[atom.id]=candidate.id;used.add(candidate.id);
        if(match(i+1))return true;
        delete mapping[atom.id];used.delete(candidate.id);
      }return false;
    }
    return match(0)?{outcome:'correct',message:'Atomene og bindingene stemmer. Du har bygd '+target.name+'.'}:{outcome:'wrong_target',message:'Dette er en gyldig struktur i modellen, men ikke molekylet oppgaven ber om. Sjekk hvordan karbonkjeden er koblet.'};
  }
  export function shellDistribution(count:number):number[]{
    const out:number[]=[];let left=Math.min(20,Math.max(0,count));
    for(const cap of [2,8,8,2]){if(left<=0)break;out.push(Math.min(cap,left));left-=cap;}return out;
  }
  export function graphFormula(g:Graph):string {
    const counts=g.atoms.reduce<Record<string,number>>((r,a)=>{r[a.element]=(r[a.element]||0)+1;return r},{});
    const order=['C','H',...Object.keys(counts).filter(k=>k!=='C'&&k!=='H').sort()];
    return order.filter(k=>counts[k]).map(k=>k+(counts[k]===1?'':counts[k])).join('');
  }
  export function graphLayout(original:Graph):Graph {
    const g=copy(original); const heavy=g.atoms.filter(a=>a.element!=='H');
    // Small tree layout: heavy atoms are laid out first; H fills the open angles.
    if(!heavy.length){g.atoms.forEach((a,i)=>{a.x=180+i*100;a.y=160});return g;}
    const center=heavy.reduce((best,a)=>{
      const degree=(x:Atom)=>g.bonds.filter(b=>(b.a===x.id||b.b===x.id)&&g.atoms.find(y=>y.id===(b.a===x.id?b.b:b.a))?.element!=='H').length;
      return degree(a)>degree(best)?a:best;
    },heavy[0]);
    const degree=g.bonds.filter(b=>(b.a===center.id||b.b===center.id)&&g.atoms.find(a=>a.id===(b.a===center.id?b.b:b.a))?.element!=='H').length;
    const visited=new Set<string>();
    const visit=(atom:Atom,x:number,y:number,parent:string|null,angle:number)=>{
      visited.add(atom.id);atom.x=x;atom.y=y;
      const children=g.bonds.filter(b=>b.a===atom.id||b.b===atom.id).map(b=>g.atoms.find(a=>a.id===(b.a===atom.id?b.b:b.a))!).filter(a=>a.element!=='H'&&!visited.has(a.id)&&a.id!==parent);
      children.forEach((child,i)=>{
        let a=angle;
        if(parent===null&&degree>=3)a=-Math.PI/2+i*Math.PI*2/children.length;
        else if(children.length>1)a=angle+(i-(children.length-1)/2)*1.35;
        else if(parent!==null)a=angle+(y<=160?0.28:-0.28);
        visit(child,x+110*Math.cos(a),y+110*Math.sin(a),atom.id,a);
      });
    };
    const root=degree>=3?center:heavy[0];visit(root,200,160,null,0);
    for(const atom of heavy){
      const links=g.bonds.filter(b=>b.a===atom.id||b.b===atom.id).map(b=>g.atoms.find(a=>a.id===(b.a===atom.id?b.b:b.a))!);
      const occupied=links.filter(a=>a.element!=='H'&&a.x!==undefined).map(a=>Math.atan2(a.y!-atom.y!,a.x!-atom.x!));
      for(const h of links.filter(a=>a.element==='H')){
        let best=-Math.PI/2,score=-1;
        for(let k=0;k<24;k++){
          const a=k*Math.PI/12;const d=occupied.length?Math.min(...occupied.map(o=>Math.acos(Math.cos(a-o)))):Math.PI;
          const px=atom.x!+62*Math.cos(a),py=atom.y!+62*Math.sin(a);
          const collision=g.atoms.filter(a=>a.x!==undefined&&a.id!==atom.id).some(a=>Math.hypot(a.x!-px,a.y!-py)<42)?1.8:0;
          if(d-collision>score){score=d-collision;best=a;}
        }
        h.x=atom.x!+62*Math.cos(best);h.y=atom.y!+62*Math.sin(best);occupied.push(best);
      }
    }
    g.atoms.filter(a=>a.x===undefined).forEach((a,i)=>{a.x=160+i*80;a.y=310});
    const minX=Math.min(...g.atoms.map(a=>a.x!)),maxX=Math.max(...g.atoms.map(a=>a.x!)),minY=Math.min(...g.atoms.map(a=>a.y!)),maxY=Math.max(...g.atoms.map(a=>a.y!));
    g.atoms.forEach(a=>{a.x=a.x!-minX+65;a.y=a.y!-minY+65;});
    return g;
  }
  export function fillHydrogens(original:Graph):Graph {
    const g=copy(original);let n=1;
    for(const a of [...g.atoms].filter(a=>a.element!=='H')){
      const used=g.bonds.filter(b=>b.a===a.id||b.b===a.id).reduce((s,b)=>s+b.order,0),needed=(moleculeData.neutralValences[a.element]||0)-used;
      for(let i=0;i<needed;i++){let id='h-auto-'+n++;while(g.atoms.some(x=>x.id===id))id='h-auto-'+n++;g.atoms.push({id,element:'H'});g.bonds.push({id:'b-'+id,a:a.id,b:id,order:1});}
    }
    return graphLayout(g);
  }
}
