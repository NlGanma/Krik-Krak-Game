import test from 'node:test';
import assert from 'node:assert/strict';
import { beddingPoint } from '../src/bedding.js';

test('sheet clears rounded mattress and blanket remains above sheet',()=>{
 // Signed distance to the rounded mattress box: half-size .675/.08/1.38, radius .065.
 for(let u=-1;u<=1;u+=.005)for(let z=-1.53;z<=1.08;z+=.04){
  const p=beddingPoint(u,z),q=[Math.abs(p.x)-(.675-.065),Math.abs(p.y-.545)-(.08-.065),Math.abs(z+.23)-(1.38-.065)];
  const distance=Math.hypot(...q.map(v=>Math.max(v,0)))+Math.min(Math.max(...q),0)-.065;
  assert.ok(distance>.006,`Sheet intersects mattress at ${u},${z}: ${distance}`);
  const blanket=beddingPoint(u,z,1);assert.ok(blanket.y-p.y>.023);
  assert.ok(p.x-1.815> -2.64+.04 && p.x-1.815< -1.0-.04,'Cloth clears swaying net');
 }
});
