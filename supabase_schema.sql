-- Hong Kong Weather & Outfit — wardrobe closet schema (no login: single shared closet)
-- Paste this into the Supabase SQL Editor (your project → SQL Editor → New query) and run it.
-- Safe to re-run: drops and recreates the table, so any earlier version is replaced.

create extension if not exists pgcrypto;

drop table if exists public.wardrobe_items;

create table public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('shirt', 'trousers', 'jacket', 'shoes', 'scarf', 'accessory')),
  color_hex text not null,
  formality text not null check (formality in ('casual', 'business_casual', 'formal')),
  sleeve_length text check (sleeve_length in ('short', 'long')),
  warmth_level int not null check (warmth_level between 1 and 5),
  created_at timestamptz not null default now()
);

-- RLS is enabled with permissive policies (rather than left disabled) so the table
-- doesn't trip Supabase's "RLS disabled" warning — functionally this is a fully
-- public read/write table, appropriate for a single-user personal app with no login.
alter table public.wardrobe_items enable row level security;

create policy "Public can view wardrobe items"
  on public.wardrobe_items for select
  using (true);

create policy "Public can insert wardrobe items"
  on public.wardrobe_items for insert
  with check (true);

create policy "Public can update wardrobe items"
  on public.wardrobe_items for update
  using (true);

create policy "Public can delete wardrobe items"
  on public.wardrobe_items for delete
  using (true);
