import type { Note, generateChart } from './chart';
export type Chart = ReturnType<typeof generateChart>;
export function audioTime(current:number,start:number,base=0,output=0,calibration=0) {
  return (current-start-base-output)*1000-calibration;
}
export function judgment(delta:number) { return Math.abs(delta)<=45?'Perfect':Math.abs(delta)<=90?'Great':'Miss'; }
export function calibrationMedian(offsets:number[]) {
  const sorted=[...offsets].sort((a,b)=>a-b), mid=Math.floor(sorted.length/2);
  return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;
}
export class Session {
  done=new Set<number>(); score=0; combo=0; best=0; perfect=0; great=0; misses=0;
  constructor(public notes:Note[],private clock:()=>number){}
  expire() { const now=this.clock(); this.notes.forEach((n,i)=>{if(!this.done.has(i)&&now-n.t>90){this.done.add(i);this.miss();}}); }
  miss(){this.misses++;this.combo=0;return 'Miss';}
  press(lane:number) {
    this.expire(); const now=this.clock();
    const i=this.notes.findIndex((n,i)=>n.lane===lane&&!this.done.has(i)&&Math.abs(now-n.t)<=90);
    if(i<0)return this.miss();
    this.done.add(i);const result=judgment(now-this.notes[i].t);
    if(result==='Perfect'){this.perfect++;this.score+=1000;}else{this.great++;this.score+=500;}
    this.combo++;this.best=Math.max(this.best,this.combo);return result;
  }
}
export function validChart(value:unknown):value is Chart {
  if(!value||typeof value!=='object')return false;
  const c=value as Chart;
  return c.version===1&&typeof c.trackName==='string'&&Number.isFinite(c.durationMs)&&c.durationMs>0&&c.durationMs<=360000&&Number.isFinite(c.bpm)&&c.bpm>0&&Number.isFinite(c.offsetMs)&&['Normal','Easy'].includes(c.difficulty)&&!!c.generatorParams&&Number.isFinite(c.generatorParams.seed)&&Array.isArray(c.notes)&&c.notes.every((n,i)=>Number.isInteger(n.t)&&n.t>=0&&n.t<c.durationMs&&Number.isInteger(n.lane)&&n.lane>=0&&n.lane<4&&(i===0||n.t>=c.notes[i-1].t));
}
