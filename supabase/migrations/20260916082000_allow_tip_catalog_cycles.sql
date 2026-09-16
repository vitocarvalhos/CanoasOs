alter table public.user_daily_tips add column if not exists cycle integer not null default 0 check (cycle >= 0);
alter table public.user_daily_tips drop constraint if exists user_daily_tips_user_id_tip_id_key;
create unique index if not exists user_daily_tips_user_tip_cycle_uidx on public.user_daily_tips (user_id, tip_id, cycle);
