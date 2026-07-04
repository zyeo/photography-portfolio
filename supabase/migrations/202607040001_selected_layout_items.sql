create table public.selected_layout_items (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null unique references public.photos(id) on delete cascade,
  desktop_x numeric(7,4) not null default 0 check (desktop_x >= 0 and desktop_x <= 100),
  desktop_y numeric(9,4) not null default 0 check (desktop_y >= 0),
  desktop_width numeric(7,4) not null default 28 check (desktop_width >= 8 and desktop_width <= 100),
  desktop_z_index integer not null default 0,
  mobile_order integer check (mobile_order is null or mobile_order > 0),
  caption text check (caption is null or char_length(caption) <= 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint selected_layout_item_within_desktop_bounds check (desktop_x + desktop_width <= 100)
);

create index selected_layout_items_mobile_order_idx
  on public.selected_layout_items (mobile_order);

alter table public.selected_layout_items enable row level security;

create policy "Public can read selected layout for published photos"
  on public.selected_layout_items for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.photos p
      where p.id = photo_id
        and p.selected = true
        and p.published = true
    )
  );

create policy "Authenticated admins manage selected layout"
  on public.selected_layout_items for all
  to authenticated
  using (true)
  with check (true);

insert into public.selected_layout_items (
  photo_id,
  desktop_x,
  desktop_y,
  desktop_width,
  mobile_order
)
select
  id,
  case
    when row_number() over (order by selected_order nulls last, created_at, id) = 1 then 0
    when (row_number() over (order by selected_order nulls last, created_at, id) - 1) % 3 = 1 then 62
    else 18
  end as desktop_x,
  case
    when row_number() over (order by selected_order nulls last, created_at, id) = 1 then 0
    else floor((row_number() over (order by selected_order nulls last, created_at, id) - 1)::numeric / 3) * 42
      + case (row_number() over (order by selected_order nulls last, created_at, id) - 1) % 3
        when 1 then 8
        when 2 then 26
        else 0
      end
  end as desktop_y,
  case
    when row_number() over (order by selected_order nulls last, created_at, id) = 1 then 56
    when image_width is not null and image_height is not null and image_width::numeric / image_height > 1.8 then 38
    when image_width is not null and image_height is not null and image_width::numeric / image_height < 0.85 then 24
    else 30
  end as desktop_width,
  row_number() over (order by selected_order nulls last, created_at, id) as mobile_order
from public.photos
where selected = true
on conflict (photo_id) do nothing;
