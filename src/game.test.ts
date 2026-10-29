import { describe, it, expect } from 'vitest';
import { audioTime, calibrationMedian, judgment, Session, validChart } from './game';
describe('audio clock judgment',()=>{
  it.each([[0,'Perfect'],[45,'Perfect'],[-45,'Perfect'],[45.01,'Great'],[90,'Great'],[-90,'Great'],[90.01,'Miss']])('%s ms → %s',(delta,result)=>expect(judgment(Number(delta))).toBe(result));
  it('uses the injected audio clock regardless of frames; consumes each note once',()=>{
    let time=1000;const s=new Session([{t:1000,lane:0},{t:1200,lane:1}],()=>time);
    expect(s.press(0)).toBe('Perfect');expect(s.score).toBe(1000);
    expect(s.press(0)).toBe('Miss');time=1291;s.expire();expect(s.misses).toBe(2);
    expect(audioTime(12,10,.01,.02,30)).toBeCloseTo(1940);
  });
  it('finds median calibration within 5 ms despite outliers',()=>expect(calibrationMedian([40,41,39,42,38,40,41,39,40,42,-200,250,40,41])).toBeCloseTo(40));
  it('round-trips the export schema and rejects invalid notes',()=>{
    const chart={version:1,trackName:'test',durationMs:1000,bpm:120,offsetMs:20,difficulty:'Normal',notes:[{t:120,lane:0}],generatorParams:{seed:1,cap:5,sameLaneGapMs:150,chordCap:.08}};
    expect(validChart(JSON.parse(JSON.stringify(chart)))).toBe(true);
    expect(validChart({...chart,notes:[{t:1000,lane:4}]})).toBe(false);
  });
});
