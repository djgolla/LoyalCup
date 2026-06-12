import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag, Plus, Trash2, ToggleLeft, ToggleRight,
  Calendar, Percent, DollarSign, AlertCircle, Loader2, X, Edit3,
} from "lucide-react";
import { useShop } from "../../context/ShopContext";
import { toast } from "sonner";
import { API_ORIGIN } from "../../api/client";

const API = API_ORIGIN || "http://localhost:8000";

async function authFetch(url, opts = {}) {
  const { default: supabase } = await import("../../lib/supabase");
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`);
  return data;
}

const EMPTY_FORM = {
  title: "",
  description: "",
  discount_type: "percent",
  discount_value: "",
  expires_at: "",
  is_active: true,
};

const formatExpiry = (iso) => {
  if (!iso) return "No expiry";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const isExpired = (iso) => iso && new Date(iso) < new Date();

function OfferForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (form.discount_value && isNaN(parseFloat(form.discount_value))) { toast.error("Invalid discount value"); return; }
    onSave({
      ...form,
      discount_value: form.discount_value ? parseFloat(form.discount_value) : null,
      expires_at:     form.expires_at ? new Date(form.expires_at).toISOString() : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Offer Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => set("title", e.target.value)}
          placeholder="e.g. Happy Hour — 20% off all drinks"
          maxLength={80}
          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition text-sm"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={e => set("description", e.target.value)}
          placeholder="Any extra details customers should know..."
          rows={2}
          maxLength={300}
          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 transition text-sm resize-none"
        />
      </div>

      {/* Discount */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Discount Type</label>
          <select
            value={form.discount_type}
            onChange={e => set("discount_type", e.target.value)}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 text-sm"
          >
            <option value="">None (display only)</option>
            <option value="percent">Percentage off</option>
            <option value="flat">Flat $ amount off</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
            {form.discount_type === "percent" ? "% Off" : form.discount_type === "flat" ? "$ Off" : "Value"}
          </label>
          <input
            type="number"
            value={form.discount_value}
            onChange={e => set("discount_value", e.target.value)}
            placeholder={form.discount_type === "percent" ? "20" : "5.00"}
            min={0}
            step={form.discount_type === "percent" ? 1 : 0.01}
            disabled={!form.discount_type}
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 text-sm disabled:opacity-40"
          />
        </div>
      </div>

      {/* Expiry */}
      <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
          Expires At <span className="font-normal text-gray-400">(leave blank = no expiry)</span>
        </label>
        <input
          type="datetime-local"
          value={form.expires_at}
          onChange={e => set("expires_at", e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-neutral-800 border-2 border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-500 text-sm"
        />
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-neutral-800 rounded-xl">
        <button
          type="button"
          onClick={() => set("is_active", !form.is_active)}
          className="text-gray-400 hover:text-amber-500 transition"
        >
          {form.is_active
            ? <ToggleRight className="w-8 h-8 text-green-500" />
            : <ToggleLeft className="w-8 h-8 text-gray-400" />
          }
        </button>
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
            {form.is_active ? "Active — shown to customers" : "Inactive — hidden from customers"}
          </p>
          <p className="text-xs text-gray-500">Toggle to show or hide this offer in the app.</p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-xl py-2.5 font-bold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {initial ? "Save Changes" : "Create Offer"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 border border-gray-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function Offers() {
  const { shopId } = useShop();
  const [offers,    setOffers]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [showForm,  setShowForm]  = useState(false);
  const [editOffer, setEditOffer] = useState(null);

  const loadOffers = async () => {
    if (!shopId) return;
    try {
      const data = await authFetch(`${API}/api/v1/pos/offers?shop_id=${shopId}`);
      setOffers(data.offers || []);
    } catch (e) {
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOffers(); }, [shopId]);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const data = await authFetch(`${API}/api/v1/pos/offers`, {
        method: "POST",
        body: JSON.stringify({ ...form, shop_id: shopId }),
      });
      setOffers(p => [data.offer, ...p]);
      setShowForm(false);
      toast.success("Offer created! It's now visible to customers.");
    } catch (e) {
      toast.error(e.message || "Failed to create offer");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (form) => {
    if (!editOffer) return;
    setSaving(true);
    try {
      const data = await authFetch(`${API}/api/v1/pos/offers/${editOffer.id}`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      setOffers(p => p.map(o => o.id === editOffer.id ? data.offer : o));
      setEditOffer(null);
      toast.success("Offer updated!");
    } catch (e) {
      toast.error(e.message || "Failed to update offer");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (offer) => {
    try {
      const data = await authFetch(`${API}/api/v1/pos/offers/${offer.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !offer.is_active }),
      });
      setOffers(p => p.map(o => o.id === offer.id ? data.offer : o));
      toast.success(data.offer.is_active ? "Offer activated" : "Offer hidden");
    } catch (e) {
      toast.error("Failed to update offer");
    }
  };

  const handleDelete = async (offer) => {
    if (!window.confirm(`Delete "${offer.title}"? This cannot be undone.`)) return;
    try {
      await authFetch(`${API}/api/v1/pos/offers/${offer.id}`, { method: "DELETE" });
      setOffers(p => p.filter(o => o.id !== offer.id));
      toast.success("Offer deleted");
    } catch (e) {
      toast.error("Failed to delete offer");
    }
  };

  const activeCount = offers.filter(o => o.is_active && !isExpired(o.expires_at)).length;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-1">Offers</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {activeCount > 0
              ? <span className="text-green-600 font-semibold">{activeCount} active offer{activeCount !== 1 ? "s" : ""} visible to customers</span>
              : "No active offers — create one to boost sales"
            }
          </p>
        </div>
        {!showForm && !editOffer && (
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition"
          >
            <Plus className="w-4 h-4" />
            New Offer
          </motion.button>
        )}
      </motion.div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-amber-700 dark:text-amber-400">
          Active offers appear on your shop card and shop menu in the mobile app. Discount amounts are <strong>displayed only</strong> — apply them manually at the Square terminal or build promo codes into your Square catalog.
        </p>
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-amber-200 dark:border-amber-800 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Offer</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <OfferForm onSave={handleCreate} onCancel={() => setShowForm(false)} loading={saving} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit form */}
      <AnimatePresence>
        {editOffer && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-blue-200 dark:border-blue-800 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Offer</h2>
              <button onClick={() => setEditOffer(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <OfferForm
              initial={{
                title:          editOffer.title,
                description:    editOffer.description || "",
                discount_type:  editOffer.discount_type || "",
                discount_value: editOffer.discount_value || "",
                expires_at:     editOffer.expires_at ? new Date(editOffer.expires_at).toISOString().slice(0,16) : "",
                is_active:      editOffer.is_active,
              }}
              onSave={handleUpdate}
              onCancel={() => setEditOffer(null)}
              loading={saving}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offer list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      ) : offers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-gray-200 dark:border-neutral-700"
        >
          <Tag className="w-12 h-12 text-gray-200 dark:text-neutral-700 mx-auto mb-3" />
          <p className="text-lg font-bold text-gray-700 dark:text-gray-300">No offers yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Create your first offer to show it in the app</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold text-sm hover:bg-gray-800 transition"
          >
            + Create Offer
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer, i) => {
            const expired = isExpired(offer.expires_at);
            const visible = offer.is_active && !expired;
            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`bg-white dark:bg-neutral-900 rounded-2xl border-2 p-5 transition ${
                  visible
                    ? "border-green-200 dark:border-green-800"
                    : "border-gray-200 dark:border-neutral-800 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-gray-900 dark:text-white text-base">{offer.title}</h3>
                      {visible && (
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
                          Live
                        </span>
                      )}
                      {expired && (
                        <span className="bg-red-100 dark:bg-red-900/20 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                          Expired
                        </span>
                      )}
                      {!offer.is_active && !expired && (
                        <span className="bg-gray-100 dark:bg-neutral-800 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">
                          Hidden
                        </span>
                      )}
                    </div>
                    {offer.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{offer.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      {offer.discount_type && offer.discount_value && (
                        <span className="flex items-center gap-1 font-semibold text-amber-600">
                          {offer.discount_type === "percent"
                            ? <><Percent className="w-3 h-3" />{offer.discount_value}% off</>
                            : <><DollarSign className="w-3 h-3" />${offer.discount_value} off</>
                          }
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatExpiry(offer.expires_at)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggle(offer)}
                      title={offer.is_active ? "Deactivate" : "Activate"}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                    >
                      {offer.is_active
                        ? <ToggleRight className="w-5 h-5 text-green-500" />
                        : <ToggleLeft className="w-5 h-5 text-gray-400" />
                      }
                    </button>
                    <button
                      onClick={() => { setEditOffer(offer); setShowForm(false); }}
                      title="Edit"
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                    >
                      <Edit3 className="w-4 h-4 text-gray-400 hover:text-blue-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(offer)}
                      title="Delete"
                      className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
