import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import {SUPABASE_URL,SUPABASE_ANON_KEY} from './config.js';
const $=id=>document.getElementById(id);const configured=SUPABASE_URL.startsWith('https://')&&!SUPABASE_URL.includes('HIER_')&&!SUPABASE_ANON_KEY.includes('HIER_');
let db=null,user=null,me=null,profiles=[],items=[],pledges=[],settings=null,partyLocation=null,channel=null,families=[],familyMembers=[],familyCompanions=[],costItems=[],costSettings=null,costPayments=[];
const fmt=d=>d?new Date(d).toLocaleString('de-DE',{dateStyle:'short',timeStyle:'short'}):'–';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const admin=()=>me?.role==='admin';
function notify(msg,error=false){$('notice').hidden=false;$('notice').className=error?'error':'';$('notice').textContent=partyT(msg);clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('notice').hidden=true,8500)}
function fail(e){console.error(e);notify(e?.message||'Ein Fehler ist aufgetreten.',true)}
function zodiac(year){const animals=['🐒','🐓','🐕','🐖','🐀','🐂','🐅','🐇','🐉','🐍','🐎','🐐'];return animals[((year-2004)%12+12)%12]}
function applySettings(){const y=settings?.party_year??new Date().getFullYear();$('yearTop').textContent=`${y} / ${y+1}`;$('footerYear').textContent=`${y} / ${y+1}`;$('zodiac').textContent=zodiac(y+1);$('partySubtitle').textContent=settings?.description||'Gemeinsam planen, gemeinsam feiern';document.querySelector('.hero h1').textContent=settings?.title||'Wer bringt was?';if(settings?.image_path){const {data}=db.storage.from('party-images').getPublicUrl(settings.image_path);document.querySelector('.hero').style.backgroundImage=`linear-gradient(#ffffff33,#ffffff33),url("${data.publicUrl}")`;document.querySelector('.hero').style.backgroundSize='cover';document.querySelector('.hero').style.backgroundPosition='center'}else document.querySelector('.hero').style.backgroundImage='';}
async function load(){if(!user)return;const [p,i,g,s,l,f,m,c,cs,ci,cp]=await Promise.all([db.from('profiles').select('*').order('display_name'),db.from('items').select('*').order('name'),db.from('pledges').select('*'),db.from('party_settings').select('*').eq('id',1).single(),db.from('party_location').select('*').eq('id',1).maybeSingle(),db.from('families').select('*').order('name'),db.from('family_members').select('*'),db.from('family_companions').select('*').order('name'),db.from('party_cost_settings').select('*').eq('id',1).single(),db.from('party_cost_items').select('*'),db.from('party_cost_payments').select('*')]);for(const r of [p,i,g,s,l,f,m,c,cs,ci,cp])if(r.error)throw r.error;profiles=p.data;items=i.data;pledges=g.data;settings=s.data;partyLocation=l.data;families=f.data;familyMembers=m.data;familyCompanions=c.data;costSettings=cs.data;costItems=ci.data;costPayments=cp.data;me=profiles.find(x=>x.id===user.id);if(!me)throw Error('Dein Profil fehlt. Bitte den Administrator kontaktieren.');$('app').hidden=false;$('authPanel').hidden=true;$('logout').hidden=false;$('admin').hidden=!admin();$('adminLink').hidden=!admin();$('myRole').textContent=admin()?'Administrator':'Gast';$('profileName').value=me.display_name;$('companions').value=me.companions;$('companionNames').value=me.companion_names;$('profileNote').value=me.note;$('profileAgeGroup').value=me.age_group||'adult';$('profileChild6').value=me.child_6_11||0;$('profileChildUnder6').value=me.child_under_6||0;applySettings();render();renderFamilies();renderCosts();renderPartyLocation();translateParty();}
function render(){const year=settings.party_year;const current=items.filter(x=>x.party_year===year);const allQty=current.reduce((a,x)=>a+Math.max(0,x.quantity-pledges.filter(p=>p.item_id===x.id).reduce((s,p)=>s+p.quantity,0)),0);$('statPeople').textContent=profiles.reduce((s,p)=>s+1+Math.max(Number(p.companions)||0,familyCompanions.filter(c=>c.owner_id===p.id).length),0);$('statItems').textContent=current.length;$('statOpen').textContent=allQty;$('guestCount').textContent=`${profiles.length} angemeldet`;
const q=$('search').value.toLocaleLowerCase('de');const cat=$('categoryFilter').value;$('itemsBody').innerHTML=current.filter(x=>(!cat||x.category===cat)&&(!q||[x.name,x.note,x.unit].join(' ').toLocaleLowerCase('de').includes(q))).sort((a,b)=>{const pledged=x=>pledges.some(p=>p.item_id===x.id&&Number(p.quantity)>0);return Number(pledged(b))-Number(pledged(a))||a.name.localeCompare(b.name,'de');}).map(x=>{const ps=pledges.filter(p=>p.item_id===x.id),total=ps.reduce((s,p)=>s+p.quantity,0),open=Math.max(0,x.quantity-total),own=ps.find(p=>p.user_id===user.id),can=admin()||x.created_by===user.id;const names=ps.map(p=>`${profiles.find(u=>u.id===p.user_id)?.display_name||'Gast'}: ${p.quantity}`).join(' · ');return `<tr class="itemRow ${total>0?'itemPledged':'itemOpen'}"><td class="itemProgressCell"><div class="progress"><div style="width:${Math.min(100,100*total/x.quantity)}%"></div><span>${total||''}</span></div></td><td class="itemOpenCell">${open}</td><td class="itemInfoCell"><div class="itemName">${esc(x.name)}</div><div class="itemMeta">${esc(x.category)} · ${x.quantity} ${esc(x.unit)} ${x.note?' · '+esc(x.note):''}</div><div class="itemMeta">${names?`<span class="pledgeNames">${esc(names)}</span>`:'Noch keine Zusagen'} · Erstellt: ${fmt(x.created_at)}</div></td><td class="itemActionCell"><div class="rowActions"><button class="btn small" data-action="pledge" data-id="${x.id}">${own?'Ändern':'Zusagen'}</button>${can?`<button class="btn small secondary" data-action="edit" data-id="${x.id}">Bearbeiten</button><button class="btn small danger" data-action="delete" data-id="${x.id}">Löschen</button>`:''}${admin()&&ps.length?`<button class="btn small secondary" data-action="manage" data-id="${x.id}">Zusagen verwalten</button>`:''}</div></td></tr>`}).join('')||'<tr><td colspan="4">Keine Einträge gefunden.</td></tr>';
const guestCard=p=>`<article class="guest"><strong>${esc(p.display_name)}</strong>${p.id===user.id?' <span class="tag">Du</span>':''}<p>Personen: ${1+Math.max(Number(p.companions)||0,familyCompanions.filter(c=>c.owner_id===p.id).length)}</p>${p.companion_names?`<p>Begleitung (Profil): ${esc(p.companion_names)}</p>`:''}${p.note?`<p>Hinweis: ${esc(p.note)}</p>`:''}<p class="muted small">Eingetragen: ${fmt(p.created_at)}<br>Zuletzt geändert: ${fmt(p.updated_at)}</p></article>`;
const accepted=familyMembers.filter(x=>x.status==='accepted');const assigned=new Set(accepted.map(x=>x.user_id));
$('guestList').innerHTML=families.map(f=>{const members=accepted.filter(x=>x.family_id===f.id).map(x=>profiles.find(p=>p.id===x.user_id)).filter(Boolean);const companions=familyCompanions.filter(c=>c.family_id===f.id);return members.length||companions.length?`<article class="guest" style="grid-column:1/-1"><h3>👨‍👩‍👧‍👦 ${esc(f.name)}</h3><div class="guestGrid">${members.map(guestCard).join('')}${companions.map(c=>`<article class="guest"><strong>${esc(c.name)}</strong><p class="muted small">${c.age_group==='under_6'?'👶 Kind unter 6 Jahren · kostenlos':c.age_group==='child_6_11'?'🧒 Kind 6–11 Jahre · 50 %':'🧑 Begleitperson ab 12 Jahren · 100 %'} · bei ${esc(profiles.find(p=>p.id===c.owner_id)?.display_name||'Gast')}</p></article>`).join('')}</div></article>`:''}).join('')+profiles.filter(p=>!assigned.has(p.id)).map(guestCard).join('');
if(admin()){$('partyYear').value=settings.party_year;$('partyTitle').value=settings.title;$('partyDescription').value=settings.description;$('adminGuests').innerHTML=profiles.map(p=>`<div class="adminRow"><div><strong>${esc(p.display_name)}</strong> (${esc(p.role)})<br><small>${1+p.companions} Personen · ${p.age_group==='under_6'?'unter 6':p.age_group==='child_6_11'?'6–11 Jahre':'ab 12 Jahre'} · ${fmt(p.created_at)}</small></div><div class="rowActions"><button class="btn small secondary" data-admin="edit" data-id="${p.id}">Bearbeiten</button>${p.id!==user.id?`<button class="btn small danger" data-admin="remove" data-id="${p.id}">Profil entfernen</button>`:''}</div></div>`).join('')}}
function startRealtime(){if(channel)db.removeChannel(channel);channel=db.channel('party-live').on('postgres_changes',{event:'*',schema:'public',table:'items'},refresh).on('postgres_changes',{event:'*',schema:'public',table:'pledges'},refresh).on('postgres_changes',{event:'*',schema:'public',table:'profiles'},refresh).on('postgres_changes',{event:'*',schema:'public',table:'party_settings'},refresh).on('postgres_changes',{event:'*',schema:'public',table:'party_location'},refresh).on('postgres_changes',{event:'*',schema:'public',table:'families'},refresh).on('postgres_changes',{event:'*',schema:'public',table:'family_members'},refresh).on('postgres_changes',{event:'*',schema:'public',table:'family_companions'},refresh).on('postgres_changes',{event:'*',schema:'public',table:'party_cost_items'},refresh).on('postgres_changes',{event:'*',schema:'public',table:'party_cost_settings'},refresh).on('postgres_changes',{event:'*',schema:'public',table:'party_cost_payments'},refresh).subscribe()}
let refreshPending=false;function refresh(){if(refreshPending)return;refreshPending=true;setTimeout(async()=>{refreshPending=false;try{await load()}catch(e){fail(e)}},350)}
async function onSession(session){user=session?.user??null;if(!user){me=null;profiles=[];items=[];pledges=[];$('app').hidden=true;$('authPanel').hidden=false;$('logout').hidden=true;if(channel){db.removeChannel(channel);channel=null}return}try{await load();startRealtime()}catch(e){fail(e)}}
// Familienverwaltung: Gast kann gründen/einladen, Beitritt nur nach Bestätigung; Admin darf alles.
function renderFamilies(){
 const accepted=familyMembers.filter(m=>m.status==='accepted');
 const mine=accepted.find(m=>m.user_id===user.id);
 const pending=familyMembers.filter(m=>m.user_id===user.id&&m.status==='pending');
 $('familyInvitations').innerHTML=pending.map(m=>{const f=families.find(f=>f.id===m.family_id);return f?`<div class="adminRow"><strong>Einladung: ${esc(f.name)}</strong><div class="rowActions"><button class="btn small" data-family-action="accept" data-member-id="${m.id}">Beitreten</button><button class="btn small secondary" data-family-action="decline" data-member-id="${m.id}">Ablehnen</button></div></div>`:''}).join('');
 $('familyManagement').innerHTML=families.map(f=>{
  const members=familyMembers.filter(m=>m.family_id===f.id);
  const canManage=admin()||f.created_by===user.id;
  const canAdd=canManage;
  const options=profiles.filter(p=>!members.some(m=>m.user_id===p.id)&&!accepted.some(m=>m.user_id===p.id)).map(p=>`<option value="${p.id}">${esc(p.display_name)}</option>`).join('');
  const companions=familyCompanions.filter(c=>c.family_id===f.id);
  const mayAddCompanion=admin()||accepted.some(m=>m.family_id===f.id&&m.user_id===user.id);
  const ownerOptions=admin()?profiles.map(p=>`<option value="${p.id}">${esc(p.display_name)}</option>`).join(''):`<option value="${user.id}">${esc(me.display_name)}</option>`;
  const ageText=c=>c.age_group==='under_6'?'Unter 6 · kostenlos':c.age_group==='child_6_11'?'6–11 · halber Beitrag':'Ab 12 · voller Beitrag';
  const companionRow=c=>`<div class="adminRow"><span><strong>${esc(c.name)}</strong><br><small class="muted">${ageText(c)} · zugeordnet: ${esc(profiles.find(p=>p.id===c.owner_id)?.display_name||'Gast')}</small></span>${admin()||c.owner_id===user.id?`<span class="rowActions"><button class="btn small secondary" data-companion-action="rename" data-companion-id="${c.id}">Bearbeiten</button>${admin()?`<button class="btn small secondary" data-companion-action="move" data-companion-id="${c.id}">Verschieben</button>`:''}<button class="btn small danger" data-companion-action="remove" data-companion-id="${c.id}">Entfernen</button></span>`:''}</div>`;
  const adults=companions.filter(c=>!['under_6','child_6_11'].includes(c.age_group));
  const children=companions.filter(c=>['under_6','child_6_11'].includes(c.age_group));
  const form=(type)=>`<form class="actions" data-companion-form="${f.id}" data-person-type="${type}"><input aria-label="Name" name="companionName" maxlength="80" required placeholder="${type==='child'?'Name des Kindes':'Name des Familienangehörigen / der Begleitperson'}"><select name="companionAge" aria-label="Altersgruppe">${type==='child'?'<option value="child_6_11">6–11 Jahre (50 %)</option><option value="under_6">Unter 6 Jahren (kostenlos)</option>':'<option value="adult">Ab 12 Jahren (100 %)</option>'}</select>${admin()?`<select name="companionOwner" aria-label="Gehört zu Gast">${ownerOptions}</select>`:''}<button class="btn small" type="submit">${type==='child'?'Kind hinzufügen':'Person hinzufügen'}</button></form>`;
  return `<article class="guest" style="margin-top:14px;grid-column:1/-1"><h3>👨‍👩‍👧‍👦 ${esc(f.name)}</h3><h4>👤 Angemeldete Mitglieder (${members.filter(m=>m.status==='accepted').length})</h4><div>${members.map(m=>{const p=profiles.find(p=>p.id===m.user_id);const canRemove=admin()||m.user_id===user.id||(canManage&&m.status==='pending');return `<div class="adminRow"><span>${esc(p?.display_name||'Gast')} <small class="muted">${m.status==='pending'?'(eingeladen)':p?.age_group==='under_6'?'· unter 6':p?.age_group==='child_6_11'?'· 6–11 Jahre':'· ab 12 Jahren'}</small></span>${canRemove?`<button class="btn small secondary" data-family-action="remove" data-member-id="${m.id}">${m.user_id===user.id?'Verlassen':'Entfernen'}</button>`:''}</div>`}).join('')}</div><h4>🧑 Familienangehörige & Begleitpersonen ab 12 Jahren (${adults.length})</h4>${adults.map(companionRow).join('')||'<p class="muted small">Noch keine eingetragen.</p>'}${mayAddCompanion?form('adult'):''}<h4>🧒 Kinder (${children.length})</h4>${children.map(companionRow).join('')||'<p class="muted small">Noch keine eingetragen.</p>'}${mayAddCompanion?form('child'):''}${canAdd?`<div class="actions"><select data-family-select="${f.id}" aria-label="Gast auswählen"><option value="">Person auswählen</option>${options}</select><button class="btn small" data-family-action="invite" data-family-id="${f.id}">${admin()?'Zuordnen':'Einladen'}</button><button class="btn small secondary" data-family-action="rename" data-family-id="${f.id}">Umbenennen</button><button class="btn small danger" data-family-action="delete" data-family-id="${f.id}">Familie löschen</button></div>`:''}</article>`;
 }).join('')||'<p class="muted">Noch keine Familien angelegt.</p>';
 $('familyCreateForm').hidden=!!mine&&!admin();
}
// Begleitpersonen: normale Gäste verwalten nur ihre eigenen Einträge in ihrer Familie.
$('familien').addEventListener('submit',async e=>{
 const form=e.target.closest('form[data-companion-form]');if(!form)return;
 e.preventDefault();if(!user)return;
 const fid=form.dataset.companionForm;
 if(!admin()&&!familyMembers.some(m=>m.family_id===fid&&m.user_id===user.id&&m.status==='accepted'))return notify('Du musst Mitglied dieser Familie sein.',true);
 const name=form.elements.companionName.value.trim();if(!name||name.length>80)return notify('Bitte einen Namen mit höchstens 80 Zeichen eingeben.',true);
 const owner_id=admin()?form.elements.companionOwner.value:user.id;
 if(!profiles.some(p=>p.id===owner_id))return notify('Gast nicht gefunden.',true);if(!['adult','child_6_11','under_6'].includes(form.elements.companionAge.value))return notify('Ungültige Altersgruppe.',true);
 const {error}=await db.from('family_companions').insert({family_id:fid,owner_id,name,age_group:form.elements.companionAge.value});
 if(error)return fail(error);notify('Begleitperson hinzugefügt.');refresh();
});
$('familien').addEventListener('click',async e=>{
 const b=e.target.closest('button[data-companion-action]');if(!b||!user)return;
 const c=familyCompanions.find(c=>c.id===b.dataset.companionId);if(!c||(!admin()&&c.owner_id!==user.id))return;
 const action=b.dataset.companionAction;let result;
 if(action==='rename'){
  const name=prompt('Name der Begleitperson:',c.name)?.trim();if(!name)return;
  if(name.length>80)return notify('Name zu lang.',true);
  const age=prompt('Altersgruppe ändern: 1 = ab 12 Jahren, 2 = Kind 6–11 Jahre, 3 = Kind unter 6 Jahren',c.age_group==='child_6_11'?'2':c.age_group==='under_6'?'3':'1');if(age===null)return;const age_group={'1':'adult','2':'child_6_11','3':'under_6'}[age];if(!age_group)return notify('Ungültige Altersgruppe.',true);result=await db.from('family_companions').update({name,age_group}).eq('id',c.id);
 }else if(action==='remove'){
  if(!confirm(`Begleitperson „${c.name}“ aus der Familie entfernen?`))return;
  result=await db.from('family_companions').delete().eq('id',c.id);
 }else if(action==='move'&&admin()){
  const names=families.map((f,i)=>`${i+1}: ${f.name}`).join('\n');
  const n=prompt(`In welche Familie soll „${c.name}“ verschoben werden?\n${names}\nNummer eingeben:`);
  if(n===null)return;const target=families[Number(n)-1];if(!target)return notify('Ungültige Familie.',true);
  result=await db.from('family_companions').update({family_id:target.id}).eq('id',c.id);
 }else return;
 if(result.error)return fail(result.error);notify('Begleitperson aktualisiert.');refresh();
});

