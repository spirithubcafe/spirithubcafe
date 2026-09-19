import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, BarChart3, Edit, Loader2, Megaphone, MoreHorizontal, Plus, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../hooks/useApp';
import { useAuth } from '../../hooks/useAuth';
import { hasPermission } from '../../lib/authPermissions';
import { formatCampaignSchedule, getApiErrorMessage, getCampaignDisplayStatus } from '../../lib/marketingCampaignUtils';
import { marketingCampaignService } from '../../services/marketingCampaignService';
import { CAMPAIGN_TYPES, MARKETING_CAMPAIGN_PERMISSION, type MarketingCampaignAdmin, type MarketingCampaignDisplayStatus } from '../../types/marketingCampaign';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type PendingAction = { kind: 'activate' | 'deactivate' | 'archive'; campaign: MarketingCampaignAdmin } | null;
const statusVariant = (status: MarketingCampaignDisplayStatus): 'default' | 'secondary' | 'destructive' | 'outline' =>
  status === 'ACTIVE' ? 'default' : status === 'ARCHIVED' || status === 'ENDED' ? 'destructive' : status === 'SCHEDULED' ? 'outline' : 'secondary';

export function MarketingCampaignsManagement() {
  const { t, language } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const authorized = hasPermission(MARKETING_CAMPAIGN_PERMISSION, user?.roles);
  const [campaigns, setCampaigns] = useState<MarketingCampaignAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    if (!authorized) { setLoading(false); return; }
    setLoading(true); setError('');
    try { setCampaigns(await marketingCampaignService.getAll()); }
    catch (requestError) { setError(getApiErrorMessage(requestError, t('admin.marketingCampaigns.loadError'))); }
    finally { setLoading(false); }
  }, [authorized, t]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => campaigns.filter((campaign) => {
    const displayStatus = getCampaignDisplayStatus(campaign);
    const query = search.trim().toLowerCase();
    return (!query || campaign.name.toLowerCase().includes(query) || campaign.campaignType.toLowerCase().includes(query)) &&
      (status === 'ALL' || displayStatus === status) && (type === 'ALL' || campaign.campaignType === type);
  }), [campaigns, search, status, type]);

  const runAction = async () => {
    if (!pendingAction) return;
    setWorking(true);
    try {
      const response = pendingAction.kind === 'archive'
        ? await marketingCampaignService.archive(pendingAction.campaign.id)
        : pendingAction.kind === 'activate'
          ? await marketingCampaignService.activate(pendingAction.campaign.id)
          : await marketingCampaignService.deactivate(pendingAction.campaign.id);
      toast.success(response.message || t(`admin.marketingCampaigns.${pendingAction.kind}Success`));
      setPendingAction(null);
      await load();
    } catch (requestError) {
      toast.error(getApiErrorMessage(requestError, t('admin.marketingCampaigns.actionError')));
    } finally { setWorking(false); }
  };

  if (!authorized) return <Alert variant="destructive"><AlertTitle>{t('admin.marketingCampaigns.notAuthorized')}</AlertTitle><AlertDescription>{t('admin.marketingCampaigns.permissionRequired')}</AlertDescription></Alert>;

  const actions = (campaign: MarketingCampaignAdmin) => {
    const archived = Boolean(campaign.archivedAt);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={t('admin.marketingCampaigns.actions')}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={archived} onSelect={() => navigate(`${campaign.id}/edit`)}><Edit className="me-2 h-4 w-4" />{t('admin.marketingCampaigns.edit')}</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate(`${campaign.id}/edit?tab=analytics`)}><BarChart3 className="me-2 h-4 w-4" />{t('admin.marketingCampaigns.analytics')}</DropdownMenuItem>
          {!archived && <DropdownMenuItem onSelect={() => setPendingAction({ kind: campaign.isActive ? 'deactivate' : 'activate', campaign })}>{campaign.isActive ? t('admin.marketingCampaigns.deactivate') : t('admin.marketingCampaigns.activate')}</DropdownMenuItem>}
          {!archived && <DropdownMenuSeparator />}
          {!archived && <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setPendingAction({ kind: 'archive', campaign })}><Archive className="me-2 h-4 w-4" />{t('admin.marketingCampaigns.archive')}</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Megaphone className="h-6 w-6" /></div><div><h1 className="text-2xl font-bold">{t('admin.marketingCampaigns.title')}</h1><p className="text-sm text-muted-foreground">{t('admin.marketingCampaigns.description')}</p></div></div>
        <Button onClick={() => navigate('new')}><Plus className="me-2 h-4 w-4" />{t('admin.marketingCampaigns.newCampaign')}</Button>
      </div>

      <Card><CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_200px_220px_auto]">
        <div className="relative"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('admin.marketingCampaigns.search')} className="ps-9" /></div>
        <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['ALL','ACTIVE','INACTIVE','SCHEDULED','ENDED','ARCHIVED'].map((value) => <SelectItem key={value} value={value}>{t(`admin.marketingCampaigns.status.${value.toLowerCase()}`)}</SelectItem>)}</SelectContent></Select>
        <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">{t('admin.marketingCampaigns.allTypes')}</SelectItem>{CAMPAIGN_TYPES.map((value) => <SelectItem key={value} value={value}>{t(`admin.marketingCampaigns.types.${value}`)}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" size="icon" onClick={() => void load()} aria-label={t('admin.marketingCampaigns.refresh')}><RefreshCw className="h-4 w-4" /></Button>
      </CardContent></Card>

      {error && <Alert variant="destructive"><AlertTitle>{t('admin.marketingCampaigns.loadError')}</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
      {loading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : filtered.length === 0 ? <Card><CardContent className="py-14 text-center text-muted-foreground">{t('admin.marketingCampaigns.empty')}</CardContent></Card> : <>
        <div className="space-y-3 md:hidden">{filtered.map((campaign) => { const displayStatus = getCampaignDisplayStatus(campaign); return <Card key={campaign.id}><CardContent className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-semibold">{campaign.name}</h2><p className="mt-1 text-sm text-muted-foreground">{t(`admin.marketingCampaigns.types.${campaign.campaignType}`)}</p></div>{actions(campaign)}</div><div className="mt-4 flex flex-wrap items-center gap-2"><Badge variant={statusVariant(displayStatus)}>{t(`admin.marketingCampaigns.status.${displayStatus.toLowerCase()}`)}</Badge><Badge variant="outline">{t('admin.marketingCampaigns.priority')}: {campaign.priority}</Badge></div><p className="mt-3 text-xs text-muted-foreground">{formatCampaignSchedule(campaign.startDateUtc, campaign.endDateUtc, language === 'ar' ? 'ar-OM' : 'en-OM')}</p></CardContent></Card>; })}</div>
        <div className="hidden overflow-hidden rounded-md border md:block"><Table><TableHeader><TableRow><TableHead>{t('admin.marketingCampaigns.campaign')}</TableHead><TableHead>{t('admin.marketingCampaigns.type')}</TableHead><TableHead>{t('admin.marketingCampaigns.statusLabel')}</TableHead><TableHead>{t('admin.marketingCampaigns.schedule')}</TableHead><TableHead>{t('admin.marketingCampaigns.priority')}</TableHead><TableHead className="w-16">{t('admin.marketingCampaigns.actions')}</TableHead></TableRow></TableHeader><TableBody>{filtered.map((campaign) => { const displayStatus = getCampaignDisplayStatus(campaign); return <TableRow key={campaign.id}><TableCell className="font-medium">{campaign.name}</TableCell><TableCell>{t(`admin.marketingCampaigns.types.${campaign.campaignType}`)}</TableCell><TableCell><Badge variant={statusVariant(displayStatus)}>{t(`admin.marketingCampaigns.status.${displayStatus.toLowerCase()}`)}</Badge></TableCell><TableCell className="max-w-xs text-sm text-muted-foreground">{formatCampaignSchedule(campaign.startDateUtc, campaign.endDateUtc, language === 'ar' ? 'ar-OM' : 'en-OM')}</TableCell><TableCell>{campaign.priority}</TableCell><TableCell>{actions(campaign)}</TableCell></TableRow>; })}</TableBody></Table></div>
      </>}

      <AlertDialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{pendingAction?.kind === 'archive' ? t('admin.marketingCampaigns.archiveConfirmTitle') : t(`admin.marketingCampaigns.${pendingAction?.kind}ConfirmTitle`)}</AlertDialogTitle><AlertDialogDescription>{pendingAction?.kind === 'archive' ? t('admin.marketingCampaigns.archiveConfirmDescription') : `${pendingAction?.campaign.name}?`}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={working}>{t('admin.marketingCampaigns.cancel')}</AlertDialogCancel><AlertDialogAction disabled={working} onClick={(event) => { event.preventDefault(); void runAction(); }}>{working && <Loader2 className="me-2 h-4 w-4 animate-spin" />}{pendingAction?.kind === 'archive' ? t('admin.marketingCampaigns.archive') : t(`admin.marketingCampaigns.${pendingAction?.kind}`)}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}
