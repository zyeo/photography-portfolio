alter table public.photos
  add column if not exists image_width integer,
  add column if not exists image_height integer;

alter table public.photos
  add constraint photos_image_width_positive check (image_width is null or image_width > 0),
  add constraint photos_image_height_positive check (image_height is null or image_height > 0);
