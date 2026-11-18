import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import {SUPABASE_URL,SUPABASE_ANON_KEY} from './config.js';
const $=id=>document.getElementById(id);
const db=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let user=null,channel=null,loading=false,draggingSong=false,adminMusic=false,seenMusicIds=new Set(),pendingMusic=new Map();
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const message=(text,error=false)=>{const el=$('musicNotice');el.textContent=text;el.hidden=false;el.style.color=error?'#a12e32':''};
function trackId(url){try{const u=new URL(url);if(u.protocol!=='https:'||!['open.spotify.com','play.spotify.com'].includes(u.hostname))return null;const m=u.pathname.match(/^\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]{22})\/?$/);return m?.[1]||null}catch{return null}}
// Admin-Benachrichtigung auf dem Startbildschirm. Nur neue Titel, keine Stimmen.
const seenKey=uid=>'silvester-music-seen-v1-'+uid;
function updateMusicAlert(){
 const panel=$('musicAdminAlert');if(!panel)return;
 if(!adminMusic||!pendingMusic.size){panel.hidden=true;return;}
 const names=[...pendingMusic.values()].slice(-3).map(s=>s.title+' – '+s.artist);
 $('musicAdminAlertText').textContent=`${pendingMusic.size} ${pendingMusic.size===1?'neuer Musikwunsch':'neue Musikwünsche'}: ${names.join(' · ')}${pendingMusic.size>3?' …':''}`;
 panel.hidden=false;
}
function checkNewMusic(songs){
 const key=seenKey(user.id),stored=localStorage.getItem(key);
 const ids=new Set(songs.map(s=>s.id));
 if(stored===null){ // Beim ersten Öffnen alte Wünsche nicht als neu melden.
  seenMusicIds=ids;localStorage.setItem(key,JSON.stringify([...ids]));return;
 }
 for(const s of songs)if(!seenMusicIds.has(s.id)&&s.created_by!==user.id)pendingMusic.set(s.id,s);
 updateMusicAlert();
}
function acknowledgeMusic(){
 if(!user||!adminMusic)return;
 for(const id of pendingMusic.keys())seenMusicIds.add(id);
 pendingMusic.clear();localStorage.setItem(seenKey(user.id),JSON.stringify([...seenMusicIds]));updateMusicAlert();
}
$('musicAdminDismiss')?.addEventListener('click',acknowledgeMusic);
$('musicAdminView')?.addEventListener('click',acknowledgeMusic);
async function setAdminMusic(){
 adminMusic=false;pendingMusic.clear();updateMusicAlert();
 if(!user)return;
 const {data,error}=await db.from('profiles').select('role').eq('id',user.id).single();
 if(error)throw error;
 adminMusic=data?.role==='admin';
 if(adminMusic){try{const stored=JSON.parse(localStorage.getItem(seenKey(user.id))||'null');seenMusicIds=new Set(Array.isArray(stored)?stored:[])}catch{seenMusicIds=new Set()}}
}
async function refresh(){if(!user||loading||draggingSong)return;loading=true;try{
 const [{data:songs,error:e1},{data:votes,error:e2}]=await Promise.all([db.from('music_wishes').select('id,title,artist,spotify_track_id,created_by,created_at,sort_order').order('created_at',{ascending:true}),db.from('music_votes').select('song_id,user_id')]);
 if(e1||e2)throw e1||e2;
 if(adminMusic)checkNewMusic(songs);
 const totals=new Map(),mine=new Set();for(const v of votes){totals.set(v.song_id,(totals.get(v.song_id)||0)+1);if(v.user_id===user.id)mine.add(v.song_id)}
 songs.sort((a,b)=>(a.sort_order??Number.MAX_SAFE_INTEGER)-(b.sort_order??Number.MAX_SAFE_INTEGER)||((a.sort_order==null&&b.sort_order==null)?(totals.get(b.id)||0)-(totals.get(a.id)||0):0)||new Date(a.created_at)-new Date(b.created_at));
 $('musicList').innerHTML=songs.length?songs.map((s,i)=>{const count=totals.get(s.id)||0,liked=mine.has(s.id);return `<article class="music-song" data-song-id="${s.id}"><button type="button" class="music-drag-handle" aria-label="${escapeHtml(s.title)} ziehen und neu platzieren" title="Gedrückt halten und an die gewünschte Position ziehen">⠿</button><span class="music-rank">${i+1}.</span><div class="music-move"><button type="button" data-music-move="${s.id}" data-direction="-1" ${i===0?'disabled':''} title="Titel nach oben schieben" aria-label="${escapeHtml(s.title)} nach oben schieben">▲</button><button type="button" data-music-move="${s.id}" data-direction="1" ${i===songs.length-1?'disabled':''} title="Titel nach unten schieben" aria-label="${escapeHtml(s.title)} nach unten schieben">▼</button></div><div class="music-song-main"><strong>${escapeHtml(s.title)}</strong><div class="muted small">${escapeHtml(s.artist)}</div><a href="https://open.spotify.com/track/${s.spotify_track_id}" target="_blank" rel="noopener noreferrer">♫ Auf Spotify öffnen</a></div><div class="music-vote"><button type="button" class="btn ${liked?'secondary':''}" data-music-vote="${s.id}" aria-pressed="${liked}">${liked?'♥ Stimme zurücknehmen':'♡ Abstimmen'}</button><span>${count} ${count===1?'Stimme':'Stimmen'}</span>${s.created_by===user.id?`<button type="button" class="music-delete" data-music-delete="${s.id}" title="Eigenen Wunsch löschen">×</button>`:''}</div></article>`}).join(''):'<p class="muted">Noch keine Musikwünsche. Sei die erste Person!</p>';
 }catch(e){message('Musikwünsche konnten nicht geladen werden: '+e.message,true)}finally{loading=false}}
