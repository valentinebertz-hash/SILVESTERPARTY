(() => {
  'use strict';
  // Local visitor time: fireworks continuously between 20:00 and 06:00.
  const isNight=()=>{const h=new Date().getHours();return h>=20||h<6;};
  let canvas,ctx,frame,particles=[],last=0,nextBurst=0,raf=0,w=0,h=0;
  const colors=['#9eeeff','#ffd8a6','#ffc1f0','#b9b7ff','#e5fcff','#b8ffdf','#ffe28a'];
  const rand=(a,b)=>a+Math.random()*(b-a);
  function resize(){
    if(!canvas||!frame)return;
    const rect=frame.getBoundingClientRect();
    w=Math.max(1,rect.width);h=Math.max(1,rect.height);
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function burst(){
    // Only in the upper sky, not in front of the snowman and rabbits.
    const x=rand(w*.13,w*.88),y=rand(h*.09,h*.38);
    const color=colors[Math.floor(Math.random()*colors.length)];
    const count=matchMedia('(prefers-reduced-motion: reduce)').matches?22:46;
    const speed=Math.max(12,Math.min(w,h)*.16);
    for(let i=0;i<count;i++){
      const a=(i/count)*Math.PI*2+rand(-.09,.09),v=rand(.5,1.25)*speed;
      particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,age:0,life:rand(.95,1.65),color,size:rand(.7,1.9)});
    }
    if(particles.length>400)particles.splice(0,particles.length-400);
  }
  function draw(t){
    raf=0;
    if(!canvas||!isNight()||document.hidden)return;
    const dt=Math.min(.05,(t-(last||t))/1000);last=t;
    ctx.clearRect(0,0,w,h);
    if(t>=nextBurst){burst();nextBurst=t+rand(650,1350);}
    ctx.save();ctx.globalCompositeOperation='screen';
    particles=particles.filter(p=>p.age<p.life);
    for(const p of particles){
      p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=15*dt;
      const alpha=Math.max(0,1-p.age/p.life);
      ctx.globalAlpha=alpha;
      ctx.strokeStyle=p.color;ctx.lineWidth=p.size;ctx.lineCap='round';
      ctx.shadowBlur=8;ctx.shadowColor=p.color;
      ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.035,p.y-p.vy*.035);ctx.stroke();
    }
    ctx.restore();raf=requestAnimationFrame(draw);
  }
  function start(){
    if(!frame)return;
    if(isNight()){
      canvas.hidden=false;
      if(!raf&&!document.hidden){last=0;nextBurst=0;raf=requestAnimationFrame(draw);}
    }else{
      canvas.hidden=true;particles=[];
      if(raf){cancelAnimationFrame(raf);raf=0;}
      if(ctx)ctx.clearRect(0,0,w,h);
    }
  }
  function init(){
    frame=document.querySelector('.snowman-photo-frame');
    if(!frame)return false;
    if(frame.querySelector('.party-fireworks'))return true;
    canvas=document.createElement('canvas');canvas.className='party-fireworks';
    canvas.setAttribute('aria-hidden','true');frame.appendChild(canvas);
    ctx=canvas.getContext('2d');if(!ctx)return true;
    resize();start();
    if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(frame);
    else addEventListener('resize',resize);
    document.addEventListener('visibilitychange',start);
    setInterval(start,30000);
    return true;
  }
  if(!init()){
    const observer=new MutationObserver(()=>{if(init())observer.disconnect();});
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
