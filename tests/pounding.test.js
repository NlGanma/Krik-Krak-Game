import test from 'node:test';
import assert from 'node:assert/strict';
import {DURATION,HITS,SHOUTS,SHOUT_LENGTH,doorShake} from '../src/pounding.js';
test('door is still outside an episode',()=>{
 for(const t of [-1,-.001,DURATION+.001,10])assert.deepEqual(doorShake(t),{angle:0,push:0,rattle:0});
});
test('the first hit pushes the door inward at once',()=>{
 const s=doorShake(.02);assert.ok(s.angle>0);assert.ok(s.push>0);assert.notEqual(s.rattle,0);
});
test('hits and shout fit inside one pass and never repeat',()=>{
 for(let i=1;i<HITS.length;i++)assert.ok(HITS[i]>HITS[i-1]);
 assert.ok(HITS[0]>=0&&HITS.at(-1)+.4<=DURATION);
 for(const shout of SHOUTS){const previous=HITS.filter(h=>h<shout).at(-1),next=HITS.find(h=>h>shout);assert.ok(shout>previous+.2&&shout+SHOUT_LENGTH<=next,`shout ${shout} overlaps a hit`);}
});
test('door rattles but never swings open',()=>{
 let peak=0;for(let t=0;t<=DURATION;t+=.001)peak=Math.max(peak,Math.abs(doorShake(t).angle));
 assert.ok(peak>.01&&peak<=.03,`peak ${peak}`);
});
