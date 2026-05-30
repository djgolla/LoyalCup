/**
 * useFavorites — reads/writes customer_favorites in Supabase.
 * Exposes: favoriteIds (Set), isFavorite(shopId), toggle(shop), loading
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading]         = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('customer_favorites')
        .select('shop_id')
        .eq('customer_id', user.id);
      if (error) throw error;
      setFavoriteIds(new Set((data || []).map(r => r.shop_id)));
    } catch (e) {
      console.error('[useFavorites] load error:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const isFavorite = useCallback(
    (shopId) => favoriteIds.has(shopId),
    [favoriteIds]
  );

  const toggle = useCallback(async (shopId) => {
    if (!user?.id || !shopId) return;

    const alreadyFav = favoriteIds.has(shopId);

    // Optimistic update
    setFavoriteIds(prev => {
      const next = new Set(prev);
      alreadyFav ? next.delete(shopId) : next.add(shopId);
      return next;
    });

    try {
      if (alreadyFav) {
        const { error } = await supabase
          .from('customer_favorites')
          .delete()
          .eq('customer_id', user.id)
          .eq('shop_id', shopId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('customer_favorites')
          .insert({ customer_id: user.id, shop_id: shopId });
        if (error) throw error;
      }
    } catch (e) {
      console.error('[useFavorites] toggle error:', e);
      // Roll back optimistic update on failure
      setFavoriteIds(prev => {
        const next = new Set(prev);
        alreadyFav ? next.add(shopId) : next.delete(shopId);
        return next;
      });
    }
  }, [user?.id, favoriteIds]);

  return { favoriteIds, isFavorite, toggle, loading, reload: load };
}