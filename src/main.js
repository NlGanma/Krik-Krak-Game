import * as THREE from 'three';
import { buildRoom } from './room.js';
import { setupUI } from './ui.js';
import { EYE_HEIGHT, FLOOR_HEIGHT, startJump, createMotion, stepPlayer } from './movement.js';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
let renderScale=Math.min(devicePixelRatio,1.5);
renderer.setPixelRatio(renderScale);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
const scene=new THREE.Scene();
scene.background=new THREE.Color('#1b2421');
scene.fog=new THREE.FogExp2('#1b2421',.025);
const camera=new THREE.PerspectiveCamera(72,1,.06,70);
camera.rotation.order='YXZ';
let yaw=.40, pitch=-.06;
const player=new THREE.Vector3(.5,0,1.45);
const environment=await buildRoom(scene);
// Furniture and architecture are static; flicker changes brightness, not shadows.
renderer.shadowMap.autoUpdate=false;
renderer.shadowMap.needsUpdate=true;
const jump=createMotion();

const details=[{x:-1.8,z:.15,r:1.6,title:'THE SINGLE BED',text:'A thin mattress remembers other sleepers. The mosquito net has been mended where it meets the frame.'},{x:-.55,z:-1.82,r:1.1,title:'THE KEROSENE LAMP',text:'The current has gone again. A small flame keeps the room from disappearing.'},{x:.65,z:-2.2,r:1.05,title:'THE WASHSTAND',text:'A pitcher of water. An enamel basin. Enough to wash the dust from your face before bed.'},{x:2.04,z:-2.5,r:1.05,title:'THE CLOSED DOOR',text:'Beyond this door, the other rented rooms are quiet. Grandmother has already drawn the bolt.'},{x:-2.7,z:-.65,r:1.45,title:'THE SHUTTERS',text:'Wooden louvers keep out the gaze, but never the sound. A distant whistle passes through the slats.'},{x:2.25,z:1,r:.85,title:'YOUR BELONGINGS',text:'A change of clothes in a small bag. You have left it closed, as if you might not stay.'}];
const keys=new Set();let nearby=null;
const ui=setupUI({canvas,keys});
let dragging=false, lastPointer=null;
const lookHint=document.querySelector('#look-hint');
function look(dx,dy){yaw-=dx*.0025;pitch=THREE.MathUtils.clamp(pitch-dy*.0025,-1.35,1.35);}
canvas.addEventListener('click',()=>{if(!matchMedia('(pointer:fine)').matches)return;try{const request=canvas.requestPointerLock?.();request?.catch(()=>{lookHint.textContent='Drag to look · WASD to walk';});}catch{lookHint.textContent='Drag to look · WASD to walk';}});
document.addEventListener('pointerlockchange',()=>{keys.clear();lookHint.textContent=document.pointerLockElement===canvas?'Mouse to look · Esc to release':'Click to look around · or drag';});
document.addEventListener('pointerlockerror',()=>{lookHint.textContent='Drag to look · WASD to walk';});
canvas.addEventListener('pointerdown',e=>{dragging=true;lastPointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(document.pointerLockElement===canvas)return;if(dragging&&lastPointer){look(e.clientX-lastPointer.x,e.clientY-lastPointer.y);lastPointer={x:e.clientX,y:e.clientY};}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{dragging=false;lastPointer=null;});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas)look(e.movementX,e.movementY);});
function inspect(){if(!nearby)return;ui.showNote();document.querySelector('#note-label').textContent=nearby.title;document.querySelector('#note-text').textContent=nearby.text;}
window.addEventListener('keydown',e=>{if(ui.paused())return;if(e.code==='Space'&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();if(!e.repeat)startJump(jump);return;}if(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright','e'].includes(e.key.toLowerCase())){if(e.target instanceof HTMLButtonElement && e.key.toLowerCase()==='e')return;e.preventDefault();keys.add(e.key.toLowerCase());if(e.key.toLowerCase()==='e'&&!e.repeat)inspect();}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>keys.clear());
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);if(b.dataset.key==='e')inspect();if(b.dataset.key==='jump')startJump(jump);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(b.dataset.key));});
document.querySelector('#prompt').addEventListener('click',inspect);
document.querySelector('#reset').addEventListener('click',()=>{player.set(.5,0,1.45);Object.assign(jump,createMotion());yaw=.40;pitch=-.06;keys.clear();document.querySelector('#note-label').textContent='THE GUEST ROOM';document.querySelector('#note-text').textContent='Grandmother rents the rooms she can spare. This one is yours for the night.';});
// Optional synthesized night ambience; begins only after the sound button is used.
let audio,master,soundOn=false;
document.querySelector('#sound').addEventListener('click',()=>{if(!audio){audio=new AudioContext();master=audio.createGain();master.gain.value=0;master.connect(audio.destination);const buffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.18;const noise=audio.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=420;noise.connect(filter).connect(master);noise.start();setInterval(()=>{if(!soundOn||document.hidden)return;const t=audio.currentTime;const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(1050,t);o.frequency.linearRampToValueAtTime(1300,t+.35);o.frequency.linearRampToValueAtTime(970,t+.8);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.025,t+.15);g.gain.linearRampToValueAtTime(0,t+.9);o.connect(g).connect(master);o.start(t);o.stop(t+1);},15000);}audio.resume();soundOn=!soundOn;master.gain.setTargetAtTime(soundOn?.38:0,audio.currentTime,.4);document.querySelector('#sound').textContent=soundOn?'◉   Sound on':'◌   Sound off';document.querySelector('#sound').setAttribute('aria-pressed',String(soundOn));});
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();
const clock=new THREE.Clock();
const prompt=document.querySelector('#prompt'),promptText=prompt.querySelector('span');
let lastNearby=null,frameTime=16.7,frameSamples=0,qualityTimer=0;
let jumpPeak=0;
let paused=document.hidden;
document.addEventListener('visibilitychange',()=>{paused=document.hidden;clock.getDelta();});
renderer.setAnimationLoop(()=>{
  if(paused)return;
  const rawDt=clock.getDelta(),dt=Math.min(rawDt,.04),t=clock.elapsedTime;
  frameTime=frameTime*.97+Math.min(rawDt*1000,100)*.03;frameSamples++;qualityTimer+=dt;
  // Downshift resolution on sustained slow frames, never oscillate mid-play.
  if(frameSamples>150&&qualityTimer>3&&frameTime>25&&renderScale>.75){renderScale=Math.max(.75,renderScale-.15);renderer.setPixelRatio(renderScale);qualityTimer=0;}
  let x=0,z=0;
  if(!ui.paused()&&(keys.has('w')||keys.has('arrowup')))z--;
  if(!ui.paused()&&(keys.has('s')||keys.has('arrowdown')))z++;
  if(!ui.paused()&&keys.has('a'))x--;
  if(!ui.paused()&&keys.has('d'))x++;
  if(!ui.paused()&&keys.has('arrowleft'))yaw+=dt*1.6;
  if(!ui.paused()&&keys.has('arrowright'))yaw-=dt*1.6;
  let dx=0,dz=0;
  if(x||z){
    const length=Math.hypot(x,z);x/=length;z/=length;
    dx=(x*Math.cos(yaw)+z*Math.sin(yaw))*2.25*dt;
    dz=(-x*Math.sin(yaw)+z*Math.cos(yaw))*2.25*dt;

  }
  if(!ui.paused())stepPlayer(jump,player,dx,dz,dt);
  camera.position.set(player.x*.62,FLOOR_HEIGHT+EYE_HEIGHT+jump.height,player.z*.68);
  camera.rotation.set(pitch,yaw,0,'YXZ');
  environment.update(t);
  nearby=null;let nearest=Infinity;
  for(const detail of details){const distance=Math.hypot(player.x-detail.x,player.z-detail.z);if(distance<detail.r&&distance<nearest){nearby=detail;nearest=distance;}}
  if(nearby!==lastNearby){prompt.hidden=!nearby;if(nearby)promptText.textContent=nearby.title.toLowerCase();lastNearby=nearby;}
  renderer.render(scene,camera);
  if(import.meta.env.DEV){jumpPeak=Math.max(jumpPeak,jump.height);if(frameSamples%30===0)canvas.dataset.diagnostics=JSON.stringify({frameMs:Math.round(frameTime*10)/10,drawCalls:renderer.info.render.calls,renderScale,eyeHeight:EYE_HEIGHT,jumpPeak,support:jump.support,feetHeight:jump.height,position:{x:player.x,z:player.z},batching:environment.batching});}
});
requestAnimationFrame(()=>{document.querySelector('#loading').style.opacity='0';setTimeout(()=>document.querySelector('#loading').remove(),700);});
// Read-only state for checking movement and collision behavior in a browser.
window.roomState=()=>({position:player.toArray(),yaw,pitch,nearby:nearby?.title,eyeHeight:EYE_HEIGHT,cameraHeight:camera.position.y,jumpHeight:jump.height,renderScale,frameTime,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,objects:scene.children.length});
