import React, { useMemo, useState } from 'react';
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
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';

export const ContactPage: React.FC = () => {
  const { language } = useApp();
  const seoCopy = useMemo(
    () =>
      language === 'ar'
        ? {
            title: 'تواصل معنا',
            description:
              'اتصل بسبيريت هب كافيه في مسقط عبر الهاتف أو البريد أو واتساب لتنسيق الطلبات، الحجز، والاستفسارات حول القهوة المختصة.',
          }
        : {
            title: 'Contact Spirit Hub Cafe',
            description:
              'Reach Spirit Hub Cafe in Muscat via phone, email, or WhatsApp to plan private tastings, wholesale partnerships, or coffee support.',
          },
    [language]
  );

  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      url: `${siteMetadata.baseUrl}/contact`,
      name: seoCopy.title,
      description: seoCopy.description,
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+96891900005',
          contactType: 'customer service',
          areaServed: 'OM',
          availableLanguage: ['en', 'ar'],
        },
      ],
    }),
    [seoCopy.description, seoCopy.title]
  );
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
      y: -4,
      transition: {
        type: "spring" as const,
        stiffness: 320,
        damping: 18
      }
    }
  };

  type ContactInfoItem = {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string;
    value2?: string;
    link: string;
    forceLtr?: boolean;
  };

  const contactInfo: ContactInfoItem[] = [
    {
      icon: Phone,
      title: language === 'ar' ? 'الهاتف' : 'Phone',
      value: '+968 9190 0005',
      value2: '+968 7272 6999',
      link: 'tel:+96891900005',
      forceLtr: true
    },
    {
      icon: Mail,
      title: language === 'ar' ? 'البريد الإلكتروني' : 'Email',
      value: 'info@spirithubcafe.com',
      link: 'mailto:info@spirithubcafe.com'
    },
    {
      icon: MapPin,
      title: language === 'ar' ? 'العنوان' : 'Location',
      value: language === 'ar' ? 'شارع الموج، مسقط، عمان' : 'Al Mouj St, Muscat, Oman',
      link: 'https://maps.google.com/?q=23.618926,58.256566'
    },
    {
      icon: Clock,
      title: language === 'ar' ? 'ساعات العمل' : 'Working Hours',
      value: language === 'ar' ? 'يومياً: 7 صباحاً - 12 منتصف الليل' : 'Daily: 7 AM - 12 AM',
      link: '#'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Seo
        title={seoCopy.title}
        description={seoCopy.description}
        keywords={['contact Spirit Hub Cafe', 'coffee support Oman', 'سبيريت هب تواصل']}
        structuredData={structuredData}
        canonical={`${siteMetadata.baseUrl}/contact`}
      />
      {/* Page Header */}
      <PageHeader
        title="Contact Us"
        titleAr="تواصل معنا"
        subtitle="We're here to answer all your questions. Feel free to reach out to us through any of the following channels"
        subtitleAr="نحن هنا للإجابة على جميع استفساراتك. لا تتردد في التواصل معنا عبر أي من القنوات التالية"
      />

      {/* Contact Info Cards */}
      <div className="container mx-auto py-12">
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
                  className="rounded-2xl border bg-card text-card-foreground shadow-sm h-full p-6 flex flex-col gap-6 transition-colors group-hover:border-primary/40"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-primary shadow-sm">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{info.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'تفاصيل التواصل' : 'Get in touch'}
                      </p>
                    </div>
                  </div>
                  <div className="text-base font-medium text-foreground space-y-1">
                    <p
                      className="break-words font-medium tracking-wide"
                      dir={info.forceLtr ? 'ltr' : undefined}
                    >
                      {info.value}
                    </p>
                    {info.value2 && (
                      <p
                        className="break-words font-medium tracking-wide"
                        dir={info.forceLtr ? 'ltr' : undefined}
                      >
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
            <Card className="shadow-sm">
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
                  className="rounded-lg border bg-muted/40 p-4 mb-6 flex items-start gap-3 text-sm text-muted-foreground"
                >
                  <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-foreground">
                      {language === 'ar' ? 'للرد السريع، تواصل معنا عبر واتساب!' : 'For faster response, contact us via WhatsApp!'}
                    </p>
                    <a 
                      href="https://api.whatsapp.com/send?phone=96891900005"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 font-semibold underline"
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
              <Card className="shadow-sm">
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
              <Card className="shadow-sm">
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
                      className="border rounded-xl bg-card text-card-foreground p-4 flex flex-col items-center transition-colors shadow-sm hover:border-primary/60 hover:text-primary"
                    >
                      <MessageCircle className="w-8 h-8 mb-2 text-primary" />
                      <span className="text-sm font-semibold text-center">WhatsApp</span>
                    </motion.a>
                    <motion.a
                      href="https://instagram.com/spirithubcafe"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="border rounded-xl bg-card text-card-foreground p-4 flex flex-col items-center transition-colors shadow-sm hover:border-primary/60 hover:text-primary"
                    >
                      <Instagram className="w-8 h-8 mb-2 text-primary" />
                      <span className="text-sm font-semibold text-center">@spirithubcafe</span>
                    </motion.a>
                    <motion.a
                      href="https://facebook.com/spirithubcafe"
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      className="border rounded-xl bg-card text-card-foreground p-4 flex flex-col items-center transition-colors shadow-sm hover:border-primary/60 hover:text-primary"
                    >
                      <Facebook className="w-8 h-8 mb-2 text-primary" />
                      <span className="text-sm font-semibold text-center">Facebook</span>
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
