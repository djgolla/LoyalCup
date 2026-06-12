-- ============================================================
-- LOYALCUP SECURITY HARDENING
--
-- The web and mobile clients use Supabase Auth only. All application data
-- access goes through the FastAPI backend with the service_role key.
-- service_role bypasses RLS, so these revokes only affect direct anon and
-- authenticated PostgREST/Storage table access from public clients.
-- ============================================================

do $$
declare
  table_name text;
  table_names text[] := array[
    'profiles',
    'shops',
    'categories',
    'menu_categories',
    'menu_items',
    'modifier_groups',
    'modifier_options',
    'menu_modifiers',
    'customization_templates',
    'shop_offers',
    'orders',
    'order_items',
    'order_timing_data',
    'prep_time_predictions',
    'item_complexity',
    'reviews',
    'shop_reviews',
    'customer_favorites',
    'user_favorites',
    'customer_shop_points',
    'points_transactions',
    'shop_loyalty_settings',
    'contact_messages',
    'pos_connections',
    'shop_api_keys'
  ];
begin
  foreach table_name in array table_names loop
    if to_regclass('public.' || table_name) is not null then
      execute format('revoke all privileges on table public.%I from anon, authenticated', table_name);
      execute format('alter table public.%I enable row level security', table_name);
      execute format('drop policy if exists client_direct_access_denied on public.%I', table_name);
      execute format(
        'create policy client_direct_access_denied on public.%I for all to anon, authenticated using (false) with check (false)',
        table_name
      );
    end if;
  end loop;
end $$;

-- Remove legacy self-approval functions. Shop/application approval now lives
-- behind backend endpoints that use DB role checks.
drop function if exists public.approve_shop_owner(uuid);
drop function if exists public.approve_shop_owner(text);

-- Public images remain readable, but browser/mobile uploads now go through
-- authenticated backend upload endpoints.
drop policy if exists "Authenticated users can upload images" on storage.objects;
drop policy if exists "Users can update their shop images" on storage.objects;
drop policy if exists "Users can delete their own shop images" on storage.objects;
drop policy if exists "Public read access for shop images" on storage.objects;

create policy "Public read access for shop images"
on storage.objects
for select
using (bucket_id = 'shop-images');
