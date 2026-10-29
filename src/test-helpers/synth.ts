export function synth(bpm:number,kind:'click'|'drums'|'syncopated'|'drone'|'noise'='click',seed=1,seconds=24) {
  const sr=44100, samples=new Float32Array(sr*seconds),onsets:number[]=[];
  let state=seed>>>0;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296*2-1;};
  const beat=60/bpm,step=kind==='click'?beat:beat/2;
  for(let t=.12,i=0;t<seconds-.15;t+=step,i++) {
    onsets.push(t);const start=Math.round(t*sr);
    let lp=0,prev=0,phase=0;
    for(let j=0;j<sr*.12&&start+j<samples.length;j++){
      const x=j/sr,noise=random();lp+=.25*(noise-lp);const hp=noise-prev;prev=noise;
      phase+=2*Math.PI*(45+110*Math.exp(-x*40))/sr;
      const kick=Math.sin(phase)*Math.exp(-x*35);
      const snare=(noise-lp)*Math.exp(-x*45);
      const hat=hp*Math.exp(-x*150)*.2;
      const v=kind==='click'?Math.sin(2*Math.PI*1800*x)*Math.exp(-x*250):hat+(i%4===0||(kind==='syncopated'&&i%8===3)?kick*.8:0)+(i%4===2?snare*.6:0);
      samples[start+j]+=v;
    }
  }
  if(kind==='drone')for(let i=0;i<samples.length;i++)samples[i]+=.18*Math.sin(2*Math.PI*82.41*i/sr);
  if(kind==='noise'){
    let energy=0;for(const v of samples)energy+=v*v;
    const amplitude=Math.sqrt(energy/samples.length/10)*Math.sqrt(3);
    for(let i=0;i<samples.length;i++)samples[i]+=random()*amplitude;
  }
  return {samples,sr,onsets,offset:.12,bpm};
}