$('familyCreateForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!user)return;
 const name=$('familyName').value.trim();if(!name)return;
 if(!admin()&&familyMembers.some(m=>m.user_id===user.id&&m.status==='accepted'))return notify('Du bist bereits Mitglied einer Familie.',true);
 const {data,error}=await db.from('families').insert({name,created_by:user.id}).select('id').single();
 if(error)return fail(error);
 const r=await db.from('family_members').insert({family_id:data.id,user_id:user.id,status:'accepted',invited_by:user.id});
 if(r.error)return fail(r.error);
 $('familyName').value='';notify('Familie erstellt.');refresh();
});
$('familien').addEventListener('click',async e=>{
 const b=e.target.closest('button[data-family-action]');if(!b||!user)return;
 const action=b.dataset.familyAction,id=b.dataset.memberId,fid=b.dataset.familyId;
 const membership=familyMembers.find(m=>m.id===id),family=families.find(f=>f.id===fid);
 let result;
 if(action==='accept'){
  if(!membership||membership.user_id!==user.id)return;
  if(familyMembers.some(m=>m.user_id===user.id&&m.status==='accepted'))return notify('Bitte verlasse zuerst deine bisherige Familie.',true);
  result=await db.from('family_members').update({status:'accepted'}).eq('id',id).eq('user_id',user.id);
 }else if(action==='decline'||action==='remove'){
  if(!membership)return;
  if(!admin()&&membership.user_id!==user.id&&!(families.find(f=>f.id===membership.family_id)?.created_by===user.id&&membership.status==='pending'))return;
  result=await db.from('family_members').delete().eq('id',id);
 }else if(action==='invite'){
  if(!family||(family.created_by!==user.id&&!admin()))return;
  const target=document.querySelector(`select[data-family-select="${fid}"]`)?.value;
  if(!target)return notify('Bitte eine Person auswählen.',true);
  if(familyMembers.some(m=>m.user_id===target&&m.status==='accepted'))return notify('Diese Person gehört bereits zu einer Familie.',true);
  result=await db.from('family_members').insert({family_id:fid,user_id:target,status:admin()?'accepted':'pending',invited_by:user.id});
 }else if(action==='rename'){
  if(!family||(family.created_by!==user.id&&!admin()))return;
  const name=prompt('Neuer Familienname:',family.name)?.trim();if(!name)return;
  result=await db.from('families').update({name}).eq('id',fid);
 }else if(action==='delete'){
  if(!family||(family.created_by!==user.id&&!admin()))return;
  if(!confirm(`Familie „${family.name}“ wirklich löschen? Die Benutzerkonten und Zusagen bleiben erhalten.`))return;
  result=await db.from('families').delete().eq('id',fid);
 }else return;
 if(result.error)return fail(result.error);
 notify('Familienverwaltung aktualisiert.');refresh();
});


