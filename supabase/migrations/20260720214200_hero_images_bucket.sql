-- Hero Images Storage Bucket
-- RLS: public read, service_role write

insert into storage.buckets (id, name, public)
values ('hero-images', 'hero-images', true)
on conflict (id) do nothing;

-- Policy: anyone can read hero images
create policy "Hero images are public"
  on storage.objects
  for select
  to anon
  using (bucket_id = 'hero-images');

-- Policy: service_role can upload
create policy "Service role can upload hero images"
  on storage.objects
  for insert
  to service_role
  with check (bucket_id = 'hero-images');

-- Policy: service_role can delete
create policy "Service role can delete hero images"
  on storage.objects
  for delete
  to service_role
  using (bucket_id = 'hero-images');
