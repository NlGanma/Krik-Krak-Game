// The middle rug is a small display mat: it holds an empty spot for each object
// the player gathers from around the room, and fills in as they are found.
// Coordinates are room-local, sharing the player/detail space used in main.js.
export const RUG={x:.15,z:.32,width:1.27,depth:.92};
export const PICK_RADIUS=.7;

// Display spots on the rug, arranged in centred rows of up to four.
export function rugSlots(count,rug=RUG){
 const cols=4,rows=Math.ceil(count/cols),margin=.15;
 const usableW=rug.width-margin*2,usableD=rug.depth-margin*2;
 const cellW=usableW/cols,cellD=usableD/rows,slots=[];
 for(let row=0;row<rows;row++){
  const inRow=Math.min(cols,count-row*cols),startX=rug.x-(inRow*cellW)/2+cellW/2;
  for(let col=0;col<inRow;col++)slots.push({x:startX+col*cellW,z:rug.z-usableD/2+cellD*(row+.5),w:cellW*.82,d:cellD*.82});
 }
 return slots;
}

// Nearest uncollected item within reach, honouring the height gate for items that
// rest on furniture. `support` is the id of the surface the player stands on.
export function nearestPiece(px,pz,items,support='floor',radius=PICK_RADIUS){
 let best=null,bestDist=radius;
 for(const item of items){
  if(item.collected)continue;
  if(item.on&&item.on!==support)continue;
  const d=Math.hypot(px-item.x,pz-item.z);
  if(d<bestDist){best=item;bestDist=d;}
 }
 return best;
}
