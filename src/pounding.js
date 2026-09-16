// One pass of pounding lasts DURATION seconds and repeats while the visitor is at the door.
// Times are seconds after the pass starts. The shout falls in the gap between the two bursts.
export const DURATION=3;
export const HITS=[0,.18,.36,1.28,1.46,1.64,2.5,2.6];
export const SHOUTS=[.6,1.88];
export const SHOUT_LENGTH=.6;
const IMPULSE=.4;
// Damped impulse: a sharp inward push, then a few rebounds against the frame.
function impulse(d){return d<0||d>=IMPULSE?0:Math.exp(-d*11)*Math.sin(d*55);}
export function doorShake(elapsed){
 let angle=0,push=0,rattle=0;
 if(elapsed<0||elapsed>DURATION)return {angle,push,rattle};
 for(const hit of HITS){
  const d=elapsed-hit,a=impulse(d);
  if(!a)continue;
  angle+=a*.028;push+=Math.max(a,0)*.012;
  rattle+=Math.exp(-d*14)*Math.sin(d*Math.PI*2*45)*.006;
 }
 // The bolted leaf rests against its stop: it can be pushed in, never swung out through the wall.
 return {angle:Math.max(0,angle),push,rattle};
}
