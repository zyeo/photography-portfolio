alter table public.photos
  add column if not exists content_hash text;

create unique index if not exists photos_content_hash_unique_idx
  on public.photos (content_hash)
  where content_hash is not null;
