# Replacing Mirage endpoints with Supabase (examples)

This file shows short examples for replacing existing fetch('/api/...') calls with Supabase client calls.

Prereqs:
- Add `web/src/lib/supabaseClient.js` (we created it)
- Set environment variables in your Codespace or local dev:
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY

Examples

1) Fetch menu (previously: fetch('/api/menu'))
```js
import supabase from '../lib/supabaseClient';

async function loadMenu(shopId) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('shop_id', shopId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data;
}
```

2) Fetch orders for a shop (previously: fetch('/api/orders'))
```js
async function loadOrders(shopId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

3) Get dashboard metrics (simple example)
```js
// totals are often computed server-side; for quick UI values you can run aggregates
const { count: ordersCount } = await supabase
  .from('orders')
  .select('*', { count: 'exact' })
  .eq('shop_id', shopId);
```

Tips:
- Use Supabase `profiles` table integrated with Auth for user info.
- Store item customizations in JSONB (`customizations`) and render dynamically in the UI.
- For realtime updates (new incoming orders), use:
```js
supabase
  .channel('public:orders')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: 'shop_id=eq.' + shopId }, payload => {
    // payload.new contains new order row
  })
  .subscribe();
```

Then paste this instruction message (exact) right after the files in Copilot Chat:

"Create the two files above exactly at these paths:

supabase/migrations/001_init.sql
web/src/api/README-Supabase.md
If any of those files already exist, back them up by copying to filename.bak and print a warning. Then run:

cd web && npm install @supabase/supabase-js && cd ..
git add web/src/lib web/src/api supabase/migrations
git commit -m 'add supabase client and initial migration'
git push origin HEAD
Finally print the git log (last 3 commits) and list the new files with:

git --no-pager log -n 3 --pretty=oneline
ls -R web/src supabase/migrations
If push fails due to credentials or network, show the error and stop. When finished, echo: done: added supabase client, migration, installed package, committed and pushed"

If you want Copilot to proceed immediately, respond in the Copilot chat with: go ahead

If you want me to double-check anything before you hit "go ahead", tell me and I’ll verify.