// Zuverlässige Aktualisierung ohne Realtime-Kanal; vermeidet doppelte music-live-Abos.
let refreshTimer=null;
async function start(session){
 const nextUser=session?.user||null;
 const changed=user?.id!==nextUser?.id;
 user=nextUser;
 $('musicForm').hidden=!user;
 $('musicLoginHint').hidden=!!user;
 if(refreshTimer){clearInterval(refreshTimer);refreshTimer=null;}
 if(!user){adminMusic=false;pendingMusic.clear();updateMusicAlert();$('musicList').innerHTML='';return;}
 if(changed)await setAdminMusic();
 await refresh();
 // Alle 8 Sekunden aktualisieren; nach jedem Login wird der Timer ersetzt.
 refreshTimer=setInterval(()=>{if(user&&!document.hidden)refresh()},8000);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&user)refresh()});
$('musicForm').addEventListener('submit',async e=>{e.preventDefault();if(!user)return;const url=$('musicUrl').value.trim(),id=trackId(url),title=$('musicTitle').value.trim(),artist=$('musicArtist').value.trim();if(!id)return message('Bitte einen gültigen Spotify-Titellink verwenden (open.spotify.com/track/…).',true);if(!title||!artist)return message('Bitte Songtitel und Interpret eingeben.',true);const button=$('musicSubmit');button.disabled=true;try{const {error}=await db.from('music_wishes').insert({title,artist,spotify_track_id:id,created_by:user.id});if(error)throw error;$('musicForm').reset();message('Musikwunsch hinzugefügt!');await refresh()}catch(err){message(err.code==='23505'?'Dieses Lied steht bereits in der Rangliste. Stimme einfach dafür ab.':err.message,true)}finally{button.disabled=false}});
let movingSong=false;
// Gemeinsames Drag & Drop: funktioniert mit Maus, Touch und Stift.
// Während des Ziehens werden die DOM-Zeilen umsortiert; gespeichert wird erst beim Loslassen.
let dragState=null;
const musicList=$('musicList');
function updateDragRanks(){
 [...musicList.querySelectorAll('.music-song')].forEach((row,i)=>{
  const rank=row.querySelector('.music-rank');if(rank)rank.textContent=(i+1)+'.';
 });
}
function finishDrag(ev,cancel=false){
 const state=dragState;if(!state||ev.pointerId!==state.pointerId)return;
 dragState=null;
 document.removeEventListener('pointermove',moveDrag);
 document.removeEventListener('pointerup',finishDrag);
 document.removeEventListener('pointercancel',cancelDrag);
 state.handle.removeEventListener('lostpointercapture',lostDragCapture);
 try{if(state.handle.hasPointerCapture(ev.pointerId))state.handle.releasePointerCapture(ev.pointerId)}catch{}
 state.row.classList.remove('music-dragging');
 document.body.classList.remove('music-is-dragging');
 const rows=[...musicList.querySelectorAll('.music-song')];
 const newIndex=rows.indexOf(state.row);
 if(cancel||newIndex===state.startIndex){draggingSong=false;refresh();return;}
 (async()=>{
  try{
   const {error}=await db.rpc('move_music_wish_to_position',{p_song_id:state.id,p_new_position:newIndex+1});
   if(error)throw error;
   message('Neue Reihenfolge für alle gespeichert.');
  }catch(err){message('Reihenfolge konnte nicht gespeichert werden: '+err.message+' – Bitte die neue SQL-Datei in Supabase ausführen.',true)}
  finally{draggingSong=false;await refresh()}
 })();
}
function cancelDrag(ev){finishDrag(ev,true)}
function lostDragCapture(ev){if(dragState&&ev.pointerId===dragState.pointerId)finishDrag(ev,true)}
function moveDrag(ev){
 const state=dragState;if(!state||ev.pointerId!==state.pointerId)return;
 ev.preventDefault();
 // Pointer Capture macht elementFromPoint auf Mobilgeräten unzuverlässig.
 // Deshalb anhand der sichtbaren Zeilen-Mittelpunkte einsortieren.
 const otherRows=[...musicList.querySelectorAll('.music-song')].filter(row=>row!==state.row);
 const y=ev.clientY;
 const next=otherRows.find(row=>y<row.getBoundingClientRect().top+row.getBoundingClientRect().height/2);
 if(next)musicList.insertBefore(state.row,next);
 else musicList.appendChild(state.row);
 updateDragRanks();
 // Beim Ziehen an den Bildschirmrand automatisch weiterscrollen.
 const edge=85;
 if(y<edge)window.scrollBy(0,-Math.max(7,(edge-y)*0.35));
 else if(y>window.innerHeight-edge)window.scrollBy(0,Math.max(7,(y-(window.innerHeight-edge))*0.35));
}
musicList.addEventListener('pointerdown',ev=>{
 const handle=ev.target.closest('.music-drag-handle');
 if(!handle||!user||dragState||movingSong||loading)return;
 if(ev.pointerType==='mouse'&&ev.button!==0)return;
 const row=handle.closest('.music-song');
 dragState={id:row.dataset.songId,row,handle,pointerId:ev.pointerId,startIndex:[...musicList.querySelectorAll('.music-song')].indexOf(row)};
 draggingSong=true;
 row.classList.add('music-dragging');document.body.classList.add('music-is-dragging');
 handle.setPointerCapture(ev.pointerId);
 document.addEventListener('pointermove',moveDrag,{passive:false});
 document.addEventListener('pointerup',finishDrag);
 document.addEventListener('pointercancel',cancelDrag);
 handle.addEventListener('lostpointercapture',lostDragCapture);
 ev.preventDefault();
});

