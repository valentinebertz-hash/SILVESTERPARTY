import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import {SUPABASE_URL,SUPABASE_ANON_KEY} from './config.js';
const $=id=>document.getElementById(id);
const db=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let user=null,channel=null,loading=false;
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const message=(text,error=false)=>{const el=$('musicNotice');el.textContent=text;el.hidden=false;el.style.color=error?'#a12e32':''};
function trackId(url){try{const u=new URL(url);if(u.protocol!=='https:'||!['open.spotify.com','play.spotify.com'].includes(u.hostname))return null;const m=u.pathname.match(/^\/(?:intl-[a-z]{2}\/)?track\/([a-zA-Z0-9]{22})\/?$/);return m?.[1]||null}catch{return null}}
async function refresh(){if(!user||loading)return;loading=true;try{
 const [{data:songs,error:e1},{data:votes,error:e2}]=await Promise.all([db.from('music_wishes').select('id,title,artist,spotify_track_id,created_by,created_at').order('created_at',{ascending:true}),db.from('music_votes').select('song_id,user_id')]);
 if(e1||e2)throw e1||e2;
 const totals=new Map(),mine=new Set();for(const v of votes){totals.set(v.song_id,(totals.get(v.song_id)||0)+1);if(v.user_id===user.id)mine.add(v.song_id)}
 songs.sort((a,b)=>(totals.get(b.id)||0)-(totals.get(a.id)||0)||new Date(a.created_at)-new Date(b.created_at));
 $('musicList').innerHTML=songs.length?songs.map((s,i)=>{const count=totals.get(s.id)||0,liked=mine.has(s.id);return `<article class="music-song"><span class="music-rank">${i+1}.</span><div class="music-song-main"><strong>${escapeHtml(s.title)}</strong><div class="muted small">${escapeHtml(s.artist)}</div><a href="https://open.spotify.com/track/${s.spotify_track_id}" target="_blank" rel="noopener noreferrer">♫ Auf Spotify öffnen</a></div><div class="music-vote"><button type="button" class="btn ${liked?'secondary':''}" data-music-vote="${s.id}" aria-pressed="${liked}">${liked?'♥ Stimme zurücknehmen':'♡ Abstimmen'}</button><span>${count} ${count===1?'Stimme':'Stimmen'}</span>${s.created_by===user.id?`<button type="button" class="music-delete" data-music-delete="${s.id}" title="Eigenen Wunsch löschen">×</button>`:''}</div></article>`}).join(''):'<p class="muted">Noch keine Musikwünsche. Sei die erste Person!</p>';
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
 if(!user){$('musicList').innerHTML='';return;}
 await refresh();
 // Alle 8 Sekunden aktualisieren; nach jedem Login wird der Timer ersetzt.
 refreshTimer=setInterval(()=>{if(user&&!document.hidden)refresh()},8000);
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&user)refresh()});
$('musicForm').addEventListener('submit',async e=>{e.preventDefault();if(!user)return;const url=$('musicUrl').value.trim(),id=trackId(url),title=$('musicTitle').value.trim(),artist=$('musicArtist').value.trim();if(!id)return message('Bitte einen gültigen Spotify-Titellink verwenden (open.spotify.com/track/…).',true);if(!title||!artist)return message('Bitte Songtitel und Interpret eingeben.',true);const button=$('musicSubmit');button.disabled=true;try{const {error}=await db.from('music_wishes').insert({title,artist,spotify_track_id:id,created_by:user.id});if(error)throw error;$('musicForm').reset();message('Musikwunsch hinzugefügt!');await refresh()}catch(err){message(err.code==='23505'?'Dieses Lied steht bereits in der Rangliste. Stimme einfach dafür ab.':err.message,true)}finally{button.disabled=false}});
$('musicList').addEventListener('click',async e=>{const vote=e.target.closest('[data-music-vote]'),del=e.target.closest('[data-music-delete]');if(!user||(!vote&&!del))return;const id=vote?.dataset.musicVote||del.dataset.musicDelete;try{if(vote){vote.disabled=true;const {data,error}=await db.from('music_votes').select('song_id').eq('song_id',id).eq('user_id',user.id).maybeSingle();if(error)throw error;const result=data?await db.from('music_votes').delete().eq('song_id',id).eq('user_id',user.id):await db.from('music_votes').insert({song_id:id,user_id:user.id});if(result.error)throw result.error}else{if(!confirm('Deinen Musikwunsch löschen? Alle Stimmen dafür werden ebenfalls gelöscht.'))return;const {error}=await db.from('music_wishes').delete().eq('id',id);if(error)throw error}await refresh()}catch(err){message(err.message,true);await refresh()}});
// Spotify-oEmbed liefert ggf. Titelinformationen; manuelle Eingabe bleibt immer möglich.
$('musicUrl').addEventListener('change',async()=>{const id=trackId($('musicUrl').value.trim());if(!id)return;try{const r=await fetch('https://open.spotify.com/oembed?url='+encodeURIComponent('https://open.spotify.com/track/'+id));if(!r.ok)return;const data=await r.json();if(data.title&&!$('musicTitle').value){const parts=data.title.split(' - song and lyrics by ');$('musicTitle').value=parts[0]||'';if(parts[1]&&!$('musicArtist').value)$('musicArtist').value=parts[1]}}catch{/* Manuelle Eingabe bleibt möglich */}});
db.auth.getSession().then(({data,error})=>{if(error)throw error;return start(data.session)}).catch(e=>message(e.message,true));db.auth.onAuthStateChange((event,session)=>{if(['SIGNED_IN','SIGNED_OUT'].includes(event))setTimeout(()=>start(session).catch(e=>message(e.message,true)),0)});
