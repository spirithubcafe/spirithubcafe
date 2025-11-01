import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send, Instagram, Facebook } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../hooks/useApp';
import { PageHeader } from '../components/layout/PageHeader';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
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

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  const cardHoverVariants = {
    hover: {
      y: -8,
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 10
      }
    }
  };

  const contactInfo = [
    {
      icon: Phone,
      title: language === 'ar' ? 'الهاتف' : 'Phone',
      value: '+968 9190 0005',
      value2: '+968 7272 6999',
      link: 'tel:+96891900005',
      gradient: 'from-green-400 to-green-600'
    },
    {
      icon: Mail,
      title: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
      value: 'info@spirithubcafe.com',
      link: 'mailto:info@spirithubcafe.com',
      gradient: 'from-blue-400 to-blue-600'
    },
    {
      icon: MapPin,
      title: language === 'ar' ? 'العنوان' : 'Location',
      value: language === 'ar' ? 'شارع الموج، مسقط، عمان' : 'Al Mouj St, Muscat, Oman',
      link: 'https://maps.google.com/?q=23.618926,58.256566',
      gradient: 'from-purple-400 to-purple-600'
    },
    {
      icon: Clock,
      title: language === 'ar' ? 'ساعات العمل' : 'Working Hours',
      value: language === 'ar' ? 'يومياً: 7 صباحاً - 12 منتصف الليل' : 'Daily: 7 AM - 12 AM',
      link: '#',
      gradient: 'from-stone-600 to-stone-800'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Page Header */}
      <PageHeader
        title="Contact Us"
        titleAr="تواصل معنا"
        subtitle="We're here to answer all your questions. Feel free to reach out to us through any of the following channels"
        subtitleAr="نحن هنا للإجابة على جميع استفساراتك. لا تتردد في التواصل معنا عبر أي من القنوات التالية"
      />

      {/* Contact Info Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {contactInfo.map((info, index) => {
            const IconComponent = info.icon;
            return (
              <motion.a
                key={index}
                href={info.link}
                target={info.link.startsWith('http') ? '_blank' : undefined}
                rel={info.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                variants={itemVariants}
                whileHover="hover"
                className="group block"
              >
                <motion.div
                  variants={cardHoverVariants}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden h-full"
                >
                  <div className={`bg-gradient-to-br ${info.gradient} p-6 text-white`}>
                    <motion.div 
                      className="flex items-center justify-center mb-4"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <IconComponent className="w-8 h-8" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-center mb-2">
                      {info.title}
                    </h3>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-gray-50 to-white">
                    <p className="text-center text-gray-700 font-medium break-words">
                      {info.value}
                    </p>
                    {info.value2 && (
                      <p className="text-center text-gray-700 font-medium break-words mt-1">
                        {info.value2}
                      </p>
                    )}
                  </div>
                </motion.div>
              </motion.a>
            );
          })}
        </motion.div>

        {/* Form and Additional Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: language === 'ar' ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Card className="border-0 shadow-2xl">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-3xl font-bold text-gray-900">
                  {language === 'ar' ? 'أرسل لنا رسالة' : 'Send us a Message'}
                </CardTitle>
                <CardDescription className="text-base">
                  {language === 'ar' ? 'سنرد عليك في أقرب وقت ممكن' : 'We\'ll get back to you as soon as possible'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3"
                >
                  <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-900 text-sm font-medium">
                      {language === 'ar' ? 'للرد السريع، تواصل معنا عبر واتساب!' : 'For faster response, contact us via WhatsApp!'}
                    </p>
                    <a 
                      href="https://api.whatsapp.com/send?phone=96891900005"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-semibold underline"
                    >
                      {language === 'ar' ? 'افتح واتساب' : 'Open WhatsApp'}
                    </a>
                  </div>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                      {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                    </Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="mt-2"
                      placeholder={language === 'ar' ? 'اكتب اسمك الكامل' : 'Enter your full name'}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                      {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-2"
                      placeholder={language === 'ar' ? 'example@email.com' : 'example@email.com'}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                  >
                    <Label htmlFor="subject" className="text-sm font-semibold text-gray-700">
                      {language === 'ar' ? 'موضوع الرسالة' : 'Subject'}
                    </Label>
                    <Input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="mt-2"
                      placeholder={language === 'ar' ? 'موضوع رسالتك' : 'Your message subject'}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                  >
                    <Label htmlFor="message" className="text-sm font-semibold text-gray-700">
                      {language === 'ar' ? 'الرسالة' : 'Message'}
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="mt-2 resize-none"
                      placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 }}
                  >
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-stone-700 to-stone-900 hover:from-stone-800 hover:to-stone-950 text-white font-bold py-6 text-base"
                    >
                      {isSubmitting ? (
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="rounded-full h-5 w-5 border-b-2 border-white"
                        />
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          {language === 'ar' ? 'إرسال الرسالة' : 'Send Message'}
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Map & Additional Info */}
          <motion.div 
            initial={{ opacity: 0, x: language === 'ar' ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="space-y-8"
          >
            {/* Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="border-0 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    {language === 'ar' ? 'موقعنا على الخريطة' : 'Find Us on Map'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.0 }}
                    className="rounded-lg overflow-hidden h-96 border-2 border-gray-200"
                  >
                    <iframe
                      src="https://www.openstreetmap.org/export/embed.html?bbox=58.250566,23.613926,58.262566,23.623926&layer=mapnik&marker=23.618926,58.256566"
                      width="100%"
                      height="100%"
                      className="map-iframe"
                      loading="lazy"
                      title={language === 'ar' ? 'موقع Spirit Hub Cafe' : 'Spirit Hub Cafe Location'}
                    ></iframe>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="mt-4"
                  >
                    <a
                      href="https://www.openstreetmap.org/?mlat=23.618926&mlon=58.256566&zoom=16#map=16/23.61893/58.25657"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-stone-700 hover:text-stone-900 font-semibold transition-colors"
                    >
                      <MapPin className="w-5 h-5" />
                      {language === 'ar' ? 'عرض خريطة أكبر' : 'View Larger Map'}
                    </a>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Social Media */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <Card className="border-0 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    {language === 'ar' ? 'تابعنا على' : 'Follow Us'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <motion.a
                      href="https://api.whatsapp.com/send?phone=96891900005"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-xl flex flex-col items-center transition-colors shadow-lg"
                    >
                      <MessageCircle className="w-8 h-8 mb-2" />
                      <span className="text-sm font-semibold">WhatsApp</span>
                    </motion.a>
                    <motion.a
                      href="https://instagram.com/spirithubcafe"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-xl flex flex-col items-center transition-colors shadow-lg"
                    >
                      <Instagram className="w-8 h-8 mb-2" />
                      <span className="text-sm font-semibold text-center">@spirithubcafe</span>
                    </motion.a>
                    <motion.a
                      href="https://facebook.com/spirithubcafe"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl flex flex-col items-center transition-colors shadow-lg"
                    >
                      <Facebook className="w-8 h-8 mb-2" />
                      <span className="text-sm font-semibold">Facebook</span>
                    </motion.a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
