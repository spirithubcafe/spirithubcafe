import { useCallback, useEffect, useState } from 'react';
import { Loader2, PackageCheck, RefreshCw, Send, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { orderService } from '../../services/orderService';
import type { NoolDispatchQueueItem } from '../../types/order';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type DispatchProvider = 'Nool' | 'Genacom';

const getError = (error: unknown) => {
  const value = error as { message?: string; response?: { data?: { message?: string } } };
  return value?.response?.data?.message || value?.message || 'The Nool dispatch request failed.';
};

const statusClass = (status?: string) => ({ requested: 'bg-blue-50 text-blue-700', trackingassigned: 'bg-violet-50 text-violet-700', collected: 'bg-amber-50 text-amber-700', delivered: 'bg-green-50 text-green-700', failed: 'bg-red-50 text-red-700' }[(status || '').toLowerCase()] || 'bg-slate-50 text-slate-700');

export function NoolDispatchQueue() {
  const [items, setItems] = useState<NoolDispatchQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [tracking, setTracking] = useState<Record<number, { number: string; labelUrl: string }>>({});
  const [providers, setProviders] = useState<Record<number, DispatchProvider>>({});
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const response = await orderService.getNoolDispatchQueue(); if (!response.success) throw new Error(response.message); setItems(response.data || []); }
    catch (err) { setError(getError(err)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const run = async (item: NoolDispatchQueueItem, action: () => Promise<{ success: boolean; message?: string }>) => {
    setWorkingId(item.id); setError(null);
    try { const response = await action(); if (!response.success) throw new Error(response.message); toast.success(response.message || `${item.orderNumber} updated.`); await load(); }
    catch (err) { const message = getError(err); setError(message); toast.error(message); } finally { setWorkingId(null); }
  };
  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold">Nool Dispatch Queue</h1><p className="text-sm text-muted-foreground">Manage Nool pickup, tracking, collection, and delivery.</p></div><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button></div>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <Card><CardHeader><CardTitle>Active queue</CardTitle><CardDescription>{items.length} Nool order{items.length === 1 ? '' : 's'}</CardDescription></CardHeader><CardContent>
      {loading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin" /></div> : items.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">No Nool dispatches are waiting.</div> : <div className="overflow-x-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Status</TableHead><TableHead>Tracking</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
        {items.map((item) => { const busy = workingId === item.id; const draft = tracking[item.id] || { number: item.noolTrackingNumber || '', labelUrl: item.noolLabelUrl || '' }; const provider = providers[item.id] || 'Nool'; const normalized = (item.dispatchStatus || '').toLowerCase(); return <TableRow key={item.id}>
          <TableCell><div className="font-medium">{item.orderNumber}</div><div className="text-xs text-muted-foreground">OMR {item.totalAmount.toFixed(3)}</div></TableCell><TableCell><div>{item.customerName}</div><div className="text-xs text-muted-foreground">{item.phone} · {item.city}</div></TableCell><TableCell><Badge variant="outline" className={statusClass(item.dispatchStatus)}>{(item.dispatchStatus || 'Ready').replace(/([a-z])([A-Z])/g, '$1 $2')}</Badge></TableCell>
          <TableCell className="min-w-[220px]"><div className="space-y-2"><Input aria-label="Nool tracking number" placeholder="Tracking number" value={draft.number} onChange={(e) => setTracking((p) => ({ ...p, [item.id]: { ...draft, number: e.target.value } }))} /><Input aria-label="Nool label URL" placeholder="Label URL (optional)" value={draft.labelUrl} onChange={(e) => setTracking((p) => ({ ...p, [item.id]: { ...draft, labelUrl: e.target.value } }))} /></div></TableCell>
          <TableCell><div className="flex min-w-[260px] flex-wrap items-center justify-end gap-2">{item.canRequestNoolDispatch && <Select value={provider} onValueChange={(value) => setProviders((p) => ({ ...p, [item.id]: value as DispatchProvider }))}><SelectTrigger size="sm" aria-label="Delivery provider" className="w-[130px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Nool">Nool</SelectItem><SelectItem value="Genacom">Genacom</SelectItem></SelectContent></Select>}{item.canRequestNoolDispatch && <Button size="sm" disabled={busy} onClick={() => void run(item, () => orderService.requestNoolDispatch(item.id, provider))}><Send className="mr-1 h-4 w-4" />Ready for Pickup</Button>}{item.canResendNoolDispatch && <Button size="sm" variant="outline" disabled={busy} onClick={() => void run(item, () => orderService.resendNoolDispatch(item.id))}><RefreshCw className="mr-1 h-4 w-4" />Resend</Button>}<Button size="sm" variant="outline" disabled={busy || !draft.number.trim()} onClick={() => void run(item, () => orderService.updateNoolTracking(item.id, draft.number.trim(), draft.labelUrl.trim()))}><Truck className="mr-1 h-4 w-4" />Tracking</Button><Button size="sm" variant="outline" disabled={busy || !normalized || ['collected', 'delivered'].includes(normalized)} onClick={() => void run(item, () => orderService.markNoolCollected(item.id))}>Collected</Button><Button size="sm" variant="outline" disabled={busy || normalized !== 'collected'} onClick={() => void run(item, () => orderService.markNoolDelivered(item.id))}><PackageCheck className="mr-1 h-4 w-4" />Delivered</Button></div></TableCell>
        </TableRow>; })}
      </TableBody></Table></div>}
    </CardContent></Card>
  </div>;
}
