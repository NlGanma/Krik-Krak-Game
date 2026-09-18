import test from 'node:test';
import assert from 'node:assert/strict';
import { WHORLS, openness, growth, bloomState } from '../src/ending.js';

test('the flower opens from the outside in',()=>{
 for(let k=1;k<WHORLS.length;k++)assert.ok(WHORLS[k].start>WHORLS[k-1].start,'inner whorls start later');
 const t=WHORLS[1].start+.05;
 assert.ok(openness(WHORLS[0],t)>openness(WHORLS[1],t),'the outer whorl is further open than the next');
 assert.equal(openness(WHORLS[WHORLS.length-1],0),0,'the heart is furled at the start');
});

test('every petal is fully open by the end',()=>{
 for(const w of WHORLS)assert.equal(openness(w,1),1);
});

test('the flower only grows, from a bud to the whole screen',()=>{
 let last=growth(0);
 assert.ok(last>0&&last<.2,'starts as a small bud');
 for(let t=.05;t<=1;t+=.05){const g=growth(t);assert.ok(g>=last);last=g;}
 assert.equal(growth(1),1);
});

test('the cream wash only arrives once the petals fill the screen',()=>{
 assert.equal(bloomState(0).cover,0);
 assert.equal(bloomState(.5).cover,0);
 assert.ok(bloomState(.9).cover>0&&bloomState(.9).cover<1);
 assert.equal(bloomState(1).cover,1);
});
