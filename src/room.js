import * as THREE from 'three';
import { beddingPoint } from './bedding.js';
import { rugSlots } from './rug.js';
import { STORIES } from './stories.js';
import { buildStoryModel } from './story-models.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { doorShake, DURATION } from './pounding.js';
import { LIMIT } from './siege.js';

// All surfaces are generated locally; a fixed seed keeps the wear consistent.
let seed=1992;
const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
function surface(kind,base,size=1024){
  const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');
  g.fillStyle=base;g.fillRect(0,0,size,size);
  if(kind==='plaster'||kind==='cement'){
    for(let i=0;i<650;i++){
      const x=random()*size,y=random()*size,r=12+random()*130;
      const grad=g.createRadialGradient(x,y,0,x,y,r);
      grad.addColorStop(0,`rgba(76,69,47,${random()*.045})`);grad.addColorStop(1,'rgba(76,69,47,0)');g.fillStyle=grad;g.fillRect(x-r,y-r,r*2,r*2);
    }
    for(let i=0;i<90000;i++){g.fillStyle=`rgba(${random()>.5?'250,244,217':'57,53,40'},${random()*.09})`;const r=random()*2;g.fillRect(random()*size,random()*size,r,r);}
    if(kind==='plaster'){
      // Moisture follows the base of the wall, with chipped whitewash above it.
      const damp=g.createLinearGradient(0,size*.7,0,size);damp.addColorStop(0,'#4b504100');damp.addColorStop(1,'#4b504159');g.fillStyle=damp;g.fillRect(0,0,size,size);
      for(let i=0;i<110;i++){const x=random()*size,y=size*(.8+random()*.2),r=3+random()*17;g.fillStyle=['#a09c84','#b0a68a','#c3b99c'][i%3];g.beginPath();for(let j=0;j<12;j++){const a=j/12*Math.PI*2,k=r*(.35+random());g.lineTo(x+Math.cos(a)*k,y+Math.sin(a)*k*.6);}g.closePath();g.fill();}
      for(let i=0;i<8;i++){let x=random()*size,y=random()*size;g.strokeStyle='#514c393e';g.lineWidth=.6;g.beginPath();g.moveTo(x,y);for(let j=0;j<12;j++){x+=random()*14-7;y+=random()*12;g.lineTo(x,y);}g.stroke();}
    }
  }else if(kind==='wood'){
    for(let i=0;i<1800;i++){const x=random()*size;g.strokeStyle=`rgba(${i%3?'24,18,12':'217,187,122'},${.03+random()*.11})`;g.lineWidth=.3+random()*1.8;g.beginPath();g.moveTo(x,0);for(let y=0;y<=size;y+=16)g.lineTo(x+Math.sin(y*.012+x)*2+Math.sin(y*.038)*.7,y);g.stroke();}
    for(let i=0;i<6;i++){const x=random()*size,y=random()*size;for(let r=2;r<24;r+=2){g.strokeStyle='#271b1227';g.beginPath();g.ellipse(x,y,r*.35,r*2,.03,0,Math.PI*2);g.stroke();}}
    for(let i=0;i<300;i++){g.fillStyle='#ddbf8522';g.fillRect(random()*size,random()*size,.5+random(),random()*55);}
  }else if(kind==='cloth'){
    for(let i=0;i<size;i+=3){g.strokeStyle=i%2?'#f1e7c84d':'#514c3a32';g.lineWidth=1;g.beginPath();g.moveTo(i,0);g.lineTo(i,size);g.moveTo(0,i);g.lineTo(size,i);g.stroke();}
    for(let i=0;i<3000;i++){g.fillStyle='#4d4a3020';g.fillRect(random()*size,random()*size,2,2);}
  }else if(kind==='metal'){
    for(let i=0;i<14000;i++){g.fillStyle=i%4?'#18221c15':'#a4673438';g.fillRect(random()*size,random()*size,random()*4,random()*4);}
  }
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;
  const bump=t.clone();bump.colorSpace=THREE.NoColorSpace;bump.needsUpdate=true;
  return {map:t,bumpMap:bump};
}
function material(kind,color,roughness=.85,bumpScale=.02){return new THREE.MeshStandardMaterial({...surface(kind,color),roughness,bumpScale});}

