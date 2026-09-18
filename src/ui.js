export function setupUI({canvas,keys}) {
  const dialog=document.querySelector('#help-dialog'),gameOver=document.querySelector('#gameover-dialog');
  const help=document.querySelector('#help');
  if(matchMedia('(pointer:coarse)').matches)document.body.classList.add('touch-device');
  function closeHelp(){dialog.close();keys.clear();canvas.focus({preventScroll:true});}
  function openHelp(){document.exitPointerLock?.();keys.clear();dialog.showModal();}
  help.addEventListener('click',openHelp);
  document.querySelector('#close-help').addEventListener('click',closeHelp);
  document.querySelector('#resume').addEventListener('click',closeHelp);
  document.querySelector('#reset').addEventListener('click',closeHelp);
  dialog.addEventListener('close',()=>keys.clear());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeHelp();}});
  window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='h'&&!e.repeat&&!gameOver.open){e.preventDefault();dialog.open?closeHelp():openHelp();}});
  canvas.tabIndex=0;
  return {paused:()=>dialog.open||gameOver.open};
}
