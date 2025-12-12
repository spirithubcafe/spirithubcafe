import React, { useState, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { useEmailSender } from '../../hooks/useEmailSender';
import { newsletterService } from '../../services/newsletterService';
import type { NewsletterSubscriptionDto } from '../../services/newsletterService';
import type { EmailRecipientDto } from '../../services/emailService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Checkbox } from '../ui/checkbox';
import { 
  Mail, 
  Search, 
  Send, 
  Check, 
  AlertCircle, 
  Users,
  Filter,
  Download,
  Loader2,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';

export const NewsletterManagement: React.FC = () => {
  const { language } = useApp();
  const { sendBulkEmail, loading: emailLoading } = useEmailSender();
  const [subscriptions, setSubscriptions] = useState<NewsletterSubscriptionDto[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);
  
  // Email form
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    loadSubscriptions();
  }, [page, statusFilter, searchTerm]);

  const loadSubscriptions = async () => {
    setIsLoading(true);
    try {
      const params = {
        page,
        pageSize,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        searchTerm: searchTerm || undefined,
      };
      
      const response = await newsletterService.getSubscriptions(params);
      setSubscriptions(response.items);
      setTotalCount(response.totalCount);
    } catch (error: any) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const activeEmails = subscriptions
        .filter(sub => sub.isActive)
        .map(sub => sub.email);
      setSelectedEmails(activeEmails);
    } else {
      setSelectedEmails([]);
    }
  };

  const handleSelectEmail = (email: string, checked: boolean) => {
    if (checked) {
      setSelectedEmails(prev => [...prev, email]);
    } else {
      setSelectedEmails(prev => prev.filter(e => e !== email));
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      setSendStatus('error');
      setStatusMessage(language === 'ar' ? 'الرجاء ملء جميع الحقول' : 'Please fill all fields');
      return;
    }

    if (selectedEmails.length === 0) {
      setSendStatus('error');
      setStatusMessage(language === 'ar' ? 'الرجاء اختيار مستلمين' : 'Please select recipients');
      return;
    }

    setSendStatus('idle');
    setStatusMessage('');

    try {
      // Prepare recipients with email and name
      const recipients: EmailRecipientDto[] = selectedEmails.map(email => {
        const subscriber = subscriptions.find(sub => sub.email === email);
        return {
          email: email,
          name: subscriber?.name
        };
      });

      // Use Email API (bulk send) instead of Newsletter API
      const result = await sendBulkEmail({
        recipients: recipients,
        subject: emailSubject,
        body: emailBody,
        isHtml: true,
        delayBetweenEmailsMs: 500 // 500ms delay between emails to avoid spam filters
      });

      if (result.success || result.successfulCount > 0) {
        setSendStatus('success');
        if (result.failedCount === 0) {
          setStatusMessage(
            language === 'ar'
              ? `تم إرسال ${result.successfulCount} بريد إلكتروني بنجاح`
              : `${result.successfulCount} emails sent successfully`
          );
        } else {
          setStatusMessage(
            language === 'ar'
              ? `تم إرسال ${result.successfulCount} بريد بنجاح، فشل ${result.failedCount}`
              : `${result.successfulCount} sent successfully, ${result.failedCount} failed`
          );
        }
      } else {
        setSendStatus('error');
        setStatusMessage(
          language === 'ar'
            ? `فشل إرسال جميع الرسائل. ${result.message}`
            : `Failed to send all emails. ${result.message}`
        );
      }
      
      // Log errors if available
      if (result.errors && result.errors.length > 0) {
        console.error('Email errors:', result.errors);
      }
      
      // Reset form
      setEmailSubject('');
      setEmailBody('');
      setSelectedEmails([]);
      setShowEmailForm(false);

      setTimeout(() => {
        setSendStatus('idle');
        setStatusMessage('');
      }, 5000);
    } catch (error: any) {
      setSendStatus('error');
      const errorMessage = error?.response?.data?.message || error?.message || 
        (language === 'ar'
          ? 'فشل إرسال البريد الإلكتروني. حاول مرة أخرى'
          : 'Failed to send email. Please try again');
      setStatusMessage(errorMessage);
      console.error('Email send error:', error);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Email', 'Name', 'Status', 'Subscribed Date'].join(','),
      ...subscriptions.map(sub => [
        sub.email,
        sub.name || '',
        sub.isActive ? 'Active' : 'Inactive',
        new Date(sub.subscribedAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const activeCount = subscriptions.filter(sub => sub.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              {language === 'ar' ? 'إجمالي المشتركين' : 'Total Subscribers'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-500" />
              {language === 'ar' ? 'مشتركون نشطون' : 'Active Subscribers'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Check className="h-4 w-4 text-purple-500" />
              {language === 'ar' ? 'محددون' : 'Selected'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedEmails.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {language === 'ar' ? 'إدارة الخبرنامة' : 'Newsletter Management'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' 
              ? 'إدارة المشتركين وإرسال رسائل البريد الإلكتروني' 
              : 'Manage subscribers and send email campaigns'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={language === 'ar' ? 'بحث بالبريد الإلكتروني...' : 'Search by email...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {language === 'ar' ? 'الكل' : 'All'}
                </SelectItem>
                <SelectItem value="active">
                  {language === 'ar' ? 'نشط' : 'Active'}
                </SelectItem>
                <SelectItem value="inactive">
                  {language === 'ar' ? 'غير نشط' : 'Inactive'}
                </SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={exportToCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'تصدير' : 'Export'}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setShowEmailForm(!showEmailForm)}
              disabled={selectedEmails.length === 0}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {language === 'ar' 
                ? `إرسال بريد إلكتروني (${selectedEmails.length})` 
                : `Send Email (${selectedEmails.length})`}
            </Button>
          </div>

          {/* Email Form */}
          {showEmailForm && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {language === 'ar' ? 'موضوع البريد الإلكتروني' : 'Email Subject'}
                </label>
                <Input
                  placeholder={language === 'ar' ? 'أدخل الموضوع...' : 'Enter subject...'}
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {language === 'ar' ? 'محتوى البريد الإلكتروني' : 'Email Body'}
                </label>
                <Textarea
                  placeholder={language === 'ar' ? 'أدخل محتوى البريد الإلكتروني...' : 'Enter email content...'}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSendEmail} disabled={emailLoading}>
                  {emailLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {language === 'ar' ? 'جاري الإرسال...' : 'Sending...'}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'إرسال الآن' : 'Send Now'}
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowEmailForm(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
              </div>
            </div>
          )}

          {/* Status Message */}
          {sendStatus !== 'idle' && statusMessage && (
            <Alert variant={sendStatus === 'success' ? 'default' : 'destructive'}>
              {sendStatus === 'success' ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}

          {/* Subscribers Table */}
          <div className="border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{language === 'ar' ? 'لا يوجد مشتركون' : 'No subscribers found'}</p>
              </div>
            ) : (
              <>
                {/* Mobile list */}
                <div className="md:hidden p-3 space-y-3">
                  <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3">
                    <Checkbox
                      checked={selectedEmails.length === activeCount && activeCount > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">
                      {language === 'ar' ? 'تحديد الكل' : 'Select all'}
                    </span>
                  </div>

                  {subscriptions.map((subscription) => (
                    <div key={subscription.id} className="rounded-lg border bg-card p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedEmails.includes(subscription.email)}
                          onCheckedChange={(checked) =>
                            handleSelectEmail(subscription.email, checked as boolean)
                          }
                          disabled={!subscription.isActive}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{subscription.email}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {subscription.name || '-'}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {subscription.isActive ? (
                              <Badge variant="default" className="bg-green-500">
                                <UserCheck className="h-3 w-3 mr-1" />
                                {language === 'ar' ? 'نشط' : 'Active'}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <UserX className="h-3 w-3 mr-1" />
                                {language === 'ar' ? 'غير نشط' : 'Inactive'}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(subscription.subscribedAt).toLocaleDateString(
                                language === 'ar' ? 'ar-EG' : 'en-US'
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block w-full min-w-0 max-w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedEmails.length === activeCount && activeCount > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                        <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                        <TableHead>{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                        <TableHead>{language === 'ar' ? 'تاريخ الاشتراك' : 'Subscribed Date'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((subscription) => (
                        <TableRow key={subscription.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedEmails.includes(subscription.email)}
                              onCheckedChange={(checked) => 
                                handleSelectEmail(subscription.email, checked as boolean)
                              }
                              disabled={!subscription.isActive}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{subscription.email}</TableCell>
                          <TableCell>{subscription.name || '-'}</TableCell>
                          <TableCell>
                            {subscription.isActive ? (
                              <Badge variant="default" className="bg-green-500">
                                <UserCheck className="h-3 w-3 mr-1" />
                                {language === 'ar' ? 'نشط' : 'Active'}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <UserX className="h-3 w-3 mr-1" />
                                {language === 'ar' ? 'غير نشط' : 'Inactive'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(subscription.subscribedAt).toLocaleDateString(
                              language === 'ar' ? 'ar-EG' : 'en-US'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {language === 'ar'
                  ? `عرض ${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, totalCount)} من ${totalCount}`
                  : `Showing ${(page - 1) * pageSize + 1} - ${Math.min(page * pageSize, totalCount)} of ${totalCount}`}
              </p>
              <div className="flex gap-2 justify-between sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {language === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
