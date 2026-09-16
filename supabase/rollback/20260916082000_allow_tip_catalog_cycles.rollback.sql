drop index if exists public.user_daily_tips_user_tip_cycle_uidx;
delete from public.user_daily_tips a using public.user_daily_tips b where a.ctid < b.ctid and a.user_id = b.user_id and a.tip_id = b.tip_id;
alter table public.user_daily_tips add constraint user_daily_tips_user_id_tip_id_key unique (user_id, tip_id);
alter table public.user_daily_tips drop column if exists cycle;
