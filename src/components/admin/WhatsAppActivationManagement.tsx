import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Image,
  Loader2,
  Monitor,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '../../hooks/useApp';
import { safeStorage } from '../../lib/safeStorage';
import { whatsappService } from '../../services/whatsappService';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';

type ActivationViewState = {
  loading: boolean;
  type: 'idle' | 'qr' | 'screenshot' | 'error';
  message: string;
  imageUrl: string | null;
  status: number | null;
  session: string | null;
  updatedAt: string | null;
};

const RECENT_SESSIONS_KEY = 'admin.whatsapp.recent-sessions';
const AUTO_REFRESH_INTERVAL = 30000;

const INITIAL_STATE: ActivationViewState = {
  loading: false,
  type: 'idle',
  message: '',
  imageUrl: null,
  status: null,
  session: null,
  updatedAt: null,
};

export const WhatsAppActivationManagement: React.FC = () => {
  const { language } = useApp();
  const isArabic = language === 'ar';

  const copy = useMemo(() => ({
    title: isArabic ? 'واتساب' : 'WhatsApp',
    sessionLabel: isArabic ? 'معرّف الجلسة / الحساب' : 'Session / account identifier',
    sessionPlaceholder: isArabic ? 'مثال: spirithubcafe' : 'Example: spirithubcafe',
    defaultSession: isArabic ? 'الجلسة الافتراضية' : 'Default session',
    recentSessions: isArabic ? 'الجلسات الأخيرة' : 'Recent sessions',
    startActivation: isArabic ? 'بدء التفعيل الذكي' : 'Start smart activation',
    refreshPreview: isArabic ? 'تحديث المعاينة' : 'Refresh preview',
    loadScreenshot: isArabic ? 'فحص الشاشة الحية' : 'Load live screenshot',
    clearPreview: isArabic ? 'مسح المعاينة' : 'Clear preview',
    autoRefresh: isArabic ? 'تحديث تلقائي كل 30 ثانية' : 'Auto-refresh every 30 seconds',
    previewTitle: isArabic ? 'معاينة الجلسة' : 'Session preview',
    loading: isArabic ? 'جارٍ تحميل حالة واتساب...' : 'Loading WhatsApp status...',
    idleTitle: isArabic ? 'جاهز للبدء' : 'Ready to start',
    idleMessage: isArabic
      ? 'به صورت پیش‌فرض ابتدا اسکرین‌شات زنده بارگذاری می‌شود. اگر جلسه هنوز pair نشده باشد، از دکمه تفعيل هوشمند برای دریافت QR استفاده کنید.'
      : 'By default, the live screenshot loads first. If the session is not paired yet, use smart activation to request the QR.',
    active: isArabic ? 'نشطة' : 'Active',
    waitingQr: isArabic ? 'بانتظار QR' : 'Waiting for QR',
    issue: isArabic ? 'تحتاج متابعة' : 'Needs attention',
    recentEmpty: isArabic ? 'لا توجد جلسات محفوظة بعد.' : 'No saved sessions yet.',
    screenshotOnlyError: isArabic ? 'تعذر تحميل لقطة الشاشة الحالية.' : 'Unable to load the current session screenshot.',
    genericLoadError: isArabic ? 'تعذر تحميل حالة واتساب.' : 'Unable to load the WhatsApp state.',
    noPreview: isArabic ? 'لا توجد صورة حالية' : 'No current preview',
    saveSessionToast: isArabic ? 'تم حفظ الجلسة ضمن القائمة السريعة.' : 'Session saved to quick access.',
  }), [isArabic]);

  const [sessionInput, setSessionInput] = useState('');
  const [recentSessions, setRecentSessions] = useState<string[]>(() => {
    return safeStorage.getJson<string[]>(RECENT_SESSIONS_KEY) ?? [];
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [state, setState] = useState<ActivationViewState>(INITIAL_STATE);

  const requestIdRef = useRef(0);

  const persistRecentSessions = useCallback((session: string | null) => {
    if (!session) {
      return;
    }

    setRecentSessions((prev) => {
      const next = [session, ...prev.filter((item) => item !== session)].slice(0, 6);
      safeStorage.setJson(RECENT_SESSIONS_KEY, next);
      return next;
    });
  }, []);

  const replaceImageUrl = useCallback((nextImageUrl: string | null) => {
    setState((prev) => {
      if (prev.imageUrl && prev.imageUrl !== nextImageUrl) {
        URL.revokeObjectURL(prev.imageUrl);
      }

      return {
        ...prev,
        imageUrl: nextImageUrl,
      };
    });
  }, []);

  const applySuccessState = useCallback((result: { type: 'qr' | 'screenshot'; imageUrl?: string; message: string; session: string | null; status: number; }) => {
    replaceImageUrl(result.imageUrl ?? null);
    setState((prev) => ({
      ...prev,
      loading: false,
      type: result.type,
      message: result.message,
      status: result.status,
      session: result.session,
      updatedAt: new Date().toISOString(),
    }));
    persistRecentSessions(result.session);
  }, [persistRecentSessions, replaceImageUrl]);

  const applyErrorState = useCallback((message: string, session: string | null, status: number) => {
    replaceImageUrl(null);
    setState((prev) => ({
      ...prev,
      loading: false,
      type: 'error',
      message,
      status,
      session,
      updatedAt: new Date().toISOString(),
    }));
  }, [replaceImageUrl]);

  const loadState = useCallback(async (mode: 'auto' | 'screenshot' = 'auto', overrideSession?: string | null) => {
    const normalizedSession = (overrideSession ?? sessionInput).trim() || null;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setState((prev) => ({
      ...prev,
      loading: true,
      message: copy.loading,
      session: normalizedSession,
    }));

    try {
      if (mode === 'auto') {
        const result = await whatsappService.loadActivationImage(normalizedSession, isArabic);
        if (requestId !== requestIdRef.current) {
          if (result.imageUrl) {
            URL.revokeObjectURL(result.imageUrl);
          }
          return;
        }

        if (result.type === 'error') {
          applyErrorState(result.message, result.session, result.status);
          return;
        }

        if (result.type === 'qr' || result.type === 'screenshot') {
          applySuccessState({
            type: result.type,
            imageUrl: result.imageUrl,
            message: result.message,
            session: result.session,
            status: result.status,
          });
        }
        return;
      }

      const screenshotResult = await whatsappService.fetchActivationAsset('screenshot', normalizedSession);
      if (requestId !== requestIdRef.current) {
        if (screenshotResult.ok) {
          URL.revokeObjectURL(screenshotResult.imageUrl);
        }
        return;
      }

      if (!screenshotResult.ok) {
        applyErrorState(
          screenshotResult.error?.message || screenshotResult.error?.error || copy.screenshotOnlyError,
          normalizedSession,
          screenshotResult.status,
        );
        return;
      }

      applySuccessState({
        type: 'screenshot',
        imageUrl: screenshotResult.imageUrl,
        message: copy.active,
        session: normalizedSession,
        status: screenshotResult.status,
      });
    } catch (error: any) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      applyErrorState(error?.message || copy.genericLoadError, normalizedSession, error?.statusCode || 500);
    }
  }, [applyErrorState, applySuccessState, copy.active, copy.genericLoadError, copy.loading, copy.screenshotOnlyError, isArabic, sessionInput]);

  useEffect(() => {
    void loadState('screenshot', null);
  }, [loadState]);

  useEffect(() => {
    if (!autoRefresh || state.type !== 'screenshot' || state.loading) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void loadState('screenshot', state.session);
    }, AUTO_REFRESH_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoRefresh, loadState, state.loading, state.session, state.type]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      setState((prev) => {
        if (prev.imageUrl) {
          URL.revokeObjectURL(prev.imageUrl);
        }
        return prev;
      });
    };
  }, []);

  const handleRecentSessionClick = (session: string) => {
    setSessionInput(session);
    toast.success(copy.saveSessionToast);
    void loadState('auto', session);
  };

  const handleClearPreview = () => {
    replaceImageUrl(null);
    setState((prev) => ({
      ...prev,
      loading: false,
      type: 'idle',
      message: copy.noPreview,
      status: null,
      updatedAt: null,
    }));
  };

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-950">{copy.title}</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]">
            <Card className="border-stone-200">
              <CardHeader>
                <CardTitle>{copy.previewTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {state.type === 'error' ? (
                  <Alert variant="destructive" className="border-destructive/30">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{copy.issue}</AlertTitle>
                    <AlertDescription>{state.message}</AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="border-stone-200 bg-stone-50">
                    {state.type === 'screenshot' ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Monitor className="h-4 w-4 text-stone-700" />}
                    <AlertTitle>{state.type === 'screenshot' ? copy.active : state.type === 'qr' ? copy.waitingQr : copy.idleTitle}</AlertTitle>
                    <AlertDescription>{state.message || copy.idleMessage}</AlertDescription>
                  </Alert>
                )}

                <div className="relative overflow-hidden rounded-[24px] border border-dashed border-stone-300 bg-[linear-gradient(180deg,_rgba(250,250,249,0.95),_rgba(245,245,244,0.95))] p-4 sm:p-6">
                  {state.loading ? (
                    <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center text-stone-600">
                      <Loader2 className="h-8 w-8 animate-spin text-stone-700" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-stone-900">{copy.loading}</p>
                      </div>
                    </div>
                  ) : state.imageUrl ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3 text-xs text-stone-500">
                        <span>{state.type === 'qr' ? copy.waitingQr : copy.active}</span>
                        <span>{state.session || copy.defaultSession}</span>
                      </div>
                      <div className="overflow-hidden rounded-[20px] border border-stone-200 bg-white shadow-sm">
                        <img
                          src={state.imageUrl}
                          alt={state.type === 'qr' ? 'WhatsApp activation QR code' : 'WhatsApp session screenshot'}
                          className="h-auto max-h-[560px] w-full object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 text-center text-stone-600">
                      <Image className="h-10 w-10 text-stone-400" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-stone-900">{copy.idleTitle}</p>
                        <p className="mx-auto max-w-md text-sm leading-6 text-stone-500">{copy.idleMessage}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-stone-200">
                <CardHeader>
                  <CardTitle>{copy.sessionLabel}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-session-input">{copy.sessionLabel}</Label>
                    <Input
                      id="whatsapp-session-input"
                      value={sessionInput}
                      onChange={(event) => setSessionInput(event.target.value)}
                      placeholder={copy.sessionPlaceholder}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button className="gap-2" onClick={() => void loadState('auto')} disabled={state.loading}>
                      {state.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                      {copy.startActivation}
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => void loadState('screenshot')} disabled={state.loading}>
                      <Monitor className="h-4 w-4" />
                      {copy.loadScreenshot}
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => void loadState(state.type === 'screenshot' ? 'screenshot' : 'auto', state.session)} disabled={state.loading}>
                      <RefreshCw className="h-4 w-4" />
                      {copy.refreshPreview}
                    </Button>
                    <Button variant="ghost" className="gap-2" onClick={handleClearPreview}>
                      <Image className="h-4 w-4" />
                      {copy.clearPreview}
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 px-4 py-3">
                    <div className="text-sm font-medium text-stone-900">{copy.autoRefresh}</div>
                    <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-stone-200">
                <CardHeader>
                  <CardTitle>{copy.recentSessions}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!recentSessions.length ? (
                    <div className="text-sm text-stone-500">{copy.recentEmpty}</div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={!sessionInput.trim() ? 'default' : 'outline'}
                      size="sm"
                      className="rounded-full"
                      onClick={() => {
                        setSessionInput('');
                        void loadState('screenshot', null);
                      }}
                    >
                      {copy.defaultSession}
                    </Button>
                    {recentSessions.map((session) => (
                      <Button
                        key={session}
                        type="button"
                        variant={session === sessionInput.trim() ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-full"
                        onClick={() => handleRecentSessionClick(session)}
                      >
                        {session}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
      </div>
    </section>
  );
};