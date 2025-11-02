import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
import { useApp } from '../hooks/useApp';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible';
import { 
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  MapPin,
  ChevronDown,
  Send,
  ArrowLeft,
  Search,
  BookOpen,
  Headphones,
  Shield,
  Coffee
} from 'lucide-react';
import { motion } from 'framer-motion';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'orders' | 'products' | 'account' | 'shipping';
}

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
}

export const HelpPage: React.FC = () => {
  // const { isAuthenticated } = useAuth();
  const { t } = useApp();
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load FAQs from API
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setIsLoading(true);
        // TODO: Replace with actual API call
        // const response = await helpService.getFaqs();
        // setFaqs(response.data);
        
        // For now, set empty data
        setFaqs([]);
        setFilteredFaqs([]);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        setFaqs([]);
        setFilteredFaqs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  // Filter FAQs based on search and category
  useEffect(() => {
    let filtered = faqs;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(faq => faq.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFaqs(filtered);
  }, [faqs, searchTerm, selectedCategory]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      // TODO: Replace with actual API call
      // await helpService.submitContactForm(contactForm);
      
      // Reset form
      setContactForm({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: 'general'
      });
      
      console.log('Contact form submitted successfully');
    } catch (error) {
      console.error('Error submitting contact form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { value: 'all', label: t('help.allCategories'), icon: BookOpen },
    { value: 'general', label: t('help.general'), icon: HelpCircle },
    { value: 'orders', label: t('help.orders'), icon: Coffee },
    { value: 'products', label: t('help.products'), icon: Coffee },
    { value: 'account', label: t('help.account'), icon: Shield },
    { value: 'shipping', label: t('help.shipping'), icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <HelpCircle className="h-8 w-8 text-stone-700" />
            <h1 className="text-3xl font-bold text-gray-900">
              {t('help.title')}
            </h1>
          </div>
          <p className="text-gray-600">
            {t('help.description')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - FAQs */}
          <div className="lg:col-span-2">
            {/* Search and Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder={t('help.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {categories.map(category => {
                        const Icon = category.icon;
                        return (
                          <Button
                            key={category.value}
                            variant={selectedCategory === category.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedCategory(category.value)}
                            className="flex items-center gap-2"
                          >
                            <Icon className="h-4 w-4" />
                            {category.label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* FAQs List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {t('help.frequentlyAsked')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="animate-pulse p-4 border rounded-lg">
                          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                        </div>
                      ))}
                    </div>
                  ) : filteredFaqs.length === 0 ? (
                    <div className="text-center py-12">
                      <HelpCircle className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        {searchTerm || selectedCategory !== 'all' 
                          ? t('help.noResultsFound')
                          : t('help.noFaqs')
                        }
                      </h3>
                      <p className="text-gray-500">
                        {searchTerm || selectedCategory !== 'all'
                          ? t('help.tryDifferentSearch')
                          : t('help.noFaqsDescription')
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredFaqs.map((faq) => (
                        <Collapsible
                          key={faq.id}
                          open={openFaq === faq.id}
                          onOpenChange={(open) => setOpenFaq(open ? faq.id : null)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-between p-4 h-auto text-left"
                            >
                              <span className="font-medium">{faq.question}</span>
                              <ChevronDown className={`h-4 w-4 transition-transform ${
                                openFaq === faq.id ? 'rotate-180' : ''
                              }`} />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="px-4 pb-4">
                            <div className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                              {faq.answer}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Contact & Support */}
          <div className="space-y-6">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Headphones className="h-5 w-5" />
                    {t('help.contactSupport')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Phone className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{t('help.phone')}</p>
                      <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{t('help.email')}</p>
                      <p className="text-sm text-gray-500">support@spirithub.com</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">{t('help.hours')}</p>
                      <p className="text-sm text-gray-500">{t('help.hoursDetail')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <MessageCircle className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium">{t('help.liveChat')}</p>
                      <p className="text-sm text-gray-500">{t('help.liveChatDesc')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    {t('help.sendMessage')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">{t('help.name')}</Label>
                      <Input
                        id="name"
                        value={contactForm.name}
                        onChange={(e) => setContactForm(prev => ({
                          ...prev,
                          name: e.target.value
                        }))}
                        placeholder={t('help.namePlaceholder')}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">{t('help.email')}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({
                          ...prev,
                          email: e.target.value
                        }))}
                        placeholder={t('help.emailPlaceholder')}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="subject">{t('help.subject')}</Label>
                      <Input
                        id="subject"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm(prev => ({
                          ...prev,
                          subject: e.target.value
                        }))}
                        placeholder={t('help.subjectPlaceholder')}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">{t('help.message')}</Label>
                      <Textarea
                        id="message"
                        value={contactForm.message}
                        onChange={(e) => setContactForm(prev => ({
                          ...prev,
                          message: e.target.value
                        }))}
                        placeholder={t('help.messagePlaceholder')}
                        rows={4}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {t('help.sendMessage')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};