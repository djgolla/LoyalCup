import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, TrendingUp, Loader2 } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import supabase from '../../lib/supabase';

const StarRow = ({ rating, max = 5, size = 18 }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <Star key={i} size={size} className={i < rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'} />
    ))}
  </div>
);

const RatingBar = ({ label, count, total }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-4 text-gray-600 dark:text-gray-400 font-medium">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full bg-amber-500 rounded-full"
        />
      </div>
      <span className="w-8 text-gray-400 text-right">{count}</span>
    </div>
  );
};

export default function Reviews() {
  const { shopId } = useShop();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState(0);

  const loadReviews = useCallback(async () => {
    if (!shopId) return;
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(full_name, avatar_url)')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReviews(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  // stats
  const total = reviews.length;
  const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const dist = [5, 4, 3, 2, 1].map(n => ({ n, count: reviews.filter(r => r.rating === n).length }));
  const filtered = filterRating === 0 ? reviews : reviews.filter(r => r.rating === filterRating);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-1">Reviews</h1>
        <p className="text-gray-500 dark:text-gray-400">{total} review{total !== 1 ? 's' : ''} from your customers</p>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-gray-200 dark:border-neutral-800">
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-5xl font-black text-gray-900 dark:text-white">{avg.toFixed(1)}</p>
              <StarRow rating={Math.round(avg)} />
              <p className="text-xs text-gray-400 mt-1">{total} reviews</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {dist.map(({ n, count }) => (
                <RatingBar key={n} label={n} count={count} total={total} />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-5 border border-amber-200 dark:border-amber-800 flex flex-col justify-center items-center gap-2">
            <TrendingUp className="w-8 h-8 text-amber-600" />
            <p className="text-3xl font-black text-amber-600">{avg.toFixed(1)}</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">Avg Rating</p>
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-gray-200 dark:border-neutral-800 flex flex-col justify-center items-center gap-2">
            <MessageSquare className="w-8 h-8 text-gray-400" />
            <p className="text-3xl font-black text-gray-900 dark:text-white">{total}</p>
            <p className="text-xs text-gray-500 font-semibold">Total Reviews</p>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {[0, 5, 4, 3, 2, 1].map(n => (
          <button
            key={n}
            onClick={() => setFilterRating(n)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border-2 transition
              ${filterRating === n
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800 text-gray-700 dark:text-gray-300 hover:border-amber-500'}`}
          >
            {n === 0 ? 'All' : (
              <>
                {n} <Star size={12} className={filterRating === n ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'} />
              </>
            )}
          </button>
        ))}
      </div>

      {/* Review list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-16 h-16 text-gray-200 dark:text-neutral-700 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No reviews yet</p>
          <p className="text-gray-400 text-sm mt-1">Reviews will appear here after customers order from you</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-gray-200 dark:border-neutral-800"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  {review.profiles?.avatar_url ? (
                    <img src={review.profiles.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 font-bold text-sm">
                      {(review.profiles?.full_name || 'A')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {review.profiles?.full_name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <StarRow rating={review.rating} size={15} />
              </div>
              {review.body && (
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mt-2 pl-12">
                  {review.body}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}