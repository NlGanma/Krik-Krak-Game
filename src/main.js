import * as THREE from 'three';
import { buildRoom } from './room.js';
import { setupUI } from './ui.js';
import { EYE_HEIGHT, FLOOR_HEIGHT, startJump, createMotion, stepPlayer } from './movement.js';
import { DURATION } from './pounding.js';
import { createSiege, stepSiege, setLight } from './siege.js';
import { schedulePounding, scheduleBreak, scheduleClick, loadKrik, loadEzekiel, scheduleEzekiel, loadEnding, playEnding } from './knock-audio.js';
import { RUG } from './rug.js';
import { nearestStory } from './stories.js';
import { buildStoryModel } from './story-models.js';
import { createEnding } from './ending.js';

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

// E does two things in this room: flips the light switch beside the door, or gathers a story object.
const details=[{x:1.18,z:-2.5,r:.8,title:'THE LIGHT SWITCH',prompt:'flip the light switch',action:()=>flipSwitch()}];
const keys=new Set();let nearby=null,nearbyStory=null,lastPromptLabel=null;
const ui=setupUI({canvas,keys});
// The gardenia takes the screen once the rug is full; nothing in the room moves while it opens.
const ending=createEnding({onRestart:()=>resetRoom()});let endingTimer;
const halted=()=>ui.paused()||ending.active();
// One collection to gather with E: eleven story objects scattered around the room.
// Each one you find opens a Krik? Krak! card and takes its place on the middle rug.
const stories=environment.stories;
const storyCounter=document.querySelector('#story-counter'),storyCount=storyCounter.querySelector('.count');
let questSeen=false;
function pulse(el){el.classList.remove('pulse');void el.offsetWidth;el.classList.add('pulse');}
function revealStoryHud(){storyCounter.hidden=false;storyCount.textContent=String(stories.found());}
// You carry one object at a time: pick it up (it rides in your hands, low enough that
// you look down to see it), walk to the middle rug, then set it into its spot.
const heldGroup=new THREE.Group();heldGroup.visible=false;scene.add(heldGroup);
const heldForward=new THREE.Vector3();let held=null;const PLACE_RADIUS=1.0;
const atRug=()=>Math.hypot(player.x-RUG.x,player.z-RUG.z)<PLACE_RADIUS;
function clearHeld(){for(const c of [...heldGroup.children]){c.traverse(o=>{if(o.isMesh){o.geometry.dispose();const m=o.material;Array.isArray(m)?m.forEach(x=>x.dispose()):m.dispose();}});heldGroup.remove(c);}}
function pickUpStory(item){if(held)return;const def=stories.pickUp(item);if(!def)return;held=item;nearbyStory=null;clearHeld();
  buildStoryModel(heldGroup,def.model);
  // Objects are authored at wildly different sizes, so scale each so it reads clearly in hand.
  heldGroup.scale.setScalar(1);heldGroup.updateMatrixWorld(true);
  const size=new THREE.Box3().setFromObject(heldGroup).getSize(new THREE.Vector3());
  heldGroup.scale.setScalar(.3/Math.max(size.x,size.y,size.z||.2));
  heldGroup.visible=true;revealStoryHud();}
function placeStory(){if(!held||!stories.place(held))return;held=null;heldGroup.visible=false;clearHeld();revealStoryHud();pulse(storyCounter);
  if(stories.remaining()===0){storyCounter.classList.add('complete');
    // Let the last keepsake settle on the rug before the flower begins.
    endingTimer=setTimeout(startEnding,1800);}}
