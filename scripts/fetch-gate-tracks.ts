import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export const tracks = [
  {name:'Killing Time',file:'Killing Time.mp3',bpm:100,role:'tuning',category:'electronic',isrc:'USUAN1100570',sha256:'d69c69faa1ec5f65fc6efed4278e28c3d1b34d8193a2bf06b0fe5a73084f1916'},
  {name:'Griphop',file:'Griphop.mp3',bpm:90,role:'tuning',category:'hip-hop',isrc:'USUAN1100413',sha256:'eb4d53bbf9a87461a5df7a5bc68ea56b45ccfa85bd37c55e3a97b737170e034e'},
  {name:'Bet You Can',file:'Bet You Can.mp3',bpm:92,role:'tuning',category:'rock; live/drift unverified',isrc:'USUAN1200018',sha256:'0e06dc0e7a2f8b9824df4fd278c12d3beb19622ee69953c94a122aaccfad94be'},
  {name:'Deliberate Thought',file:'Deliberate Thought.mp3',bpm:69,role:'hold-out',category:'sparse',isrc:'USUAN1100261',sha256:'243d5543c930bf54e95868bab9da860e67ce8835e3698881fda287bc58cc343f'},
  {name:'Cut and Run',file:'Cut and Run.mp3',bpm:109,role:'hold-out',category:'unseen electronic',isrc:'USUAN1100851',sha256:'ddfa5637036e97a313a2e7a01d37d00f85226469cf4df896c83da07f7f2c353e'},
].map(t=>({...t,url:'https://incompetech.com/music/royalty-free/mp3-royaltyfree/'+encodeURIComponent(t.file),
  source:'https://incompetech.com/music/royalty-free/index.html?isrc='+t.isrc,
  license:'https://creativecommons.org/licenses/by/4.0/',
  attribution:'"'+t.name+'" Kevin MacLeod (incompetech.com), CC BY 4.0. Gate overlays add analysis clicks and use excerpts.'}));
export async function fetchTracks() {
  await mkdir('gate/tracks',{recursive:true});
  for(const t of tracks){
    const path='gate/tracks/'+t.file;
    let bytes:Buffer;
    try{bytes=await readFile(path);}catch{const r=await fetch(t.url);if(!r.ok)throw new Error(t.name+': HTTP '+r.status);bytes=Buffer.from(await r.arrayBuffer());}
    const hash=createHash('sha256').update(bytes).digest('hex');
    if(t.sha256 && hash!==t.sha256)throw new Error(t.name+': checksum mismatch');
    await writeFile(path,bytes);
    console.log(t.name,hash);
  }
}
if(process.argv[1]?.endsWith('fetch-gate-tracks.ts'))await fetchTracks();

