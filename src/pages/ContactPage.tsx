import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle, Instagram, Facebook } from 'lucide-react';

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
    
    // Simulate form submission
    setTimeout(() => {
      alert(language === 'ar' ? 'تم إرسال رسالتك بنجاح! سنرد عليك قريباً.' : 'Your message has been sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 2000);
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
      content: '+966 11 123 4567',
      subContent: language === 'ar' ? 'متاح 24/7 لخدمتك' : 'Available 24/7 for you',
    },
    {
      icon: Mail,
      title: language === 'ar' ? 'راسلنا' : 'Email Us',
      content: 'info@spirithub.cafe',
      subContent: language === 'ar' ? 'نرد خلال 24 ساعة' : 'We respond within 24 hours',
    },
    {
      icon: MapPin,
      title: language === 'ar' ? 'زورنا' : 'Visit Us',
      content: language === 'ar' ? 'شارع الأمير محمد بن عبدالعزيز' : 'Prince Mohammed bin Abdulaziz Street',
      subContent: language === 'ar' ? 'حي الملز، الرياض' : 'Al-Malaz District, Riyadh',
    },
    {
      icon: Clock,
      title: language === 'ar' ? 'ساعات العمل' : 'Working Hours',
      content: language === 'ar' ? 'السبت - الأربعاء: 6 ص - 12 م' : 'Sat - Wed: 6 AM - 12 AM',
      subContent: language === 'ar' ? 'الخميس - الجمعة: 6 ص - 1 ص' : 'Thu - Fri: 6 AM - 1 AM',
    },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Hero Section */}
      <div className="relative h-80 bg-gradient-to-r from-amber-900 to-orange-800 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative container mx-auto px-4 h-full flex items-center justify-center text-center">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold text-white mb-4">
              {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
            </h1>
            <p className="text-xl text-amber-100 leading-relaxed">
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
              {/* Map Placeholder */}
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">
                  {language === 'ar' ? 'موقعنا على الخريطة' : 'Find Us on Map'}
                </h3>
                <div className="bg-gradient-to-br from-amber-100 to-orange-200 rounded-lg h-64 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-amber-600 mx-auto mb-4" />
                    <p className="text-gray-700 font-semibold">
                      {language === 'ar' ? 'خريطة تفاعلية' : 'Interactive Map'}
                    </p>
                    <p className="text-gray-600 text-sm mt-2">
                      {language === 'ar' ? 'شارع الأمير محمد بن عبدالعزيز، الرياض' : 'Prince Mohammed bin Abdulaziz St, Riyadh'}
                    </p>
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
                    href="https://wa.me/966111234567"
                    className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl flex flex-col items-center transition-colors"
                  >
                    <MessageCircle className="w-8 h-8 mb-2" />
                    <span className="text-sm font-semibold">WhatsApp</span>
                  </a>
                  <a
                    href="https://instagram.com/spirithubcafe"
                    className="bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-xl flex flex-col items-center transition-colors"
                  >
                    <Instagram className="w-8 h-8 mb-2" />
                    <span className="text-sm font-semibold">Instagram</span>
                  </a>
                  <a
                    href="https://facebook.com/spirithubcafe"
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