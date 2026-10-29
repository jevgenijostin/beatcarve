import { median } from './dsp.ts';
import type { analyze } from './dsp.ts';
export type Analysis=ReturnType<typeof analyze>;
export type Note={t:number;lane:number};
export function generateChart(a:Analysis,difficulty:'Normal'|'Easy'='Normal',bpm=a.bpm,offset=a.offset) {
  const cap=difficulty==='Easy'?3:5,gap=difficulty==='Easy'?.25:.15,period=60/bpm;
  const strengths=a.onsets.map(o=>o.strength).sort((x,y)=>x-y), threshold=difficulty==='Easy'?strengths[Math.floor(strengths.length*.65)]??0:median(strengths)*.7;
  const candidates=a.onsets.filter(o=>o.strength>=threshold).map(o=>{
    const eighth=offset+Math.round((o.t-offset)/(period/2))*period/2;
    const sixteenth=offset+Math.round((o.t-offset)/(period/4))*period/4;
    const t=o.strength>=(strengths[Math.floor(strengths.length*.9)]??Infinity)&&Math.abs(sixteenth-o.t)<=.03?sixteenth:eighth;
    return {...o,t:Math.round(t*1000)/1000};
  }).filter(o=>o.t>=0&&o.t<a.duration&&a.onsets.some(p=>Math.abs(p.t-o.t)<=.06));
  const retained:typeof candidates=[];
  for(const o of candidates.sort((x,y)=>y.strength-x.strength||x.t-y.t)) {
    if(retained.some(p=>Math.abs(p.t-o.t)<.001))continue;
    const times=[...retained.map(p=>p.t),o.t].sort((x,y)=>x-y);
    if(times.some((t,i)=>i>=cap&&t-times[i-cap]<1-1e-9))continue;
    retained.push(o);
  }
  const notes:Note[]=[],counts=[0,0,0,0],last=[-Infinity,-Infinity,-Infinity,-Infinity];
  for(const o of retained.sort((x,y)=>x.t-y.t)) {
    const band=o.bands.indexOf(Math.max(...o.bands)),preferred=band===0?[0,1]:band===1?[1,2]:[2,3];
    const lanes=[0,1,2,3].filter(l=>o.t-last[l]>=gap-1e-9&&!(notes.length>=3&&notes.slice(-3).every(n=>n.lane===l)));
    lanes.sort((x,y)=>(counts[x]-counts[y])*2+(preferred.includes(y)?1:0)-(preferred.includes(x)?1:0)+((x+(a.hash%4))%4-(y+(a.hash%4))%4)*.01);
    if(!lanes.length)continue;
    const lane=lanes[0];notes.push({t:Math.round(o.t*1000),lane});last[lane]=o.t;counts[lane]++;
  }
  // Chord notes count toward density and toward the full chord-note share.
  let chordNotes=0;
  for(const o of retained.sort((x,y)=>y.strength-x.strength)) {
    if(o.strength<(strengths[Math.floor(strengths.length*.9)]??Infinity)||o.bands[0]<Math.max(...o.bands)*.15||o.bands[2]<Math.max(...o.bands)*.15)continue;
    const t=Math.round(o.t*1000), existing=notes.find(n=>n.t===t);
    if(!existing||(chordNotes+2)/(notes.length+1)>.08)continue;
    const lane=[0,1,2,3].filter(l=>l!==existing.lane&&notes.every(n=>n.lane!==l||Math.abs(n.t-t)>=gap*1000)).sort((x,y)=>counts[x]-counts[y])[0];
    if(lane===undefined)continue;
    const proposed=[...notes,{t,lane}].sort((x,y)=>x.t-y.t||x.lane-y.lane);
    if(proposed.some((n,i)=>i>=cap&&n.t-proposed[i-cap].t<1000))continue;
    if(proposed.some((n,i)=>i>=3&&proposed.slice(i-3,i).every(p=>p.lane===n.lane)))continue;
    notes.splice(0,notes.length,...proposed);counts[lane]++;chordNotes+=2;
  }
  return {version:1,trackName:'',durationMs:Math.round(a.duration*1000),bpm,offsetMs:offset*1000,difficulty,notes,generatorParams:{cap,sameLaneGapMs:gap*1000,chordCap:.08,seed:a.hash}};
}
