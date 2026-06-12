/**
 * useFavorites — reads/writes favorites through FastAPI.
 * Exposes: favoriteIds (Set), isFavorite(shopId), toggle(shop), loading
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loading, setLoading]         = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const data = await apiClient.get('/api/v1/users/favorites');
      setFavoriteIds(new Set((data.favorites || []).map(r => r.shop_id)));
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
        await apiClient.delete(`/api/v1/users/favorites/${shopId}`);
      } else {
        await apiClient.post('/api/v1/users/favorites', { shop_id: shopId });
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
