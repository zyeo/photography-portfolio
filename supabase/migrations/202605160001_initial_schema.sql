create extension if not exists pgcrypto;

create type public.photo_medium as enum ('digital', 'film');
create type public.selected_size as enum ('normal', 'large');
create type public.collection_type as enum ('medium', 'project', 'theme');

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  image_path text not null,
  public_image_path text,
  original_filename text not null,
  date_taken timestamptz,
  location_name text,
  latitude double precision,
  longitude double precision,
  camera text,
  lens text,
  aperture text,
  shutter_speed text,
  iso integer,
  medium public.photo_medium not null default 'digital',
  hidden_tags text[] not null default '{}',
  hero_approved boolean not null default false,
  pinned_hero boolean not null default false,
  focal_point_x numeric(5,4) not null default 0.5000 check (focal_point_x between 0 and 1),
  focal_point_y numeric(5,4) not null default 0.5000 check (focal_point_y between 0 and 1),
  mobile_crop jsonb,
  selected boolean not null default false,
  selected_size public.selected_size,
  selected_order integer,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  constraint selected_size_matches_selected check (
    (selected = false and selected_size is null)
    or (selected = true and selected_size is not null)
  ),
  constraint selected_order_matches_selected check (
    (selected = false and selected_order is null)
    or selected = true
  ),
  constraint latitude_valid check (latitude is null or latitude between -90 and 90),
  constraint longitude_valid check (longitude is null or longitude between -180 and 180)
);

create unique index photos_single_pinned_hero_idx
  on public.photos ((pinned_hero))
  where pinned_hero = true;

create index photos_date_taken_idx on public.photos (date_taken desc);
create index photos_selected_order_idx on public.photos (selected_order)
  where selected = true;

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null unique references public.photos(id) on delete cascade,
  entry_date date not null unique,
  title text not null,
  reflection text not null,
  weather text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create index journal_entries_entry_date_idx
  on public.journal_entries (entry_date desc);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  type public.collection_type not null,
  description text,
  cover_photo_id uuid references public.photos(id) on delete set null,
  start_date date,
  end_date date,
  published boolean not null default false,
  display_order integer,
  created_at timestamptz not null default now(),
  constraint collection_date_range_valid check (
    start_date is null or end_date is null or start_date <= end_date
  )
);

create table public.photo_collections (
  photo_id uuid not null references public.photos(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  display_order integer,
  primary key (photo_id, collection_id)
);

alter table public.photos enable row level security;
alter table public.journal_entries enable row level security;
alter table public.collections enable row level security;
alter table public.photo_collections enable row level security;

create policy "Public can read published photos"
  on public.photos for select
  to anon, authenticated
  using (published = true);

create policy "Public can read published journal entries"
  on public.journal_entries for select
  to anon, authenticated
  using (published = true);

create policy "Public can read published collections"
  on public.collections for select
  to anon, authenticated
  using (published = true);

create policy "Public can read links for published collections and photos"
  on public.photo_collections for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.photos p
      where p.id = photo_id and p.published = true
    )
    and exists (
      select 1 from public.collections c
      where c.id = collection_id and c.published = true
    )
  );

create policy "Authenticated admins manage photos"
  on public.photos for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated admins manage journal entries"
  on public.journal_entries for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated admins manage collections"
  on public.collections for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated admins manage photo collections"
  on public.photo_collections for all
  to authenticated
  using (true)
  with check (true);

insert into storage.buckets (id, name, public)
values
  ('originals', 'originals', false),
  ('public-images', 'public-images', true)
on conflict (id) do nothing;

create policy "Authenticated admins upload originals"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'originals');

create policy "Authenticated admins read originals"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'originals');

create policy "Authenticated admins manage public images"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'public-images')
  with check (bucket_id = 'public-images');
