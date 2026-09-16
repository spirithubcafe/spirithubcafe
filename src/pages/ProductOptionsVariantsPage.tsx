import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productOptionsService, type ProductOptionCombination } from '../services/productOptionsService';
import { productVariantService } from '../services/productService';
import type { ProductVariant } from '../types/product';
import type { ProductOption, ProductOptionValue, ProductVariantMode } from '../types/productOptions';

type Tab = 'options' | 'variants' | 'inventory';
type GeneratedCombination = { key: string; valueIds: number[]; labels: string[] };

const buildCombinations = (options: ProductOption[]): GeneratedCombination[] => {
  const activeOptions = options
    .filter(option => option.isActive && option.isRequired)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
  if (activeOptions.length === 0 || activeOptions.some(option => !option.values?.some(value => value.isActive))) return [];

  return activeOptions.reduce<GeneratedCombination[]>((rows, option) => {
    const values = (option.values || []).filter(value => value.isActive).sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
    const base = rows.length ? rows : [{ key: '', valueIds: [], labels: [] }];
    return base.flatMap(row => values.map(value => ({
      key: [...row.valueIds, value.id].sort((a, b) => a - b).join('-'),
      valueIds: [...row.valueIds, value.id],
      labels: [...row.labels, `${option.name}: ${value.label}`],
    })));
  }, []);
};

const money = (value: number) => Number.isFinite(value) ? value.toFixed(3) : '—';