// Kostenabrechnung: Ausgaben vor Freigabe nur für Administratoren lesbar.
const euro=n=>(Number(n)||0).toLocaleString('de-DE',{style:'currency',currency:'EUR'});
const ageWeight=g=>g==='under_6'?0:g==='child_6_11'?0.5:1;
function calculateCosts(){
 const year=settings?.party_year;
 const accepted=familyMembers.filter(m=>m.status==='accepted');
 const familyFor=new Map(accepted.map(m=>[m.user_id,m.family_id]));
 const groups=new Map();
 function add(key,label,weight,person){if(!groups.has(key))groups.set(key,{key,label,weight:0,people:[]});const g=groups.get(key);g.weight+=weight;g.people.push(person)}
 for(const p of profiles){
  const fid=familyFor.get(p.id);const f=families.find(f=>f.id===fid);const key=fid?'family:'+fid:'user:'+p.id;const label=f?'Familie '+f.name:p.display_name;
  add(key,label,ageWeight(p.age_group),p.display_name);
  const named=familyCompanions.filter(c=>c.owner_id===p.id);
  // Vorhandene Begleiter-Zählung und neue namentliche Begleiter nicht doppelt zählen.
  const remaining=Math.max(0,(Number(p.companions)||0)-named.length);
  const childUnder=Math.min(remaining,Math.max(0,Number(p.child_under_6)||0));
  const child6=Math.min(remaining-childUnder,Math.max(0,Number(p.child_6_11)||0));
  add(key,label,(remaining-childUnder-child6)+child6*0.5,remaining?`${remaining} weitere Begleitpersonen`: '');
 }
 for(const c of familyCompanions){const f=families.find(f=>f.id===c.family_id);const key='family:'+c.family_id;add(key,f?'Familie '+f.name:'Familie',ageWeight(c.age_group),c.name)}
 const total=costItems.filter(x=>x.party_year===year).reduce((sum,x)=>sum+Number(x.amount||0),0);
 const weight=[...groups.values()].reduce((sum,g)=>sum+g.weight,0);
 // Centgenaue Verteilung durch größtes-Rest-Verfahren, keine Rundungsdifferenz.
 const cents=Math.round(total*100),entries=[...groups.values()].sort((a,b)=>a.key.localeCompare(b.key));
 let assigned=0;for(const g of entries){const raw=weight>0?cents*g.weight/weight:0;g.cents=Math.floor(raw);g.remainder=raw-g.cents;assigned+=g.cents}
 for(const g of [...entries].sort((a,b)=>b.remainder-a.remainder||a.key.localeCompare(b.key)).slice(0,Math.max(0,cents-assigned)))g.cents++;
 return {total,weight,perAdult:weight?total/weight:0,groups:entries};
}
function renderCosts(){
 const area=$('kosten');if(!area||!settings)return;
 const year=settings.party_year;const calc=calculateCosts();const released=!!costSettings?.released;
 $('costAdmin').hidden=!admin();$('costGuest').hidden=admin();
 $('costStatus').textContent=released?'Freigegeben':'Entwurf';
 if(admin()){
  $('costTotal').textContent=euro(calc.total);$('costPerAdult').textContent=euro(calc.perAdult);
  $('costRelease').textContent=released?'🔒 Freigabe zurücknehmen':'🔓 Kosten freigeben';
  $('costRelease').disabled=!released&&calc.weight===0;
  $('costEntries').innerHTML=costItems.filter(x=>x.party_year===year).map(x=>`<div class="adminRow"><span>${esc(x.title)} · <strong>${euro(x.amount)}</strong></span><div class="rowActions"><button class="btn small secondary" data-cost-action="edit" data-id="${x.id}">Bearbeiten</button><button class="btn small danger" data-cost-action="delete" data-id="${x.id}">Löschen</button></div></div>`).join('')||'<p class="muted">Noch keine Ausgaben eingetragen.</p>';
  $('costWarning').hidden=!released;
  $('costAccounts').innerHTML=calc.groups.map(g=>{const paid=costPayments.filter(p=>p.party_year===year&&p.group_key===g.key).reduce((s,p)=>s+Number(p.amount),0);return `<article class="guest"><strong>${esc(g.label)}</strong><p>${g.weight.toLocaleString('de-DE')} Kostenanteile · Beitrag: <strong>${euro(g.cents/100)}</strong></p><p>Bezahlt: ${euro(paid)} · ${g.cents/100-paid>0?'Offen: '+euro(g.cents/100-paid):'Ausgeglichen / Guthaben'}</p><button class="btn small" data-cost-action="pay-full" data-group="${esc(g.key)}" ${g.cents/100-paid<=0?'disabled':''}>💶 Rest bar erhalten</button> <button class="btn small secondary" data-cost-action="payment" data-group="${esc(g.key)}">Teilzahlung</button> <button class="btn small secondary" data-cost-action="history" data-group="${esc(g.key)}">Zahlungen anzeigen</button></article>`}).join('');
 }else{
  const fid=familyMembers.find(m=>m.user_id===user.id&&m.status==='accepted')?.family_id;
  const key=fid?'family:'+fid:'user:'+user.id;const mine=calc.groups.find(g=>g.key===key);
  $('costGuest').innerHTML=released?`<p>Die Abrechnung wurde freigegeben.</p><h3>${esc(mine?.label||'Dein Beitrag')}</h3><p><strong>Dein / euer Gesamtbeitrag: ${euro((mine?.cents||0)/100)}</strong></p><p class="muted small">Kinder unter 6: kostenlos · 6–11 Jahre: halber Beitrag · ab 12: voller Beitrag.</p>`:'<p class="muted">Die Kosten werden noch vorbereitet. Sobald der Administrator sie freigibt, erscheint hier dein Beitrag.</p>';
 }
}
$('costForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!admin())return;
 const selected=$('costCategory').value,title=selected==='Eigener Text'?$('costCustom').value.trim():selected,amount=Number($('costAmount').value);
 if(!title||!Number.isFinite(amount)||amount<=0||amount>1000000)return notify('Bitte Bezeichnung und gültigen Betrag eingeben.',true);
 const {error}=await db.from('party_cost_items').insert({party_year:settings.party_year,title,amount,created_by:user.id});if(error)return fail(error);
 $('costAmount').value='';$('costCustom').value='';notify('Kostenposition gespeichert.');refresh();
});
$('costCategory').addEventListener('change',()=>{$('costCustomWrap').hidden=$('costCategory').value!=='Eigener Text'});
$('costRelease').addEventListener('click',async()=>{
 if(!admin())return;const release=!costSettings.released;
 if(release&&!confirm('Kosten jetzt für alle Gäste freigeben? Jeder sieht seinen eigenen Beitrag.'))return;
 if(!release&&!confirm('Freigabe zurücknehmen? Gäste sehen dann keine Beträge mehr.'))return;
 const {error}=await db.from('party_cost_settings').update({released:release}).eq('id',1);if(error)return fail(error);
 notify(release?'Kosten freigegeben.':'Kosten wieder gesperrt.');refresh();
});
$('costEntries').addEventListener('click',async e=>{
 const b=e.target.closest('button[data-cost-action]');if(!b||!admin())return;const x=costItems.find(x=>x.id===b.dataset.id);if(!x)return;
 let r;if(b.dataset.costAction==='delete'){if(!confirm(`„${x.title}“ wirklich löschen?`))return;r=await db.from('party_cost_items').delete().eq('id',x.id)}
 else{const title=prompt('Kostenposition:',x.title)?.trim();if(!title)return;const val=prompt('Betrag in Euro:',x.amount);if(val===null)return;const amount=Number(val.replace(',','.'));if(!Number.isFinite(amount)||amount<=0)return notify('Ungültiger Betrag.',true);r=await db.from('party_cost_items').update({title,amount}).eq('id',x.id)}
 if(r.error)return fail(r.error);notify('Kosten aktualisiert.');refresh();
});
$('costAccounts').addEventListener('click',async e=>{
 const b=e.target.closest('button[data-cost-action]');if(!b||!admin())return;
 const key=b.dataset.group;const year=settings.party_year;
 if(b.dataset.costAction==='history'){
  const list=costPayments.filter(p=>p.party_year===year&&p.group_key===key);
  const lines=list.map((p,i)=>`${i+1}. ${euro(p.amount)} · ${fmt(p.created_at)} ${p.note||''}`).join('\n');
  const choice=prompt(`${lines||'Noch keine Zahlungen.'}\n\nZum Löschen einer Zahlung deren Nummer eingeben; sonst Abbrechen.`);
  if(choice===null||choice.trim()==='')return;const payment=list[Number(choice)-1];if(!payment)return notify('Ungültige Nummer.',true);
  if(!confirm('Diese Zahlung wirklich löschen?'))return;const {error}=await db.from('party_cost_payments').delete().eq('id',payment.id);if(error)return fail(error);notify('Zahlung gelöscht.');refresh();return;
 }
 let amount;
 if(b.dataset.costAction==='pay-full'){
  const group=calculateCosts().groups.find(g=>g.key===key);if(!group)return;
  const paid=costPayments.filter(p=>p.party_year===year&&p.group_key===key).reduce((sum,p)=>sum+Number(p.amount),0);
  amount=Math.round((group.cents/100-paid)*100)/100;
  if(amount<=0)return notify('Dieser Beitrag ist bereits bezahlt.');
  if(!confirm(`${group.label}: ${euro(amount)} in bar erhalten und verbuchen?`))return;
 }else{
  const val=prompt('Erhaltenen Barbetrag in Euro eingeben (Teilzahlungen möglich):');if(val===null)return;
  amount=Number(val.replace(',','.'));if(!Number.isFinite(amount)||amount<=0)return notify('Ungültiger Betrag.',true);
 }
 const {error}=await db.from('party_cost_payments').insert({party_year:year,group_key:key,amount,note:'Barzahlung',created_by:user.id});if(error)return fail(error);notify('Zahlung erfasst.');refresh();
});

