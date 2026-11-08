-- EINMALIG im Supabase SQL Editor ausführen.
-- Administrator wird anschließend durch SQL-Befehl in README eingerichtet.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Gast' check (char_length(display_name) between 1 and 80),
 companions integer not null default 0 check (companions between 0 and 50),
 companion_names text not null default '' check (char_length(companion_names)<=500),
 note text not null default '' check (char_length(note)<=500),
 role text not null default 'guest' check (role in ('guest','admin')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.party_settings (
 id integer primary key default 1 check (id=1),
 party_year integer not null check (party_year between 2020 and 2100),
 title text not null default 'Wer bringt was?' check (char_length(title)<=100),
 description text not null default 'Gemeinsam planen, gemeinsam feiern' check (char_length(description)<=250),
 image_path text,
 updated_at timestamptz not null default now()
);
insert into public.party_settings(id,party_year) values(1,extract(year from now())::integer)
on conflict(id) do nothing;
create table if not exists public.items (
 id uuid primary key default gen_random_uuid(),
 name text not null check (char_length(name) between 1 and 120),
 category text not null default 'Sonstiges' check(category in ('Speisen','Getränke','Geschirr & Zubehör','Dekoration','Sonstiges')),
 quantity integer not null default 1 check(quantity between 1 and 999),
 unit text not null default '' check(char_length(unit)<=30),
 note text not null default '' check(char_length(note)<=500),
 party_year integer not null check(party_year between 2020 and 2100),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.pledges (
 id uuid primary key default gen_random_uuid(),
 item_id uuid not null references public.items(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 quantity integer not null check(quantity between 1 and 999),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(item_id,user_id)
);
create or replace function public.is_party_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin');
$$;
revoke all on function public.is_party_admin() from public;
grant execute on function public.is_party_admin() to authenticated;
create or replace function public.create_party_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name) values(new.id,coalesce(nullif(left(trim(new.raw_user_meta_data->>'display_name'),80),''),'Gast'));
 return new;
end $$;
drop trigger if exists on_auth_user_created_party on auth.users;
create trigger on_auth_user_created_party after insert on auth.users for each row execute function public.create_party_profile();
create or replace function public.protect_party_profile() returns trigger language plpgsql set search_path='' as $$
begin
 if not public.is_party_admin() then
   if new.role is distinct from old.role or new.id is distinct from old.id or new.created_at is distinct from old.created_at then
     raise exception 'Geschützte Profilfelder dürfen nicht geändert werden';
   end if;
 end if;
 new.updated_at=now();return new;
end $$;
drop trigger if exists protect_party_profile_trigger on public.profiles;
create trigger protect_party_profile_trigger before update on public.profiles for each row execute function public.protect_party_profile();
create or replace function public.stamp_party_row() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now();return new;end $$;
create or replace function public.guard_party_item() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='INSERT' then
   if new.created_by<>(select auth.uid()) and not public.is_party_admin() then raise exception 'Fremder Eigentümer';end if;
   if new.party_year<>(select party_year from public.party_settings where id=1) then raise exception 'Nur das aktuelle Partyjahr';end if;
 else
   if new.created_by is distinct from old.created_by or new.party_year is distinct from old.party_year then raise exception 'Eigentümer/Jahr unveränderlich';end if;
 end if;
 new.updated_at=now();return new;
end $$;
drop trigger if exists guard_party_item_trigger on public.items;
create trigger guard_party_item_trigger before insert or update on public.items for each row execute function public.guard_party_item();
create or replace function public.guard_party_pledge() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='INSERT' then
   if new.user_id<>(select auth.uid()) and not public.is_party_admin() then raise exception 'Fremde Zusage';end if;
 else
   if new.user_id is distinct from old.user_id or new.item_id is distinct from old.item_id then raise exception 'Eigentümer/Eintrag unveränderlich';end if;
 end if;
 new.updated_at=now();return new;
end $$;
drop trigger if exists guard_party_pledge_trigger on public.pledges;
create trigger guard_party_pledge_trigger before insert or update on public.pledges for each row execute function public.guard_party_pledge();
drop trigger if exists stamp_party_settings on public.party_settings;
create trigger stamp_party_settings before update on public.party_settings for each row execute function public.stamp_party_row();
alter table public.profiles enable row level security;
alter table public.party_settings enable row level security;
alter table public.items enable row level security;
alter table public.pledges enable row level security;
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using(true);
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using(id=(select auth.uid()) or public.is_party_admin()) with check(id=(select auth.uid()) or public.is_party_admin());
drop policy if exists settings_read on public.party_settings;
create policy settings_read on public.party_settings for select to authenticated using(true);
drop policy if exists settings_admin_update on public.party_settings;
create policy settings_admin_update on public.party_settings for update to authenticated using(public.is_party_admin()) with check(public.is_party_admin());
drop policy if exists items_read on public.items;
create policy items_read on public.items for select to authenticated using(true);
drop policy if exists items_insert on public.items;
create policy items_insert on public.items for insert to authenticated with check(created_by=(select auth.uid()) or public.is_party_admin());
drop policy if exists items_update on public.items;
create policy items_update on public.items for update to authenticated using(created_by=(select auth.uid()) or public.is_party_admin()) with check(created_by=(select auth.uid()) or public.is_party_admin());
drop policy if exists items_delete on public.items;
create policy items_delete on public.items for delete to authenticated using(created_by=(select auth.uid()) or public.is_party_admin());
drop policy if exists pledges_read on public.pledges;
create policy pledges_read on public.pledges for select to authenticated using(true);
drop policy if exists pledges_insert on public.pledges;
create policy pledges_insert on public.pledges for insert to authenticated with check(user_id=(select auth.uid()) or public.is_party_admin());
drop policy if exists pledges_update on public.pledges;
create policy pledges_update on public.pledges for update to authenticated using(user_id=(select auth.uid()) or public.is_party_admin()) with check(user_id=(select auth.uid()) or public.is_party_admin());
drop policy if exists pledges_delete on public.pledges;
create policy pledges_delete on public.pledges for delete to authenticated using(user_id=(select auth.uid()) or public.is_party_admin());
-- Ein öffentlicher Storage-Bucket für das festliche Jahresbild, aber Upload nur für Admin.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('party-images','party-images',true,3145728,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=3145728,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists party_images_admin_insert on storage.objects;
create policy party_images_admin_insert on storage.objects for insert to authenticated with check(bucket_id='party-images' and public.is_party_admin());
drop policy if exists party_images_admin_update on storage.objects;
create policy party_images_admin_update on storage.objects for update to authenticated using(bucket_id='party-images' and public.is_party_admin()) with check(bucket_id='party-images' and public.is_party_admin());
drop policy if exists party_images_admin_delete on storage.objects;
create policy party_images_admin_delete on storage.objects for delete to authenticated using(bucket_id='party-images' and public.is_party_admin());
-- Auch bei API-Zugriff gilt: Gäste können Rollen nicht selbst hochstufen.
-- Bestehende auth.users (vor SQL-Installation) manuell migrieren, falls vorhanden.
-- Sichere vollständige Kontolöschung durch Admin (inkl. Profil, Wünsche, Zusagen).
create or replace function public.admin_delete_party_user(target_user uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_party_admin() then raise exception 'Nur Admin'; end if;
 if target_user=(select auth.uid()) then raise exception 'Eigenes Admin-Konto kann nicht gelöscht werden'; end if;
 delete from public.items where created_by=target_user;
 delete from auth.users where id=target_user;
end $$;
revoke all on function public.admin_delete_party_user(uuid) from public;
grant execute on function public.admin_delete_party_user(uuid) to authenticated;
