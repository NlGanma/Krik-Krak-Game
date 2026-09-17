import * as THREE from 'three';

// Procedural, low-poly objects that carry each story, built in the room's own
// hand-made style. Every material is flagged transparent so these meshes are
// skipped by room.js's static geometry batch and can be hidden when collected.
// Each builder fills a group whose origin sits on the surface the object rests on.

function mat(color,{rough=.7,metal=0,physical=false,cc=.5,opacity=1,emissive,ei=.12}={}){
 const m=physical?new THREE.MeshPhysicalMaterial({color,roughness:rough,metalness:metal,clearcoat:cc})
                 :new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
 m.transparent=true;m.opacity=opacity;
 if(emissive!==undefined){m.emissive=new THREE.Color(emissive===true?color:emissive);m.emissiveIntensity=ei;}
 return m;
}
function add(g,geo,m,x=0,y=0,z=0,rot){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);if(rot)o.rotation.set(rot[0]||0,rot[1]||0,rot[2]||0);o.castShadow=false;o.receiveShadow=false;g.add(o);return o;}
const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
const cyl=(rt,rb,h,s=12)=>new THREE.CylinderGeometry(rt,rb,h,s);
const sph=(r,w=14,h=12)=>new THREE.SphereGeometry(r,w,h);
const cone=(r,h,s=12)=>new THREE.ConeGeometry(r,h,s);
const tor=(r,t,s=16)=>new THREE.TorusGeometry(r,t,8,s);

