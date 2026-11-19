(() => {
  'use strict';
  const night=()=>{const mode=window.partyPreviewMode||'auto';if(mode==='night')return true;if(mode==='day')return false;const hour=new Date().getHours();return hour>=20||hour<6;};
  const colors=['#a4efff','#ffd18a','#ffb8e8','#b2a7ff','#f7ffff','#98ffd7','#ffe773'];
  let frame,canvas,ctx,particles=[],raf=0,last=0,next=0,width=0,height=0;
  const random=(a,b)=>a+Math.random()*(b-a);
  function measure(){
    if(!frame||!canvas||!ctx)return false;
    const r=frame.getBoundingClientRect();
    // On phones the photo may be hidden during login; don't initialize at 1x1.
    if(r.width<30||r.height<30)return false;
    const nw=Math.round(r.width),nh=Math.round(r.height);
    if(width!==nw||height!==nh||!canvas.width){
      width=nw;height=nh;
      const ratio=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio));
      ctx.setTransform(ratio,0,0,ratio,0,0);
    }
    return true;
  }
  function burst(){
    const x=random(width*.16,width*.84),y=random(height*.10,height*.36);
    const color=colors[Math.floor(random(0,colors.length))];
    const speed=Math.max(24,Math.min(width,height)*.24);
    for(let i=0;i<50;i++){
      const a=(i/50)*Math.PI*2+random(-.1,.1),v=random(.6,1.3)*speed;
      particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,age:0,life:random(1.2,2),color,size:random(1.1,2.4)});
    }
    if(particles.length>500)particles.splice(0,particles.length-500);
  }
  function draw(time){
    raf=0;
    if(!night()||document.hidden||!ctx)return;
    if(!measure()){raf=requestAnimationFrame(draw);return;}
    const dt=Math.min(.05,(time-(last||time))/1000);last=time;
    ctx.clearRect(0,0,width,height);
    if(time>=next){burst();next=time+random(550,1100);}
    ctx.save();ctx.globalCompositeOperation='screen';ctx.lineCap='round';
    particles=particles.filter(p=>p.age<p.life);
    for(const p of particles){
      p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=12*dt;
      ctx.globalAlpha=Math.max(0,1-p.age/p.life);
      ctx.strokeStyle=p.color;ctx.lineWidth=p.size;ctx.shadowBlur=8;ctx.shadowColor=p.color;
      ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.045,p.y-p.vy*.045);ctx.stroke();
    }
    ctx.restore();raf=requestAnimationFrame(draw);
  }
  function sync(){
    if(!frame||!canvas)return;
    const enabled=night();canvas.hidden=!enabled;
    if(enabled){if(!raf){last=0;next=0;raf=requestAnimationFrame(draw);}}
    else{if(raf)cancelAnimationFrame(raf);raf=0;particles=[];if(ctx)ctx.clearRect(0,0,width,height);}
  }
  function init(){
    if(frame)return true;
    frame=document.querySelector('.snowman-photo-frame');
    if(!frame)return false;
    canvas=document.createElement('canvas');canvas.className='party-fireworks';canvas.setAttribute('aria-hidden','true');
    frame.appendChild(canvas);
    try{ctx=canvas.getContext('2d',{alpha:true});}catch(e){ctx=null;}
    if(!ctx)return true;
    measure();sync();
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{measure();sync();}).observe(frame);
    window.addEventListener('resize',()=>{measure();sync();});
    window.addEventListener('orientationchange',()=>{measure();sync();});
    document.addEventListener('visibilitychange',sync);
    window.addEventListener('party-preview-change',sync);
    setInterval(()=>{measure();sync();},1500);
    return true;
  }
  if(!init()){
    const obs=new MutationObserver(()=>{if(init())obs.disconnect();});
    obs.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
