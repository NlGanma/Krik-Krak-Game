// The visitor at the door. Quiet for QUIET seconds, then pounding until either the room goes
// dark long enough for them to lose interest (DARK seconds) or LIMIT seconds pass and the door gives way.
export const QUIET=10;
export const LIMIT=10;
export const DARK=2;
export const RETURN=.6;
export function createSiege(){return {phase:'quiet',time:0,next:QUIET,started:0,elapsed:0,lightOn:true,presence:1};}
// Advances the clock; returns the event of this step ('pounding', 'gone', 'broken') or null.
// presence is how much of the visitor is left: 1 at the door, 0 gone.
export function stepSiege(s,dt){
 s.time+=dt;
 if(s.phase==='quiet'&&s.time>=s.next){s.phase='pounding';s.started=s.time;s.elapsed=0;s.presence=1;return 'pounding';}
 if(s.phase==='pounding'){
  s.elapsed=s.time-s.started;
  // In the dark they slowly give up; light brings them straight back.
  s.presence=s.lightOn?Math.min(1,s.presence+dt/RETURN):Math.max(0,s.presence-dt/DARK);
  if(s.presence===0){s.phase='quiet';s.next=s.time+QUIET;return 'gone';}
  if(s.elapsed>=LIMIT){s.phase='broken';s.started=s.time;s.elapsed=0;return 'broken';}
 }else if(s.phase==='broken')s.elapsed=s.time-s.started;
 return null;
}
export function setLight(s,on){s.lightOn=on;}