export const ProductOptionsVariantsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = Number(id);
  const [mode, setMode] = useState<ProductVariantMode>('standard');
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [savedCombinations, setSavedCombinations] = useState<ProductOptionCombination[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [mappings, setMappings] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<Tab>('options');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [code, setCode] = useState('');
  const [values, setValues] = useState('');

  const generated = useMemo(() => buildCombinations(options), [options]);
  const combinationCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    savedCombinations.filter(item => item.isActive).forEach(item => {
      counts[item.productVariantId] = (counts[item.productVariantId] || 0) + 1;
    });
    return counts;
  }, [savedCombinations]);

  const hydrateMappings = (combinations: ProductOptionCombination[]) => {
    const next: Record<string, number> = {};
    combinations.forEach(item => {
      const key = [...item.productOptionValueIds].sort((a, b) => a - b).join('-');
      next[key] = item.productVariantId;
    });
    setMappings(next);
  };

  const load = async () => {
    if (!productId) return;
    setLoading(true);
    setError('');
    try {
      const [data, productVariants] = await Promise.all([
        productOptionsService.get(productId),
        productVariantService.getByProduct(productId),
      ]);
      setMode(data.variantMode === 'Advanced' ? 'advanced' : 'standard');
      setOptions(data.options || []);
      setSavedCombinations(data.combinations || []);
      setVariants(productVariants || []);
      hydrateMappings(data.combinations || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load options');
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [productId]);

  const changeMode = async (next: ProductVariantMode) => {
    setSaving(true); setError(''); setSuccess('');
    try { await productOptionsService.setMode(productId, next); setMode(next); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to update mode'); }
    finally { setSaving(false); }
  };

  const addOption = async () => {
    const cleanName = name.trim();
    const cleanCode = (code.trim() || cleanName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const parsedValues = values.split(',').map(v => v.trim()).filter(Boolean);
    if (!cleanName || !cleanCode || parsedValues.length === 0) { setError('Enter an option name and at least one comma-separated value.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const optionId = await productOptionsService.createOption(productId, { code: cleanCode, name: cleanName, nameAr: nameAr.trim(), displayOrder: options.length, isRequired: true, isActive: true });
      for (let i = 0; i < parsedValues.length; i += 1) {
        const label = parsedValues[i];
        const value = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        await productOptionsService.createValue(productId, optionId, { value, label, displayOrder: i, isActive: true });
      }
      setName(''); setNameAr(''); setCode(''); setValues(''); setShowAdd(false); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to create option'); }
    finally { setSaving(false); }
  };

  const saveMappings = async () => {
    setError(''); setSuccess('');
    const unmapped = generated.filter(row => !mappings[row.key]);
    if (generated.length === 0) { setError('Add active required customer options and values before mapping variants.'); return; }
    if (unmapped.length) { setError(`Map all ${generated.length} combinations before saving. ${unmapped.length} still need a variant.`); return; }
    setSaving(true);
    try {
      await productOptionsService.saveCombinations(productId, generated.map((row, index) => ({
        productVariantId: mappings[row.key], productOptionValueIds: row.valueIds, displayOrder: index, isActive: true,
      })));
      setSuccess(`${generated.length} combinations saved successfully without creating new SKUs.`);
      const data = await productOptionsService.get(productId);
      setSavedCombinations(data.combinations || []);
      hydrateMappings(data.combinations || []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to save variant mappings'); }
    finally { setSaving(false); }
  };

  const card: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20 };
  const tabStyle = (active: boolean): React.CSSProperties => ({ border: 0, borderBottom: active ? '3px solid #5d3a2e' : '3px solid transparent', background: 'transparent', padding: '14px 18px', fontWeight: 700, cursor: 'pointer', color: active ? '#5d3a2e' : '#6b7280' });
  const activeVariants = variants.filter(variant => variant.isActive);

  if (loading) return <div style={{ padding: 24 }}>Loading Options &amp; Variants…</div>;

  return <div style={{ padding: 24, maxWidth: 1180, margin: '0 auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 22 }}>
      <div><button onClick={() => navigate(-1)} style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 0, color: '#6b7280' }}>← Back to Products</button><h1 style={{ margin: '8px 0 4px' }}>Options &amp; Variants</h1><div style={{ color: '#6b7280' }}>Configure customer choices without changing Product Attributes.</div></div>
      <button onClick={() => navigate(`/om/admin/products/${productId}/attributes`)} style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 9, background: '#fff', cursor: 'pointer' }}>Product Attributes</button>
    </div>

    {error && <div style={{ marginBottom: 16, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, color: '#991b1b' }}>{error}</div>}
    {success && <div style={{ marginBottom: 16, padding: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9, color: '#166534' }}>{success}</div>}

    <section style={{ ...card, marginBottom: 18 }}><h2 style={{ marginTop: 0 }}>Variant Mode</h2><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
      <label style={{ padding: 16, border: mode === 'standard' ? '2px solid #5d3a2e' : '1px solid #d1d5db', borderRadius: 12, cursor: 'pointer' }}><input type="radio" checked={mode === 'standard'} disabled={saving} onChange={() => void changeMode('standard')} /> <strong>Standard (Current)</strong><div style={{ color: '#6b7280', margin: '6px 0 0 22px' }}>Keep the existing variant behaviour unchanged.</div></label>
      <label style={{ padding: 16, border: mode === 'advanced' ? '2px solid #5d3a2e' : '1px solid #d1d5db', borderRadius: 12, cursor: 'pointer' }}><input type="radio" checked={mode === 'advanced'} disabled={saving} onChange={() => void changeMode('advanced')} /> <strong>Advanced Options</strong><div style={{ color: '#6b7280', margin: '6px 0 0 22px' }}>Add customer options and map combinations to existing sellable variants.</div></label>
    </div></section>

    {mode === 'standard' ? <section style={card}><h2 style={{ marginTop: 0 }}>Standard mode is active</h2><p style={{ color: '#6b7280' }}>This product continues using the current SpiritHub variants. No conversion is performed.</p></section> : <>
      <div style={{ ...card, padding: '0 12px', marginBottom: 18, display: 'flex', overflowX: 'auto' }}><button style={tabStyle(tab === 'options')} onClick={() => setTab('options')}>CUSTOMER OPTIONS</button><button style={tabStyle(tab === 'variants')} onClick={() => setTab('variants')}>VARIANTS</button><button style={tabStyle(tab === 'inventory')} onClick={() => setTab('inventory')}>INVENTORY</button></div>

      {tab === 'options' && <section style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}><div><h2 style={{ margin: 0 }}>Customer Options</h2><p style={{ color: '#6b7280' }}>Examples: Pack Size, Grind, Count, Type, Size or Color.</p></div><button onClick={() => setShowAdd(v => !v)} style={{ padding: '10px 15px', border: 0, borderRadius: 9, background: '#5d3a2e', color: '#fff', cursor: 'pointer' }}>+ Add Option</button></div>
        {showAdd && <div style={{ margin: '16px 0', padding: 16, background: '#faf8f5', borderRadius: 12, display: 'grid', gap: 10 }}><input placeholder="Option name (e.g. Pack Size)" value={name} onChange={e => setName(e.target.value)} style={{ padding: 11 }} /><input placeholder="Arabic name (optional)" value={nameAr} onChange={e => setNameAr(e.target.value)} style={{ padding: 11 }} /><input placeholder="Code (optional, e.g. pack-size)" value={code} onChange={e => setCode(e.target.value)} style={{ padding: 11 }} /><input placeholder="Values separated by commas: 100g, 200g, 1kg" value={values} onChange={e => setValues(e.target.value)} style={{ padding: 11 }} /><div><button disabled={saving} onClick={() => void addOption()} style={{ padding: '9px 15px', border: 0, borderRadius: 8, background: '#5d3a2e', color: '#fff' }}>{saving ? 'Saving…' : 'Save Option'}</button></div></div>}
        <div style={{ display: 'grid', gap: 12 }}>{options.length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', border: '1px dashed #d1d5db', borderRadius: 12 }}>No customer options yet. Add Pack Size or Grind to start.</div> : options.map(option => <div key={option.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{option.name}</strong><span style={{ color: '#6b7280' }}>{option.code}</span></div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>{(option.values || []).map((value: ProductOptionValue) => <span key={value.id} style={{ padding: '7px 11px', background: '#f3f4f6', borderRadius: 999 }}>{value.label}</span>)}</div></div>)}</div>
      </section>}

      {tab === 'variants' && <section style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}><div><h2 style={{ margin: 0 }}>Sellable Variants</h2><p style={{ color: '#6b7280', marginBottom: 0 }}>Map every customer combination to an existing variant. Reusing a variant preserves shared SKU, price and inventory.</p></div><div style={{ textAlign: 'right', color: '#6b7280', whiteSpace: 'nowrap' }}>{generated.length} combinations<br />{variants.length} existing variants</div></div>
        {activeVariants.length === 0 ? <div style={{ padding: 18, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10 }}>No active existing ProductVariants are available. Create or activate the normal sellable variants first.</div> : generated.length === 0 ? <div style={{ padding: 18, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10 }}>Add active required options and values in CUSTOMER OPTIONS first.</div> : <>
          <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 12 }}><table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}><thead><tr style={{ background: '#faf8f5', textAlign: 'left' }}><th style={{ padding: 12 }}>Customer combination</th><th style={{ padding: 12 }}>Existing sellable variant</th><th style={{ padding: 12 }}>Variant details</th></tr></thead><tbody>{generated.map(row => {
            const selectedId = mappings[row.key] || 0;
            const selected = variants.find(variant => variant.id === selectedId);
            return <tr key={row.key} style={{ borderTop: '1px solid #e5e7eb' }}><td style={{ padding: 12, fontWeight: 600 }}>{row.labels.join(' / ')}</td><td style={{ padding: 12 }}><select value={selectedId || ''} disabled={saving} onChange={e => setMappings(current => ({ ...current, [row.key]: Number(e.target.value) }))} style={{ width: '100%', minWidth: 220, padding: 10, border: '1px solid #d1d5db', borderRadius: 8, background: '#fff' }}><option value="">Select existing variant…</option>{activeVariants.map(variant => <option key={variant.id} value={variant.id}>{variant.variantSku}</option>)}</select></td><td style={{ padding: 12, color: '#6b7280' }}>{selected ? <span>{selected.variantSku} · {money(selected.price)} · Stock {selected.stockQuantity} · {selected.weight} {selected.weightUnit}</span> : <span style={{ color: '#b45309' }}>Not mapped</span>}</td></tr>;
          })}</tbody></table></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginTop: 16, flexWrap: 'wrap' }}><div style={{ color: '#6b7280' }}>{savedCombinations.length ? `${savedCombinations.length} mappings currently saved.` : 'No combination mappings saved yet.'}</div><button disabled={saving || generated.some(row => !mappings[row.key])} onClick={() => void saveMappings()} style={{ padding: '11px 18px', border: 0, borderRadius: 9, background: '#5d3a2e', color: '#fff', cursor: saving ? 'default' : 'pointer', opacity: saving || generated.some(row => !mappings[row.key]) ? 0.55 : 1 }}>{saving ? 'Saving…' : `Save ${generated.length} Mappings`}</button></div>
        </>}
      </section>}

      {tab === 'inventory' && <section style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap' }}><div><h2 style={{ margin: 0 }}>Inventory</h2><p style={{ color: '#6b7280', margin: '6px 0 0' }}>Read-only view. Existing ProductVariant SKU, price, weight and stock remain authoritative.</p></div><div style={{ padding: '7px 11px', borderRadius: 999, background: '#f3f4f6', color: '#4b5563', fontWeight: 700 }}>READ ONLY</div></div>
        <div style={{ padding: 14, marginBottom: 16, background: '#faf8f5', border: '1px solid #e7e1dc', borderRadius: 10, color: '#5d3a2e' }}>Multiple customer combinations can share one existing variant. They therefore share the same SKU and stock record; no duplicate inventory is created here.</div>
        {variants.length === 0 ? <div style={{ padding: 18, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10 }}>No existing ProductVariants are available for this product.</div> : <div style={{ display: 'grid', gap: 12 }}>{variants.slice().sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id).map(variant => {
          const usedBy = combinationCounts[variant.id] || 0;
          return <div key={variant.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, opacity: variant.isActive ? 1 : 0.65 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><strong style={{ fontSize: 16 }}>{variant.variantSku}</strong>{variant.isDefault && <span style={{ padding: '4px 8px', borderRadius: 999, background: '#f3f4f6', color: '#4b5563', fontSize: 12, fontWeight: 700 }}>DEFAULT</span>}{!variant.isActive && <span style={{ padding: '4px 8px', borderRadius: 999, background: '#fef2f2', color: '#991b1b', fontSize: 12, fontWeight: 700 }}>INACTIVE</span>}</div><strong style={{ color: '#5d3a2e' }}>Stock {variant.stockQuantity}</strong></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginTop: 14 }}><div><div style={{ color: '#6b7280', fontSize: 12 }}>Price</div><div style={{ fontWeight: 600 }}>{money(variant.price)} OMR</div></div><div><div style={{ color: '#6b7280', fontSize: 12 }}>Weight</div><div style={{ fontWeight: 600 }}>{variant.weight} {variant.weightUnit}</div></div><div><div style={{ color: '#6b7280', fontSize: 12 }}>Low stock threshold</div><div style={{ fontWeight: 600 }}>{variant.lowStockThreshold}</div></div><div><div style={{ color: '#6b7280', fontSize: 12 }}>Used by</div><div style={{ fontWeight: 600 }}>{usedBy} customer {usedBy === 1 ? 'combination' : 'combinations'}</div></div></div>
          </div>;
        })}</div>}
        <div style={{ marginTop: 16, color: '#6b7280', fontSize: 13 }}>To change stock, SKU, price or physical weight, continue using the existing Product Variant management. This Advanced Options inventory view intentionally does not write inventory data.</div>
      </section>}
    </>}
  </div>;
};