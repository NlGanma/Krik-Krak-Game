import test from 'node:test';
import assert from 'node:assert/strict';
import { RUG, PICK_RADIUS, rugSlots, nearestPiece } from '../src/rug.js';

test('rug provides one display slot per item, all inside the rug',()=>{
 const left=RUG.x-RUG.width/2,right=RUG.x+RUG.width/2,back=RUG.z-RUG.depth/2,front=RUG.z+RUG.depth/2;
 for(const count of [3,7,11,12]){
  const slots=rugSlots(count);
  assert.equal(slots.length,count);
  for(const s of slots){
   assert.ok(s.x-s.w/2>=left-1e-9&&s.x+s.w/2<=right+1e-9,`a slot spills across the rug width (count ${count})`);
   assert.ok(s.z-s.d/2>=back-1e-9&&s.z+s.d/2<=front+1e-9,`a slot spills across the rug depth (count ${count})`);
  }
 }
});

test('display slots never overlap each other',()=>{
 const slots=rugSlots(11);
 for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++){
  const a=slots[i],b=slots[j];
  const overlap=Math.abs(a.x-b.x)<(a.w+b.w)/2&&Math.abs(a.z-b.z)<(a.d+b.d)/2;
  assert.ok(!overlap,`slots ${i} and ${j} overlap`);
 }
});

test('nearestPiece picks the closest reachable item and skips collected ones',()=>{
 const items=[{x:0,z:0,collected:false},{x:.3,z:0,collected:false},{x:5,z:5,collected:false}];
 assert.equal(nearestPiece(.28,0,items),items[1]);
 items[1].collected=true;
 assert.equal(nearestPiece(.28,0,items),items[0]);
 assert.equal(nearestPiece(5,-5,items),null,'nothing within reach returns null');
 assert.ok(PICK_RADIUS>0);
});

test('items on furniture need the player standing on that surface',()=>{
 const items=[{x:0,z:0,on:'bed',collected:false}];
 assert.equal(nearestPiece(0,0,items,'floor'),null,'cannot grab a bed item from the floor');
 assert.equal(nearestPiece(0,0,items,'bed'),items[0],'can grab it once standing on the bed');
});
