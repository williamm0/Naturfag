namespace KL {
  export function normalizeTerm(s:string):string {return s.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('nb');}
  export function parseNumber(value:unknown):number|null {
    if(typeof value!=='string' && typeof value!=='number') return null;
    const s=String(value).trim().replace(/−/g,'-').replace(',','.');
    if(!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(s)) return null;
    const n=Number(s);return Number.isFinite(n)?n:null;
  }
  export function parseFormula(value:unknown):Record<string,number>|null {
    if(typeof value!=='string' || value.length>200) return null;
    const s=value.replace(/[₀-₉]/g,c=>String('₀₁₂₃₄₅₆₇₈₉'.indexOf(c))).replace(/\s+/g,'');
    if(!s || !/^(?:[A-Z][a-z]?\d*)+$/.test(s)) return null;
    const result:Record<string,number>={};
    for(const m of s.matchAll(/([A-Z][a-z]?)(\d*)/g)){
      const n=m[2]?Number(m[2]):1;
      if(!Number.isSafeInteger(n)||n<1||n>10000) return null;
      result[m[1]]=(result[m[1]]||0)+n;
    }
    return result;
  }
  function sameCounts(a:Record<string,number>,b:Record<string,number>):boolean {
    return Object.keys(a).length===Object.keys(b).length && Object.keys(a).every(k=>a[k]===b[k]);
  }
  export function grade(q:Question,response:unknown):Grade {
    const a=q.answerSpec;
    if(q.kind==='choice') {
      if(typeof response!=='string'||!q.inputSpec.options?.some(o=>o.id===response))return 'invalid_format';
      return response===a.correctOptionId?'correct':'incorrect';
    }
    if(q.kind==='recall') {
      if(typeof response!=='string'&&typeof response!=='number')return 'invalid_format';
      const s=String(response);if(!s.trim())return 'invalid_format';
      const accepted=a.accepted||[];
      if(a.normalization==='number'){
        const n=parseNumber(s);if(n===null)return 'invalid_format';
        return accepted.some(x=>Math.abs(n-Number(x))<1e-8)?'correct':'incorrect';
      }
      if(a.normalization==='formula'){
        const counts=parseFormula(s);if(!counts)return 'invalid_format';
        return accepted.some(x=>{const other=parseFormula(x);return other!==null&&sameCounts(counts,other)})?'correct':'incorrect';
      }
      if(a.normalization==='group_formula'){
        const str=s.trim().replace(/^[–—−-]\s*/,'').replace(/\s/g,'');
        if(!parseFormula(str))return 'invalid_format';
        return accepted.some(x=>x.replace(/^[–—−-]/,'').replace(/\s/g,'')===str)?'correct':'incorrect';
      }
      return accepted.some(x=>normalizeTerm(x)===normalizeTerm(s))?'correct':'needs_self_check';
    }
    if(q.kind==='fields'){
      if(!response||typeof response!=='object'||Array.isArray(response))return 'invalid_format';
      const values=response as Record<string,unknown>;
      for(const field of q.inputSpec.fields||[])if(parseNumber(values[field.id])===null)return 'invalid_format';
      return Object.entries(a.values||{}).every(([k,v])=>Math.abs(parseNumber(values[k])!-v)<1e-8)?'correct':'incorrect';
    }
    if(q.kind==='categorize'){
      if(!response||typeof response!=='object'||Array.isArray(response))return 'invalid_format';
      const values=response as Record<string,unknown>;
      for(const item of q.inputSpec.items||[])if(!q.inputSpec.groups?.some(g=>g.id===values[item.id]))return 'invalid_format';
      return Object.entries(a.assignments||{}).every(([k,v])=>values[k]===v)?'correct':'incorrect';
    }
    if(q.kind==='order'){
      if(!Array.isArray(response)||response.length!==q.inputSpec.items?.length || new Set(response).size!==response.length || !response.every(id=>q.inputSpec.items?.some(i=>i.id===id)))return 'invalid_format';
      return response.every((id,i)=>id===a.orderedIds?.[i])?'correct':'incorrect';
    }
    if(q.kind==='select_parts'){
      if(!Array.isArray(response)||!response.length||!response.every(id=>typeof id==='string'))return 'invalid_format';
      const wanted=a.selectedPartIds||[];
      return new Set(response).size===response.length&&response.length===wanted.length&&response.every(id=>wanted.includes(id))?'correct':'incorrect';
    }
    return 'invalid_format';
  }
  export function answerText(q:Question):string {
    const a=q.answerSpec;
    if(q.kind==='choice')return q.inputSpec.options?.find(o=>o.id===a.correctOptionId)?.text||'';
    if(q.kind==='recall')return a.accepted?.[0]||'';
    if(q.kind==='fields')return (q.inputSpec.fields||[]).map(f=>f.label+': '+a.values?.[f.id]).join(' · ');
    if(q.kind==='order')return (a.orderedIds||[]).map((id,i)=>(i+1)+'. '+q.inputSpec.items?.find(x=>x.id===id)?.text).join('\n');
    if(q.kind==='categorize')return (q.inputSpec.items||[]).map(i=>i.text+': '+q.inputSpec.groups?.find(g=>g.id===a.assignments?.[i.id])?.text).join('\n');
    return 'Se de markerte delene i modellen.';
  }
}
