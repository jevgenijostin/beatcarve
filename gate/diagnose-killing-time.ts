import {spawnSync} from 'node:child_process';
import {writeFileSync,unlinkSync} from 'node:fs';
import {analyze,median} from '../src/dsp.ts';
// Pin the pre-fix generator so this diagnosis remains reproducible after the fix.
const baseline=spawnSync('git',['show','12d89a0fbb28637e7fee5546f5341cd9f991e0af:src/chart.ts'],{encoding:'utf8'});
if(baseline.status!==0)throw Error(baseline.stderr);
writeFileSync('gate/.diagnosis-baseline-chart.ts',baseline.stdout.replaceAll("'./dsp.ts'","'../src/dsp.ts'"));
const {generateChart}=await import('./.diagnosis-baseline-chart.ts');
unlinkSync('gate/.diagnosis-baseline-chart.ts');
const file='gate/tracks/Killing Time.mp3',sr=22050;
const duration=Number(spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file],{encoding:'utf8'}).stdout);
const out=[];
for(const [label,start,len] of [['first',0,90],['middle',duration/2-30,60]] as const){
 const r=spawnSync('ffmpeg',['-v','error','-ss',String(start),'-i',file,'-t',String(len),'-ac','1','-ar',String(sr),'-f','f32le','pipe:1'],{maxBuffer:100e6});
 if(r.status!==0)throw Error(r.stderr.toString());
 const a=analyze(Float32Array.from({length:r.stdout.length/4},(_,i)=>r.stdout.readFloatLE(i*4)),sr);
 const s=a.onsets.map(o=>o.strength).sort((x,y)=>x-y),m=median(s),top=s[Math.floor(s.length*.9)],p=60/a.bpm;
 const candidates=a.onsets.filter(o=>o.strength>=m*.7).map(o=>{
 const eighth=a.offset+Math.round((o.t-a.offset)/(p/2))*p/2;
 const sixteenth=a.offset+Math.round((o.t-a.offset)/(p/4))*p/4;
 const t=Math.round((o.strength>=top&&Math.abs(sixteenth-o.t)<=.03?sixteenth:eighth)*1000)/1000;
 return {...o,source:o.t,t};
 }).filter(o=>o.t>=0&&o.t<a.duration&&a.onsets.some(q=>Math.abs(q.t-o.t)<=.06));
 const notes=generateChart(a).notes.map(n=>{
 const source=candidates.filter(o=>Math.abs(o.t-n.t/1000)<1e-8).sort((x,y)=>y.strength-x.strength)[0];
 const nearest=a.onsets.filter(o=>o.strength>m).sort((x,y)=>Math.abs(x.t-n.t/1000)-Math.abs(y.t-n.t/1000))[0];
 return {t:n.t/1000,source:source.source,sourceStrength:source.strength,sourceSalient:source.strength>m,displacementMs:(n.t/1000-source.source)*1000,nearestSalientMs:Math.abs(nearest.t-n.t/1000)*1000,pass:Math.abs(nearest.t-n.t/1000)<=.04};
 });
 const thirds=[];
 for(let k=0;k<3;k++){
 const points=a.onsets.filter(o=>o.t>=k*len/3&&o.t<(k+1)*len/3);
 const modes=[];
 for(const modulus of [p,p/2,p/4]){
 let best=-Infinity,phase=0;
 for(let shift=-modulus/2;shift<modulus/2;shift+=.001){
 const score=points.reduce((sum,o)=>{const d=((o.t-a.offset-shift+modulus*100+modulus/2)%modulus)-modulus/2;return sum+o.strength*Math.exp(-.5*(d/.025)**2)},0);
 if(score>best){best=score;phase=shift;}
 }modes.push({periodMs:modulus*1000,phaseMs:phase*1000});
 }thirds.push({onsets:points.length,modes});
 }
 out.push({label,start,bpm:a.bpm,offset:a.offset,onsets:a.onsets.length,medianStrength:m,notes:notes.length,passes:notes.filter(n=>n.pass).length,missesWeakSource:notes.filter(n=>!n.pass&&!n.sourceSalient).length,missesSalientSource:notes.filter(n=>!n.pass&&n.sourceSalient).length,sourceOver60ms:notes.filter(n=>Math.abs(n.displacementMs)>60).length,thirds,noteTrace:notes,onsetTrace:a.onsets});
}
writeFileSync('gate/killing-time-diagnosis.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out.map(row=>Object.fromEntries(Object.entries(row).filter(([key])=>!['noteTrace','onsetTrace'].includes(key)))),null,2));
