import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Coffee, Trophy, Award, Flame, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import type { CoffeePassportProfile } from '../../services/coffeePassportService';

interface CoffeePassportCardProps {
  profile: CoffeePassportProfile;
  isArabic: boolean;
  onViewPassport?: () => void;
}

export const CoffeePassportCard: React.FC<CoffeePassportCardProps> = ({
  profile,
  isArabic,
  onViewPassport,
}) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  const latestDiscovery = profile.latestDiscovery;

  return (
    <motion.div
      className="w-full mb-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Main Passport Card */}
      <motion.div
        className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-lg border border-amber-200 dark:border-amber-800 p-4 shadow-md"
        variants={itemVariants}
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">
              {isArabic ? '☕ جواز القهوة' : '☕ Coffee Passport'}
            </h3>
            <span className="flex-shrink-0 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
              {profile.totalPoints} pts
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2">
            {/* Countries Explored */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-md p-2.5 text-center border border-amber-100 dark:border-amber-900 hover:shadow-md transition-shadow flex flex-col items-center justify-center min-h-20"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <Globe className="w-5 h-5 text-blue-500 mb-1" />
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                {profile.countriesExplored}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {isArabic ? 'الدول' : 'Countries'}
              </p>
            </motion.div>

            {/* Coffees Tried */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-md p-2.5 text-center border border-amber-100 dark:border-amber-900 hover:shadow-md transition-shadow flex flex-col items-center justify-center min-h-20"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <Coffee className="w-5 h-5 text-amber-600 mb-1" />
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                {profile.coffeesTried}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {isArabic ? 'القهوة' : 'Coffees'}
              </p>
            </motion.div>

            {/* Achievements */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-md p-2.5 text-center border border-amber-100 dark:border-amber-900 hover:shadow-md transition-shadow flex flex-col items-center justify-center min-h-20"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <Trophy className="w-5 h-5 text-yellow-500 mb-1" />
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                {profile.achievements.length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {isArabic ? 'الإنجازات' : 'Achieve.'}
              </p>
            </motion.div>

            {/* Processes */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-md p-2.5 text-center border border-amber-100 dark:border-amber-900 hover:shadow-md transition-shadow flex flex-col items-center justify-center min-h-20"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
            >
              <Flame className="w-5 h-5 text-orange-500 mb-1" />
              <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                {profile.processesExplored.length}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {isArabic ? 'العمليات' : 'Processes'}
              </p>
            </motion.div>
          </div>

          {/* Latest Discovery */}
          {latestDiscovery && (
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-lg p-3.5 border border-amber-100 dark:border-amber-900"
              variants={itemVariants}
            >
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2.5 uppercase tracking-wide">
                {isArabic ? 'آخر اكتشاف' : 'Latest discovery'}
              </p>
              <div className="flex items-start gap-3">
                {latestDiscovery.productImage && (
                  <img
                    src={latestDiscovery.productImage}
                    alt={latestDiscovery.nameEn}
                    className="w-14 h-14 rounded-md object-cover flex-shrink-0 border border-amber-200 dark:border-amber-700"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                    {isArabic ? latestDiscovery.nameAr : latestDiscovery.nameEn}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-lg">{latestDiscovery.originFlag}</span>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isArabic ? latestDiscovery.originAr : latestDiscovery.originEn}
                    </p>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1.5 line-clamp-1 font-medium">
                    {isArabic
                      ? latestDiscovery.tasteNotesAr.join(', ')
                      : latestDiscovery.tasteNotesEn.join(', ')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Next Milestone */}
          {profile.nextMilestone && (
            <motion.div
              className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-md p-3 border border-blue-200 dark:border-blue-900"
              variants={itemVariants}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                  {isArabic
                    ? profile.nextMilestone.titleAr
                    : profile.nextMilestone.titleEn}
                </p>
                <Award className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              </div>
              <div className="space-y-1.5">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(profile.nextMilestone.progress / profile.nextMilestone.target) * 100}%`,
                    }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {profile.nextMilestone.progress} / {profile.nextMilestone.target}
                </p>
              </div>
            </motion.div>
          )}

          {/* Action Button */}
          {onViewPassport && (
            <motion.button
              onClick={onViewPassport}
              className="w-full bg-gradient-to-r from-stone-800 to-stone-900 hover:from-stone-700 hover:to-stone-800 text-white font-semibold py-2.5 px-4 rounded-md flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg text-sm"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isArabic ? 'عرض جواز' : 'View Passport'}
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Inspirational Message */}
      <motion.p
        className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center italic"
        variants={itemVariants}
      >
        {isArabic
          ? '🌟 استكشف نكهات جديدة'
          : '🌟 Discover new flavors'}
      </motion.p>
    </motion.div>
  );
};
