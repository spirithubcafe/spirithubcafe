import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Eye,
  Loader2,
  RotateCcw,
  Save,
  Tag,
  Type,
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { whatsappTemplateService } from '../../services/whatsappTemplateService';
import type { WhatsAppMessageTemplateDto } from '../../types/whatsapp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

/* ------------------------------------------------------------------ */
/*  Sample data for live preview                                        */
/* ------------------------------------------------------------------ */

const SAMPLE_DATA: Record<string, string> = {
  OrderNumber: 'ORD-2026-001234',
  TotalAmount: '12.500',
  Currency: 'OMR',
  Amount: '12.500',
  StatusEmoji: '✅',
  OldStatus: 'Pending',
  NewStatus: 'Confirmed',
  StatusText: 'Your order has been confirmed!',
  PaymentEmoji: '✅',
  ShippingMethod: 'Aramex Express',
  TrackingInfo: '\nTracking: *AWB123456789*',
  DisplayName: 'Ahmed',
  LoginTime: '2026-02-10 14:30',
  ResetCode: '847291',
  ChangeTime: '2026-02-10 14:30',
  RecipientName: 'Sara',
  GiftMessage: '\n💌 *Message:* _Enjoy your coffee! ☕_\n',
  SenderName: 'Ahmed',
  ItemCount: '3',
  CustomerContact: 'customer@example.com',
  PaymentMethod: 'Credit Card',
};

/* ------------------------------------------------------------------ */
/*  Props                                                               */
/* ------------------------------------------------------------------ */