let dragging=false, lastPointer=null;
function look(dx,dy){yaw-=dx*.0025;pitch=THREE.MathUtils.clamp(pitch-dy*.0025,-1.35,1.35);}
canvas.addEventListener('click',()=>{if(!matchMedia('(pointer:fine)').matches)return;try{canvas.requestPointerLock?.()?.catch(()=>{});}catch{}});
document.addEventListener('pointerlockchange',()=>keys.clear());
canvas.addEventListener('pointerdown',e=>{dragging=true;lastPointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(document.pointerLockElement===canvas)return;if(dragging&&lastPointer){look(e.clientX-lastPointer.x,e.clientY-lastPointer.y);lastPointer={x:e.clientX,y:e.clientY};}});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{dragging=false;lastPointer=null;});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas)look(e.movementX,e.movementY);});
function inspect(){if(nearby){nearby.action();return;}if(held){if(atRug())placeStory();return;}if(nearbyStory)pickUpStory(nearbyStory);}
window.addEventListener('keydown',e=>{if(halted())return;if(e.code==='Space'&&!(e.target instanceof HTMLButtonElement)){e.preventDefault();if(!e.repeat)startJump(jump);return;}if(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright','e'].includes(e.key.toLowerCase())){if(e.target instanceof HTMLButtonElement && e.key.toLowerCase()==='e')return;e.preventDefault();keys.add(e.key.toLowerCase());if(e.key.toLowerCase()==='e'&&!e.repeat)inspect();}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());document.addEventListener('visibilitychange',()=>keys.clear());
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.key);if(b.dataset.key==='e')inspect();if(b.dataset.key==='jump')startJump(jump);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(b.dataset.key));});
document.querySelector('#prompt').addEventListener('click',inspect);
function resetRoom(){player.set(.5,0,1.45);Object.assign(jump,createMotion());yaw=.40;pitch=-.06;keys.clear();Object.assign(siege,createSiege());passAudio?.stop();passAudio=null;lastPass=-1;environment.setLight(true);renderer.shadowMap.needsUpdate=true;clearTimeout(gameOverTimer);gameOver.close();clearTimeout(endingTimer);ending.stop();endingMusic?.stop?.();endingMusic=null;stories.reset();held=null;heldGroup.visible=false;clearHeld();questSeen=false;nearbyStory=null;storyCounter.hidden=true;storyCounter.classList.remove('pulse','complete');storyCount.textContent='0';}
document.querySelector('#reset').addEventListener('click',resetRoom);
document.querySelector('#restart').addEventListener('click',resetRoom);
// Optional synthesized night ambience; begins only after the sound button is used.
// The same context and master gain carry the pounding on the door, so one toggle rules all sound.
let audio,master,soundOn=false;
function ensureAudio(){if(audio)return;audio=new AudioContext();loadKrik(audio);loadEzekiel(audio);loadEnding(audio);master=audio.createGain();master.gain.value=0;const compressor=audio.createDynamicsCompressor();compressor.threshold.value=-18;compressor.knee.value=12;compressor.ratio.value=6;compressor.attack.value=.003;compressor.release.value=.2;master.connect(compressor).connect(audio.destination);const buffer=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.18;const noise=audio.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=420;noise.connect(filter).connect(master);noise.start();setInterval(()=>{if(!soundOn||document.hidden)return;const t=audio.currentTime;const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(1050,t);o.frequency.linearRampToValueAtTime(1300,t+.35);o.frequency.linearRampToValueAtTime(970,t+.8);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.025,t+.15);g.gain.linearRampToValueAtTime(0,t+.9);o.connect(g).connect(master);o.start(t);o.stop(t+1);},15000);}
document.querySelector('#sound').addEventListener('click',()=>{ensureAudio();audio.resume();soundOn=!soundOn;master.gain.setTargetAtTime(soundOn?.38:0,audio.currentTime,.4);document.querySelector('#sound').textContent=soundOn?'◉   Sound on':'◌   Sound off';document.querySelector('#sound').setAttribute('aria-pressed',String(soundOn));});
// The visitor: quiet, then pounding until the light is flicked off and on, or the door gives way.
// Each pass of sound is scheduled on the audio clock from the moment the pass begins, so it stays in step with the shake.
const siege=createSiege(),gameOver=document.querySelector('#gameover-dialog');
const DOOR=new THREE.Vector2(2.09*.62,-2.67*.68);let passAudio=null,lastPass=-1,lastVoice=-1,gameOverTimer;
const VOICE_INTERVAL=4; // Ezekiel calls through the door every four seconds while pounding.
function doorPan(){const toDoor=Math.atan2(-(DOOR.x-camera.position.x),-(DOOR.y-camera.position.z));return -Math.sin(toDoor-yaw);}
function flipSwitch(){
  if(siege.phase==='broken')return;
  const on=!environment.lightOn();environment.setLight(on);setLight(siege,on);renderer.shadowMap.needsUpdate=true;
  if(soundOn&&audio)scheduleClick(audio,master,audio.currentTime);
}
function advanceSiege(dt){
  const entered=stepSiege(siege,dt);
  if(entered==='broken'){passAudio?.stop();passAudio=null;lastPass=-1;lastVoice=-1;if(soundOn&&audio)scheduleBreak(audio,master,audio.currentTime+.02,doorPan());
    gameOverTimer=setTimeout(()=>{document.exitPointerLock?.();keys.clear();gameOver.showModal();},1400);}
  if(entered==='gone'){passAudio?.stop();passAudio=null;lastPass=-1;lastVoice=-1;}
  if(siege.phase==='pounding'){const pass=Math.floor(siege.elapsed/DURATION);
    if(pass!==lastPass){lastPass=pass;passAudio?.stop();passAudio=null;
      if(soundOn&&audio&&!document.hidden)passAudio=schedulePounding(audio,master,audio.currentTime-siege.elapsed%DURATION,doorPan(),1+pass*.25,siege.presence);}
    // Ezekiel calls through the door every four seconds, fading with the visitor.
    const voice=Math.floor(siege.elapsed/VOICE_INTERVAL);
    if(voice!==lastVoice){lastVoice=voice;if(soundOn&&audio&&!document.hidden)scheduleEzekiel(audio,master,audio.currentTime+.02,doorPan(),siege.presence);}
    // The knocking and the voice fade with the visitor as the room stays dark.
    passAudio?.level(siege.presence);}
}
// When the gardenia opens, cut every other sound and let the closing song carry the ending.
let endingMusic=null;
function startEnding(){
  document.exitPointerLock?.();keys.clear();
  ensureAudio();audio.resume?.();
  soundOn=false;passAudio?.stop?.();passAudio=null;lastPass=-1;lastVoice=-1;
  master.gain.cancelScheduledValues(audio.currentTime);master.gain.setTargetAtTime(0,audio.currentTime,.12);
  const sound=document.querySelector('#sound');sound.textContent='◌   Sound off';sound.setAttribute('aria-pressed','false');
  loadEnding(audio).then(()=>{endingMusic?.stop?.();endingMusic=playEnding(audio,audio.destination);});
  ending.start();
}
gameOver.addEventListener('cancel',e=>e.preventDefault());
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();
const clock=new THREE.Clock();
const prompt=document.querySelector('#prompt'),promptText=prompt.querySelector('span');
let frameTime=16.7,frameSamples=0,qualityTimer=0;
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
  if(!halted()&&(keys.has('w')||keys.has('arrowup')))z--;
  if(!halted()&&(keys.has('s')||keys.has('arrowdown')))z++;
  if(!halted()&&keys.has('a'))x--;
  if(!halted()&&keys.has('d'))x++;
  if(!halted()&&keys.has('arrowleft'))yaw+=dt*1.6;
  if(!halted()&&keys.has('arrowright'))yaw-=dt*1.6;
  let dx=0,dz=0;
  if(x||z){
    const length=Math.hypot(x,z);x/=length;z/=length;
    dx=(x*Math.cos(yaw)+z*Math.sin(yaw))*2.25*dt;
    dz=(-x*Math.sin(yaw)+z*Math.cos(yaw))*2.25*dt;

  }
  if(!halted())stepPlayer(jump,player,dx,dz,dt);
  camera.position.set(player.x*.62,FLOOR_HEIGHT+EYE_HEIGHT+jump.height,player.z*.68);
  camera.rotation.set(pitch,yaw,0,'YXZ');
  // A carried object rides in front of the player at hand height, turning slowly so you
  // can look down and see it; it stays a fixed drop below the eye even mid-jump.
  if(held){camera.getWorldDirection(heldForward);heldForward.y=0;heldForward.normalize();
    heldGroup.position.set(camera.position.x+heldForward.x*.5+heldForward.z*.09,camera.position.y-.3+Math.sin(t*2)*.012,camera.position.z+heldForward.z*.5-heldForward.x*.09);
    heldGroup.rotation.y+=dt*.6;}
  if(!halted())advanceSiege(dt);
  environment.update(t,siege);
  nearby=null;let nearest=Infinity;
  // Closest relative to each target's reach, so the small switch beats the wide washstand beside it.
  for(const detail of details){const distance=Math.hypot(player.x-detail.x,player.z-detail.z)/detail.r;if(distance<1&&distance<nearest){nearby=detail;nearest=distance;}}
  nearbyStory=held?null:nearestStory(player.x,player.z,stories.items,jump.support);
  if(!questSeen&&Math.hypot(player.x-RUG.x,player.z-RUG.z)<1.1){questSeen=true;revealStoryHud();}
  const promptLabel=nearby?(nearby.prompt??nearby.title.toLowerCase())
    :held?(atRug()?('place the '+held.def.short+' on the rug'):'carry it to the rug')
    :nearbyStory?('take the '+nearbyStory.def.short):null;
  if(promptLabel!==lastPromptLabel){prompt.hidden=!promptLabel;if(promptLabel)promptText.textContent=promptLabel;lastPromptLabel=promptLabel;}
  renderer.render(scene,camera);
  if(import.meta.env.DEV){jumpPeak=Math.max(jumpPeak,jump.height);if(frameSamples%30===0)canvas.dataset.diagnostics=JSON.stringify({frameMs:Math.round(frameTime*10)/10,drawCalls:renderer.info.render.calls,renderScale,eyeHeight:EYE_HEIGHT,jumpPeak,support:jump.support,feetHeight:jump.height,position:{x:player.x,z:player.z},batching:environment.batching});}
});
requestAnimationFrame(()=>{document.querySelector('#loading').style.opacity='0';setTimeout(()=>document.querySelector('#loading').remove(),700);});
// Read-only state for checking movement and collision behavior in a browser.
window.roomState=()=>({position:player.toArray(),yaw,pitch,nearby:nearby?.title,nearbyStory:nearbyStory?nearbyStory.def.id:null,support:jump.support,storiesFound:stories.found(),storiesRemaining:stories.remaining(),eyeHeight:EYE_HEIGHT,cameraHeight:camera.position.y,jumpHeight:jump.height,renderScale,frameTime,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,objects:scene.children.length,siege:siege.phase,siegeElapsed:siege.elapsed,presence:siege.presence,lightOn:environment.lightOn(),doorAngle:environment.door.rotation.y,doorPush:environment.door.position.z,soundOn,masterGain:master?+master.gain.value.toFixed(3):null,endingActive:ending.active()});
// Dev-only hooks used by automated verification; stripped from production builds.
if(import.meta.env.DEV){
  window.collectStory=i=>{const it=typeof i==='number'?stories.items[i]:nearbyStory;if(it){pickUpStory(it);placeStory();}};
  window.pickUpStory=i=>pickUpStory(typeof i==='number'?stories.items[i]:nearbyStory);
  window.placeStory=()=>placeStory();
  window.heldId=()=>held?held.def.id:null;
  window.setView=(y,p)=>{yaw=y;if(p!==undefined)pitch=p;};
  window.playEnding=()=>startEnding();
}
