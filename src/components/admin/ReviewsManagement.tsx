import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Edit3, Loader2, MoreHorizontal, RefreshCw, XCircle } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { productReviewService } from '../../services/productReviewService';
import type { ProductReview, ProductReviewUpdateDto } from '../../types/product';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type EditState = {
  rating: number;
  title: string;
  content: string;
};

const getStatusLabel = (review: ProductReview) => {
  if (review.isRejected) return 'Rejected';
  if (review.isApproved) return 'Approved';
  return 'Pending';
};

const getStatusVariant = (review: ProductReview) => {
  if (review.isRejected) return 'destructive' as const;
  if (review.isApproved) return 'default' as const;
  return 'secondary' as const;
};

export const ReviewsManagement: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<ProductReview | null>(null);
  const [editState, setEditState] = useState<EditState>({ rating: 5, title: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const loadPendingReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productReviewService.getPending(page, pageSize);
      setReviews(res.items ?? []);
      setTotalCount(res.totalCount ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } catch (err: any) {
      console.error('Failed to load pending reviews:', err);
      setError(err?.message || (isArabic ? 'فشل تحميل المراجعات' : 'Failed to load reviews'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPendingReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const openEdit = (review: ProductReview) => {
    setSelectedReview(review);
    setEditState({
      rating: review.rating ?? 5,
      title: review.title ?? '',
      content: review.content ?? '',
    });
    setEditOpen(true);
  };

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  const handleApprove = async (review: ProductReview) => {
    setActionLoadingId(review.id);
    try {
      await productReviewService.approve(review.id);
      toast.success(isArabic ? 'تم اعتماد المراجعة' : 'Review approved');
      await loadPendingReviews();
    } catch (err: any) {
      console.error('Failed to approve review', err);
      toast.error(err?.message || (isArabic ? 'تعذر اعتماد المراجعة' : 'Failed to approve review'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (review: ProductReview) => {
    setActionLoadingId(review.id);
    try {
      await productReviewService.reject(review.id);
      toast.success(isArabic ? 'تم رفض المراجعة' : 'Review rejected');
      await loadPendingReviews();
    } catch (err: any) {
      console.error('Failed to reject review', err);
      toast.error(err?.message || (isArabic ? 'تعذر رفض المراجعة' : 'Failed to reject review'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSave = async () => {
    if (!selectedReview) return;
    const payload: ProductReviewUpdateDto = {
      rating: editState.rating,
      title: editState.title?.trim() || undefined,
      content: editState.content?.trim() || undefined,
    };

    if (!payload.content || payload.content.length < 5) {
      toast.error(isArabic ? 'يرجى إدخال مراجعة أطول' : 'Please enter a longer review');
      return;
    }

    setSaving(true);
    try {
      await productReviewService.update(selectedReview.id, payload);
      toast.success(isArabic ? 'تم تحديث المراجعة' : 'Review updated');
      setEditOpen(false);
      setSelectedReview(null);
      await loadPendingReviews();
    } catch (err: any) {
      console.error('Failed to update review', err);
      toast.error(err?.message || (isArabic ? 'تعذر تحديث المراجعة' : 'Failed to update review'));
    } finally {
      setSaving(false);
    }
  };

  const reviewCountLabel = useMemo(() => {
    if (totalCount === 0) {
      return isArabic ? 'لا توجد مراجعات' : 'No reviews';
    }
    return isArabic ? `عدد المراجعات: ${totalCount}` : `${totalCount} reviews`;
  }, [isArabic, totalCount]);

  const ReviewActionsMenu = ({ review }: { review: ProductReview }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={isArabic ? 'الإجراءات' : 'Actions'}
          title={isArabic ? 'الإجراءات' : 'Actions'}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        <DropdownMenuItem onSelect={() => openEdit(review)}>
          <Edit3 className="h-4 w-4" />
          {isArabic ? 'تعديل' : 'Edit'}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => void handleApprove(review)}
          disabled={actionLoadingId === review.id}
        >
          {actionLoadingId === review.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {isArabic ? 'اعتماد' : 'Approve'}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => void handleReject(review)}
          disabled={actionLoadingId === review.id}
          className="text-destructive focus:text-destructive"
        >
          {actionLoadingId === review.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {isArabic ? 'رفض' : 'Reject'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">
            {isArabic ? 'إدارة المراجعات' : 'Reviews Management'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isArabic ? 'اعتماد أو رفض مراجعات المنتجات' : 'Approve or reject product reviews'}
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => void loadPendingReviews()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {isArabic ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{isArabic ? 'المراجعات المعلقة' : 'Pending reviews'}</CardTitle>
          <CardDescription>{reviewCountLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isArabic ? 'المعرف' : 'ID'}</TableHead>
                  <TableHead>{isArabic ? 'العميل' : 'Customer'}</TableHead>
                  <TableHead>{isArabic ? 'التقييم' : 'Rating'}</TableHead>
                  <TableHead>{isArabic ? 'المراجعة' : 'Review'}</TableHead>
                  <TableHead>{isArabic ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead className="text-right">{isArabic ? 'إجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                      {isArabic ? 'جارٍ التحميل...' : 'Loading...'}
                    </TableCell>
                  </TableRow>
                ) : reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      {isArabic ? 'لا توجد مراجعات معلقة' : 'No pending reviews'}
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">#{review.id}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {review.customerName || (isArabic ? 'عميل' : 'Customer')}
                        </div>
                        {review.customerEmail && (
                          <div className="text-xs text-muted-foreground">{review.customerEmail}</div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {isArabic ? 'منتج' : 'Product'} #{review.productId}
                        </div>
                      </TableCell>
                      <TableCell>{review.rating}/5</TableCell>
                      <TableCell className="max-w-[360px]">
                        <div className="text-sm font-medium truncate">
                          {review.title || (isArabic ? 'بدون عنوان' : 'Untitled')}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {review.content}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(review)}>{getStatusLabel(review)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ReviewActionsMenu review={review} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {isArabic ? 'الصفحة' : 'Page'} {page} {isArabic ? 'من' : 'of'} {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={!canGoPrev} onClick={() => setPage((p) => p - 1)}>
                {isArabic ? 'السابق' : 'Previous'}
              </Button>
              <Button size="sm" variant="outline" disabled={!canGoNext} onClick={() => setPage((p) => p + 1)}>
                {isArabic ? 'التالي' : 'Next'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isArabic ? 'تعديل المراجعة' : 'Edit review'}</DialogTitle>
            <DialogDescription>
              {selectedReview
                ? `${isArabic ? 'مراجعة رقم' : 'Review #'}${selectedReview.id}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="review-rating">{isArabic ? 'التقييم' : 'Rating'} (1-5)</Label>
              <Input
                id="review-rating"
                type="number"
                min={1}
                max={5}
                value={editState.rating}
                onChange={(e) => setEditState((prev) => ({ ...prev, rating: Number(e.target.value) || 1 }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="review-title">{isArabic ? 'العنوان' : 'Title'}</Label>
              <Input
                id="review-title"
                value={editState.title}
                onChange={(e) => setEditState((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="review-content">{isArabic ? 'المراجعة' : 'Review'}</Label>
              <Textarea
                id="review-content"
                value={editState.content}
                onChange={(e) => setEditState((prev) => ({ ...prev, content: e.target.value }))}
                rows={6}
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
                {isArabic ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={() => void handleSave()} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span className={saving ? 'ml-2' : ''}>{isArabic ? 'حفظ' : 'Save'}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
