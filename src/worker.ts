import { analyze } from './dsp';
import { generateChart, type Analysis } from './chart';
let analysis:Analysis|undefined;
self.onmessage=(event:MessageEvent)=>{
  try {
    const {samples,sr,difficulty,bpm,offset,id}=event.data;
    if(samples)analysis=analyze(samples,sr);
    if(!analysis)throw new Error('Load a track first');
    self.postMessage({id,chart:generateChart(analysis,difficulty,bpm??analysis.bpm,offset??analysis.offset),confidence:analysis.confidence.score});
  }catch(error){self.postMessage({id:event.data.id,error:error instanceof Error?error.message:'Analysis failed'});}
};
