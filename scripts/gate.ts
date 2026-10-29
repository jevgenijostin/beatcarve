import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { analyze,foldTempo,median } from '../src/dsp.ts';
import { generateChart } from '../src/chart.ts';
import { tracks } from './fetch-gate-tracks.ts';
import type { Analysis,Note } from '../src/chart.ts';

const sr=22050;
function decode(file:string,start:number,length:number){
  const r=spawnSync('ffmpeg',['-v','error','-ss',String(start),'-i',file,'-t',String(length),'-ac','1','-ar',String(sr),'-f','f32le','pipe:1'],{maxBuffer:100*1024*1024});
  if(r.error||r.status!==0)throw new Error(r.error?.message||r.stderr.toString());
  const samples=new Float32Array(r.stdout.length/4);
  for(let i=0;i<samples.length;i++)samples[i]=r.stdout.readFloatLE(i*4);
  if(samples.length<sr)throw new Error('Decoded audio is empty or too short');
  return samples;
}
function duration(file:string){
  const r=spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file],{encoding:'utf8'});
  if(r.error||r.status!==0||!Number.isFinite(Number(r.stdout)))throw new Error('Cannot probe '+file);
  return Number(r.stdout);
}
function overlay(samples:Float32Array,a:Analysis,notes:Note[]){
  const out=Float32Array.from(samples,v=>v*.55);
  const click=(t:number,f:number,amp:number)=>{for(let j=0;j<sr*.035;j++){const i=Math.round(t*sr)+j;if(i>=0&&i<out.length)out[i]+=amp*Math.sin(2*Math.PI*f*j/sr)*Math.exp(-j/(sr*.008));}};
  a.beats.forEach(t=>click(t,1600,.22));notes.forEach(n=>click(n.t/1000,600+n.lane*100,.17));
  const wav=Buffer.alloc(44+out.length*2);
  wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(sr,24);wav.writeUInt32LE(sr*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(out.length*2,40);
  out.forEach((v,i)=>wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2));return wav;
}
export function metrics(a:Analysis,notes:Note[],known:number,sparse:boolean) {
  const strengths=a.onsets.map(o=>o.strength).sort((x,y)=>x-y),top=a.onsets.filter(o=>o.strength>=(strengths[Math.floor(strengths.length*.9)]??Infinity)),salient=a.onsets.filter(o=>o.strength>median(strengths));
  const near=(t:number,times:number[],tol:number)=>times.some(x=>Math.abs(t-x)<=tol);
  const coverage=top.filter(o=>near(o.t,notes.map(n=>n.t/1000),.06)).length/(top.length||1);
  const precision=notes.filter(n=>near(n.t/1000,salient.map(o=>o.t),.04)).length/(notes.length||1);
  const period=60/a.bpm,phases:number[]=[];
  for(let third=0;third<3;third++){
    const points=a.onsets.filter(o=>o.t>=third*a.duration/3&&o.t<(third+1)*a.duration/3);
    let best=-Infinity,phase=0;
    for(let shift=-period/2;shift<period/2;shift+=.001){
      let score=0;
      for(const p of points){const d=Math.abs(((p.t-a.offset-shift+period*100)%period+period/2)%period-period/2);score+=p.strength*Math.exp(-.5*(d/.025)**2);}
      if(score>best){best=score;phase=shift;}
    }phases.push(phase);
  }
  const circular=(x:number,y:number)=>Math.abs(((x-y+period*100+period/2)%period)-period/2);
  const drift=Math.max(...phases.flatMap(x=>phases.map(y=>circular(x,y))))*1000;
  let windows=0,good=0,maxDensity=0;
  for(let t=0;t<=a.duration-1;t+=.1){const n=notes.filter(n=>n.t>=t*1000&&n.t<(t+1)*1000).length;windows++;if(n>=.8&&n<=5)good++;maxDensity=Math.max(maxDensity,n);}
  let run=0,maxRun=0,lastLane=-1,minGap=Infinity;const last=[-Infinity,-Infinity,-Infinity,-Infinity],counts=[0,0,0,0],groups=new Map<number,number>();
  for(const n of notes){run=n.lane===lastLane?run+1:1;maxRun=Math.max(maxRun,run);lastLane=n.lane;minGap=Math.min(minGap,n.t-last[n.lane]);last[n.lane]=n.t;counts[n.lane]++;groups.set(n.t,(groups.get(n.t)??0)+1);}
  const chordShare=[...groups.values()].filter(n=>n>1).reduce((s,n)=>s+n,0)/(notes.length||1),maxChord=Math.max(0,...groups.values()),shares=counts.map(n=>n/(notes.length||1));
  const error=Math.abs(foldTempo(a.bpm)-foldTempo(known));
  const rows=[
    {check:'Tempo error (BPM)',value:error,pass:error<=2},
    {check:'Estimator disagreement (%)',value:a.confidence.agreement*100,pass:a.confidence.agreement<=.02},
    {check:'Thirds phase drift (ms)',value:drift,pass:drift<=30},
    {check:'Top-decile coverage (%)',value:coverage*100,pass:coverage>=.7},
    {check:'Salient-note precision (%)',value:precision*100,pass:precision>=.8},
    {check:'Density-valid windows (%)',value:good/windows*100,pass:good/windows>=.9&&maxDensity<=5},
    {check:'Max same-lane run',value:maxRun,pass:maxRun<=3},
    {check:'Min same-lane gap (ms)',value:Number.isFinite(minGap)?minGap:0,pass:minGap>=150},
    {check:'Chord share (%)',value:chordShare*100,pass:chordShare<=.1},
    {check:'Max chord',value:maxChord,pass:maxChord<=2},
    {check:'Min lane share (%)',value:Math.min(...shares)*100,pass:Math.min(...shares)>=.12},
    {check:'Max lane share (%)',value:Math.max(...shares)*100,pass:Math.max(...shares)<=.4},
    {check:'Confidence',value:a.confidence.score,pass:sparse?a.confidence.score<.5:a.confidence.score>=.5},
  ];
  return {bpm:a.bpm,dpBpm:a.confidence.dpBpm,knownBpm:known,octaveFolded:known!==foldTempo(known),offsetMs:a.offset*1000,notes:notes.length,phasesMs:phases.map(v=>v*1000),maxDensity,rows,pass:rows.every(r=>r.pass)};
}
async function main(){
  const final=process.argv.includes('--final'),selected=tracks.filter(t=>final||t.role==='tuning');
  const results=[];
  await mkdir('gate/artifacts',{recursive:true});
  for(const t of selected){
    const path='gate/tracks/'+t.file,hash=createHash('sha256').update(await readFile(path)).digest('hex');
    if(hash!==t.sha256)throw new Error('Checksum mismatch: '+t.name);
    const length=duration(path),excerpts=[];
    for(const [label,start,len] of [['first',0,90],['middle',Math.max(0,length/2-30),60]] as const){
      const samples=decode(path,start,len),begin=performance.now(),a=analyze(samples,sr),chart=generateChart(a);
      chart.trackName=t.name;
      const measured=metrics(a,chart.notes,t.bpm,t.category==='sparse');
      const stem='gate/artifacts/'+t.name.replaceAll(' ','-')+'-'+label;
      await writeFile(stem+'.wav',overlay(samples,a,chart.notes));
      await writeFile(stem+'.json',JSON.stringify({...chart,excerptStartSeconds:start},null,2));
      const plot=['One character = 250 ms; X = note; . = empty',...Array.from({length:4},(_,lane)=>'Lane '+lane+' '+Array.from({length:Math.ceil(a.duration*4)},(_,i)=>chart.notes.some(n=>n.lane===lane&&Math.floor(n.t/250)===i)?'X':'.').join(''))];
      for(let sec=0;sec<a.duration;sec+=5)plot.push(sec+'s '+ '#'.repeat(chart.notes.filter(n=>n.t>=sec*1000&&n.t<(sec+5)*1000).length));
      await writeFile(stem+'.txt',plot.join('\n'));
      excerpts.push({label,start,duration:a.duration,elapsedMs:performance.now()-begin,artifacts:stem,...measured});
      console.log(t.name,label,measured.bpm.toFixed(2),measured.rows.filter(r=>!r.pass).map(r=>r.check).join(', '));
    }
    results.push({track:t,excerpts,pass:excerpts.every(e=>e.pass)});
  }
  await writeFile('gate/'+(final?'final':'tuning')+'-results.json',JSON.stringify({at:new Date().toISOString(),final,results},null,2));
}
if(process.argv[1]?.endsWith('gate.ts'))await main().catch(async e=>{
  await mkdir('gate',{recursive:true});
  await writeFile('gate/BLOCKED.txt','NOT RUN: BLOCKED\n'+String(e));console.error(e);process.exitCode=1;
});
