import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, MessageCircle } from 'lucide-react';
import { useApp } from '../../hooks/useApp';
import { useRegion } from '../../hooks/useRegion';
import { newsletterService } from '../../services';
import { REGION_INFO } from '../../config/regionInfo';

export const Footer: React.FC = () => {
  const { language } = useApp();
  const { currentRegion } = useRegion();
  const regionInfo = REGION_INFO[currentRegion.code];
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [appVersion, setAppVersion] = useState('');

  // Load app version
  useEffect(() => {
    fetch('/version.json')
      .then(res => res.json())
      .then(data => setAppVersion(data.version))
      .catch(() => setAppVersion('1.0.0'));
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setSubscribeStatus('error');
      setErrorMessage(language === 'ar' ? 'يرجى إدخال بريد إلكتروني صالح' : 'Please enter a valid email');
      return;
    }

    setSubscribeStatus('loading');
    setErrorMessage('');

    try {
      await newsletterService.subscribe({ email });
      setSubscribeStatus('success');
      setEmail('');
      setTimeout(() => setSubscribeStatus('idle'), 3000);
    } catch (error: any) {
      setSubscribeStatus('error');
      const message = error?.response?.data?.message || error?.message || (language === 'ar' ? 'حدث خطأ. حاول مرة أخرى.' : 'Unable to subscribe. Please try again later.');
      setErrorMessage(message);
      setTimeout(() => {
        setSubscribeStatus('idle');
        setErrorMessage('');
      }, 5000);
    }
  };

  // Helper to build region-aware URLs
  const getRegionalUrl = (path: string) => {
    if (path.startsWith('/om/') || path.startsWith('/sa/')) {
      return path;
    }
    return `/${currentRegion.code}${path}`;
  };

  const quickLinks = [
    { label: language === 'ar' ? 'الرئيسية' : 'Home', href: getRegionalUrl('/') },
    { label: language === 'ar' ? 'المتجر' : 'Shop', href: getRegionalUrl('/products') },
    { label: language === 'ar' ? 'من نحن' : 'About', href: getRegionalUrl('/about') },
    { label: language === 'ar' ? 'اتصل بنا' : 'Contact Us', href: getRegionalUrl('/contact') }
  ];

  const legalLinks = [
    { label: language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy', href: getRegionalUrl('/privacy') },
    { label: language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions', href: getRegionalUrl('/terms') },
    { label: language === 'ar' ? 'سياسة التوصيل' : 'Delivery Policy', href: getRegionalUrl('/delivery') },
    { label: language === 'ar' ? 'سياسة الاستبدال' : 'Refund Policy', href: getRegionalUrl('/refund') },
    { label: language === 'ar' ? 'الأسئلة الشائعة' : 'FAQ', href: getRegionalUrl('/faq') }
  ];

  const socialLinks = [
    ...(regionInfo.social.facebook ? [{ icon: Facebook, href: regionInfo.social.facebook, label: 'Facebook' }] : []),
    ...(regionInfo.social.instagram ? [{ icon: Instagram, href: regionInfo.social.instagram, label: 'Instagram' }] : []),
    { icon: MessageCircle, href: regionInfo.social.whatsapp, label: 'WhatsApp' },
    { icon: Mail, href: regionInfo.social.email, label: 'Email' }
  ];

  return (
    <footer className="relative text-white overflow-hidden md:mt-0">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          className="w-full h-full object-cover scale-[1.08] transform-gpu"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/video/back.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-24 pt-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Brand Section - Takes more space */}
            <div className="lg:col-span-5 space-y-6">
              <img 
                src="/images/logo/logo-light.png" 
                alt="Spirit Hub Roastery"
                className="h-16 w-auto"
              />
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-amber-200">
                  {language === 'ar' ? regionInfo.aboutContent.companyName.ar : regionInfo.aboutContent.companyName.en}
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {language === 'ar' ? regionInfo.aboutContent.description.ar : regionInfo.aboutContent.description.en}
                </p>
              </div>
            </div>

            {/* Other sections in smaller columns */}
            <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
              {/* Quick Links */}
              <div className="space-y-3">
                <h3 className="text-xs md:text-sm font-semibold text-amber-200 uppercase tracking-wider">
                  {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
                </h3>
                <ul className="space-y-2">
                  {quickLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-gray-300 hover:text-amber-200 transition-colors duration-200 text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal Pages */}
              <div className="space-y-3">
                <h3 className="text-xs md:text-sm font-semibold text-amber-200 uppercase tracking-wider">
                  {language === 'ar' ? 'الصفحات القانونية' : 'Legal Pages'}
                </h3>
                <ul className="space-y-2">
                  {legalLinks.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-gray-300 hover:text-amber-200 transition-colors duration-200 text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact Us */}
              <div className="space-y-3">
                <h3 className="text-xs md:text-sm font-semibold text-amber-200 uppercase tracking-wider">
                  {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">
                    {language === 'ar' ? regionInfo.contact.address.ar : regionInfo.contact.address.en}
                  </p>
                  <ul
                    className={`list-none pl-0 space-y-1 ${
                      language === 'ar' ? 'text-right' : 'text-left'
                    }`}
                    dir="ltr"
                  >
                    <li>
                      <a
                        href={`tel:${regionInfo.contact.phone.replace(/\s+/g, '')}`}
                        className="text-gray-300 hover:text-amber-200 transition-colors"
                      >
                        {regionInfo.contact.phone}
                      </a>
                    </li>
                    {regionInfo.contact.phone2 && (
                      <li>
                        <a
                          href={`tel:${regionInfo.contact.phone2.replace(/\s+/g, '')}`}
                          className="text-gray-300 hover:text-amber-200 transition-colors"
                        >
                          {regionInfo.contact.phone2}
                        </a>
                      </li>
                    )}
                  </ul>
                  <a
                    href={`mailto:${regionInfo.contact.email}`}
                    className="text-gray-300 hover:text-amber-200 transition-colors"
                  >
                    {regionInfo.contact.email}
                  </a>
                  <p className="text-gray-300 font-medium whitespace-pre-line">
                    {language === 'ar' ? regionInfo.contact.workingHours.ar : regionInfo.contact.workingHours.en}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links and Newsletter */}
          <div className="border-t border-gray-600/50 mt-12 pt-8">
            <div className="grid grid-cols-2 gap-4 md:gap-8 mb-6">
              {/* Follow Us - Left Side */}
              <div className="w-full">
                <h4 className="text-xs md:text-sm font-semibold text-amber-200 mb-2 uppercase tracking-wider">
                  {language === 'ar' ? 'تابعنا' : 'Follow Us'}
                </h4>
                <div className="flex gap-3 md:gap-4 mb-4 md:mb-6 flex-wrap">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target={social.label !== 'Email' ? '_blank' : undefined}
                      rel={social.label !== 'Email' ? 'noopener noreferrer' : undefined}
                      className="w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-amber-600 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
                      aria-label={social.label}
                    >
                      <social.icon className="w-4 h-4 md:w-5 md:h-5" />
                    </a>
                  ))}
                </div>
                <p className="text-gray-400 text-xs md:text-sm">
                  © 2026 SPIRITHUB ROASTERY
                </p>
              </div>
              
              {/* Newsletter - Right Side */}
              <div className="w-full">
                <h4 className="text-xs md:text-sm font-semibold text-amber-200 mb-2 uppercase tracking-wider">
                  {language === 'ar' ? 'النشرة الإخبارية' : 'Newsletter'}
                </h4>
                <p className="text-gray-300 text-[10px] md:text-xs mb-3">
                  {language === 'ar' 
                    ? 'انضم للحصول على عروض خاصة وهدايا مجانية وصفقات فريدة من نوعها.'
                    : 'SpiritHub Roastery for exclusive offers'}
                </p>
                <form onSubmit={handleNewsletterSubmit} className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-email@example.com"
                    disabled={subscribeStatus === 'loading'}
                    className="w-full bg-transparent border-b border-gray-400 text-white text-xs md:text-sm py-2 pr-8 md:pr-10 focus:outline-none focus:border-amber-200 transition-colors disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={subscribeStatus === 'loading'}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Subscribe"
                  >
                    {subscribeStatus === 'loading' ? (
                      <svg className="w-4 h-4 md:w-5 md:h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    )}
                  </button>
                </form>
                {subscribeStatus === 'success' && (
                  <p className="text-green-400 text-[10px] md:text-xs mt-2">
                    {language === 'ar' ? 'تم الاشتراك بنجاح!' : 'Successfully subscribed!'}
                  </p>
                )}
                {subscribeStatus === 'error' && errorMessage && (
                  <p className="text-red-400 text-[10px] md:text-xs mt-2">{errorMessage}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
