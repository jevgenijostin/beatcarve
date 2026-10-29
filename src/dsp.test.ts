import { describe,it,expect } from 'vitest';
import { analyze,fft,foldTempo } from './dsp.ts';
import { generateChart } from './chart.ts';
import { synth } from './test-helpers/synth.ts';
describe('headless pipeline',()=>{
  it('FFT resolves a bin-centered sinusoid',()=>{const x=Float64Array.from({length:1024},(_,i)=>Math.sin(2*Math.PI*8*i/1024));const f=fft(x);expect(Math.abs(f.im[8])).toBeCloseTo(512,6);});
  for(const bpm of [70,90,120,128,140,170])it('click '+bpm+': folded tempo ±1 BPM, offset ±20 ms',()=>{
    const f=synth(bpm),a=analyze(f.samples,f.sr),p=60/a.bpm;
    expect(a.bpm).toBeCloseTo(foldTempo(bpm),0);
    expect(Math.abs(a.bpm-foldTempo(bpm))).toBeLessThanOrEqual(1);
    expect(Math.min(Math.abs(a.offset-f.offset),Math.abs(a.offset-f.offset-p),Math.abs(a.offset-f.offset+p))).toBeLessThanOrEqual(.02);
  });
  for(const kind of ['drums','syncopated','drone','noise'] as const)it(kind+': onset F1 ≥ '+(kind==='noise'||kind==='drone'?'.80':'.90'),()=>{
    const f=synth(128,kind),a=analyze(f.samples,f.sr);
    const used=new Set<number>();let matched=0;
    for(const o of a.onsets){const i=f.onsets.findIndex((t,i)=>!used.has(i)&&Math.abs(t-o.t)<=.05);if(i>=0){used.add(i);matched++;}}
    expect(2*matched/(a.onsets.length+f.onsets.length)).toBeGreaterThanOrEqual(kind==='noise'||kind==='drone'?.8:.9);
  });
  for(const seed of [1,7,42])for(const kind of ['click','drums','syncopated','drone','noise'] as const)it(kind+' seed '+seed+': chart invariants and determinism',()=>{
    const f=synth(128,kind,seed),a=analyze(f.samples,f.sr);
    const normal=generateChart(a),easy=generateChart(a,'Easy');
    expect(generateChart(analyze(f.samples,f.sr))).toEqual(normal);
    expect(easy.notes.length).toBeLessThan(normal.notes.length);
    for(const chart of [normal,easy]){
      const {notes,generatorParams:p}=chart;
      expect(new Set(notes.map(n=>n.t+':'+n.lane)).size).toBe(notes.length);
      notes.forEach((n,i)=>{
        expect(n.t).toBeGreaterThanOrEqual(0);expect(n.t).toBeLessThan(chart.durationMs);
        if(i)expect(n.t).toBeGreaterThanOrEqual(notes[i-1].t);
        const prev=notes.slice(0,i).reverse().find(x=>x.lane===n.lane);
        if(prev)expect(n.t-prev.t).toBeGreaterThanOrEqual(p.sameLaneGapMs);
        expect(notes.filter(x=>x.t>=n.t&&x.t<n.t+1000).length).toBeLessThanOrEqual(p.cap);
        expect(notes.filter(x=>x.t===n.t).length).toBeLessThanOrEqual(2);
      });
    }
  });
});

