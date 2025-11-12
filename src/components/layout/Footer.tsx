import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, MessageCircle } from 'lucide-react';
import { useApp } from '../../hooks/useApp';

export const Footer: React.FC = () => {
  const { language } = useApp();

  const quickLinks = [
    { label: language === 'ar' ? 'الرئيسية' : 'Home', href: '/' },
    { label: language === 'ar' ? 'المتجر' : 'Shop', href: '/products' },
    { label: language === 'ar' ? 'من نحن' : 'About', href: '/about' },
    { label: language === 'ar' ? 'اتصل بنا' : 'Contact Us', href: '/contact' }
  ];

  const legalLinks = [
    { label: language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy', href: '/privacy' },
    { label: language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions', href: '/terms' },
    { label: language === 'ar' ? 'سياسة التوصيل' : 'Delivery Policy', href: '/delivery' },
    { label: language === 'ar' ? 'سياسة الاستبدال' : 'Refund Policy', href: '/refund' },
    { label: language === 'ar' ? 'الأسئلة الشائعة' : 'FAQ', href: '/faq' }
  ];

  const socialLinks = [
    { icon: Facebook, href: 'https://www.facebook.com/spirithubcafe', label: 'Facebook' },
    { icon: Instagram, href: 'https://www.instagram.com/spirithubcafe/', label: 'Instagram' },
    { icon: MessageCircle, href: 'https://wa.me/96891900005', label: 'WhatsApp' },
    { icon: Mail, href: 'mailto:info@spirithubcafe.com', label: 'Email' }
  ];

  return (
    <footer className="relative text-white overflow-hidden mt-16 md:mt-0">
      {/* Video Background */}
      <div className="absolute inset-0 w-full h-full">
        <video
          className="w-full h-full object-cover"
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
                  {language === 'ar' ? 'من عُمان إلى كوبك قهوة مختصة معاد تعريفها' : 'From Oman to Your Cup Specialty Coffee Redefined'}
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {language === 'ar' 
                    ? 'تأسست في عُمان، سبيرت هب روستري وقهوة متخصصة مكرسة لتقديم تجربة قهوة استثنائية. من خلال التركيز حصريًا على القهوة المختصة، يسلط فريقنا الضوء على النكهات والعطور الفريدة لكل دفعة محمصة بعناية، احتفالاً بالحرفة والأصل والشخصية وراء كل حبة.'
                    : 'Established in Oman, SpiritHub Roastery & Specialty Coffee is dedicated to delivering an exceptional coffee experience. By focusing exclusively on specialty coffee, our team highlights the unique flavors and aromas of each carefully roasted batch, celebrating the craft, origin, and character behind every bean.'
                  }
                </p>
              </div>
            </div>

            {/* Other sections in smaller columns */}
            <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
              {/* Quick Links */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-amber-200">
                  {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
                </h3>
                <ul className="space-y-3">
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
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-amber-200">
                  {language === 'ar' ? 'الصفحات القانونية' : 'Legal Pages'}
                </h3>
                <ul className="space-y-3">
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
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-amber-200">
                  {language === 'ar' ? 'اتصل بنا' : 'Contact Us'}
                </h3>
                <div className="space-y-3 text-sm">
                  <p className="text-gray-300">
                    {language === 'ar' ? 'شارع الموج، مسقط، عُمان' : 'Al Mouj St, Muscat, Oman'}
                  </p>
                  <div
                    className={`space-y-1 ${
                      language === 'ar' ? 'text-right' : 'text-left'
                    }`}
                    dir="ltr"
                  >
                    <p className="text-gray-300">+968 9190 0005</p>
                    <p className="text-gray-300">+968 7272 6999</p>
                  </div>
                  <p className="text-gray-300">info@spirithubcafe.com</p>
                  <p className="text-gray-300 font-medium">
                    {language === 'ar' ? 'يومياً: 7 صباحاً - 12 منتصف الليل' : 'Daily: 7 AM - 12 AM'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="border-t border-gray-600/50 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-start">
                <h4 className="text-lg font-semibold text-amber-200 mb-4">
                  {language === 'ar' ? 'تابعنا' : 'Follow Us'}
                </h4>
                <div className="flex gap-4 justify-center md:justify-start">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target={social.label !== 'Email' ? '_blank' : undefined}
                      rel={social.label !== 'Email' ? 'noopener noreferrer' : undefined}
                      className="w-12 h-12 bg-white/10 hover:bg-amber-600 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
                      aria-label={social.label}
                    >
                      <social.icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>
              
              <div className="text-center md:text-end">
                <p className="text-gray-400 text-sm">
                  © 2025 SPIRITHUB ROASTERY. {language === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
