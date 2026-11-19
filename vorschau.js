(() => {
  'use strict';
  // Test mode applies only in this browser tab; never changes system time or Supabase.
  const modes={auto:'Automatisch',day:'Tag ☀️',night:'Nacht 🎆'};
  window.partyPreviewMode='auto';
  function init(){
    if(document.querySelector('#party-preview-panel'))return;
    const panel=document.createElement('div');panel.id='party-preview-panel';
    panel.innerHTML='<label for="party-preview-mode">🎆 Licht & Feuerwerk testen</label><select id="party-preview-mode"><option value="auto">Automatisch</option><option value="day">Tag ☀️</option><option value="night">Nacht 🎆</option></select>';
    document.body.appendChild(panel);
    const select=panel.querySelector('select');
    select.addEventListener('change',()=>{
      window.partyPreviewMode=select.value;
      window.dispatchEvent(new Event('party-preview-change'));
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