$('musicList').addEventListener('click',async e=>{
 const move=e.target.closest('[data-music-move]');
 const vote=e.target.closest('[data-music-vote]');
 const del=e.target.closest('[data-music-delete]');
 if(!user||(!move&&!vote&&!del))return;
 if(move){
  if(movingSong)return;
  movingSong=true;
  const buttons=$('musicList').querySelectorAll('[data-music-move]');
  buttons.forEach(b=>b.disabled=true);
  try{
   const direction=Number(move.dataset.direction);
   const {error}=await db.rpc('move_music_wish',{p_song_id:move.dataset.musicMove,p_direction:direction});
   if(error)throw error;
   await refresh();
  }catch(err){
   message('Verschieben nicht möglich: '+err.message+' – Bitte prüfen, ob gemeinsame-rangliste.sql in Supabase ausgeführt wurde.',true);
   await refresh();
  }finally{
   movingSong=false;
   $('musicList').querySelectorAll('[data-music-move]').forEach(b=>{const row=b.closest('.music-song');const rows=[...$('musicList').querySelectorAll('.music-song')];const i=rows.indexOf(row);b.disabled=(b.dataset.direction==='-1'&&i===0)||(b.dataset.direction==='1'&&i===rows.length-1)});
  }
  return;
 }
 const id=vote?.dataset.musicVote||del.dataset.musicDelete;
 try{
  if(vote){
   vote.disabled=true;
   const {data,error}=await db.from('music_votes').select('song_id').eq('song_id',id).eq('user_id',user.id).maybeSingle();
   if(error)throw error;
   const result=data?await db.from('music_votes').delete().eq('song_id',id).eq('user_id',user.id):await db.from('music_votes').insert({song_id:id,user_id:user.id});
   if(result.error)throw result.error;
  }else{
   if(!confirm('Deinen Musikwunsch löschen? Alle Stimmen dafür werden ebenfalls gelöscht.'))return;
   const {error}=await db.from('music_wishes').delete().eq('id',id);
   if(error)throw error;
  }
  await refresh();
 }catch(err){message(err.message,true);await refresh()}
});
// Metadaten aus Spotify; bei fehlendem Interpreten zusätzlich im iTunes-Katalog suchen.
function parseSpotifyMetadata(data){
 const raw=String(data?.title||'').trim();
 const author=String(data?.author_name||'').trim();
 const patterns=[
  /^(.*?)\s+-\s+song and lyrics by\s+(.+)$/i,
  /^(.*?)\s+-\s+Songtext von\s+(.+)$/i,
  /^(.*?)\s+by\s+(.+)$/i,
  /^(.*?)\s+von\s+(.+)$/i,
  /^(.*?)\s+[–—]\s+(.+)$/
 ];
 for(const pattern of patterns){const m=raw.match(pattern);if(m)return {title:m[1].trim(),artist:m[2].trim()};}
 const validAuthor=author&&!/^(spotify|spotify ab|spotify music)$/i.test(author);
 return {title:raw,artist:validAuthor?author:''};
}
function normalizedSong(s){return String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function baseSongTitle(title){
 return String(title||'').replace(/\s*[-–—]\s*(?:studio recording|from [\"“]|live|remaster(?:ed)?|radio edit|single version|acoustic|instrumental|karaoke|original mix|feat\.?|ft\.?)[^]*$/i,'').replace(/\s*\((?:feat\.?|ft\.?|live|remaster(?:ed)?|radio edit|single version|acoustic|instrumental)[^)]*\)/gi,'').trim();
}
async function lookupArtistByTitle(title){
 const base=baseSongTitle(title),target=normalizedSong(base);
 if(target.length<2)return '';
 // Spotify nennt oft einen langen Versionszusatz, den andere Kataloge nicht enthalten.
 const queries=[base];if(normalizedSong(title)!==target)queries.push(title);
 for(const query of queries){
  const url='https://itunes.apple.com/search?'+new URLSearchParams({term:query,entity:'song',limit:'100',country:'DE'});
  const response=await fetch(url,{headers:{Accept:'application/json'}});
  if(!response.ok)continue;
  const payload=await response.json();
  const matches=(payload.results||[]).filter(x=>x.kind==='song'&&x.artistName&&normalizedSong(baseSongTitle(x.trackName))===target);
  if(!matches.length)continue;
  // Nimm den häufigsten Interpreten nur bei einem klaren Vorsprung, sonst keine Vermutung.
  const counts=new Map();
  for(const x of matches){const key=normalizedSong(x.artistName);if(!key)continue;const entry=counts.get(key)||{name:x.artistName,count:0,rank:0};entry.count++;entry.rank+=Number(x.trackPrice||0)>0?1:0;counts.set(key,entry)}
  const ranked=[...counts.values()].sort((a,b)=>b.count-a.count||b.rank-a.rank);
  if(ranked.length===1)return ranked[0].name;
  if(ranked[0]?.count>=2 && ranked[0].count>=2*ranked[1].count)return ranked[0].name;
 }
 return '';
}
let musicMetadataRequest=0;
async function autofillMusic(){
 const id=trackId($('musicUrl').value.trim());if(!id)return;
 const request=++musicMetadataRequest;
 const stillCurrent=()=>request===musicMetadataRequest&&trackId($('musicUrl').value.trim())===id;
 message('Titel und Interpret werden gesucht …');
 try{
  const r=await fetch('https://open.spotify.com/oembed?url='+encodeURIComponent('https://open.spotify.com/track/'+id));
  if(!r.ok)throw Error('Spotify-Metadaten nicht erreichbar');
  const meta=parseSpotifyMetadata(await r.json());
  if(!stillCurrent())return;
  if(meta.title)$('musicTitle').value=meta.title;
  if(meta.artist){$('musicArtist').value=meta.artist;message('Titel und Interpret automatisch übernommen.');return;}
  const artist=await lookupArtistByTitle(meta.title);
  if(!stillCurrent())return;
  if(artist){$('musicArtist').value=artist;message('Titel und Interpret automatisch übernommen.');}
  else message('Titel übernommen. Der Interpret konnte nicht eindeutig zugeordnet werden. Bitte nur in diesem Fall ergänzen.');
 }catch(err){if(stillCurrent())message('Automatische Musikerkennung derzeit nicht vollständig verfügbar. Bitte Angaben prüfen.');}
}
$('musicUrl').addEventListener('change',autofillMusic);
$('musicUrl').addEventListener('paste',()=>setTimeout(autofillMusic,0));
db.auth.getSession().then(({data,error})=>{if(error)throw error;return start(data.session)}).catch(e=>message(e.message,true));db.auth.onAuthStateChange((event,session)=>{if(['SIGNED_IN','SIGNED_OUT'].includes(event))setTimeout(()=>start(session).catch(e=>message(e.message,true)),0)});
