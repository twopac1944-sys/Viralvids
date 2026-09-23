-- ViralVid Fast — initial schema
-- Pipeline: Story Engine (Claude) → Character Sheet → MiniMax H3 (WaveSpeed) → ffmpeg assembly

-- story_packages: one row per generated story
create table if not exists story_packages (
  id            uuid primary key default gen_random_uuid(),
  story_id      text unique not null,          -- client-generated UUID from /api/story-engine
  title         text not null,
  genre         text not null,
  premise       text not null,
  created_at    timestamptz not null default now()
);

-- characters: locked character references attached to a story
create table if not exists characters (
  id                    uuid primary key default gen_random_uuid(),
  story_id              text not null references story_packages(story_id) on delete cascade,
  character_id          text not null,          -- e.g. "char_001" assigned by story engine
  name                  text not null,
  appearance            text not null,          -- locked physical description for visual consistency
  personality_note      text not null default '',
  image_reference_urls  text[] not null default '{}',  -- Supabase Storage URLs, in order
  voice_reference_url   text,
  voice_reference_note  text,
  created_at            timestamptz not null default now(),
  unique (story_id, character_id)
);

-- scene_jobs: one row per scene within a story
create table if not exists scene_jobs (
  id                uuid primary key default gen_random_uuid(),
  story_id          text not null references story_packages(story_id) on delete cascade,
  scene_index       integer not null,           -- 0-based order within the story
  scene_id          integer not null,           -- sceneId from the story engine
  setting           text not null,
  scene_description text not null,
  camera            jsonb not null default '{}',    -- { angle, movement }
  color_grade       text not null default '',
  dialogue          jsonb not null default '[]',    -- DialogueLine[]
  sound_fx          text[] not null default '{}',
  music_cue         text not null default '',
  duration_seconds  integer,
  resolution_tier   text check (resolution_tier in ('480p','540p','768p','2k')),
  use_voice_reference boolean not null default false,
  created_at        timestamptz not null default now(),
  unique (story_id, scene_id)
);

-- render_results: one row per render attempt on a scene
create table if not exists render_results (
  id                  uuid primary key default gen_random_uuid(),
  story_id            text not null references story_packages(story_id) on delete cascade,
  scene_id            integer not null,
  wavespeed_task_id   text,
  status              text not null default 'pending'
                        check (status in ('pending','rendering','complete','failed')),
  video_url           text,
  error_message       text,
  used_voice_reference boolean not null default false,
  cost_estimate_usd   numeric(10,4),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- keep updated_at current on render_results
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger render_results_updated_at
  before update on render_results
  for each row execute function update_updated_at();

-- RLS: enable but leave permissive for local dev (tighten before production)
alter table story_packages   enable row level security;
alter table characters       enable row level security;
alter table scene_jobs       enable row level security;
alter table render_results   enable row level security;

create policy "service role full access" on story_packages  for all using (true) with check (true);
create policy "service role full access" on characters      for all using (true) with check (true);
create policy "service role full access" on scene_jobs      for all using (true) with check (true);
create policy "service role full access" on render_results  for all using (true) with check (true);
