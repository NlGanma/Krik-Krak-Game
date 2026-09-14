// Shared cross-section keeps the bedding above the mattress and each other.
// u runs across the bed from -1 to 1; z is the room-local length coordinate.
export function beddingPoint(u,z,layer=0){
 const side=Math.sign(u),a=Math.abs(u);
 let x,y;
 if(a<=.8){x=a/.8*.64;y=.655;}
 else if(a<=.9){const angle=(a-.8)/.1*Math.PI/2;x=.64+.07*Math.sin(angle);y=.655-.07*(1-Math.cos(angle));}
 else{x=.71+(a-.9)*.04;y=.585-(a-.9)/.1*.17;}
 const wrinkle=(.006*Math.sin(u*19+z*8)+.003*Math.sin(z*27-u*7));
 return {x:side*(x+layer*.006),y:y+wrinkle+layer*.024,z};
}
