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
  let pos={x:67,y:18},drag=null,client=null,user=null;
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
    const {error}=await client.from('tree_position').update({x:pos.x,y:pos.y,updated_at:new Date().toISOString()}).eq('id',1);
    if(error)console.warn('Tannenposition nicht gespeichert:',error.message);
  });
  const load=async()=>{
    if(!client||!user)return;
    const {data,error}=await client.from('tree_position').select('x,y').eq('id',1).single();
    if(error){console.warn('Tannenposition nicht geladen:',error.message);return;}
    if(data&&!drag)setPos(Number(data.x),Number(data.y));
  };
  const auth=async()=>{
    const {data}=await client.auth.getUser();user=data?.user||null;
    tree.classList.toggle('can-drag',!!user);
    if(user)await load();
  };
  if(SUPABASE_URL&&SUPABASE_ANON_KEY&&!SUPABASE_URL.includes('HIER_')){
    client=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    auth();client.auth.onAuthStateChange(()=>setTimeout(auth,0));
    client.channel('tree-position-live').on('postgres_changes',{event:'UPDATE',schema:'public',table:'tree_position',filter:'id=eq.1'},payload=>{
      if(payload.new&&!drag)setPos(Number(payload.new.x),Number(payload.new.y));
    }).subscribe();
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()});
  }
  window.addEventListener('resize',()=>setPos(pos.x,pos.y));
})();
