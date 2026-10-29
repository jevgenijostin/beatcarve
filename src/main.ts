import './style.css';
import { audioTime, calibrationMedian, Session, validChart, type Chart } from './game';
import { demoPayload, signLicense, verifyLicense, loadLicense, saveLicense, isEntitled } from './license';

document.querySelector('#app')!.innerHTML=`
<header><a class="brand" href="./">BEAT<span>CARVE</span></a><span class="tag">YOUR MUSIC. FOUR LANES.</span></header>
<main><section class="intro"><p class="eyebrow">LOCAL AUDIO / KEYBOARD RHYTHM</p><h1>Find your beat.<br><span>Make it count.</span></h1><p>Play songs with a clear, steady hip-hop beat, or sparse/minimal percussion.</p></section>
<section id="setup" class="panel"><div id="drop"><span class="step">01 / SELECT YOUR TRACK</span><h2>Drop a song here</h2><label class="button primary">Choose audio<input id="file" type="file" accept="audio/*"></label><p>Local files only · 6 minutes max · Audio stays in your browser</p></div>
<p class="warning">Electronic and rock are NOT currently well-supported and may chart poorly, even with high beat confidence. Validated examples: Griphop (hip-hop) and Deliberate Thought (sparse/minimal percussion). <a href="https://github.com/jevgenijostin/beatcarve/blob/main/GATE-REPORT.md" target="_blank" rel="noreferrer">Read the partial gate report ↗</a></p>
<p id="status" role="status">Choose a track to carve your first chart.</p>
<div id="settings" hidden><h2 id="track"></h2><div class="metrics"><div><small>TEMPO</small><strong id="bpm"></strong></div><div><small>BEAT CONFIDENCE</small><strong id="confidence"></strong></div><div><small>NOTES</small><strong id="count"></strong></div></div>
<p id="confidence-warning" class="warning" hidden>Beat is uncertain. This track may not chart well. Try offset or tempo controls; they cannot repair timing drift.</p>
<div class="controls"><button id="half">÷2 tempo</button><button id="double">×2 tempo</button><label>Difficulty <select id="difficulty"><option>Normal</option><option>Easy</option></select></label></div>
<div class="controls"><span>Beat offset <output id="offset"></output></span><button data-nudge="-10">−10 ms</button><button data-nudge="-1">−1 ms</button><button data-nudge="1">+1 ms</button><button data-nudge="10">+10 ms</button><button id="beat">Shift one beat</button></div>
<div class="controls"><button id="play" class="primary">Play chart →</button><button id="export">Export JSON · Creator demo</button></div></div>
<div class="controls"><button id="calibrate">Calibrate timing</button><span id="cal-value"></span></div></section>
<section id="calibration" class="panel" hidden><p class="step">TIMING / CALIBRATION</p><h2>Tap Space with the click</h2><p>Listen to the first two clicks, then tap 14 times. Calibration corrects a consistent offset only; it cannot fix drift.</p><p id="cal-status" role="status"></p><button id="cal-start" class="primary">Start clicks</button><button id="cal-reset">Reset offset</button><button id="cal-back">Back to setup</button></section>
<section id="game" hidden><div class="hud"><span id="score">0</span><span id="combo">0 combo</span><span id="feedback">Get ready</span><button id="pause">Pause</button><button id="quit">Back to setup</button></div><canvas id="highway" width="640" height="640" aria-label="Four lane note highway. Use D F J K."></canvas><p class="keys">D <span>F</span> J <span>K</span></p><p class="hint">Tap as notes cross the line · Perfect ±45 ms · Great ±90 ms</p></section>
<section id="results" class="panel" hidden><p class="step">TRACK COMPLETE</p><h2>Your run, carved.</h2><div id="summary"></div><button id="again" class="primary">Play again</button><button id="back">Back to setup</button></section>
<section class="license"><details><summary>Creator demo · JSON export only</summary><p>The full game is free. This inspectable demo key unlocks chart JSON export. No payment or account.</p><button id="demo">Generate & activate demo key</button><label>Demo key <input id="license-key" type="text"></label><button id="activate">Activate key</button><button id="deactivate">Deactivate</button><p id="license-status" role="status"></p></details></section>
</main><footer>Built for desktop · D F J K · No uploads. No hosted songs.</footer>`;
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const show=(id:string)=>{document.querySelector<HTMLElement>('.intro')!.hidden=id!=='setup';window.scrollTo(0,0);for(const name of ['setup','game','results','calibration'])el(name).hidden=name!==id;};
let context:AudioContext|undefined, buffer:AudioBuffer|undefined, source:AudioBufferSourceNode|undefined;
let worker:Worker|undefined, request=0, chart:Chart|undefined, trackName='', busy=false;
let session:Session|undefined, playing=false, paused=false, start=0, frame=0, injected:number|undefined;
let calibration=0;
try { const saved=Number(localStorage.getItem('beatcarve.calibration.v1'));if(Number.isFinite(saved)&&Math.abs(saved)<=500)calibration=saved; }catch{/* Storage is optional. */}
const audio=()=>context??=new AudioContext();
const latency=()=>({base:audio().baseLatency||0,output:audio().outputLatency||0});
const clock=()=>injected??audioTime(audio().currentTime,start,latency().base,latency().output,calibration);
function calLabel(){el('cal-value').textContent=`Timing offset: ${calibration.toFixed(0)} ms`;}
calLabel();
function stop(){playing=false;cancelAnimationFrame(frame);source?.stop();source=undefined;}
function setup(){stop();stopClicks();show('setup');}
function setBusy(value:boolean){busy=value;el('settings').querySelectorAll<HTMLButtonElement|HTMLSelectElement>('button, select').forEach(x=>x.disabled=value);}
function generate(bpm?:number,offset?:number){if(!worker||busy)return;setBusy(true);worker.postMessage({id:++request,difficulty:el<HTMLSelectElement>('difficulty').value,bpm:bpm??chart?.bpm,offset:offset??(chart?chart.offsetMs/1000:undefined)});}
async function load(file:File){
  stop();stopClicks();show('setup');worker?.terminate();worker=undefined;chart=undefined;buffer=undefined;el('settings').hidden=true;
  const id=++request;setBusy(true);el('status').textContent='Decoding audio locally…';
  try {
    const decoded=await audio().decodeAudioData(await file.arrayBuffer());
    if(id!==request)return;
    if(decoded.duration>360)throw new Error('Tracks must be at most 6 minutes. Choose a shorter file.');
    if(decoded.duration<1)throw new Error('Choose a track at least one second long.');
    buffer=decoded;trackName=file.name;
    const mono=new Float32Array(decoded.length);
    for(let ch=0;ch<decoded.numberOfChannels;ch++){const data=decoded.getChannelData(ch);for(let i=0;i<mono.length;i++)mono[i]+=data[i]/decoded.numberOfChannels;}
    el('status').textContent='Carving your chart… Analysis runs in a worker; longer tracks take longer.';
    worker=new Worker(new URL('./worker.ts',import.meta.url),{type:'module'});
    worker.onerror=()=>{setBusy(false);el('status').textContent='Analysis failed. Try another track.';};
    worker.onmessage=event=>{
      if(event.data.id!==request)return;
      setBusy(false);
      if(event.data.error){el('status').textContent=event.data.error;return;}
      chart=event.data.chart;chart!.trackName=trackName;
      el('track').textContent=trackName;el('bpm').textContent=chart!.bpm.toFixed(2);
      el('confidence').textContent=`${Math.round(event.data.confidence*100)}% · ${event.data.confidence<.5?'uncertain':'steady'}`;
      el('confidence-warning').hidden=event.data.confidence>=.5;
      el('count').textContent=String(chart!.notes.length);el('offset').textContent=`${chart!.offsetMs.toFixed(1)} ms`;
      el('settings').hidden=false;el<HTMLButtonElement>('play').disabled=!chart!.notes.length;
      el('status').textContent=chart!.notes.length?'Chart ready. Use D F J K to play.':'No notes found. Choose a track with audible percussion.';
    };
    worker.postMessage({id,samples:mono,sr:decoded.sampleRate,difficulty:el<HTMLSelectElement>('difficulty').value},[mono.buffer]);
  }catch(error){if(id===request){setBusy(false);el('status').textContent=error instanceof Error?error.message:'Could not decode this audio format.';}}
}
el<HTMLInputElement>('file').onchange=()=>{const file=el<HTMLInputElement>('file').files?.[0];if(file)void load(file);};
el('drop').ondragover=e=>{e.preventDefault();};
el('drop').ondrop=e=>{e.preventDefault();const file=e.dataTransfer?.files[0];if(file)void load(file);};
el('half').onclick=()=>{if(chart&&chart.bpm>20)generate(chart.bpm/2);};
el('double').onclick=()=>{if(chart&&chart.bpm<320)generate(chart.bpm*2);};
el('difficulty').onchange=()=>generate();
document.querySelectorAll<HTMLButtonElement>('[data-nudge]').forEach(b=>b.onclick=()=>{if(chart)generate(undefined,(chart.offsetMs+Number(b.dataset.nudge))/1000);});
el('beat').onclick=()=>{if(chart)generate(undefined,chart.offsetMs/1000+60/chart.bpm);};
async function play(){
  if(!chart||!buffer||busy)return;stop();await audio().resume();injected=undefined;paused=false;
  source=audio().createBufferSource();source.buffer=buffer;source.connect(audio().destination);
  start=audio().currentTime+1.5;source.start(start);
  session=new Session(chart.notes,clock);playing=true;el('play').blur();el('again').blur();el('pause').textContent='Pause';el('feedback').textContent='Get ready';show('game');draw();
}
const colors=['#a7f36a','#64ded9','#b89aff','#ffb56b'];
function draw(){
  if(!playing||!chart||!session)return;
  session.expire();const now=clock(),canvas=el<HTMLCanvasElement>('highway'),ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#121722';ctx.fillRect(0,0,640,640);
  for(let lane=0;lane<4;lane++){ctx.fillStyle=lane%2?'#171e2b':'#141a26';ctx.fillRect(lane*160+3,0,154,640);ctx.fillStyle=colors[lane];ctx.fillRect(lane*160+15,550,130,3);}
  for(let i=0;i<chart.notes.length;i++){const note=chart.notes[i];if(session.done.has(i))continue;const y=550-(note.t-now)*.3;if(y< -20||y>640)continue;ctx.fillStyle=colors[note.lane];ctx.beginPath();ctx.roundRect(note.lane*160+20,y-7,120,14,5);ctx.fill();}
  el('score').textContent=session.score.toLocaleString();el('combo').textContent=`${session.combo} combo`;
  if(now>chart.durationMs+120){stop();show('results');el('summary').textContent=`Score ${session.score.toLocaleString()} · Best combo ${session.best} · Perfect ${session.perfect} · Great ${session.great} · Miss ${session.misses}`;return;}
  frame=requestAnimationFrame(draw);
}
async function pause(){if(!playing)return;if(paused){await audio().resume();paused=false;el('pause').textContent='Pause';}else{await audio().suspend();paused=true;el('pause').textContent='Resume';}}
el('play').onclick=()=>void play();el('again').onclick=()=>void play();el('pause').onclick=()=>void pause();
el('quit').onclick=setup;el('back').onclick=setup;
window.addEventListener('blur',()=>{if(playing&&!paused)void pause();if(calRunning)stopClicks();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing&&!paused)void pause();if(document.hidden&&calRunning)stopClicks();});

