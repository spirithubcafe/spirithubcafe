import React from 'react';
import { useApp } from '../hooks/useApp';
import { Coffee, Users, Award, Heart, Clock, MapPin } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import './AboutPage.css';

export const AboutPage: React.FC = () => {
  const { language } = useApp();

  const stats = [
    {
      icon: Coffee,
      number: '10,000+',
      label: language === 'ar' ? 'كوب قهوة يومياً' : 'Cups served daily',
    },
    {
      icon: Users,
      number: '5,000+',
      label: language === 'ar' ? 'عميل سعيد' : 'Happy customers',
    },
    {
      icon: Award,
      number: '15',
      label: language === 'ar' ? 'جائزة دولية' : 'International awards',
    },
    {
      icon: Heart,
      number: '99%',
      label: language === 'ar' ? 'رضا العملاء' : 'Customer satisfaction',
    },
  ];

  const team = [
    {
      name: language === 'ar' ? 'أحمد محمد' : 'Ahmad Mohammed',
      role: language === 'ar' ? 'مؤسس ورئيس الطهاة' : 'Founder & Head Barista',
      image: '/images/team/chef1.jpg',
      description: language === 'ar' 
        ? 'خبير في تحضير القهوة مع أكثر من 15 عاماً من الخبرة'
        : 'Coffee expert with over 15 years of experience',
    },
    {
      name: language === 'ar' ? 'سارة أحمد' : 'Sarah Ahmed',
      role: language === 'ar' ? 'مديرة العمليات' : 'Operations Manager',
      image: '/images/team/manager1.jpg',
      description: language === 'ar' 
        ? 'متخصصة في إدارة المقاهي وتطوير الأعمال'
        : 'Specialist in café management and business development',
    },
    {
      name: language === 'ar' ? 'محمد علي' : 'Mohammed Ali',
      role: language === 'ar' ? 'كبير الباريستا' : 'Senior Barista',
      image: '/images/team/barista1.jpg',
      description: language === 'ar' 
        ? 'فنان في تحضير القهوة المختصة والمشروبات الإبداعية'
        : 'Artist in specialty coffee and creative beverages',
    },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      {/* Page Header */}
      <PageHeader
        title="About Us"
        titleAr="من نحن"
        subtitle="We are Spirit Hub Café - a place that combines the authenticity of Arabic coffee with modern global presentation"
        subtitleAr="نحن مقهى سبيريت هب - مكان يجمع بين أصالة القهوة العربية وحداثة التقديم العالمي"
      />

      {/* Story Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">
                  {language === 'ar' ? 'قصتنا' : 'Our Story'}
                </h2>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>
                    {language === 'ar' 
                      ? 'بدأت رحلتنا في عام 2020 بحلم بسيط: إنشاء مكان يجمع الناس حول حب القهوة الأصيلة. كنا نريد مقهى لا يقدم القهوة فحسب، بل يقدم تجربة ثقافية واجتماعية متكاملة.'
                      : 'Our journey began in 2020 with a simple dream: to create a place that brings people together around the love of authentic coffee. We wanted a café that doesn\'t just serve coffee, but provides a complete cultural and social experience.'
                    }
                  </p>
                  <p>
                    {language === 'ar' 
                      ? 'اليوم، أصبح سبيريت هب وجهة مفضلة لعشاق القهوة، حيث نقدم أجود أنواع القهوة المحمصة طازجة، مع احترام التقاليد العريقة ولمسة من الإبداع المعاصر.'
                      : 'Today, Spirit Hub has become a favorite destination for coffee lovers, where we serve the finest freshly roasted coffee, respecting ancient traditions with a touch of contemporary creativity.'
                    }
                  </p>
                  <p>
                    {language === 'ar' 
                      ? 'نحن نؤمن أن كل كوب قهوة يحكي قصة، ونسعى لجعل كل زيارة لمقهانا ذكرى جميلة تستحق التكرار.'
                      : 'We believe that every cup of coffee tells a story, and we strive to make every visit to our café a beautiful memory worth repeating.'
                    }
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-amber-200 to-orange-300 rounded-2xl p-8 shadow-2xl">
                  <Coffee className="w-24 h-24 text-amber-800 mx-auto mb-4" />
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-amber-900 mb-2">
                      {language === 'ar' ? 'رؤيتنا' : 'Our Vision'}
                    </h3>
                    <p className="text-amber-800">
                      {language === 'ar' 
                        ? 'أن نكون المقهى الرائد في تقديم تجربة قهوة استثنائية تجمع بين الأصالة والحداثة'
                        : 'To be the leading café in providing an exceptional coffee experience that combines authenticity and modernity'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gradient-to-r from-amber-900 to-orange-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            {language === 'ar' ? 'إنجازاتنا بالأرقام' : 'Our Achievements in Numbers'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-white bg-opacity-20 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <stat.icon className="w-8 h-8 text-amber-200" />
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-amber-200">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            {language === 'ar' ? 'فريقنا المبدع' : 'Our Creative Team'}
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {team.map((member, index) => (
              <div key={index} className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-16 h-16 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{member.name}</h3>
                <p className="text-amber-700 font-semibold mb-3">{member.role}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-16 bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            {language === 'ar' ? 'قيمنا ومبادئنا' : 'Our Values & Principles'}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <Award className="w-12 h-12 text-amber-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {language === 'ar' ? 'الجودة' : 'Quality'}
              </h3>
              <p className="text-gray-600">
                {language === 'ar' 
                  ? 'نلتزم بأعلى معايير الجودة في اختيار حبوب القهوة وطرق التحضير'
                  : 'We commit to the highest quality standards in selecting coffee beans and preparation methods'
                }
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <Heart className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {language === 'ar' ? 'الشغف' : 'Passion'}
              </h3>
              <p className="text-gray-600">
                {language === 'ar' 
                  ? 'الشغف هو ما يدفعنا لتقديم أفضل ما لدينا في كل كوب قهوة'
                  : 'Passion is what drives us to give our best in every cup of coffee'
                }
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <Users className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {language === 'ar' ? 'المجتمع' : 'Community'}
              </h3>
              <p className="text-gray-600">
                {language === 'ar' 
                  ? 'نسعى لبناء مجتمع من محبي القهوة والثقافة العربية الأصيلة'
                  : 'We strive to build a community of coffee and authentic Arabic culture lovers'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Location & Hours */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <MapPin className="w-6 h-6 text-amber-600 mr-3" />
                {language === 'ar' ? 'موقعنا' : 'Our Location'}
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>{language === 'ar' ? 'شارع الأمير محمد بن عبدالعزيز' : 'Prince Mohammed bin Abdulaziz Street'}</p>
                <p>{language === 'ar' ? 'حي الملز، الرياض 12345' : 'Al-Malaz District, Riyadh 12345'}</p>
                <p>{language === 'ar' ? 'المملكة العربية السعودية' : 'Kingdom of Saudi Arabia'}</p>
                <p className="font-semibold">+966 11 123 4567</p>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Clock className="w-6 h-6 text-amber-600 mr-3" />
                {language === 'ar' ? 'ساعات العمل' : 'Opening Hours'}
              </h2>
              <div className="space-y-3 text-gray-600">
                <div className="flex justify-between">
                  <span>{language === 'ar' ? 'السبت - الأربعاء' : 'Saturday - Wednesday'}</span>
                  <span>{language === 'ar' ? '6:00 ص - 12:00 م' : '6:00 AM - 12:00 AM'}</span>
                </div>
                <div className="flex justify-between">
                  <span>{language === 'ar' ? 'الخميس - الجمعة' : 'Thursday - Friday'}</span>
                  <span>{language === 'ar' ? '6:00 ص - 1:00 ص' : '6:00 AM - 1:00 AM'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};