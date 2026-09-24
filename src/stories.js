// The stories of Edwidge Danticat's "Krik? Krak!" (with a companion voice from
// "The House on Mango Street"), each carried by a small symbolic object hidden in
// the room. Coordinates are room-local, sharing the player/detail space in main.js.
// `on` gates a piece to a furniture surface; `short` labels the pickup prompt.
import { nearestPiece } from './rug.js';

export const STORIES=[
 {id:'children-of-the-sea',title:'Children of the Sea',short:'diary page',object:'A folded diary page',model:'paper',x:-2.0,z:-1.15,y:.7,on:'bed',
  summary:'A young man flees Haiti on a crowded, leaking boat while the lover he left behind writes from shore. Their diary entries drift past each other across the water, never quite meeting.',
  meaning:"Diary piece of paper — represents the letters and diary entries the two lovers write to each other, even though they may never be read."},
 {id:'nineteen-thirty-seven',title:'Nineteen Thirty-Seven',short:'Madonna',object:'A small Madonna',model:'madonna',x:-.55,z:-1.25,y:.04,
  summary:'A young woman visits her mother, imprisoned after surviving the 1937 Parsley Massacre at the Dominican border. Between them pass a statue of the Madonna and the memory of the river that ran red.',
  meaning:"Madonna statue — represents faith, motherhood, and the spiritual connection between Josephine and her mother."},
 {id:'a-wall-of-fire-rising',title:'A Wall of Fire Rising',short:'hot-air balloon',object:'A little hot-air balloon',model:'balloon',x:1.15,z:.65,y:.04,
  summary:'A poor sugar-cane worker dreams of rising above his life in a borrowed hot-air balloon. His longing for flight and freedom burns hotter than the mill that grinds his days away.',
  meaning:"Hot-air balloon — represents Guy's dream of freedom and of escaping poverty."},
 {id:'night-women',title:'Night Women',short:'sweet',object:'A piece of candy',model:'candy',x:-.95,z:1.45,y:.04,
  summary:'A mother in Haiti sells herself by night while her small son sleeps beside her, dreaming of the visitors he mistakes for angels. She guards the soft border between his innocence and her nights.',
  meaning:"Piece of candy — represents the mother's love for her son and the small comforts she gives him despite their hard life."},
 {id:'between-the-pool-and-the-gardenias',title:'Between the Pool and the Gardenias',short:'rose',object:'A single rose',model:'rose',x:.35,z:1.0,y:.04,
  summary:'A grieving, unspooling woman finds an abandoned dead baby and cradles it as her own. Between the pool and the gardenias she keeps talking to it, unwilling to let go.',
  meaning:"Rose — represents the beauty and love Marie tries to give the dead baby, and the loss that surrounds motherhood."},
 {id:'the-missing-peace',title:'The Missing Peace',short:'purple cloth',object:'A scrap of purple cloth',model:'cloth',x:1.65,z:-2.2,y:.04,
  summary:'A young woman searches for her missing mother through a town ruled by soldiers and disappearances. A stranger passing through helps her read the silences that violence leaves behind.',
  meaning:"Piece of purple cloth — represents the missing mother and the clues left behind as her daughter searches for her."},
 {id:'seeing-things-simply',title:'Seeing Things Simply',short:'paintbrush',object:'A paintbrush',model:'brush',x:1.6,z:.2,y:.04,
  summary:'A curious young girl befriends an old painter in a troubled seaside town and learns to look at the world plainly and see it whole. Art becomes a way of surviving what surrounds them.',
  meaning:"Paintbrush — represents art as a way of observing, understanding, and capturing everyday Haitian life."},
 {id:'new-york-day-women',title:'New York Day Women',short:'lipstick',object:'A lipstick',model:'lipstick',x:.4,z:-1.45,y:.04,
  summary:'A Haitian-American daughter secretly follows her mother through New York and watches her work as a maid. In the gap between the woman she knows and the woman on the street, she meets her mother anew.',
  meaning:"Lipstick kiss — represents the daughter's view of her mother as a woman with a private identity and life she doesn't fully know."},
 {id:'carolines-wedding',title:"Caroline's Wedding",short:'bouquet',object:'A wedding bouquet',model:'bouquet',x:1.35,z:1.35,y:.04,
  summary:"Two sisters and their fiercely traditional mother prepare for one sister's marriage to a man who is not Haitian. The old country and the new pull at the family as the wedding draws near.",
  meaning:"Wedding bouquet — represents Caroline's marriage and her choice to build a life that doesn't fully follow her mother's Haitian traditions."},
 {id:'women-like-us',title:'Epilogue: Women Like Us',short:'drop of blood',object:'A drop of blood',model:'blood',x:-.15,z:1.3,y:.04,
  summary:'A closing meditation on the braided stories of Haitian women — mothers, daughters, cooks and storytellers — and the strength and suffering handed down between them. To write them down is to keep them alive.',
  meaning:"Drop of blood — represents the blood connection between generations of Haitian women, and the suffering and stories passed from mother to daughter."},
 {id:'house-on-mango-street',title:'The House on Mango Street',short:'mango',object:'A ripe mango',model:'mango',x:2.25,z:-1.35,y:.04,
  summary:'A girl coming of age on a poor street in Chicago dreams of a house and a self that are truly her own. A companion voice — Sandra Cisneros — echoing across these Haitian stories.',
  meaning:"Mango — represents Esperanza's neighborhood, cultural identity, and the home that shapes her experiences."},
];

export const STORY_COUNT=STORIES.length; // 11
export const STORY_PICK_RADIUS=.8;

// Nearest uncollected story within reach; reuses the rug's reachability check,
// which already honours the furniture height gate.
export function nearestStory(px,pz,stories,support='floor',radius=STORY_PICK_RADIUS){
 return nearestPiece(px,pz,stories,support,radius);
}
