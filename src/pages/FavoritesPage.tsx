import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../hooks/useApp';
import { useFavorites } from '../hooks/useFavorites';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Heart, 
  Eye, 
  Star, 
  Trash2,
  Coffee,
  Package
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Seo } from '../components/seo/Seo';
import { siteMetadata } from '../config/siteMetadata';

export const FavoritesPage: React.FC = () => {
  const { t, language } = useApp();
  const navigate = useNavigate();
  const { favorites, isLoading, removeFromFavorites } = useFavorites();

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <Seo
        title={language === 'ar' ? 'مفضلتي الخاصة' : 'My favorite coffees'}
        description={
          language === 'ar'
            ? 'تتبع منتجاتك المفضلة في سبيريت هب كافيه، هذه الصفحة مخصصة لك فقط.'
            : 'Keep a private list of your favorite Spirit Hub Cafe products.'
        }
        canonical={`${siteMetadata.baseUrl}/favorites`}
        noindex
        robots="noindex, nofollow"
      />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Heart className="h-8 w-8 text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">
              {t('favorites.title')}
            </h1>
          </div>
          <p className="text-gray-600">
            {t('favorites.description')}
          </p>
        </motion.div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-300 rounded-t-lg"></div>
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
            >
              <Card>
                <CardContent className="p-4 text-center">
                  <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-gray-900">{favorites.length}</h3>
                  <p className="text-gray-600">{t('favorites.totalItems')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Package className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    {favorites.filter(item => item.category === 'Coffee').length}
                  </h3>
                  <p className="text-gray-600">{t('favorites.coffeeItems')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    {favorites.length > 0 ? (favorites.reduce((sum, item) => sum + item.rating, 0) / favorites.length).toFixed(1) : '0.0'}
                  </h3>
                  <p className="text-gray-600">{t('favorites.avgRating')}</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Favorites Grid */}
            {favorites.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center py-12"
              >
                <Heart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {t('favorites.empty')}
                </h3>
                <p className="text-gray-500 mb-6">
                  {t('favorites.emptyDescription')}
                </p>
                <Button onClick={() => window.location.href = '/products'}>
                  <Coffee className="h-4 w-4 mr-2" />
                  {t('favorites.exploreCoffee')}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {favorites.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="group hover:shadow-lg transition-all duration-300 py-0">
                      <div className="relative overflow-hidden rounded-t-lg aspect-square">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = '/images/products/default-coffee.jpg';
                          }}
                        />
                        <Badge className="absolute top-2 left-2 bg-stone-700 text-white">
                          {item.category}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-500 hover:text-red-600"
                          onClick={() => removeFromFavorites(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-stone-700 transition-colors">
                            {item.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600">{item.rating}</span>
                          </div>
                        </div>
                        
                        <p className="text-2xl font-bold text-stone-700 mb-4">
                          ${item.price.toFixed(2)}
                        </p>
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => navigate(`/products/${item.id}`)}
                            className="flex-1 bg-stone-700 hover:bg-stone-800"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {t('products.viewDetails')}
                          </Button>
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-2">
                          {t('favorites.addedOn')} {new Date(item.addedDate).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
