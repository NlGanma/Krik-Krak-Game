import test from 'node:test';
import assert from 'node:assert/strict';
import {createMotion,startJump,stepPlayer,platforms,blocked} from '../src/movement.js';
function run(state,pos,seconds,dx=0,dz=0,fps=120){for(let i=0;i<seconds*fps;i++)stepPlayer(state,pos,dx/fps,dz/fps,1/fps);}
const bed=platforms.find(p=>p.id==='bed');
test('jump from the floor onto bed, stand still and jump again',()=>{
 const state=createMotion(),p={x:-.80,z:-.1};assert.ok(startJump(state));
 run(state,p,.55,-2.25);run(state,p,.5);
 assert.equal(state.support,'bed');assert.equal(state.height,bed.top);
 const height=state.height;run(state,p,1);assert.equal(state.height,height);
 assert.ok(startJump(state));assert.equal(startJump(state),false);run(state,p,1);assert.equal(state.support,'bed');
});
test('walking against the bed does not climb it; walking off falls to floor',()=>{
 const state=createMotion(),p={x:-.8,z:-.1};run(state,p,1,-2.25);assert.equal(state.height,0);assert.ok(p.x>-.98);
 Object.assign(state,{height:bed.top,grounded:true,support:'bed'});p.x=-1.5;
 run(state,p,.7,2.25);run(state,p,1);assert.equal(state.support,'floor');assert.equal(state.height,0);
});
test('can land on suitcase and continue onto chair seat',()=>{
 const state=createMotion(),p={x:1.55,z:1.05};startJump(state);run(state,p,.28,2.25);run(state,p,.7);
 assert.equal(state.support,'suitcase');assert.ok(startJump(state));run(state,p,.3,0,-2.0);run(state,p,.7);
 assert.equal(state.support,'chair seat');
});
test('bed to bedside table works while lamp stays solid',()=>{
 const state={height:bed.top,velocity:0,grounded:true,support:'bed'},p={x:-1.28,z:-1.35};
 startJump(state);run(state,p,.25,2.0,-.5);run(state,p,.8);
 assert.equal(state.support,'bedside table');
 assert.equal(blocked(-.55,-1.82,.53),true);
});
test('landings are consistent across frame rates and room walls remain solid in air',()=>{
 for(const fps of [30,60,120]){
  const state=createMotion(),p={x:-.80,z:-.1};startJump(state);run(state,p,.55,-2.25,0,fps);run(state,p,1,0,0,fps);assert.equal(state.support,'bed');assert.equal(state.height,bed.top);
 }
 assert.equal(blocked(3,0,1),true);
});
