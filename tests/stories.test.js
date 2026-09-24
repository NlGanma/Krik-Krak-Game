import test from 'node:test';
import assert from 'node:assert/strict';
import { STORIES, STORY_COUNT, STORY_PICK_RADIUS, nearestStory } from '../src/stories.js';
import { STORY_MODELS } from '../src/story-models.js';
import { rugSlots } from '../src/rug.js';
import { platforms, blocked } from '../src/movement.js';

test('there are eleven stories, each fully described with a known model',()=>{
 assert.equal(STORY_COUNT,11);
 assert.equal(STORIES.length,11);
 const ids=new Set();
 for(const s of STORIES){
  for(const f of ['id','title','short','object','summary','meaning','model','x','z','y'])assert.ok(s[f]!==undefined&&s[f]!=='',`${s.id} missing ${f}`);
  assert.ok(!ids.has(s.id),`duplicate id ${s.id}`);ids.add(s.id);
  assert.ok(STORY_MODELS.includes(s.model),`no builder for model ${s.model}`);
 }
});

test('the rug has exactly one display spot for each story',()=>{
 assert.equal(rugSlots(STORY_COUNT).length,STORY_COUNT);
});

test('every model builder is used by exactly one story',()=>{
 const used=STORIES.map(s=>s.model);
 assert.equal(new Set(used).size,used.length,'a model is reused across stories');
 assert.equal(used.length,STORY_MODELS.length,'some model builder is unused');
});

test('story objects sit inside the room and never crowd each other',()=>{
 for(const s of STORIES)assert.ok(s.x>-2.72&&s.x<2.72&&s.z>-2.48&&s.z<1.82,`${s.id} is outside the room`);
 for(let i=0;i<STORIES.length;i++)for(let j=i+1;j<STORIES.length;j++){
  const a=STORIES[i],b=STORIES[j];
  assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>.5,`${a.id} and ${b.id} are too close`);
 }
});

test('objects that rest on furniture are on a platform a player can stand on',()=>{
 for(const s of STORIES.filter(s=>s.on)){
  const p=platforms.find(p=>p.id===s.on);
  assert.ok(p,`${s.id} references unknown platform ${s.on}`);
  const [left,right,back,front]=p.bounds;
  assert.ok(s.x>=left&&s.x<=right&&s.z>=back&&s.z<=front,`${s.id} is off its ${s.on}`);
  assert.equal(blocked(s.x,s.z,p.top),false,`${s.id} sits where nothing can stand`);
 }
});

test('floor objects are not buried inside furniture',()=>{
 for(const s of STORIES.filter(s=>!s.on)){
  assert.equal(blocked(s.x,s.z,0),false,`${s.id} is stuck inside furniture at floor level`);
 }
});

test('nearestStory reaches floor objects and gates furniture ones',()=>{
 const items=[{id:'a',x:0,z:0,collected:false},{id:'b',x:.3,z:0,on:'bed',collected:false}];
 assert.equal(nearestStory(0,0,items,'floor').id,'a');
 assert.equal(nearestStory(.3,0,items,'floor').id,'a','cannot reach the bed object from the floor');
 assert.equal(nearestStory(.3,0,items,'bed').id,'b','reaches it once on the bed');
 assert.equal(nearestStory(3,3,items,'floor'),null,'nothing within reach');
 assert.ok(STORY_PICK_RADIUS>0);
});
