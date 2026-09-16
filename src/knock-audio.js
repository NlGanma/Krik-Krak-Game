import { HITS, SHOUTS } from './pounding.js';
// Everything is synthesized: no recordings. Nodes are built per event and scheduled on the audio clock.
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
// "Krik!": a velar burst, a tapped r, then a shouted /i/ that climbs into a shriek and breaks off on the k.
// Two detuned voices and a sub-octave through hard clipping and formants, with a breathy rasp on top,
// a corridor echo behind it, and the door between the voice and the room.
export function scheduleKrik(ctx,out,when){
  const door=ctx.createBiquadFilter();door.type='lowpass';door.frequency.value=2400;door.Q.value=.8;
  const level=ctx.createGain();level.gain.value=3.4;door.connect(level).connect(out);
  const echo=ctx.createDelay(.3),echoGain=ctx.createGain();echo.delayTime.value=.09;echoGain.gain.value=.4;level.connect(echo).connect(echoGain).connect(out);
  burst(ctx,door,when,.035,2400,2,1.2);
  const v0=when+.035,end=when+.56;
  const pitch=[[when+.09,240],[when+.3,430],[when+.42,470],[end,300]];
  const shout=ctx.createWaveShaper();const curve=new Float32Array(512);for(let i=0;i<512;i++){const x=i/255.5-1;curve[i]=Math.tanh(x*5);}shout.curve=curve;
  const voiceGain=ctx.createGain();voiceGain.gain.setValueAtTime(.0001,v0);voiceGain.gain.exponentialRampToValueAtTime(.7,when+.06);voiceGain.gain.setValueAtTime(.7,end-.05);voiceGain.gain.exponentialRampToValueAtTime(.0001,end);
  const vibrato=ctx.createOscillator(),vibratoGain=ctx.createGain();vibrato.frequency.value=7.5;vibratoGain.gain.value=14;vibrato.connect(vibratoGain);
  for(const [type,ratio,gain] of [['sawtooth',1,.5],['sawtooth',1.008,.5],['square',.5,.18]]){
    const o=ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(190*ratio,v0);for(const [time,f] of pitch)o.frequency.linearRampToValueAtTime(f*ratio,time);
    const g=ctx.createGain();g.gain.value=gain;vibratoGain.connect(o.frequency);o.connect(g).connect(shout);o.start(v0);o.stop(end+.02);
  }
  const rasp=noise(ctx),raspGain=ctx.createGain();raspGain.gain.setValueAtTime(0,v0);raspGain.gain.linearRampToValueAtTime(.35,when+.25);raspGain.gain.linearRampToValueAtTime(.0001,end);rasp.connect(raspGain).connect(shout);rasp.start(v0);rasp.stop(end+.02);
  shout.connect(voiceGain);
  for(const [frequency,q,gain] of [[350,9,1],[2400,11,.7],[3200,11,.45]]){
    const f=ctx.createBiquadFilter();f.type='bandpass';f.Q.value=q;f.frequency.setValueAtTime(frequency===2400?1300:frequency,v0);if(frequency===2400)f.frequency.linearRampToValueAtTime(2400,when+.09);
    const g=ctx.createGain();g.gain.value=gain;voiceGain.connect(f).connect(g).connect(door);
  }
  vibrato.start(v0);vibrato.stop(end+.02);
  burst(ctx,door,end,.045,2100,2,.9);
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
