import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import {SUPABASE_URL,SUPABASE_ANON_KEY} from './config.js';
(() => {
  const photo=document.getElementById('locationPhoto');
  if(!photo)return;
  let frame=photo.closest('.snowman-photo-frame');
  // schneemann.js is loaded earlier as a module; it may not have run yet.
  if(!frame){
    frame=document.createElement('div');frame.className='snowman-photo-frame';
    photo.parentNode.insertBefore(frame,photo);frame.appendChild(photo);
  }
  const tree=document.createElement('div');
  tree.className='fairy-tree';tree.tabIndex=0;
  tree.setAttribute('role','button');tree.setAttribute('aria-label','Weihnachtstanne verschieben');
  tree.title='Weihnachtstanne mit Maus oder Finger verschieben';
  tree.innerHTML='<img src="./tanne.svg?v=1" alt="Märchenhafte beleuchtete Weihnachtstanne" draggable="false">';
  frame.appendChild(tree);
  let pos={x:67,y:18},drag=null,client=null,user=null,isMaster=false,home=null,resetTimer=null;
  const RESET_MS=5000;
  const applyRecord=row=>{
    if(!row||drag)return;
    clearTimeout(resetTimer);
    home={x:Number(row.home_x??row.x),y:Number(row.home_y??row.y)};
    const remaining=RESET_MS-(Date.now()-Date.parse(row.updated_at));
    if(Number.isFinite(remaining)&&remaining>0&&remaining<=RESET_MS){
      setPos(Number(row.x),Number(row.y));
      resetTimer=setTimeout(()=>{if(!drag&&home)setPos(home.x,home.y)},remaining);
    } else setPos(home.x,home.y);
  };
  const setPos=(x,y)=>{
    const w=frame.clientWidth,h=frame.clientHeight;
    if(!w||!h)return;
    pos={x:Math.max(0,Math.min(100-tree.offsetWidth/w*100,x)),y:Math.max(0,Math.min(100-tree.offsetHeight/h*100,y))};
    tree.style.left=pos.x+'%';tree.style.top=pos.y+'%';
  };
  const point=e=>{
    const r=frame.getBoundingClientRect();
    setPos((e.clientX-r.left-drag.dx)/r.width*100,(e.clientY-r.top-drag.dy)/r.height*100);
  };
  tree.addEventListener('pointerdown',e=>{
    if(!user || (e.pointerType==='mouse' && e.button!==0))return;
    e.preventDefault();const r=tree.getBoundingClientRect();
    drag={id:e.pointerId,dx:e.clientX-r.left,dy:e.clientY-r.top};
    tree.classList.add('dragging');tree.setPointerCapture(e.pointerId);
  });
  tree.addEventListener('pointermove',e=>{if(drag?.id===e.pointerId)point(e)});
  tree.addEventListener('pointercancel',()=>{drag=null;tree.classList.remove('dragging')});
  tree.addEventListener('pointerup',async e=>{
    if(drag?.id!==e.pointerId)return;
    point(e);drag=null;tree.classList.remove('dragging');
    if(!client||!user)return;
    const saved={...pos};
    const result=isMaster
      ? await client.rpc('master_set_figure_home',{figure_name:'tree',new_x:saved.x,new_y:saved.y})
      : await client.from('tree_position').update({x:saved.x,y:saved.y,updated_at:new Date().toISOString()}).eq('id',1);
    const {error}=result;
    if(!error&&isMaster)home=saved;
    if(!error&&!isMaster&&home){
      clearTimeout(resetTimer);
      resetTimer=setTimeout(()=>{if(!drag)setPos(home.x,home.y)},RESET_MS);
    }
    if(error)console.warn('Tannenposition nicht gespeichert:',error.message);
  });
  const load=async()=>{
    if(!client||!user)return;
    const {data,error}=await client.from('tree_position').select('x,y,home_x,home_y,updated_at').eq('id',1).single();
    if(error){console.warn('Tannenposition nicht geladen:',error.message);return;}
    if(data&&!drag)applyRecord(data);
  };
  const auth=async()=>{
    const {data}=await client.auth.getUser();user=data?.user||null;
    isMaster=false;
    if(user){
      const {data:profile}=await client.from('profiles').select('role').eq('id',user.id).maybeSingle();
      isMaster=profile?.role==='admin';
    }
    tree.classList.toggle('can-drag',!!user);
    if(user)await load();
  };
  if(SUPABASE_URL&&SUPABASE_ANON_KEY&&!SUPABASE_URL.includes('HIER_')){
    client=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    auth();client.auth.onAuthStateChange(()=>setTimeout(auth,0));
    client.channel('tree-position-live').on('postgres_changes',{event:'UPDATE',schema:'public',table:'tree_position',filter:'id=eq.1'},payload=>{
      if(payload.new&&!drag)applyRecord(payload.new);
    }).subscribe();
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()});
  }
  window.addEventListener('resize',()=>setPos(pos.x,pos.y));
})();
