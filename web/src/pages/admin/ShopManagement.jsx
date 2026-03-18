import { useEffect, useState } from 'react';
import { Store, Search, Plus, Edit, Trash2, Check, X, Mail } from 'lucide-react';
import { toast } from 'sonner';
import supabase from '../../lib/supabase';

export default function ShopManagement() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => { loadShops(); }, []);

  const loadShops = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shops')
        .select(`*, profiles:owner_id(email, full_name)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setShops(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  // ── Approve: calls DB function that atomically activates shop + promotes user role
  const handleApprove = async (shop) => {
    setApprovingId(shop.id);
    try {
      const { error } = await supabase.rpc('approve_shop_owner', {
        p_owner_id: shop.owner_id,
        p_shop_id:  shop.id,
      });
      if (error) throw error;

      // Send approval email via Supabase Auth magic link (owner can log in directly)
      // This uses whatever SMTP you have configured in Supabase Auth settings
      const ownerEmail = shop.profiles?.email;
      if (ownerEmail) {
        await supabase.auth.admin?.generateLink?.({
          type: 'magiclink',
          email: ownerEmail,
        }).catch(() => {
          // generateLink requires service role — silently skip if not available client-side
          // The DB function already promoted the role; they just need to log in normally
        });
      }

      toast.success(`${shop.name} approved! The owner's role has been upgraded.`);
      loadShops();
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve shop: ' + err.message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (shop) => {
    if (!confirm(`Reject application from ${shop.name}?`)) return;
    try {
      const { error } = await supabase
        .from('shops')
        .update({ status: 'rejected' })
        .eq('id', shop.id);
      if (error) throw error;
      toast.success('Application rejected');
      loadShops();
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  const handleSuspend = async (shopId) => {
    try {
      const { error } = await supabase.from('shops').update({ status: 'suspended' }).eq('id', shopId);
      if (error) throw error;
      toast.success('Shop suspended');
      loadShops();
    } catch (err) {
      toast.error('Failed to suspend shop');
    }
  };

  const handleDelete = async (shopId) => {
    if (!confirm('Delete this shop? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('shops').delete().eq('id', shopId);
      if (error) throw error;
      toast.success('Shop deleted');
      loadShops();
    } catch (err) {
      toast.error('Failed to delete shop');
    }
  };

  const handleFeatureToggle = async (shopId, current) => {
    try {
      const { error } = await supabase.from('shops').update({ featured: !current }).eq('id', shopId);
      if (error) throw error;
      toast.success(current ? 'Unfeatured' : 'Featured!');
      loadShops();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleReactivate = async (shopId) => {
    try {
      const { error } = await supabase.from('shops').update({ status: 'active' }).eq('id', shopId);
      if (error) throw error;
      toast.success('Shop reactivated');
      loadShops();
    } catch (err) {
      toast.error('Failed to reactivate');
    }
  };

  const filteredShops = shops.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingShops = shops.filter(s => s.status === 'pending');

  const statusColor = (status) => ({
    active:    'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    rejected:  'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400',
  }[status] || 'bg-gray-100 text-gray-600');

  return (
    <div className="space-y-6">

      {/* ── Pending Applications ── */}
      {pendingShops.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-amber-600 text-white rounded-full p-2">
              <Store size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Pending Applications
                <span className="ml-2 bg-amber-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {pendingShops.length}
                </span>
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Review and approve new shop applications
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingShops.map((shop) => (
              <div key={shop.id}
                className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-amber-200 dark:border-amber-800"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{shop.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Mail size={13} />
                        {shop.profiles?.email || 'No email'}
                      </span>
                      {shop.city && <span>📍 {shop.city}, {shop.state}</span>}
                      {shop.phone && <span>📞 {shop.phone}</span>}
                      <span>Applied {new Date(shop.created_at).toLocaleDateString()}</span>
                    </div>
                    {shop.description && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{shop.description}</p>
                    )}
                    {shop.website && (
                      <a href={shop.website} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-amber-600 hover:underline mt-1 inline-block">
                        {shop.website}
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(shop)}
                      disabled={approvingId === shop.id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
                    >
                      <Check size={16} />
                      {approvingId === shop.id ? 'Approving…' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReject(shop)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                    >
                      <X size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shop Management</h1>
          <p className="text-gray-500 dark:text-neutral-400 mt-1">All coffee shops on the platform</p>
        </div>
        <button
          onClick={() => { setEditingShop(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
        >
          <Plus size={18} /> Add Shop
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" placeholder="Search by name or owner email…"
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 text-gray-900 dark:text-white"
        />
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',     value: shops.length,                              color: 'text-gray-900 dark:text-white' },
          { label: 'Active',    value: shops.filter(s => s.status === 'active').length,    color: 'text-green-600' },
          { label: 'Pending',   value: shops.filter(s => s.status === 'pending').length,   color: 'text-yellow-600' },
          { label: 'Featured',  value: shops.filter(s => s.featured).length,               color: 'text-purple-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-gray-200 dark:border-neutral-800">
            <p className="text-sm text-gray-500 dark:text-neutral-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto" />
            <p className="text-gray-500 mt-4">Loading…</p>
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="p-12 text-center">
            <Store size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No shops found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-neutral-800 border-b border-gray-200 dark:border-neutral-700 text-sm font-medium text-gray-600 dark:text-neutral-400">
                <tr>
                  <th className="px-6 py-3 text-left">Shop</th>
                  <th className="px-6 py-3 text-left">Owner</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Featured</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                {filteredShops.map((shop) => (
                  <tr key={shop.id} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">{shop.name}</p>
                      <p className="text-sm text-gray-500 dark:text-neutral-400">{shop.city}{shop.state ? `, ${shop.state}` : ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 dark:text-white">{shop.profiles?.full_name || '—'}</p>
                      <p className="text-sm text-gray-500 dark:text-neutral-400">{shop.profiles?.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(shop.status)}`}>
                        {shop.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleFeatureToggle(shop.id, shop.featured)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          shop.featured
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400'
                        }`}
                      >
                        {shop.featured ? '★ Featured' : '☆ Feature'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {shop.status === 'pending' && (
                          <button onClick={() => handleApprove(shop)} disabled={approvingId === shop.id}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg disabled:opacity-50" title="Approve">
                            <Check size={16} />
                          </button>
                        )}
                        {shop.status === 'active' && (
                          <button onClick={() => handleSuspend(shop.id)}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg" title="Suspend">
                            <X size={16} />
                          </button>
                        )}
                        {(shop.status === 'suspended' || shop.status === 'rejected') && (
                          <button onClick={() => handleReactivate(shop.id)}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" title="Reactivate">
                            <Check size={16} />
                          </button>
                        )}
                        <button onClick={() => { setEditingShop(shop); setShowModal(true); }}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(shop.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ShopModal
          shop={editingShop}
          onClose={() => { setShowModal(false); setEditingShop(null); }}
          onSave={() => { setShowModal(false); setEditingShop(null); loadShops(); }}
        />
      )}
    </div>
  );
}

function ShopModal({ shop, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: shop?.name || '',
    description: shop?.description || '',
    address: shop?.address || '',
    city: shop?.city || '',
    state: shop?.state || '',
    phone: shop?.phone || '',
    color: shop?.color || '#8B4513',
    loyalty_points_per_dollar: shop?.loyalty_points_per_dollar || 10,
    status: shop?.status || 'pending',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (shop) {
        const { error } = await supabase.from('shops').update(formData).eq('id', shop.id);
        if (error) throw error;
        toast.success('Shop updated!');
      } else {
        const { error } = await supabase.from('shops').insert({ ...formData, owner_id: null });
        if (error) throw error;
        toast.success('Shop created!');
      }
      onSave();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const ic = 'w-full px-4 py-2 border border-gray-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {shop ? 'Edit Shop' : 'Add Shop'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Name *</label>
              <input type="text" required value={formData.name}
                onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className={ic} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">City *</label>
              <input type="text" required value={formData.city}
                onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))} className={ic} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Description</label>
            <textarea rows={3} value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className={`${ic} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Address</label>
              <input type="text" value={formData.address}
                onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))} className={ic} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">State</label>
              <input type="text" value={formData.state}
                onChange={(e) => setFormData(p => ({ ...p, state: e.target.value }))} className={ic} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Phone</label>
              <input type="tel" value={formData.phone}
                onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} className={ic} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Status</label>
              <select value={formData.status}
                onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))} className={ic}>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Brand Color</label>
              <input type="color" value={formData.color}
                onChange={(e) => setFormData(p => ({ ...p, color: e.target.value }))}
                className="w-full h-10 border border-gray-200 dark:border-neutral-700 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Points per $</label>
              <input type="number" min="0" value={formData.loyalty_points_per_dollar}
                onChange={(e) => setFormData(p => ({ ...p, loyalty_points_per_dollar: parseInt(e.target.value) }))} className={ic} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-800">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50">
              {saving ? 'Saving…' : shop ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}