import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown, Loader2, PackageCheck, RefreshCw, Send, Truck } from 'lucide-react';
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

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'ready', label: 'Ready' },
  { value: 'requested', label: 'Requested' },
  { value: 'trackingassigned', label: 'Tracking Assigned' },
  { value: 'collected', label: 'Collected' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'failed', label: 'Failed' },
] as const;

const PAGE_SIZE = 10;

type SortKey = 'orderNumber' | 'customerName' | 'dispatchStatus';
type SortDirection = 'asc' | 'desc';

export function NoolDispatchQueue() {
  const [items, setItems] = useState<NoolDispatchQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [tracking, setTracking] = useState<Record<number, { number: string; labelUrl: string }>>({});
  const [providers, setProviders] = useState<Record<number, DispatchProvider>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { const response = await orderService.getNoolDispatchQueue(); if (!response.success) throw new Error(response.message); setItems(response.data || []); }
    catch (err) { setError(getError(err)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const normalized = (item.dispatchStatus || 'ready').toLowerCase();
      const matchesStatus = statusFilter === 'all' || normalized === statusFilter;
      const matchesSearch = !term || [item.orderNumber, item.customerName, item.phone, item.city].some((value) => value?.toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }, [items, search, statusFilter]);
  const sortedItems = useMemo(() => {
    if (!sortKey) return filteredItems;
    const copy = [...filteredItems];
    copy.sort((a, b) => {
      const valueA = (sortKey === 'dispatchStatus' ? a.dispatchStatus || 'ready' : a[sortKey]).toLowerCase();
      const valueB = (sortKey === 'dispatchStatus' ? b.dispatchStatus || 'ready' : b[sortKey]).toLowerCase();
      const result = valueA.localeCompare(valueB);
      return sortDirection === 'asc' ? result : -result;
    });
    return copy;
  }, [filteredItems, sortKey, sortDirection]);
  const toggleSort = (key: SortKey) => {
    if (sortKey === key) { setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc')); return; }
    setSortKey(key); setSortDirection('asc');
  };
  useEffect(() => { setPage(1); }, [search, statusFilter, sortKey, sortDirection]);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedItems = sortedItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const run = async (item: NoolDispatchQueueItem, action: () => Promise<{ success: boolean; message?: string }>) => {
    setWorkingId(item.id); setError(null);
    try { const response = await action(); if (!response.success) throw new Error(response.message); toast.success(response.message || `${item.orderNumber} updated.`); await load(); }
    catch (err) { const message = getError(err); setError(message); toast.error(message); } finally { setWorkingId(null); }
  };
  const renderTrackingInputs = (item: NoolDispatchQueueItem, draft: { number: string; labelUrl: string }) => {
    if (item.canRequestNoolDispatch) return null;
    return (
      <div className="space-y-2">
        <Input aria-label="Nool tracking number" placeholder="Tracking number" value={draft.number} onChange={(e) => setTracking((p) => ({ ...p, [item.id]: { ...draft, number: e.target.value } }))} />
        <Input aria-label="Nool label URL" placeholder="Label URL (optional)" value={draft.labelUrl} onChange={(e) => setTracking((p) => ({ ...p, [item.id]: { ...draft, labelUrl: e.target.value } }))} />
      </div>
    );
  };

  const renderActions = (item: NoolDispatchQueueItem, draft: { number: string; labelUrl: string }, provider: DispatchProvider, busy: boolean, normalized: string) => (
    <>
      {item.canRequestNoolDispatch && (
        <Select value={provider} onValueChange={(value) => setProviders((p) => ({ ...p, [item.id]: value as DispatchProvider }))}>
          <SelectTrigger size="sm" aria-label="Delivery provider" className="w-full sm:w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="Nool">Nool</SelectItem><SelectItem value="Genacom">Genacom</SelectItem></SelectContent>
        </Select>
      )}
      {item.canRequestNoolDispatch && (
        <Button size="sm" className="w-full sm:w-auto" disabled={busy} onClick={() => void run(item, () => orderService.requestNoolDispatch(item.id, provider))}>
          <Send className="mr-1 h-4 w-4" />Ready for Pickup
        </Button>
      )}
      {item.canResendNoolDispatch && (
        <Button size="sm" variant="outline" className="w-full sm:w-auto" disabled={busy} onClick={() => void run(item, () => orderService.resendNoolDispatch(item.id))}>
          <RefreshCw className="mr-1 h-4 w-4" />Resend
        </Button>
      )}
      {!item.canRequestNoolDispatch && (
        <Button size="sm" variant="outline" className="w-full sm:w-auto" disabled={busy || !draft.number.trim()} onClick={() => void run(item, () => orderService.updateNoolTracking(item.id, draft.number.trim(), draft.labelUrl.trim()))}>
          <Truck className="mr-1 h-4 w-4" />Tracking
        </Button>
      )}
      {!item.canRequestNoolDispatch && (
        <Button size="sm" variant="outline" className="w-full sm:w-auto" disabled={busy || !normalized || ['collected', 'delivered'].includes(normalized)} onClick={() => void run(item, () => orderService.markNoolCollected(item.id))}>
          Collected
        </Button>
      )}
      {!item.canRequestNoolDispatch && (
        <Button size="sm" variant="outline" className="w-full sm:w-auto" disabled={busy || normalized !== 'collected'} onClick={() => void run(item, () => orderService.markNoolDelivered(item.id))}>
          <PackageCheck className="mr-1 h-4 w-4" />Delivered
        </Button>
      )}
    </>
  );

  const sortIcon = (key: SortKey) => sortKey !== key ? <ChevronsUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" /> : sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3.5 w-3.5" /> : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
  const SortableHead = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <TableHead><button type="button" className="flex items-center hover:text-foreground" onClick={() => toggleSort(sortKeyName)}>{label}{sortIcon(sortKeyName)}</button></TableHead>
  );

  return <div className="space-y-4 px-3 sm:space-y-6 sm:px-0">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-xl font-bold sm:text-2xl">Nool Dispatch Queue</h1><p className="text-sm text-muted-foreground">Manage Nool pickup, tracking, collection, and delivery.</p></div>
      <Button variant="outline" onClick={() => void load()} disabled={loading} className="w-full sm:w-auto"><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button>
    </div>
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <Card>
      <CardHeader><CardTitle>Active queue</CardTitle><CardDescription>{filteredItems.length} of {items.length} Nool order{items.length === 1 ? '' : 's'}</CardDescription></CardHeader>
      <CardContent className="sm:px-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input aria-label="Search orders" placeholder="Search order, customer, phone, city…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="Filter by status" className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS_FILTERS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {loading ? <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin" /></div> : filteredItems.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">{items.length === 0 ? 'No Nool dispatches are waiting.' : 'No orders match the current filters.'}</div> : <>
          {/* Mobile card layout */}
          <div className="space-y-3 sm:hidden">
            {pagedItems.map((item) => { const busy = workingId === item.id; const draft = tracking[item.id] || { number: item.noolTrackingNumber || '', labelUrl: item.noolLabelUrl || '' }; const provider = providers[item.id] || 'Nool'; const normalized = (item.dispatchStatus || '').toLowerCase(); return (
              <div key={item.id} className="rounded-lg border p-3 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div><div className="font-medium">{item.orderNumber}</div><div className="text-xs text-muted-foreground">OMR {item.totalAmount.toFixed(3)}</div></div>
                  <Badge variant="outline" className={statusClass(item.dispatchStatus)}>{(item.dispatchStatus || 'Ready').replace(/([a-z])([A-Z])/g, '$1 $2')}</Badge>
                </div>
                <div className="text-sm"><div>{item.customerName}</div><div className="text-xs text-muted-foreground">{item.phone} · {item.city}</div></div>
                {renderTrackingInputs(item, draft)}
                <div className="flex flex-col gap-2">{renderActions(item, draft, provider, busy, normalized)}</div>
              </div>
            ); })}
          </div>
          {/* Desktop table layout */}
          <div className="hidden overflow-x-auto rounded-md border sm:block">
            <Table><TableHeader><TableRow><SortableHead label="Order" sortKeyName="orderNumber" /><SortableHead label="Customer" sortKeyName="customerName" /><SortableHead label="Status" sortKeyName="dispatchStatus" /><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
              {pagedItems.map((item) => { const busy = workingId === item.id; const draft = tracking[item.id] || { number: item.noolTrackingNumber || '', labelUrl: item.noolLabelUrl || '' }; const provider = providers[item.id] || 'Nool'; const normalized = (item.dispatchStatus || '').toLowerCase(); return <TableRow key={item.id}>
                <TableCell><div className="font-medium">{item.orderNumber}</div><div className="text-xs text-muted-foreground">OMR {item.totalAmount.toFixed(3)}</div></TableCell><TableCell><div>{item.customerName}</div><div className="text-xs text-muted-foreground">{item.phone} · {item.city}</div></TableCell><TableCell><Badge variant="outline" className={statusClass(item.dispatchStatus)}>{(item.dispatchStatus || 'Ready').replace(/([a-z])([A-Z])/g, '$1 $2')}</Badge></TableCell>
                <TableCell><div className="flex min-w-[260px] flex-wrap items-center justify-end gap-2">{renderActions(item, draft, provider, busy, normalized)}</div></TableCell>
              </TableRow>; })}
            </TableBody></Table>
          </div>
          {totalPages > 1 && (
            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</p>
              <div className="flex w-full gap-2 sm:w-auto">
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-none" disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </div>
            </div>
          )}
        </>}
      </CardContent>
    </Card>
  </div>;
}
