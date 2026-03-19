import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, TrendingUp, AlertCircle, Loader2, User } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import supabase from '../../lib/supabase';

const StarRating = ({ rating, size = 'sm' }) => {
  const sz = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} className={`${sz} ${s <= rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-neutral-600'}`} />
      ))}
    </div>
  );
};

const formatDate = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function Reviews() {
  const { shopId } = useShop();
  const [reviews, setReviews]   = useState([]);
  const [stats, setStats]       = useState({ review_count: 0, avg_rating: null });
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, customer:profiles(full_name, avatar_url)')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);

      const { data: statsData } = await supabase
        .from('shop_review_stats')
        .select('*')
        .eq('shop_id', shopId)
        .maybeSingle();

      if (statsData) setStats(statsData);
    } catch (e) {
      console.error('Reviews load error:', e);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => { load(); }, [load]);

  const ratingDist = [5,4,3,2,1].map(r => ({
    rating: r,
    count: reviews.filter(v => v.rating === r).length,
    pct: reviews.length ? Math.round((reviews.filter(v => v.rating === r).length / reviews.length) * 100) : 0,
  }));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-1">Reviews</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {stats.review_count} review{stats.review_count !== 1 ? 's' : ''} from your customers
        </p>
      </motion.div>

      {/* Stats row */}
      {stats.review_count > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Average */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-100 dark:border-neutral-800 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="text-6xl font-black text-gray-900 dark:text-white">
                {parseFloat(stats.avg_rating || 0).toFixed(1)}
              </div>
              <div>
                <StarRating rating={Math.round(stats.avg_rating || 0)} size="lg" />
                <p className="text-sm text-gray-500 mt-1">{stats.review_count} total reviews</p>
              </div>
            </div>
          </motion.div>

          {/* Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-100 dark:border-neutral-800 shadow-sm"
          >
            <div className="space-y-2">
              {ratingDist.map(({ rating, count, pct }) => (
                <div key={rating} className="flex items-center gap-2 text-sm">
                  <span className="w-3 text-gray-500 text-right">{rating}</span>
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  <div className="flex-1 bg-gray-100 dark:bg-neutral-800 rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-gray-400 text-right text-xs">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <MessageSquare className="w-16 h-16 text-gray-200 dark:text-neutral-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No reviews yet</h3>
          <p className="text-gray-500 text-sm">Reviews from customers will appear here after they complete an order.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {reviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border-2 border-gray-100 dark:border-neutral-800 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {review.customer?.avatar_url ? (
                      <img src={review.customer.avatar_url} className="w-9 h-9 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-amber-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        {review.customer?.full_name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(review.created_at)}</p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}