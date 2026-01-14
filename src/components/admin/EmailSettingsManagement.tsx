import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Mail, RefreshCw, Save, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { useEmailSender } from '../../hooks/useEmailSender';
import { emailSettingsService, type EmailSettingsDto } from '../../services/emailSettingsService';
import { cn } from '../../lib/utils';
import type { ApiError } from '../../types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';

const normalizeBcc = (value: string): string => {
  // Keep as a comma-separated string, but normalize whitespace.
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .join(', ');
};

const parseOptionalNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
};

const formatApiErrors = (err: unknown): string | null => {
  const apiErr = err as Partial<ApiError>;
  if (!apiErr || typeof apiErr !== 'object') return null;

  const errors = apiErr.errors;
  if (!errors || typeof errors !== 'object') return null;

  const lines: string[] = [];
  for (const [field, messages] of Object.entries(errors)) {
    if (Array.isArray(messages) && messages.length > 0) {
      lines.push(`${field}: ${messages.join(', ')}`);
    }
  }

  return lines.length > 0 ? lines.join(' | ') : null;
};

export const EmailSettingsManagement: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  const {
    sendTestEmail,
    loading: testEmailLoading,
    error: testEmailError,
    clearError: clearTestEmailError,
  } = useEmailSender();

  const title = isArabic ? 'إعدادات البريد الإلكتروني' : 'Email Settings';
  const subtitle = isArabic
    ? 'تحديث معلومات المرسل وإعدادات SMTP/IMAP'
    : 'Update sender info and SMTP/IMAP configuration';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<EmailSettingsDto[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<EmailSettingsDto | null>(null);
  const [smtpPassword, setSmtpPassword] = useState('');
  const [imapPassword, setImapPassword] = useState('');
  const [testRecipientEmail, setTestRecipientEmail] = useState('');

  const selected = useMemo(() => {
    if (selectedId == null) return null;
    return settings.find((s) => s.id === selectedId) ?? null;
  }, [settings, selectedId]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await emailSettingsService.getAll();
      setSettings(list);

      const nextSelectedId =
        selectedId != null && list.some((s) => s.id === selectedId)
          ? selectedId
          : list.find((s) => s.isDefault)?.id ?? list[0]?.id ?? null;

      setSelectedId(nextSelectedId);

      const initial = list.find((s) => s.id === nextSelectedId) ?? null;
      setDraft(initial);
    } catch (err: any) {
      console.error('Failed to load email settings:', err);
      setError(err?.message || (isArabic ? 'فشل تحميل البيانات' : 'Failed to load settings'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft(selected);
    setSmtpPassword('');
    setImapPassword('');
  }, [selected]);

  const hasChanges = useMemo(() => {
    if (!selected || !draft) return false;
    return JSON.stringify(selected) !== JSON.stringify(draft);
  }, [selected, draft]);

  const updateDraft = <K extends keyof EmailSettingsDto>(key: K, value: EmailSettingsDto[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!draft) return;

    // Keep this lightweight; we mostly update sender-related info, but we send a full object.
    if (!draft.senderEmail?.trim() || !draft.senderName?.trim()) {
      toast.error(isArabic ? 'الرجاء إدخال اسم المرسل وبريده الإلكتروني' : 'Please provide sender name and email');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<EmailSettingsDto> = {
        // Keep payload focused on fields the API is likely to accept.
        id: draft.id,
        name: draft.name,
        description: draft.description ?? null,
        isEnabled: draft.isEnabled,
        isDefault: draft.isDefault,

        imapServer: draft.imapServer,
        imapPort: draft.imapPort,
        imapUseSsl: draft.imapUseSsl,
        imapUsername: draft.imapUsername,

        smtpServer: draft.smtpServer,
        smtpPort: draft.smtpPort,
        smtpUseSsl: draft.smtpUseSsl,
        smtpUseStartTls: draft.smtpUseStartTls,
        smtpUsername: draft.smtpUsername,

        senderName: draft.senderName,
        senderEmail: draft.senderEmail,
        replyToEmail: (draft.replyToEmail ?? '').trim() ? draft.replyToEmail : null,
        bccEmails: (draft.bccEmails ?? '').trim() ? normalizeBcc(draft.bccEmails ?? '') : null,

        maxEmailsPerHour: draft.maxEmailsPerHour ?? null,
        timeoutSeconds: draft.timeoutSeconds ?? null,
      };

      // Only send passwords if user explicitly provides them.
      if (smtpPassword.trim()) {
        payload.smtpPassword = smtpPassword;
      }
      if (imapPassword.trim()) {
        payload.imapPassword = imapPassword;
      }

      await emailSettingsService.save(payload);

      toast.success(isArabic ? 'تم حفظ الإعدادات' : 'Settings saved', {
        description: isArabic ? 'تم تحديث بيانات البريد الإلكتروني بنجاح.' : 'Email sender information updated successfully.',
        duration: 2500,
      });

      await load();
    } catch (err: any) {
      console.error('Failed to save email settings:', err);
      const details = formatApiErrors(err);
      toast.error(isArabic ? 'فشل الحفظ' : 'Save failed', {
        description:
          details || err?.message || (isArabic ? 'حدث خطأ غير متوقع' : 'Unexpected error'),
        duration: 3500,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!draft) return;

    const email = (testRecipientEmail || '').trim();
    if (!email || !email.includes('@')) {
      toast.error(isArabic ? 'الرجاء إدخال بريد صحيح للاختبار' : 'Please enter a valid test recipient email');
      return;
    }

    clearTestEmailError();
    try {
      const result = await sendTestEmail({ emailSettingsId: draft.id, testRecipientEmail: email });
      if (result.success) {
        toast.success(isArabic ? 'تم إرسال البريد التجريبي' : 'Test email sent', {
          description: result.message,
          duration: 3000,
        });
      } else {
        toast.error(isArabic ? 'فشل إرسال البريد التجريبي' : 'Test email failed', {
          description: (result.errors || []).join(' | ') || result.message,
          duration: 4000,
        });
      }
    } catch (err: any) {
      toast.error(isArabic ? 'فشل إرسال البريد التجريبي' : 'Failed to send test email', {
        description: err?.message || (isArabic ? 'حدث خطأ غير متوقع' : 'Unexpected error'),
        duration: 4000,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => void load()}
            disabled={loading || saving}
            className="gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', (loading || saving) && 'animate-spin')} />
            {isArabic ? 'تحديث' : 'Refresh'}
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={loading || saving || !draft || !hasChanges}
            className="gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isArabic ? 'حفظ' : 'Save'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">{isArabic ? 'خطأ' : 'Error'}</CardTitle>
            <CardDescription className="text-destructive/80">{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isArabic ? 'الإعدادات المتاحة' : 'Available settings'}</CardTitle>
            <CardDescription>
              {isArabic ? 'اختر إعدادًا للتعديل' : 'Pick one to edit'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isArabic ? 'جارٍ التحميل...' : 'Loading...'}
              </div>
            ) : settings.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                {isArabic ? 'لا توجد إعدادات بريد إلكتروني' : 'No email settings found'}
              </div>
            ) : (
              settings.map((s) => {
                const active = selectedId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedId(s.id)}
                    className={cn(
                      'w-full rounded-xl border px-3 py-3 text-left transition-colors',
                      active
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/60 hover:bg-muted/40'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="font-semibold leading-tight">{s.name}</div>
                        {s.description ? (
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {s.description}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {s.isDefault ? (
                          <Badge variant="secondary">{isArabic ? 'افتراضي' : 'Default'}</Badge>
                        ) : null}
                        {s.isEnabled ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {isArabic ? 'مفعل' : 'Enabled'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <XCircle className="h-3.5 w-3.5" />
                            {isArabic ? 'معطل' : 'Disabled'}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isArabic ? 'تعديل الإعداد' : 'Edit setting'}</CardTitle>
            <CardDescription>
              {draft
                ? isArabic
                  ? `ID: ${draft.id}`
                  : `ID: ${draft.id}`
                : isArabic
                  ? 'اختر إعدادًا من القائمة'
                  : 'Select a setting from the list'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!draft ? (
              <div className="text-sm text-muted-foreground">
                {isArabic ? 'لا يوجد عنصر محدد' : 'No selection'}
              </div>
            ) : (
              <div className="space-y-6">
                {/* General */}
                <div className="space-y-4">
                  <div className="text-sm font-semibold">{isArabic ? 'معلومات عامة' : 'General'}</div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email-settings-name">{isArabic ? 'الاسم' : 'Name'}</Label>
                      <Input
                        id="email-settings-name"
                        value={draft.name ?? ''}
                        onChange={(e) => updateDraft('name', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email-settings-desc">{isArabic ? 'الوصف' : 'Description'}</Label>
                      <Input
                        id="email-settings-desc"
                        value={draft.description ?? ''}
                        onChange={(e) => updateDraft('description', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">{isArabic ? 'مفعل' : 'Enabled'}</div>
                        <div className="text-xs text-muted-foreground">
                          {isArabic ? 'تفعيل/تعطيل استخدام هذا الإعداد' : 'Enable/disable this config'}
                        </div>
                      </div>
                      <Switch
                        checked={Boolean(draft.isEnabled)}
                        onCheckedChange={(checked) => updateDraft('isEnabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">{isArabic ? 'افتراضي' : 'Default'}</div>
                        <div className="text-xs text-muted-foreground">
                          {isArabic ? 'استخدامه كإعداد افتراضي' : 'Use as default sender'}
                        </div>
                      </div>
                      <Switch
                        checked={Boolean(draft.isDefault)}
                        onCheckedChange={(checked) => updateDraft('isDefault', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Sender */}
                <div className="space-y-4">
                  <div className="text-sm font-semibold">{isArabic ? 'بيانات المرسل' : 'Sender'}</div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="senderName">{isArabic ? 'اسم المرسل' : 'Sender name'}</Label>
                      <Input
                        id="senderName"
                        value={draft.senderName ?? ''}
                        onChange={(e) => updateDraft('senderName', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="senderEmail">{isArabic ? 'بريد المرسل' : 'Sender email'}</Label>
                      <Input
                        id="senderEmail"
                        type="email"
                        value={draft.senderEmail ?? ''}
                        onChange={(e) => updateDraft('senderEmail', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="replyToEmail">{isArabic ? 'الرد إلى' : 'Reply-to email'}</Label>
                      <Input
                        id="replyToEmail"
                        type="email"
                        value={draft.replyToEmail ?? ''}
                        onChange={(e) => updateDraft('replyToEmail', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bccEmails">{isArabic ? 'BCC (مفصول بفواصل)' : 'BCC emails (comma-separated)'}</Label>
                      <Input
                        id="bccEmails"
                        value={draft.bccEmails ?? ''}
                        onChange={(e) => updateDraft('bccEmails', e.target.value)}
                        onBlur={(e) => updateDraft('bccEmails', normalizeBcc(e.target.value))}
                        placeholder={isArabic ? 'a@b.com, c@d.com' : 'a@b.com, c@d.com'}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* SMTP */}
                <div className="space-y-4">
                  <div className="text-sm font-semibold">SMTP</div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="smtpServer">{isArabic ? 'خادم SMTP' : 'SMTP server'}</Label>
                      <Input
                        id="smtpServer"
                        value={draft.smtpServer ?? ''}
                        onChange={(e) => updateDraft('smtpServer', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">{isArabic ? 'منفذ SMTP' : 'SMTP port'}</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={String(draft.smtpPort ?? 0)}
                        onChange={(e) => updateDraft('smtpPort', Number(e.target.value || 0))}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="smtpUsername">{isArabic ? 'اسم المستخدم' : 'Username'}</Label>
                      <Input
                        id="smtpUsername"
                        type="email"
                        value={draft.smtpUsername ?? ''}
                        onChange={(e) => updateDraft('smtpUsername', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-3">
                      <Label htmlFor="smtpPassword">
                        {isArabic ? 'كلمة مرور SMTP' : 'SMTP password'}
                      </Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                        placeholder={
                          isArabic
                            ? 'اتركها فارغة للاحتفاظ بالكلمة الحالية'
                            : 'Leave blank to keep current password'
                        }
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2 md:col-span-1">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">SSL</div>
                        <div className="text-xs text-muted-foreground">{isArabic ? 'استخدم SSL' : 'Use SSL'}</div>
                      </div>
                      <Switch
                        checked={Boolean(draft.smtpUseSsl)}
                        onCheckedChange={(checked) => updateDraft('smtpUseSsl', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2 md:col-span-1">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">StartTLS</div>
                        <div className="text-xs text-muted-foreground">{isArabic ? 'استخدم StartTLS' : 'Use StartTLS'}</div>
                      </div>
                      <Switch
                        checked={Boolean(draft.smtpUseStartTls)}
                        onCheckedChange={(checked) => updateDraft('smtpUseStartTls', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold">{isArabic ? 'بريد تجريبي' : 'Test email'}</div>
                      <div className="text-xs text-muted-foreground">
                        {isArabic
                          ? 'أرسل بريدًا تجريبيًا للتأكد من عمل SMTP.'
                          : 'Send a test email to verify SMTP is working.'}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleSendTestEmail()}
                      disabled={!draft || saving || loading || testEmailLoading}
                      className="gap-2"
                    >
                      {testEmailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      {isArabic ? 'إرسال اختبار' : 'Send test'}
                    </Button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div className="space-y-2">
                      <Label htmlFor="testRecipientEmail">{isArabic ? 'بريد المستلم للاختبار' : 'Test recipient email'}</Label>
                      <Input
                        id="testRecipientEmail"
                        type="email"
                        value={testRecipientEmail}
                        onChange={(e) => setTestRecipientEmail(e.target.value)}
                        placeholder={isArabic ? 'example@domain.com' : 'example@domain.com'}
                      />
                    </div>
                  </div>

                  {testEmailError ? (
                    <div className="mt-2 text-xs text-destructive">{testEmailError}</div>
                  ) : null}
                </div>

                <Separator />

                {/* IMAP */}
                <div className="space-y-4">
                  <div className="text-sm font-semibold">IMAP</div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="imapServer">{isArabic ? 'خادم IMAP' : 'IMAP server'}</Label>
                      <Input
                        id="imapServer"
                        value={draft.imapServer ?? ''}
                        onChange={(e) => updateDraft('imapServer', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imapPort">{isArabic ? 'منفذ IMAP' : 'IMAP port'}</Label>
                      <Input
                        id="imapPort"
                        type="number"
                        value={String(draft.imapPort ?? 0)}
                        onChange={(e) => updateDraft('imapPort', Number(e.target.value || 0))}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="imapUsername">{isArabic ? 'اسم المستخدم' : 'Username'}</Label>
                      <Input
                        id="imapUsername"
                        type="email"
                        value={draft.imapUsername ?? ''}
                        onChange={(e) => updateDraft('imapUsername', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-3">
                      <Label htmlFor="imapPassword">
                        {isArabic ? 'كلمة مرور IMAP' : 'IMAP password'}
                      </Label>
                      <Input
                        id="imapPassword"
                        type="password"
                        value={imapPassword}
                        onChange={(e) => setImapPassword(e.target.value)}
                        placeholder={
                          isArabic
                            ? 'اتركها فارغة للاحتفاظ بالكلمة الحالية'
                            : 'Leave blank to keep current password'
                        }
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2 md:col-span-1">
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium">SSL</div>
                        <div className="text-xs text-muted-foreground">{isArabic ? 'استخدم SSL' : 'Use SSL'}</div>
                      </div>
                      <Switch
                        checked={Boolean(draft.imapUseSsl)}
                        onCheckedChange={(checked) => updateDraft('imapUseSsl', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Advanced */}
                <div className="space-y-4">
                  <div className="text-sm font-semibold">{isArabic ? 'متقدم' : 'Advanced'}</div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="maxEmailsPerHour">{isArabic ? 'حد الإرسال بالساعة' : 'Max emails per hour'}</Label>
                      <Input
                        id="maxEmailsPerHour"
                        type="number"
                        value={draft.maxEmailsPerHour ?? ''}
                        onChange={(e) => updateDraft('maxEmailsPerHour', parseOptionalNumber(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeoutSeconds">{isArabic ? 'مهلة (ثواني)' : 'Timeout (seconds)'}</Label>
                      <Input
                        id="timeoutSeconds"
                        type="number"
                        value={draft.timeoutSeconds ?? ''}
                        onChange={(e) => updateDraft('timeoutSeconds', parseOptionalNumber(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
