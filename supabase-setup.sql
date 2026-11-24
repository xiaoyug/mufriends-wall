-- MuFriends 照片墙 · Supabase 建库脚本
-- 在 Supabase Dashboard → SQL Editor 里整段粘贴执行一次即可

-- 1. 照片表
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  nickname text default '',
  message text default '',
  photo_url text not null,
  deleted boolean default false,
  created_at timestamptz default now()
);

-- 2. 行级安全：允许匿名读、匿名写、匿名标记删除（活动场景，配合按 M 管理模式使用）
alter table photos enable row level security;

create policy "anon read" on photos
  for select to anon using (true);

create policy "anon insert" on photos
  for insert to anon with check (true);

create policy "anon mark deleted" on photos
  for update to anon using (true) with check (true);

-- 3. 照片存储桶（公开可读，大屏直接拿 URL 展示）
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "anon read files" on storage.objects
  for select to anon using (bucket_id = 'photos');

create policy "anon upload files" on storage.objects
  for insert to anon with check (bucket_id = 'photos');
