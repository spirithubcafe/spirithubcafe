import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../hooks/useApp';
import { Button } from '../ui/button';
import { Home, Coffee, ArrowLeft, ArrowRight } from 'lucide-react';

export const NotFound: React.FC = () => {
  const { language } = useApp();
  const isRTL = language === 'ar';

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl md:text-[12rem] font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent leading-none">
            404
          </h1>
        </div>

        {/* Coffee Icon Animation */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <Coffee className="w-24 h-24 text-amber-600 animate-bounce" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-200 rounded-full animate-pulse opacity-75"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-orange-300 rounded-full animate-pulse opacity-50 delay-300"></div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8 space-y-4">
          <h2 className={`text-3xl md:text-4xl font-bold text-gray-800 ${isRTL ? 'font-cairo' : ''}`}>
            {language === 'ar' 
              ? 'عذراً، لم نجد هذه الصفحة!'
              : 'Oops! Page Not Found!'
            }
          </h2>
          
          <p className={`text-lg text-gray-600 leading-relaxed max-w-lg mx-auto ${isRTL ? 'font-cairo text-right' : 'text-left'}`}>
            {language === 'ar'
              ? 'يبدو أن الصفحة التي تبحث عنها غير موجودة أو تم نقلها. دعنا نساعدك في العثور على ما تحتاجه!'
              : 'The page you\'re looking for seems to have wandered off like the perfect coffee bean. Let us help you find your way back!'
            }
          </p>
        </div>

        {/* Action Buttons */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          <Link to="/">
            <Button 
              size="lg" 
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-full shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <Home className="w-5 h-5 mr-2" />
              {language === 'ar' ? 'العودة للرئيسية' : 'Go Home'}
            </Button>
          </Link>
          
          <Link to="/#products">
            <Button 
              variant="outline" 
              size="lg"
              className="border-2 border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white px-8 py-3 rounded-full transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              <Coffee className="w-5 h-5 mr-2" />
              {language === 'ar' ? 'تصفح المنتجات' : 'Browse Products'}
            </Button>
          </Link>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className={`text-gray-600 hover:text-amber-600 transition-colors duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {isRTL ? (
              <ArrowRight className="w-4 h-4 ml-2" />
            ) : (
              <ArrowLeft className="w-4 h-4 mr-2" />
            )}
            {language === 'ar' ? 'العودة للصفحة السابقة' : 'Go Back'}
          </Button>
        </div>

        {/* Decorative Elements */}
        <div className="mt-16 grid grid-cols-3 gap-8 opacity-30">
          <div className="text-center">
            <Coffee className="w-12 h-12 mx-auto text-amber-400 mb-2" />
            <p className={`text-sm text-gray-500 ${isRTL ? 'font-cairo' : ''}`}>
              {language === 'ar' ? 'قهوة طازجة' : 'Fresh Coffee'}
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-amber-400 rounded-full mb-2 flex items-center justify-center">
              <span className="text-white font-bold">SH</span>
            </div>
            <p className={`text-sm text-gray-500 ${isRTL ? 'font-cairo' : ''}`}>
              {language === 'ar' ? 'سبيريت هب' : 'Spirit Hub'}
            </p>
          </div>
          <div className="text-center">
            <Home className="w-12 h-12 mx-auto text-amber-400 mb-2" />
            <p className={`text-sm text-gray-500 ${isRTL ? 'font-cairo' : ''}`}>
              {language === 'ar' ? 'أجواء دافئة' : 'Cozy Atmosphere'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};