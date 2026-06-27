-- Atomic daily usage increment to prevent race conditions
create or replace function increment_daily_usage(p_user_id uuid)
returns table (sessions_used int)
language plpgsql
security definer
as $$
begin
  insert into daily_usage (user_id, date, sessions_used)
  values (p_user_id, current_date, 1)
  on conflict (user_id, date)
  do update set sessions_used = daily_usage.sessions_used + 1
  returning daily_usage.sessions_used;
end;
$$;
