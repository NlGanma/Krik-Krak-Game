export function setupUI({canvas,keys}) {
  const dialog=document.querySelector('#help-dialog'),note=document.querySelector('#note'),hint=document.querySelector('#look-hint');
  const help=document.querySelector('#help');
  let noteTimeout=setTimeout(()=>note.classList.add('dismissed'),8000),hintTimeout;
  if(matchMedia('(pointer:coarse)').matches)document.body.classList.add('touch-device');
  function closeHelp(){dialog.close();keys.clear();canvas.focus({preventScroll:true});}
  function openHelp(){document.exitPointerLock?.();keys.clear();dialog.showModal();}
  help.addEventListener('click',openHelp);
  document.querySelector('#close-help').addEventListener('click',closeHelp);
  document.querySelector('#resume').addEventListener('click',closeHelp);
  document.querySelector('#reset').addEventListener('click',closeHelp);
  document.querySelector('#close-note').addEventListener('click',()=>note.classList.add('dismissed'));
  dialog.addEventListener('close',()=>keys.clear());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeHelp();}});
  window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='h'&&!e.repeat){e.preventDefault();dialog.open?closeHelp():openHelp();}});
  canvas.tabIndex=0;
  const quietHint=()=>{clearTimeout(hintTimeout);hintTimeout=setTimeout(()=>hint.classList.add('quiet'),2500);};
  canvas.addEventListener('pointerdown',quietHint);
  window.addEventListener('keydown',e=>{if(['w','a','s','d'].includes(e.key.toLowerCase()))quietHint();});
  return {paused:()=>dialog.open,showNote(){clearTimeout(noteTimeout);note.classList.remove('dismissed');noteTimeout=setTimeout(()=>note.classList.add('dismissed'),16000);}};
}