export async function buildRoom(scene){
  const room=new THREE.Group();room.scale.set(.62,.77,.68);scene.add(room);
  const plaster=material('plaster','#d0c9b0',.96,.022), cement=material('cement','#888372',.95,.016);
  const wood=material('wood','#63513b',.85,.015),woodDark=material('wood','#382f24',.87,.013),shutterWood=material('wood','#495248',.94,.018);
  const iron=material('metal','#33382f',.64,.012),brass=material('metal','#8a713e',.43,.008);
  const sheet=material('cloth','#c9c1a5',.98,.008),pillowMat=material('cloth','#d4cbb4',1,.006),blanketMat=material('cloth','#596c68',.97,.009);
  const ceramic=new THREE.MeshPhysicalMaterial({color:'#cec7ad',roughness:.26,clearcoat:.55,clearcoatRoughness:.3});
  const enamel=new THREE.MeshPhysicalMaterial({color:'#b7c5b9',roughness:.24,metalness:.15,clearcoat:.65});
  const black=new THREE.MeshStandardMaterial({color:'#292c25',roughness:.8});
  const loader=new GLTFLoader(),textureLoader=new THREE.TextureLoader();
  const loadJobs=[];
  async function pbr(target,id,repeat=[1,1],strength=.5){
    const [map,normalMap,roughnessMap]=await Promise.all(['Diffuse','nor_gl','Rough'].map(name=>textureLoader.loadAsync(`/assets/${id}/${name}.jpg`)));
    for(const t of [map,normalMap,roughnessMap]){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);t.anisotropy=8;}
    map.colorSpace=THREE.SRGBColorSpace;
    Object.assign(target,{map,normalMap,roughnessMap,bumpMap:null,normalScale:new THREE.Vector2(strength,strength)});target.needsUpdate=true;
  }
  loadJobs.push(pbr(plaster,'white_plaster_02',[2,1],.22),pbr(cement,'concrete_floor_worn_001',[2,2],.65),pbr(wood,'wooden_planks',[.32,1],.55),pbr(woodDark,'wooden_planks',[.32,1],.45));
  woodDark.color.set('#62513e');
  async function imported(id,dimensions,position,{filter,plain,rotation=0,reset=false}={}){
    const data=await loader.loadAsync(`/assets/${id}/${id}.gltf`);
    const group=new THREE.Group();
    for(const child of [...data.scene.children]){if(filter&&!filter(child.name))continue;group.add(child);if(reset){child.position.set(0,0,0);child.quaternion.identity();child.scale.set(1,1,1);}}
    group.rotation.y=rotation;group.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(group),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
    const wrapper=new THREE.Group();wrapper.add(group);group.position.sub(new THREE.Vector3(center.x,bounds.min.y,center.z));
    wrapper.scale.set(dimensions[0]/size.x,dimensions[1]/size.y,dimensions[2]/size.z);wrapper.position.set(...position);
    wrapper.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;if(plain){const original=o.material;o.material=plain.clone();o.material.normalMap=original.normalMap;o.material.roughnessMap=original.roughnessMap;o.material.normalScale.set(.5,.5);}const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){if(m.map)m.map.anisotropy=8;}}});room.add(wrapper);return wrapper;
  }
  function mesh(geo,m,x=0,y=0,z=0,parent=room){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function box(w,h,d,m,x,y,z,r=.008,parent=room){return mesh(r?new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)):new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);}
  function rod(a,b,r,m=iron,parent=room){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),v=bv.clone().sub(av);const o=mesh(new THREE.CylinderGeometry(r,r,v.length(),12),m,0,0,0,parent);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return o;}
  function lathe(points,m,x,y,z){return mesh(new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),64),m,x,y,z);}
  function tube(points,r,m,parent=room){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),40,r,8,false),m,0,0,0,parent);}
  function torus(r,t,m,x,y,z){const o=mesh(new THREE.TorusGeometry(r,t,8,64),m,x,y,z);o.rotation.x=Math.PI/2;return o;}
  function ball(x,y,z,sx,sy,sz,m,parent=room){const o=mesh(new THREE.SphereGeometry(1,24,16),m,x,y,z,parent);o.scale.set(sx,sy,sz);return o;}
  function nail(x,y,z,parent=room){const o=mesh(new THREE.CylinderGeometry(.012,.012,.009,10),iron,x,y,z,parent);o.rotation.x=Math.PI/2;box(.013,.002,.002,black,x,y,z+.006,0,parent);}
  // Less than thirteen square metres, with a low ceiling and worn cement floor.
  box(6,.15,4.9,cement,0,-.055,-.35,0);
  box(6,3.5,.16,plaster,0,1.75,-2.8,0);
  box(.16,3.5,4.9,plaster,3,1.75,-.35,0);
  box(6,3.5,.16,plaster,0,1.75,2.1,0);
  box(.16,.85,4.9,plaster,-3,.425,-.35,0);
  box(.16,.65,4.9,plaster,-3,3.175,-.35,0);
  box(.16,2,1.25,plaster,-3,1.85,-2.175,0);
  box(.16,2,1.85,plaster,-3,1.85,1.175,0);
  // Individual aged boards with staggered joints, bevelled edges and fastening nails.
  const ceiling=new THREE.MeshStandardMaterial({color:'#aaa18c',roughness:.9});
  loadJobs.push(pbr(ceiling,'wooden_planks',[1,1],.35));
  for(let i=0;i<24;i++){
    const x=-3+(i+.5)*.25, joint=-.65+(i%3)*.49;
    for(const [start,end] of [[-2.8,joint],[joint,2.1]]){
      const board=box(.244,.055,end-start-.008,ceiling,x,3.50+(i%5)*.001,(start+end)/2,.005);
      // Small UV offsets keep neighbouring boards from repeating the same grain.
      const uv=board.geometry.attributes.uv;for(let j=0;j<uv.count;j++)uv.setXY(j,uv.getY(j)*.8+(i%4)*.05,.012+uv.getX(j)*.035);
    }
    for(const z of [-2.60,1.91]){const pin=mesh(new THREE.CylinderGeometry(.009,.009,.004,8),iron,x,3.47,z);}
  }
  for(const x of [-2.8,0,2.8]){
    box(.17,.21,4.9,woodDark,x,3.39,-.35,.012);
    for(const z of [-2.62,1.9]){box(.21,.028,.25,iron,x,3.276,z,.004);for(const dz of [-.075,.075])mesh(new THREE.CylinderGeometry(.018,.018,.009,10),iron,x,3.256,z+dz);}
  }
  for(const z of [-2.67,1.96])box(6,.12,.08,woodDark,0,.09,z);
  // Irregular tide marks and flaked whitewash sit above the skirting.
  const ageCanvas=document.createElement('canvas');ageCanvas.width=1024;ageCanvas.height=256;
  const ag=ageCanvas.getContext('2d');
  for(let i=0;i<380;i++){const x=random()*1024,y=160+random()*96,r=5+random()*48;const fade=ag.createRadialGradient(x,y,0,x,y,r);fade.addColorStop(0,'#424a3840');fade.addColorStop(1,'#424a3800');ag.fillStyle=fade;ag.fillRect(x-r,y-r,r*2,r*2);}
  for(let i=0;i<150;i++){const x=random()*1024,y=180+random()*76;ag.fillStyle=i%2?'#aa9c7d80':'#837b6266';ag.beginPath();for(let j=0;j<8;j++){const a=j/8*Math.PI*2,r=2+random()*8;ag.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r*.6);}ag.closePath();ag.fill();}
  const ageTex=new THREE.CanvasTexture(ageCanvas);ageTex.colorSpace=THREE.SRGBColorSpace;
  const ageMat=new THREE.MeshStandardMaterial({map:ageTex,transparent:true,depthWrite:false,roughness:1,polygonOffset:true,polygonOffsetFactor:-1});
  const backAge=mesh(new THREE.PlaneGeometry(5.9,.75),ageMat,0,.49,-2.714);backAge.castShadow=false;
  const rightAge=mesh(new THREE.PlaneGeometry(4.8,.75),ageMat,2.914,.49,-.35);rightAge.rotation.y=-Math.PI/2;rightAge.castShadow=false;
  // Subtle hairline cracks on the unglazed cement, no decorative tile grid.
  for(let k=0;k<7;k++){let x=-2.8+random()*5.6,z=-2.5+random()*4.3;const pts=[];for(let i=0;i<8;i++){pts.push(new THREE.Vector3(x,.023,z));x+=random()*.15-.03;z+=random()*.13-.065;}const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:'#524e42',transparent:true,opacity:.32}));room.add(line);}
  // Thick shutter stiles, narrow open slats, hinges and a working-looking latch.
  for(const z of [-1.57,.27])box(.30,2.12,.1,woodDark,-2.99,1.85,z);
  for(const y of [.83,2.86])box(.32,.11,1.96,woodDark,-2.98,y,-.65);
  box(.52,.075,2.02,wood,-2.87,.81,-.65);
  for(const z of [-1.12,-.2]){
    for(const zz of [z-.42,z+.42])box(.13,1.95,.07,shutterWood,-2.97,1.85,zz);
    for(let y=.98;y<2.8;y+=.145){const slat=box(.22,.036,.78,shutterWood,-2.97,y,z);slat.rotation.z=-.34;}
    for(const y of [1.12,2.6]){box(.025,.13,.15,iron,-2.87,y,z-.37);rod([-2.85,y-.07,z-.4],[-2.85,y+.07,z-.4],.015);}
  }
  box(.055,.055,.3,iron,-2.84,1.72,-.64);
  // An exterior wall and a slice of night, visible through the louvers.
  box(.1,4,8,material('plaster','#465650'),-4.4,1.5,-.5,0);
  const night=new THREE.MeshBasicMaterial({color:'#263e40'});box(.05,5,10,night,-6,2,-.5,0);
  // Planked door with joinery, hinges and an interior sliding bolt.
  // The frame is fixed; the leaf hangs in its own group, pivoted on the hinge edge, so it can be shaken.
  for(const x of [1.45,2.72])box(.1,2.7,.18,woodDark,x,1.35,-2.61);
  box(1.38,.11,.19,woodDark,2.09,2.7,-2.61);
  // The leaf fills the frame exactly, its back face just clear of the plaster, hung on the stile's inner face.
  const door=new THREE.Group(),hinge=new THREE.Vector3(1.50,0,-2.665);room.add(door);
  for(let i=0;i<6;i++)box(.19,2.62,.10,wood,1.595+i*.195,1.33,-2.665,.008,door);
  for(const y of [.36,2.15]){box(1.13,.13,.07,woodDark,2.085,y,-2.58,.008,door);for(const x of [1.62,2.55])nail(x,y,-2.541,door);}
  box(.13,.18,.028,iron,2.45,1.18,-2.60,.008,door);ball(2.45,1.18,-2.55,.046,.046,.055,brass,door);
  box(.31,.06,.05,iron,2.55,1.58,-2.59,.008,door);
  const bolt=new THREE.Group();door.add(bolt);rod([2.42,1.58,-2.55],[2.72,1.58,-2.55],.016,iron,bolt);rod([2.52,1.58,-2.55],[2.52,1.65,-2.55],.016,iron,bolt);
  door.traverse(o=>{o.userData.dynamic=true;if(o.isMesh)o.position.sub(hinge);});door.position.copy(hinge);
  // A bakelite switch beside the frame. Its lever is the only part that moves.
  const bakelite=new THREE.MeshStandardMaterial({color:'#2b2622',roughness:.45});
  box(.095,.135,.02,bakelite,1.18,1.35,-2.71,.004);
  const lever=new THREE.Group();lever.position.set(1.18,1.35,-2.70);room.add(lever);
  box(.028,.064,.03,ceramic,0,0,.015,.005,lever);lever.traverse(o=>{o.userData.dynamic=true;});
  let leverVelocity=0;
  // A little plaster falls from the lintel when the door is struck.
  const grit=new THREE.BufferGeometry(),gritPositions=new Float32Array(30*3),gritVelocity=new Float32Array(30*3);
  grit.setAttribute('position',new THREE.BufferAttribute(gritPositions,3));
  const gritPoints=new THREE.Points(grit,new THREE.PointsMaterial({color:'#d0c9b0',size:.014,transparent:true,opacity:0,depthWrite:false}));gritPoints.frustumCulled=false;room.add(gritPoints);
  let gritAge=Infinity,lastTime=0;
  // A small crucifix left by the owner; dark wood and a worn metal corpus.
  box(.09,.68,.045,woodDark,-1.59,2.66,-2.67);box(.37,.075,.047,woodDark,-1.59,2.8,-2.65);
  ball(-1.59,2.86,-2.59,.035,.044,.023,brass);rod([-1.59,2.82,-2.58],[-1.59,2.64,-2.58],.027,brass);
  rod([-1.59,2.78,-2.58],[-1.73,2.81,-2.60],.014,brass);rod([-1.59,2.78,-2.58],[-1.45,2.81,-2.60],.014,brass);
  rod([-1.61,2.65,-2.58],[-1.59,2.48,-2.60],.016,brass);rod([-1.57,2.65,-2.58],[-1.59,2.48,-2.60],.016,brass);
  box(.09,.05,.024,sheet,-1.59,2.64,-2.55);
  // Single iron bed with round rails, hardware, mattress ticking and soft bedding.
  for(const x of [-2.5,-1.13])for(const z of [-1.67,1.2]){rod([x,.06,z],[x,z<0?1.18:.85,z],.033);ball(x,z<0?1.20:.87,z,.049,.049,.049,iron);}
  for(const x of [-2.5,-1.13])rod([x,.44,-1.67],[x,.44,1.2],.027);
  for(const z of [-1.67,1.2]){rod([-2.5,z<0?1.1:.8,z],[-1.13,z<0?1.1:.8,z],.026);rod([-2.5,.55,z],[-1.13,.55,z],.023);for(let x=-2.35;x<-1.2;x+=.23)rod([x,.55,z],[x,z<0?1.1:.8,z],.012);}
  for(let z=-1.55;z<1.2;z+=.22)box(1.35,.035,.08,wood,-1.815,.43,z);
  const mattress=box(1.35,.16,2.76,sheet,-1.815,.545,-.23,.065);
  loadJobs.push(imported('throw_pillows_01',[.89,.19,.49],[-1.82,.666,-1.28],{filter:n=>n.endsWith('pillow02'),plain:pillowMat,reset:true}));
  function fabric(w,d,m,x,y,z,drop=.16){const geo=new THREE.PlaneGeometry(w,d,80,80);const p=geo.attributes.position;for(let i=0;i<p.count;i++){const u=p.getX(i),v=p.getY(i);const edge=Math.max(0,(Math.abs(u)-w*.40)/(w*.1));p.setXYZ(i,u,-edge*drop+.012*Math.sin(u*26+v*9)+.006*Math.sin(v*40),v);}geo.computeVertexNormals();const o=mesh(geo,m,x,y,z);o.material.side=THREE.DoubleSide;return o;}
  function bedCloth(zStart,zEnd,m,layer){
    const geometry=new THREE.PlaneGeometry(2,1,96,72),p=geometry.attributes.position;
    for(let i=0;i<p.count;i++){const z=THREE.MathUtils.lerp(zStart,zEnd,p.getY(i)+.5),v=beddingPoint(p.getX(i),z,layer);p.setXYZ(i,v.x,v.y,v.z);}
    geometry.computeVertexNormals();m.side=THREE.DoubleSide;return mesh(geometry,m,-1.815,0,0);
  }
  bedCloth(-1.53,1.08,sheet,0);
  bedCloth(.25,1.04,blanketMat,1);
  // Woven stripes sit on the blanket itself, with the exact same folds.
  for(const z of [.30,.34,.94,.98]){
    const geometry=new THREE.PlaneGeometry(2,.012,96,1),p=geometry.attributes.position;
    for(let i=0;i<p.count;i++){const v=beddingPoint(p.getX(i),z+p.getY(i),1);p.setXYZ(i,v.x,v.y+.002,v.z);}
    geometry.computeVertexNormals();mesh(geometry,pillowMat,-1.815,0,0).castShadow=false;
  }
  // Rectangular hanging net: vertical folds, stitched hems, a parted entry.
  const nc=document.createElement('canvas');nc.width=nc.height=64;const ng=nc.getContext('2d');ng.fillStyle='#ddd8bd12';ng.fillRect(0,0,64,64);ng.strokeStyle='#e9e5cfb8';ng.lineWidth=.8;for(let i=0;i<=64;i+=8){ng.beginPath();ng.moveTo(i,0);ng.lineTo(i,64);ng.moveTo(0,i);ng.lineTo(64,i);ng.stroke();}
  const nt=new THREE.CanvasTexture(nc);nt.wrapS=nt.wrapT=THREE.RepeatWrapping;nt.repeat.set(34,42);nt.anisotropy=8;
  const netMat=new THREE.MeshStandardMaterial({map:nt,color:'#d5d1b6',transparent:true,opacity:.26,side:THREE.DoubleSide,depthWrite:false,roughness:1});
  const netPanels=[];
  function curtain(x1,z1,x2,z2,part=false){const geo=new THREE.PlaneGeometry(1,1,40,28);const p=geo.attributes.position;
    for(let i=0;i<p.count;i++){const u=p.getX(i)+.5,v=p.getY(i)+.5;let x=THREE.MathUtils.lerp(x1,x2,u),z=THREE.MathUtils.lerp(z1,z2,u),y=.38+v*2.37;const fold=Math.sin(u*Math.PI*22)*.034*(1-v*.4);if(x1===x2)x+=fold;else z+=fold;if(part){z+=Math.sin(v*Math.PI)*.38*(1-u);y+=Math.sin(u*Math.PI)*.08;}p.setXYZ(i,x,y,z);}geo.computeVertexNormals();const o=mesh(geo,netMat);o.castShadow=false;netPanels.push({mesh:o,base:p.array.slice()});

  }
  curtain(-2.64,-1.82,-2.64,1.37);curtain(-2.64,-1.82,-1.0,-1.82);curtain(-2.64,1.37,-1.0,1.37);curtain(-1.0,-1.82,-1.0,-.58,true);curtain(-1.0,.12,-1.0,1.37,true);
  for(const x of [-2.64,-1.0]){rod([x,2.75,-1.82],[x,2.75,1.37],.009,sheet);for(const z of [-1.82,1.37])rod([x,2.75,z],[x,3.35,z],.005,sheet);}
  const canopy=fabric(1.64,3.19,netMat,-1.82,2.76,-.225,.025);canopy.castShadow=false;
  // Simple carpentry, with aprons, stretchers, end grain and exposed nail heads.
  function table(x,z,w,d,h){for(const dx of [-w/2+.065,w/2-.065])for(const dz of [-d/2+.065,d/2-.065])box(.075,h,.075,wood,x+dx,h/2,z+dz);
    for(const dz of [-d/2+.06,d/2-.06]){box(w-.06,.12,.045,woodDark,x,h-.09,z+dz);box(w-.12,.045,.045,wood,x,.24,z+dz);}
    const boards=Math.ceil(w/.2),bw=w/boards;for(let i=0;i<boards;i++)box(bw-.005,.065,d,wood,x-w/2+bw*(i+.5),h,z);
    for(const dx of [-w/2+.07,w/2-.07])nail(x+dx,h-.08,z+d/2-.03);
  }
  table(-.55,-1.82,.65,.66,.68);
  // A kerosene hurricane lamp, turned reservoir, burner, clear chimney and guard.
  const lampX=-.55,lampZ=-1.82;
  lathe([[0,0],[.14,0],[.15,.025],[.14,.06],[.125,.12],[.08,.16],[.06,.17]],iron,lampX,.72,lampZ);
  torus(.14,.012,brass,lampX,.755,lampZ);lathe([[0,0],[.09,0],[.09,.025],[.065,.045],[.06,.08]],brass,lampX,.87,lampZ);
  const glass=new THREE.MeshPhysicalMaterial({color:'#fff4d8',roughness:.07,transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false});
  const chimney=lathe([[.07,0],[.10,.05],[.10,.13],[.065,.24],[.057,.33],[.065,.35]],glass,lampX,.95,lampZ);chimney.castShadow=false;
  torus(.065,.007,iron,lampX,1.305,lampZ);
  for(const side of [-1,1])tube([[lampX+side*.11,.9,lampZ],[lampX+side*.15,1.03,lampZ],[lampX+side*.11,1.29,lampZ],[lampX+side*.065,1.32,lampZ]],.01,iron);
  tube([[lampX-.11,1.23,lampZ],[lampX-.14,1.43,lampZ],[lampX,1.5,lampZ],[lampX+.14,1.43,lampZ],[lampX+.11,1.23,lampZ]],.008,iron);
  rod([lampX+.07,.94,lampZ],[lampX+.15,.94,lampZ],.012,brass);
  box(.025,.036,.018,black,lampX,.974,lampZ);
  const flame=ball(lampX,1.035,lampZ,.022,.067,.018,new THREE.MeshBasicMaterial({color:'#ffd27a'}));flame.castShadow=false;
  const core=ball(lampX,1.015,lampZ+.006,.012,.038,.011,new THREE.MeshBasicMaterial({color:'#fff4c9'}));core.castShadow=false;
  const lamp=new THREE.PointLight('#ffbc70',6,10,2);lamp.position.set(lampX,1.08,lampZ+.12);lamp.castShadow=true;lamp.shadow.mapSize.set(1024,1024);lamp.shadow.bias=-.0005;lamp.shadow.normalBias=.008;lamp.shadow.camera.near=.03;lamp.shadow.radius=3;room.add(lamp);
  // A matchbox and two burned matches, small enough to belong on this table.
  box(.16,.035,.11,woodDark,-.73,.734,-1.64);box(.14,.004,.10,pillowMat,-.73,.754,-1.64);
  box(.07,.005,.046,material('cloth','#944d36'),-.73,.758,-1.64);
  for(let i=0;i<2;i++){rod([-.4+i*.025,.72,-1.66],[-.36+i*.025,.72,-1.59],.0035,wood);ball(-.36+i*.025,.72,-1.59,.005,.005,.005,black);}
  // True concave basin, rolled enamel rim, still water, soap and a poured-lip jug.
  table(.65,-2.2,.96,.68,.92);
  lathe([[0,0],[.18,0],[.20,.015],[.27,.12],[.29,.15],[.286,.164],[.273,.16],[.255,.12],[.185,.035],[0,.035]],enamel,.49,.962,-2.21);
  torus(.282,.014,shutterWood,.49,1.124,-2.21);
  const water=mesh(new THREE.CircleGeometry(.234,64),new THREE.MeshPhysicalMaterial({color:'#647d72',roughness:.15,transparent:true,opacity:.65,metalness:.25}),.49,1.058,-2.21);water.rotation.x=-Math.PI/2;water.castShadow=false;
  loadJobs.push(imported('jug_01',[.32,.41,.25],[.99,.962,-2.29],{rotation:-.5}));
  box(.13,.035,.09,new THREE.MeshStandardMaterial({color:'#beb88b',roughness:.6}),.18,1.005,-2.04,.016);
  const towel=fabric(.29,.57,pillowMat,.68,.979,-1.91,.01);
  const tg=towel.geometry.attributes.position;for(let i=0;i<tg.count;i++){const z=tg.getZ(i);if(z>.1){tg.setY(i,tg.getY(i)-(z-.1)*1.9);tg.setZ(i,.1+(z-.1)*.14);}}towel.geometry.computeVertexNormals();
  // A small real reflection, held by a tarnished wooden frame.
  box(.54,.74,.04,woodDark,.6,2.06,-2.66);
  const mirror=new Reflector(new THREE.PlaneGeometry(.44,.64),{color:0x92998a,textureWidth:384,textureHeight:384,clipBias:.003});mirror.position.set(.6,2.06,-2.632);room.add(mirror);
  const reflect=mirror.onBeforeRender;let lastReflection=-Infinity;
  mirror.onBeforeRender=function(...args){const now=performance.now();if(now-lastReflection<100)return;lastReflection=now;reflect.apply(this,args);};
  for(const x of [.36,.84])nail(x,2.40,-2.63);
  // Plain rush-seat chair, a scuffed case, sandals and a handwoven floor mat.
  loadJobs.push(imported('painted_wooden_chair_02',[.60,1.13,.60],[2.13,.03,.25],{rotation:Math.PI*.08}));
  loadJobs.push(imported('vintage_suitcase',[.72,.35,.43],[2.3,.03,1.05],{filter:n=>n.startsWith('vintage_suitcase_01'),rotation:.1}));
  const leather=material('cloth','#64513b',.83,.008);
  const rug=material('cloth','#95815d',1,.018);box(1.27,.012,.92,rug,.15,.032,.32,.003);
  for(let z=-.12;z<.78;z+=.025)rod([-.48,.044,z],[.78,.044,z],.005,wood);
  for(let x=-.46;x<.8;x+=.038){rod([x,.036,-.19-random()*.025],[x,.04,-.12],.004,sheet);rod([x,.04,.78],[x,.036,.84+random()*.025],.004,sheet);}
  // The middle rug is a display mat with an empty spot for every object to gather.
  // Each story has two instances: one scattered in the room to find, and a second,
  // hidden copy waiting in its spot on the rug. All use the transparent materials
  // from story-models, so they stay out of the static geometry batch and toggle freely.
  const slots=rugSlots(STORIES.length);
  const socketMat=new THREE.MeshStandardMaterial({color:'#544834',roughness:1,transparent:true,opacity:.92});
  const storyItems=[];
  for(let i=0;i<STORIES.length;i++){
    const def=STORIES[i],s=slots[i];
    const socket=mesh(new THREE.CircleGeometry(Math.min(s.w,s.d)*.5,20),socketMat,s.x,.05,s.z);socket.rotation.x=-Math.PI/2;socket.castShadow=false;
    const group=new THREE.Group();group.position.set(def.x,def.y,def.z);group.rotation.y=random()*6.28;room.add(group);buildStoryModel(group,def.model);
    const display=new THREE.Group();display.position.set(s.x,.056,s.z);display.scale.setScalar(0);display.visible=false;room.add(display);buildStoryModel(display,def.model);
    storyItems.push({def,group,display,displayScale:.72,slot:i,x:def.x,z:def.z,on:def.on,collected:false,placed:false,baseY:def.y,phase:random()*6.28,appear:0,appearStart:0});
  }
  let storyClock=0;const STORY_APPEAR=.6;
  // An object moves through three states: scattered (found in the room), collected
  // (picked up and carried), then placed (set into its spot on the rug). The counter
  // and the ending track how many have been placed.
  const storyControl={
    items:storyItems,total:storyItems.length,
    placed(){return storyItems.reduce((n,s)=>n+(s.placed?1:0),0);},
    found(){return this.placed();},
    remaining(){return this.total-this.placed();},
    pickUp(item){if(!item||item.collected)return null;item.collected=true;item.group.visible=false;return item.def;},
    place(item){if(!item||item.placed)return false;item.placed=true;item.collected=true;item.group.visible=false;item.display.visible=true;item.display.scale.setScalar(0);item.appear=0;item.appearStart=storyClock;return true;},
    reset(){for(const s of storyItems){s.collected=false;s.placed=false;s.group.visible=true;s.display.visible=false;s.display.scale.setScalar(0);s.appear=0;}},
  };
  for(const x of [-1.36,-1.04]){const sole=box(.17,.027,.35,woodDark,x,.048,1.5,.055);sole.rotation.y=-.13;tube([[x-.075,.071,1.48],[x,.14,1.44],[x+.075,.071,1.48]],.019,leather);}
  // Sparse personal belongings on the remaining wall: pegs, a shirt, a shelf.
  box(.70,.075,.05,woodDark,2.88,1.92,.73).rotation.y=Math.PI/2;
  for(const z of [.48,.72,.96])rod([2.88,1.92,z],[2.7,1.94,z],.014,wood);
  const hanging=fabric(.45,.68,sheet,2.70,1.61,.72,.025);hanging.rotation.z=Math.PI/2;
  box(.36,.055,.85,wood,2.74,2.43,-.4);
  for(const z of [-.72,-.08]){rod([2.91,2.1,z],[2.58,2.40,z],.018,iron);}
  lathe([[0,0],[.075,0],[.08,.15],[.075,.16],[.065,.16],[.065,.025],[0,.025]],enamel,2.72,2.46,-.40);
  // A weak electric bulb on a bare cord, wired to the switch by the door.
  tube([[2.86,2.8,-2.65],[2.86,3.32,-2.65],[.42,3.36,-2.65],[.42,3.4,-.55],[.42,3.08,-.55]],.006,black);
  lathe([[.045,0],[.045,.08],[.025,.12]],ceramic,.42,2.96,-.55);
  const bulbMat=new THREE.MeshStandardMaterial({color:'#b0a88b',roughness:.43,emissive:'#ffd9a0',emissiveIntensity:1.4});
  ball(.42,2.9,-.55,.058,.082,.058,bulbMat);
  const bulb=new THREE.PointLight('#ffe3b4',5.5,10,2);bulb.position.set(.42,2.8,-.55);bulb.castShadow=true;bulb.shadow.mapSize.set(512,512);bulb.shadow.bias=-.0005;bulb.shadow.normalBias=.01;room.add(bulb);
  // The switch only records the change; update() flicks the lever and warms the filament.
  let lightOn=true,switchedAt=-Infinity;
  function setLight(on){if(on===lightOn)return;lightOn=on;switchedAt=lastTime;}
  const ambient=new THREE.HemisphereLight('#a5bebc','#544536',.34);scene.add(ambient);
  // With the current cut, the kerosene lamp is turned right down: a candle's worth of light and a nervous flame.
  let lampGlow=1;
  function applyLight(t,dt){const since=Math.min(t-switchedAt,10),warm=lightOn?1-.65*Math.exp(-since*5)*(.4+.6*Math.abs(Math.sin(since*75))):0;bulb.visible=lightOn;bulb.intensity=5.5*warm;bulbMat.emissiveIntensity=1.6*warm;
    lampGlow+=((lightOn?1:.22)-lampGlow)*Math.min(1,dt*3.5);const nervous=1+(1-lampGlow)*.35*(Math.sin(t*23)*.5+Math.sin(t*37)*.3+Math.sin(t*5.3)*.2);
    lamp.intensity=(6+Math.sin(t*7)*.13+Math.sin(t*13)*.09)*lampGlow*nervous;flame.scale.y=.067*(.55+.45*lampGlow)*nervous;
    ambient.intensity=(lightOn?.34:.08);bounce.intensity=.65*lampGlow;}
  const windowLight=new THREE.PointLight('#9bbdbc',4.5,8,2);windowLight.position.set(-3.3,2.15,-.6);windowLight.castShadow=true;windowLight.shadow.mapSize.set(1024,1024);windowLight.shadow.normalBias=.02;room.add(windowLight);
  const bounce=new THREE.PointLight('#d59c60',.65,5,2);bounce.position.set(.3,1.7,-1.15);room.add(bounce);
  const dustGeo=new THREE.BufferGeometry(),dustPositions=new Float32Array(100*3);for(let i=0;i<100;i++){dustPositions[i*3]=-2.8+random()*5.5;dustPositions[i*3+1]=.5+random()*2.5;dustPositions[i*3+2]=-2.5+random()*4.3;}dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
  const dc=document.createElement('canvas');dc.width=dc.height=32;const dg=dc.getContext('2d');const glow=dg.createRadialGradient(16,16,0,16,16,16);glow.addColorStop(0,'#ffffff');glow.addColorStop(.2,'#ffffff88');glow.addColorStop(1,'#ffffff00');dg.fillStyle=glow;dg.fillRect(0,0,32,32);
  const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({map:new THREE.CanvasTexture(dc),color:'#d6c299',size:.008,transparent:true,opacity:.10,depthWrite:false}));room.add(dust);
  await Promise.all(loadJobs);
  // Bake opaque, stationary meshes by material into shared draw batches.
  // Transparent cloth/glass and animated meshes retain their own render order.
  // The door leaf is baked on its own so it can move as one; the bolt stays loose to rattle.
  room.updateMatrixWorld(true);
  function bake(group,skip){
    const inverse=group.matrixWorld.clone().invert(),batches=new Map(),originals=[];
    group.traverse(o=>{
      if(!o.isMesh||o===flame||o===mirror||o===core||Array.isArray(o.material)||o.material.transparent||skip(o))return;
      const key=`${o.material.uuid}:${o.castShadow}:${o.receiveShadow}`;
      if(!batches.has(key))batches.set(key,{material:o.material,cast:o.castShadow,receive:o.receiveShadow,geometries:[]});
      let geometry=o.geometry.clone();geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));
      if(geometry.index){const indexed=geometry;geometry=geometry.toNonIndexed();indexed.dispose();}
      for(const name of Object.keys(geometry.attributes))if(!['position','normal','uv'].includes(name))geometry.deleteAttribute(name);
      if(!geometry.attributes.uv)geometry.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count*2),2));
      batches.get(key).geometries.push(geometry);originals.push(o);
    });
    for(const batch of batches.values()){
      const geometry=mergeGeometries(batch.geometries);const merged=new THREE.Mesh(geometry,batch.material);merged.castShadow=batch.cast;merged.receiveShadow=batch.receive;group.add(merged);
      for(const g of batch.geometries)g.dispose();
    }
    for(const o of originals){o.removeFromParent();o.geometry.dispose();}
    return {before:originals.length,after:batches.size};
  }
  const roomBatch=bake(room,o=>o.userData.dynamic),doorBatch=bake(door,o=>bolt.children.includes(o));
  let lastNetUpdate=-1,lastPhase='quiet',lastPass=-1;
  function spawnGrit(spread){for(let i=0;i<30;i++){gritPositions[i*3]=1.5+random()*1.2;gritPositions[i*3+1]=2.62;gritPositions[i*3+2]=-2.6+random()*.06;gritVelocity[i*3]=(random()-.5)*.15*spread;gritVelocity[i*3+1]=-random()*.2;gritVelocity[i*3+2]=random()*.2*spread;}gritAge=0;}
  return {room,lamp,flame,door,setLight,lightOn:()=>lightOn,stories:storyControl,batching:{before:roomBatch.before+doorBatch.before,after:roomBatch.after+doorBatch.after},update(t,siege={phase:'quiet',elapsed:0}){
    flame.scale.x=.022*(1+Math.sin(t*8)*.10);
    dust.rotation.y=Math.sin(t*.025)*.025;
    storyClock=t;
    // Scattered objects hover and turn so they catch the eye; gathered ones pop into
    // their spot on the rug and settle.
    for(const s of storyItems){
      if(!s.collected){s.group.position.y=s.baseY+Math.sin(t*1.6+s.phase)*.01;s.group.rotation.y+=.006;continue;}
      if(s.placed&&s.appear<1){s.appear=Math.min(1,(t-s.appearStart)/STORY_APPEAR);const e=1-Math.pow(1-s.appear,3);s.display.scale.setScalar(s.displayScale*e);s.display.position.y=.056+(1-e)*.05;s.display.rotation.y=s.phase;}
    }
    const dt=Math.min(1/30,Math.max(0,t-lastTime));lastTime=t;
    applyLight(t,dt);
    // The lever snaps over with a little overshoot, like a stiff old toggle.
    const leverTarget=lightOn?-.5:.5;leverVelocity=(leverVelocity+(leverTarget-lever.rotation.x)*1400*dt)*Math.exp(-dt*26);lever.rotation.x+=leverVelocity*dt;
    const {phase,elapsed}=siege;
    if(phase==='pounding'){
      // The leaf gives against the frame and the bolt chatters, harder with every pass.
      // Harder with every pass, and dying away as the visitor loses interest in a dark room.
      const grow=(1+elapsed/LIMIT*.8)*(siege.presence??1),shake=doorShake(elapsed%DURATION),pass=Math.floor(elapsed/DURATION);
      door.rotation.y=-shake.angle*grow;door.position.z=hinge.z+shake.push*grow;bolt.position.set(shake.rattle*grow,0,0);bolt.rotation.z=0;
      if(lastPhase!=='pounding'||pass!==lastPass)spawnGrit(1);lastPass=pass;
    }else if(phase==='broken'){
      // The bolt tears out; the door slams open into the room and the bolt drops.
      const e=elapsed,open=1.5*(1-Math.exp(-e*9))-.12*Math.exp(-e*3)*Math.sin(e*20);
      door.rotation.y=-open;door.position.z=hinge.z;bolt.position.set(.05*e,-Math.min(1.52,4*e*e),.1*e);bolt.rotation.z=-Math.min(1.2,e*3);
      if(lastPhase!=='broken')spawnGrit(3);
    }else{door.rotation.y=0;door.position.z=hinge.z;bolt.position.set(0,0,0);bolt.rotation.z=0;}
    lastPhase=phase;
    if(gritAge<1.6){gritAge+=dt;for(let i=0;i<30;i++){gritVelocity[i*3+1]-=2.2*dt;for(let k=0;k<3;k++)gritPositions[i*3+k]+=gritVelocity[i*3+k]*dt;}grit.attributes.position.needsUpdate=true;gritPoints.material.opacity=.55*Math.max(0,1-gritAge/1.6);}
    if(t-lastNetUpdate<1/20)return;lastNetUpdate=t;
    for(const panel of netPanels){const p=panel.mesh.geometry.attributes.position,b=panel.base;for(let i=0;i<p.count;i++){const y=b[i*3+1];p.setX(i,b[i*3]+Math.sin(t*.7+b[i*3+2]*2+y)*.005*(1-y/2.8));}p.needsUpdate=true;}
  }};
}
