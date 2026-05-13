import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { FileText, Globe, RefreshCw, RotateCcw, Save, Search, ShieldAlert } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { useRegion } from '../../hooks/useRegion';
import { useAuth } from '../../hooks/useAuth';
import { safeStorage } from '../../lib/safeStorage';
import type { RegionCode } from '../../contexts/RegionContextDefinition';
import type { EmailMessageTemplate } from '../../types/emailTemplate';
import { emailTemplateService } from '../../services/emailTemplateService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';

const getPermissionsFromToken = (): string[] => {
  const token = safeStorage.getItem('accessToken');
  if (!token) return [];

  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as Record<string, unknown>;
    const candidates = [
      payload.permission,
      payload.permissions,
      payload.scope,
      payload.scp,
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/permission'],
    ];

    const values = candidates.flatMap((value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value.map(String);
      if (typeof value === 'string') return value.split(/[,\s]+/).filter(Boolean);
      return [];
    });

    return Array.from(new Set(values));
  } catch {
    return [];
  }
};

export const EmailTemplatesManagement: React.FC = () => {
  const { language } = useApp();
  const { hasRole } = useAuth();
  const isArabic = language === 'ar';
  const { currentRegion, regions } = useRegion();

  const [selectedBranch, setSelectedBranch] = useState<RegionCode>(currentRegion.code);
  const [templates, setTemplates] = useState<EmailMessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<EmailMessageTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const pickKey = (template: EmailMessageTemplate, candidates: string[], fallback: string): string => {
    const found = candidates.find((key) => key in template);
    return found ?? fallback;
  };

  const pickValue = (template: EmailMessageTemplate, candidates: string[]): string => {
    for (const key of candidates) {
      const value = (template as Record<string, unknown>)[key];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }
    return '';
  };

  const hasManagePermission = useMemo(() => {
    if (hasRole('Admin') || hasRole('Administrator')) return true;
    return getPermissionsFromToken().includes('EmailSettings.Manage');
  }, [hasRole]);

  const fetchTemplates = useCallback(async (branch?: RegionCode) => {
    setLoading(true);
    setPermissionDenied(false);
    try {
      const data = await emailTemplateService.getAll(branch ?? selectedBranch);
      setTemplates(data);
      if (data.length > 0) {
        setSelectedId((prev) => prev ?? data[0].id);
      } else {
        setSelectedId(null);
        setActiveTemplate(null);
      }
    } catch (error: any) {
      if (error?.statusCode === 403) {
        setPermissionDenied(true);
        setTemplates([]);
      } else {
        toast.error(isArabic ? 'فشل في تحميل القوالب' : 'Failed to load templates');
      }
    } finally {
      setLoading(false);
    }
  }, [isArabic, selectedBranch]);

  const fetchTemplateDetails = useCallback(async (id: number, branch?: RegionCode) => {
    try {
      const data = await emailTemplateService.getById(id, branch ?? selectedBranch);
      setActiveTemplate(data);
    } catch {
      toast.error(isArabic ? 'فشل في تحميل تفاصيل القالب' : 'Failed to load template details');
    }
  }, [isArabic, selectedBranch]);

  useEffect(() => {
    if (hasManagePermission) {
      void fetchTemplates();
    }
  }, [fetchTemplates, hasManagePermission]);

  useEffect(() => {
    if (selectedId != null && hasManagePermission) {
      void fetchTemplateDetails(selectedId);
    }
  }, [selectedId, fetchTemplateDetails, hasManagePermission]);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((template) => {
      const name = String(template.name ?? '').toLowerCase();
      const key = String(template.templateKey ?? '').toLowerCase();
      const subject = String(template.subject ?? '').toLowerCase();
      return name.includes(q) || key.includes(q) || subject.includes(q);
    });
  }, [searchQuery, templates]);

  const updateField = (key: keyof EmailMessageTemplate, value: unknown) => {
    setActiveTemplate((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!activeTemplate?.id) return;
    setSaving(true);
    try {
      const { id } = activeTemplate;
      const editableBaseKeys = ['templateKey', 'name', 'subject', 'description', 'isActive'];
      const textKey = pickKey(activeTemplate, ['body', 'textBody', 'plainTextBody', 'messageBody'], 'body');
      const htmlKey = pickKey(activeTemplate, ['htmlBody', 'bodyHtml', 'html', 'templateHtml'], 'htmlBody');
      const allowedKeys = Array.from(new Set([...editableBaseKeys, textKey, htmlKey]));

      const payload: Record<string, unknown> = {};
      for (const key of allowedKeys) {
        if (key in activeTemplate) {
          payload[key] = (activeTemplate as Record<string, unknown>)[key];
        }
      }
      const updated = await emailTemplateService.update(id, payload, selectedBranch);
      setActiveTemplate(updated);
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)));
      toast.success(isArabic ? 'تم حفظ القالب' : 'Template saved');
    } catch (error: any) {
      const backendMessage =
        error?.rawData?.message ||
        error?.rawData?.error ||
        error?.message;
      toast.error(
        backendMessage
          ? `${isArabic ? 'فشل حفظ القالب' : 'Failed to save template'}: ${backendMessage}`
          : (isArabic ? 'فشل حفظ القالب' : 'Failed to save template')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!activeTemplate?.id) return;
    const confirmed = window.confirm(
      isArabic ? 'إعادة القالب للإعدادات الافتراضية؟' : 'Reset this template to defaults?'
    );
    if (!confirmed) return;

    setResetting(true);
    try {
      const resetData = await emailTemplateService.reset(activeTemplate.id, selectedBranch);
      setActiveTemplate(resetData);
      setTemplates((prev) => prev.map((t) => (t.id === resetData.id ? { ...t, ...resetData } : t)));
      toast.success(isArabic ? 'تمت إعادة التعيين' : 'Template reset completed');
    } catch {
      toast.error(isArabic ? 'فشلت إعادة التعيين' : 'Failed to reset template');
    } finally {
      setResetting(false);
    }
  };

  if (!hasManagePermission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <span>{isArabic ? 'غير مصرح' : 'Not Authorized'}</span>
          </CardTitle>
          <CardDescription>
            {isArabic
              ? 'يلزم صلاحية EmailSettings.Manage للوصول إلى هذه الصفحة.'
              : 'EmailSettings.Manage permission is required to access this page.'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{isArabic ? 'قوالب البريد الإلكتروني' : 'Email Templates'}</h1>
            <p className="text-sm text-muted-foreground">
              {isArabic ? 'إدارة قوالب رسائل البريد الإلكتروني' : 'Manage email message templates'}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => void fetchTemplates(selectedBranch)} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {isArabic ? 'إعادة التحميل' : 'Reload'}
        </Button>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span>{isArabic ? 'الفرع:' : 'Branch:'}</span>
            <Badge variant="outline">{regions[selectedBranch].flag} {regions[selectedBranch].name}</Badge>
          </div>
          <div className="flex gap-2">
            {(Object.keys(regions) as RegionCode[]).map((code) => (
              <Button
                key={code}
                size="sm"
                variant={selectedBranch === code ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedBranch(code);
                  void fetchTemplates(code);
                }}
              >
                {regions[code].flag} {regions[code].name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {permissionDenied && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {isArabic
              ? 'تم رفض الطلب من الخادم. تأكد من صلاحية EmailSettings.Manage.'
              : 'Server denied this request. Ensure the user has EmailSettings.Manage.'}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isArabic ? 'القوالب' : 'Templates'}</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-10"
                placeholder={isArabic ? 'ابحث...' : 'Search templates...'}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && <p className="text-sm text-muted-foreground">{isArabic ? 'جارِ التحميل...' : 'Loading...'}</p>}
            {!loading && filteredTemplates.length === 0 && (
              <p className="text-sm text-muted-foreground">{isArabic ? 'لا توجد قوالب' : 'No templates found'}</p>
            )}
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedId(template.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                  selectedId === template.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{template.name || template.templateKey || `#${template.id}`}</p>
                  {typeof template.isActive === 'boolean' && (
                    <Badge variant={template.isActive ? 'default' : 'secondary'}>
                      {template.isActive ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'معطل' : 'Inactive')}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{template.templateKey || template.subject || ''}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{isArabic ? 'تفاصيل القالب' : 'Template Details'}</CardTitle>
            <CardDescription>
              {isArabic
                ? 'تعديل القالب المحدد ثم الحفظ.'
                : 'Edit the selected template and save your changes.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!activeTemplate && (
              <p className="text-sm text-muted-foreground">
                {isArabic ? 'اختر قالباً من القائمة.' : 'Select a template from the list.'}
              </p>
            )}

            {activeTemplate && (
              <>
                {'name' in activeTemplate && (
                  <div className="space-y-2">
                    <Label>{isArabic ? 'الاسم' : 'Name'}</Label>
                    <Input
                      value={String(activeTemplate.name ?? '')}
                      onChange={(event) => updateField('name', event.target.value)}
                    />
                  </div>
                )}

                {'subject' in activeTemplate && (
                  <div className="space-y-2">
                    <Label>{isArabic ? 'العنوان' : 'Subject'}</Label>
                    <Input
                      value={String(activeTemplate.subject ?? '')}
                      onChange={(event) => updateField('subject', event.target.value)}
                    />
                  </div>
                )}

                {'description' in activeTemplate && (
                  <div className="space-y-2">
                    <Label>{isArabic ? 'الوصف' : 'Description'}</Label>
                    <Input
                      value={String(activeTemplate.description ?? '')}
                      onChange={(event) => updateField('description', event.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{isArabic ? 'النص (Body Text)' : 'Body Text'}</Label>
                  <Textarea
                    rows={8}
                    value={pickValue(activeTemplate, ['body', 'textBody', 'plainTextBody', 'messageBody'])}
                    onChange={(event) =>
                      updateField(
                        pickKey(activeTemplate, ['body', 'textBody', 'plainTextBody', 'messageBody'], 'body') as keyof EmailMessageTemplate,
                        event.target.value
                      )
                    }
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{isArabic ? 'محتوى HTML' : 'HTML Body'}</Label>
                    <Textarea
                      rows={14}
                      value={pickValue(activeTemplate, ['htmlBody', 'bodyHtml', 'html', 'templateHtml'])}
                      onChange={(event) =>
                        updateField(
                          pickKey(activeTemplate, ['htmlBody', 'bodyHtml', 'html', 'templateHtml'], 'htmlBody') as keyof EmailMessageTemplate,
                          event.target.value
                        )
                      }
                      placeholder={isArabic ? 'ألصق HTML هنا...' : 'Paste HTML email markup here...'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{isArabic ? 'معاينة HTML' : 'HTML Preview'}</Label>
                    <div className="min-h-[328px] rounded-md border bg-white p-4 overflow-auto">
                      {pickValue(activeTemplate, ['htmlBody', 'bodyHtml', 'html', 'templateHtml']) ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: pickValue(activeTemplate, ['htmlBody', 'bodyHtml', 'html', 'templateHtml']),
                          }}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {isArabic ? 'لا يوجد HTML للمعاينة.' : 'No HTML content to preview yet.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {typeof activeTemplate.isActive === 'boolean' && (
                  <div className="flex items-center justify-between rounded-md border p-3">
                    <Label>{isArabic ? 'نشط' : 'Active'}</Label>
                    <Switch
                      checked={Boolean(activeTemplate.isActive)}
                      onCheckedChange={(checked) => updateField('isActive', checked)}
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={() => void handleSave()} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? (isArabic ? 'جارِ الحفظ...' : 'Saving...') : (isArabic ? 'حفظ' : 'Save')}
                  </Button>
                  <Button variant="outline" onClick={() => void handleReset()} disabled={resetting}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    {resetting ? (isArabic ? 'جارِ الإعادة...' : 'Resetting...') : (isArabic ? 'إعادة تعيين' : 'Reset')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
