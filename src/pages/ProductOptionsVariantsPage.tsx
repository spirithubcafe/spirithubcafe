import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productOptionsService } from '../services/productOptionsService';
import type { ProductOption, ProductVariantMode } from '../types/productOptions';

type Tab = 'options' | 'variants' | 'inventory';

export const ProductOptionsVariantsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = Number(id);
  const [mode, setMode] = useState<ProductVariantMode>('standard');
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [tab, setTab] = useState<Tab>('options');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [code, setCode] = useState('');
  const [values, setValues] = useState('');

  const load = async () => {
    if (!productId) return;
    setLoading(true);
    setError('');
    try {
      const data = await productOptionsService.get(productId);
      setMode(data.variantMode === 'Advanced' ? 'advanced' : 'standard');
      setOptions(data.options || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load options');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [productId]);

  const changeMode = async (next: ProductVariantMode) => {
    setSaving(true);
    setError('');
    try {
      await productOptionsService.setMode(productId, next);
      setMode(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update mode');
    } finally { setSaving(false); }
  };

  const addOption = async () => {
    const cleanName = name.trim();
    const cleanCode = (code.trim() || cleanName).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const parsedValues = values.split(',').map(v => v.trim()).filter(Boolean);
    if (!cleanName || !cleanCode || parsedValues.length === 0) {
      setError('Enter an option name and at least one comma-separated value.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const optionId = await productOptionsService.createOption(productId, {
        code: cleanCode, name: cleanName, nameAr: nameAr.trim(), displayOrder: options.length, isRequired: true, isActive: true,
      });
      for (let i = 0; i < parsedValues.length; i += 1) {
        const label = parsedValues[i];
        const value = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        await productOptionsService.createValue(productId, optionId, { value, label, displayOrder: i, isActive: true });
      }
      setName(''); setNameAr(''); setCode(''); setValues(''); setShowAdd(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create option');
    } finally { setSaving(false); }
  };

  const card: React.CSSProperties = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20 };
  const tabStyle = (active: boolean): React.CSSProperties => ({ border: 0, borderBottom: active ? '3px solid #5d3a2e' : '3px solid transparent', background: 'transparent', padding: '14px 18px', fontWeight: 700, cursor: 'pointer', color: active ? '#5d3a2e' : '#6b7280' });

  if (loading) return <div style={{ padding: 24 }}>Loading Options &amp; Variants…</div>;

  return <div style={{ padding: 24, maxWidth: 1180, margin: '0 auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 22 }}>
      <div><button onClick={() => navigate(-1)} style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 0, color: '#6b7280' }}>← Back to Products</button><h1 style={{ margin: '8px 0 4px' }}>Options &amp; Variants</h1><div style={{ color: '#6b7280' }}>Configure customer choices without changing Product Attributes.</div></div>
      <button onClick={() => navigate(`/om/admin/products/${productId}/attributes`)} style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 9, background: '#fff', cursor: 'pointer' }}>Product Attributes</button>
    </div>

    {error && <div style={{ marginBottom: 16, padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, color: '#991b1b' }}>{error}</div>}

    <section style={{ ...card, marginBottom: 18 }}>
      <h2 style={{ marginTop: 0 }}>Variant Mode</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
        <label style={{ padding: 16, border: mode === 'standard' ? '2px solid #5d3a2e' : '1px solid #d1d5db', borderRadius: 12, cursor: 'pointer' }}><input type="radio" checked={mode === 'standard'} disabled={saving} onChange={() => void changeMode('standard')} /> <strong>Standard (Current)</strong><div style={{ color: '#6b7280', margin: '6px 0 0 22px' }}>Keep the existing variant behaviour unchanged.</div></label>
        <label style={{ padding: 16, border: mode === 'advanced' ? '2px solid #5d3a2e' : '1px solid #d1d5db', borderRadius: 12, cursor: 'pointer' }}><input type="radio" checked={mode === 'advanced'} disabled={saving} onChange={() => void changeMode('advanced')} /> <strong>Advanced Options</strong><div style={{ color: '#6b7280', margin: '6px 0 0 22px' }}>Add customer options and map combinations to existing sellable variants.</div></label>
      </div>
    </section>

    {mode === 'standard' ? <section style={card}><h2 style={{ marginTop: 0 }}>Standard mode is active</h2><p style={{ color: '#6b7280' }}>This product continues using the current SpiritHub variants. No conversion is performed.</p><button onClick={() => navigate('/om/admin/products')} style={{ padding: '10px 15px', borderRadius: 9, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Return to current Products / Variants</button></section> : <>
      <div style={{ ...card, padding: '0 12px', marginBottom: 18, display: 'flex', overflowX: 'auto' }}>
        <button style={tabStyle(tab === 'options')} onClick={() => setTab('options')}>CUSTOMER OPTIONS</button><button style={tabStyle(tab === 'variants')} onClick={() => setTab('variants')}>VARIANTS</button><button style={tabStyle(tab === 'inventory')} onClick={() => setTab('inventory')}>INVENTORY</button>
      </div>
      {tab === 'options' && <section style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}><div><h2 style={{ margin: 0 }}>Customer Options</h2><p style={{ color: '#6b7280' }}>Examples: Pack Size, Grind, Count, Type, Size or Color.</p></div><button onClick={() => setShowAdd(v => !v)} style={{ padding: '10px 15px', border: 0, borderRadius: 9, background: '#5d3a2e', color: '#fff', cursor: 'pointer' }}>+ Add Option</button></div>
        {showAdd && <div style={{ margin: '16px 0', padding: 16, background: '#faf8f5', borderRadius: 12, display: 'grid', gap: 10 }}><input placeholder="Option name (e.g. Pack Size)" value={name} onChange={e => setName(e.target.value)} style={{ padding: 11 }} /><input placeholder="Arabic name (optional)" value={nameAr} onChange={e => setNameAr(e.target.value)} style={{ padding: 11 }} /><input placeholder="Code (optional, e.g. pack-size)" value={code} onChange={e => setCode(e.target.value)} style={{ padding: 11 }} /><input placeholder="Values separated by commas: 100g, 200g, 1kg" value={values} onChange={e => setValues(e.target.value)} style={{ padding: 11 }} /><div><button disabled={saving} onClick={() => void addOption()} style={{ padding: '9px 15px', border: 0, borderRadius: 8, background: '#5d3a2e', color: '#fff' }}>{saving ? 'Saving…' : 'Save Option'}</button></div></div>}
        <div style={{ display: 'grid', gap: 12 }}>{options.length === 0 ? <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', border: '1px dashed #d1d5db', borderRadius: 12 }}>No customer options yet. Add Pack Size or Grind to start.</div> : options.map(option => <div key={option.id} style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}><strong>{option.name}</strong><span style={{ color: '#6b7280' }}>{option.code}</span></div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>{(option.values || []).map(value => <span key={value.id} style={{ padding: '7px 11px', background: '#f3f4f6', borderRadius: 999 }}>{value.label}</span>)}</div></div>)}</div>
      </section>}
      {tab === 'variants' && <section style={card}><h2 style={{ marginTop: 0 }}>Sellable Variants</h2><p style={{ color: '#6b7280' }}>The advanced option combinations will map to your existing ProductVariant records, preserving SKU, price, weight and current order behaviour.</p><div style={{ padding: 18, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10 }}>Combination generation and mapping controls are intentionally not enabled yet. We will validate the API and existing variant compatibility before enabling them.</div></section>}
      {tab === 'inventory' && <section style={card}><h2 style={{ marginTop: 0 }}>Inventory</h2><p style={{ color: '#6b7280' }}>Current variant stock remains authoritative.</p><div style={{ padding: 18, background: '#f9fafb', borderRadius: 10 }}>Shared inventory groups for coffee grind choices will be added in a later stage so Whole Bean, V60 and Espresso can draw from the same pack-size stock without double-counting inventory.</div></section>}
    </>}
  </div>;
};
