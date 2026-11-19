/* Eigene, lizenzfreie kleine Party-Melodie – ohne externe Audiodatei. */
(()=>{'use strict';
  if(document.getElementById('party-bg-music-button'))return;
  let ctx=null,playing=false,step=0,next=0,timer=null,master=null;
  const bpm=126,beat=60/bpm,bar=beat*4;
  const melody=[
    [0,72],[.5,76],[1,79],[1.5,76],[2,74],[2.5,77],[3,79],[3.5,81],
    [0,79],[.5,76],[1,74],[1.5,72],[2,74],[2.5,76],[3,72],[3.5,79],
    [0,81],[.5,79],[1,76],[1.5,74],[2,72],[2.5,74],[3,76],[3.5,79],
    [0,77],[.5,76],[1,74],[1.5,72],[2,67],[2.5,72],[3,76],[3.5,72]
  ];
  const chords=[[48,52,55],[53,57,60],[50,53,57],[55,59,62]];
  function hz(midi){return 440*Math.pow(2,(midi-69)/12)}
  function note(midi,time,duration,type='triangle',volume=.06){
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(hz(midi),time);
    gain.gain.setValueAtTime(.0001,time);
    gain.gain.exponentialRampToValueAtTime(volume,time+.015);
    gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
    osc.connect(gain);gain.connect(master);
    osc.start(time);osc.stop(time+duration+.03);
  }
  function playBar(time){
    const measure=step%4;
    chords[measure].forEach((n,i)=>note(n,time+i*.018,bar*.83,'sine',.012));
    const offset=measure*8;
    for(let i=0;i<8;i++){
      const [pos,n]=melody[offset+i];
      note(n,time+pos*beat,beat*.38,'triangle',.045);
    }
    for(let i=0;i<4;i++){
      note(36,time+i*beat,.10,'sine',.037);
      note(60,time+(i+.5)*beat,.045,'square',.006);
    }
    step++;
  }
  function schedule(){
    if(!playing||!ctx)return;
    while(next<ctx.currentTime+.24){playBar(next);next+=bar;}
  }
  const button=document.createElement('button');
  button.id='party-bg-music-button';button.type='button';
  button.setAttribute('aria-label','Hintergrundmusik einschalten');
  button.style.cssText='position:fixed;bottom:76px;right:14px;z-index:9999;border:1px solid rgba(255,255,255,.5);border-radius:999px;background:#183b58;color:white;padding:11px 15px;font:600 14px system-ui,sans-serif;box-shadow:0 3px 14px #0005;cursor:pointer;touch-action:manipulation';
  function label(){button.textContent=playing?'🔊 Musik aus':'🎶 Musik an';button.setAttribute('aria-label',playing?'Hintergrundmusik ausschalten':'Hintergrundmusik einschalten');}
  function stop(){playing=false;clearInterval(timer);timer=null;if(master)master.gain.setTargetAtTime(0,ctx.currentTime,.025);label();}
  async function start(){
    try{
      if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=.15;master.connect(ctx.destination);}
      await ctx.resume();
      if(ctx.state!=='running')return;
      if(master)master.gain.setTargetAtTime(.15,ctx.currentTime,.025);
      playing=true;step=0;next=ctx.currentTime+.08;schedule();timer=setInterval(schedule,100);label();
    }catch(e){console.warn('Hintergrundmusik konnte nicht gestartet werden',e);}
  }
  button.addEventListener('click',()=>{if(playing)stop();else start();});
  document.body.appendChild(button);label();
  // Browser blockieren Ton ohne Nutzerinteraktion: beim ersten bewussten Tippen versuchen.
  async function tryAuto(){if(playing)return;await start();}
  document.addEventListener('pointerdown',e=>{if(e.target===button)return;tryAuto();},{once:true});
  document.addEventListener('keydown',e=>{if(e.key==='Tab'||e.key==='Escape')return;tryAuto();},{once:true});
  document.addEventListener('visibilitychange',()=>{
    if(!ctx||!playing)return;
    if(document.hidden){ctx.suspend();}
    else {ctx.resume().then(()=>{next=ctx.currentTime+.08;step=0;});}
  });
})();
