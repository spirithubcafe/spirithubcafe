import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { useProductTags } from '../../hooks/useProductTags';
import type { ProductTagCreateUpdateDto, ProductTagListDto } from '../../types/productTag';
import { TAG_POSITION_VALUES } from '../../types/productTag';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

/* ------------------------------------------------------------------ */
/*  Defaults                                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_FORM: ProductTagCreateUpdateDto = {
  name: '',
  nameAr: '',
  position: TAG_POSITION_VALUES.Top,
  backgroundColor: '#6B7280',
  textColor: '#FFFFFF',
  icon: '',
  sortOrder: 0,
  isActive: true,
};

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export const ProductTagsManagement: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';
  const { tags, topTags, bottomTags, loading, error, fetchTags, createTag, updateTag, deleteTag } =
    useProductTags();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductTagCreateUpdateDto>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);

  /* -------- helpers -------- */

  const resetForm = useCallback(() => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setShowForm(false);
  }, []);

  const handleEdit = useCallback((tag: ProductTagListDto) => {
    setEditingId(tag.id);
    setForm({
      name: tag.name,
      nameAr: tag.nameAr || '',
      position: tag.positionValue,
      backgroundColor: tag.backgroundColor || '#6B7280',
      textColor: tag.textColor || '#FFFFFF',
      icon: tag.icon || '',
      sortOrder: tag.sortOrder,
      isActive: tag.isActive,
    });
    setShowForm(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      toast.error(isArabic ? 'اسم التاج مطلوب' : 'Tag name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateTag(editingId, form);
        toast.success(isArabic ? 'تم تحديث التاج بنجاح' : 'Tag updated successfully');
      } else {
        await createTag(form);
        toast.success(isArabic ? 'تم إنشاء التاج بنجاح' : 'Tag created successfully');
      }
      resetForm();
    } catch {
      toast.error(isArabic ? 'حدث خطأ أثناء الحفظ' : 'Error saving tag');
    } finally {
      setSaving(false);
    }
  }, [form, editingId, isArabic, createTag, updateTag, resetForm]);

  const handleDelete = useCallback(
    async (tag: ProductTagListDto) => {
      if (!confirm(isArabic ? `هل تريد حذف "${tag.name}"؟` : `Delete tag "${tag.name}"?`)) return;
      try {
        await deleteTag(tag.id);
        toast.success(isArabic ? 'تم حذف التاج' : 'Tag deleted');
        if (editingId === tag.id) resetForm();
      } catch {
        toast.error(isArabic ? 'حدث خطأ أثناء الحذف' : 'Error deleting tag');
      }
    },
    [isArabic, deleteTag, editingId, resetForm],
  );

  /* -------- filter by search -------- */

  const filterTags = useCallback(
    (list: ProductTagListDto[]) => {
      if (!searchQuery.trim()) return list;
      const q = searchQuery.toLowerCase();
      return list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.nameAr && t.nameAr.includes(q)),
      );
    },
    [searchQuery],
  );

  const filteredTop = filterTags(topTags);
  const filteredBottom = filterTags(bottomTags);

  /* -------- render a single tag row -------- */

  const renderTagRow = (tag: ProductTagListDto) => (
    <div
      key={tag.id}
      className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3 transition hover:bg-stone-50"
    >
      <div className="flex items-center gap-3 flex-wrap">
        {/* Live preview */}
        <span
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium shadow-sm"
          style={{
            backgroundColor: tag.backgroundColor || '#6B7280',
            color: tag.textColor || '#FFFFFF',
          }}
        >
          {tag.icon && <span>{tag.icon}</span>}
          {isArabic && tag.nameAr ? tag.nameAr : tag.name}
        </span>

        {!isArabic && tag.nameAr && (
          <span className="text-sm text-stone-400" dir="rtl">
            {tag.nameAr}
          </span>
        )}

        <Badge variant="outline" className="text-[10px]">
          {tag.productCount} {isArabic ? 'منتج' : 'products'}
        </Badge>

        {!tag.isActive && (
          <Badge variant="destructive" className="text-[10px]">
            {isArabic ? 'غير نشط' : 'Inactive'}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEdit(tag)}
          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDelete(tag)}
          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  /* -------- render tag group -------- */

  const renderGroup = (
    title: string,
    icon: React.ReactNode,
    list: ProductTagListDto[],
  ) => (
    <Card className="py-0">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {list.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {list.length === 0 ? (
          <p className="text-sm text-stone-400 py-4 text-center">
            {isArabic ? 'لا يوجد تاجات' : 'No tags'}
          </p>
        ) : (
          list.map(renderTagRow)
        )}
      </CardContent>
    </Card>
  );

  /* ================================================================ */
  /*  Main render                                                      */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Tag className="h-6 w-6 text-amber-600" />
            {isArabic ? 'تاج‌های محصول' : 'Product Tags'}
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {isArabic
              ? 'مدیریت تاج‌هایی که روی محصولات نمایش داده می‌شوند'
              : 'Manage tags displayed on products in the shop'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTags} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            {isArabic ? 'تاج جدید' : 'New Tag'}
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchTags}>
            {isArabic ? 'تلاش مجدد' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <Input
          placeholder={isArabic ? 'جستجو ...' : 'Search tags...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-amber-200 bg-amber-50/50 py-0">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-base">
              {editingId
                ? isArabic
                  ? '✏️ ویرایش تاج'
                  : '✏️ Edit Tag'
                : isArabic
                  ? '➕ تاج جدید'
                  : '➕ New Tag'}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Name EN */}
              <div className="space-y-1.5">
                <Label>{isArabic ? 'اسم (انگلیسی)' : 'Name (English)'}</Label>
                <Input
                  placeholder="e.g. Best Seller"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  maxLength={100}
                />
              </div>

              {/* Name AR */}
              <div className="space-y-1.5">
                <Label>{isArabic ? 'اسم (عربی)' : 'Name (Arabic)'}</Label>
                <Input
                  placeholder="مثال: الأكثر مبيعاً"
                  value={form.nameAr || ''}
                  onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                  dir="rtl"
                  maxLength={100}
                />
              </div>

              {/* Position */}
              <div className="space-y-1.5">
                <Label>{isArabic ? 'موقعیت' : 'Position'}</Label>
                <select
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value={0}>⬆️ {isArabic ? 'بالا (Top)' : 'Top'}</option>
                  <option value={1}>⬇️ {isArabic ? 'پایین (Bottom)' : 'Bottom'}</option>
                </select>
              </div>

              {/* Icon */}
              <div className="space-y-1.5">
                <Label>{isArabic ? 'آیکون (ایموجی)' : 'Icon (emoji)'}</Label>
                <Input
                  placeholder="e.g. 🔥 ⭐ 🆕"
                  value={form.icon || ''}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  maxLength={50}
                />
              </div>

              {/* Colors */}
              <div className="space-y-1.5">
                <Label>{isArabic ? 'رنگ پس‌زمینه' : 'Background Color'}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.backgroundColor || '#6B7280'}
                    onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })}
                    className="h-9 w-12 rounded cursor-pointer border border-stone-200"
                  />
                  <Input
                    value={form.backgroundColor || '#6B7280'}
                    onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })}
                    className="flex-1 font-mono text-xs"
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{isArabic ? 'رنگ متن' : 'Text Color'}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.textColor || '#FFFFFF'}
                    onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                    className="h-9 w-12 rounded cursor-pointer border border-stone-200"
                  />
                  <Input
                    value={form.textColor || '#FFFFFF'}
                    onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                    className="flex-1 font-mono text-xs"
                    maxLength={7}
                  />
                </div>
              </div>

              {/* Sort Order */}
              <div className="space-y-1.5">
                <Label>{isArabic ? 'ترتیب' : 'Sort Order'}</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  min={0}
                />
              </div>

              {/* Active */}
              <div className="space-y-1.5">
                <Label>{isArabic ? 'فعال' : 'Active'}</Label>
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                  />
                  <span className="text-sm text-stone-600">
                    {form.isActive
                      ? isArabic
                        ? 'فعال'
                        : 'Active'
                      : isArabic
                        ? 'غیرفعال'
                        : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Preview */}
            {form.name && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <span className="text-sm text-stone-500">
                    {isArabic ? 'پیش‌نمایش:' : 'Preview:'}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium shadow-sm"
                    style={{
                      backgroundColor: form.backgroundColor || '#6B7280',
                      color: form.textColor || '#FFFFFF',
                    }}
                  >
                    {form.icon && <span>{form.icon}</span>}
                    {form.name}
                  </span>
                  {form.nameAr && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium shadow-sm"
                      dir="rtl"
                      style={{
                        backgroundColor: form.backgroundColor || '#6B7280',
                        color: form.textColor || '#FFFFFF',
                      }}
                    >
                      {form.icon && <span>{form.icon}</span>}
                      {form.nameAr}
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving
                  ? isArabic
                    ? 'در حال ذخیره...'
                    : 'Saving...'
                  : editingId
                    ? isArabic
                      ? 'به‌روزرسانی'
                      : 'Update'
                    : isArabic
                      ? 'ایجاد'
                      : 'Create'}
              </Button>
              <Button variant="outline" size="sm" onClick={resetForm}>
                {isArabic ? 'انصراف' : 'Cancel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tag lists */}
      {loading && tags.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-stone-400" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {renderGroup(
            isArabic ? '⬆️ تاج‌های بالا (روی تصویر محصول)' : '⬆️ Top Tags (overlaid on product)',
            <ArrowUp className="h-4 w-4 text-blue-600" />,
            filteredTop,
          )}
          {renderGroup(
            isArabic ? '⬇️ تاج‌های پایین (زیر محصول)' : '⬇️ Bottom Tags (below product)',
            <ArrowDown className="h-4 w-4 text-green-600" />,
            filteredBottom,
          )}
        </div>
      )}
    </div>
  );
};
