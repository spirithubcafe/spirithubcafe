import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Coffee,
  Trophy,
  Flame,
  Zap,
  Calendar,
  Award,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { coffeePassportService, type CoffeePassportProfile } from '../../services/coffeePassportService';

interface CoffeePassportSectionProps {
  isArabic: boolean;
}

// Mock data for development - remove when backend API is ready
const getMockCoffeePassportProfile = (): CoffeePassportProfile => ({
  customerId: 1,
  countriesExplored: 4,
  countriesList: ['Ethiopia', 'Colombia', 'Kenya', 'Vietnam'],
  countriesFlags: {
    'Ethiopia': '🇪🇹',
    'Colombia': '🇨🇴',
    'Kenya': '🇰🇪',
    'Vietnam': '🇻🇳',
  },
  coffeesTried: 12,
  processesExplored: ['Washed', 'Natural', 'Honey'],
  achievements: [
    {
      id: 'first_coffee',
      titleEn: 'First Coffee',
      titleAr: 'أول قهوة',
      descriptionEn: 'Purchased your first coffee',
      descriptionAr: 'شراء قهوتك الأولى',
      icon: '☕',
      unlockedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'explorer',
      titleEn: 'Explorer',
      titleAr: 'المستكشف',
      descriptionEn: 'Explored coffees from 4 countries',
      descriptionAr: 'استكشف قهوة من 4 دول',
      icon: '🌍',
      unlockedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  latestDiscovery: {
    productId: 42,
    nameEn: 'Ethiopian Yirgacheffe',
    nameAr: 'إثيوبي يرجاتشيفي',
    originEn: 'Ethiopia',
    originAr: 'إثيوبيا',
    originFlag: '🇪🇹',
    tasteNotesEn: ['Fruity', 'Floral', 'Strawberry'],
    tasteNotesAr: ['فاكهي', 'زهري', 'فراولة'],
    processEn: 'Washed',
    processAr: 'مغسول',
    discoveredDate: new Date().toISOString(),
  },
  tastingNotes: ['Fruity', 'Floral', 'Chocolate', 'Nutty'],
  productsTried: 12,
  journeyTimeline: [
    {
      id: 'evt_001',
      eventType: 'discovery',
      titleEn: 'Discovered Ethiopian Yirgacheffe',
      titleAr: 'اكتشاف إثيوبي يرجاتشيفي',
      descriptionEn: 'Added to your Coffee Passport',
      descriptionAr: 'تم إضافته إلى جواز القهوة',
      date: new Date().toISOString(),
      icon: '🔍',
    },
  ],
  joinDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  totalPoints: 1250,
  nextMilestone: {
    titleEn: 'Explore 5 Countries',
    titleAr: 'استكشف 5 دول',
    progress: 4,
    target: 5,
  },
});

export const CoffeePassportSection: React.FC<CoffeePassportSectionProps> = ({
  isArabic,
}) => {
  const [profile, setProfile] = useState<CoffeePassportProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const data = await coffeePassportService.getProfile();
        if (data) {
          // Ensure all required properties exist with defaults
          const normalizedData: CoffeePassportProfile = {
            customerId: data.customerId ?? 0,
            countriesExplored: data.countriesExplored ?? 0,
            countriesList: data.countriesList ?? [],
            countriesFlags: data.countriesFlags ?? {},
            coffeesTried: data.coffeesTried ?? 0,
            processesExplored: data.processesExplored ?? [],
            achievements: data.achievements ?? [],
            latestDiscovery: data.latestDiscovery || undefined,
            tastingNotes: data.tastingNotes ?? [],
            productsTried: data.productsTried ?? 0,
            journeyTimeline: data.journeyTimeline ?? [],
            joinDate: data.joinDate ?? new Date().toISOString(),
            totalPoints: data.totalPoints ?? 0,
            nextMilestone: data.nextMilestone || undefined,
          };
          setProfile(normalizedData);
        } else {
          // Use mock data as fallback (remove when backend is ready)
          console.warn('Coffee Passport API not available, using mock data');
          setProfile(getMockCoffeePassportProfile());
        }
      } catch (err) {
        console.error('Error loading Coffee Passport:', err);
        // Use mock data as fallback (remove when backend is ready)
        console.warn('Using mock Coffee Passport data for development');
        setProfile(getMockCoffeePassportProfile());
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {isArabic ? 'لا توجد بيانات' : 'No data available'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Stats */}
      <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-4" variants={itemVariants}>
        {/* Countries Explored */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <Globe className="w-8 h-8 text-blue-500" />
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {profile.countriesExplored}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isArabic ? 'الدول المكتشفة' : 'Countries Explored'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Coffees Tried */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <Coffee className="w-8 h-8 text-amber-600" />
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {profile.coffeesTried}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isArabic ? 'أنواع القهوة' : 'Coffees Tried'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {profile.achievements.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isArabic ? 'الإنجازات' : 'Achievements'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Processes Explored */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <Flame className="w-8 h-8 text-orange-500" />
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {profile.processesExplored.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isArabic ? 'العمليات' : 'Processes'}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Countries List */}
      {profile.countriesList && profile.countriesList.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {isArabic ? 'الدول المكتشفة' : 'Countries Explored'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.countriesList.map((country) => (
                  <Badge key={country} variant="outline" className="px-3 py-1">
                    {profile.countriesFlags?.[country] && (
                      <span className="mr-1 text-lg">{profile.countriesFlags[country]}</span>
                    )}
                    {country}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Processes Explored */}
      {profile.processesExplored.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5" />
                {isArabic ? 'العمليات المكتشفة' : 'Processes Explored'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.processesExplored.map((process) => (
                  <Badge key={process} className="bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100">
                    {process}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tasting Notes */}
      {profile.tastingNotes.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                {isArabic ? 'ملاحظات التذوق' : 'Tasting Notes'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.tastingNotes.map((note, idx) => (
                  <Badge
                    key={`${note}-${idx}`}
                    className="bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100"
                  >
                    {note}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Achievements */}
      {profile.achievements.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                {isArabic ? 'الإنجازات' : 'Achievements'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.achievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 rounded-lg p-4 border border-yellow-200 dark:border-yellow-900"
                    variants={itemVariants}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-4xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {isArabic ? achievement.titleAr : achievement.titleEn}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {isArabic
                            ? achievement.descriptionAr
                            : achievement.descriptionEn}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {formatDate(achievement.unlockedDate)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Journey Timeline */}
      {profile.journeyTimeline.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {isArabic ? 'رحلة اكتشافك' : 'Your Journey'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.journeyTimeline.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    className="flex gap-4"
                    variants={itemVariants}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 dark:from-amber-900 dark:to-orange-900 flex items-center justify-center text-lg mb-2">
                        {event.icon}
                      </div>
                      {idx < profile.journeyTimeline.length - 1 && (
                        <div className="w-0.5 h-12 bg-gradient-to-b from-amber-200 to-orange-200 dark:from-amber-900 dark:to-orange-900" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {isArabic ? event.titleAr : event.titleEn}
                      </h4>
                      {event.descriptionEn && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {isArabic ? event.descriptionAr : event.descriptionEn}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {formatDate(event.date)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Member Stats */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        variants={itemVariants}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {isArabic ? 'تاريخ الانضمام' : 'Member Since'}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatDate(profile.joinDate)}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {isArabic ? 'إجمالي النقاط' : 'Total Points'}
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {profile.totalPoints.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Next Milestone */}
      {profile.nextMilestone && (
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                {isArabic
                  ? profile.nextMilestone.titleAr
                  : profile.nextMilestone.titleEn}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(profile.nextMilestone.progress / profile.nextMilestone.target) * 100}%`,
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {profile.nextMilestone.progress} / {profile.nextMilestone.target}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.round(
                      (profile.nextMilestone.progress / profile.nextMilestone.target) * 100
                    )}
                    %
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};
