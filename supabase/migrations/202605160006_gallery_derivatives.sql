alter table public.photos
  add column if not exists gallery_image_path text;
