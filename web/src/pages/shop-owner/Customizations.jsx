import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp,
  Layers, GripVertical, Zap, Sparkles, Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { useShop } from '../../context/ShopContext';
import supabase from '../../lib/supabase';

// ─── Option Row ───────────────────────────────────────────────────────────────
function OptionRow({ option, onUpdate, onDelete }) {
  return (
    <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-neutral-800 rounded-xl group">
      <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
      <input
        className="flex-1 bg-transparent text-sm font-medium text-gray-900 dark:text-white focus:outline-none min-w-0"
        value={option.name}
        onChange={e => onUpdate({ ...option, name: e.target.value })}
        placeholder="Option name"
      />
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-xs text-gray-400 font-semibold">+$</span>
        <input
          type="number" step="0.01" min="0"
          className="w-20 bg-white dark:bg-neutral-700 border border-gray-200 dark:border-neutral-600 text-sm font-semibold text-green-600 focus:outline-none text-right rounded-lg px-2 py-1"
          value={option.price_adjustment ?? 0}
          onChange={e => onUpdate({ ...option, price_adjustment: parseFloat(e.target.value) || 0 })}
        />
      </div>
      <button type="button" onClick={onDelete}
        className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Group Card ───────────────────────────────────────────────────────────────
function GroupCard({ group, onSave, onDelete, delay }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(group);
  const [saving, setSaving] = useState(false);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionPrice, setNewOptionPrice] = useState(0);

  const startEdit = () => { setDraft({ ...group }); setEditing(true); setExpanded(true); };

  const addOption = () => {
    if (!newOptionName.trim()) return;
    setDraft(d => ({
      ...d,
      options: [...(d.options || []), { id: `new-${Date.now()}`, name: newOptionName.trim(), price_adjustment: newOptionPrice, is_active: true }],
    }));
    setNewOptionName('');
    setNewOptionPrice(0);
  };

  const updateOption = (idx, updated) => setDraft(d => { const opts = [...(d.options || [])]; opts[idx] = updated; return { ...d, options: opts }; });
  const removeOption = (idx) => setDraft(d => ({ ...d, options: (d.options || []).filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    if (!draft.name?.trim()) { toast.error('Group name is required'); return; }
    if (!draft.options?.length) { toast.error('Add at least one option'); return; }
    setSaving(true);
    try { await onSave(draft); setEditing(false); } finally { setSaving(false); }
  };

  const isSynced = !!group.pos_source;
  const displayOptions = editing ? draft.options : group.options;

  const selectionType = draft.max_selections === 1 ? 'single' : draft.max_selections === null ? 'unlimited' : 'limited';

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25, delay }}
      whileHover={!editing ? { scale: 1.003 } : {}}
      className="bg-white dark:bg-neutral-900 rounded-2xl border-2 border-gray-200 dark:border-neutral-800 hover:border-amber-400 shadow-lg hover:shadow-xl transition-all overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-4 p-5 cursor-pointer select-none"
        onClick={() => !editing && setExpanded(e => !e)}>
        <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg shrink-0">
          <Layers className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              className="w-full text-lg font-bold bg-gray-50 dark:bg-neutral-800 border-2 border-amber-400 rounded-xl px-3 py-1.5 focus:outline-none"
              value={draft.name}
              onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-bold text-gray-900 dark:text-white">{group.name}</span>
              {isSynced && (
                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3" />{group.pos_source}
                </span>
              )}
            </div>
          )}

          {editing ? (
            <div className="flex items-center flex-wrap gap-4 mt-2.5" onClick={e => e.stopPropagation()}>
              {/* Selection type */}
              <label className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 font-medium">Type:</span>
                <select
                  className="text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg px-2 py-1 focus:outline-none"
                  value={selectionType}
                  onChange={e => {
                    const v = e.target.value;
                    setDraft(d => ({
                      ...d,
                      max_selections: v === 'single' ? 1 : v === 'unlimited' ? null : 2,
                      min_selections: v === 'single' ? 1 : 0,
                    }));
                  }}
                >
                  <option value="single">Single select (pick 1)</option>
                  <option value="limited">Limited (pick up to N)</option>
                  <option value="unlimited">Multi select (pick any)</option>
                </select>
              </label>

              {/* Max if limited */}
              {selectionType === 'limited' && (
                <label className="flex items-center gap-2 text-sm">
                  <Hash className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-500 font-medium">Max:</span>
                  <input type="number" min="2" max="20"
                    className="w-16 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg px-2 py-1 focus:outline-none"
                    value={draft.max_selections ?? 2}
                    onChange={e => setDraft(d => ({ ...d, max_selections: parseInt(e.target.value) || 2 }))}
                  />
                </label>
              )}

              {/* Required */}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <span className="text-gray-500 font-medium">Required:</span>
                <button type="button"
                  onClick={() => setDraft(d => ({ ...d, min_selections: d.min_selections > 0 ? 0 : 1 }))}
                  className={`w-10 h-5 rounded-full transition-colors ${draft.min_selections > 0 ? 'bg-amber-500' : 'bg-gray-300 dark:bg-neutral-600'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow mx-0.5 transition-transform ${draft.min_selections > 0 ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </label>

              {/* Min count (if required + multi) */}
              {draft.min_selections > 0 && selectionType !== 'single' && (
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 font-medium">Min:</span>
                  <input type="number" min="1" max={draft.max_selections ?? 20}
                    className="w-16 text-sm bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg px-2 py-1 focus:outline-none"
                    value={draft.min_selections ?? 1}
                    onChange={e => setDraft(d => ({ ...d, min_selections: parseInt(e.target.value) || 1 }))}
                  />
                </label>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-0.5">
              {group.max_selections === 1
                ? 'Single select'
                : group.max_selections === null
                ? 'Pick any number'
                : `Pick up to ${group.max_selections}`}
              {' · '}{group.min_selections > 0 ? `Required (min ${group.min_selections})` : 'Optional'}
              {' · '}{group.options?.length || 0} option{group.options?.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          {!editing && (
            <>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={startEdit} className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition">
                <Pencil className="w-4 h-4" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={onDelete} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition">
                <Trash2 className="w-4 h-4" />
              </motion.button>
              <button onClick={() => setExpanded(e => !e)} className="p-2 text-gray-400 hover:text-gray-600 transition">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Options */}
      <AnimatePresence>
        {(expanded || editing) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="border-t border-gray-100 dark:border-neutral-800 px-5 pb-5 pt-4 space-y-2">
            {displayOptions?.map((opt, idx) =>
              editing ? (
                <OptionRow key={opt.id || idx} option={opt}
                  onUpdate={u => updateOption(idx, u)} onDelete={() => removeOption(idx)} />
              ) : (
                <div key={opt.id || idx} className="flex justify-between text-sm p-2.5 bg-gray-50 dark:bg-neutral-800 rounded-xl">
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{opt.name}</span>
                  <span className="font-bold text-green-600">{opt.price_adjustment > 0 ? `+$${parseFloat(opt.price_adjustment).toFixed(2)}` : 'Free'}</span>
                </div>
              )
            )}

            {editing && (
              <>
                <div className="flex gap-2 pt-1">
                  <input
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-800 border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-xl focus:outline-none focus:border-amber-400"
                    placeholder="Option name (e.g. Oat Milk)"
                    value={newOptionName}
                    onChange={e => setNewOptionName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  />
                  <div className="flex items-center gap-1 shrink-0 bg-gray-50 dark:bg-neutral-800 border-2 border-dashed border-gray-200 dark:border-neutral-700 rounded-xl px-3">
                    <span className="text-xs text-gray-400 font-semibold">+$</span>
                    <input type="number" step="0.01" min="0"
                      className="w-16 bg-transparent text-sm font-semibold text-green-600 focus:outline-none text-right"
                      value={newOptionPrice}
                      onChange={e => setNewOptionPrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    type="button" onClick={addOption}
                    className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition">
                    <Plus className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="flex gap-2 pt-2">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button"
                    onClick={() => { setDraft(group); setEditing(false); }}
                    className="flex-1 py-2.5 bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-300 dark:hover:bg-neutral-700 transition">
                    Cancel
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button"
                    onClick={handleSave} disabled={saving}
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                    {saving ? 'Saving...' : 'Save Group'}
                  </motion.button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Customizations() {
  const { shopId } = useShop();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => { if (shopId) loadGroups(); }, [shopId]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const { data: groupData, error: gErr } = await supabase
        .from('modifier_groups').select('*').eq('shop_id', shopId).eq('is_active', true).order('created_at', { ascending: true });
      if (gErr) throw gErr;
      const { data: optData, error: oErr } = await supabase
        .from('modifier_options').select('*').eq('shop_id', shopId).eq('is_active', true).order('created_at', { ascending: true });
      if (oErr) throw oErr;
      setGroups((groupData || []).map(g => ({ ...g, options: (optData || []).filter(o => o.modifier_group_id === g.id) })));
    } catch (err) {
      toast.error('Failed to load modifier groups: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const { data, error } = await supabase.from('modifier_groups')
        .insert({ shop_id: shopId, name: newGroupName.trim(), min_selections: 0, max_selections: null, is_active: true })
        .select().single();
      if (error) throw error;
      setGroups(prev => [...prev, { ...data, options: [] }]);
      setNewGroupName('');
      setCreating(false);
      toast.success('Modifier group created');
    } catch (err) {
      toast.error('Failed to create group: ' + err.message);
    }
  };

  const handleSaveGroup = async (draft) => {
    try {
      const { error: gErr } = await supabase.from('modifier_groups')
        .update({ name: draft.name, min_selections: draft.min_selections ?? 0, max_selections: draft.max_selections ?? null })
        .eq('id', draft.id);
      if (gErr) throw gErr;

      const { data: existingOpts } = await supabase.from('modifier_options').select('id').eq('modifier_group_id', draft.id);
      const existingIds = new Set((existingOpts || []).map(o => o.id));
      const draftIds = new Set(draft.options.filter(o => !o.id?.startsWith('new-')).map(o => o.id));
      const toDelete = [...existingIds].filter(id => !draftIds.has(id));

      if (toDelete.length) await supabase.from('modifier_options').update({ is_active: false }).in('id', toDelete);

      for (const opt of draft.options) {
        if (opt.id?.startsWith('new-')) {
          await supabase.from('modifier_options').insert({ modifier_group_id: draft.id, shop_id: shopId, name: opt.name, price_adjustment: opt.price_adjustment ?? 0, is_active: true });
        } else {
          await supabase.from('modifier_options').update({ name: opt.name, price_adjustment: opt.price_adjustment ?? 0 }).eq('id', opt.id);
        }
      }

      toast.success('Group saved!');
      await loadGroups();
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
      throw err;
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Delete this modifier group? It will be removed from all menu items.')) return;
    try {
      await supabase.from('modifier_groups').update({ is_active: false }).eq('id', groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
      toast.success('Group deleted');
    } catch (err) {
      toast.error('Failed to delete: ' + err.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
        <Layers className="w-12 h-12 text-amber-600" />
      </motion.div>
    </div>
  );

  const syncedGroups = groups.filter(g => g.pos_source);
  const manualGroups = groups.filter(g => !g.pos_source);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">Modifier Groups</h1>
          <p className="text-gray-500 mt-1 text-sm">{groups.length} group{groups.length !== 1 ? 's' : ''} · reusable options for any item</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition">
          <Plus className="w-5 h-5" /> New Group
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {creating && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-4 flex gap-3">
            <input autoFocus
              className="flex-1 px-4 py-2.5 bg-white dark:bg-neutral-800 border-2 border-amber-400 rounded-xl font-semibold focus:outline-none"
              placeholder="Group name (e.g. Milk Options, Syrup Flavors, Size)"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateGroup(); if (e.key === 'Escape') { setCreating(false); setNewGroupName(''); } }}
            />
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCreateGroup}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition">
              Create
            </motion.button>
            <button onClick={() => { setCreating(false); setNewGroupName(''); }}
              className="px-3 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-neutral-600 transition">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {groups.length === 0 && !creating ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
          <Sparkles className="w-24 h-24 text-gray-300 dark:text-neutral-700 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No modifier groups yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create groups like <strong>Milk Options</strong>, <strong>Syrup Flavors</strong>, or <strong>Size</strong> — then attach them to any menu item.
          </p>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCreating(true)}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg">
            Create First Group
          </motion.button>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {syncedGroups.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Imported from POS</h2>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {syncedGroups.map((g, i) => (
                    <GroupCard key={g.id} group={g} delay={i * 0.04} onSave={handleSaveGroup} onDelete={() => handleDeleteGroup(g.id)} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
          {manualGroups.length > 0 && (
            <div>
              {syncedGroups.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Manual Groups</h2>
                </div>
              )}
              <div className="space-y-3">
                <AnimatePresence>
                  {manualGroups.map((g, i) => (
                    <GroupCard key={g.id} group={g} delay={i * 0.04} onSave={handleSaveGroup} onDelete={() => handleDeleteGroup(g.id)} />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}