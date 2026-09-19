-- Schema per l'Atelier di Kiki, Tempo di Gioia (Telegram Mini App)
-- Da eseguire una sola volta nell'SQL Editor di Supabase (Project > SQL Editor > New query).

create table if not exists atelier_users (
  telegram_user_id bigint primary key,
  telegram_first_name text,
  gomitoli integer not null default 0,
  badges jsonb not null default '[]'::jsonb,
  lib_done jsonb not null default '[]'::jsonb,
  dream_sent boolean not null default false,
  voted_idea integer,
  idea_proposed boolean not null default false,
  daily_done date,
  spun date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Conteggio voti condiviso tra tutti gli utenti per "Sfida del Prossimo Pattern".
-- I 4 semi iniziali replicano gli stessi valori finti gia' presenti nella demo locale.
create table if not exists idea_votes (
  idea_id integer primary key,
  votes integer not null default 0
);

insert into idea_votes (idea_id, votes) values
  (0, 3),
  (1, 5),
  (2, 2),
  (3, 4)
on conflict (idea_id) do nothing;

-- Incremento atomico: evita che due voti arrivati nello stesso istante si
-- sovrascrivano a vicenda (un semplice "leggi, somma, riscrivi" da codice
-- non sarebbe sicuro con piu' utenti contemporanei).
create or replace function increment_idea_vote(p_idea_id integer)
returns void as $$
begin
  update idea_votes set votes = votes + 1 where idea_id = p_idea_id;
end;
$$ language plpgsql;

-- Le Netlify Functions usano la chiave service_role (mai esposta al client),
-- quindi non e' strettamente necessario abilitare Row Level Security qui.
-- La lasciamo comunque disattivata di default per semplicita': l'accesso a
-- queste tabelle passa sempre e solo dalle funzioni server-side, mai dal
-- browser direttamente.
