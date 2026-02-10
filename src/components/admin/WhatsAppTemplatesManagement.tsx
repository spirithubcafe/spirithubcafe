import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  FileText,
  Globe,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { useRegion } from '../../hooks/useRegion';
import type { RegionCode } from '../../contexts/RegionContextDefinition';
import { useWhatsAppTemplates } from '../../hooks/useWhatsAppTemplates';
import { WhatsAppTemplateEditor } from './WhatsAppTemplateEditor';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

/* ------------------------------------------------------------------ */
/*  Template icons by key                                               */
/* ------------------------------------------------------------------ */

const TEMPLATE_ICONS: Record<string, string> = {
  OrderConfirmation: '🛒',
  OrderStatusUpdate: '📦',
  PaymentStatusUpdate: '💳',
  ShippingUpdate: '🚚',
  OrderCancelled: '❌',
  Welcome: '👋',
  LoginSuccess: '✅',
  PasswordReset: '🔐',
  PasswordChanged: '🔒',
  GiftRecipientNotification: '🎁',
  AdminNewOrder: '🆕',
  AdminPaymentReceived: '💰',
  AdminOrderStatusChange: '📦',
  OtpCode: '📲',
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export const WhatsAppTemplatesManagement: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const { currentRegion, regions } = useRegion();

  const [selectedBranch, setSelectedBranch] = useState<RegionCode>(currentRegion.code);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const {
    templates,
    loading,
    error,
    fetchAll,
    remove,
  } = useWhatsAppTemplates(selectedBranch);

  /* ---------- Branch switch ---------------------------------------- */

  const handleBranchSwitch = useCallback(
    (branch: RegionCode) => {
      if (branch === selectedBranch) return;
      setSelectedBranch(branch);
      // fetchAll will be called automatically via useEffect in the hook
    },
    [selectedBranch],
  );

  /* ---------- Delete ----------------------------------------------- */

  const handleDelete = async (
    e: React.MouseEvent,
    id: number,
    name: string,
  ) => {
    e.stopPropagation();
    const msg = isArabic
      ? `حذف "${name}"؟`
      : `Delete "${name}"?`;
    if (!window.confirm(msg)) return;
    try {
      await remove(id);
      toast.success(
        isArabic ? 'تم حذف القالب بنجاح' : 'Template deleted successfully',
      );
    } catch {
      toast.error(
        isArabic ? 'فشل في حذف القالب' : 'Failed to delete template',
      );
    }
  };

  /* ---------- Filter ----------------------------------------------- */

  const query = searchQuery.trim().toLowerCase();
  const filteredTemplates = query
    ? templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.templateKey.toLowerCase().includes(query) ||
          (t.description || '').toLowerCase().includes(query),
      )
    : templates;

  /* ---------- If editing ------------------------------------------- */

  if (editingId !== null || creating) {
    return (
      <WhatsAppTemplateEditor
        templateId={editingId}
        branch={selectedBranch}
        onClose={() => {
          setEditingId(null);
          setCreating(false);
          fetchAll(selectedBranch);
        }}
      />
    );
  }

  /* ---------- Loading ---------------------------------------------- */

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-72 animate-pulse rounded-lg bg-gray-200" />
            <div className="h-4 w-96 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-200" />
        </div>
        {/* Cards skeleton */}
        <div className="grid gap-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border bg-card p-5"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
                    <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" />
                  </div>
                  <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-64 animate-pulse rounded bg-gray-100" />
                </div>
                <div className="h-8 w-8 animate-pulse rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------- Render ----------------------------------------------- */

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isArabic
                ? '💬 قوالب رسائل واتساب'
                : '💬 WhatsApp Message Templates'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isArabic
                ? 'إدارة وتخصيص قوالب الرسائل المرسلة عبر واتساب'
                : 'Manage and customize WhatsApp notification message templates'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAll(selectedBranch)}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isArabic ? 'إعادة التحميل' : 'Reload'}
          </Button>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setCreating(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {isArabic ? 'قالب جديد' : 'New Template'}
          </Button>
        </div>
      </div>

      {/* Branch Selector */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            <span className="font-medium">
              {isArabic ? 'الفرع النشط:' : 'Active Branch:'}
            </span>
            <Badge variant="outline" className="font-semibold text-sm">
              {regions[selectedBranch].flag} {regions[selectedBranch].name}
            </Badge>
          </div>
          <div className="flex gap-2">
            {(Object.keys(regions) as RegionCode[]).map((code) => (
              <Button
                key={code}
                variant={selectedBranch === code ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleBranchSwitch(code)}
                disabled={loading}
                className={`gap-1.5 ${selectedBranch === code ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                <span>{regions[code].flag}</span>
                <span>{regions[code].name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center justify-between">
          <span>
            {isArabic ? '⚠️ خطأ: ' : '⚠️ Error: '}
            {error}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchAll(selectedBranch)}
            className="text-destructive hover:text-destructive"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            {isArabic ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            isArabic ? 'بحث في القوالب...' : 'Search templates...'
          }
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>
          {isArabic ? 'الإجمالي:' : 'Total:'}{' '}
          <strong className="text-foreground">{templates.length}</strong>
        </span>
        <span>
          {isArabic ? 'مفعّل:' : 'Active:'}{' '}
          <strong className="text-green-600">
            {templates.filter((t) => t.isActive).length}
          </strong>
        </span>
        <span>
          {isArabic ? 'معطّل:' : 'Inactive:'}{' '}
          <strong className="text-red-500">
            {templates.filter((t) => !t.isActive).length}
          </strong>
        </span>
      </div>

      {/* Template List */}
      {filteredTemplates.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/30 py-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            {query
              ? isArabic
                ? 'لا توجد نتائج'
                : 'No templates match your search'
              : isArabic
                ? 'لا توجد قوالب'
                : 'No templates found'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredTemplates.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer transition-all hover:border-green-300 hover:shadow-sm"
              onClick={() => setEditingId(t.id)}
            >
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] tracking-wide"
                    >
                      {t.templateKey}
                    </Badge>
                    <Badge
                      variant={t.isActive ? 'default' : 'destructive'}
                      className={`text-[10px] ${t.isActive ? 'bg-green-600' : ''}`}
                    >
                      {t.isActive
                        ? isArabic
                          ? 'مفعّل'
                          : 'Active'
                        : isArabic
                          ? 'معطّل'
                          : 'Inactive'}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {t.language === 'ar' ? 'العربية' : 'EN'}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-semibold leading-tight">
                    {TEMPLATE_ICONS[t.templateKey] || '📝'} {t.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {t.description ||
                      (isArabic ? 'بدون وصف' : 'No description')}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">
                    {isArabic ? 'آخر تحديث:' : 'Updated:'}{' '}
                    {new Date(t.updatedAt).toLocaleDateString(
                      isArabic ? 'ar-OM' : 'en-US',
                      {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      },
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                  onClick={(e) => handleDelete(e, t.id, t.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
