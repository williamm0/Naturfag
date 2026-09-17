namespace KL {
  export function atomDiagram(symbol='C',electrons?:number,showCount=true):SVGSVGElement {
    const e=elementBySymbol[symbol],n=electrons??e.atomicNumber,distribution=shellDistribution(n),shells=Math.max(distribution.length,e.period,1);
    const s=svg('svg',{viewBox:'0 0 360 320',class:'atom-diagram',role:'img','aria-label':showCount?`Forenklet skallmodell av ${e.name}, med ${e.atomicNumber} protoner. ${distribution.map((x,i)=>`Skall ${i+1} har ${x} elektroner.`).join(' ')}`:`Forenklet skallmodell av ${e.name}. Prikkene er elektroner. Tell dem i modellen, eller bruk hjelpen for å vise antallet.`});
    const cx=180,cy=157;
    for(let i=0;i<shells;i++)s.append(svg('circle',{cx,cy,r:49+i*27,class:'electron-shell'}));
    s.append(svg('circle',{cx,cy,r:28,class:'nucleus'}),svg('text',{x:cx,y:cy+6,'text-anchor':'middle',class:'nucleus-label'},symbol));
    distribution.forEach((count,i)=>{for(let j=0;j<count;j++){const angle=j/count*Math.PI*2-Math.PI/2+i*.25;s.append(svg('circle',{cx:cx+Math.cos(angle)*(49+i*27),cy:cy+Math.sin(angle)*(49+i*27),r:5.6,class:'electron'}));}});
    if(showCount)s.append(svg('text',{x:180,y:303,'text-anchor':'middle',class:'svg-caption'},`${e.atomicNumber} protoner · ${n} elektroner`));
    return s;
  }
  export function periodicTable(selected:string|null=null,onPick?:((symbol:string)=>void),compact=false):HTMLElement {
    const grid=h('div',{class:'periodic-grid',role:'group','aria-label':'De 20 første grunnstoffene i 18 grupper og 4 perioder'});
    grid.append(h('div',{class:'table-axis',style:'grid-column:1;grid-row:1'},''));
    for(let g=1;g<=18;g++)grid.append(h('span',{class:'table-axis',style:`grid-column:${g+1};grid-row:1`},g));
    for(let period=1;period<=4;period++)grid.append(h('span',{class:'table-axis',style:`grid-column:1;grid-row:${period+1}`},period));
    for(const e of elements){
      const attrs={class:'element-cell '+(e.category==='metall'?'metal':e.category==='halvmetall'?'semi':'nonmetal')+(selected===e.symbol?' selected':''),style:`grid-column:${e.group+1};grid-row:${e.period+1}`,'aria-label':`${e.name}, ${e.symbol}, atomnummer ${e.atomicNumber}, gruppe ${e.group}, periode ${e.period}`};
      const inside=[h('small',{},e.atomicNumber),h('strong',{},e.symbol),h('span',{},titleCase(e.name))];
      grid.append(onPick?btn(inside,()=>onPick(e.symbol),attrs.class,{...attrs,'aria-pressed':selected===e.symbol}):h('div',attrs,inside));
    }
    const scroller=h('div',{class:'periodic-scroll',tabIndex:0,'aria-label':'Periodesystem. Rull vannrett for å se alle gruppene.'},grid);
    return h('div',{class:'periodic-table'+(compact?' compact':'')},h('div',{class:'table-labels'},h('span',{},'Perioder langs venstre kant'),h('span',{},'Grupper langs toppen')),scroller,h('p',{class:'small muted'},'Grunnstoff 1–20. Kolonnene beholder de riktige plassene. På en liten skjerm kan du rulle tabellen sidelengs.'));
  }
  export function moleculeDiagram(graph:Graph,options:{selected?:string[];onSelect?:(id:string)=>void;showIds?:boolean;showValences?:boolean;geometry?:string;zoom?:number;label?:string;preserve?:boolean;onMove?:(id:string,dx:number,dy:number)=>void}={}):HTMLElement {
    const g=options.preserve&&graph.atoms.every(a=>a.x!==undefined&&a.y!==undefined)?copy(graph):graphLayout(graph);
    const wrap=h('div',{class:'molecule-canvas'});
    if(!g.atoms.length){wrap.append(h('div',{class:'canvas-empty'},icon('atom',42),h('p',{},'Plasser det første atomet.'),h('span',{class:'small muted'},'Velg C, H eller O fra verktøylinjen.')));return wrap;}
    const minX=Math.min(...g.atoms.map(a=>a.x!))-40,minY=Math.min(...g.atoms.map(a=>a.y!))-40,maxX=Math.max(...g.atoms.map(a=>a.x!))+40,maxY=Math.max(...g.atoms.map(a=>a.y!))+40;
    const width=Math.max(300,maxX-minX),height=Math.max(250,maxY-minY);
    const centerX=(minX+maxX)/2,centerY=(minY+maxY)/2,zoom=options.zoom||1;
    const s=svg('svg',{viewBox:`${centerX-width/2/zoom} ${centerY-height/2/zoom} ${width/zoom} ${height/zoom}`,class:'molecule-svg','aria-label':options.label||'Strukturmodell. Hele linjer er bindinger mellom atomer.',role:options.onSelect?'group':'img'});
    const byId=Object.fromEntries(g.atoms.map(a=>[a.id,a]));
    for(const b of g.bonds){
      const a=byId[b.a],c=byId[b.b];if(!a||!c)continue;const dx=c.x!-a.x!,dy=c.y!-a.y!,len=Math.hypot(dx,dy)||1;
      for(let i=0;i<b.order;i++){
        const offset=(i-(b.order-1)/2)*7,ox=-dy/len*offset,oy=dx/len*offset;
        s.append(svg('line',{x1:a.x!+ox,y1:a.y!+oy,x2:c.x!+ox,y2:c.y!+oy,class:'bond'}));
      }
    }
    for(const a of g.atoms){
      const selected=options.selected?.includes(a.id)||false,hydrogen=a.element==='H',total=g.bonds.filter(b=>b.a===a.id||b.b===a.id).reduce((n,b)=>n+b.order,0);
      const group=svg('g',{class:'atom-node element-'+a.element+(selected?' selected':''),transform:`translate(${a.x},${a.y})`,...(options.onSelect?{role:'button',tabindex:0,'data-focus':'atom-'+a.id,'aria-pressed':selected,'aria-label':`${a.element}, atom ${a.id}`,onclick:()=>options.onSelect!(a.id),onkeydown:(e:KeyboardEvent)=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();options.onSelect!(a.id)}if(options.onMove&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();options.onMove(a.id,e.key==='ArrowLeft'?-15:e.key==='ArrowRight'?15:0,e.key==='ArrowUp'?-15:e.key==='ArrowDown'?15:0)}}}:{})},svg('circle',{r:hydrogen?17:23}),svg('text',{'text-anchor':'middle',y:6,class:'atom-symbol'},a.element));
      if(options.showIds)group.append(svg('text',{'text-anchor':'middle',y:hydrogen?34:40,class:'atom-id'},a.id));
      if(options.showValences)group.append(svg('text',{'text-anchor':'middle',y:-31,class:'valence-count'},`${total}/${moleculeData.neutralValences[a.element]}`));
      s.append(group);
    }
    wrap.append(s);return wrap;
  }
  export function geometryDiagram(moleculeId:string,showDipoles=false):HTMLElement {
    const m=moleculeById[moleculeId],s=svg('svg',{viewBox:'0 0 500 265',role:'img','aria-label':`${titleCase(m.name)}. ${geometryText[m.geometry]}. ${moleculeId==='carbon-dioxide'?'Oksygen, karbon og oksygen ligger på en rett linje.':moleculeId==='water'?'Oksygen er i vinkelen mellom to hydrogenatomer.':moleculeId==='methane'?'Fire hydrogenatomer peker mot hjørnene i et tetraeder.':moleculeId==='ammonia'?'Nitrogen er på toppen av en pyramide med tre hydrogenatomer ved basen.':'Ett hydrogenatom er bundet til ett kloratom.'}`});
    let coords:{el:string;x:number;y:number;charge:string;wedge?:string}[]=[];
    if(moleculeId==='water')coords=[{el:'O',x:250,y:80,charge:'δ−'},{el:'H',x:157,y:166,charge:'δ+'},{el:'H',x:343,y:166,charge:'δ+'}];
    if(moleculeId==='carbon-dioxide')coords=[{el:'C',x:250,y:132,charge:'δ+'},{el:'O',x:115,y:132,charge:'δ−'},{el:'O',x:385,y:132,charge:'δ−'}];
    if(moleculeId==='methane')coords=[{el:'C',x:250,y:130,charge:''},{el:'H',x:250,y:35,charge:''},{el:'H',x:140,y:170,charge:''},{el:'H',x:332,y:195,charge:'',wedge:'solid'},{el:'H',x:350,y:102,charge:'',wedge:'dash'}];
    if(moleculeId==='ammonia')coords=[{el:'N',x:250,y:65,charge:'δ−'},{el:'H',x:143,y:173,charge:'δ+'},{el:'H',x:253,y:220,charge:'δ+',wedge:'solid'},{el:'H',x:356,y:160,charge:'δ+',wedge:'dash'}];
    if(moleculeId==='hydrogen-chloride')coords=[{el:'Cl',x:319,y:132,charge:'δ−'},{el:'H',x:180,y:132,charge:'δ+'}];
    const first=coords[0];
    for(const a of coords.slice(1)){
      if(a.wedge==='solid')s.append(svg('path',{d:`M${first.x} ${first.y} L${a.x-10} ${a.y+5} L${a.x+10} ${a.y-5} Z`,class:'wedge'}));
      else if(a.wedge==='dash'){
        for(let t=0.15;t<1;t+=.12){const x=first.x+(a.x-first.x)*t,y=first.y+(a.y-first.y)*t;s.append(svg('line',{x1:x,y1:y-10*t,x2:x,y2:y+10*t,class:'bond'}));}
      }else for(let off=0;off<(moleculeId==='carbon-dioxide'?2:1);off++)s.append(svg('line',{x1:first.x,y1:first.y+(off?5:-2),x2:a.x,y2:a.y+(off?5:-2),class:'bond'}));
      if(showDipoles&&a.charge){
        const start=a.charge==='δ+'?a:first,end=a.charge==='δ+'?first:a;
        const dx=end.x-start.x,dy=end.y-start.y,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,sx=start.x+dx*.32,sy=start.y+dy*.32-18,ex=start.x+dx*.72,ey=start.y+dy*.72-18;
        s.append(svg('line',{x1:sx,y1:sy,x2:ex,y2:ey,class:'dipole'}),svg('path',{d:`M${ex-ux*9-uy*5} ${ey-uy*9+ux*5} L${ex} ${ey} L${ex-ux*9+uy*5} ${ey-uy*9-ux*5}`,class:'dipole-head'}));
      }
    }
    for(const a of coords)s.append(svg('g',{class:'atom-node element-'+a.el,transform:`translate(${a.x},${a.y})`},svg('circle',{r:a.el==='H'?18:26}),svg('text',{y:6,'text-anchor':'middle',class:'atom-symbol'},a.el),showDipoles&&a.charge?svg('text',{x:32,y:-21,class:'charge-text'},a.charge):null));
    return h('div',{class:'geometry-model'},s,h('p',{class:'diagram-caption'},geometryText[m.geometry],'. Skjematisk romform, ikke i målestokk.'));
  }
  export function fattyDiagram(selected:string[]=[],onSelect?:((id:string)=>void)):HTMLElement {
    const s=svg('svg',{viewBox:'0 0 680 230',role:onSelect?'group':'img','aria-label':'En nøytral fettsyre har COOH-gruppe til venstre, en forkortet lang kjede mot høyre, og en C=C-binding i kjeden.'});
    s.append(svg('text',{x:30,y:30,class:'svg-caption'},'Karboksylgruppe'),svg('text',{x:350,y:30,class:'svg-caption'},'Forkortet hydrokarbonkjede'));
    const carbons=[{x:135,y:140},{x:235,y:140},{x:295,y:90},{x:385,y:90},{x:445,y:142},{x:505,y:100},{x:565,y:145}];
    for(let i=1;i<carbons.length;i++){const a=carbons[i-1],b=carbons[i];const isDouble=i===3;for(let j=0;j<(isDouble?2:1);j++)s.append(svg('line',{x1:a.x,y1:a.y+(j?7:0),x2:b.x,y2:b.y+(j?7:0),class:'bond'}));}
    s.append(svg('line',{x1:135,y1:140,x2:80,y2:190,class:'bond'}),svg('text',{x:26,y:204,class:'svg-formula'},'HO'));
    for(const x of [131,139])s.append(svg('line',{x1:x,y1:123,x2:x,y2:69,class:'bond'}));
    s.append(svg('text',{x:135,y:58,'text-anchor':'middle',class:'svg-formula'},'O'));
    for(const a of carbons)s.append(svg('circle',{cx:a.x,cy:a.y,r:17,class:'diagram-carbon'}),svg('text',{x:a.x,y:a.y+6,'text-anchor':'middle',class:'svg-formula'},'C'));
    s.append(svg('text',{x:610,y:155,class:'svg-formula'},'…'));
    for(const part of [{id:'carbonyl-double',x:112,y:60,w:46,h:63,label:'C og O ved syregruppen'},{id:'chain-double',x:299,y:69,w:82,h:48,label:'C og C i kjeden'}]){
      if(onSelect)s.append(svg('rect',{x:part.x,y:part.y,width:part.w,height:part.h,rx:8,class:'select-region'+(selected.includes(part.id)?' selected':''),role:'button',tabindex:0,'data-focus':'region-'+part.id,'aria-label':part.label,'aria-pressed':selected.includes(part.id),onclick:()=>onSelect(part.id),onkeydown:(e:KeyboardEvent)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(part.id)}}}));
      else if(selected.includes(part.id))s.append(svg('rect',{x:part.x,y:part.y,width:part.w,height:part.h,rx:8,class:'select-region selected'}));
    }
    return h('div',{class:'schematic'},s,h('p',{class:'diagram-caption'},'Strukturmodell. Resten av den lange kjeden er forkortet med …'));
  }
  export function soapDiagram(selected:string[]=[],onSelect?:((id:string)=>void),flips?:boolean[],onFlip?:((i:number)=>void)):HTMLElement {
    const s=svg('svg',{viewBox:'0 0 500 335',role:onSelect||onFlip?'group':'img','aria-label':'Forenklet micellemodell. Olje i midten og vann rundt. Såpemolekylene har en kjede og et ladet COO−-hode.'});
    s.append(svg('circle',{cx:250,cy:169,r:67,class:'oil-core'}),svg('text',{x:250,y:176,'text-anchor':'middle',class:'svg-oil'},'Olje'),svg('text',{x:25,y:42,class:'svg-caption'},'Vann'));
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4,correct=flips?flips[i]:true,headR=correct?129:74,tailR=correct?74:129;
      const x1=250+Math.cos(a)*tailR,y1=169+Math.sin(a)*tailR,x2=250+Math.cos(a)*headR,y2=169+Math.sin(a)*headR;
      const group=svg('g',{class:onFlip?'soap-interactive':'',...(onFlip?{role:'button',tabindex:0,'data-focus':'soap-'+i,'aria-label':`Snu såpemolekyl ${i+1}`,'aria-pressed':correct,onclick:()=>onFlip(i),onkeydown:(e:KeyboardEvent)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onFlip(i)}}}:{})});
      const midX=(x1+x2)/2,midY=(y1+y2)/2;
      group.append(svg('path',{d:`M${x1} ${y1} L${midX+Math.sin(a)*5} ${midY-Math.cos(a)*5} L${x2} ${y2}`,class:'soap-tail'}),svg('circle',{cx:x2,cy:y2,r:19,class:'soap-head'}),svg('text',{x:x2,y:y2+4,'text-anchor':'middle',class:'soap-label'},'COO⁻'));
      s.append(group);
    }
    if(selected.includes('heads'))s.append(svg('circle',{cx:250,cy:169,r:129,class:'selection-ring'}));
    if(selected.includes('tails'))s.append(svg('circle',{cx:250,cy:169,r:90,class:'selection-ring'}));
    return h('div',{class:'schematic'},s);
  }
  export function questionDiagram(id:string,selected:string[]=[],onSelect?:((id:string)=>void)):HTMLElement {
    const d=diagramById[id];if(!d)return h('div',{},'Modellen kunne ikke finnes.');
    if(d.renderer==='molecule'){
      const m=moleculeById[d.moleculeId!],graph=d.showHydrogens?m.expandedGraph:{atoms:m.expandedGraph.atoms.filter(a=>a.element!=='H'),bonds:m.expandedGraph.bonds.filter(b=>m.expandedGraph.atoms.find(a=>a.id===b.a)?.element!=='H'&&m.expandedGraph.atoms.find(a=>a.id===b.b)?.element!=='H')};
      return h('div',{class:'question-model'},moleculeDiagram(graph,{selected,onSelect,showIds:!!onSelect}),h('p',{class:'diagram-caption'},d.showHydrogens?'Strukturtegning. Linjene viser hvilke atomer som er bundet sammen.':'Bare de tunge atomene vises. Hydrogener er utelatt fra tegningen.'));
    }
    if(d.renderer==='fatty-acid-schematic')return fattyDiagram(selected,onSelect);
    return soapDiagram(selected,onSelect);
  }
  export function lessonVisual(skillId:string):HTMLElement {
    const moduleId=skillById[skillId]?.moduleId;
    if(moduleId==='m01')return h('div',{class:'lesson-visual'},atomDiagram('C'),h('p',{class:'diagram-caption'},'Karbon i den forenklede skallmodellen. Vi endrer ikke kjernen når vi flytter elektroner.'));
    if(moduleId==='m02')return h('div',{class:'lesson-visual'},periodicTable(null,undefined,true));
    if(moduleId==='m03')return h('div',{class:'lesson-visual split-model'},h('div',{},atomDiagram('Na',11),h('p',{class:'diagram-caption'},'Nøytralt natrium')),h('div',{},atomDiagram('Na',10),h('p',{class:'diagram-caption'},'Na⁺ etter at ett elektron er avgitt')));
    if(moduleId==='m04'){
      if(skillId==='bond.metallic')return metalDiagram();
      return h('div',{class:'lesson-visual'},moleculeDiagram(moleculeById.water.expandedGraph),h('p',{class:'diagram-caption'},'Hele linjer viser elektronparbindinger. I denne strukturtegningen er form ikke poenget.'));
    }
    if(moduleId==='m05')return h('div',{class:'lesson-visual'},geometryDiagram(skillId==='polarity.shape'?'carbon-dioxide':'water',true));
    if(moduleId==='m06')return boilingDiagram(false);
    if(moduleId==='m07')return h('div',{class:'lesson-visual'},moleculeDiagram(moleculeById[skillId==='carbon.isomers'?'isobutane':'ethene'].expandedGraph),h('p',{class:'diagram-caption'},skillId==='carbon.isomers'?'Isobutan har en forgrenet karbonkjede.':'Eten har en dobbeltbinding mellom karbonatomene. Hver karbon har samlet bindingsorden fire.'));
    if(moduleId==='m08')return h('div',{class:'lesson-visual'},questionDiagram(skillId==='acid.structures'?'ethanoic-acid-full':'ethanol-full',skillId==='acid.structures'?['c2','o1','o2','h-o2-1']:['o1','h-o1-1']));
    if(moduleId==='m09')return h('div',{class:'lesson-visual'},fattyDiagram());
    if(skillId==='apply.soap')return h('div',{class:'lesson-visual'},soapDiagram(),h('p',{class:'diagram-caption'},'Tilleggsmodell: ladde COO⁻-hoder mot vannet og hydrokarbonhaler mot oljen.'));
    return h('div',{class:'explanation-chain'},['Struktur','Krefter','Egenskap'].map((text,i)=>h('div',{},h('span',{class:'step-number'},i+1),h('strong',{},text))));
  }
  export function metalDiagram():HTMLElement {
    const s=svg('svg',{viewBox:'0 0 500 230',role:'img','aria-label':'Forenklet metallmodell med positive metallioner og elektroner mellom dem.'});
    for(let row=0;row<3;row++)for(let col=0;col<5;col++){const x=72+col*90,y=45+row*70;s.append(svg('circle',{cx:x,cy:y,r:22,class:'metal-ion'}),svg('text',{x,y:y+6,'text-anchor':'middle',class:'atom-symbol'},'+'));}
    for(let i=0;i<22;i++)s.append(svg('circle',{cx:35+((i*71)%425),cy:30+((i*43)%175),r:4,class:'electron'}));
    return h('div',{class:'lesson-visual'},s,h('p',{class:'diagram-caption'},'Metallionene vibrerer rundt plasser i fast metall. Delokaliserte elektroner kan bevege seg gjennom stoffet.'));
  }
  export function boilingDiagram(boiling:boolean):HTMLElement {
    const s=svg('svg',{viewBox:'0 0 560 280',role:'img','aria-label':boiling?'Fire hele vannmolekyler med god avstand. O–H-bindingene er beholdt.':'Fire hele vannmolekyler nær hverandre. Stiplede linjer mellom molekyler viser hydrogenbindinger.'});
    const positions=boiling?[[83,57],[310,42],[440,175],[142,203]]:[[118,95],[255,95],[255,210],[392,210]];
    if(!boiling){s.append(svg('line',{x1:positions[0][0]+37,y1:positions[0][1]+20,x2:positions[1][0],y2:positions[1][1],class:'hydrogen-bond'}),svg('line',{x1:positions[2][0]+37,y1:positions[2][1]+20,x2:positions[3][0],y2:positions[3][1],class:'hydrogen-bond'}));}
    for(const [x,y] of positions){const g=svg('g',{transform:`translate(${x},${y})`,class:'water-unit'});g.append(svg('line',{x1:0,y1:0,x2:-37,y2:20,class:'bond'}),svg('line',{x1:0,y1:0,x2:37,y2:20,class:'bond'}));for(const a of [{e:'O',x:0,y:0,r:18},{e:'H',x:-37,y:20,r:12},{e:'H',x:37,y:20,r:12}])g.append(svg('g',{class:'atom-node element-'+a.e,transform:`translate(${a.x},${a.y})`},svg('circle',{r:a.r}),svg('text',{y:5,'text-anchor':'middle',class:'atom-symbol'},a.e)));s.append(g);}
    return h('div',{class:'boiling-model'+(boiling?' boiling':'')},s,h('p',{class:'diagram-caption'},boiling?'Molekylene er fortsatt hele. Ved vanlig koking brytes ikke O–H-bindingene.':'Hele linjer inni molekylene. Stiplede hydrogenbindinger fra H i ett molekyl til O i et annet.'));
  }
}
