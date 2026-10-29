import { test, expect } from '@playwright/test';
import { synth } from '../src/test-helpers/synth';
import { validChart } from '../src/game';
function wav(seconds=12){
  const {samples,sr}=synth(120,'click',1,seconds),b=Buffer.alloc(44+samples.length*2);
  b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(samples.length*2,40);
  samples.forEach((v,i)=>b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2));return b;
}
test('local audio → controls → audio-clock play → results → licensed JSON',async({page})=>{
  await page.goto('./?test=1');
  await expect(page.getByText(/Electronic and rock are NOT/)).toBeVisible();
  await page.locator('#file').setInputFiles({name:'click.wav',mimeType:'audio/wav',buffer:wav()});
  await expect(page.locator('#status')).toContainText('Chart ready',{timeout:60000});
  await expect(page.locator('#confidence')).toContainText('%');
  const bpm=Number(await page.locator('#bpm').textContent());
  await page.locator('#double').click();await expect(page.locator('#bpm')).toHaveText((bpm*2).toFixed(2));
  await page.locator('#half').click();await expect(page.locator('#bpm')).toHaveText(bpm.toFixed(2));
  const offset=parseFloat((await page.locator('#offset').textContent())!);
  await page.getByRole('button',{name:'+10 ms',exact:true}).click();await expect(page.locator('#offset')).toHaveText((offset+10).toFixed(1)+' ms');
  const normal=Number(await page.locator('#count').textContent());
  await page.locator('#difficulty').selectOption('Easy');await expect(page.locator('#play')).toBeEnabled();
  expect(Number(await page.locator('#count').textContent())).toBeLessThanOrEqual(normal);
  await page.locator('#export').click();await expect(page.locator('#license-status')).toContainText('Activate');
  await page.locator('#demo').click();await expect(page.locator('#license-status')).toContainText('active');
  const download=page.waitForEvent('download');await page.locator('#export').click();
  const stream=await (await download).createReadStream();let json='';for await(const chunk of stream!)json+=chunk.toString();expect(validChart(JSON.parse(json))).toBe(true);
  await page.locator('#play').click();await expect(page.locator('#game')).toBeVisible();
  const notes=await page.evaluate(()=>window.__beatcarve.chart.notes);
  expect(notes.length).toBeGreaterThanOrEqual(8); for(const n of notes.slice(0,10)){await page.evaluate(t=>window.__beatcarve.setClock(t),n.t);await page.keyboard.press(['d','f','j','k'][n.lane]);}
  expect(await page.evaluate(()=>window.__beatcarve.session.best)).toBe(Math.min(10,notes.length));
  expect(await page.evaluate(()=>window.__beatcarve.session.score)).toBe(Math.min(10,notes.length)*1000);
  await page.evaluate(()=>window.__beatcarve.setClock(-1000));await page.keyboard.press('d');
  await expect(page.locator('#feedback')).toHaveText('Miss');
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await expect(page.locator('#pause')).toHaveText('Resume');
  await page.locator('#pause').click();
  await page.evaluate(()=>window.__beatcarve.setClock(window.__beatcarve.chart.durationMs+200));
  await expect(page.locator('#results')).toBeVisible();await expect(page.locator('#summary')).toContainText('Best combo '+Math.min(10,notes.length));
  await page.reload();await expect(page.locator('#license-status')).toContainText('active');
});
test('calibration completes, persists and resets; long audio rejected',async({page})=>{
  test.setTimeout(90000);await page.goto('./?test=1');await page.locator('#calibrate').click();await page.locator('#cal-start').click();
  for(let i=2;i<16;i++)await page.evaluate(async index=>window.__beatcarve.tapAt(index,35),i);
  await expect(page.locator('#cal-status')).toContainText('Saved');
  const saved=await page.evaluate(()=>localStorage.getItem('beatcarve.calibration.v1'));expect(Number(saved)).toBeGreaterThan(20);expect(Number(saved)).toBeLessThan(70);
  await page.reload();await expect(page.locator('#cal-value')).toContainText(Number(saved).toFixed(0));
  await page.locator('#calibrate').click();await page.locator('#cal-reset').click();await page.locator('#cal-back').click();await expect(page.locator('#cal-value')).toContainText('0 ms');
  await page.locator('#file').setInputFiles({name:'long.wav',mimeType:'audio/wav',buffer:wav(361)});
  await expect(page.locator('#status')).toContainText('at most 6 minutes',{timeout:30000});
});
test('production has no test hook and malformed audio is recoverable',async({page})=>{
  await page.goto('./');expect(await page.evaluate(()=>('__beatcarve' in window))).toBe(false);
  await page.locator('#file').setInputFiles({name:'bad.wav',mimeType:'audio/wav',buffer:Buffer.from('invalid')});
  await expect(page.locator('#status')).not.toContainText('Decoding');
  await expect(page.locator('#settings')).toBeHidden();
});
declare global { interface Window { __beatcarve:{chart:import('../src/game').Chart;session:import('../src/game').Session;setClock(ms:number):void;tapAt(index:number,offset:number):Promise<void>}; } }
