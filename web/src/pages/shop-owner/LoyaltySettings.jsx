// web/src/pages/shop-owner/LoyaltySettings.jsx
// Shop owner loyalty page — driven by /api/v1/loyalty/* (single source of truth).
// SHOP-SPECIFIC ONLY. The shop owner sets every value; points are usable only here.

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Award, TrendingUp, Users, Sparkles, Check,
  Info, RefreshCw, Calculator,
} from "lucide-react";
import { useShop } from "../../context/ShopContext";
import supabase from "../../lib/supabase";
import Loading from "../../components/Loading";
import { apiUrl, parseJsonResponse } from "../../api/client";

// ── authed fetch helper ─────────────────────────────────────────────────────
async function authedFetch(path, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch(apiUrl(path), {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  return parseJsonResponse(res);
}

export default function LoyaltySettings() {
  const { shopId, loading: shopLoading } = useShop();

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [stats, setStats] = useState({ active_members: 0, total_issued: 0, total_redeemed: 0 });

  const [form, setForm] = useState({
    points_per_dollar:      10,
    min_redemption_points:  200,
    points_to_dollar_value: 0.005,
    bonus_active:           false,
    bonus_multiplier:       1.0,
    bonus_description:      "",
  });

  const load = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const [cfg, st] = await Promise.all([
        authedFetch(`/api/v1/loyalty/shop-settings/${shopId}`),
        authedFetch(`/api/v1/loyalty/shop-stats/${shopId}`),
      ]);
      setForm({
        points_per_dollar:      cfg.points_per_dollar,
        min_redemption_points:  cfg.min_redemption_points,
        points_to_dollar_value: cfg.points_to_dollar_value,
        bonus_active:           !!cfg.bonus_active,
        bonus_multiplier:       cfg.bonus_multiplier || 1.0,
        bonus_description:      cfg.bonus_description || "",
      });
      setStats({
        active_members: st.active_members || 0,
        total_issued:   st.total_issued   || 0,
        total_redeemed: st.total_redeemed || 0,
      });
    } catch (e) {
      console.error("Loyalty load failed:", e);
      toast.error(e.message || "Failed to load loyalty settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (shopId) load(); /* eslint-disable-line */ }, [shopId]);

  const handleSave = async (e) => {
    e?.preventDefault?.();
    if (!shopId) return;

    const ppd  = Number(form.points_per_dollar);
    const step = Number(form.min_redemption_points);
    const pv   = Number(form.points_to_dollar_value);

    if (!ppd || !step || !pv) {
      toast.error("Fill in all three values before saving.");
      return;
    }

    try {
      setSaving(true);
      const body = {
        points_per_dollar:      ppd,
        min_redemption_points:  step,
        points_to_dollar_value: pv,
        bonus_active:           !!form.bonus_active,
        bonus_multiplier:       Number(form.bonus_multiplier) || 1.0,
        bonus_description:      form.bonus_description || null,
        is_active:              true,
      };
      const updated = await authedFetch(`/api/v1/loyalty/shop-settings/${shopId}`, {
        method: "PUT",
        body:   JSON.stringify(body),
      });
      setForm({
        points_per_dollar:      updated.points_per_dollar,
        min_redemption_points:  updated.min_redemption_points,
        points_to_dollar_value: updated.points_to_dollar_value,
        bonus_active:           !!updated.bonus_active,
        bonus_multiplier:       updated.bonus_multiplier || 1.0,
        bonus_description:      updated.bonus_description || "",
      });
      toast.success("Loyalty program saved!");
    } catch (e) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ── preview math ──────────────────────────────────────────────────────────
  const effPpd  = Number(form.points_per_dollar)      || 0;
  const effStep = Number(form.min_redemption_points)  || 0;
  const effPV   = Number(form.points_to_dollar_value) || 0;
  const bonusM  = form.bonus_active ? (Number(form.bonus_multiplier) || 1) : 1;
  const pctBack = (effPpd && effPV) ? (effPpd * effPV * 100).toFixed(1) : "—";
  const dollarsPerStep = (effStep * effPV).toFixed(2);

  const sampleSpend = 20;
  const earnedAt$20 = Math.floor(sampleSpend * effPpd * bonusM);

  if (shopLoading || loading) return <Loading />;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-1">Loyalty Program</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure how customers earn and redeem points at your shop.</p>
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-neutral-800 transition" title="Refresh">
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard color="from-amber-500 to-orange-500"   icon={TrendingUp} label="Points Issued"   value={stats.total_issued.toLocaleString()} />
        <StatCard color="from-green-500 to-emerald-600"  icon={Users}      label="Active Members"  value={stats.active_members.toLocaleString()} subtitle="Earned points here" />
        <StatCard color="from-purple-500 to-fuchsia-600" icon={Award}      label="Points Redeemed" value={stats.total_redeemed.toLocaleString()} />
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Configuration */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-600" /> Program Configuration
          </h2>
          <p className="text-sm text-gray-500 mb-5">Three numbers control everything. Points are usable only at your shop.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field
              label="Points per $1 spent"
              hint="Higher = customers earn faster."
              type="number" min="0" step="1"
              value={form.points_per_dollar}
              onChange={v => setForm(f => ({ ...f, points_per_dollar: v }))}
            />
            <Field
              label="Redemption step (pts)"
              hint="Customers redeem in multiples of this. e.g. 200 → 200 / 400 / 600..."
              type="number" min="1" step="1"
              value={form.min_redemption_points}
              onChange={v => setForm(f => ({ ...f, min_redemption_points: v }))}
            />
            <Field
              label="$ value per point"
              hint="e.g. 0.005 → 200 pts = $1 off."
              type="number" min="0.0001" step="0.0001"
              value={form.points_to_dollar_value}
              onChange={v => setForm(f => ({ ...f, points_to_dollar_value: v }))}
            />
          </div>
        </motion.div>

        {/* Live preview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-emerald-900 dark:text-emerald-200">Live Preview</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PreviewStat
              label="Earn rate"
              value={`${effPpd} pts / $1`}
              sub={form.bonus_active && bonusM !== 1 ? `${bonusM}× bonus active` : null}
            />
            <PreviewStat
              label="Redemption step"
              value={`${effStep} pts`}
              sub={`= $${dollarsPerStep} off`}
            />
            <PreviewStat
              label="Effective cashback"
              value={`${pctBack}%`}
              sub={`$20 spent → ${earnedAt$20} pts`}
            />
          </div>
          <div className="mt-4 text-sm text-emerald-900 dark:text-emerald-200 bg-white/60 dark:bg-black/20 rounded-xl p-3">
            <b>Example:</b> A customer spends <b>$20</b> → earns <b>{earnedAt$20} pts</b>.
            Once they hit <b>{effStep} pts</b>, they can redeem <b>${dollarsPerStep}</b> off any order at your shop.
          </div>
        </motion.div>

        {/* Bonus campaign */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 border-gray-200 dark:border-neutral-800 shadow-lg">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Bonus Promotion</h2>
              {form.bonus_active && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">LIVE</span>
              )}
            </div>
            <button type="button" onClick={() => setForm(f => ({ ...f, bonus_active: !f.bonus_active }))}
              className={`relative w-14 h-7 rounded-full transition-colors ${form.bonus_active ? "bg-amber-500" : "bg-gray-300 dark:bg-neutral-700"}`}>
              <div className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${form.bonus_active ? "translate-x-7" : "translate-x-0"}`} />
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Temporarily multiply your earning rate (e.g. 2× points weekend). Stacks on top of your base rate.
          </p>

          {form.bonus_active && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Multiplier"
                hint="2.0 = double points · 1.5 = +50% points"
                type="number" min="1" max="10" step="0.5"
                value={form.bonus_multiplier}
                onChange={v => setForm(f => ({ ...f, bonus_multiplier: v }))}
              />
              <Field
                label="Campaign description (optional)"
                hint="Shown to customers at checkout."
                type="text"
                placeholder="Double points weekend!"
                value={form.bonus_description}
                onChange={v => setForm(f => ({ ...f, bonus_description: v }))}
              />
            </div>
          )}
        </motion.div>

        {/* Save bar */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <button type="button" onClick={load}
            className="px-6 py-3 border-2 border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-800 transition font-semibold">
            Reset
          </button>
          <motion.button type="submit" disabled={saving}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition disabled:opacity-60">
            {saving ? "Saving..." : <><Check className="w-5 h-5" /> Save Loyalty Settings</>}
          </motion.button>
        </div>
      </form>
    </div>
  );
}

// ── Subcomponents ────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, subtitle, color }) {
  return (
    <motion.div whileHover={{ y: -3 }}
      className={`bg-gradient-to-br ${color} p-5 rounded-2xl text-white shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">{label}</p>
          <p className="text-3xl font-black mt-1">{value}</p>
          {subtitle && <p className="text-white/70 text-xs mt-1">{subtitle}</p>}
        </div>
        <Icon className="w-10 h-10 text-white/40" />
      </div>
    </motion.div>
  );
}

function Field({ label, hint, value, onChange, ...rest }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <input {...rest}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-amber-500 transition" />
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function PreviewStat({ label, value, sub }) {
  return (
    <div className="bg-white/70 dark:bg-black/20 rounded-xl p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">{label}</p>
      <p className="text-2xl font-black text-emerald-900 dark:text-emerald-100 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">{sub}</p>}
    </div>
  );
}
