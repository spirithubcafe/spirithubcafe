import React, { useCallback, useState } from 'react';
import { Bell, BellRing, Check, Loader2, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  coffeeFollowAlertService,
  type CoffeeFollowSubscription,
  type CoffeeReleaseFollowValue,
} from '../../services/coffeeFollowAlertService';

const releaseOptions: Array<{ value: CoffeeReleaseFollowValue; en: string; ar: string }> = [
  { value: 'all', en: 'All new releases', ar: 'كل الإصدارات الجديدة' },
  { value: 'ethiopia', en: 'Ethiopian coffees', ar: 'القهوة الإثيوبية' },
  { value: 'colombia', en: 'Colombian coffees', ar: 'القهوة الكولومبية' },
  { value: 'yemen', en: 'Yemeni coffees', ar: 'القهوة اليمنية' },
  { value: 'microlot', en: 'Microlots', ar: 'المحاصيل النادرة' },
];

const getRegion = (regionPrefix: string) => regionPrefix.startsWith('/sa') ? 'sa' : 'om';

const goToLogin = (regionPrefix: string) => {
  const redirect = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `${regionPrefix}/login?redirect=${redirect}`;
};

export const CoffeeReleaseAlertsCard: React.FC<{
  language: string;
  regionPrefix: string;
}> = ({ language, regionPrefix }) => {
  const { isAuthenticated } = useAuth();
  const isAr = language === 'ar';
  const [expanded, setExpanded] = useState(false);
  const [busyValue, setBusyValue] = useState<string | null>(null);
  const [activeValues, setActiveValues] = useState<Set<string>>(new Set());
  const [subscriptions, setSubscriptions] = useState<CoffeeFollowSubscription[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(async (value: CoffeeReleaseFollowValue) => {
    if (!isAuthenticated) {
      goToLogin(regionPrefix);
      return;
    }

    setBusyValue(value);
    setError(null);
    try {
      await coffeeFollowAlertService.subscribe({
        followType: 'new-release',
        followValue: value,
        language,
        branchCode: getRegion(regionPrefix),
      });
      setActiveValues((prev) => new Set(prev).add(value));
    } catch (err: any) {
      setError(err?.message || (isAr ? 'تعذر تفعيل التنبيه الآن.' : 'I could not enable that alert right now.'));
    } finally {
      setBusyValue(null);
    }
  }, [isAr, isAuthenticated, language, regionPrefix]);

  const loadSubscriptions = useCallback(async () => {
    if (!isAuthenticated) {
      goToLogin(regionPrefix);
      return;
    }

    setBusyValue('manage');
    setError(null);
    try {
      const items = await coffeeFollowAlertService.list();
      setSubscriptions(items);
      setExpanded(true);
      setActiveValues(new Set(items.filter((item) => item.followType === 'new-release').map((item) => item.followValue || 'all')));
    } catch (err: any) {
      setError(err?.message || (isAr ? 'تعذر تحميل التنبيهات.' : 'I could not load your alerts.'));
    } finally {
      setBusyValue(null);
    }
  }, [isAr, isAuthenticated, regionPrefix]);

  const removeSubscription = useCallback(async (item: CoffeeFollowSubscription) => {
    setBusyValue(item.key);
    setError(null);
    try {
      await coffeeFollowAlertService.unsubscribe(item.key, language, getRegion(regionPrefix));
      setSubscriptions((prev) => prev ? prev.filter((entry) => entry.key !== item.key) : prev);
      if (item.followType === 'new-release') {
        setActiveValues((prev) => {
          const next = new Set(prev);
          next.delete(item.followValue || 'all');
          return next;
        });
      }
    } catch (err: any) {
      setError(err?.message || (isAr ? 'تعذر إيقاف التنبيه.' : 'I could not stop that alert.'));
    } finally {
      setBusyValue(null);
    }
  }, [isAr, language, regionPrefix]);

  return (
    <div className="rounded-2xl border border-[#eadfd9] bg-[#fffaf7] p-2.5 shadow-sm" dir={isAr ? 'rtl' : 'ltr'}>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white text-[#c75049] shadow-sm ring-1 ring-[#f2ddd8]">
          <Bell className="h-4 w-4" />
        </span>
        <span className={`min-w-0 flex-1 ${isAr ? 'text-right' : ''}`}>
          <span className="block text-[12px] font-extrabold text-stone-900">
            {isAr ? 'تابع أنواع القهوة المفضلة لديك' : 'Follow Your Favorite Coffees'}
          </span>
          <span className="block text-[10px] leading-relaxed text-stone-500">
            {isAr ? 'اختر ما تريد وسنرسل لك رسالة واتساب فقط عند وجود جديد.' : 'Choose what to follow and we will WhatsApp you only when there is something new.'}
          </span>
        </span>
        <BellRing className="h-4 w-4 flex-shrink-0 text-[#8e4e47]" />
      </button>

      {expanded && (
        <div className="mt-2.5 border-t border-[#f2ddd8] pt-2.5">
          <div className="grid grid-cols-2 gap-1.5">
            {releaseOptions.map((option) => {
              const active = activeValues.has(option.value);
              const busy = busyValue === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => subscribe(option.value)}
                  disabled={busy || active}
                  className={`min-h-9 rounded-xl px-2 py-1.5 text-[11px] font-bold transition-colors ${active
                    ? 'border border-[#d9ead4] bg-[#f2f8ef] text-[#4e8146]'
                    : 'border border-[#f2ddd8] bg-white text-[#8e4e47] hover:bg-[#fff1ed]'} disabled:cursor-default`}
                >
                  <span className="inline-flex items-center justify-center gap-1">
                    {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : active ? <Check className="h-3 w-3" /> : null}
                    {isAr ? option.ar : option.en}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={loadSubscriptions}
            disabled={busyValue === 'manage'}
            className="mt-2 w-full rounded-xl border border-[#f2ddd8] bg-white px-2.5 py-2 text-[11px] font-bold text-stone-600 hover:bg-[#fffaf7]"
          >
            {busyValue === 'manage' ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : (isAr ? 'إدارة تنبيهاتي' : 'Manage my alerts')}
          </button>

          {subscriptions && subscriptions.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {subscriptions.map((item) => {
                const label = item.followType === 'back-in-stock'
                  ? (isAr ? item.productNameAr || item.productName || 'تنبيه توفر منتج' : item.productName || 'Back-in-stock alert')
                  : releaseOptions.find((option) => option.value === (item.followValue || 'all'))?.[isAr ? 'ar' : 'en'] || item.followValue || 'New releases';
                return (
                  <div key={item.key} className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 ring-1 ring-[#f3e6e1]">
                    <Check className="h-3.5 w-3.5 flex-shrink-0 text-[#5f9b54]" />
                    <span className={`min-w-0 flex-1 truncate text-[10px] font-semibold text-stone-700 ${isAr ? 'text-right' : ''}`}>{label}</span>
                    <button
                      type="button"
                      onClick={() => removeSubscription(item)}
                      disabled={busyValue === item.key}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-[#c75049]"
                      aria-label={isAr ? 'إيقاف التنبيه' : 'Stop alert'}
                    >
                      {busyValue === item.key ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {subscriptions && subscriptions.length === 0 && (
            <p className="mt-2 text-center text-[10px] text-stone-500">{isAr ? 'لا توجد تنبيهات مفعلة حالياً.' : 'You do not have any active alerts yet.'}</p>
          )}

          {error && <p className={`mt-2 text-[10px] font-semibold text-rose-600 ${isAr ? 'text-right' : ''}`}>{error}</p>}
          <p className={`mt-2 text-[9px] leading-relaxed text-stone-400 ${isAr ? 'text-right' : ''}`}>
            {isAr ? 'التفعيل اختياري. يمكنك إيقاف أي تنبيه في أي وقت.' : 'Alerts are opt-in only. You can stop any alert at any time.'}
          </p>
        </div>
      )}
    </div>
  );
};

export const BackInStockAlertButton: React.FC<{
  productId: number;
  productName: string;
  language: string;
  regionPrefix: string;
}> = ({ productId, productName, language, regionPrefix }) => {
  const { isAuthenticated } = useAuth();
  const isAr = language === 'ar';
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const subscribe = async () => {
    if (!isAuthenticated) {
      goToLogin(regionPrefix);
      return;
    }

    setState('busy');
    setError(null);
    try {
      await coffeeFollowAlertService.subscribe({
        followType: 'back-in-stock',
        productId,
        language,
        branchCode: getRegion(regionPrefix),
      });
      setState('done');
    } catch (err: any) {
      if (err?.rawData?.code === 'ALREADY_IN_STOCK') {
        setError(isAr ? 'هذه القهوة متوفرة الآن.' : 'This coffee is already back in stock.');
      } else if (err?.rawData?.code === 'PHONE_REQUIRED') {
        setError(isAr ? 'أضف رقم هاتف إلى حسابك أولاً لتلقي تنبيهات واتساب.' : 'Add a phone number to your account first to receive WhatsApp alerts.');
      } else {
        setError(err?.message || (isAr ? 'تعذر تفعيل التنبيه.' : 'I could not enable the alert.'));
      }
      setState('error');
    }
  };

  return (
    <div className="mt-1.5" dir={isAr ? 'rtl' : 'ltr'}>
      <button
        type="button"
        onClick={subscribe}
        disabled={state === 'busy' || state === 'done'}
        className={`flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold transition-colors ${state === 'done'
          ? 'border border-[#d9ead4] bg-[#f2f8ef] text-[#4e8146]'
          : 'border border-[#f2ddd8] bg-white text-[#8e4e47] hover:bg-[#fff1ed]'}`}
      >
        {state === 'busy' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : state === 'done' ? <Check className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
        {state === 'done'
          ? (isAr ? 'تم تفعيل تنبيه واتساب' : 'WhatsApp alert enabled')
          : (isAr ? `نبّهني عند توفر ${productName}` : `Notify me when ${productName} is back`)}
      </button>
      {error && <p className={`mt-1 text-[10px] font-semibold text-rose-600 ${isAr ? 'text-right' : ''}`}>{error}</p>}
    </div>
  );
};
