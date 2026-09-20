import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, BarChart3, CheckCircle2, ImagePlus, Loader2, Mail, Save, Send, ShieldCheck, Users } from 'lucide-react';
import { useEmailSender } from '../../hooks/useEmailSender';
import { safeStorage } from '../../lib/safeStorage';
import { newsletterService, type NewsletterSubscriptionDto } from '../../services/newsletterService';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { emailService } from '../../services/emailService';

const STORAGE_KEY = 'admin.email-campaigns.v1';

interface CampaignRecord {
  id: string;
  subject: string;
  htmlBody: string;
  status: 'Draft' | 'Sent' | 'Partially sent' | 'Failed';
  recipientCount: number;
  successfulCount: number;
  failedCount: number;
  createdAt: string;
  sentAt?: string;
}

const readCampaigns = (): CampaignRecord[] => safeStorage.getJson<CampaignRecord[]>(STORAGE_KEY) ?? [];

export const EmailCampaignManagement: React.FC = () => {
  const { sendBulkEmail, loading: sending, error: sendError, clearError } = useEmailSender();
  const [subscribers, setSubscribers] = useState<NewsletterSubscriptionDto[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [recipientsText, setRecipientsText] = useState('');
  const [senderEmail, setSenderEmail] = useState('hello@spirithubcafe.com');
  const [previewText, setPreviewText] = useState('');
  const [confirmedOptIn, setConfirmedOptIn] = useState(false);
  const [confirmedTest, setConfirmedTest] = useState(false);
  const [delayMs, setDelayMs] = useState(1200);
  const [scheduleAt, setScheduleAt] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'dark'>('desktop');
  const [sourceMode, setSourceMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>(readCampaigns);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingSubscribers(true);
      try {
        const first = await newsletterService.getSubscriptions({ page: 1, pageSize: 100, isActive: true });
        const pages = Math.ceil(first.totalCount / 100);
        const remaining = await Promise.all(
          Array.from({ length: Math.max(0, pages - 1) }, (_, index) =>
            newsletterService.getSubscriptions({ page: index + 2, pageSize: 100, isActive: true })
          )
        );
        if (!cancelled) {
          const active = [first, ...remaining].flatMap((response) => response.items);
          setSubscribers(active);
          setRecipientsText(active.map((item) => [item.email, item.name || ''].join(', ')).join('\n'));
        }
      } catch {
        if (!cancelled) setNotice('Active newsletter subscribers could not be loaded.');
      } finally {
        if (!cancelled) setLoadingSubscribers(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const persistCampaigns = (next: CampaignRecord[]) => {
    setCampaigns(next);
    safeStorage.setJson(STORAGE_KEY, next);
  };

  const saveDraft = () => {
    if (!subject.trim() && !htmlBody.trim()) return;
    const draft: CampaignRecord = {
      id: crypto.randomUUID(), subject: subject.trim(), htmlBody, status: 'Draft',
      recipientCount: subscribers.length, successfulCount: 0, failedCount: 0,
      createdAt: new Date().toISOString(),
    };
    persistCampaigns([draft, ...campaigns]);
    setNotice('Campaign draft saved in this browser.');
  };

  const sendCampaign = async () => {
    clearError();
    setNotice(null);
    if (!subject.trim() || !htmlBody.trim()) {
      setNotice('Enter both a subject and email content.');
      return;
    }
    if (!confirmedOptIn || !confirmedTest) {
      setNotice('Confirm recipient consent and that you tested the newsletter first.');
      return;
    }
    const recipients = parseRecipients(recipientsText);
    if (recipients.length === 0) return setNotice('Add at least one valid recipient.');
    try {
      const result = await sendBulkEmail({
        recipients, subject: subject.trim(), body: withPreviewText(htmlBody, previewText), isHtml: true, delayBetweenEmailsMs: delayMs,
      });
      const status: CampaignRecord['status'] = result.failedCount === 0
        ? 'Sent'
        : result.successfulCount > 0 ? 'Partially sent' : 'Failed';
      const record: CampaignRecord = {
        id: crypto.randomUUID(), subject: subject.trim(), htmlBody, status,
        recipientCount: recipients.length, successfulCount: result.successfulCount,
        failedCount: result.failedCount, createdAt: new Date().toISOString(), sentAt: result.sentAt,
      };
      persistCampaigns([record, ...campaigns]);
      setNotice(`${result.successfulCount} delivered; ${result.failedCount} failed.`);
    } catch {
      // useEmailSender exposes the API error through sendError.
    }
  };

  const runEditorCommand = (command: string, value?: string) => {
    if (sourceMode) {
      setSourceMode(false);
      requestAnimationFrame(() => {
        if (editorRef.current) editorRef.current.innerHTML = htmlBody;
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        setHtmlBody(editorRef.current?.innerHTML || '');
      });
      return;
    }
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    setHtmlBody(editorRef.current?.innerHTML || '');
  };

  const promptCommand = (command: 'createLink' | 'insertImage') => {
    const value = window.prompt(command === 'createLink' ? 'Enter link URL' : 'Enter image URL');
    if (value) runEditorCommand(command, value);
  };

  const insertTable = () => runEditorCommand('insertHTML', '<table style="width:100%;border-collapse:collapse"><tbody><tr><td style="border:1px solid #d1d5db;padding:8px">Cell</td><td style="border:1px solid #d1d5db;padding:8px">Cell</td></tr></tbody></table><p><br></p>');

  const toggleSource = () => {
    if (sourceMode) {
      const cleaned = cleanEmailHtml(htmlBody);
      setHtmlBody(cleaned);
      requestAnimationFrame(() => { if (editorRef.current) editorRef.current.innerHTML = cleaned; });
    }
    else setHtmlBody(editorRef.current?.innerHTML || htmlBody);
    setSourceMode((current) => !current);
  };

  const loadEditorHtml = (value: string) => {
    setHtmlBody(value);
    if (editorRef.current) editorRef.current.innerHTML = value;
  };

  const sendTest = async () => {
    if (!senderEmail || !subject || !htmlBody) return setNotice('Enter sender/test email, subject, and message first.');
    try {
      const result = await emailService.sendSingleEmail({ toEmail: senderEmail, subject, body: withPreviewText(htmlBody, previewText), isHtml: true });
      setNotice(result.message || 'Test email sent.');
    } catch (error: any) { setNotice(error?.message || 'Test email failed.'); }
  };

  const spamCheck = () => {
    const matches = (subject + ' ' + htmlBody).match(/\b(free|guaranteed|urgent|winner|buy now|act now)\b/gi) || [];
    setNotice(matches.length ? `Spam check found ${matches.length} risky phrase(s): ${[...new Set(matches)].join(', ')}` : 'Spam check passed: no common risky phrases found.');
  };

  const selectedCampaign = campaigns.find((campaign) => campaign.sentAt) ?? campaigns[0];
  const deliveryRate = selectedCampaign?.recipientCount
    ? Math.round((selectedCampaign.successfulCount / selectedCampaign.recipientCount) * 100)
    : 0;
  const recentCampaigns = useMemo(() => campaigns.slice(0, 12), [campaigns]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email Management System</h1>
        <p className="text-muted-foreground">Create newsletters, send to active subscribers, and review delivery results.</p>
      </div>

      {(notice || sendError) && (
        <Alert variant={sendError ? 'destructive' : 'default'}>
          {sendError ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          <AlertDescription>{sendError || notice}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">Email Settings</TabsTrigger>
          <TabsTrigger value="single">Send Single Email</TabsTrigger>
          <TabsTrigger value="compose">Newsletter / Bulk Email</TabsTrigger>
          <TabsTrigger value="analytics">Campaign Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="settings"><Card><CardHeader><CardTitle>Email Settings</CardTitle><CardDescription>Manage sender, SMTP, and IMAP configuration.</CardDescription></CardHeader><CardContent><Button asChild variant="outline"><a href="/om/admin/email-settings">Open Email Settings</a></Button></CardContent></Card></TabsContent>
        <TabsContent value="single"><Card><CardHeader><CardTitle>Send Single Email</CardTitle><CardDescription>Enter the test recipient in Verified Sender / Email, compose the campaign, then use Send Test.</CardDescription></CardHeader><CardContent><Button onClick={() => void sendTest()}><Send className="mr-2 h-4 w-4" />Send Test Email</Button></CardContent></Card></TabsContent>

        <TabsContent value="compose" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex gap-2"><Users className="h-4 w-4" />Active subscribers</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{loadingSubscribers ? '…' : subscribers.length}</CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex gap-2"><Mail className="h-4 w-4" />Campaigns</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{campaigns.length}</CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex gap-2"><CheckCircle2 className="h-4 w-4" />Last delivery rate</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{deliveryRate}%</CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Newsletter / Bulk Email</CardTitle><CardDescription>Full campaign composer matching the original email management tool.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/70 p-4 dark:bg-blue-950/20">
                <label className="flex items-center gap-2 font-medium"><Checkbox checked />Send as newsletter</label>
                <div className="grid gap-3 md:grid-cols-[1fr_auto]"><div className="space-y-2"><Label>Verified Sender Domain / Email *</Label><Input value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} /></div><Button className="self-end" variant="secondary" onClick={() => setRecipientsText(subscribers.map((s) => `${s.email}, ${s.name || ''}`).join('\n'))}>Load Active Subscribers</Button></div>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={confirmedOptIn} onCheckedChange={(v) => setConfirmedOptIn(Boolean(v))} />Recipients are active newsletter subscribers or otherwise opted in</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={confirmedTest} onCheckedChange={(v) => setConfirmedTest(Boolean(v))} />I tested this newsletter with my own email first</label>
                <p className="text-xs text-muted-foreground">Supported tokens: {'{Name}'}, {'{FirstName}'}, {'{LastName}'}, {'{Email}'}, {'{Phone}'}, {'{Country}'}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 dark:bg-blue-950/20"><div className="flex justify-between"><div><p className="font-semibold">Campaign Drafts</p><p className="text-sm text-muted-foreground">{campaigns.length ? `${campaigns.length} saved campaign(s).` : 'No drafts saved yet.'}</p></div><Button size="sm" variant="secondary" onClick={() => setCampaigns(readCampaigns())}>Refresh</Button></div></div>
              <div className="space-y-2"><Label>Recipients *</Label><Textarea value={recipientsText} onChange={(e) => setRecipientsText(e.target.value)} rows={7} placeholder="email@example.com, FirstName, LastName, Phone, Country" /><p className="text-xs text-muted-foreground">One recipient per line. Duplicate and invalid emails are skipped.</p></div>
              <div className="space-y-2"><Label htmlFor="campaign-subject">Subject</Label><Input id="campaign-subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Newsletter subject" /></div>
              <div className="space-y-2"><Label>Preview Text *</Label><Input value={previewText} onChange={(e) => setPreviewText(e.target.value)} placeholder="Inbox preview text" /></div>
              <div className="space-y-2">
                <Label>Message *</Label>
                <div className="overflow-hidden rounded-lg border border-indigo-400">
                  <div className="flex flex-wrap items-center gap-1 border-b bg-muted/50 p-2">
                    <EditorButton label="<>" title="HTML source" onClick={toggleSource} active={sourceMode} />
                    <EditorButton label="↶" title="Undo" onClick={() => runEditorCommand('undo')} />
                    <EditorButton label="↷" title="Redo" onClick={() => runEditorCommand('redo')} />
                    <select className="h-8 rounded border bg-background px-2 text-xs" defaultValue="p" onChange={(e) => runEditorCommand('formatBlock', e.target.value)}><option value="p">Paragraph</option><option value="h1">Heading 1</option><option value="h2">Heading 2</option><option value="h3">Heading 3</option><option value="blockquote">Quote</option></select>
                    <EditorButton label="B" title="Bold" onClick={() => runEditorCommand('bold')} strong />
                    <EditorButton label="I" title="Italic" onClick={() => runEditorCommand('italic')} italic />
                    <EditorButton label="U" title="Underline" onClick={() => runEditorCommand('underline')} underline />
                    <EditorButton label="S" title="Strikethrough" onClick={() => runEditorCommand('strikeThrough')} strike />
                    <EditorButton label="x₂" title="Subscript" onClick={() => runEditorCommand('subscript')} />
                    <EditorButton label="x²" title="Superscript" onClick={() => runEditorCommand('superscript')} />
                    <EditorButton label="Tx" title="Clear formatting" onClick={() => runEditorCommand('removeFormat')} />
                    <EditorButton label="≡←" title="Align left" onClick={() => runEditorCommand('justifyLeft')} />
                    <EditorButton label="≡" title="Align center" onClick={() => runEditorCommand('justifyCenter')} />
                    <EditorButton label="→≡" title="Align right" onClick={() => runEditorCommand('justifyRight')} />
                    <EditorButton label="☰" title="Justify" onClick={() => runEditorCommand('justifyFull')} />
                    <EditorButton label="• List" title="Bullet list" onClick={() => runEditorCommand('insertUnorderedList')} />
                    <EditorButton label="1. List" title="Numbered list" onClick={() => runEditorCommand('insertOrderedList')} />
                    <EditorButton label=">" title="Indent" onClick={() => runEditorCommand('indent')} />
                    <EditorButton label="<" title="Outdent" onClick={() => runEditorCommand('outdent')} />
                    <EditorButton label="🔗" title="Insert link" onClick={() => promptCommand('createLink')} />
                    <EditorButton label="⛓×" title="Remove link" onClick={() => runEditorCommand('unlink')} />
                    <EditorButton label="▣" title="Insert image" onClick={() => promptCommand('insertImage')} />
                    <EditorButton label="Table" title="Insert table" onClick={insertTable} />
                    <EditorButton label="“”" title="Block quote" onClick={() => runEditorCommand('formatBlock', 'blockquote')} />
                    <EditorButton label="—" title="Horizontal line" onClick={() => runEditorCommand('insertHorizontalRule')} />
                  </div>
                  <div className="grid min-h-[390px] lg:grid-cols-2">
                    {sourceMode ? <Textarea value={htmlBody} onChange={(e) => setHtmlBody(e.target.value)} className="min-h-[390px] resize-none rounded-none border-0 font-mono text-sm focus-visible:ring-0" /> : <div ref={editorRef} contentEditable suppressContentEditableWarning onInput={(e) => setHtmlBody(e.currentTarget.innerHTML)} className="min-h-[390px] p-4 outline-none empty:before:text-muted-foreground empty:before:content-['Email_content']" />}
                    <div className={previewMode === 'dark' ? 'bg-slate-950 p-3' : 'bg-slate-100 p-3'}><div className={`mx-auto h-full overflow-auto rounded border bg-white ${previewMode === 'mobile' ? 'max-w-[390px]' : ''}`}><div className="border-b px-3 py-2 text-xs capitalize">{previewMode}<span className="float-right">customer@example.com</span></div><iframe title="Newsletter preview" sandbox="" className="h-[345px] w-full" srcDoc={previewDocument(htmlBody, previewText, previewMode)} /></div></div>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3"><div className="space-y-2"><Label>Delay Preset</Label><Select value={String(delayMs)} onValueChange={(v) => setDelayMs(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="500">Fast: 500ms</SelectItem><SelectItem value="1200">Normal: 1200ms</SelectItem><SelectItem value="3000">Safe: 3000ms</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Delay Between Emails (ms)</Label><Input type="number" value={delayMs} onChange={(e) => setDelayMs(Number(e.target.value))} /></div><div className="space-y-2"><Label>Schedule Send</Label><Input type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} /></div></div>
              <div className="space-y-2"><Label>Newsletter Image</Label><div className="flex gap-2"><Input type="file" accept="image/*" /><Button variant="secondary"><ImagePlus className="mr-2 h-4 w-4" />Upload Image</Button></div></div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Metric label="Total" value={parseRecipients(recipientsText).length} /><Metric label="Sent" value={selectedCampaign?.successfulCount || 0} /><Metric label="Failed" value={selectedCampaign?.failedCount || 0} /><Metric label="Remaining" value={sending ? parseRecipients(recipientsText).length : 0} /></div>
              <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/70 p-4 dark:bg-blue-950/20"><h3 className="flex gap-2 font-semibold"><BarChart3 className="h-4 w-4" />Campaign Analytics Dashboard</h3><div className="grid gap-3 lg:grid-cols-2"><div className="rounded border bg-background p-3 space-y-2"><AnalyticsRow label="Open Rate" value="0%" /><AnalyticsRow label="Click Rate" value="0%" /><AnalyticsRow label="Bounce Rate" value={selectedCampaign?.failedCount ? `${Math.round(selectedCampaign.failedCount / selectedCampaign.recipientCount * 100)}%` : '0%'} /><AnalyticsRow label="Unsubscribe Rate" value="0%" /><AnalyticsRow label="Mobile Users" value="Not tracked" /><AnalyticsRow label="Top Link" value="Not tracked" /></div><div className="grid grid-cols-2 gap-3"><Metric label="Opens" value={0} /><Metric label="Clicks" value={0} /><Metric label="Bounces" value={selectedCampaign?.failedCount || 0} /><Metric label="Unsubscribes" value={0} /></div></div><div className="grid gap-3 md:grid-cols-3"><Metric label="Device Stats" value="Not tracked" /><Metric label="Country Stats" value="Not tracked" /><Metric label="Best Clicked Links" value="Not tracked" /></div></div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={saveDraft}><Save className="mr-2 h-4 w-4" />Save draft</Button>
                <Button variant="outline" onClick={() => void sendTest()}>Send Test</Button><Button variant="outline" onClick={() => setPreviewMode('mobile')}>Preview Mobile</Button><Button variant="outline" onClick={() => setPreviewMode('desktop')}>Preview Desktop</Button><Button variant="outline" onClick={() => setPreviewMode('dark')}>Dark Mode Preview</Button><Button variant="outline" onClick={spamCheck}><ShieldCheck className="mr-2 h-4 w-4" />Spam Check</Button><Button variant="secondary" onClick={saveDraft} disabled={!scheduleAt}>Schedule</Button>
                <Button onClick={() => void sendCampaign()} disabled={sending || loadingSubscribers}><>{sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Send Bulk Email</></Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex gap-2"><BarChart3 className="h-5 w-5" />Campaign Analytics Dashboard</CardTitle><CardDescription>Delivery results are recorded now. Open and click tracking require the next backend analytics phase.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {selectedCampaign ? <>
                <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{selectedCampaign.subject || '(No subject)'}</p><p className="text-sm text-muted-foreground">{new Date(selectedCampaign.sentAt || selectedCampaign.createdAt).toLocaleString()}</p></div><Badge>{selectedCampaign.status}</Badge></div>
                <Progress value={deliveryRate} />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Metric label="Recipients" value={selectedCampaign.recipientCount} />
                  <Metric label="Delivered" value={selectedCampaign.successfulCount} />
                  <Metric label="Failed" value={selectedCampaign.failedCount} />
                  <Metric label="Opens / clicks" value="Not tracked" />
                </div>
              </> : <p className="text-sm text-muted-foreground">Send or save a campaign to begin.</p>}
            </CardContent>
          </Card>

          <Card><CardHeader><CardTitle>Recent campaigns</CardTitle></CardHeader><CardContent className="space-y-2">{recentCampaigns.map((campaign) => <button key={campaign.id} type="button" onClick={() => { setSubject(campaign.subject); loadEditorHtml(campaign.htmlBody); }} className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left hover:bg-muted/50"><span className="min-w-0"><span className="block truncate font-medium">{campaign.subject || '(No subject)'}</span><span className="text-xs text-muted-foreground">{new Date(campaign.sentAt || campaign.createdAt).toLocaleString()}</span></span><Badge variant="outline">{campaign.status}</Badge></button>)}</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-lg border bg-muted/20 p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>
);

const EditorButton = ({ label, title, onClick, active, strong, italic, underline, strike }: { label: string; title: string; onClick: () => void; active?: boolean; strong?: boolean; italic?: boolean; underline?: boolean; strike?: boolean }) => (
  <button type="button" title={title} aria-label={title} aria-pressed={active} onMouseDown={(event) => event.preventDefault()} onClick={onClick} className={`h-8 min-w-8 rounded px-2 text-xs hover:bg-muted ${active ? 'bg-primary text-primary-foreground' : ''} ${strong ? 'font-bold' : ''} ${italic ? 'italic' : ''} ${underline ? 'underline' : ''} ${strike ? 'line-through' : ''}`}>{label}</button>
);

const parseRecipients = (text: string) => {
  const seen = new Set<string>();
  return text.split(/\r?\n/).map((line) => line.split(',').map((part) => part.trim())).filter(([email]) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).filter(([email]) => { const key = email.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; }).map(([email, firstName, lastName]) => ({ email, name: [firstName, lastName].filter(Boolean).join(' ') || undefined }));
};

const cleanEmailHtml = (value: string) => value
  .trim()
  .replace(/<(div|p|pre)[^>]*>\s*```(?:html|xml)?\s*<\/\1>/gi, '')
  .replace(/^```(?:html|xml)?\s*/i, '')
  .replace(/\s*```$/i, '')
  .replace(/```(?:html|xml)?/gi, '')
  .trim();

const withPreviewText = (body: string, preview: string) => {
  const cleaned = cleanEmailHtml(body);
  return preview
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preview}</div>${cleaned}`
    : cleaned;
};

const previewDocument = (body: string, preview: string, mode: string) => `<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:16px;font-family:Arial;background:${mode === 'dark' ? '#111827' : '#fff'};color:${mode === 'dark' ? '#f8fafc' : '#111827'};overflow-wrap:anywhere"><main style="max-width:100%;overflow-x:auto">${withPreviewText(body, preview)}</main></body></html>`;

const AnalyticsRow = ({ label, value }: { label: string; value: string }) => <div className="flex justify-between border-b pb-2 text-sm"><span>{label}</span><strong>{value}</strong></div>;