async function boot(){if(!configured){notify('Einrichtung fehlt: Bitte config.js mit Supabase-Projekt-URL und Publishable/Anon-Key ausfüllen.',true);return}db=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});const {data,error}=await db.auth.getSession();if(error)fail(error);await onSession(data?.session);db.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_IN'||event==='SIGNED_OUT'||event==='USER_UPDATED')setTimeout(()=>onSession(session),0)});if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(console.warn)}
$('authForm').addEventListener('submit',async e=>{e.preventDefault();if(!db){notify('Keine Supabase-Verbindung. Bitte config.js und Internetverbindung prüfen.',true);return}const btn=$('loginBtn');btn.disabled=true;btn.textContent='Anmeldung läuft …';notify('Verbindung zu Supabase wird geprüft …');try{const result=await Promise.race([db.auth.signInWithPassword({email:$('authEmail').value.trim(),password:$('authPassword').value}),new Promise((_,reject)=>setTimeout(()=>reject(Error('Zeitüberschreitung nach 20 Sekunden. Bitte Internetverbindung, Supabase-URL und API-Key prüfen.')),20000))]);if(result.error)fail(result.error);else{notify('Anmeldung erfolgreich. Daten werden geladen …');await onSession(result.data.session)}}catch(err){fail(err)}finally{btn.disabled=false;btn.textContent='Anmelden'}});
$('registerBtn').addEventListener('click',async()=>{if(!db)return;const name=$('authName').value.trim(),email=$('authEmail').value.trim(),password=$('authPassword').value;if(!name||!email||password.length<8){notify('Bitte Name, E-Mail und ein Passwort mit mindestens 8 Zeichen eingeben.',true);return}const {data,error}=await db.auth.signUp({email,password,options:{data:{display_name:name},emailRedirectTo:location.origin+location.pathname}});if(error)fail(error);else notify(data.session?'Konto erstellt und angemeldet.':'Konto erstellt. Bitte bestätige deine E-Mail, falls du eine Bestätigungsnachricht erhältst.')});
$('resetBtn').addEventListener('click',async()=>{if(!db)return;const email=$('authEmail').value.trim();if(!email){notify('Bitte zuerst deine E-Mail-Adresse eingeben.',true);return}const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)fail(error);else notify('Falls die Adresse registriert ist, erhältst du eine E-Mail zum Zurücksetzen.')});
$('logout').addEventListener('click',async()=>{const {error}=await db.auth.signOut();if(error)fail(error)});
$('profileForm').addEventListener('submit',async e=>{e.preventDefault();const payload={display_name:$('profileName').value.trim(),companions:Number($('companions').value),companion_names:$('companionNames').value.trim(),note:$('profileNote').value.trim(),age_group:$('profileAgeGroup').value,child_6_11:Number($('profileChild6').value),child_under_6:Number($('profileChildUnder6').value)};if(!payload.display_name)return notify('Name fehlt.',true);if(payload.child_6_11<0||payload.child_under_6<0||payload.child_6_11+payload.child_under_6>payload.companions)return notify('Die Anzahl der Kinder darf nicht größer als die Begleitpersonen-Zahl sein.',true);const {error}=await db.from('profiles').update(payload).eq('id',user.id);if(error)fail(error);else{notify('Dein Profil wurde gespeichert.');refresh()}});
$('search').addEventListener('input',()=>{if(settings){render();translateParty()}});$('categoryFilter').addEventListener('change',()=>{if(settings){render();translateParty()}});
function openItem(item){$('itemId').value=item?.id||'';$('dialogTitle').textContent=item?'Wunsch bearbeiten':'Wunsch hinzufügen';$('itemName').value=item?.name||'';$('itemCategory').value=item?.category||'Speisen';$('itemQuantity').value=item?.quantity||1;$('itemUnit').value=item?.unit||'';$('itemNote').value=item?.note||'';$('editDialog').showModal()}
$('newItem').onclick=()=>openItem(null);$('closeDialog').onclick=()=>$('editDialog').close();$('closePledge').onclick=()=>$('pledgeDialog').close();
$('itemForm').addEventListener('submit',async e=>{e.preventDefault();const id=$('itemId').value;const payload={name:$('itemName').value.trim(),category:$('itemCategory').value,quantity:Number($('itemQuantity').value),unit:$('itemUnit').value.trim(),note:$('itemNote').value.trim()};const r=id?await db.from('items').update(payload).eq('id',id):await db.from('items').insert({...payload,party_year:settings.party_year,created_by:user.id});if(r.error)return fail(r.error);$('editDialog').close();notify('Wunsch gespeichert.');refresh()});
$('itemsBody').addEventListener('click',async e=>{const b=e.target.closest('button[data-action]');if(!b)return;const x=items.find(i=>i.id===b.dataset.id);if(!x)return;const act=b.dataset.action;if(act==='edit'){if(admin()||x.created_by===user.id)openItem(x);return}if(act==='delete'){if(!confirm(`„${x.name}“ wirklich löschen? Auch alle Zusagen dazu werden gelöscht.`))return;const {error}=await db.from('items').delete().eq('id',x.id);if(error)fail(error);else{notify('Wunsch gelöscht.');refresh()}return}if(act==='pledge'){const p=pledges.find(p=>p.item_id===x.id&&p.user_id===user.id);$('pledgeItemId').value=x.id;$('pledgeItemName').textContent=x.name;$('pledgeQty').value=p?.quantity??1;$('pledgeDialog').showModal();return}if(act==='manage'&&admin()){const ps=pledges.filter(p=>p.item_id===x.id);const options=ps.map((p,i)=>`${i+1}: ${profiles.find(z=>z.id===p.user_id)?.display_name||'Gast'} (${p.quantity})`).join('\n');const n=prompt(`Welche Zusage von „${x.name}“ bearbeiten?\n${options}\nNummer eingeben, Abbrechen = nichts ändern`);if(n===null)return;const p=ps[Number(n)-1];if(!p)return notify('Ungültige Nummer.',true);const amount=prompt('Neue Menge eingeben (0 = Zusage löschen):',p.quantity);if(amount===null)return;const qty=Number(amount);if(!Number.isInteger(qty)||qty<0||qty>999)return notify('Ungültige Menge.',true);const {error}=qty===0?await db.from('pledges').delete().eq('id',p.id):await db.from('pledges').update({quantity:qty}).eq('id',p.id);if(error)fail(error);else{notify('Zusage aktualisiert.');refresh()}}});
$('pledgeForm').addEventListener('submit',async e=>{e.preventDefault();const item_id=$('pledgeItemId').value,quantity=Number($('pledgeQty').value),p=pledges.find(p=>p.item_id===item_id&&p.user_id===user.id);if(quantity<0||quantity>999)return notify('Ungültige Menge.',true);let r;if(quantity===0){r=p?await db.from('pledges').delete().eq('id',p.id):{error:null}}else if(p){r=await db.from('pledges').update({quantity}).eq('id',p.id)}else{r=await db.from('pledges').insert({item_id,user_id:user.id,quantity})}if(r.error)return fail(r.error);$('pledgeDialog').close();notify('Zusage gespeichert.');refresh()});
$('settingsForm').addEventListener('submit',async e=>{e.preventDefault();if(!admin())return;let image_path=settings.image_path;const file=$('yearImage').files[0];if(file){if(file.size>3145728||!['image/jpeg','image/png','image/webp'].includes(file.type))return notify('Bitte JPG, PNG oder WebP bis 3 MB auswählen.',true);const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];image_path=`jahresbild-${Date.now()}.${ext}`;const {error}=await db.storage.from('party-images').upload(image_path,file,{contentType:file.type,upsert:false});if(error)return fail(error)}const {error}=await db.from('party_settings').update({party_year:Number($('partyYear').value),title:$('partyTitle').value.trim(),description:$('partyDescription').value.trim(),image_path}).eq('id',1);if(error)fail(error);else{notify('Party-Einstellungen gespeichert.');refresh()}});
$('adminGuests').addEventListener('click',async e=>{const b=e.target.closest('button[data-admin]');if(!b||!admin())return;const p=profiles.find(x=>x.id===b.dataset.id);if(!p)return;if(b.dataset.admin==='edit'){const name=prompt('Name bearbeiten:',p.display_name);if(name===null||!name.trim())return;const count=prompt('Begleitpersonen (0–50):',p.companions);if(count===null)return;const n=Number(count);if(!Number.isInteger(n)||n<0||n>50)return notify('Ungültige Personenzahl.',true);const ageChoice=prompt('Altersgruppe der angemeldeten Person: 1 = ab 12 Jahren, 2 = 6–11 Jahre, 3 = unter 6 Jahren',p.age_group==='child_6_11'?'2':p.age_group==='under_6'?'3':'1');if(ageChoice===null)return;const age_group={'1':'adult','2':'child_6_11','3':'under_6'}[ageChoice.trim()];if(!age_group)return notify('Ungültige Altersgruppe.',true);
const six=prompt('Wie viele der nicht einzeln erfassten Begleitpersonen sind 6–11 Jahre alt?',p.child_6_11||0);if(six===null)return;
const young=prompt('Wie viele der nicht einzeln erfassten Begleitpersonen sind unter 6 Jahre alt?',p.child_under_6||0);if(young===null)return;
const child_6_11=Number(six),child_under_6=Number(young);
if(!Number.isInteger(child_6_11)||!Number.isInteger(child_under_6)||child_6_11<0||child_under_6<0||child_6_11+child_under_6>n)return notify('Die Kinderzahlen passen nicht zur Begleitpersonen-Zahl.',true);
const {error}=await db.from('profiles').update({display_name:name.trim(),companions:n,age_group,child_6_11,child_under_6}).eq('id',p.id);if(error)fail(error);else{notify('Gast aktualisiert.');refresh()}}else if(b.dataset.admin==='remove'){if(!confirm(`Konto „${p.display_name}“ wirklich vollständig löschen? Alle zugehörigen Wünsche und Zusagen werden ebenfalls gelöscht. Dieser Schritt kann nicht rückgängig gemacht werden.`))return;const {error}=await db.rpc('admin_delete_party_user',{target_user:p.id});if(error)fail(error);else{notify('Konto und zugehörige Einträge gelöscht.');refresh()}}});
window.__silvesterStarted=true;boot().catch(fail);

