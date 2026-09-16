import test from 'node:test';
import assert from 'node:assert/strict';
import {createSiege,stepSiege,setLight,QUIET,LIMIT,DARK} from '../src/siege.js';
function run(s,seconds,fps=60){let event=null;for(let i=0;i<seconds*fps;i++)event=stepSiege(s,1/fps)??event;return event;}
test('pounding starts after the quiet period and breaks the door after the limit',()=>{
 const s=createSiege();assert.equal(run(s,QUIET-.1),null);assert.equal(s.phase,'quiet');
 assert.equal(run(s,.2),'pounding');assert.equal(s.phase,'pounding');assert.equal(s.presence,1);
 run(s,LIMIT-.5);assert.equal(s.phase,'pounding');assert.ok(s.elapsed>LIMIT-1);
 assert.equal(run(s,1),'broken');assert.equal(s.phase,'broken');assert.ok(s.elapsed<1);
});
test('darkness makes the visitor fade away over two seconds, then they return later',()=>{
 const s=createSiege();run(s,QUIET+1);setLight(s,false);
 run(s,DARK/2);assert.ok(s.presence>.4&&s.presence<.6,`presence ${s.presence}`);assert.equal(s.phase,'pounding');
 assert.equal(run(s,DARK/2+.1),'gone');assert.equal(s.phase,'quiet');assert.equal(s.presence,0);
 setLight(s,true);run(s,QUIET-.5);assert.equal(s.phase,'quiet');run(s,1);assert.equal(s.phase,'pounding');assert.equal(s.presence,1);
});
test('bringing the light back too soon brings them back, and the limit still counts',()=>{
 const s=createSiege();run(s,QUIET+1);setLight(s,false);run(s,DARK/2);setLight(s,true);run(s,1);
 assert.equal(s.phase,'pounding');assert.equal(s.presence,1);
 assert.equal(run(s,LIMIT),'broken');
});
test('the switch does nothing while quiet',()=>{
 const s=createSiege();setLight(s,false);run(s,3);assert.equal(s.phase,'quiet');setLight(s,true);run(s,1);assert.equal(s.phase,'quiet');
});