interface WhatsAppTemplateEditorProps {
  templateId: number | null; // null = create mode
  branch?: string;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export const WhatsAppTemplateEditor: React.FC<WhatsAppTemplateEditorProps> = ({
  templateId,
  branch,
  onClose,
}) => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  const [form, setForm] = useState<WhatsAppMessageTemplateDto>({
    templateKey: '',
    name: '',
    description: '',
    body: '',
    availablePlaceholders: '',
    isActive: true,
    language: 'en',
  });
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!templateId);
  const [showPreview, setShowPreview] = useState(true);

  /* ---------- Load template ---------------------------------------- */

  useEffect(() => {
    if (!templateId) return;
    setLoading(true);
    whatsappTemplateService
      .getById(templateId, branch)
      .then((t) => {
        setForm({
          templateKey: t.templateKey,
          name: t.name,
          description: t.description || '',
          body: t.body,
          availablePlaceholders: t.availablePlaceholders || '',
          isActive: t.isActive,
          language: t.language,
        });
      })
      .catch(() => {
        toast.error(
          isArabic ? 'فشل في تحميل القالب' : 'Failed to load template',
        );
      })
      .finally(() => setLoading(false));
  }, [templateId, branch, isArabic]);

  /* ---------- Live preview ----------------------------------------- */

  useEffect(() => {
    let rendered = form.body;
    for (const [key, value] of Object.entries(SAMPLE_DATA)) {
      rendered = rendered.replaceAll(`{${key}}`, value);
    }
    setPreview(rendered);
  }, [form.body]);

  /* ---------- Helpers ---------------------------------------------- */

  const placeholders = (form.availablePlaceholders || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const insertPlaceholder = (tag: string) => {
    setForm((prev) => ({ ...prev, body: prev.body + `{${tag}}` }));
  };

  const renderWhatsAppPreview = (text: string) => {
    return text
      .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/~([^~]+)~/g, '<del>$1</del>')
      .replace(/\n/g, '<br/>');
  };

  /* ---------- Save ------------------------------------------------- */

  const handleSave = async () => {
    if (!form.templateKey || !form.name || !form.body) {
      toast.error(
        isArabic
          ? 'مفتاح القالب والاسم والنص مطلوبة'
          : 'Template Key, Name, and Body are required',
      );
      return;
    }
    setSaving(true);
    try {
      if (templateId) {
        await whatsappTemplateService.update(templateId, form, branch);
      } else {
        await whatsappTemplateService.create(form, branch);
      }
      toast.success(
        isArabic ? 'تم حفظ القالب بنجاح' : 'Template saved successfully',
      );
      onClose();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
          (isArabic ? 'فشل في حفظ القالب' : 'Failed to save template'),
      );
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Reset ------------------------------------------------ */

  const handleReset = async () => {
    if (!templateId) return;
    const msg = isArabic
      ? 'إعادة تعيين إلى الافتراضي؟ ستفقد التغييرات.'
      : 'Reset to default? Your changes will be lost.';
    if (!window.confirm(msg)) return;
    try {
      const result = await whatsappTemplateService.reset(templateId, branch);
      setForm((prev) => ({ ...prev, body: result.body }));
      toast.success(
        isArabic ? 'تمت إعادة التعيين بنجاح' : 'Template reset to default',
      );
    } catch {
      toast.error(
        isArabic ? 'فشل في إعادة التعيين' : 'Failed to reset template',
      );
    }
  };

  /* ---------- Loading ---------------------------------------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  /* ---------- Render ----------------------------------------------- */

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {templateId
                ? isArabic
                  ? '✏️ تعديل القالب'
                  : '✏️ Edit Template'
                : isArabic
                  ? '➕ قالب جديد'
                  : '➕ New Template'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isArabic
                ? 'تخصيص رسائل واتساب المرسلة للعملاء'
                : 'Customize WhatsApp messages sent to customers'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {templateId && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              {isArabic ? 'إعادة تعيين' : 'Reset Default'}
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isArabic ? 'حفظ القالب' : 'Save Template'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ---- Editor Panel ---- */}
        <div className="space-y-4">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Type className="h-4 w-4" />
                {isArabic ? 'معلومات القالب' : 'Template Info'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isArabic ? 'مفتاح القالب' : 'Template Key'}</Label>
                  <Input
                    value={form.templateKey}
                    onChange={(e) =>
                      setForm({ ...form, templateKey: e.target.value })
                    }
                    disabled={!!templateId}
                    placeholder="e.g., OrderConfirmation"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isArabic ? 'الاسم' : 'Name'}</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder={
                      isArabic ? 'مثال: تأكيد الطلب' : 'e.g., Order Confirmation'
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isArabic ? 'الوصف' : 'Description'}</Label>
                <Input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder={
                    isArabic ? 'وصف مختصر...' : 'Brief description...'
                  }
                />
              </div>

              <div className="flex gap-4 items-center">
                <div className="space-y-2">
                  <Label>{isArabic ? 'اللغة' : 'Language'}</Label>
                  <select
                    value={form.language}
                    onChange={(e) =>
                      setForm({ ...form, language: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, isActive: checked })
                    }
                  />
                  <Label>
                    {form.isActive
                      ? isArabic
                        ? 'مفعّل'
                        : 'Active'
                      : isArabic
                        ? 'معطّل'
                        : 'Inactive'}
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Placeholders */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {isArabic ? 'المتغيرات المتاحة' : 'Available Placeholders'}
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? 'اضغط على المتغير لإضافته إلى نص الرسالة'
                  : 'Click a placeholder to insert it into the message body'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {placeholders.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => insertPlaceholder(tag)}
                    className="inline-flex items-center rounded-md border border-yellow-300 bg-yellow-50 px-2.5 py-1 text-xs font-medium text-yellow-800 hover:bg-yellow-200 transition-colors cursor-pointer"
                  >
                    {`{${tag}}`}
                  </button>
                ))}
                {placeholders.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    {isArabic
                      ? 'لا توجد متغيرات محددة'
                      : 'No placeholders defined'}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {isArabic
                    ? 'المتغيرات (مفصولة بفاصلة)'
                    : 'Placeholders (comma-separated)'}
                </Label>
                <Input
                  value={form.availablePlaceholders}
                  onChange={(e) =>
                    setForm({ ...form, availablePlaceholders: e.target.value })
                  }
                  dir="ltr"
                  placeholder="OrderNumber,TotalAmount,Currency"
                  className="text-sm font-mono"
                />
              </div>
            </CardContent>
          </Card>

          {/* Message Body */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">
                {isArabic ? '📝 نص الرسالة' : '📝 Message Body'}
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? 'تنسيق واتساب: *عريض*، _مائل_، ~يتوسطه خط~'
                  : 'WhatsApp formatting: *bold*, _italic_, ~strikethrough~'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[250px] resize-y"
                dir="ltr"
                placeholder={
                  isArabic
                    ? 'اكتب نص القالب هنا...'
                    : 'Write your template here...'
                }
              />
              <p className="text-xs text-muted-foreground mt-2">
                {isArabic
                  ? `${form.body.length} / 4000 حرف`
                  : `${form.body.length} / 4,000 characters`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ---- Preview Panel ---- */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  {isArabic ? '📱 معاينة واتساب' : '📱 WhatsApp Preview'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview((p) => !p)}
                >
                  {showPreview
                    ? isArabic
                      ? 'إخفاء'
                      : 'Hide'
                    : isArabic
                      ? 'إظهار'
                      : 'Show'}
                </Button>
              </div>
              <CardDescription>
                {isArabic
                  ? 'هذه معاينة تقريبية لكيفية ظهور الرسالة'
                  : 'Approximate preview of how the message will appear'}
              </CardDescription>
            </CardHeader>
            {showPreview && (
              <CardContent>
                <div
                  className="rounded-xl p-5 min-h-[300px]"
                  style={{ backgroundColor: '#e5ddd5' }}
                >
                  {preview ? (
                    <div
                      className="rounded-lg p-4 inline-block max-w-full shadow-sm text-sm leading-relaxed"
                      style={{ backgroundColor: '#dcf8c6' }}
                      dangerouslySetInnerHTML={{
                        __html: renderWhatsAppPreview(preview),
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
                      {isArabic
                        ? 'اكتب نص الرسالة لرؤية المعاينة'
                        : 'Write message body to see preview'}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Template Info Summary */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">
                {isArabic ? 'ℹ️ ملخص' : 'ℹ️ Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isArabic ? 'المفتاح' : 'Key'}
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  {form.templateKey || '—'}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isArabic ? 'الحالة' : 'Status'}
                </span>
                <Badge
                  variant={form.isActive ? 'default' : 'destructive'}
                  className={form.isActive ? 'bg-green-600' : ''}
                >
                  {form.isActive
                    ? isArabic
                      ? 'مفعّل'
                      : 'Active'
                    : isArabic
                      ? 'معطّل'
                      : 'Inactive'}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isArabic ? 'اللغة' : 'Language'}
                </span>
                <span>{form.language === 'ar' ? 'العربية' : 'English'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isArabic ? 'المتغيرات' : 'Placeholders'}
                </span>
                <span>{placeholders.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isArabic ? 'طول النص' : 'Body Length'}
                </span>
                <span>{form.body.length} chars</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
