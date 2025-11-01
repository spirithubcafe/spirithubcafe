import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, Instagram, Facebook } from 'lucide-react';
import './ContactPage.css';

export const ContactPage: React.FC = () => {
  const { language } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Format message for WhatsApp
    const messageParts = language === 'ar' 
      ? [
          '*رسالة جديدة من موقع Spirit Hub Cafe*',
          '',
          `*الاسم:* ${formData.name}`,
          `*البريد الإلكتروني:* ${formData.email}`,
          `*الموضوع:* ${formData.subject}`,
          '',
          '*الرسالة:*',
          formData.message
        ]
      : [
          '*New Message from Spirit Hub Cafe*',
          '',
          `*Name:* ${formData.name}`,
          `*Email:* ${formData.email}`,
          `*Subject:* ${formData.subject}`,
          '',
          '*Message:*',
          formData.message
        ];
    
    const whatsappMessage = encodeURIComponent(messageParts.join('\n'));
    
    // WhatsApp phone number
    const whatsappNumber = '96891900005';
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${whatsappMessage}`;
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
    
    // Reset form and show success message
    setTimeout(() => {
      alert(language === 'ar' ? 'سيتم توجيهك إلى WhatsApp لإرسال رسالتك' : 'You will be redirected to WhatsApp to send your message');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: language === 'ar' ? 'اتصل بنا' : 'Call Us',
      content: '+968 9190 0005',
      subContent: '+968 7272 6999',
    },
    {
      icon: Mail,
      title: language === 'ar' ? 'راسلنا' : 'Email Us',
      content: 'info@spirithubcafe.com',
      subContent: language === 'ar' ? 'نرد خلال 24 ساعة' : 'We respond within 24 hours',
    },
    {
      icon: MapPin,
      title: language === 'ar' ? 'زورنا' : 'Visit Us',
      content: language === 'ar' ? 'شارع الموج، مسقط - عمان' : 'Al Mouj St, Muscat - Oman',
      subContent: language === 'ar' ? 'موقع مميز وسهل الوصول' : 'Prime location, easy access',
    },
    {
      icon: Clock,
      title: language === 'ar' ? 'ساعات العمل' : 'Working Hours',
      content: language === 'ar' ? 'يومياً: 7 ص - 12 م' : 'Daily: 7:00 AM - 12:00 AM',
      subContent: language === 'ar' ? 'مفتوح جميع أيام الأسبوع' : 'Open 7 days a week',
    },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Hero Section */}
      <div className="relative h-64 overflow-hidden">
        <div className="absolute inset-0 hero-background"></div>
        <div className="absolute inset-0 glass-overlay"></div>
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold text-white mb-3">
              {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
            </h1>
            <p className="text-lg text-amber-100 leading-relaxed">
              {language === 'ar' 
                ? 'نحن هنا للإجابة على استفساراتك وتلقي اقتراحاتك'
                : 'We are here to answer your questions and receive your suggestions'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Contact Info Cards */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {contactInfo.map((info, index) => (
              <div key={index} className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300 hover:scale-105 transform transition-transform">
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <info.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{info.title}</h3>
                <p className="text-amber-700 font-semibold mb-1">{info.content}</p>
                <p className="text-gray-600 text-sm">{info.subContent}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form & Map Section */}
      <div className="py-16 bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                {language === 'ar' ? 'أرسل لنا رسالة' : 'Send Us a Message'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                    placeholder={language === 'ar' ? 'اكتب اسمك الكامل' : 'Enter your full name'}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                    placeholder={language === 'ar' ? 'example@email.com' : 'example@email.com'}
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    {language === 'ar' ? 'موضوع الرسالة' : 'Subject'}
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                    placeholder={language === 'ar' ? 'موضوع رسالتك' : 'Your message subject'}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    {language === 'ar' ? 'الرسالة' : 'Message'}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors resize-none"
                    placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold py-4 px-6 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {isSubmitting 
                    ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...')
                    : (language === 'ar' ? 'إرسال الرسالة' : 'Send Message')
                  }
                </button>
              </form>
            </div>

            {/* Map & Additional Info */}
            <div className="space-y-8">
              {/* Map */}
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  {language === 'ar' ? 'موقعنا على الخريطة' : 'Find Us on Map'}
                </h3>
                <div className="rounded-lg overflow-hidden h-96 border-2 border-gray-200">
                  <iframe
                    src="https://www.openstreetmap.org/export/embed.html?bbox=58.250566,23.613926,58.262566,23.623926&layer=mapnik&marker=23.618926,58.256566"
                    width="100%"
                    height="100%"
                    className="map-iframe"
                    loading="lazy"
                    title={language === 'ar' ? 'موقع Spirit Hub Cafe' : 'Spirit Hub Cafe Location'}
                  ></iframe>
                  <div className="mt-4">
                    <a
                      href="https://www.openstreetmap.org/?mlat=23.618926&mlon=58.256566&zoom=16#map=16/23.61893/58.25657"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold"
                    >
                      <MapPin className="w-5 h-5" />
                      {language === 'ar' ? 'عرض خريطة أكبر' : 'View Larger Map'}
                    </a>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  {language === 'ar' ? 'تابعنا على' : 'Follow Us'}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <a
                    href="https://api.whatsapp.com/send?phone=96891900005"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl flex flex-col items-center transition-colors"
                  >
                    <MessageCircle className="w-8 h-8 mb-2" />
                    <span className="text-sm font-semibold">WhatsApp</span>
                  </a>
                  <a
                    href="https://instagram.com/spirithubcafe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-xl flex flex-col items-center transition-colors"
                  >
                    <Instagram className="w-8 h-8 mb-2" />
                    <span className="text-sm font-semibold">@spirithubcafe</span>
                  </a>
                  <a
                    href="https://facebook.com/spirithubcafe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl flex flex-col items-center transition-colors"
                  >
                    <Facebook className="w-8 h-8 mb-2" />
                    <span className="text-sm font-semibold">Facebook</span>
                  </a>
                </div>
              </div>

              {/* FAQ Quick Links */}
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  {language === 'ar' ? 'أسئلة شائعة' : 'Quick FAQ'}
                </h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-amber-500 pl-4">
                    <h4 className="font-semibold text-gray-800">
                      {language === 'ar' ? 'هل تقدمون خدمة التوصيل؟' : 'Do you offer delivery?'}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {language === 'ar' ? 'نعم، نقدم خدمة التوصيل داخل الرياض خلال 30 دقيقة' : 'Yes, we offer delivery within Riyadh in 30 minutes'}
                    </p>
                  </div>
                  <div className="border-l-4 border-amber-500 pl-4">
                    <h4 className="font-semibold text-gray-800">
                      {language === 'ar' ? 'هل لديكم خيارات نباتية؟' : 'Do you have vegan options?'}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {language === 'ar' ? 'نعم، لدينا مجموعة متنوعة من المشروبات والحلويات النباتية' : 'Yes, we have a variety of vegan drinks and desserts'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};