import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Send,
  Image,
  Phone,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { useWhatsApp } from '../../hooks/useWhatsApp';
import { useApp } from '../../hooks/useApp';
import {
  CountryCodePicker,
  getDefaultCountry,
  type Country,
} from '../ui/CountryCodePicker';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';

type SendType = 'text' | 'image';

export const WhatsAppSendMessage: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  const [sendType, setSendType] = useState<SendType>('text');
  const [recipientInput, setRecipientInput] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(getDefaultCountry);
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [imageError, setImageError] = useState(false);

  const { loading, error, success, sendText, sendImage, reset, formatPhone, isValidPhone } = useWhatsApp();

  const handleRecipientsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRecipientInput(e.target.value);
    reset();
  };

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    reset();
  };

  const recipientNumbers = useMemo(() => {
    const parsed = recipientInput
      .split(/[\n,;]+/)
      .map((entry) => entry.replace(/\D/g, '').trim())
      .filter(Boolean);

    return Array.from(new Set(parsed));
  }, [recipientInput]);

  const validRecipientNumbers = useMemo(
    () =>
      recipientNumbers.filter((phone) =>
        isValidPhone(phone, selectedCountry.maxDigits, selectedCountry.startsWith)
      ),
    [isValidPhone, recipientNumbers, selectedCountry.maxDigits, selectedCountry.startsWith]
  );

  const invalidRecipientNumbers = useMemo(
    () =>
      recipientNumbers.filter(
        (phone) => !isValidPhone(phone, selectedCountry.maxDigits, selectedCountry.startsWith)
      ),
    [isValidPhone, recipientNumbers, selectedCountry.maxDigits, selectedCountry.startsWith]
  );

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validRecipientNumbers.length || invalidRecipientNumbers.length > 0) {
      return;
    }

    let successCount = 0;
    let failedCount = 0;

    for (const phoneNumber of validRecipientNumbers) {
      const result = await sendText({
        phoneNumber,
        message,
        countryDialCode: selectedCountry.dialCode,
      });

      if (result) {
        successCount += 1;
      } else {
        failedCount += 1;
      }
    }

    if (successCount > 0) {
      toast.success(
        isArabic
          ? `تم إرسال ${successCount} رسالة بنجاح`
          : `Sent successfully to ${successCount} recipient${successCount > 1 ? 's' : ''}`
      );
      setMessage('');
    }

    if (failedCount > 0) {
      toast.error(
        isArabic
          ? `فشل الإرسال إلى ${failedCount} مستلم`
          : `Failed to send to ${failedCount} recipient${failedCount > 1 ? 's' : ''}`
      );
    }
  };

  const handleSendImage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validRecipientNumbers.length || invalidRecipientNumbers.length > 0) {
      return;
    }

    let successCount = 0;
    let failedCount = 0;

    for (const phoneNumber of validRecipientNumbers) {
      const result = await sendImage({
        phoneNumber,
        imageUrl,
        caption: caption || undefined,
        countryDialCode: selectedCountry.dialCode,
      });

      if (result) {
        successCount += 1;
      } else {
        failedCount += 1;
      }
    }

    if (successCount > 0) {
      toast.success(
        isArabic
          ? `تم إرسال ${successCount} صورة بنجاح`
          : `Image sent successfully to ${successCount} recipient${successCount > 1 ? 's' : ''}`
      );
      setImageUrl('');
      setCaption('');
      setImageError(false);
    }

    if (failedCount > 0) {
      toast.error(
        isArabic
          ? `فشل الإرسال إلى ${failedCount} مستلم`
          : `Failed to send to ${failedCount} recipient${failedCount > 1 ? 's' : ''}`
      );
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
    setImageError(false);
    reset();
  };

  const texts = {
    en: {
      title: 'Send WhatsApp Message',
      description: 'Send messages or images to customers via WhatsApp',
      textTab: 'Text Message',
      imageTab: 'Image with Caption',
      phoneLabel: 'Recipient Phone Number(s)',
      phonePlaceholder:
        selectedCountry.code === 'OM' ? '92506030, 90123456' : '5XXXXXXXX, 6XXXXXXXX',
      recipientsHint: 'Separate multiple numbers with comma or new line',
      validRecipients: 'valid recipient(s)',
      invalidRecipients: 'invalid recipient(s)',
      messageLabel: 'Message',
      messagePlaceholder: 'Type your message here...',
      charCount: 'characters',
      imageUrlLabel: 'Image URL',
      imageUrlPlaceholder: 'https://example.com/image.jpg',
      captionLabel: 'Caption (optional)',
      captionPlaceholder: 'Add a caption for the image...',
      preview: 'Preview',
      invalidUrl: 'Invalid image URL',
      send: 'Send via WhatsApp',
      sending: 'Sending...',
      sent: 'Message sent!',
    },
    ar: {
      title: 'إرسال رسالة واتساب',
      description: 'إرسال رسائل أو صور للعملاء عبر واتساب',
      textTab: 'رسالة نصية',
      imageTab: 'صورة مع تعليق',
      phoneLabel: 'رقم هاتف المستلم',
      phonePlaceholder:
        selectedCountry.code === 'OM' ? '92506030, 90123456' : '5XXXXXXXX, 6XXXXXXXX',
      recipientsHint: 'افصل بين الأرقام بفاصلة أو سطر جديد',
      validRecipients: 'مستلم صالح',
      invalidRecipients: 'مستلم غير صالح',
      messageLabel: 'الرسالة',
      messagePlaceholder: 'اكتب رسالتك هنا...',
      charCount: 'حرف',
      imageUrlLabel: 'رابط الصورة',
      imageUrlPlaceholder: 'https://example.com/image.jpg',
      captionLabel: 'تعليق (اختياري)',
      captionPlaceholder: 'اكتب تعليقاً للصورة...',
      preview: 'معاينة',
      invalidUrl: 'رابط الصورة غير صالح',
      send: 'إرسال عبر واتساب',
      sending: 'جاري الإرسال...',
      sent: 'تم إرسال الرسالة!',
    },
  };

  const copy = isArabic ? texts.ar : texts.en;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.description}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>{copy.sent}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {copy.phoneLabel}
            </Label>
            <div className="flex gap-2" dir="ltr">
              <CountryCodePicker
                value={selectedCountry}
                onChange={handleCountryChange}
                isArabic={isArabic}
                compact
              />
              <Textarea
                id="phone"
                value={recipientInput}
                onChange={handleRecipientsChange}
                placeholder={copy.phonePlaceholder}
                rows={2}
                className="flex-1 resize-none"
                dir="ltr"
              />
            </div>

            <p className="text-xs text-muted-foreground">{copy.recipientsHint}</p>

            {recipientNumbers.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-green-600">
                  {validRecipientNumbers.length} {copy.validRecipients}
                </p>
                {invalidRecipientNumbers.length > 0 && (
                  <p className="text-xs text-amber-600">
                    {invalidRecipientNumbers.length} {copy.invalidRecipients} (
                    {isArabic
                      ? `أدخل ${selectedCountry.maxDigits} أرقام${selectedCountry.startsWith ? ` تبدأ بـ ${selectedCountry.startsWith}` : ''}`
                      : `Use ${selectedCountry.maxDigits} digits${selectedCountry.startsWith ? ` starting with ${selectedCountry.startsWith}` : ''}`}
                    )
                  </p>
                )}
                {validRecipientNumbers.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {validRecipientNumbers
                      .slice(0, 3)
                      .map((phone) => `${selectedCountry.flag} ${formatPhone(phone, selectedCountry.dialCode)}`)
                      .join(' | ')}
                    {validRecipientNumbers.length > 3 ? ' ...' : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <Tabs value={sendType} onValueChange={(v) => setSendType(v as SendType)}>
          <CardHeader className="pb-3">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {copy.textTab}
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                {copy.imageTab}
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            <TabsContent value="text" className="mt-0">
              <form onSubmit={handleSendText} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="message">{copy.messageLabel}</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={copy.messagePlaceholder}
                    rows={5}
                    maxLength={2000}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {message.length}/2000 {copy.charCount}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={
                    loading ||
                    validRecipientNumbers.length === 0 ||
                    invalidRecipientNumbers.length > 0 ||
                    !message.trim()
                  }
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {copy.sending}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {copy.send}
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="image" className="mt-0">
              <form onSubmit={handleSendImage} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">{copy.imageUrlLabel}</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={imageUrl}
                    onChange={handleImageUrlChange}
                    placeholder={copy.imageUrlPlaceholder}
                    dir="ltr"
                  />
                </div>

                {imageUrl && (
                  <div className="space-y-2">
                    <Label>{copy.preview}</Label>
                    <div className="relative border rounded-lg p-2 bg-gray-50">
                      {imageError ? (
                        <div className="flex items-center justify-center h-32 text-red-500 text-sm">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          {copy.invalidUrl}
                        </div>
                      ) : (
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="max-h-48 mx-auto rounded-lg object-contain"
                          onError={() => setImageError(true)}
                          onLoad={() => setImageError(false)}
                        />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => {
                          setImageUrl('');
                          setImageError(false);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="caption">{copy.captionLabel}</Label>
                  <Textarea
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={copy.captionPlaceholder}
                    rows={3}
                    maxLength={1000}
                    className="resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={
                    loading ||
                    validRecipientNumbers.length === 0 ||
                    invalidRecipientNumbers.length > 0 ||
                    !imageUrl.trim() ||
                    imageError
                  }
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {copy.sending}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {copy.send}
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
            </div>
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">
                {isArabic ? 'نصائح مهمة:' : 'Important Tips:'}
              </p>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                <li>{isArabic ? 'اختر الدولة ثم أدخل رقماً واحداً أو عدة أرقام محلية' : 'Select the country, then enter one or multiple local phone numbers'}</li>
                <li>{isArabic ? 'يجب أن يكون لدى المستلم تطبيق واتساب' : 'Recipient must have WhatsApp installed'}</li>
                <li>{isArabic ? 'يجب أن تحتوي الصور على رابط URL عام يمكن الوصول إليه' : 'Images must have a publicly accessible URL'}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