// Passwort-Sichtbarkeit nur auf ausdrücklichen Klick ändern.
const passwordToggle=$('togglePassword');
passwordToggle?.addEventListener('click',()=>{const input=$('authPassword');const visible=input.type==='password';input.type=visible?'text':'password';passwordToggle.setAttribute('aria-pressed',String(visible));passwordToggle.setAttribute('aria-label',visible?'Passwort verbergen':'Passwort anzeigen');passwordToggle.title=visible?'Passwort verbergen':'Passwort anzeigen';});


// Sprache: DE / RU / EN. Kategorien und Artikelnamen bleiben in der Datenbank unverändert.
const partyTranslations = {"Party-Adresse":{"ru":"Адрес праздника","en":"Party address"},"📍 Party-Adresse & Anfahrt":{"ru":"📍 Адрес и маршрут","en":"📍 Party address & directions"},"Die Adresse wurde noch nicht eingetragen.":{"ru":"Адрес пока не указан.","en":"The address has not been added yet."},"Veranstaltungsadresse":{"ru":"Адрес проведения","en":"Venue address"},"🗺️ Route mit Google Maps":{"ru":"🗺️ Маршрут в Google Maps","en":"🗺️ Directions in Google Maps"},"Adresse ändern":{"ru":"Изменить адрес","en":"Edit address"},"Adresse löschen":{"ru":"Удалить адрес","en":"Delete address"},"Adresse speichern":{"ru":"Сохранить адрес","en":"Save address"},"Abbrechen":{"ru":"Отмена","en":"Cancel"},"Jeder angemeldete Gast darf eine noch fehlende Adresse eintragen. Danach kann sie nur der Administrator ändern oder löschen.":{"ru":"Любой вошедший гость может указать адрес, если его ещё нет. После этого изменить или удалить его может только администратор.","en":"Any signed-in guest may add a missing address. Afterward, only the administrator can edit or delete it."},"Sprache": {"ru": "Язык", "en": "Language"}, "Abmelden": {"ru": "Выйти", "en": "Log out"}, "Gemeinsam planen · Gemeinsam feiern": {"ru": "Планируем вместе · Празднуем вместе", "en": "Plan together · Celebrate together"}, "Wer bringt was?": {"ru": "Кто что принесёт?", "en": "Who brings what?"}, "Unsere Silvesterparty": {"ru": "Наш новогодний праздник", "en": "Our New Year’s party"}, "Zur Mitbringliste": {"ru": "К списку", "en": "Go to list"}, "Gäste ansehen": {"ru": "Список гостей", "en": "View guests"}, "Willkommen zur Silvesterparty": {"ru": "Добро пожаловать на новогодний праздник", "en": "Welcome to the New Year’s party"}, "Bitte melde dich an oder erstelle ein Konto. Damit kann jeder nur seine eigenen Einträge bearbeiten.": {"ru": "Войдите или создайте учётную запись. Каждый может изменять только свои записи.", "en": "Sign in or create an account. Everyone can edit only their own entries."}, "Name": {"ru": "Имя", "en": "Name"}, "E-Mail": {"ru": "Эл. почта", "en": "Email"}, "Passwort": {"ru": "Пароль", "en": "Password"}, "Anmelden": {"ru": "Войти", "en": "Sign in"}, "Neu registrieren": {"ru": "Регистрация", "en": "Register"}, "Passwort vergessen?": {"ru": "Забыли пароль?", "en": "Forgot password?"}, "Nach der Registrierung kann je nach Supabase-Einstellung eine E-Mail-Bestätigung erforderlich sein.": {"ru": "После регистрации может потребоваться подтверждение электронной почты.", "en": "Email confirmation may be required after registration."}, "Mein Profil": {"ru": "Мой профиль", "en": "My profile"}, "Mitbringliste": {"ru": "Список угощений", "en": "Potluck list"}, "Gäste": {"ru": "Гости", "en": "Guests"}, "Admin": {"ru": "Админ", "en": "Admin"}, "Personen insgesamt": {"ru": "Всего человек", "en": "Total people"}, "Wünsche": {"ru": "Позиции", "en": "Items"}, "Noch offene Mengen": {"ru": "Осталось принести", "en": "Still needed"}, "Dein Name": {"ru": "Ваше имя", "en": "Your name"}, "Begleitpersonen (ohne dich)": {"ru": "Гости с вами (кроме вас)", "en": "Additional guests (excluding you)"}, "Namen der Begleitpersonen (optional)": {"ru": "Имена сопровождающих (необязательно)", "en": "Companion names (optional)"}, "Hinweis (optional)": {"ru": "Примечание (необязательно)", "en": "Note (optional)"}, "Mein Profil speichern": {"ru": "Сохранить профиль", "en": "Save profile"}, "Dein Konto bleibt mit deinen Einträgen verknüpft, auch wenn du deinen Namen änderst.": {"ru": "Ваши записи сохранятся, даже если вы измените имя.", "en": "Your entries remain linked to your account even if you change your name."}, "Grün = zugesagt · Grau = noch offen": {"ru": "Зелёный = обещано · Серый = ещё нужно", "en": "Green = pledged · Gray = still needed"}, "+ Wunsch hinzufügen": {"ru": "+ Добавить позицию", "en": "+ Add item"}, "Alle Kategorien": {"ru": "Все категории", "en": "All categories"}, "Speisen": {"ru": "Еда", "en": "Food"}, "Getränke": {"ru": "Напитки", "en": "Drinks"}, "Geschirr & Zubehör": {"ru": "Посуда и принадлежности", "en": "Tableware & supplies"}, "Dekoration": {"ru": "Украшения", "en": "Decorations"}, "Sonstiges": {"ru": "Другое", "en": "Other"}, "Zusagen": {"ru": "Обещать принести", "en": "I’ll bring it"}, "Offen": {"ru": "Осталось", "en": "Remaining"}, "Was wird gebraucht?": {"ru": "Что нужно принести?", "en": "What is needed?"}, "Aktion": {"ru": "Действие", "en": "Action"}, "Gäste & Begleitpersonen": {"ru": "Гости и сопровождающие", "en": "Guests & companions"}, "Administration": {"ru": "Администрирование", "en": "Administration"}, "Nur Administratoren können hier sämtliche Profile, Wünsche und Zusagen bearbeiten oder löschen.": {"ru": "Только администраторы могут изменять или удалять все профили, позиции и обещания.", "en": "Only admins can edit or delete all profiles, items and pledges."}, "Party-Jahr (Jahreswechsel)": {"ru": "Год праздника", "en": "Party year"}, "Titel": {"ru": "Название", "en": "Title"}, "Untertitel": {"ru": "Подзаголовок", "en": "Subtitle"}, "Jahresbild (JPG, PNG oder WebP, max. 3 MB)": {"ru": "Картинка года (JPG, PNG или WebP, до 3 МБ)", "en": "Year image (JPG, PNG or WebP, max. 3 MB)"}, "Einstellungen speichern": {"ru": "Сохранить настройки", "en": "Save settings"}, "Gäste verwalten": {"ru": "Управление гостями", "en": "Manage guests"}, "Wunsch hinzufügen": {"ru": "Добавить позицию", "en": "Add item"}, "Wunsch bearbeiten": {"ru": "Изменить позицию", "en": "Edit item"}, "Kategorie": {"ru": "Категория", "en": "Category"}, "Benötigte Menge": {"ru": "Необходимое количество", "en": "Required quantity"}, "Einheit": {"ru": "Единица", "en": "Unit"}, "Bemerkung": {"ru": "Примечание", "en": "Note"}, "Speichern": {"ru": "Сохранить", "en": "Save"}, "Meine Zusage": {"ru": "Моё обещание", "en": "My pledge"}, "Ich bringe mit (Menge)": {"ru": "Я принесу (количество)", "en": "I will bring (quantity)"}, "0 entfernt deine Zusage. Du kannst nur deine eigene Zusage bearbeiten.": {"ru": "0 удаляет ваше обещание. Вы можете изменять только свои обещания.", "en": "0 removes your pledge. You can only edit your own pledge."}, "Zusage speichern": {"ru": "Подтвердить", "en": "Save pledge"}, "Gast": {"ru": "Гость", "en": "Guest"}, "Administrator": {"ru": "Администратор", "en": "Administrator"}, "Ändern": {"ru": "Изменить", "en": "Change"}, "Bearbeiten": {"ru": "Редактировать", "en": "Edit"}, "Löschen": {"ru": "Удалить", "en": "Delete"}, "Zusagen verwalten": {"ru": "Управлять обещаниями", "en": "Manage pledges"}, "Keine Einträge gefunden.": {"ru": "Ничего не найдено.", "en": "No items found."}, "Noch keine Zusagen": {"ru": "Пока никто не обещал", "en": "No pledges yet"}, "Profil entfernen": {"ru": "Удалить профиль", "en": "Remove profile"}};
let partyLanguage=localStorage.getItem('silvester-language')||'de';
if(!['de','ru','en'].includes(partyLanguage))partyLanguage='de';
const partyOriginalText=new WeakMap();
const partyOriginalPlaceholders=new WeakMap();
function partyT(s){return partyLanguage==='de'?s:(partyTranslations[s]?.[partyLanguage]||s)}
function translateParty(){
 document.documentElement.lang=partyLanguage;
 const sel=document.getElementById('languageSelect');if(sel)sel.value=partyLanguage;
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode())){const el=node.parentElement;if(!el||['SCRIPT','STYLE','OPTION','TEXTAREA'].includes(el.tagName)||el.closest('#itemsBody,#guestList,#adminGuests'))continue;
 const original=partyOriginalText.get(node)??node.nodeValue;partyOriginalText.set(node,original);
 const trimmed=original.trim();if(partyTranslations[trimmed])node.nodeValue=original.replace(trimmed,partyT(trimmed));
 }
 for(const el of document.querySelectorAll('input[placeholder],textarea[placeholder]')){let p=partyOriginalPlaceholders.get(el);if(p===undefined){p=el.placeholder;partyOriginalPlaceholders.set(el,p)}el.placeholder=partyT(p)}
 // Die Einträge aus der Datenbank werden nur an den Bedienelementen übersetzt.
 for(const el of document.querySelectorAll('#itemsBody button,#adminGuests button')){const base=el.dataset.originalLabel||el.textContent;el.dataset.originalLabel=base;el.textContent=partyT(base)}
}
document.getElementById('languageSelect')?.addEventListener('change',e=>{partyLanguage=e.target.value;localStorage.setItem('silvester-language',partyLanguage);translateParty();if(settings)render()});

