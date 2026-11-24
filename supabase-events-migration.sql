-- 照片墙多活动化 · 迁移脚本（在已暂停项目恢复后执行一次）
-- 在 Supabase Dashboard → SQL Editor 里整段粘贴执行即可

-- 1. 活动表：一个 slug 一场活动，大屏/上传页都按它过滤
create table if not exists public.events (
  slug text primary key,
  name text not null default '',
  date text not null default '',
  slogan text not null default '',
  created_at timestamptz not null default now()
);

-- 2. 行级安全：与 photos 同一级别，匿名可读可写（社区活动工具，无机密数据）
alter table public.events enable row level security;

create policy "events anon read" on public.events
  for select to anon using (true);

create policy "events anon insert" on public.events
  for insert to anon with check (true);

create policy "events anon update" on public.events
  for update to anon using (true) with check (true);

-- 3. 照片表加活动字段，现有照片全部归入首次活动
alter table public.photos
  add column if not exists event text not null default 'mufriends-2026-11-06';

update public.photos
  set event = 'mufriends-2026-11-06'
  where event = '' or event is null;

-- 4. 首次活动建档（已存在则跳过）
insert into public.events (slug, name, date, slogan)
values ('mufriends-2026-11-06', 'MuFriends', '2026-11-06', '下一种生活，由你想象 · Life, as you imagine')
on conflict (slug) do nothing;