let clicks:OscillatorNode[]=[], clickTimes:number[]=[], taps:number[]=[], calRunning=false, lastClick=-1;
function stopClicks(){for(const click of clicks){try{click.stop();}catch{/* Already ended. */}}clicks=[];calRunning=false;}
function persistCalibration(){try{localStorage.setItem('beatcarve.calibration.v1',String(calibration));}catch{el('cal-status').textContent+=' Storage unavailable; offset applies this session.';}calLabel();}
el('calibrate').onclick=()=>{show('calibration');el('cal-status').textContent='Ready when you are.';};
el('cal-back').onclick=setup;
el('cal-reset').onclick=()=>{stopClicks();calibration=0;persistCalibration();el('cal-status').textContent='Offset reset.';};
el('cal-start').onclick=async()=>{
  stopClicks();await audio().resume();taps=[];lastClick=-1;calRunning=true;const begin=audio().currentTime+1;
  clickTimes=Array.from({length:18},(_,i)=>begin+i*.6);
  for(const time of clickTimes){const osc=audio().createOscillator(),gain=audio().createGain();osc.frequency.value=1000;gain.gain.setValueAtTime(.25,time);gain.gain.exponentialRampToValueAtTime(.001,time+.04);osc.connect(gain);gain.connect(audio().destination);osc.start(time);osc.stop(time+.05);clicks.push(osc);}
  el('cal-status').textContent='Listen to two clicks, then tap Space · 0 / 14'; el('cal-start').blur();
};
function tapCalibration(){
  if(!calRunning)return;
  const {base,output}=latency(),now=audio().currentTime-base-output;
  const index=Math.round((now-clickTimes[0])/.6);
  if(index<2||index>=clickTimes.length||index<=lastClick||Math.abs(now-clickTimes[index])>.3)return;
  lastClick=index;taps.push((now-clickTimes[index])*1000);el('cal-status').textContent=`${taps.length} / 14 taps`;
  if(taps.length===14){calibration=calibrationMedian(taps);stopClicks();el('cal-status').textContent=`Saved ${calibration.toFixed(0)} ms. This corrects consistent offset only.`;persistCalibration();}
}
window.addEventListener('keydown',event=>{
  if(event.repeat||['INPUT','SELECT','TEXTAREA'].includes((event.target as HTMLElement).tagName))return;
  if(!el('calibration').hidden&&event.code==='Space'){event.preventDefault();tapCalibration();return;}
  const lane=['KeyD','KeyF','KeyJ','KeyK'].indexOf(event.code);
  if(playing&&!paused&&lane>=0){event.preventDefault();el('feedback').textContent=session!.press(lane);}
});
const licenseStorage={getItem:(key:string)=>localStorage.getItem(key),setItem:(key:string,value:string)=>localStorage.setItem(key,value),removeItem:(key:string)=>localStorage.removeItem(key)}; let license=await loadLicense(licenseStorage);
function licenseLabel(){el('license-status').textContent=isEntitled(license,'creator')?'Creator demo active · JSON export unlocked':'Free · all gameplay unlocked';}
licenseLabel();
async function activate(key:string){license=await verifyLicense(key);const saved=saveLicense(license,licenseStorage);licenseLabel();if(!license)el('license-status').textContent='Invalid or expired demo key.';else if(!saved)el('license-status').textContent+=' Storage unavailable; active this session.';}
el('demo').onclick=async()=>{const key=await signLicense(demoPayload());el<HTMLInputElement>('license-key').value=key;await activate(key);};
el('activate').onclick=()=>void activate(el<HTMLInputElement>('license-key').value);
el('deactivate').onclick=()=>{license=null;saveLicense(null,licenseStorage);licenseLabel();};
el('export').onclick=()=>{
  if(!isEntitled(license,'creator')){el('license-status').textContent='Activate a free Creator demo key to export JSON.';document.querySelector('details')!.open=true;el('license-status').scrollIntoView();return;}
  if(!validChart(chart))return;
  const url=URL.createObjectURL(new Blob([JSON.stringify(chart,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='beatcarve-chart.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
if(new URLSearchParams(location.search).get('test')==='1'){
  Object.assign(window,{__beatcarve:{get chart(){return chart;},get session(){return session;},setClock(ms:number){injected=ms;},get calibrationTimes(){return clickTimes;},async tapAt(index:number,offset:number){const target=clickTimes[index]+offset/1000+latency().base+latency().output;while(audio().currentTime<target)await new Promise(resolve=>setTimeout(resolve,2));tapCalibration();}}});
}