translateParty();

// Veranstaltungsort: erstmalige Eingabe durch angemeldete Gäste; Änderungen/Löschen nur Admin.
function renderPartyLocation(){
 const has=!!partyLocation?.address;
 $('locationEmpty').hidden=has;
 $('locationDisplay').hidden=!has;
 $('locationText').textContent=has?partyLocation.address:'';
 if(has)$('locationMaps').href='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(partyLocation.address);
 $('locationEdit').hidden=!has||!admin();$('locationDelete').hidden=!has||!admin();
 $('locationForm').hidden=has;
 if(!has)$('locationAddress').value='';
}
$('locationForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!db||!user)return;
 const address=$('locationAddress').value.trim();if(!address)return notify('Bitte eine Adresse eingeben.',true);
 const result=partyLocation?await db.from('party_location').update({address}).eq('id',1):await db.from('party_location').insert({id:1,address,created_by:user.id});
 if(result.error){fail(result.error);return}notify('Party-Adresse gespeichert.');await refresh();
});
$('locationEdit').addEventListener('click',()=>{if(!admin())return;$('locationAddress').value=partyLocation?.address||'';$('locationForm').hidden=false;$('locationAddress').focus()});
$('locationCancel').addEventListener('click',()=>{if(partyLocation)$('locationForm').hidden=true;else $('locationAddress').value=''});
$('locationDelete').addEventListener('click',async()=>{if(!admin()||!confirm('Party-Adresse wirklich löschen?'))return;const {error}=await db.from('party_location').delete().eq('id',1);if(error)fail(error);else{notify('Party-Adresse gelöscht.');refresh()}});
