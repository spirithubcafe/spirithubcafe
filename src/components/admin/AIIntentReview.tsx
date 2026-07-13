import React, { useCallback, useEffect, useState } from 'react';
import { Bot, Check, Loader2, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { chatbotIntentService, type ChatbotIntent, type ChatbotUnknownIntent } from '../../services/chatbotIntentService';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

const PAGE_SIZE = 25;
const splitKeywords = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

export const AIIntentReview: React.FC = () => {
  const [items, setItems] = useState<ChatbotUnknownIntent[]>([]);
  const [intents, setIntents] = useState<ChatbotIntent[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [selected, setSelected] = useState<ChatbotUnknownIntent | null>(null);
  const [intentId, setIntentId] = useState('');
  const [intentCode, setIntentCode] = useState('');
  const [intentNameEn, setIntentNameEn] = useState('');
  const [intentNameAr, setIntentNameAr] = useState('');
  const [keywordsEn, setKeywordsEn] = useState('');
  const [keywordsAr, setKeywordsAr] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [unknown, activeIntents] = await Promise.all([
        chatbotIntentService.getUnknown('Pending', page, PAGE_SIZE), chatbotIntentService.getIntents(),
      ]);
      setItems(unknown.items); setTotalCount(unknown.totalCount); setIntents(activeIntents);
    } catch { toast.error('Unable to load intent review queue.'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { void load(); }, [load]);

  const openApproval = (item: ChatbotUnknownIntent) => {
    const suggested = intents.find((intent) => intent.intentCode === item.suggestedIntent);
    setSelected(item); setIntentId(suggested ? String(suggested.id) : '');
    setIntentCode(suggested ? '' : item.suggestedIntent ?? ''); setIntentNameEn(''); setIntentNameAr('');
    setKeywordsEn(item.suggestedKeywords.join(', ')); setKeywordsAr(item.suggestedArabicKeywords.join(', ')); setReviewNotes('');
  };

  const approve = async () => {
    if (!selected) return;
    if (!intentId && (!intentCode.trim() || !intentNameEn.trim())) { toast.error('Choose an existing intent or enter a new intent code and English name.'); return; }
    setBusyId(selected.id);
    try {
      await chatbotIntentService.approve(selected.id, {
        intentId: intentId ? Number(intentId) : undefined, intentCode: intentId ? undefined : intentCode.trim(),
        intentNameEn: intentId ? undefined : intentNameEn.trim(), intentNameAr: intentId ? undefined : intentNameAr.trim() || undefined,
        keywordsEn: splitKeywords(keywordsEn), keywordsAr: splitKeywords(keywordsAr), reviewNotes: reviewNotes.trim() || undefined,
      });
      setSelected(null); toast.success('Intent approved and keywords published.'); await load();
    } catch { toast.error('Approval failed.'); } finally { setBusyId(null); }
  };

  const updateStatus = async (item: ChatbotUnknownIntent, status: 'Rejected' | 'Ignored') => {
    setBusyId(item.id);
    try { await chatbotIntentService.updateStatus(item.id, status); toast.success(`Message ${status.toLowerCase()}.`); await load(); }
    catch { toast.error(`Unable to mark as ${status.toLowerCase()}.`); } finally { setBusyId(null); }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  return <>
    <Card><CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />AI Intent Review</CardTitle><CardDescription>Review low-confidence messages. Keywords publish only after approval.</CardDescription></div><Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></CardHeader>
      <CardContent className="space-y-4">{loading ? <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : items.length === 0 ? <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">No pending messages.</div> : items.map((item) => <div key={item.id} className="rounded-xl border p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant="secondary">{item.language.toUpperCase()}</Badge><Badge variant="outline">{item.status}</Badge>{item.confidenceScore != null && <span className="text-xs text-muted-foreground">Confidence {Math.round(item.confidenceScore * 100)}%</span>}</div><p className="font-medium">{item.message}</p><p className="mt-2 text-xs text-muted-foreground">Suggested intent: {item.suggestedIntent || 'None'} · {new Date(item.createdAt).toLocaleString()}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => openApproval(item)} disabled={busyId === item.id}><Check className="mr-1 h-4 w-4" />Approve</Button><Button size="sm" variant="destructive" onClick={() => void updateStatus(item, 'Rejected')} disabled={busyId === item.id}><X className="mr-1 h-4 w-4" />Reject</Button><Button size="sm" variant="outline" onClick={() => void updateStatus(item, 'Ignored')} disabled={busyId === item.id}>Ignore</Button></div></div></div>)}
      <div className="flex items-center justify-between border-t pt-4 text-sm text-muted-foreground"><span>{totalCount} pending · Page {page} of {totalPages}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div></CardContent></Card>
    <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Approve intent suggestion</DialogTitle><DialogDescription>Edit the mapping and keywords. Nothing publishes until approval.</DialogDescription></DialogHeader><div className="space-y-4"><div><label className="mb-1 block text-sm font-medium">Existing intent</label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={intentId} onChange={(event) => setIntentId(event.target.value)}><option value="">Create a new intent</option>{intents.map((intent) => <option key={intent.id} value={intent.id}>{intent.intentNameEn} ({intent.intentCode})</option>)}</select></div>{!intentId && <div className="grid gap-3 sm:grid-cols-2"><div><label className="mb-1 block text-sm font-medium">Intent code</label><Input value={intentCode} onChange={(event) => setIntentCode(event.target.value)} /></div><div><label className="mb-1 block text-sm font-medium">English name</label><Input value={intentNameEn} onChange={(event) => setIntentNameEn(event.target.value)} /></div><div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium">Arabic name</label><Input dir="rtl" value={intentNameAr} onChange={(event) => setIntentNameAr(event.target.value)} /></div></div>}<div><label className="mb-1 block text-sm font-medium">English keywords (comma separated)</label><Textarea value={keywordsEn} onChange={(event) => setKeywordsEn(event.target.value)} /></div><div><label className="mb-1 block text-sm font-medium">Arabic keywords (comma separated)</label><Textarea dir="rtl" value={keywordsAr} onChange={(event) => setKeywordsAr(event.target.value)} /></div><div><label className="mb-1 block text-sm font-medium">Review notes</label><Textarea value={reviewNotes} onChange={(event) => setReviewNotes(event.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button><Button onClick={() => void approve()} disabled={busyId === selected?.id}>Approve and publish</Button></DialogFooter></DialogContent></Dialog>
  </>;
};
