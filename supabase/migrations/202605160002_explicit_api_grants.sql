grant select on public.photos to anon, authenticated;
grant select on public.journal_entries to anon, authenticated;
grant select on public.collections to anon, authenticated;
grant select on public.photo_collections to anon, authenticated;

grant insert, update, delete on public.photos to authenticated;
grant insert, update, delete on public.journal_entries to authenticated;
grant insert, update, delete on public.collections to authenticated;
grant insert, update, delete on public.photo_collections to authenticated;
