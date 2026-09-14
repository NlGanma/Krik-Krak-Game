// Horizontal coordinates follow the room layout; vertical coordinates are metres above the floor.
export const EYE_HEIGHT=1.05;
export const FLOOR_HEIGHT=.02;
export const GRAVITY=10;
export const JUMP_SPEED=3.8;
const RADIUS=.17, BODY_HEIGHT=1.17, CEILING=3.47*.77-FLOOR_HEIGHT;
export const platforms=[
 {id:'bed',bounds:[-2.49,-1.14,-1.59,1.13],top:.681*.77-FLOOR_HEIGHT},
 {id:'bedside table',bounds:[-.875,-.225,-2.15,-1.49],top:.7125*.77-FLOOR_HEIGHT},
 {id:'washstand',bounds:[.17,1.13,-2.54,-1.86],top:.9525*.77-FLOOR_HEIGHT},
 {id:'chair seat',bounds:[1.83,2.43,.10,.55],top:(.03+.58/1.263771*1.13)*.77-FLOOR_HEIGHT},
 {id:'suitcase',bounds:[1.94,2.66,.835,1.265],top:.38*.77-FLOOR_HEIGHT},
];
// Rails, chair back, and tabletop objects stay solid above their supporting surface.
const obstacles=[
 {bounds:[-2.55,-1.08,-1.72,-1.62],bottom:0,top:1.23*.77-FLOOR_HEIGHT},
 {bounds:[-2.55,-1.08,1.16,1.25],bottom:0,top:.92*.77-FLOOR_HEIGHT},
 {bounds:[1.82,2.44,-.08,.06],bottom:0,top:1.16*.77-FLOOR_HEIGHT},
 {bounds:[-.71,-.39,-1.97,-1.67],bottom:.52,top:1.50*.77-FLOOR_HEIGHT},
 {bounds:[.20,.78,-2.50,-1.92],bottom:.70,top:1.14*.77-FLOOR_HEIGHT},
 {bounds:[.83,1.15,-2.42,-2.16],bottom:.70,top:1.39*.77-FLOOR_HEIGHT},
];
function overlaps(x,z,[left,right,back,front]){
 const dx=Math.max(left-x,0,x-right),dz=Math.max(back-z,0,z-front);
 return dx*dx+dz*dz<RADIUS*RADIUS;
}
export function createMotion(){return {height:0,velocity:0,grounded:true,support:'floor'};}
export function startJump(state){
 if(!state.grounded)return false;
 state.velocity=JUMP_SPEED;state.grounded=false;state.support=null;return true;
}
function supportAt(x,z,height){
 let support={id:'floor',top:0};
 for(const p of platforms)if(p.top<=height+.002&&p.top>support.top&&overlaps(x,z,p.bounds))support=p;
 return support;
}
export function blocked(x,z,height){
 if(x<-2.72||x>2.72||z<-2.48||z>1.82)return true;
 if(platforms.some(p=>height<p.top-.002&&overlaps(x,z,p.bounds)))return true;
 return obstacles.some(p=>height<p.top-.002&&height+BODY_HEIGHT>p.bottom&&overlaps(x,z,p.bounds));
}
export function stepPlayer(state,position,dx,dz,dt){
 // Small steps make ledge landings reliable even after a slow frame.
 const count=Math.max(1,Math.ceil(dt/(1/120))),h=dt/count;
 for(let i=0;i<count;i++){
  const previousHeight=state.height;
  const oldSupport=supportAt(position.x,position.z,previousHeight);
  if(state.grounded&&Math.abs(oldSupport.top-state.height)>.003){state.grounded=false;state.support=null;}
  if(!state.grounded){state.height+=state.velocity*h-.5*GRAVITY*h*h;state.velocity-=GRAVITY*h;}
  const headLimit=CEILING-BODY_HEIGHT;
  if(state.height>headLimit){state.height=headLimit;state.velocity=Math.min(0,state.velocity);}
  if(!blocked(position.x+dx/count,position.z,state.height))position.x+=dx/count;
  if(!blocked(position.x,position.z+dz/count,state.height))position.z+=dz/count;
  const support=supportAt(position.x,position.z,Math.max(previousHeight,state.height));
  if(state.velocity<=0&&state.height<=support.top&&previousHeight>=support.top-.002){
   state.height=support.top;state.velocity=0;state.grounded=true;state.support=support.id;
  }else if(state.grounded&&Math.abs(state.height-support.top)>.003){state.grounded=false;state.support=null;}
 }
}
