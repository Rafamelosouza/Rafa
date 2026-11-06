-- MISSÃO ENEM 2026: banco de dados de enquetes anônimas
-- Execute integralmente no SQL Editor de um projeto SUPABASE gratuito.
-- Não solicita nome, CPF, e-mail, idade nem telefone dos adolescentes.
-- As tabelas NÃO são consultáveis diretamente com a chave pública;
-- apenas as funções seguras retornam resultados AGREGADOS.
-- Projeto de evento com retenção curta: apagar os dados após o encontro.

create table if not exists public.enem_rooms (
  id uuid primary key default gen_random_uuid(),
  code varchar(6) not null unique,
  host_hash text not null,
  scene integer not null default 0,
  active_poll text,
  poll_open boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.enem_rooms drop constraint if exists enem_rooms_scene_check;
alter table public.enem_rooms add constraint enem_rooms_scene_check check (scene between 0 and 24);

create index if not exists enem_rooms_created_idx on public.enem_rooms(created_at);

create table if not exists public.enem_participants (
  room_id uuid not null references public.enem_rooms(id) on delete cascade,
  token_hash text not null,
  created_at timestamptz not null default now(),
  primary key(room_id, token_hash)
);

create table if not exists public.enem_votes (
  room_id uuid not null,
  poll_id text not null,
  token_hash text not null,
  choice integer not null check (choice between 0 and 7),
  created_at timestamptz not null default now(),
  primary key(room_id, poll_id, token_hash),
  foreign key (room_id, token_hash)
    references public.enem_participants(room_id,token_hash) on delete cascade
);

alter table public.enem_rooms enable row level security;
alter table public.enem_participants enable row level security;
alter table public.enem_votes enable row level security;

revoke all on table public.enem_rooms,public.enem_participants,public.enem_votes
  from anon,authenticated,public;

-- Todas as funções são SECURITY DEFINER com search_path controlado,
-- validação de segredo e acesso apenas ao mínimo necessário.

create or replace function public.enem_new_room(p_host_token text)
returns jsonb language plpgsql security definer
set search_path = pg_catalog,public
as $$
declare v_code text; v_id uuid; v_attempt integer;
begin
 if p_host_token is null or length(p_host_token)<32 then
   raise exception 'É necessário um segredo seguro de apresentação.';
 end if;
 for v_attempt in 1..12 loop
   v_code:=upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
   begin
     insert into public.enem_rooms(code,host_hash)
     values (v_code,md5(p_host_token)) returning id into v_id;
     return jsonb_build_object('code',v_code,'created',true);
   exception when unique_violation then null;
   end;
 end loop;
 raise exception 'Não foi possível criar uma sala. Tente novamente.';
end;
$$;

create or replace function public.enem_join_room(p_code text,p_part_token text)
returns jsonb language plpgsql security definer
set search_path = pg_catalog,public
as $$
declare v_id uuid;
begin
 if p_part_token is null or length(p_part_token)<32 then
   raise exception 'Identificador de participação inválido.';
 end if;
 select id into v_id from public.enem_rooms
 where code=upper(trim(p_code));
 if v_id is null then raise exception 'Código de sala não encontrado.'; end if;
 insert into public.enem_participants(room_id,token_hash)
 values(v_id,md5(p_part_token)) on conflict do nothing;
 return jsonb_build_object('joined',true);
end;
$$;

create or replace function public.enem_room_state(p_code text)
returns jsonb language plpgsql security definer
set search_path = pg_catalog,public
as $$
declare r public.enem_rooms%rowtype;
        v_count integer; v_votes jsonb;
begin
 select * into r from public.enem_rooms where code=upper(trim(p_code));
 if r.id is null then return jsonb_build_object('error','A sala não foi encontrada.'); end if;
 select count(*)::integer into v_count from public.enem_participants where room_id=r.id;
 select coalesce(jsonb_agg(jsonb_build_object('choice',q.choice,'qty',q.qty) order by q.choice),'[]'::jsonb)
 into v_votes from (
   select choice,count(*)::integer as qty from public.enem_votes
   where room_id=r.id and poll_id=r.active_poll
   group by choice
 ) q;
 return jsonb_build_object(
    'code',r.code,'scene',r.scene,'active_poll',r.active_poll,
    'poll_open',r.poll_open,'participants',v_count,
    'counts',v_votes
 );
end;
$$;

create or replace function public.enem_set_room(
 p_code text,p_host_token text,p_scene integer,p_poll_id text,p_open boolean
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog,public
as $$
declare v_id uuid;
begin
 if p_scene is null or p_scene not between 0 and 24 then
  raise exception 'Tela inválida.';
 end if;
 if p_poll_id is not null and p_poll_id not in (
 'mood','order','ghost_red','ghost_blue','ghost_pink',
 'ghost_orange','ghost_purple','ghost_green','ghost_yellow','ghost_turquoise','inv1','inv2','inv3','inv4','inv5','inv6','bag'
 ) then raise exception 'Enquete inválida.'; end if;
 select id into v_id from public.enem_rooms
 where code=upper(trim(p_code)) and host_hash=md5(coalesce(p_host_token,''));
 if v_id is null then raise exception 'Chave de apresentação inválida.'; end if;
 update public.enem_rooms set scene=p_scene,active_poll=p_poll_id,
   poll_open=case when p_poll_id is null then false else coalesce(p_open,false) end
 where id=v_id;
 return jsonb_build_object('updated',true);
end;
$$;

create or replace function public.enem_submit_vote(
 p_code text,p_part_token text,p_poll_id text,p_choice integer
)
returns jsonb language plpgsql security definer
set search_path = pg_catalog,public
as $$
declare r public.enem_rooms%rowtype;v_hash text;
begin
 if p_choice is null or p_choice not between 0 and 7 then
  raise exception 'Alternativa inválida.';
 end if;
 select * into r from public.enem_rooms where code=upper(trim(p_code));
 if r.id is null then raise exception 'Sala não encontrada.'; end if;
 if not r.poll_open or r.active_poll is distinct from p_poll_id then
   raise exception 'Esta pergunta não está aberta para respostas.';
 end if;
 v_hash:=md5(coalesce(p_part_token,''));
 if not exists(select 1 from public.enem_participants
  where room_id=r.id and token_hash=v_hash) then
  raise exception 'Entre na sala antes de votar.';
 end if;
 insert into public.enem_votes(room_id,poll_id,token_hash,choice)
 values(r.id,p_poll_id,v_hash,p_choice)
 on conflict (room_id,poll_id,token_hash)
 do update set choice=excluded.choice,created_at=now();
 return jsonb_build_object('saved',true);
end;
$$;

create or replace function public.enem_delete_room(p_code text,p_host_token text)
returns jsonb language plpgsql security definer
set search_path = pg_catalog,public
as $$
declare v_count integer;
begin
 delete from public.enem_rooms
 where code=upper(trim(p_code)) and host_hash=md5(coalesce(p_host_token,''));
 get diagnostics v_count = row_count;
 if v_count=0 then raise exception 'Sala não encontrada ou chave inválida.'; end if;
 return jsonb_build_object('deleted',true);
end;
$$;

revoke all on function public.enem_new_room(text) from public;
revoke all on function public.enem_join_room(text,text) from public;
revoke all on function public.enem_room_state(text) from public;
revoke all on function public.enem_set_room(text,text,integer,text,boolean) from public;
revoke all on function public.enem_submit_vote(text,text,text,integer) from public;
revoke all on function public.enem_delete_room(text,text) from public;
grant execute on function public.enem_new_room(text) to anon,authenticated;
grant execute on function public.enem_join_room(text,text) to anon,authenticated;
grant execute on function public.enem_room_state(text) to anon,authenticated;
grant execute on function public.enem_set_room(text,text,integer,text,boolean) to anon,authenticated;
grant execute on function public.enem_submit_vote(text,text,text,integer) to anon,authenticated;
grant execute on function public.enem_delete_room(text,text) to anon,authenticated;

-- Depois do encontro, clique em "Apagar sala e respostas" no painel do jogo.
-- Isso apaga sala, participantes e votos em cascata.
-- Alternativamente, para excluir salas abandonadas com mais de 48 horas:
-- delete from public.enem_rooms where created_at<now()-interval '48 hours';
