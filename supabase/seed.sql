insert into public.photos (
  id,
  image_path,
  public_image_path,
  original_filename,
  date_taken,
  location_name,
  camera,
  lens,
  aperture,
  shutter_speed,
  iso,
  hidden_tags,
  hero_approved,
  pinned_hero,
  selected,
  selected_size,
  selected_order,
  published
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'seed/originals/rain-window.jpg',
    'seed/public/rain-window.jpg',
    'rain-window.jpg',
    '2026-05-14T18:10:00+09:00',
    'Setagaya',
    'Fujifilm X-T5',
    'XF35mmF1.4 R',
    'f/2',
    '1/250',
    800,
    array['rain', 'tram'],
    true,
    true,
    true,
    'large',
    1,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'seed/originals/vending-glass.jpg',
    'seed/public/vending-glass.jpg',
    'vending-glass.jpg',
    null,
    'Koenji',
    null,
    null,
    null,
    null,
    null,
    array['night'],
    false,
    false,
    false,
    null,
    null,
    false
  );

insert into public.journal_entries (
  photo_id,
  entry_date,
  title,
  reflection,
  published
)
values (
  '11111111-1111-1111-1111-111111111111',
  '2026-05-14',
  'Rain holding on the tram window',
  'The glass kept the city at one remove; I stayed with the blur instead of chasing clarity.',
  true
);

insert into public.collections (
  id,
  title,
  slug,
  type,
  description,
  cover_photo_id,
  published,
  display_order
)
values (
  '33333333-3333-3333-3333-333333333333',
  'Digital',
  'digital',
  'medium',
  'Daily digital work and studies.',
  '11111111-1111-1111-1111-111111111111',
  true,
  1
);

insert into public.photo_collections (photo_id, collection_id, display_order)
values ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 1);
