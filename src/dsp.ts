export type Onset = { t: number; strength: number; bands: number[] };
export const median = (a: number[]) => { const s = [...a].sort((a,b)=>a-b); return s.length ? (s[Math.floor(s.length/2)] + s[Math.ceil(s.length/2)-1])/2 : 0; };
export function fft(re: Float64Array, im = new Float64Array(re.length)) {
  const n = re.length;
  if (n < 2 || (n & (n-1))) throw new Error('FFT requires power of two');
  for (let i=1,j=0;i<n;i++) {
    let bit=n>>1; for (;j&bit;bit>>=1) j^=bit; j^=bit;
    if(i<j) { [re[i],re[j]]=[re[j],re[i]]; [im[i],im[j]]=[im[j],im[i]]; }
  }
  for(let len=2;len<=n;len*=2) for(let i=0;i<n;i+=len) for(let j=0;j<len/2;j++) {
    const a=-2*Math.PI*j/len, c=Math.cos(a), s=Math.sin(a), k=i+j, h=k+len/2;
    const r=re[h]*c-im[h]*s, v=re[h]*s+im[h]*c;
    re[h]=re[k]-r; im[h]=im[k]-v; re[k]+=r; im[k]+=v;
  }
  return {re,im};
}
export function onsetEnvelope(samples: Float32Array, sr: number) {
  const size=1024, hop=Math.round(sr/200), values:number[]=[], bands:number[][]=[];
  let prev=new Float64Array(size/2);
  for(let center=0;center<samples.length;center+=hop) {
    const re=new Float64Array(size);
    for(let j=0;j<size;j++) re[j]=(samples[center+j-size/2]??0)*(.5-.5*Math.cos(2*Math.PI*j/(size-1)));
    const {im}=fft(re), next=new Float64Array(size/2), b=[0,0,0];
    for(let j=1;j<size/2;j++) {
      next[j]=Math.log1p(Math.hypot(re[j],im[j]));
      b[j*sr/size<250?0:j*sr/size<2500?1:2]+=Math.max(0,next[j]-prev[j]);
    }
    prev=next; bands.push(b); values.push(b.reduce((a,v)=>a+v,0));
  }
  return {values,bands,hopSeconds:hop/sr};
}
export type Envelope = ReturnType<typeof onsetEnvelope>;
export function peakPick(e:Envelope):Onset[] {
  const result:Onset[]=[];
  const max=Math.max(...e.values);
  for(let i=1;i<e.values.length-1;i++) {
    const local=e.values.slice(Math.max(0,i-20),i+21), m=median(local), mad=median(local.map(v=>Math.abs(v-m)));
    const v=e.values[i];
    if(v>m+3*mad && v>max*.025 && v>=e.values[i-1] && v>e.values[i+1]) {
      const p={t:i*e.hopSeconds,strength:v,bands:e.bands[i]};
      if(result.length && p.t-result.at(-1)!.t<.06) { if(v>result.at(-1)!.strength) result[result.length-1]=p; }
      else result.push(p);
    }
  }
  return result;
}
export function foldTempo(bpm:number) { while(bpm<80)bpm*=2; while(bpm>=160)bpm/=2; return bpm; }
export function estimateTempo(e:Envelope) {
  const a=e.values, scores:number[]=[];
  const corr=(lag:number)=>{let sum=0,norm=0; for(let i=Math.ceil(lag);i<a.length;i++){const j=i-lag,k=Math.floor(j),v=a[k]*(1-j+k)+(a[k+1]??0)*(j-k);sum+=a[i]*v;norm+=a[i]*a[i];}return sum/(norm||1);};
  let best=0,bpm=120;
  for(let t=80;t<160;t+=.1) {const lag=60/t/e.hopSeconds; const s=(corr(lag)+.4*corr(2*lag)+.15*corr(lag/2))*Math.exp(-.5*(Math.log2(t/120)/.9)**2); scores.push(s);if(s>best){best=s;bpm=t;}}
  // Resolve sub-frame lag quantization using whole-track phase coherence,
  // within one BPM of the autocorrelation solution (no DP feedback).
  const peaks=peakPick(e); let coherence=-1, refined=bpm;
  for(let t=Math.max(80,bpm-1);t<Math.min(160,bpm+1);t+=.01){
    let c=0,s=0,c2=0,s2=0;for(const p of peaks){const phase=2*Math.PI*p.t*t/60;c+=p.strength*Math.cos(phase);s+=p.strength*Math.sin(phase);c2+=p.strength*Math.cos(2*phase);s2+=p.strength*Math.sin(2*phase);}
    const value=Math.hypot(c,s)+.5*Math.hypot(c2,s2);if(value>coherence){coherence=value;refined=t;}
  }
  return {bpm:refined, prominence:Math.max(0,(best-median(scores))/(best||1))};
}
export function trackBeats(e:Envelope,bpm:number) {
  const period=60/bpm/e.hopSeconds, n=e.values.length, score=new Float64Array(n), back=new Int32Array(n).fill(-1);
  const max=Math.max(...e.values)||1;
  for(let i=0;i<n;i++) {
    let best=0;
    for(let d=Math.floor(period*.65);d<=period*1.4;d++) if(i>=d) {
      const s=score[i-d]-8*Math.log(d/period)**2;
      if(s>best){best=s;back[i]=i-d;}
    }
    score[i]=best+e.values[i]/max;
  }
  let end=Math.max(0,n-1);
  for(let i=Math.max(0,n-Math.ceil(period*1.5));i<n;i++)if(score[i]>score[end])end=i;
  const beats:number[]=[];for(let i=end;i>=0;i=back[i]){beats.push(i*e.hopSeconds);if(back[i]<0)break;}
  return beats.reverse();
}
export function confidence(prominence:number, bpm:number, beats:number[]) {
  const dp=60/median(beats.slice(1).map((v,i)=>v-beats[i]));
  const agreement=Number.isFinite(dp)?Math.abs(dp-bpm)/bpm:1;
  const intervals=beats.slice(1).map((v,i)=>v-beats[i]), jitter=median(intervals.map(v=>Math.abs(v-60/bpm)))/(60/bpm);
  return {score:Math.max(0,Math.min(1,prominence*(1-Math.min(1,agreement*10))*(1-Math.min(1,jitter*10)))),dpBpm:dp,agreement};
}
export function analyze(samples:Float32Array,sr:number) {
  if(sr<=0 || !Number.isFinite(sr) || samples.length/sr>360)throw new Error('Tracks must be at most 6 minutes');
  const envelope=onsetEnvelope(samples,sr), onsets=peakPick(envelope), tempo=estimateTempo(envelope), beats=trackBeats(envelope,tempo.bpm);
  const period=60/tempo.bpm;
  const phases=beats.map(t=>2*Math.PI*t/period);
  let offset=Math.atan2(phases.reduce((s,v)=>s+Math.sin(v),0),phases.reduce((s,v)=>s+Math.cos(v),0))*period/(2*Math.PI);
  if(offset<0)offset+=period;
  // Equal alternating pulses cannot establish a downbeat. Anchor that
  // ambiguity to the first detected event, reproducibly.
  if(onsets.length && Math.abs(((onsets[0].t-offset+period*2)%period)-period/2)<.03) offset=(offset+period/2)%period;
  let hash=2166136261; for(const v of samples)hash=Math.imul(hash^Math.round(v*32767),16777619);
  return {envelope,onsets,beats,bpm:tempo.bpm,offset,duration:samples.length/sr,hash:hash>>>0,confidence:confidence(tempo.prominence,tempo.bpm,beats)};
}

