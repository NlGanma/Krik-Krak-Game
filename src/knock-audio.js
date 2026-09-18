import { HITS, SHOUTS } from './pounding.js';
// The knocks, clicks and splintering are synthesized; only the cry is a recording. Nodes are built per event and scheduled on the audio clock.
let noiseBuffer;
function noise(ctx){
  if(!noiseBuffer||noiseBuffer.sampleRate!==ctx.sampleRate){noiseBuffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);const d=noiseBuffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
  const s=ctx.createBufferSource();s.buffer=noiseBuffer;s.loop=true;return s;
}
function env(ctx,when,attack,peak,decay,end=.0001){const g=ctx.createGain();g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(peak,when+attack);g.gain.exponentialRampToValueAtTime(end,when+attack+decay);return g;}
function burst(ctx,out,when,length,frequency,q,peak){
  const n=noise(ctx),f=ctx.createBiquadFilter();f.type='bandpass';f.frequency.value=frequency;f.Q.value=q;
  const g=env(ctx,when,.003,peak,length);n.connect(f).connect(g).connect(out);n.start(when);n.stop(when+length+.05);
}
// A fist on planks: low panel resonance, a wood slap, a short overtone.
export function scheduleThump(ctx,out,when,strength=1){
  const body=ctx.createOscillator();body.type='sine';
  body.frequency.setValueAtTime(95*(.9+Math.random()*.2),when);body.frequency.exponentialRampToValueAtTime(38,when+.09);
  const bodyGain=env(ctx,when,.002,1.1*strength,.28);body.connect(bodyGain).connect(out);body.start(when);body.stop(when+.4);
  burst(ctx,out,when,.03,600,1.2,.5*strength);
  const tone=ctx.createOscillator();tone.type='triangle';tone.frequency.value=190*(.95+Math.random()*.1);
  const toneGain=env(ctx,when,.002,.16*strength,.06);tone.connect(toneGain).connect(out);tone.start(when);tone.stop(when+.1);
}
// "Krik!": the visitor's cry, a recording played through the door. The clip is fetched once,
// the first time the sound is switched on, so it is decoded before the pounding begins.
export const KRIK_URL='/assets/sounds/alien-master-ominous-dark-scary.mp3';
let krikBuffer=null,krikLoading=null;
export function loadKrik(ctx){
  if(krikBuffer||krikLoading)return krikLoading;
  krikLoading=fetch(KRIK_URL).then(r=>r.arrayBuffer()).then(data=>ctx.decodeAudioData(data)).then(buffer=>{krikBuffer=buffer;}).catch(()=>{krikLoading=null;});
  return krikLoading;
}
// The door sits between the voice and the room, with a corridor echo behind it.
export function scheduleKrik(ctx,out,when){
  if(!krikBuffer){loadKrik(ctx);return;}
  const door=ctx.createBiquadFilter();door.type='lowpass';door.frequency.value=2400;door.Q.value=.8;
  const level=ctx.createGain();level.gain.value=1.6;door.connect(level).connect(out);
  const echo=ctx.createDelay(.3),echoGain=ctx.createGain();echo.delayTime.value=.09;echoGain.gain.value=.4;level.connect(echo).connect(echoGain).connect(out);
  const cry=ctx.createBufferSource();cry.buffer=krikBuffer;cry.connect(door);cry.start(when);
}
// Ezekiel: the voice outside the door, calling to be let in. Fetched once when sound
// is first switched on, then played on a steady cadence during the pounding.
export const EZEKIEL_URL='/assets/sounds/ezekiel-raspy-narrator.mp3';
let ezekielBuffer=null,ezekielLoading=null;
export function loadEzekiel(ctx){
  if(ezekielBuffer||ezekielLoading)return ezekielLoading;
  ezekielLoading=fetch(EZEKIEL_URL).then(r=>r.arrayBuffer()).then(data=>ctx.decodeAudioData(data)).then(buffer=>{ezekielBuffer=buffer;}).catch(()=>{ezekielLoading=null;});
  return ezekielLoading;
}
// The voice, muffled through the door and panned toward it, faded with the visitor's presence.
export function scheduleEzekiel(ctx,out,when,pan=0,level=1){
  if(!ezekielBuffer){loadEzekiel(ctx);return;}
  const door=ctx.createBiquadFilter();door.type='lowpass';door.frequency.value=1900;door.Q.value=.9;
  const gain=ctx.createGain();gain.gain.value=1.5*Math.max(0,level);
  const panner=ctx.createStereoPanner();panner.pan.value=Math.max(-1,Math.min(1,pan));
  door.connect(gain).connect(panner).connect(out);
  const echo=ctx.createDelay(.3),echoGain=ctx.createGain();echo.delayTime.value=.1;echoGain.gain.value=.35;gain.connect(echo).connect(echoGain).connect(panner);
  const cry=ctx.createBufferSource();cry.buffer=ezekielBuffer;cry.connect(door);cry.start(when);
  return cry;
}
// The closing song, played once when the gardenia opens. Fetched when sound is first
// switched on so it is ready by the ending.
export const ENDING_URL='/assets/sounds/ending-music.mp3';
let endingBuffer=null,endingLoading=null;
export function loadEnding(ctx){
  if(endingBuffer||endingLoading)return endingLoading;
  endingLoading=fetch(ENDING_URL).then(r=>r.arrayBuffer()).then(data=>ctx.decodeAudioData(data)).then(buffer=>{endingBuffer=buffer;}).catch(()=>{endingLoading=null;});
  return endingLoading;
}
// Played on its own output (not the master bus), so it stays clear while the room is muted.
export function playEnding(ctx,out,when=ctx.currentTime){
  if(!endingBuffer){loadEnding(ctx);return null;}
  const src=ctx.createBufferSource();src.buffer=endingBuffer;const gain=ctx.createGain();gain.gain.value=.9;
  src.connect(gain).connect(out);src.start(when);
  return {stop(){try{src.stop();}catch{}}};
}
// One pass of pounding, panned toward wherever the door is relative to the listener.
// Louder as the visitor loses patience. The handle fades the pass with the visitor's presence or cuts it.
export function schedulePounding(ctx,out,startTime,pan=0,strength=1,presence=1){
  const level=ctx.createGain();level.gain.value=strength*presence;
  const panner=ctx.createStereoPanner();panner.pan.value=Math.max(-1,Math.min(1,pan));level.connect(panner).connect(out);
  for(const hit of HITS)scheduleThump(ctx,level,startTime+hit,.8+Math.random()*.35);
  for(const shout of SHOUTS)scheduleKrik(ctx,level,startTime+shout);
  return {level(v){level.gain.setTargetAtTime(strength*v,ctx.currentTime,.08);},stop(){level.gain.setTargetAtTime(0,ctx.currentTime,.04);setTimeout(()=>panner.disconnect(),600);}};
}
// A bakelite toggle: two dry clicks close together.
export function scheduleClick(ctx,out,when){burst(ctx,out,when,.012,3200,4,.5);burst(ctx,out,when+.03,.015,2100,3,.35);}
// The bolt tears out: a deep slam, then splintering wood and the leaf hitting the wall.
export function scheduleBreak(ctx,out,when,pan=0){
  const panner=ctx.createStereoPanner();panner.pan.value=Math.max(-1,Math.min(1,pan));panner.connect(out);
  scheduleThump(ctx,panner,when,1.8);
  const splinter=noise(ctx),f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(5000,when);f.frequency.exponentialRampToValueAtTime(300,when+.5);
  const g=env(ctx,when,.005,.9,.5);splinter.connect(f).connect(g).connect(panner);splinter.start(when);splinter.stop(when+.6);
  for(const [offset,strength] of [[.05,.6],[.11,.45],[.2,.3]])burst(ctx,panner,when+offset,.04,1200+Math.random()*800,3,strength);
  scheduleThump(ctx,panner,when+.34,1.4);
  burst(ctx,panner,when+.34,.08,400,1,.6);
}
