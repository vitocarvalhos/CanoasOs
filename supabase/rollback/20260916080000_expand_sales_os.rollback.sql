-- Rollback manual da expansão. Faça backup antes: remover colunas/tabelas elimina dados novos.
drop index if exists public.activities_user_event_key_uidx;
drop index if exists public.activities_lead_created_idx;
drop index if exists public.activities_user_id_idx;
drop index if exists public.tasks_user_open_due_idx;
drop index if exists public.tasks_lead_id_idx;
drop index if exists public.leads_user_archived_stage_idx;

alter table public.tasks drop column if exists action_type_id;
drop table if exists public.user_daily_tips;
drop table if exists public.daily_tips;
drop table if exists public.catalog_options;

alter table public.activities
  drop column if exists metadata,
  drop column if exists event_key,
  drop column if exists event_type;
alter table public.tasks
  drop column if exists rescheduled_from,
  drop column if exists updated_at;
alter table public.leads
  drop column if exists archive_reason,
  drop column if exists archived_at;

-- Valores adicionados a enums não são removidos automaticamente: isso exigiria recriar o enum
-- e poderia invalidar dados. Eles permanecem inofensivos se o código anterior for restaurado.