const builders={
 // A short stack of diary sheets with a few lines of ink.
 paper(g){const cream=mat('#e8dfc4',{rough:.9,emissive:true,ei:.05});const ink=mat('#3a3730',{rough:.9});
  for(let i=0;i<3;i++)add(g,box(.11,.004,.15),cream,i*.005,.006+i*.006,i*.004,[0,i*.11,0]);
  for(let j=0;j<5;j++)add(g,box(.075,.001,.006),ink,.005,.03,-.045+j*.022);},
 // A robed Madonna on a small plinth, with a brass halo.
 madonna(g){const robe=mat('#9fb4c9',{rough:.5,emissive:true,ei:.09});const skin=mat('#d9c3a8',{rough:.6});const gold=mat('#caa64e',{rough:.3,metal:.6,emissive:true,ei:.16});
  add(g,cyl(.062,.066,.02,16),mat('#8a8f86',{rough:.7}),0,.01,0);
  add(g,cyl(.036,.052,.12,16),robe,0,.08,0);
  add(g,cone(.05,.07,16),robe,0,.17,0);
  add(g,sph(.024),skin,0,.155,.004);
  add(g,tor(.03,.004,20),gold,0,.185,0,[Math.PI/2,0,0]);},
 // A striped envelope, neck and hanging basket.
 balloon(g){const red=mat('#c65b3c',{rough:.45,emissive:true,ei:.1});const gold=mat('#e0b25a',{rough:.45,emissive:true,ei:.1});
  add(g,sph(.075,20,16),red,0,.19,0);
  add(g,new THREE.SphereGeometry(.0755,20,10,0,Math.PI*2,0,Math.PI*.5),gold,0,.19,0);
  add(g,new THREE.SphereGeometry(.0752,20,10,0,Math.PI*2,Math.PI*.62,Math.PI*.2),gold,0,.19,0);
  add(g,cyl(.03,.05,.035,14),red,0,.108,0);
  add(g,box(.05,.04,.05),mat('#7a5a34',{rough:.85}),0,.03,0);
  const rope=mat('#5a4a30',{rough:.9});for(const sx of[-1,1])for(const sz of[-1,1])add(g,cyl(.0018,.0018,.06,6),rope,sx*.022,.062,sz*.022);},
 // A wrapped boiled sweet with twisted ends.
 candy(g){const wrap=mat('#d64f7a',{rough:.25,physical:true,cc:.6,emissive:true,ei:.12});
  add(g,sph(.03),wrap,0,.03,0).scale.set(1.3,1,1);
  add(g,cone(.022,.035,10),wrap,.052,.03,0,[0,0,-Math.PI/2]);
  add(g,cone(.022,.035,10),wrap,-.052,.03,0,[0,0,Math.PI/2]);},
 // A rose: green stem and leaves under layered petals.
 rose(g){const green=mat('#4a6b3a',{rough:.7});const red=mat('#8f2233',{rough:.5,emissive:true,ei:.12});const red2=mat('#b23a4a',{rough:.5,emissive:true,ei:.1});
  add(g,cyl(.004,.005,.14,8),green,0,.07,0);
  for(const s of[-1,1]){const l=add(g,sph(.02,10,8),green,s*.022,.06,0);l.scale.set(1.3,.16,.55);l.rotation.z=s*.5;}
  add(g,sph(.026,14,12),red,0,.15,0);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;const p=add(g,sph(.017,10,8),i%2?red2:red,Math.cos(a)*.022,.15,Math.sin(a)*.022);p.scale.set(1,.65,1);p.rotation.y=a;}},
 // A draped, folded scrap of purple cloth.
 cloth(g){const purple=mat('#6a4a86',{rough:.85,emissive:true,ei:.08});purple.side=THREE.DoubleSide;
  const geo=new THREE.PlaneGeometry(.17,.14,12,10),p=geo.attributes.position;
  for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*30)*.014+Math.sin(p.getY(i)*22)*.009);
  geo.computeVertexNormals();add(g,geo,purple,0,.018,0,[-Math.PI/2,0,.3]);
  add(g,box(.07,.012,.05),purple,.035,.03,-.02,[0,.4,.12]);},
 // A paintbrush lying flat, with a wet blue tip and a smear.
 brush(g){const handle=mat('#7d4b2b',{rough:.6,emissive:true,ei:.05});const ferr=mat('#b9b3a0',{rough:.4,metal:.5});const paint=mat('#3f6fae',{rough:.5,emissive:true,ei:.16});
  const y0=.012;
  add(g,cyl(.006,.008,.13,10),handle,-.025,y0,0,[0,0,Math.PI/2]);
  add(g,cyl(.0085,.0085,.02,10),ferr,.05,y0,0,[0,0,Math.PI/2]);
  add(g,cone(.009,.032,10),paint,.078,y0,0,[0,0,-Math.PI/2]);
  add(g,new THREE.CircleGeometry(.022,16),paint,.11,.003,.012,[-Math.PI/2,0,0]);},
 // An upright lipstick, leaning slightly.
 lipstick(g){const tube=mat('#3a2f2c',{rough:.3,metal:.4});const gold=mat('#caa64e',{rough:.25,metal:.7,emissive:true,ei:.1});const red=mat('#b41f3a',{rough:.2,physical:true,cc:.7,emissive:true,ei:.18});
  add(g,cyl(.014,.015,.05,14),tube,0,.025,0);
  add(g,cyl(.0135,.0135,.014,14),gold,0,.057,0);
  const b=add(g,cyl(.012,.012,.03,14),red,.003,.08,0);b.rotation.z=.16;
  const t=add(g,cyl(.001,.012,.02,14),red,.008,.102,0);t.rotation.z=.16;},
 // A wrapped bouquet of pale blooms with a ribbon.
 bouquet(g){const wrap=mat('#e8e2cf',{rough:.9});add(g,cyl(.045,.012,.085,12),wrap,0,.045,0);
  const cols=['#e7d7de','#d98fae','#efe3b0','#c9d6c0'];const green=mat('#5a7a45',{rough:.7});
  for(let i=0;i<4;i++){const a=i/4*Math.PI*2+.4;add(g,cyl(.002,.002,.05,6),green,Math.cos(a)*.03,.105,Math.sin(a)*.03,[Math.cos(a)*.5,0,Math.sin(a)*.5]);}
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2,r=i===6?0:.028;const c=cols[i%cols.length];add(g,sph(.02,10,8),mat(c,{rough:.6,emissive:c,ei:.1}),Math.cos(a)*r,i===6?.105:.095,Math.sin(a)*r);}
  add(g,tor(.02,.005,16),mat('#c24d6a',{rough:.5,emissive:true,ei:.1}),0,.03,0,[Math.PI/2,0,0]);},
 // A glossy pool and droplet of blood.
 blood(g){const blood=mat('#5c0f16',{rough:.15,physical:true,cc:.85,metal:.1,emissive:'#7a1520',ei:.16});
  add(g,new THREE.CircleGeometry(.05,24),blood,0,.004,0,[-Math.PI/2,0,0]).scale.set(1.3,1,.9);
  add(g,sph(.016),blood,.012,.012,-.01).scale.set(1,.7,1);
  add(g,cone(.008,.02,12),blood,.032,.012,.02);},
 // A ripe mango with a blush and a short stem.
 mango(g){const skin=mat('#e0a52e',{rough:.35,physical:true,cc:.4,emissive:true,ei:.1});const blush=mat('#cf5a2a',{rough:.35,physical:true,cc:.4,emissive:true,ei:.08});const stem=mat('#5a4a2a',{rough:.8});
  add(g,sph(.05,18,14),skin,0,.045,0).scale.set(1.35,.85,.9);
  const b=add(g,sph(.05,16,12),blush,.02,.05,.005);b.scale.set(.65,.6,.6);
  add(g,cyl(.004,.005,.022,6),stem,-.058,.06,0,[0,0,.6]);},
};

export function buildStoryModel(group,model){
 const build=builders[model];
 if(!build)throw new Error(`unknown story model: ${model}`);
 build(group);
 return group;
}

export const STORY_MODELS=Object.keys(builders);
